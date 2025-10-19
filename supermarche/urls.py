from django.urls import path
from django.views.generic import TemplateView

urlpatterns = [
    # Sécurité
    path('security/login/',   TemplateView.as_view(template_name='security/login.html')),
    path('security/register/',TemplateView.as_view(template_name='security/register.html')),
    path('security/reset/',   TemplateView.as_view(template_name='security/password_reset.html')),  # créer le template si besoin

    # Caisse
    path('sales/pos/',        TemplateView.as_view(template_name='sales/pos_interface.html')),
    path('sales/dashboard/',  TemplateView.as_view(template_name='sales/pos_dashboard.html')),
    path('sales/payment/',    TemplateView.as_view(template_name='sales/payment_processing.html')),
    path('sales/receipt/',    TemplateView.as_view(template_name='sales/receipt_generation.html')),

    # Stocks
    path('inventory/',        TemplateView.as_view(template_name='inventory/stock_dashboard.html')),

    # Produits
    path('products/list/',    TemplateView.as_view(template_name='products/product_list.html')),
    path('products/new/',     TemplateView.as_view(template_name='products/product_form.html')),
    path('products/categories/',    TemplateView.as_view(template_name='products/category_list.html')),
    path('products/categories/new/',TemplateView.as_view(template_name='products/category_form.html')),
    path('products/scanner/',       TemplateView.as_view(template_name='products/barcode_scanner.html')),

    # Reporting
    path('reporting/',        TemplateView.as_view(template_name='reporting/dashboard.html')),

    # Clients
    path('customers/',        TemplateView.as_view(template_name='customers/loyalty_dashboard.html')),
    path('customers/history/',TemplateView.as_view(template_name='customers/points_history.html')),

    # Fournisseurs
    path('suppliers/',               TemplateView.as_view(template_name='suppliers/supplier_list.html')),
    path('suppliers/detail/',        TemplateView.as_view(template_name='suppliers/supplier_detail.html')),  # ?id=1
    path('suppliers/new/',           TemplateView.as_view(template_name='suppliers/supplier_form.html')),
    path('suppliers/orders/',        TemplateView.as_view(template_name='suppliers/order_list.html')),
    path('suppliers/orders/detail/', TemplateView.as_view(template_name='suppliers/order_detail.html')),     # ?id=101
    path('suppliers/orders/new/',    TemplateView.as_view(template_name='suppliers/order_form.html')),
    path('suppliers/tracking/',      TemplateView.as_view(template_name='suppliers/delivery_tracking.html')),

    # Employés (RH)
    path('employees/',               TemplateView.as_view(template_name='employees/employee_list.html')),
    path('employees/detail/',        TemplateView.as_view(template_name='employees/employee_detail.html')),  # ?id=1
    path('employees/schedule/',      TemplateView.as_view(template_name='employees/schedule_management.html')),
    path('employees/shifts/',        TemplateView.as_view(template_name='employees/shift_planning.html')),
    path('employees/leaves/',        TemplateView.as_view(template_name='employees/leave_requests.html')),
    path('employees/performance/',   TemplateView.as_view(template_name='employees/performance_review.html')),

    # Accueil -> Login (front-only role selection)
    path('', TemplateView.as_view(template_name='security/login.html')),
]