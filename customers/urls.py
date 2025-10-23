from django.urls import path
from django.views.generic import TemplateView
from . import views

app_name = 'customers'

urlpatterns = [
    # Interface client personnelle
    path('', TemplateView.as_view(template_name='customers/loyalty_dashboard.html'), name='loyalty_dashboard'),
    path('shop/', TemplateView.as_view(template_name='customers/shop.html'), name='shop'),
    path('checkout/', TemplateView.as_view(template_name='customers/checkout.html'), name='checkout'),
    # Administration des clients
    path('list/', views.liste_clients, name='liste_clients'),
    path('management/', views.dashboard_clients, name='dashboard_clients'),
    path('fidelite/', views.gestion_fidelite, name='gestion_fidelite'),
    path('fidelite/<int:id_client>/', views.detail_carte_fidelite, name='detail_carte_fidelite'),
    path('fidelite/<int:id_client>/ajouter-points/', views.ajouter_points, name='ajouter_points'),
    path('fidelite/<int:id_client>/retirer-points/', views.retirer_points, name='retirer_points'),
    path('points/', TemplateView.as_view(template_name='customers/points_history.html'), name='points_history'),
    
    # Interface de gestion pour les employés
    path('management/', TemplateView.as_view(template_name='customers/management_dashboard.html'), name='management_dashboard'),
    path('list/', TemplateView.as_view(template_name='customers/client_list.html'), name='client_list'),
    path('complaints/', TemplateView.as_view(template_name='customers/complaints.html'), name='complaints'),
]
