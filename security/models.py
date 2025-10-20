from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    """Manager personnalisé pour le modèle User"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Crée et sauvegarde un utilisateur"""
        if not email:
            raise ValueError('L\'email est obligatoire')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Crée et sauvegarde un superutilisateur"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Modèle utilisateur personnalisé"""
    
    ROLE_CHOICES = [
        ('admin', 'Administrateur'),
        ('caissier', 'Caissier'),
        ('rh', 'Responsable RH'),
        ('client', 'Client'),
    ]
    
    email = models.EmailField(unique=True, max_length=255)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='client')
    telephone = models.CharField(max_length=20, blank=True, null=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nom', 'prenom']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'Utilisateur'
        verbose_name_plural = 'Utilisateurs'
    
    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"
    
    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}"
    
    @staticmethod
    def determine_role_by_password(password):
        """Détermine le rôle basé sur le mot de passe"""
        if password == 'admin123':
            return 'admin'
        elif password == 'caissier123':
            return 'caissier'
        elif password == 'rh1234':
            return 'rh'
        else:
            return 'client'
