from django.db import models
from django.core.validators import MinValueValidator
from products.models import Product
from customers.models import Client, LoyaltyCard
from employees.models import Employee


class CashRegister(models.Model):
    """Modèle pour les caisses"""
    id_caisse = models.AutoField(primary_key=True)
    numero_caisse = models.CharField(max_length=20, unique=True)
    emplacement = models.CharField(max_length=100)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'caisses'
        verbose_name = 'Caisse'
        verbose_name_plural = 'Caisses'
        ordering = ['numero_caisse']
    
    def __str__(self):
        return f"Caisse {self.numero_caisse}"


class Transaction(models.Model):
    """Modèle pour les transactions de vente"""
    STATUT_CHOICES = [
        ('en_cours', 'En cours'),
        ('terminee', 'Terminée'),
        ('annulee', 'Annulée'),
        ('suspendue', 'Suspendue'),
    ]
    
    id_transaction = models.AutoField(primary_key=True)
    numero_ticket = models.CharField(max_length=50, unique=True)
    id_caisse = models.ForeignKey(
        CashRegister,
        on_delete=models.PROTECT,
        related_name='transactions'
    )
    id_client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    id_caissier = models.ForeignKey(
        Employee,
        on_delete=models.PROTECT,
        related_name='transactions'
    )
    
    date_transaction = models.DateTimeField(auto_now_add=True)
    montant_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    montant_remise = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    montant_final = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    # Points fidélité
    points_utilises = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    points_gagnes = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_cours')
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-date_transaction']
    
    def __str__(self):
        return f"Ticket {self.numero_ticket} - {self.montant_final} FCFA"
    
    def save(self, *args, **kwargs):
        # Calculer le montant final
        self.montant_final = self.montant_total - self.montant_remise
        super().save(*args, **kwargs)


class TransactionLine(models.Model):
    """Modèle pour les lignes de transaction"""
    id_ligne = models.AutoField(primary_key=True)
    id_transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    id_produit = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='lignes_vente'
    )
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    prix_promotion = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(0)]
    )
    sous_total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    remise_appliquee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    class Meta:
        db_table = 'lignes_transactions'
        verbose_name = 'Ligne de transaction'
        verbose_name_plural = 'Lignes de transaction'
    
    def __str__(self):
        return f"{self.id_produit.nom} x {self.quantite}"
    
    def save(self, *args, **kwargs):
        # Utiliser le prix promotion si disponible, sinon le prix normal
        prix = self.prix_promotion if self.prix_promotion else self.prix_unitaire
        self.sous_total = (prix * self.quantite) - self.remise_appliquee
        super().save(*args, **kwargs)


class Payment(models.Model):
    """Modèle pour les paiements"""
    MODE_CHOICES = [
        ('especes', 'Espèces'),
        ('carte', 'Carte bancaire'),
        ('mobile', 'Mobile Money'),
        ('cheque', 'Chèque'),
    ]
    
    id_paiement = models.AutoField(primary_key=True)
    id_transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='paiements'
    )
    mode_paiement = models.CharField(max_length=20, choices=MODE_CHOICES)
    montant = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    reference = models.CharField(max_length=100, blank=True, null=True)  # N° transaction carte/mobile
    date_paiement = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'paiements'
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']
    
    def __str__(self):
        return f"{self.get_mode_paiement_display()} - {self.montant} FCFA"
