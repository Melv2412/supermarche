from rest_framework import serializers
from .models import CashRegister, Transaction, TransactionLine, Payment


class CashRegisterSerializer(serializers.ModelSerializer):
    """Serializer pour les caisses"""
    
    class Meta:
        model = CashRegister
        fields = '__all__'


class TransactionLineSerializer(serializers.ModelSerializer):
    """Serializer pour les lignes de transaction"""
    produit_nom = serializers.CharField(source='id_produit.nom', read_only=True)
    
    class Meta:
        model = TransactionLine
        fields = '__all__'
        read_only_fields = ['sous_total']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer pour les paiements"""
    mode_paiement_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['date_paiement']


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer pour les transactions"""
    caisse_numero = serializers.CharField(source='id_caisse.numero_caisse', read_only=True)
    client_nom = serializers.CharField(source='id_client.nom_complet', read_only=True)
    caissier_nom = serializers.CharField(source='id_caissier.nom_complet', read_only=True)
    lignes = TransactionLineSerializer(many=True, read_only=True)
    paiements = PaymentSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['date_transaction', 'montant_final']


class TransactionListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des transactions"""
    caisse_numero = serializers.CharField(source='id_caisse.numero_caisse', read_only=True)
    client_nom = serializers.CharField(source='id_client.nom_complet', read_only=True)
    caissier_nom = serializers.CharField(source='id_caissier.nom_complet', read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    
    class Meta:
        model = Transaction
        fields = [
            'id_transaction', 'numero_ticket', 'date_transaction',
            'caisse_numero', 'client_nom', 'caissier_nom',
            'montant_total', 'montant_remise', 'montant_final',
            'statut', 'statut_display'
        ]


class TransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer une transaction avec ses lignes et paiements"""
    lignes = TransactionLineSerializer(many=True)
    paiements = PaymentSerializer(many=True)
    
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['date_transaction', 'montant_final']
    
    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        paiements_data = validated_data.pop('paiements')
        
        # Créer la transaction
        transaction = Transaction.objects.create(**validated_data)
        
        # Créer les lignes
        for ligne_data in lignes_data:
            TransactionLine.objects.create(id_transaction=transaction, **ligne_data)
        
        # Créer les paiements
        for paiement_data in paiements_data:
            Payment.objects.create(id_transaction=transaction, **paiement_data)
        
        return transaction
