from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, EmailValidator


class Employee(models.Model):
    """Modèle pour les employés"""
    POSTE_CHOICES = [
        ('caissier', 'Caissier'),
        ('rayon', 'Responsable rayon'),
        ('logistique', 'Logistique'),
        ('manager', 'Manager'),
        ('rh', 'Ressources Humaines'),
        ('securite', 'Sécurité'),
    ]
    
    DEPARTEMENT_CHOICES = [
        ('caisse', 'Caisse'),
        ('rayons', 'Rayons'),
        ('logistique', 'Logistique'),
        ('administration', 'Administration'),
        ('securite', 'Sécurité'),
    ]
    
    STATUT_CHOICES = [
        ('present', 'Présent'),
        ('absent', 'Absent'),
        ('conge', 'En congé'),
        ('malade', 'Malade'),
    ]
    
    id_employe = models.AutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    email = models.EmailField(unique=True, validators=[EmailValidator()])
    telephone = models.CharField(max_length=20)
    adresse = models.TextField(blank=True, null=True)
    date_naissance = models.DateField()
    date_embauche = models.DateField()
    poste = models.CharField(max_length=50, choices=POSTE_CHOICES)
    salaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    actif = models.BooleanField(default=True)
    photo = models.ImageField(upload_to='employees/', blank=True, null=True)
    
    # Champs pour le planning
    departement = models.CharField(max_length=50, choices=DEPARTEMENT_CHOICES, default='caisse')
    horaire_debut = models.TimeField(null=True)
    horaire_fin = models.TimeField(null=True)
    pause_debut = models.TimeField(null=True, blank=True)
    pause_fin = models.TimeField(null=True, blank=True)
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='present')
    
    class Meta:
        db_table = 'employes'
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'
        ordering = ['nom', 'prenom']
    
    def __str__(self):
        return f"{self.nom} {self.prenom} - {self.get_poste_display()}"
    
    @property
    def nom_complet(self):
        return f"{self.nom} {self.prenom}"


class Schedule(models.Model):
    """Modèle pour les plannings"""
    JOUR_CHOICES = [
        ('lundi', 'Lundi'),
        ('mardi', 'Mardi'),
        ('mercredi', 'Mercredi'),
        ('jeudi', 'Jeudi'),
        ('vendredi', 'Vendredi'),
        ('samedi', 'Samedi'),
        ('dimanche', 'Dimanche'),
    ]
    
    SHIFT_CHOICES = [
        ('matin', 'Matin (6h-14h)'),
        ('apres-midi', 'Après-midi (14h-22h)'),
        ('nuit', 'Nuit (22h-6h)'),
    ]
    
    id_planning = models.AutoField(primary_key=True)
    id_employe = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='plannings'
    )
    jour = models.CharField(max_length=20, choices=JOUR_CHOICES)
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES)
    heure_debut = models.TimeField()
    heure_fin = models.TimeField()
    poste_assigne = models.CharField(max_length=100)
    semaine = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(53)])
    annee = models.IntegerField()
    actif = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'plannings'
        verbose_name = 'Planning'
        verbose_name_plural = 'Plannings'
        ordering = ['annee', 'semaine', 'jour']
    
    def __str__(self):
        return f"{self.id_employe.nom_complet} - {self.jour} {self.shift}"


class LeaveRequest(models.Model):
    """Modèle pour les demandes de congés"""
    TYPE_CHOICES = [
        ('conges_payes', 'Congés payés'),
        ('conge_maladie', 'Congé maladie'),
        ('conge_maternite', 'Congé maternité'),
        ('conge_paternite', 'Congé paternité'),
        ('conge_exceptionnel', 'Congé exceptionnel'),
        ('rtt', 'RTT'),
    ]
    
    STATUT_CHOICES = [
        ('pending', 'En attente'),
        ('approved', 'Approuvé'),
        ('rejected', 'Refusé'),
    ]
    
    id_demande = models.AutoField(primary_key=True)
    id_employe = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='demandes_conges'
    )
    date_debut = models.DateField()
    date_fin = models.DateField()
    duree_jours = models.IntegerField(validators=[MinValueValidator(1)])
    type = models.CharField(max_length=30, choices=TYPE_CHOICES)
    motif = models.TextField()
    statut = models.CharField(max_length=20, choices=STATUT_CHOICES, default='pending')
    date_demande = models.DateTimeField(auto_now_add=True)
    valideur = models.CharField(max_length=100, blank=True, null=True)
    date_validation = models.DateTimeField(blank=True, null=True)
    commentaire = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'demandes_conges'
        verbose_name = 'Demande de congé'
        verbose_name_plural = 'Demandes de congés'
        ordering = ['-date_demande']
    
    def __str__(self):
        return f"{self.id_employe.nom_complet} - {self.get_type_display()} ({self.date_debut} au {self.date_fin})"


class PerformanceReview(models.Model):
    """Modèle pour les évaluations de performance"""
    id_evaluation = models.AutoField(primary_key=True)
    id_employe = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name='evaluations'
    )
    periode = models.CharField(max_length=20)  # Ex: "2025-Q1"
    date_evaluation = models.DateField()
    evaluateur = models.CharField(max_length=100)
    
    # Scores (sur 100)
    score_global = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    score_ponctualite = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        blank=True,
        null=True
    )
    score_qualite_travail = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        blank=True,
        null=True
    )
    score_relationnel = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        blank=True,
        null=True
    )
    score_autonomie = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        blank=True,
        null=True
    )
    
    # Commentaires
    points_forts = models.TextField(blank=True, null=True)
    points_amelioration = models.TextField(blank=True, null=True)
    objectifs = models.TextField(blank=True, null=True)
    commentaire = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'evaluations_performance'
        verbose_name = 'Évaluation de performance'
        verbose_name_plural = 'Évaluations de performance'
        ordering = ['-date_evaluation']
    
    def __str__(self):
        return f"{self.id_employe.nom_complet} - {self.periode} ({self.score_global}/100)"
