from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.utils import timezone
from .models import Promotion, Product, Category
from django.db.models import Q

@login_required
def liste_promotions(request):
    """Liste toutes les promotions"""
    promotions_actives = Promotion.objects.filter(
        Q(date_fin__gte=timezone.now().date()) & Q(actif=True)
    )
    promotions_terminees = Promotion.objects.filter(
        Q(date_fin__lt=timezone.now().date()) | Q(actif=False)
    )
    
    context = {
        'promotions_actives': promotions_actives,
        'promotions_terminees': promotions_terminees,
        'titre_page': 'Gestion des Promotions'
    }
    return render(request, 'products/promotions/liste.html', context)

@login_required
def detail_promotion(request, id_promotion):
    """Affiche les détails d'une promotion"""
    promotion = get_object_or_404(Promotion, id_promotion=id_promotion)
    
    context = {
        'promotion': promotion,
        'produits_en_promo': promotion.produits.all(),
        'categories_en_promo': promotion.categories.all(),
        'titre_page': f'Promotion: {promotion.nom}'
    }
    return render(request, 'products/promotions/detail.html', context)

@login_required
def nouvelle_promotion(request):
    """Création d'une nouvelle promotion"""
    if request.method == 'POST':
        # Récupération des données du formulaire
        nom = request.POST.get('nom')
        description = request.POST.get('description')
        type_promotion = request.POST.get('type_promotion')
        valeur = request.POST.get('valeur')
        date_debut = request.POST.get('date_debut')
        date_fin = request.POST.get('date_fin')
        produits_ids = request.POST.getlist('produits')
        categories_ids = request.POST.getlist('categories')
        
        try:
            # Création de la promotion
            promotion = Promotion.objects.create(
                nom=nom,
                description=description,
                type_promotion=type_promotion,
                valeur=valeur,
                date_debut=date_debut,
                date_fin=date_fin
            )
            
            # Ajout des produits et catégories
            if produits_ids:
                promotion.produits.set(Product.objects.filter(id_produit__in=produits_ids))
            if categories_ids:
                promotion.categories.set(Category.objects.filter(id_categorie__in=categories_ids))
            
            messages.success(request, 'Promotion créée avec succès!')
            return redirect('products:detail_promotion', id_promotion=promotion.id_promotion)
            
        except Exception as e:
            messages.error(request, f'Erreur lors de la création de la promotion: {str(e)}')
            
    # GET: Affichage du formulaire
    context = {
        'produits': Product.objects.filter(actif=True),
        'categories': Category.objects.filter(actif=True),
        'types_promotion': Promotion._meta.get_field('type_promotion').choices,
        'titre_page': 'Nouvelle Promotion'
    }
    return render(request, 'products/promotions/form.html', context)

@login_required
def modifier_promotion(request, id_promotion):
    """Modification d'une promotion existante"""
    promotion = get_object_or_404(Promotion, id_promotion=id_promotion)
    
    if request.method == 'POST':
        # Mise à jour des données
        promotion.nom = request.POST.get('nom')
        promotion.description = request.POST.get('description')
        promotion.type_promotion = request.POST.get('type_promotion')
        promotion.valeur = request.POST.get('valeur')
        promotion.date_debut = request.POST.get('date_debut')
        promotion.date_fin = request.POST.get('date_fin')
        promotion.actif = request.POST.get('actif') == 'on'
        
        try:
            promotion.save()
            
            # Mise à jour des relations
            produits_ids = request.POST.getlist('produits')
            categories_ids = request.POST.getlist('categories')
            
            promotion.produits.set(Product.objects.filter(id_produit__in=produits_ids))
            promotion.categories.set(Category.objects.filter(id_categorie__in=categories_ids))
            
            messages.success(request, 'Promotion mise à jour avec succès!')
            return redirect('products:detail_promotion', id_promotion=promotion.id_promotion)
            
        except Exception as e:
            messages.error(request, f'Erreur lors de la mise à jour: {str(e)}')
    
    # GET: Affichage du formulaire pré-rempli
    context = {
        'promotion': promotion,
        'produits': Product.objects.filter(actif=True),
        'categories': Category.objects.filter(actif=True),
        'types_promotion': Promotion._meta.get_field('type_promotion').choices,
        'titre_page': f'Modifier: {promotion.nom}'
    }
    return render(request, 'products/promotions/form.html', context)
