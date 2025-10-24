from rest_framework import serializers
from .models import Category, Product, StockMovement, Promotion


class CategorySerializer(serializers.ModelSerializer):
    """Serializer pour les catégories"""
    nb_produits = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'
    
    def get_nb_produits(self, obj):
        """Retourne le nombre de produits dans cette catégorie"""
        return obj.produits.count()


class ProductSerializer(serializers.ModelSerializer):
    """Serializer pour les produits"""
    categorie_nom = serializers.CharField(source='id_categorie.nom', read_only=True)
    en_rupture = serializers.BooleanField(read_only=True)
    alerte_stock = serializers.BooleanField(read_only=True)
    marge = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Product
        fields = '__all__'


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des produits"""
    categorie_nom = serializers.CharField(source='id_categorie.nom', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id_produit', 'nom', 'code_barre', 'prix_unitaire', 'prix_achat',
            'stock', 'id_categorie', 'categorie_nom', 'actif',
            'est_perissable', 'seuil_reapprovisionnement'
        ]


class StockMovementSerializer(serializers.ModelSerializer):
    """Serializer pour les mouvements de stock"""
    produit_nom = serializers.CharField(source='id_produit.nom', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'
        read_only_fields = ['stock_avant', 'stock_apres', 'date_mouvement']


class PromotionSerializer(serializers.ModelSerializer):
    """Serializer pour les promotions"""
    type_promotion_display = serializers.CharField(source='get_type_promotion_display', read_only=True)
    categories = serializers.SerializerMethodField()
    
    class Meta:
        model = Promotion
        fields = '__all__'
    
    def get_categories(self, obj):
        """Retourne la liste des noms des catégories concernées par la promotion"""
        return [cat.nom for cat in obj.categories.all()]
