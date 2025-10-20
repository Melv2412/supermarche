from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import models
from .models import Category, Product, StockMovement, Promotion
from .serializers import (
    CategorySerializer, ProductSerializer, ProductListSerializer,
    StockMovementSerializer, PromotionSerializer
)


# ========== CATEGORIES ==========

@api_view(['GET', 'POST'])
def category_list(request):
    """Liste toutes les catégories ou crée une nouvelle"""
    if request.method == 'GET':
        categories = Category.objects.filter(actif=True)
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def category_detail(request, pk):
    """Récupère, modifie ou supprime une catégorie"""
    category = get_object_or_404(Category, pk=pk)
    
    if request.method == 'GET':
        serializer = CategorySerializer(category)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        category.actif = False
        category.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ========== PRODUCTS ==========

@api_view(['GET', 'POST'])
def product_list(request):
    """Liste tous les produits ou crée un nouveau"""
    if request.method == 'GET':
        products = Product.objects.filter(actif=True).select_related('id_categorie')
        
        # Filtres optionnels
        category_id = request.query_params.get('category', None)
        search = request.query_params.get('search', None)
        
        if category_id:
            products = products.filter(id_categorie=category_id)
        if search:
            products = products.filter(nom__icontains=search)
        
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = ProductSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def product_detail(request, pk):
    """Récupère, modifie ou supprime un produit"""
    product = get_object_or_404(Product, pk=pk)
    
    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        product.actif = False
        product.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ========== STOCK ==========

@api_view(['GET'])
def stock_alerts(request):
    """Retourne les produits en alerte de stock"""
    products = Product.objects.filter(
        actif=True,
        stock__lte=models.F('seuil_reapprovisionnement')
    ).select_related('id_categorie')
    
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def stock_rupture(request):
    """Retourne les produits en rupture de stock"""
    products = Product.objects.filter(actif=True, stock=0).select_related('id_categorie')
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET', 'POST'])
def stock_movements(request):
    """Liste les mouvements de stock ou crée un nouveau"""
    if request.method == 'GET':
        product_id = request.query_params.get('product', None)
        movements = StockMovement.objects.select_related('id_produit')
        
        if product_id:
            movements = movements.filter(id_produit=product_id)
        
        movements = movements[:100]  # Limiter à 100 derniers
        serializer = StockMovementSerializer(movements, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = StockMovementSerializer(data=request.data)
        if serializer.is_valid():
            # Récupérer le produit
            product = serializer.validated_data['id_produit']
            stock_avant = product.stock
            quantite = serializer.validated_data['quantite']
            type_mouvement = serializer.validated_data['type_mouvement']
            
            # Calculer le nouveau stock
            if type_mouvement == 'entree':
                stock_apres = stock_avant + quantite
            elif type_mouvement == 'sortie':
                stock_apres = stock_avant - quantite
            else:  # ajustement ou retour
                stock_apres = quantite
            
            # Sauvegarder le mouvement
            movement = serializer.save(stock_avant=stock_avant, stock_apres=stock_apres)
            
            # Mettre à jour le stock du produit
            product.stock = stock_apres
            product.save()
            
            return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ========== PROMOTIONS ==========

@api_view(['GET', 'POST'])
def promotion_list(request):
    """Liste toutes les promotions ou crée une nouvelle"""
    if request.method == 'GET':
        promotions = Promotion.objects.filter(actif=True)
        serializer = PromotionSerializer(promotions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = PromotionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def promotion_detail(request, pk):
    """Récupère, modifie ou supprime une promotion"""
    promotion = get_object_or_404(Promotion, pk=pk)
    
    if request.method == 'GET':
        serializer = PromotionSerializer(promotion)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = PromotionSerializer(promotion, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        promotion.actif = False
        promotion.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
