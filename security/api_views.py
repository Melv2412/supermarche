from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import login, logout, authenticate
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import authentication_classes
from .models import User
from .serializers import UserSerializer


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def register(request):
    email = request.data.get('email')
    password = request.data.get('password')
    nom = request.data.get('nom')
    prenom = request.data.get('prenom')
    
    if not all([email, password, nom, prenom]):
        return Response({
            'error': 'Tous les champs sont requis'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'Un utilisateur avec cet email existe déjà'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(
        email=email,
        password=password,
        nom=nom,
        prenom=prenom
    )
    
    token = Token.objects.create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'email': user.email,
            'nom': user.nom,
            'prenom': user.prenom,
            'role': user.role
        }
    }, status=status.HTTP_201_CREATED)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login(request):
    try:
        if not request.body:
            return Response({
                'error': 'Aucune donnée reçue'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        email = request.data.get('email')
        password = request.data.get('password')
    except Exception as e:
        return Response({
            'error': 'Erreur de format JSON : ' + str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not email or not password:
        return Response({
            'error': 'Email et mot de passe requis'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(request, email=email, password=password)
    
    if not user:
        return Response({
            'error': 'Email ou mot de passe incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    token, _ = Token.objects.get_or_create(user=user)
    
    return Response({
        'token': token.key,
        'user': {
            'id': user.id,
            'email': user.email,
            'nom': user.nom,
            'prenom': user.prenom,
            'role': user.role
        }
    })


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
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({
            'error': 'Les deux mots de passe sont requis'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    if not user.check_password(old_password):
        return Response({
            'error': 'Ancien mot de passe incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user.set_password(new_password)
    user.save()
    
    token = Token.objects.create(user=user)
    
    return Response({
        'message': 'Mot de passe changé avec succès',
        'token': token.key
    })


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
