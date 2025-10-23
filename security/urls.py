from django.urls import path
from django.views.generic import TemplateView

app_name = 'security'

urlpatterns = [
    # URLs pour l'authentification et la sécurité
    path('login/', TemplateView.as_view(template_name='security/login.html'), name='login'),
    path('register/', TemplateView.as_view(template_name='security/register.html'), name='register'),
    path('password-reset/', TemplateView.as_view(template_name='security/password_reset.html'), name='password_reset'),
]
