from rest_framework import serializers
from .models import Client, LoyaltyCard, LoyaltyTransaction, Complaint


class ClientSerializer(serializers.ModelSerializer):
    """Serializer pour les clients"""
    nom_complet = serializers.CharField(read_only=True)
    
    class Meta:
        model = Client
        fields = '__all__'


class LoyaltyCardSerializer(serializers.ModelSerializer):
    """Serializer pour les cartes de fidélité"""
    client_nom = serializers.CharField(source='id_client.nom_complet', read_only=True)
    
    class Meta:
        model = LoyaltyCard
        fields = '__all__'
        read_only_fields = ['numero_carte', 'niveau']


class LoyaltyTransactionSerializer(serializers.ModelSerializer):
    """Serializer pour les transactions de fidélité"""
    numero_carte = serializers.CharField(source='id_carte.numero_carte', read_only=True)
    
    class Meta:
        model = LoyaltyTransaction
        fields = '__all__'
        read_only_fields = ['date_transaction']


class ClientDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour un client avec sa carte de fidélité"""
    carte_fidelite = LoyaltyCardSerializer(read_only=True)
    nom_complet = serializers.CharField(read_only=True)
    
    class Meta:
        model = Client
        fields = '__all__'


class ComplaintSerializer(serializers.ModelSerializer):
    """Serializer pour les réclamations"""
    client_nom = serializers.CharField(source='id_client.nom_complet', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    priorite_display = serializers.CharField(source='get_priorite_display', read_only=True)
    
    class Meta:
        model = Complaint
        fields = '__all__'
        read_only_fields = ['date_creation', 'date_resolution']
