from django.urls import path
from django.views.generic import TemplateView

app_name = 'inventory'

urlpatterns = [
    # URLs pour la gestion des stocks
    path('', TemplateView.as_view(template_name='inventory/stock_dashboard.html'), name='stock_dashboard'),
]
