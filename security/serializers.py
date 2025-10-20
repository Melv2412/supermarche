from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer pour les utilisateurs"""
    nom_complet = serializers.CharField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'nom', 'prenom', 'nom_complet', 'role', 'role_display', 
                  'telephone', 'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription"""
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'nom', 'prenom', 'telephone']
    
    def validate(self, data):
        """Validation des données"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Les mots de passe ne correspondent pas")
        return data
    
    def create(self, validated_data):
        """Création de l'utilisateur"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Créer l'utilisateur
        user = User(**validated_data)
        
        # Déterminer le rôle automatiquement par le mot de passe
        user.role = User.determine_role_by_password(password)
        
        # Définir le mot de passe
        user.set_password(password)
        
        # Si c'est un admin, rh ou caissier, activer is_staff
        if user.role in ['admin', 'rh', 'caissier']:
            user.is_staff = True
        
        user.save()
        
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer pour la connexion"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        """Validation et authentification"""
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            # Authentifier l'utilisateur
            user = authenticate(username=email, password=password)
            
            if user:
                if not user.is_active:
                    raise serializers.ValidationError("Ce compte est désactivé")
                data['user'] = user
            else:
                raise serializers.ValidationError("Email ou mot de passe incorrect")
        else:
            raise serializers.ValidationError("Email et mot de passe requis")
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer pour changer le mot de passe"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)
    new_password_confirm = serializers.CharField(write_only=True, min_length=6)
    
    def validate(self, data):
        """Validation"""
        if data['new_password'] != data['new_password_confirm']:
            raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas")
        return data
