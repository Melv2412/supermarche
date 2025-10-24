from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from datetime import datetime
from .models import Employee
from .forms import PlanningForm
from .decorators import admin_or_hr_required

@login_required
@admin_or_hr_required
def schedule_view(request):
    """Vue pour afficher le planning hebdomadaire"""
    search_query = request.GET.get('search', '')
    departement_filter = request.GET.get('departement', '')
    
    # Récupérer tous les employés actifs avec leurs horaires
    employees = Employee.objects.filter(actif=True).select_related('user')
    
    if search_query:
        employees = employees.filter(
            Q(nom__icontains=search_query) |
            Q(prenom__icontains=search_query)
        )
    
    if departement_filter:
        employees = employees.filter(departement=departement_filter)
    
    context = {
        'employees': employees,
        'departements': dict(Employee.DEPARTEMENT_CHOICES),
        'search_query': search_query,
        'departement_filter': departement_filter,
        'jours_semaine': ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    }
    return render(request, 'employees/schedule_management.html', context)

@login_required
@admin_or_hr_required
def planning_list(request):
    """Vue pour lister les employés et leurs plannings"""
    search_query = request.GET.get('search', '')
    departement_filter = request.GET.get('departement', '')
    
    employees = Employee.objects.filter(actif=True)
    
    if search_query:
        employees = employees.filter(
            Q(nom__icontains=search_query) |
            Q(prenom__icontains=search_query)
        )
    
    if departement_filter:
        employees = employees.filter(departement=departement_filter)
    
    context = {
        'employees': employees,
        'departements': dict(Employee.DEPARTEMENT_CHOICES),
        'search_query': search_query,
        'departement_filter': departement_filter,
    }
    return render(request, 'employees/planning_list.html', context)

@login_required
@admin_or_hr_required
def planning_edit(request, employee_id):
    """Vue pour éditer le planning d'un employé"""
    employee = get_object_or_404(Employee, pk=employee_id)
    
    if request.method == 'POST':
        form = PlanningForm(request.POST, instance=employee)
        if form.is_valid():
            form.save()
            messages.success(request, f'Planning mis à jour pour {employee.nom_complet}')
            return redirect('employees:planning_list')
    else:
        form = PlanningForm(instance=employee)
    
    context = {
        'form': form,
        'employee': employee,
    }
    return render(request, 'employees/planning_edit.html', context)

@login_required
@admin_or_hr_required
def planning_batch_edit(request):
    """Vue pour éditer plusieurs plannings en même temps"""
    if request.method == 'POST':
        employee_ids = request.POST.getlist('employee_ids')
        horaire_debut = request.POST.get('horaire_debut')
        horaire_fin = request.POST.get('horaire_fin')
        pause_debut = request.POST.get('pause_debut')
        pause_fin = request.POST.get('pause_fin')
        statut = request.POST.get('statut')
        
        employees = Employee.objects.filter(id_employe__in=employee_ids)
        
        for employee in employees:
            if horaire_debut: employee.horaire_debut = horaire_debut
            if horaire_fin: employee.horaire_fin = horaire_fin
            if pause_debut: employee.pause_debut = pause_debut
            if pause_fin: employee.pause_fin = pause_fin
            if statut: employee.statut = statut
            employee.save()
        
        messages.success(request, f'Planning mis à jour pour {len(employees)} employés')
        return redirect('employees:planning_list')
    
    return redirect('employees:planning_list')
