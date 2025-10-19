from django.urls import path, include
from django.views.generic import TemplateView

urlpatterns = [
    # Inclure les URLs des applications
    path('security/', include('security.urls')),
    path('sales/', include('sales.urls')),
    path('products/', include('products.urls')),
    path('inventory/', include('inventory.urls')),
    path('suppliers/', include('suppliers.urls')),
    path('customers/', include('customers.urls')),
    path('employees/', include('employees.urls')),
    path('reporting/', include('reporting.urls')),

    # Accueil -> Login (front-only role selection)
    path('', TemplateView.as_view(template_name='security/login.html')),
]