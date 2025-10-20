from django.urls import path
from django.views.generic import TemplateView

app_name = 'reporting'

urlpatterns = [
    # Dashboard Admin
    path('', TemplateView.as_view(template_name='reporting/admin_dashboard.html'), name='admin_dashboard'),
    path('reports/', TemplateView.as_view(template_name='reporting/dashboard.html'), name='reports'),
]
