from django.db import models
from django.core.validators import MinValueValidator


class Category(models.Model):
    """Modèle pour les catégories de produits"""
    id_categorie = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'categories'
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['nom']
    
    def __str__(self):
        return self.nom


class Product(models.Model):
    """Modèle pour les produits"""
    id_produit = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    code_barre = models.CharField(max_length=50, unique=True, blank=True, null=True)
    
    # Prix
    prix_unitaire = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    prix_achat = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        blank=True,
        null=True
    )
    
    # Stock
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seuil_reapprovisionnement = models.IntegerField(
        default=10,
        validators=[MinValueValidator(0)]
    )
    
    # Catégorie (relation)
    id_categorie = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='produits'
    )
    
    # Caractéristiques
    est_perissable = models.BooleanField(default=False)
    date_expiration = models.DateField(blank=True, null=True)
    unite_mesure = models.CharField(max_length=20, default='unité')
    
    # Image
    image = models.ImageField(upload_to='produits/', blank=True, null=True)
    
    # Statut
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'produits'
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'
        ordering = ['nom']
    
    def __str__(self):
        return self.nom
    
    @property
    def en_rupture(self):
        """Vérifie si le produit est en rupture de stock"""
        return self.stock == 0
    
    @property
    def alerte_stock(self):
        """Vérifie si le stock est en dessous du seuil"""
        return self.stock <= self.seuil_reapprovisionnement
    
    @property
    def marge(self):
        """Calcule la marge si prix_achat existe"""
        if self.prix_achat:
            return self.prix_unitaire - self.prix_achat
        return None


class StockMovement(models.Model):
    """Modèle pour les mouvements de stock"""
    TYPE_CHOICES = [
        ('entree', 'Entrée'),
        ('sortie', 'Sortie'),
        ('ajustement', 'Ajustement'),
        ('retour', 'Retour'),
    ]
    
    id_mouvement = models.AutoField(primary_key=True)
    id_produit = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='mouvements'
    )
    type_mouvement = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    stock_avant = models.IntegerField()
    stock_apres = models.IntegerField()
    motif = models.CharField(max_length=200, blank=True, null=True)
    reference = models.CharField(max_length=100, blank=True, null=True)  # Ex: N° commande, N° vente
    date_mouvement = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'mouvements_stock'
        verbose_name = 'Mouvement de stock'
        verbose_name_plural = 'Mouvements de stock'
        ordering = ['-date_mouvement']
    
    def __str__(self):
        return f"{self.type_mouvement} - {self.id_produit.nom} ({self.quantite})"


class Promotion(models.Model):
    """Modèle pour les promotions"""
    id_promotion = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=200)
    description = models.TextField()
    type_promotion = models.CharField(
        max_length=20,
        choices=[
            ('pourcentage', 'Pourcentage'),
            ('montant_fixe', 'Montant fixe'),
            ('2_pour_1', '2 pour 1'),
            ('gratuit', 'Produit gratuit'),
        ]
    )
    valeur = models.DecimalField(max_digits=10, decimal_places=2)  # % ou montant
    date_debut = models.DateField()
    date_fin = models.DateField()
    actif = models.BooleanField(default=True)
    
    # Produits concernés
    produits = models.ManyToManyField(Product, related_name='promotions', blank=True)
    categories = models.ManyToManyField(Category, related_name='promotions', blank=True)
    
    class Meta:
        db_table = 'promotions'
        verbose_name = 'Promotion'
        verbose_name_plural = 'Promotions'
        ordering = ['-date_debut']
    
    def __str__(self):
        return f"{self.nom} ({self.type_promotion})"
