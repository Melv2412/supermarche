from django.urls import path
from . import views

app_name = 'suppliers'

urlpatterns = [
    # URLs pour la gestion des fournisseurs
    path('', views.supplier_list, name='supplier_list'),
    path('create/', views.supplier_create, name='supplier_create'),
    path('<int:supplier_id>/', views.supplier_detail, name='supplier_detail'),
    path('<int:supplier_id>/edit/', views.supplier_edit, name='supplier_edit'),
    
    # Garder les autres URLs pour les commandes et livraisons
    path('orders/', views.supplier_list, name='order_list'),  # À implémenter
    path('orders/create/', views.supplier_list, name='order_form'),  # À implémenter
    path('orders/detail/', views.supplier_list, name='order_detail'),  # À implémenter
    path('delivery/', views.supplier_list, name='delivery_tracking'),  # À implémenter
]
