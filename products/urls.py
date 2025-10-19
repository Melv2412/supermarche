from django.urls import path
from django.views.generic import TemplateView

app_name = 'products'

urlpatterns = [
    # URLs pour la gestion des produits
    path('', TemplateView.as_view(template_name='products/product_list.html'), name='product_list'),
    path('create/', TemplateView.as_view(template_name='products/product_form.html'), name='product_form'),
    path('categories/', TemplateView.as_view(template_name='products/category_list.html'), name='category_list'),
    path('categories/create/', TemplateView.as_view(template_name='products/category_form.html'), name='category_form'),
    path('barcode/', TemplateView.as_view(template_name='products/barcode_scanner.html'), name='barcode_scanner'),
]
