from django.urls import path
from . import api_views

urlpatterns = [
    # Authentification
    path('register/', api_views.register, name='api_register'),
    path('login/', api_views.login, name='api_login'),
    path('logout/', api_views.logout_view, name='api_logout'),
    
    # Profil utilisateur
    path('me/', api_views.current_user, name='api_current_user'),
    path('profile/update/', api_views.update_profile, name='api_update_profile'),
    path('password/change/', api_views.change_password, name='api_change_password'),
    
    # Vérification rôle
    path('check-role/', api_views.check_role, name='api_check_role'),
]
