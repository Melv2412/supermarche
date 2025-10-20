from django.urls import path
from django.views.generic import TemplateView

app_name = 'customers'

urlpatterns = [
    # Interface client personnelle
    path('', TemplateView.as_view(template_name='customers/loyalty_dashboard.html'), name='loyalty_dashboard'),
    path('shop/', TemplateView.as_view(template_name='customers/shop.html'), name='shop'),
    path('checkout/', TemplateView.as_view(template_name='customers/checkout.html'), name='checkout'),
    path('points/', TemplateView.as_view(template_name='customers/points_history.html'), name='points_history'),
    
    # Interface de gestion pour les employés
    path('management/', TemplateView.as_view(template_name='customers/management_dashboard.html'), name='management_dashboard'),
    path('list/', TemplateView.as_view(template_name='customers/client_list.html'), name='client_list'),
    path('complaints/', TemplateView.as_view(template_name='customers/complaints.html'), name='complaints'),
]
