from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from .models import User
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, ChangePasswordSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Inscription d'un nouvel utilisateur"""
    serializer = RegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Si c'est un client, créer automatiquement un profil client
        if user.role == 'client':
            from customers.models import Client, LoyaltyCard
            
            # Créer le profil client
            client, created = Client.objects.get_or_create(
                email=user.email,
                defaults={
                    'nom': user.nom,
                    'prenom': user.prenom,
                    'telephone': user.telephone or '',
                    'actif': True
                }
            )
            
            # Créer une carte de fidélité si elle n'existe pas
            if created:
                LoyaltyCard.objects.create(id_client=client)
        
        # Créer un token pour l'utilisateur
        token, created = Token.objects.get_or_create(user=user)
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': 'Inscription réussie'
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Connexion d'un utilisateur"""
    serializer = LoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Récupérer ou créer le token
        token, created = Token.objects.get_or_create(user=user)
        
        # Mettre à jour last_login
        from django.utils import timezone
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])
        
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key,
            'message': f'Bienvenue {user.nom_complet}'
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Déconnexion d'un utilisateur"""
    try:
        # Supprimer le token
        request.user.auth_token.delete()
        
        # Déconnexion de la session
        logout(request)
        
        return Response({
            'message': 'Déconnexion réussie'
        })
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """Récupère les informations de l'utilisateur connecté"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Met à jour le profil de l'utilisateur"""
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change le mot de passe de l'utilisateur"""
    serializer = ChangePasswordSerializer(data=request.data)
    
    if serializer.is_valid():
        user = request.user
        
        # Vérifier l'ancien mot de passe
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({
                'error': 'Ancien mot de passe incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Définir le nouveau mot de passe
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Régénérer le token
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)
        
        return Response({
            'message': 'Mot de passe changé avec succès',
            'token': token.key
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_role(request):
    """Vérifie le rôle de l'utilisateur"""
    return Response({
        'role': request.user.role,
        'role_display': request.user.get_role_display(),
        'is_admin': request.user.role == 'admin',
        'is_caissier': request.user.role == 'caissier',
        'is_rh': request.user.role == 'rh',
        'is_client': request.user.role == 'client',
    })
