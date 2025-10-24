from io import BytesIO
from django.http import HttpResponse
from django.template.loader import get_template
from xhtml2pdf import pisa
from datetime import datetime, timedelta
from django.db.models import Sum, Count, Avg
from sales.models import Transaction, TransactionLine
from products.models import Product, Category, Promotion
from employees.models import Employee
from customers.models import Client
from suppliers.models import Supplier, PurchaseOrder, PurchaseOrderLine, Delivery

def render_to_pdf(template_src, context_dict={}):
    template = get_template(template_src)
    html = template.render(context_dict)
    result = BytesIO()
    pdf = pisa.pisaDocument(BytesIO(html.encode("UTF-8")), result)
    if not pdf.err:
        return HttpResponse(result.getvalue(), content_type='application/pdf')
    return None

# Rapports Admin
def generate_supplier_orders_report(start_date=None, end_date=None):
    """Génère un rapport sur les commandes fournisseurs"""
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    commandes = PurchaseOrder.objects.filter(
        date_commande__range=[start_date, end_date]
    ).select_related('id_fournisseur')
    
    # Statistiques globales
    total_commandes = commandes.count()
    montant_total = commandes.aggregate(total=Sum('montant_total'))['total'] or 0
    
    # Statistiques par statut
    stats_par_statut = commandes.values('statut').annotate(
        count=Count('id_commande'),
        total=Sum('montant_total')
    )
    
    # Top fournisseurs
    top_fournisseurs = commandes.values(
        'id_fournisseur__nom'
    ).annotate(
        count=Count('id_commande'),
        total=Sum('montant_total')
    ).order_by('-total')[:5]
    
    context = {
        'start_date': start_date,
        'end_date': end_date,
        'total_commandes': total_commandes,
        'montant_total': montant_total,
        'stats_par_statut': stats_par_statut,
        'top_fournisseurs': top_fournisseurs,
        'commandes': commandes
    }
    
    return context

def generate_financial_report(start_date=None, end_date=None):
    """Génère un rapport financier"""
    if not start_date:
        start_date = datetime.now() - timedelta(days=30)
    if not end_date:
        end_date = datetime.now()
    
    transactions = Transaction.objects.filter(
        date_transaction__range=[start_date, end_date],
        statut='terminee'
    )
    
    total_revenue = transactions.aggregate(Sum('montant_final'))['montant_final__sum'] or 0
    products_sold = TransactionLine.objects.filter(
        id_transaction__in=transactions
    ).count()
    
    context = {
        'start_date': start_date,
        'end_date': end_date,
        'total_revenue': total_revenue,
        'products_sold': products_sold,
        'average_sale': total_revenue / transactions.count() if transactions.count() > 0 else 0,
        'generated_at': datetime.now(),
    }
    return render_to_pdf('reporting/financial_report.html', context)

def generate_inventory_report():
    """Génère un rapport d'inventaire"""
    low_stock_products = Product.objects.filter(stock__lte=10)
    categories = Category.objects.all()
    
    context = {
        'low_stock_products': low_stock_products,
        'categories': categories,
        'total_products': Product.objects.count(),
        'generated_at': datetime.now(),
    }
    return render_to_pdf('reporting/inventory_report.html', context)

# Rapports RH
def generate_employee_schedule_report(date=None):
    """Génère un rapport de planning des employés"""
    if not date:
        date = datetime.now()
    
    employees = Employee.objects.filter(actif=True)
    
    # Regrouper par département
    departments = {}
    for employee in employees:
        dept = employee.departement
        if dept not in departments:
            departments[dept] = []
        departments[dept].append(employee)
    
    # Statistiques de présence
    present_employees = employees.filter(statut='present').count()
    total_employees = employees.count()
    absent_employees = total_employees - present_employees
    
    context = {
        'date': date,
        'departments': departments,
        'total_employees': total_employees,
        'present_employees': present_employees,
        'absent_employees': absent_employees,
        'generated_at': datetime.now(),
    }
    return render_to_pdf('reporting/schedule_report.html', context)

# Rapports Caissier
def generate_daily_sales_report(employee, date=None):
    """Génère un rapport des ventes quotidiennes"""
    if not date:
        date = datetime.now()
    
    transactions = Transaction.objects.filter(
        caissier=employee,
        date_transaction__date=date.date(),
        statut='terminee'
    )
    
    context = {
        'employee': employee,
        'date': date,
        'transactions': transactions,
        'total_transactions': transactions.count(),
        'total_amount': transactions.aggregate(Sum('montant_final'))['montant_final__sum'] or 0,
        'generated_at': datetime.now(),
    }
    return render_to_pdf('reporting/daily_sales_report.html', context)

# Rapports Client
def generate_customer_purchase_history(client, start_date=None, end_date=None):
    """Génère l'historique des achats d'un client"""
    if not start_date:
        start_date = datetime.now() - timedelta(days=90)
    if not end_date:
        end_date = datetime.now()
    
    transactions = Transaction.objects.filter(
        id_client=client,
        date_transaction__range=[start_date, end_date],
        statut='terminee'
    )
    
    context = {
        'client': client,
        'start_date': start_date,
        'end_date': end_date,
        'transactions': transactions,
        'total_spent': transactions.aggregate(Sum('montant_final'))['montant_final__sum'] or 0,
        'generated_at': datetime.now(),
    }
    return render_to_pdf('reporting/customer_history_report.html', context)