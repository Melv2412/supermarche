from django.urls import path
from . import api_views

urlpatterns = [
    # My Stats - doit être avant les autres pour éviter les conflits
    path('customers/my-stats/', api_views.my_stats, name='api_my_stats'),
    
    # Clients
    path('customers/clients/', api_views.client_list, name='api_client_list'),
    path('customers/clients/<int:pk>/', api_views.client_detail, name='api_client_detail'),
    path('customers/clients/<int:pk>/transactions/', api_views.client_transactions, name='api_client_transactions'),
    path('customers/clients/<int:pk>/stats/', api_views.client_stats, name='api_client_stats'),
    
    # Loyalty
    path('customers/clients/<int:pk>/loyalty/', api_views.client_loyalty, name='api_client_loyalty'),
    path('customers/clients/<int:pk>/loyalty/add-points/', api_views.loyalty_add_points, name='api_loyalty_add_points'),
    path('customers/clients/<int:pk>/loyalty/use-points/', api_views.loyalty_use_points, name='api_loyalty_use_points'),
    
    # Complaints
    path('customers/complaints/', api_views.complaint_list, name='api_complaint_list'),
    path('customers/complaints/<int:pk>/', api_views.complaint_detail, name='api_complaint_detail'),
    path('customers/complaints/<int:pk>/resolve/', api_views.complaint_resolve, name='api_complaint_resolve'),
    # Utility
    path('customers/identify/', api_views.identify_client, name='api_identify_client'),
]
