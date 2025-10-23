from django.urls import path
from django.contrib.auth.views import LoginView, LogoutView
from django.views.generic import TemplateView
from .views import CustomLoginView

app_name = 'security'

urlpatterns = [
    # URLs pour l'authentification et la sécurité
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(next_page='security:login'), name='logout'),
    path('register/', TemplateView.as_view(template_name='security/register.html'), name='register'),
    path('password-reset/', TemplateView.as_view(template_name='security/password_reset.html'), name='password_reset'),
]
