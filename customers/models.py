from django.db import models
from django.core.validators import MinValueValidator, EmailValidator
import random
import string


class Client(models.Model):
    """Modèle pour les clients"""
    id_client = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    telephone = models.CharField(max_length=20)
    adresse = models.TextField(blank=True, null=True)
    ville = models.CharField(max_length=100, default='Abidjan')
    date_naissance = models.DateField(blank=True, null=True)
    actif = models.BooleanField(default=True)
    date_inscription = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'clients'
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'
        ordering = ['nom', 'prenom']
    
    def __str__(self):
        return f"{self.nom} {self.prenom}"
    
    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"


class LoyaltyCard(models.Model):
    """Modèle pour les cartes de fidélité"""
    id_carte = models.AutoField(primary_key=True)
    numero_carte = models.CharField(max_length=20, unique=True)
    id_client = models.OneToOneField(
        Client,
        on_delete=models.CASCADE,
        related_name='carte_fidelite'
    )
    points = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    niveau = models.CharField(
        max_length=20,
        choices=[
            ('bronze', 'Bronze'),
            ('argent', 'Argent'),
            ('or', 'Or'),
            ('platine', 'Platine'),
        ],
        default='bronze'
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_expiration = models.DateField(blank=True, null=True)
    actif = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'cartes_fidelite'
        verbose_name = 'Carte de fidélité'
        verbose_name_plural = 'Cartes de fidélité'
    
    def __str__(self):
        return f"Carte {self.numero_carte} - {self.id_client.nom_complet}"
    
    def save(self, *args, **kwargs):
        # Générer un numéro de carte automatiquement si non fourni
        if not self.numero_carte:
            self.numero_carte = self.generer_numero_carte()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generer_numero_carte():
        """Génère un numéro de carte unique"""
        prefix = 'FIDELITE'
        random_part = ''.join(random.choices(string.digits, k=8))
        return f"{prefix}{random_part}"
    
    def ajouter_points(self, points):
        """Ajoute des points et met à jour le niveau"""
        self.points += points
        self.mettre_a_jour_niveau()
        self.save()
    
    def retirer_points(self, points):
        """Retire des points (pour utilisation récompenses)"""
        if self.points >= points:
            self.points -= points
            self.mettre_a_jour_niveau()
            self.save()
            return True
        return False
    
    def mettre_a_jour_niveau(self):
        """Met à jour le niveau selon les points"""
        if self.points >= 10000:
            self.niveau = 'platine'
        elif self.points >= 5000:
            self.niveau = 'or'
        elif self.points >= 2000:
            self.niveau = 'argent'
        else:
            self.niveau = 'bronze'


class LoyaltyTransaction(models.Model):
    """Modèle pour l'historique des transactions de fidélité"""
    TYPE_CHOICES = [
        ('gain', 'Gain de points'),
        ('utilisation', 'Utilisation de points'),
        ('expiration', 'Expiration de points'),
        ('ajustement', 'Ajustement'),
    ]
    
    id_transaction_fidelite = models.AutoField(primary_key=True)
    id_carte = models.ForeignKey(
        LoyaltyCard,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    type_transaction = models.CharField(max_length=20, choices=TYPE_CHOICES)
    points = models.IntegerField()
    points_avant = models.IntegerField()
    points_apres = models.IntegerField()
    description = models.CharField(max_length=200, blank=True, null=True)
    reference_vente = models.CharField(max_length=100, blank=True, null=True)
    date_transaction = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'transactions_fidelite'
        verbose_name = 'Transaction de fidélité'
        verbose_name_plural = 'Transactions de fidélité'
        ordering = ['-date_transaction']
    
    def __str__(self):
        return f"{self.type_transaction} - {self.points} pts - {self.id_carte.numero_carte}"


class Complaint(models.Model):
    """Modèle pour les réclamations clients"""
    STATUT_CHOICES = [
        ('ouverte', 'Ouverte'),
        ('en_cours', 'En cours de traitement'),
        ('resolue', 'Résolue'),
        ('fermee', 'Fermée'),
    ]
    
    PRIORITE_CHOICES = [
        ('basse', 'Basse'),
        ('moyenne', 'Moyenne'),
        ('haute', 'Haute'),
        ('urgente', 'Urgente'),
    ]
    
    id_reclamation = models.AutoField(primary_key=True)
    id_client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='reclamations'
    )
    sujet = models.CharField(max_length=200)
    description = models.TextField()
    priorite = models.CharField(max_length=20, choices=PRIORITE_CHOICES, default='moyenne')
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='ouverte')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_resolution = models.DateTimeField(blank=True, null=True)
    responsable = models.CharField(max_length=100, blank=True, null=True)
    reponse = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'reclamations'
        verbose_name = 'Réclamation'
        verbose_name_plural = 'Réclamations'
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.sujet} - {self.id_client.nom_complet} ({self.statut})"
