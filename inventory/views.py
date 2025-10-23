from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from .models import StockItem, MouvementStock, Inventaire, LigneInventaire
from products.models import Product
from datetime import datetime, timedelta

@login_required
def dashboard_stock(request):
    """Vue principale du tableau de bord des stocks"""
    # Récupérer tous les produits et créer des StockItems si nécessaire
    produits = Product.objects.all()
    for produit in produits:
        StockItem.objects.get_or_create(
            produit=produit,
            defaults={
                'quantite': 0,
                'seuil_alerte': 10
            }
        )
    
    # Statistiques générales
    stats = {
        'total_produits': Product.objects.count(),
        'produits_rupture': StockItem.objects.filter(quantite=0).count(),
        'produits_alerte': StockItem.objects.filter(
            quantite__gt=0,
            quantite__lte=F('seuil_alerte')
        ).count()
    }
    
    # Produits en alerte
    alertes = StockItem.objects.filter(
        Q(quantite=0) | Q(quantite__lte=F('seuil_alerte'))
    ).select_related('produit')
    
    # Derniers mouvements
    derniers_mouvements = MouvementStock.objects.select_related(
        'stock__produit'
    )[:10]
    
    context = {
        'stats': stats,
        'alertes': alertes,
        'derniers_mouvements': derniers_mouvements,
        'titre_page': 'Tableau de bord des stocks'
    }
    
    return render(request, 'inventory/dashboard.html', context)

@login_required
def liste_stocks(request):
    """Vue pour la liste complète des stocks"""
    stocks = StockItem.objects.select_related('produit').all()
    
    context = {
        'stocks': stocks,
        'titre_page': 'Liste des stocks'
    }
    
    return render(request, 'inventory/liste_stocks.html', context)

@login_required
def detail_stock(request, id_produit):
    """Vue détaillée d'un stock"""
    stock = get_object_or_404(StockItem.objects.select_related('produit'), 
                            produit__id_produit=id_produit)
    
    # Historique des mouvements
    mouvements = stock.mouvements.all()[:50]
    
    context = {
        'stock': stock,
        'mouvements': mouvements,
        'titre_page': f'Stock - {stock.produit.nom}'
    }
    
    return render(request, 'inventory/detail_stock.html', context)

@login_required
def ajuster_stock(request, id_produit):
    """Vue pour ajuster le stock d'un produit"""
    if request.method == 'POST':
        stock = get_object_or_404(StockItem, produit__id_produit=id_produit)
        quantite = int(request.POST.get('quantite', 0))
        raison = request.POST.get('raison')
        reference = request.POST.get('reference')
        
        stock.ajuster_stock(quantite, raison, reference)
        messages.success(request, "Stock ajusté avec succès")
        
        return redirect('inventory:detail_stock', id_produit=id_produit)
    
    return redirect('inventory:liste_stocks')

@login_required
def nouvel_inventaire(request):
    """Créer une nouvelle session d'inventaire"""
    if request.method == 'POST':
        inventaire = Inventaire.objects.create()
        
        # Créer les lignes d'inventaire pour tous les produits
        stocks = StockItem.objects.all()
        lignes = []
        for stock in stocks:
            ligne = LigneInventaire(
                inventaire=inventaire,
                stock=stock,
                quantite_theorique=stock.quantite,
                quantite_reelle=stock.quantite  # Par défaut, égal au théorique
            )
            lignes.append(ligne)
        
        LigneInventaire.objects.bulk_create(lignes)
        
        return redirect('inventory:inventaire_en_cours', id_inventaire=inventaire.id)
    
    return redirect('inventory:dashboard_stock')

@login_required
def inventaire_en_cours(request, id_inventaire):
    """Gérer un inventaire en cours"""
    inventaire = get_object_or_404(Inventaire, id=id_inventaire, status='en_cours')
    lignes = inventaire.lignes.select_related('stock__produit').all()
    
    if request.method == 'POST':
        # Mettre à jour les quantités réelles
        for ligne in lignes:
            quantite = request.POST.get(f'quantite_{ligne.id}')
            if quantite is not None:
                ligne.quantite_reelle = int(quantite)
                ligne.save()
        
        action = request.POST.get('action')
        if action == 'terminer':
            # Mettre à jour les stocks avec les nouvelles quantités
            for ligne in lignes:
                if ligne.difference != 0:
                    ligne.stock.ajuster_stock(
                        ligne.difference,
                        'inventaire',
                        f'Inventaire #{inventaire.id}'
                    )
            
            inventaire.terminer()
            messages.success(request, "Inventaire terminé avec succès")
            return redirect('inventory:dashboard_stock')
            
        elif action == 'annuler':
            inventaire.annuler()
            messages.warning(request, "Inventaire annulé")
            return redirect('inventory:dashboard_stock')
    
    context = {
        'inventaire': inventaire,
        'lignes': lignes,
        'titre_page': f'Inventaire #{inventaire.id}'
    }
    
    return render(request, 'inventory/inventaire.html', context)
