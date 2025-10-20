from django.urls import path
from . import api_views

urlpatterns = [
    # Suppliers
    path('suppliers/', api_views.supplier_list, name='api_supplier_list'),
    path('suppliers/<int:pk>/', api_views.supplier_detail, name='api_supplier_detail'),
    
    # Purchase Orders
    path('purchase-orders/', api_views.purchase_order_list, name='api_purchase_order_list'),
    path('purchase-orders/<int:pk>/', api_views.purchase_order_detail, name='api_purchase_order_detail'),
    path('purchase-orders/<int:pk>/add-line/', api_views.purchase_order_add_line, name='api_purchase_order_add_line'),
    
    # Deliveries
    path('deliveries/', api_views.delivery_list, name='api_delivery_list'),
    path('deliveries/<int:pk>/', api_views.delivery_detail, name='api_delivery_detail'),
]
