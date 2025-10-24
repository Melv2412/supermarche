from django.urls import path
from django.views.generic import TemplateView
from . import views

app_name = 'products'

urlpatterns = [
    # URLs pour la gestion des produits
    path('', TemplateView.as_view(template_name='products/product_list.html'), name='product_list'),
    path('create/', TemplateView.as_view(template_name='products/product_form.html'), name='product_form'),
    path('categories/', TemplateView.as_view(template_name='products/category_list.html'), name='category_list'),
    
    # URLs pour la gestion des promotions
    path('promotions/', views.liste_promotions, name='liste_promotions'),
    path('promotions/nouvelle/', views.nouvelle_promotion, name='nouvelle_promotion'),
    path('promotions/<int:id_promotion>/', views.detail_promotion, name='detail_promotion'),
    path('promotions/<int:id_promotion>/modifier/', views.modifier_promotion, name='modifier_promotion'),
    path('categories/create/', TemplateView.as_view(template_name='products/category_form.html'), name='category_form'),
    path('barcode/', TemplateView.as_view(template_name='products/barcode_scanner.html'), name='barcode_scanner'),
    path('promotions/', TemplateView.as_view(template_name='products/promotions.html'), name='promotions'),
]
