from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from products.models import Product

class StockItem(models.Model):
    """Modèle pour gérer le stock d'un produit"""
    produit = models.OneToOneField(
        Product, 
        on_delete=models.CASCADE,
        related_name='inventory_stock'  # Changé de 'stock' à 'inventory_stock' pour éviter le conflit
    )
    quantite = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    seuil_alerte = models.IntegerField(default=10, validators=[MinValueValidator(1)])
    emplacement = models.CharField(max_length=100, blank=True, null=True)
    derniere_maj = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_stocks'  # Changé pour plus de cohérence
        verbose_name = 'Stock'
        verbose_name_plural = 'Stocks'
    
    def __str__(self):
        return f"Stock de {self.produit.nom}"
    
    @property
    def en_rupture(self):
        return self.quantite == 0
    
    @property
    def stock_faible(self):
        return 0 < self.quantite <= self.seuil_alerte
    
    def ajuster_stock(self, quantite, raison, reference=None):
        """Ajuster le stock et créer une entrée dans l'historique"""
        ancienne_quantite = self.quantite
        self.quantite += quantite
        self.save()
        
        MouvementStock.objects.create(
            stock=self,
            quantite=quantite,
            ancienne_quantite=ancienne_quantite,
            nouvelle_quantite=self.quantite,
            raison=raison,
            reference=reference
        )

class MouvementStock(models.Model):
    """Modèle pour tracer les mouvements de stock"""
    RAISONS = [
        ('reception', 'Réception'),
        ('vente', 'Vente'),
        ('ajustement', 'Ajustement'),
        ('retour', 'Retour'),
        ('perte', 'Perte/Casse'),
        ('inventaire', 'Inventaire'),
    ]
    
    stock = models.ForeignKey(
        StockItem,
        on_delete=models.CASCADE,
        related_name='mouvements'
    )
    date = models.DateTimeField(auto_now_add=True)
    quantite = models.IntegerField()  # Peut être négatif pour les sorties
    ancienne_quantite = models.IntegerField()
    nouvelle_quantite = models.IntegerField()
    raison = models.CharField(max_length=20, choices=RAISONS)
    reference = models.CharField(max_length=100, blank=True, null=True)  # Référence de commande/facture
    commentaire = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'inventory_mouvements_stock'  # Changé pour éviter le conflit
        verbose_name = 'Mouvement de stock'
        verbose_name_plural = 'Mouvements de stock'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.get_raison_display()} - {self.stock.produit.nom} ({self.quantite})"

class Inventaire(models.Model):
    """Modèle pour les sessions d'inventaire"""
    STATUTS = [
        ('en_cours', 'En cours'),
        ('termine', 'Terminé'),
        ('annule', 'Annulé'),
    ]
    
    date_debut = models.DateTimeField(auto_now_add=True)
    date_fin = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUTS, default='en_cours')
    commentaire = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'inventory_inventaires'  # Changé pour plus de cohérence
        verbose_name = 'Inventaire'
        verbose_name_plural = 'Inventaires'
        ordering = ['-date_debut']
    
    def __str__(self):
        return f"Inventaire du {self.date_debut.strftime('%d/%m/%Y')}"
    
    def terminer(self):
        """Termine l'inventaire"""
        if self.status == 'en_cours':
            self.status = 'termine'
            self.date_fin = timezone.now()
            self.save()
    
    def annuler(self):
        """Annule l'inventaire"""
        if self.status == 'en_cours':
            self.status = 'annule'
            self.date_fin = timezone.now()
            self.save()

class LigneInventaire(models.Model):
    """Modèle pour les lignes d'un inventaire"""
    inventaire = models.ForeignKey(
        Inventaire,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    stock = models.ForeignKey(
        StockItem,
        on_delete=models.CASCADE
    )
    quantite_theorique = models.IntegerField()
    quantite_reelle = models.IntegerField()
    difference = models.IntegerField()
    commentaire = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        db_table = 'inventory_lignes_inventaire'  # Changé pour plus de cohérence
        verbose_name = 'Ligne d\'inventaire'
        verbose_name_plural = 'Lignes d\'inventaire'
    
    def __str__(self):
        return f"{self.stock.produit.nom} - Différence: {self.difference}"
    
    def save(self, *args, **kwargs):
        # Calculer la différence
        self.difference = self.quantite_reelle - self.quantite_theorique
        super().save(*args, **kwargs)
