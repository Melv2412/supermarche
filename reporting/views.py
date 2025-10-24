from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, Http404
from datetime import datetime, timedelta
from .utils import (
    generate_financial_report,
    generate_inventory_report,
    generate_employee_schedule_report,
    generate_daily_sales_report,
    generate_customer_purchase_history,
    generate_supplier_orders_report,
    render_to_pdf
)
from employees.models import Employee
from customers.models import Client

@login_required
def financial_report_pdf(request):
    """Génère le rapport financier en PDF"""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        
    pdf = generate_financial_report(start_date, end_date)
    if pdf:
        return pdf
    raise Http404("Erreur lors de la génération du PDF")

@login_required
def inventory_report_pdf(request):
    """Génère le rapport d'inventaire en PDF"""
    pdf = generate_inventory_report()
    if pdf:
        return pdf
    raise Http404("Erreur lors de la génération du PDF")

@login_required
def employee_schedule_pdf(request):
    """Génère le planning des employés en PDF"""
    date = request.GET.get('date')
    if date:
        date = datetime.strptime(date, '%Y-%m-%d')
        
    pdf = generate_employee_schedule_report(date)
    if pdf:
        return pdf
    raise Http404("Erreur lors de la génération du PDF")

@login_required
def supplier_orders_pdf(request):
    """Génère le rapport des commandes fournisseurs en PDF"""
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        
    context = generate_supplier_orders_report(start_date, end_date)
    pdf = render_to_pdf('reporting/supplier_orders_report.html', context)
    
    if pdf:
        response = HttpResponse(pdf, content_type='application/pdf')
        filename = f"rapport_commandes_fournisseurs_{datetime.now().strftime('%Y%m%d')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    raise Http404("Erreur lors de la génération du PDF")

@login_required
def daily_sales_pdf(request):
    """Génère le rapport des ventes quotidiennes en PDF"""
    employee_id = request.GET.get('employee_id')
    date = request.GET.get('date')
    
    if not employee_id:
        raise Http404("ID employé requis")
        
    employee = get_object_or_404(Employee, pk=employee_id)
    
    if date:
        date = datetime.strptime(date, '%Y-%m-%d')
        
    pdf = generate_daily_sales_report(employee, date)
    if pdf:
        return pdf
    raise Http404("Erreur lors de la génération du PDF")

@login_required
def customer_history_pdf(request):
    """Génère l'historique des achats client en PDF"""
    customer_id = request.GET.get('customer_id')
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    if not customer_id:
        raise Http404("ID client requis")
        
    client = get_object_or_404(Client, pk=customer_id)
    
    if start_date:
        start_date = datetime.strptime(start_date, '%Y-%m-%d')
    if end_date:
        end_date = datetime.strptime(end_date, '%Y-%m-%d')
        
    pdf = generate_customer_purchase_history(client, start_date, end_date)
    if pdf:
        return pdf
    raise Http404("Erreur lors de la génération du PDF")
