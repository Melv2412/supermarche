from django.urls import path
from django.views.generic import TemplateView

app_name = 'sales'

urlpatterns = [
    # URLs pour la caisse et les ventes
    path('pos/', TemplateView.as_view(template_name='sales/pos_dashboard.html'), name='pos_dashboard'),
    path('pos/interface/', TemplateView.as_view(template_name='sales/pos_interface.html'), name='pos_interface'),
    path('payment/', TemplateView.as_view(template_name='sales/payment_processing.html'), name='payment_processing'),
    path('receipt/', TemplateView.as_view(template_name='sales/receipt_generation.html'), name='receipt_generation'),
]
