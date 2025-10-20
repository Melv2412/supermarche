from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Avg
from datetime import datetime, timedelta
from .models import CashRegister, Transaction, TransactionLine, Payment
from .serializers import (
    CashRegisterSerializer, TransactionSerializer, TransactionListSerializer,
    TransactionCreateSerializer, TransactionLineSerializer, PaymentSerializer
)


# ========== CASH REGISTERS ==========

@api_view(['GET', 'POST'])
def cash_register_list(request):
    """Liste toutes les caisses ou crée une nouvelle"""
    if request.method == 'GET':
        registers = CashRegister.objects.filter(actif=True)
        serializer = CashRegisterSerializer(registers, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CashRegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== TRANSACTIONS ==========

@api_view(['GET', 'POST'])
def transaction_list(request):
    """Liste toutes les transactions ou crée une nouvelle"""
    if request.method == 'GET':
        transactions = Transaction.objects.select_related(
            'id_caisse', 'id_client', 'id_caissier'
        )
        
        # Filtres
        statut = request.query_params.get('statut', None)
        caisse_id = request.query_params.get('caisse', None)
        date_debut = request.query_params.get('date_debut', None)
        date_fin = request.query_params.get('date_fin', None)
        
        if statut:
            transactions = transactions.filter(statut=statut)
        if caisse_id:
            transactions = transactions.filter(id_caisse=caisse_id)
        if date_debut:
            transactions = transactions.filter(date_transaction__gte=date_debut)
        if date_fin:
            transactions = transactions.filter(date_transaction__lte=date_fin)
        
        transactions = transactions[:100]  # Limiter à 100
        serializer = TransactionListSerializer(transactions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = TransactionCreateSerializer(data=request.data)
        if serializer.is_valid():
            transaction = serializer.save()
            
            # Mettre à jour le stock pour chaque ligne
            from products.models import StockMovement
            for ligne in transaction.lignes.all():
                product = ligne.id_produit
                stock_avant = product.stock
                product.stock -= ligne.quantite
                product.save()
                
                # Créer un mouvement de stock
                StockMovement.objects.create(
                    id_produit=product,
                    type_mouvement='sortie',
                    quantite=ligne.quantite,
                    stock_avant=stock_avant,
                    stock_apres=product.stock,
                    motif='Vente',
                    reference=transaction.numero_ticket
                )
            
            # Gérer les points de fidélité si client
            if transaction.id_client and transaction.points_gagnes > 0:
                from customers.models import LoyaltyTransaction
                loyalty_card = transaction.id_client.carte_fidelite
                points_avant = loyalty_card.points
                loyalty_card.ajouter_points(transaction.points_gagnes)
                
                LoyaltyTransaction.objects.create(
                    id_carte=loyalty_card,
                    type_transaction='gain',
                    points=transaction.points_gagnes,
                    points_avant=points_avant,
                    points_apres=loyalty_card.points,
                    description='Achat',
                    reference_vente=transaction.numero_ticket
                )
            
            return Response(TransactionSerializer(transaction).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def transaction_detail(request, pk):
    """Récupère ou modifie une transaction"""
    transaction = get_object_or_404(Transaction, pk=pk)
    
    if request.method == 'GET':
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = TransactionSerializer(transaction, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== DASHBOARD CAISSE ==========

@api_view(['GET'])
def cashier_dashboard(request):
    """Retourne les statistiques pour le dashboard caisse"""
    caisse_id = request.query_params.get('caisse', None)
    
    # Aujourd'hui
    today = datetime.now().date()
    transactions_today = Transaction.objects.filter(
        date_transaction__date=today,
        statut='terminee'
    )
    
    if caisse_id:
        transactions_today = transactions_today.filter(id_caisse=caisse_id)
    
    # Statistiques
    nb_transactions = transactions_today.count()
    total_ventes = transactions_today.aggregate(Sum('montant_final'))['montant_final__sum'] or 0
    panier_moyen = transactions_today.aggregate(Avg('montant_final'))['montant_final__avg'] or 0
    
    # Répartition par mode de paiement
    paiements = Payment.objects.filter(
        id_transaction__in=transactions_today
    ).values('mode_paiement').annotate(
        total=Sum('montant'),
        count=Count('id_paiement')
    )
    
    return Response({
        'nb_transactions': nb_transactions,
        'total_ventes': float(total_ventes),
        'panier_moyen': float(panier_moyen),
        'paiements': list(paiements)
    })


# ========== REPORTING ==========

@api_view(['GET'])
def sales_report(request):
    """Génère un rapport de ventes"""
    periode = request.query_params.get('periode', '30')  # jours
    
    date_debut = datetime.now() - timedelta(days=int(periode))
    
    transactions = Transaction.objects.filter(
        date_transaction__gte=date_debut,
        statut='terminee'
    )
    
    # Statistiques globales
    stats = {
        'nb_transactions': transactions.count(),
        'chiffre_affaires': float(transactions.aggregate(Sum('montant_final'))['montant_final__sum'] or 0),
        'montant_remises': float(transactions.aggregate(Sum('montant_remise'))['montant_remise__sum'] or 0),
        'panier_moyen': float(transactions.aggregate(Avg('montant_final'))['montant_final__avg'] or 0),
    }
    
    # Ventes par jour
    from django.db.models.functions import TruncDate
    ventes_par_jour = transactions.annotate(
        jour=TruncDate('date_transaction')
    ).values('jour').annotate(
        total=Sum('montant_final'),
        nb=Count('id_transaction')
    ).order_by('jour')
    
    # Ventes par catégorie
    from products.models import Product
    lignes = TransactionLine.objects.filter(
        id_transaction__in=transactions
    ).select_related('id_produit__id_categorie')
    
    ventes_par_categorie = {}
    for ligne in lignes:
        cat_nom = ligne.id_produit.id_categorie.nom if ligne.id_produit.id_categorie else 'Non définie'
        if cat_nom not in ventes_par_categorie:
            ventes_par_categorie[cat_nom] = 0
        ventes_par_categorie[cat_nom] += float(ligne.sous_total)
    
    # Moyens de paiement
    paiements = Payment.objects.filter(
        id_transaction__in=transactions
    ).values('mode_paiement').annotate(
        total=Sum('montant'),
        pourcentage=Sum('montant') * 100.0 / stats['chiffre_affaires'] if stats['chiffre_affaires'] > 0 else 0
    )
    
    return Response({
        'stats': stats,
        'ventes_par_jour': list(ventes_par_jour),
        'ventes_par_categorie': ventes_par_categorie,
        'moyens_paiement': list(paiements)
    })
