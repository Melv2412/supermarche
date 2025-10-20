from django.urls import path
from . import api_views

urlpatterns = [
    # Categories
    path('categories/', api_views.category_list, name='api_category_list'),
    path('categories/<int:pk>/', api_views.category_detail, name='api_category_detail'),
    
    # Products
    path('products/', api_views.product_list, name='api_product_list'),
    path('products/<int:pk>/', api_views.product_detail, name='api_product_detail'),
    
    # Stock
    path('stock/alerts/', api_views.stock_alerts, name='api_stock_alerts'),
    path('stock/rupture/', api_views.stock_rupture, name='api_stock_rupture'),
    path('stock/movements/', api_views.stock_movements, name='api_stock_movements'),
    
    # Promotions
    path('promotions/', api_views.promotion_list, name='api_promotion_list'),
    path('promotions/<int:pk>/', api_views.promotion_detail, name='api_promotion_detail'),
]
