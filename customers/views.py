from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.contrib import messages
from .models import Client, LoyaltyCard, LoyaltyTransaction
from django.db.models import Count, Avg, Sum, F
from django.utils import timezone
from datetime import timedelta

@login_required
def gestion_fidelite(request):
    """Vue pour la gestion du programme de fidélité"""
    # Statistiques générales de fidélité
    cartes = LoyaltyCard.objects.all()
    stats_fidelite = {
        'total_cartes': cartes.count(),
        'cartes_actives': cartes.filter(actif=True).count(),
        'points_total': cartes.aggregate(total=Sum('points'))['total'] or 0,
        'moyenne_points': cartes.filter(actif=True).aggregate(avg=Avg('points'))['avg'] or 0,
        'distribution_niveaux': {
            'bronze': cartes.filter(niveau='bronze').count(),
            'argent': cartes.filter(niveau='argent').count(),
            'or': cartes.filter(niveau='or').count(),
            'platine': cartes.filter(niveau='platine').count(),
        }
    }
    
    # Transactions récentes
    transactions_recentes = LoyaltyTransaction.objects.select_related('id_carte__id_client')[:10]
    
    context = {
        'stats_fidelite': stats_fidelite,
        'transactions_recentes': transactions_recentes,
        'titre_page': 'Gestion de la Fidélité'
    }
    
    return render(request, 'customers/gestion_fidelite.html', context)

@login_required
def detail_carte_fidelite(request, id_client):
    """Vue détaillée d'une carte de fidélité"""
    client = get_object_or_404(Client, id_client=id_client)
    carte = get_object_or_404(LoyaltyCard, id_client=client)
    
    # Historique des transactions
    transactions = carte.transactions.all()[:20]
    
    context = {
        'client': client,
        'carte': carte,
        'transactions': transactions,
        'titre_page': f'Carte de Fidélité - {client.nom_complet}'
    }
    
    return render(request, 'customers/detail_carte_fidelite.html', context)

@login_required
def ajouter_points(request, id_client):
    """Ajouter des points à un client"""
    if request.method == 'POST':
        client = get_object_or_404(Client, id_client=id_client)
        carte = get_object_or_404(LoyaltyCard, id_client=client)
        
        points = int(request.POST.get('points', 0))
        description = request.POST.get('description', '')
        montant = request.POST.get('montant', None)
        
        if points > 0:
            # Enregistrer la transaction
            transaction = LoyaltyTransaction.objects.create(
                id_carte=carte,
                type_transaction='gain',
                points=points,
                points_avant=carte.points,
                points_apres=carte.points + points,
                description=description,
                reference_vente=montant
            )
            
            # Mettre à jour les points de la carte
            carte.ajouter_points(points)
            messages.success(request, f"{points} points ajoutés avec succès à {client.nom_complet}")
        
        return redirect('customers:detail_carte_fidelite', id_client=id_client)
    
    return redirect('customers:liste_clients')

@login_required
def retirer_points(request, id_client):
    """Retirer des points à un client"""
    if request.method == 'POST':
        client = get_object_or_404(Client, id_client=id_client)
        carte = get_object_or_404(LoyaltyCard, id_client=client)
        
        points = int(request.POST.get('points', 0))
        description = request.POST.get('description', '')
        
        if points > 0 and carte.points >= points:
            # Enregistrer la transaction
            transaction = LoyaltyTransaction.objects.create(
                id_carte=carte,
                type_transaction='utilisation',
                points=points,
                points_avant=carte.points,
                points_apres=carte.points - points,
                description=description
            )
            
            # Mettre à jour les points de la carte
            if carte.retirer_points(points):
                messages.success(request, f"{points} points retirés avec succès de {client.nom_complet}")
            else:
                messages.error(request, "Points insuffisants")
        else:
            messages.error(request, "Points insuffisants ou montant invalide")
        
        return redirect('customers:detail_carte_fidelite', id_client=id_client)
    
    return redirect('customers:liste_clients')

@login_required
def dashboard_clients(request):
    """Vue pour le dashboard administrateur des clients"""
    # Récupération des données de base
    tous_clients = Client.objects.all()
    clients_actifs = tous_clients.filter(actif=True)
    
    # Statistiques générales
    stats = {
        'total_inscrits': tous_clients.count(),
        'clients_actifs': clients_actifs.count(),
        'nouveaux_clients': tous_clients.filter(
            date_inscription__gte=timezone.now() - timedelta(days=30)
        ).count(),
        'clients_par_ville': clients_actifs.values('ville')
                                        .annotate(total=Count('id_client'))
                                        .order_by('-total')[:5]
    }
    
    # Calcul des taux
    if stats['total_inscrits'] > 0:
        stats['taux_activite'] = (stats['clients_actifs'] / stats['total_inscrits']) * 100
    else:
        stats['taux_activite'] = 0
        
    context = {
        'stats': stats,
        'titre_page': 'Dashboard Clients'
    }
    
    return render(request, 'customers/dashboard.html', context)

@login_required
def liste_clients(request):
    """Vue pour afficher la liste des clients"""
    # Récupération de tous les clients actifs
    clients = Client.objects.filter(actif=True)
    
    # Statistiques de base
    total_clients = clients.count()
    clients_par_ville = clients.values('ville').annotate(total=Count('id_client'))
    
    context = {
        'clients': clients,
        'total_clients': total_clients,
        'clients_par_ville': clients_par_ville,
        'titre_page': 'Liste des Clients'
    }
    
    return render(request, 'customers/liste_clients.html', context)
