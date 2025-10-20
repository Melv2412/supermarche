from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Supplier, PurchaseOrder, PurchaseOrderLine, Delivery
from .serializers import (
    SupplierSerializer, PurchaseOrderSerializer, PurchaseOrderListSerializer,
    PurchaseOrderLineSerializer, DeliverySerializer
)


# ========== SUPPLIERS ==========

@api_view(['GET', 'POST'])
def supplier_list(request):
    """Liste tous les fournisseurs ou crée un nouveau"""
    if request.method == 'GET':
        suppliers = Supplier.objects.filter(statut='actif')
        search = request.query_params.get('search', None)
        
        if search:
            suppliers = suppliers.filter(nom__icontains=search)
        
        serializer = SupplierSerializer(suppliers, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = SupplierSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def supplier_detail(request, pk):
    """Récupère, modifie ou supprime un fournisseur"""
    supplier = get_object_or_404(Supplier, pk=pk)
    
    if request.method == 'GET':
        serializer = SupplierSerializer(supplier)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = SupplierSerializer(supplier, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        supplier.statut = 'inactif'
        supplier.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ========== PURCHASE ORDERS ==========

@api_view(['GET', 'POST'])
def purchase_order_list(request):
    """Liste toutes les commandes ou crée une nouvelle"""
    if request.method == 'GET':
        orders = PurchaseOrder.objects.select_related('id_fournisseur')
        
        # Filtres
        statut = request.query_params.get('statut', None)
        supplier_id = request.query_params.get('supplier', None)
        
        if statut:
            orders = orders.filter(statut=statut)
        if supplier_id:
            orders = orders.filter(id_fournisseur=supplier_id)
        
        serializer = PurchaseOrderListSerializer(orders, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PurchaseOrderSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def purchase_order_detail(request, pk):
    """Récupère ou modifie une commande"""
    order = get_object_or_404(PurchaseOrder, pk=pk)
    
    if request.method == 'GET':
        serializer = PurchaseOrderSerializer(order)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = PurchaseOrderSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def purchase_order_add_line(request, pk):
    """Ajoute une ligne à une commande"""
    order = get_object_or_404(PurchaseOrder, pk=pk)
    
    if order.statut not in ['brouillon', 'envoyee']:
        return Response({'error': 'Impossible de modifier cette commande'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = PurchaseOrderLineSerializer(data=request.data)
    if serializer.is_valid():
        line = serializer.save(id_commande=order)
        
        # Recalculer le montant total de la commande
        order.montant_total = sum(l.sous_total for l in order.lignes.all())
        order.save()
        
        return Response(PurchaseOrderLineSerializer(line).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== DELIVERIES ==========

@api_view(['GET', 'POST'])
def delivery_list(request):
    """Liste toutes les livraisons ou crée une nouvelle"""
    if request.method == 'GET':
        deliveries = Delivery.objects.select_related('id_commande__id_fournisseur')
        
        # Filtres
        statut = request.query_params.get('statut', None)
        order_id = request.query_params.get('order', None)
        
        if statut:
            deliveries = deliveries.filter(statut=statut)
        if order_id:
            deliveries = deliveries.filter(id_commande=order_id)
        
        serializer = DeliverySerializer(deliveries, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = DeliverySerializer(data=request.data)
        if serializer.is_valid():
            delivery = serializer.save()
            
            # Mettre à jour le statut de la commande
            order = delivery.id_commande
            if delivery.statut == 'livree':
                order.statut = 'livree'
                order.date_livraison_reelle = delivery.date_livraison
                order.save()
                
                # Mettre à jour le stock pour chaque ligne
                from products.models import StockMovement
                for line in order.lignes.all():
                    product = line.id_produit
                    stock_avant = product.stock
                    product.stock += line.quantite
                    product.save()
                    
                    # Créer un mouvement de stock
                    StockMovement.objects.create(
                        id_produit=product,
                        type_mouvement='entree',
                        quantite=line.quantite,
                        stock_avant=stock_avant,
                        stock_apres=product.stock,
                        motif='Livraison fournisseur',
                        reference=order.numero_commande
                    )
            
            return Response(DeliverySerializer(delivery).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def delivery_detail(request, pk):
    """Récupère ou modifie une livraison"""
    delivery = get_object_or_404(Delivery, pk=pk)
    
    if request.method == 'GET':
        serializer = DeliverySerializer(delivery)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = DeliverySerializer(delivery, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
