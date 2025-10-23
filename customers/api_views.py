from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Client, LoyaltyCard, LoyaltyTransaction, Complaint
from .serializers import (
    ClientSerializer, ClientDetailSerializer,
    LoyaltyCardSerializer, LoyaltyTransactionSerializer, ComplaintSerializer
)


@api_view(['POST'])
def identify_client(request):
    """Identifie un client par son email"""
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        client = Client.objects.get(email=email)
        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)
    except Client.DoesNotExist:
        return Response({'error': 'Client non trouvé'}, status=status.HTTP_404_NOT_FOUND)


# ========== CLIENTS ==========

@api_view(['GET', 'POST'])
def client_list(request):
    """Liste tous les clients ou crée un nouveau"""
    if request.method == 'GET':
        clients = Client.objects.filter(actif=True)
        search = request.query_params.get('search', None)
        
        if search:
            clients = clients.filter(nom__icontains=search) | clients.filter(email__icontains=search)
        
        serializer = ClientSerializer(clients, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ClientSerializer(data=request.data)
        if serializer.is_valid():
            client = serializer.save()
            
            # Créer automatiquement une carte de fidélité
            LoyaltyCard.objects.create(id_client=client)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def client_detail(request, pk):
    """Récupère, modifie ou supprime un client"""
    client = get_object_or_404(Client, pk=pk)
    
    if request.method == 'GET':
        serializer = ClientDetailSerializer(client)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ClientSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        client.actif = False
        client.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ========== LOYALTY ==========

@api_view(['GET'])
def client_loyalty(request, pk):
    """Récupère les informations de fidélité d'un client"""
    client = get_object_or_404(Client, pk=pk)
    
    try:
        loyalty_card = client.carte_fidelite
        card_data = LoyaltyCardSerializer(loyalty_card).data
        
        # Récupérer les dernières transactions de fidélité
        transactions = loyalty_card.transactions.all()[:10]
        transactions_data = LoyaltyTransactionSerializer(transactions, many=True).data
        
        return Response({
            'carte': card_data,
            'transactions': transactions_data
        })
    except LoyaltyCard.DoesNotExist:
        return Response({'error': 'Carte de fidélité non trouvée'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def loyalty_add_points(request, pk):
    """Ajoute des points à une carte de fidélité"""
    client = get_object_or_404(Client, pk=pk)
    
    try:
        loyalty_card = client.carte_fidelite
        points = request.data.get('points', 0)
        description = request.data.get('description', 'Achat')
        reference = request.data.get('reference', None)
        
        if points <= 0:
            return Response({'error': 'Le nombre de points doit être positif'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Enregistrer la transaction
        points_avant = loyalty_card.points
        loyalty_card.ajouter_points(points)
        
        LoyaltyTransaction.objects.create(
            id_carte=loyalty_card,
            type_transaction='gain',
            points=points,
            points_avant=points_avant,
            points_apres=loyalty_card.points,
            description=description,
            reference_vente=reference
        )
        
        return Response(LoyaltyCardSerializer(loyalty_card).data)
    except LoyaltyCard.DoesNotExist:
        return Response({'error': 'Carte de fidélité non trouvée'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
def loyalty_use_points(request, pk):
    """Utilise des points d'une carte de fidélité"""
    client = get_object_or_404(Client, pk=pk)
    
    try:
        loyalty_card = client.carte_fidelite
        points = request.data.get('points', 0)
        description = request.data.get('description', 'Utilisation de points')
        
        if points <= 0:
            return Response({'error': 'Le nombre de points doit être positif'}, status=status.HTTP_400_BAD_REQUEST)
        
        points_avant = loyalty_card.points
        
        if loyalty_card.retirer_points(points):
            LoyaltyTransaction.objects.create(
                id_carte=loyalty_card,
                type_transaction='utilisation',
                points=-points,
                points_avant=points_avant,
                points_apres=loyalty_card.points,
                description=description
            )
            return Response(LoyaltyCardSerializer(loyalty_card).data)
        else:
            return Response({'error': 'Points insuffisants'}, status=status.HTTP_400_BAD_REQUEST)
    except LoyaltyCard.DoesNotExist:
        return Response({'error': 'Carte de fidélité non trouvée'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def client_transactions(request, pk):
    """Récupère l'historique des transactions d'un client"""
    client = get_object_or_404(Client, pk=pk)
    
    # Import ici pour éviter les imports circulaires
    from sales.models import Transaction
    from sales.serializers import TransactionListSerializer
    
    transactions = Transaction.objects.filter(id_client=client).order_by('-date_transaction')[:20]
    serializer = TransactionListSerializer(transactions, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def client_stats(request, pk):
    """Récupère les statistiques d'un client"""
    client = get_object_or_404(Client, pk=pk)
    
    # Import ici pour éviter les imports circulaires
    from sales.models import Transaction
    from django.db.models import Sum, Count
    from django.utils import timezone
    from datetime import timedelta
    
    # Récupérer la carte de fidélité
    try:
        loyalty_card = client.carte_fidelite
        points = loyalty_card.points
        niveau = loyalty_card.get_niveau_display()
    except LoyaltyCard.DoesNotExist:
        points = 0
        niveau = 'Bronze'
    
    # Calculer les statistiques du mois en cours
    debut_mois = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions_mois = Transaction.objects.filter(
        id_client=client,
        date_transaction__gte=debut_mois,
        statut='terminee'
    )
    
    achats_mois = transactions_mois.count()
    depenses_mois = transactions_mois.aggregate(total=Sum('montant_total'))['total'] or 0
    
    # Récupérer les dernières transactions
    dernieres_transactions = Transaction.objects.filter(
        id_client=client,
        statut='terminee'
    ).order_by('-date_transaction')[:5]
    
    transactions_data = []
    for trans in dernieres_transactions:
        transactions_data.append({
            'date': trans.date_transaction.strftime('%d/%m/%Y'),
            'montant': float(trans.montant_total),
            'points': trans.points_gagnes,
            'numero_ticket': trans.numero_ticket
        })
    
    # Calculer les économies (estimation basée sur les points)
    economies = points * 10  # 1 point = 10 FCFA d'économie potentielle
    
    return Response({
        'client': {
            'id': client.id_client,
            'nom': client.nom_complet,
            'email': client.email
        },
        'fidelite': {
            'points': points,
            'niveau': niveau
        },
        'stats_mois': {
            'achats': achats_mois,
            'depenses': float(depenses_mois),
            'economies': economies
        },
        'dernieres_transactions': transactions_data
    })


@api_view(['GET'])
def my_stats(request):
    """Récupère les statistiques du client connecté basé sur son email"""
    # Récupérer l'email depuis le header ou localStorage
    user_email = request.GET.get('email')
    
    if not user_email:
        return Response({'error': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        client = Client.objects.get(email=user_email)
    except Client.DoesNotExist:
        # Créer automatiquement un profil client si l'utilisateur existe
        from security.models import User
        try:
            user = User.objects.get(email=user_email)
            
            # Créer le profil client
            client = Client.objects.create(
                email=user.email,
                nom=user.nom,
                prenom=user.prenom,
                telephone=user.telephone or '',
                actif=True
            )
            
            # Créer une carte de fidélité
            LoyaltyCard.objects.create(id_client=client)
            
        except User.DoesNotExist:
            return Response({'error': 'Client non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    # Import ici pour éviter les imports circulaires
    from sales.models import Transaction
    from django.db.models import Sum
    from django.utils import timezone
    
    # Récupérer la carte de fidélité
    try:
        loyalty_card = client.carte_fidelite
        points = loyalty_card.points
        niveau = loyalty_card.get_niveau_display()
    except LoyaltyCard.DoesNotExist:
        points = 0
        niveau = 'Bronze'
    
    # Calculer les statistiques du mois en cours
    debut_mois = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    transactions_mois = Transaction.objects.filter(
        id_client=client,
        date_transaction__gte=debut_mois,
        statut='terminee'
    )
    
    achats_mois = transactions_mois.count()
    depenses_mois = transactions_mois.aggregate(total=Sum('montant_total'))['total'] or 0
    
    # Récupérer les dernières transactions
    dernieres_transactions = Transaction.objects.filter(
        id_client=client,
        statut='terminee'
    ).order_by('-date_transaction')[:5]
    
    transactions_data = []
    for trans in dernieres_transactions:
        transactions_data.append({
            'date': trans.date_transaction.strftime('%d/%m/%Y'),
            'montant': float(trans.montant_total),
            'points': trans.points_gagnes,
            'numero_ticket': trans.numero_ticket
        })
    
    # Calculer les économies (estimation basée sur les points)
    economies = points * 10  # 1 point = 10 FCFA d'économie potentielle
    
    return Response({
        'client': {
            'id': client.id_client,
            'nom': client.nom_complet,
            'email': client.email
        },
        'fidelite': {
            'points': points,
            'niveau': niveau
        },
        'stats_mois': {
            'achats': achats_mois,
            'depenses': float(depenses_mois),
            'economies': economies
        },
        'dernieres_transactions': transactions_data
    })


    @api_view(['POST'])
    def identify_client(request):
        """Find or create a client by email and return basic info.
        Used by the frontend to ensure transactions are linked to a client.
        """
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email requis'}, status=status.HTTP_400_BAD_REQUEST)

        # Basic validation
        if '@' not in email:
            return Response({'error': 'Email invalide'}, status=status.HTTP_400_BAD_REQUEST)

        from django.db import transaction as dj_transaction
        from customers.models import Client, LoyaltyCard

        try:
            client = Client.objects.filter(email=email).first()
            created = False
            if not client:
                # Create a minimal client profile
                with dj_transaction.atomic():
                    name_part = email.split('@')[0]
                    client = Client.objects.create(
                        nom=name_part,
                        prenom='',
                        email=email,
                        telephone='',
                        actif=True
                    )
                    LoyaltyCard.objects.create(id_client=client)
                    created = True

            return Response({
                'id': client.id_client,
                'email': client.email,
                'nom': client.nom,
                'created': created
            })
        except Exception as e:
            return Response({'error': 'Impossible de créer/recuperer le client', 'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ========== COMPLAINTS ==========

@api_view(['GET', 'POST'])
def complaint_list(request):
    """Liste toutes les réclamations ou crée une nouvelle"""
    if request.method == 'GET':
        complaints = Complaint.objects.select_related('id_client')
        
        # Filtres
        statut = request.query_params.get('statut', None)
        client_id = request.query_params.get('client', None)
        
        if statut:
            complaints = complaints.filter(statut=statut)
        if client_id:
            complaints = complaints.filter(id_client=client_id)
        
        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ComplaintSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def complaint_detail(request, pk):
    """Récupère ou modifie une réclamation"""
    complaint = get_object_or_404(Complaint, pk=pk)
    
    if request.method == 'GET':
        serializer = ComplaintSerializer(complaint)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ComplaintSerializer(complaint, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def complaint_resolve(request, pk):
    """Résout une réclamation"""
    complaint = get_object_or_404(Complaint, pk=pk)
    
    from django.utils import timezone
    complaint.statut = 'resolue'
    complaint.date_resolution = timezone.now()
    complaint.responsable = request.data.get('responsable', 'Service client')
    complaint.reponse = request.data.get('reponse', '')
    complaint.save()
    
    serializer = ComplaintSerializer(complaint)
    return Response(serializer.data)
