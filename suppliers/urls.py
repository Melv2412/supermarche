from django.urls import path
from django.views.generic import TemplateView

app_name = 'suppliers'

urlpatterns = [
    # URLs pour la gestion des fournisseurs
    path('', TemplateView.as_view(template_name='suppliers/supplier_list.html'), name='supplier_list'),
    path('create/', TemplateView.as_view(template_name='suppliers/supplier_form.html'), name='supplier_form'),
    path('detail/', TemplateView.as_view(template_name='suppliers/supplier_detail.html'), name='supplier_detail'),
    path('orders/', TemplateView.as_view(template_name='suppliers/order_list.html'), name='order_list'),
    path('orders/create/', TemplateView.as_view(template_name='suppliers/order_form.html'), name='order_form'),
    path('orders/detail/', TemplateView.as_view(template_name='suppliers/order_detail.html'), name='order_detail'),
    path('delivery/', TemplateView.as_view(template_name='suppliers/delivery_tracking.html'), name='delivery_tracking'),
]
