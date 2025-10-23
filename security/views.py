from django.shortcuts import render
from django.contrib.auth.views import LoginView
from django.urls import reverse_lazy

class CustomLoginView(LoginView):
    template_name = 'security/login.html'
    success_url = reverse_lazy('security:home')  # Redirection après connexion réussie
    
    def get_success_url(self):
        """Redirection basée sur le rôle de l'utilisateur"""
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'admin':
                return '/admin/'
            elif user.role == 'rh':
                return '/employees/'
            elif user.role == 'client':
                return '/customers/dashboard/'
            # Ajoutez d'autres redirections basées sur les rôles
        return super().get_success_url()
