from rest_framework import serializers
from .models import Supplier, PurchaseOrder, PurchaseOrderLine, Delivery


class SupplierSerializer(serializers.ModelSerializer):
    """Serializer pour les fournisseurs"""
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Supplier
        fields = '__all__'


class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    """Serializer pour les lignes de commande"""
    produit_nom = serializers.CharField(source='id_produit.nom', read_only=True)
    
    class Meta:
        model = PurchaseOrderLine
        fields = '__all__'
        read_only_fields = ['sous_total']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    """Serializer pour les commandes fournisseurs"""
    fournisseur_nom = serializers.CharField(source='id_fournisseur.nom', read_only=True)
    lignes = PurchaseOrderLineSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = '__all__'
        read_only_fields = ['date_commande']


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des commandes"""
    fournisseur_nom = serializers.CharField(source='id_fournisseur.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = PurchaseOrder
        fields = [
            'id_commande', 'numero_commande', 'id_fournisseur', 'fournisseur_nom',
            'date_commande', 'date_livraison_prevue', 'montant_total', 'statut', 'statut_display'
        ]


class DeliverySerializer(serializers.ModelSerializer):
    """Serializer pour les livraisons"""
    commande_numero = serializers.CharField(source='id_commande.numero_commande', read_only=True)
    fournisseur_nom = serializers.CharField(source='id_commande.id_fournisseur.nom', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Delivery
        fields = '__all__'
        read_only_fields = ['date_livraison']
