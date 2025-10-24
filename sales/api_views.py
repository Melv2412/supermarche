from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count, Avg, Value, DecimalField
from datetime import datetime, timedelta
from django.db import transaction
from products.models import Product, StockMovement
from customers.models import LoyaltyTransaction
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
        total=Sum('montant_final'),
        pourcentage=Sum('montant_final') * 100.0 / Value(stats['chiffre_affaires'], output_field=DecimalField())
    )
    
    return Response({
        'stats': stats,
        'ventes_par_jour': list(ventes_par_jour),
        'ventes_par_categorie': ventes_par_categorie,
        'moyens_paiement': list(paiements)
    })


# ========== ONLINE CHECKOUT ==========

@api_view(['POST'])
@transaction.atomic
def online_checkout(request):
    """Traite un achat en ligne"""
    try:
        # Validation des données
        data = request.data.get('vente', {})
        items = data.get('items', [])
        # total envoyé par le client (pour information) mais on recalculera le total côté serveur
        posted_total = data.get('total', 0)
        calculated_total = 0

        if not items:
            return Response(
                {'error': 'Le panier est vide'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Préparer une caisse et un caissier par défaut (nécessaires pour la création)
        caisse = CashRegister.objects.filter(actif=True).first()
        if not caisse:
            # Créer une caisse web par défaut si aucune n'existe
            caisse = CashRegister.objects.create(numero_caisse='WEB', emplacement='Web', actif=True)

        # Chercher un caissier lié à l'utilisateur ou un caissier disponible
        caissier = None
        if hasattr(request.user, 'employee'):
            caissier = getattr(request.user, 'employee')
        else:
            from employees.models import Employee
            caissier = Employee.objects.filter(poste='caissier').first()

        if not caissier:
            return Response(
                {'error': 'Aucun caissier disponible. Créez au moins un employé avec le poste "caissier".'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Tenter d'identifier le client : d'abord via request.user, sinon via l'email fourni dans le payload
        id_client_obj = None
        if hasattr(request.user, 'client'):
            id_client_obj = request.user.client
        else:
            client_email = data.get('client_email') or request.data.get('client_email')
            if client_email:
                from customers.models import Client
                try:
                    id_client_obj = Client.objects.get(email=client_email)
                except Client.DoesNotExist:
                    id_client_obj = None

        # Créer la transaction initiale (montants mis à zéro, on mettra à jour après calcul)
        transaction = Transaction.objects.create(
            numero_ticket=f"WEB-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            statut='terminee',
            id_caisse=caisse,
            id_client=id_client_obj,
            id_caissier=caissier,
            montant_total=0,
            montant_final=0
        )

        # Traiter chaque article
        for item in items:
            # Normaliser les clés possibles
            prod_id = item.get('id') or item.get('id_produit') or item.get('product_id')
            qty_raw = item.get('quantity') or item.get('quantite') or item.get('qty')

            if prod_id is None:
                raise ValueError('Identifiant produit manquant pour un article')
            try:
                quantity = int(qty_raw)
            except Exception:
                raise ValueError(f'Quantité invalide pour le produit {prod_id}')

            # Récupérer le produit : d'abord par champ id_produit si présent, sinon fallback sur pk
            product = None
            try:
                product = Product.objects.get(id_produit=prod_id)
            except Exception:
                try:
                    product = Product.objects.get(pk=prod_id)
                except Product.DoesNotExist:
                    raise ValueError(f'Produit introuvable: {prod_id}')

            # Vérifier le stock
            if product.stock < quantity:
                raise ValueError(f'Stock insuffisant pour {product.nom}')

            # Créer la ligne de transaction
            line = TransactionLine.objects.create(
                id_transaction=transaction,
                id_produit=product,
                quantite=quantity,
                prix_unitaire=product.prix_unitaire,
                sous_total=product.prix_unitaire * quantity
            )

            # Mettre à jour le stock
            product.stock -= quantity
            product.save()

            # Créer le mouvement de stock
            StockMovement.objects.create(
                id_produit=product,
                type_mouvement='sortie',
                quantite=quantity,
                stock_avant=product.stock + quantity,
                stock_apres=product.stock,
                motif='Vente en ligne',
                reference=transaction.numero_ticket
            )

            calculated_total += line.sous_total

        # Mettre à jour le total calculé côté serveur
        transaction.montant_total = calculated_total
        transaction.montant_final = calculated_total
        transaction.statut = 'terminee'
        transaction.save()

        # Gérer les points de fidélité si client
        points = 0
        if transaction.id_client:
            points = int(calculated_total / 1000)  # 1 point par 1000 FCFA
            if points > 0:
                loyalty_card = transaction.id_client.carte_fidelite
                points_avant = loyalty_card.points
                loyalty_card.ajouter_points(points)

                LoyaltyTransaction.objects.create(
                    id_carte=loyalty_card,
                    type_transaction='gain',
                    points=points,
                    points_avant=points_avant,
                    points_apres=loyalty_card.points,
                    description='Achat en ligne',
                    reference_vente=transaction.numero_ticket
                )

        # Créer le paiement (ne pas utiliser de champ 'statut' qui n'existe pas sur le modèle Payment)
        payment = Payment.objects.create(
            id_transaction=transaction,
            montant=calculated_total,
            # Utiliser une valeur valide pour mode_paiement : 'especes', 'carte', 'mobile' ou 'cheque'
            mode_paiement='mobile',
            reference=None
        )

        return Response({
            'success': True,
            'transaction_id': transaction.id_transaction,
            'numero_ticket': transaction.numero_ticket,
            'montant': calculated_total,
            'points_gagnes': points if transaction.id_client else 0,
            'montant_client_envoye': posted_total
        }, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        # En développement, retourner l'erreur pour faciliter le debug
        return Response(
            {'error': 'Une erreur est survenue lors du traitement', 'detail': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
