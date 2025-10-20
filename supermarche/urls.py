from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # API URLs
    path('api/auth/', include('security.api_urls')),
    path('api/', include('products.api_urls')),
    path('api/', include('customers.api_urls')),
    path('api/', include('employees.api_urls')),
    path('api/', include('suppliers.api_urls')),
    path('api/', include('sales.api_urls')),
    
    # Front URLs (pages HTML)
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

# Servir les fichiers media en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)