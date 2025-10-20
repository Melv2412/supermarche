from django.urls import path
from . import api_views

urlpatterns = [
    # Cash Registers
    path('cash-registers/', api_views.cash_register_list, name='api_cash_register_list'),
    
    # Transactions
    path('transactions/', api_views.transaction_list, name='api_transaction_list'),
    path('transactions/<int:pk>/', api_views.transaction_detail, name='api_transaction_detail'),
    
    # Dashboards & Reports
    path('cashier/dashboard/', api_views.cashier_dashboard, name='api_cashier_dashboard'),
    path('reports/sales/', api_views.sales_report, name='api_sales_report'),
]
