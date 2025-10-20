from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Client, LoyaltyCard, LoyaltyTransaction, Complaint
from .serializers import (
    ClientSerializer, ClientDetailSerializer,
    LoyaltyCardSerializer, LoyaltyTransactionSerializer, ComplaintSerializer
)


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
