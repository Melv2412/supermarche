from django.urls import path
from . import api_views

urlpatterns = [
    # Clients
    path('clients/', api_views.client_list, name='api_client_list'),
    path('clients/<int:pk>/', api_views.client_detail, name='api_client_detail'),
    path('clients/<int:pk>/transactions/', api_views.client_transactions, name='api_client_transactions'),
    
    # Loyalty
    path('clients/<int:pk>/loyalty/', api_views.client_loyalty, name='api_client_loyalty'),
    path('clients/<int:pk>/loyalty/add-points/', api_views.loyalty_add_points, name='api_loyalty_add_points'),
    path('clients/<int:pk>/loyalty/use-points/', api_views.loyalty_use_points, name='api_loyalty_use_points'),
    
    # Complaints
    path('complaints/', api_views.complaint_list, name='api_complaint_list'),
    path('complaints/<int:pk>/', api_views.complaint_detail, name='api_complaint_detail'),
    path('complaints/<int:pk>/resolve/', api_views.complaint_resolve, name='api_complaint_resolve'),
]
