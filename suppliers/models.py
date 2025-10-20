from django.db import models
from django.core.validators import MinValueValidator, EmailValidator
from products.models import Product


class Supplier(models.Model):
    """Modèle pour les fournisseurs"""
    id_fournisseur = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=200)
    email = models.EmailField(validators=[EmailValidator()])
    telephone = models.CharField(max_length=20)
    adresse = models.TextField()
    ville = models.CharField(max_length=100)
    pays = models.CharField(max_length=100, default='Côte d\'Ivoire')
    
    # Conditions commerciales
    delai_livraison_jours = models.IntegerField(validators=[MinValueValidator(0)])
    montant_commande_min = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    conditions_paiement = models.CharField(max_length=100)
    
    # Statistiques
    nb_commandes_total = models.IntegerField(default=0)
    montant_total_achats = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    
    statut = models.CharField(
        max_length=20,
        choices=[('actif', 'Actif'), ('inactif', 'Inactif')],
        default='actif'
    )
    notes = models.TextField(blank=True, null=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'fournisseurs'
        verbose_name = 'Fournisseur'
        verbose_name_plural = 'Fournisseurs'
        ordering = ['nom']
    
    def __str__(self):
        return self.nom


class PurchaseOrder(models.Model):
    """Modèle pour les commandes fournisseurs"""
    STATUT_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('envoyee', 'Envoyée'),
        ('confirmee', 'Confirmée'),
        ('en_cours', 'En cours de livraison'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
    ]
    
    id_commande = models.AutoField(primary_key=True)
    numero_commande = models.CharField(max_length=50, unique=True)
    id_fournisseur = models.ForeignKey(
        Supplier,
        on_delete=models.PROTECT,
        related_name='commandes'
    )
    date_commande = models.DateTimeField(auto_now_add=True)
    date_livraison_prevue = models.DateField()
    date_livraison_reelle = models.DateField(blank=True, null=True)
    
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='brouillon')
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'commandes_fournisseurs'
        verbose_name = 'Commande fournisseur'
        verbose_name_plural = 'Commandes fournisseurs'
        ordering = ['-date_commande']
    
    def __str__(self):
        return f"{self.numero_commande} - {self.id_fournisseur.nom}"


class PurchaseOrderLine(models.Model):
    """Modèle pour les lignes de commande fournisseur"""
    id_ligne = models.AutoField(primary_key=True)
    id_commande = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    id_produit = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='lignes_commande_fournisseur'
    )
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    sous_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    
    class Meta:
        db_table = 'lignes_commandes_fournisseurs'
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'
    
    def __str__(self):
        return f"{self.id_produit.nom} x {self.quantite}"
    
    def save(self, *args, **kwargs):
        # Calculer automatiquement le sous-total
        self.sous_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)


class Delivery(models.Model):
    """Modèle pour les livraisons"""
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('en_cours', 'En cours'),
        ('livree', 'Livrée'),
        ('partielle', 'Livraison partielle'),
        ('probleme', 'Problème'),
    ]
    
    id_livraison = models.AutoField(primary_key=True)
    id_commande = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='livraisons'
    )
    numero_livraison = models.CharField(max_length=50, unique=True)
    date_livraison = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='en_attente')
    notes = models.TextField(blank=True, null=True)
    receptionnaire = models.CharField(max_length=100)
    
    class Meta:
        db_table = 'livraisons'
        verbose_name = 'Livraison'
        verbose_name_plural = 'Livraisons'
        ordering = ['-date_livraison']
    
    def __str__(self):
        return f"Livraison {self.numero_livraison} - {self.id_commande.numero_commande}"
