from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count, Avg, F
from django.db.models.functions import TruncDate, ExtractHour
from django.utils import timezone
from datetime import timedelta
from .models import Transaction, CashRegister
from products.models import Product

@login_required
def dashboard_ventes(request):
    """Vue d'ensemble des ventes"""
    aujourd_hui = timezone.now().date()
    debut_mois = aujourd_hui.replace(day=1)
    hier = aujourd_hui - timedelta(days=1)
    debut_annee = aujourd_hui.replace(month=1, day=1)

    # Statistiques générales
    transactions = Transaction.objects.filter(statut='terminee')
    
    stats = {
        # Ventes du jour
        'ventes_jour': transactions.filter(
            date_transaction__date=aujourd_hui
        ).aggregate(
            total=Sum('montant_total'),
            nombre=Count('id_transaction')
        ),
        
        # Ventes de la veille
        'ventes_veille': transactions.filter(
            date_transaction__date=hier
        ).aggregate(
            total=Sum('montant_total'),
            nombre=Count('id_transaction')
        ),
        
        # Ventes du mois
        'ventes_mois': transactions.filter(
            date_transaction__date__gte=debut_mois
        ).aggregate(
            total=Sum('montant_total'),
            nombre=Count('id_transaction')
        ),
        
        # Moyenne des ventes par jour ce mois-ci
        'moyenne_jour': transactions.filter(
            date_transaction__date__gte=debut_mois
        ).values('date_transaction__date').annotate(
            total=Sum('montant_total')
        ).aggregate(moyenne=Avg('total')),
        
        # Nombre de caisses actives
        'caisses_actives': CashRegister.objects.filter(actif=True).count()
    }

    # Evolution des ventes sur 7 jours
    evolution_ventes = transactions.filter(
        date_transaction__date__gte=aujourd_hui - timedelta(days=7)
    ).values('date_transaction__date').annotate(
        total=Sum('montant_total'),
        transactions=Count('id_transaction')
    ).order_by('date_transaction__date')

    # Heures de pointe (aujourd'hui)
    heures_pointe = transactions.filter(
        date_transaction__date=aujourd_hui
    ).annotate(
        heure=ExtractHour('date_transaction')
    ).values('heure').annotate(
        total=Sum('montant_total'),
        transactions=Count('id_transaction')
    ).order_by('heure')

    # Meilleures ventes du mois
    meilleures_ventes = Product.objects.filter(
        lignes_vente__transaction__date_transaction__date__gte=debut_mois,
        lignes_vente__transaction__statut='terminee'
    ).annotate(
        total_vendu=Sum('lignes_vente__quantite'),
        chiffre_affaires=Sum(F('lignes_vente__quantite') * F('lignes_vente__prix_unitaire'))
    ).order_by('-total_vendu')[:5]

    context = {
        'stats': stats,
        'evolution_ventes': evolution_ventes,
        'heures_pointe': heures_pointe,
        'meilleures_ventes': meilleures_ventes,
        'titre_page': 'Vue d\'ensemble des Ventes'
    }
    
    return render(request, 'sales/dashboard.html', context)
