from django.urls import path
from django.views.generic import TemplateView
from . import views

app_name = 'reporting'

urlpatterns = [
    # Dashboard Admin
    path('', TemplateView.as_view(template_name='reporting/admin_dashboard.html'), name='admin_dashboard'),
    path('reports/', TemplateView.as_view(template_name='reporting/dashboard.html'), name='reports'),
    
    # PDF Reports
    path('pdf/financial/', views.financial_report_pdf, name='financial_pdf'),
    path('pdf/inventory/', views.inventory_report_pdf, name='inventory_pdf'),
    path('pdf/employee-schedule/', views.employee_schedule_pdf, name='schedule_pdf'),
    path('pdf/daily-sales/', views.daily_sales_pdf, name='daily_sales_pdf'),
    path('pdf/customer-history/', views.customer_history_pdf, name='customer_history_pdf'),
    path('pdf/supplier-orders/', views.supplier_orders_pdf, name='supplier_orders_pdf'),
]
