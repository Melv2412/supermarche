from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Supplier
from security.decorators import role_required

@login_required
@role_required('admin')
def supplier_list(request):
    """Affiche la liste des fournisseurs"""
    return render(request, 'suppliers/supplier_list.html')

@login_required
@role_required('admin')
def supplier_create(request):
    """Affiche le formulaire de création d'un fournisseur"""
    return render(request, 'suppliers/supplier_form.html')

@login_required
@role_required('admin')
def supplier_edit(request, supplier_id):
    """Affiche le formulaire de modification d'un fournisseur"""
    supplier = get_object_or_404(Supplier, id_fournisseur=supplier_id)
    return render(request, 'suppliers/supplier_form.html', {'supplier': supplier})

@login_required
@role_required('admin')
def supplier_detail(request, supplier_id):
    """Affiche les détails d'un fournisseur"""
    supplier = get_object_or_404(Supplier, id_fournisseur=supplier_id)
    return render(request, 'suppliers/supplier_detail.html', {'supplier': supplier})