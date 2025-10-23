from django.core.management.base import BaseCommand
from products.models import Product
from inventory.models import StockItem, MouvementStock
from django.db import transaction
import random

class Command(BaseCommand):
    help = 'Ajoute des mouvements de stock aléatoires pour test'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            stocks = StockItem.objects.all()
            types_mouvements = ['reception', 'vente', 'ajustement', 'retour']
            
            for stock in stocks:
                # Ajouter un stock initial
                quantite_initiale = random.randint(20, 100)
                stock.quantite = quantite_initiale
                stock.save()
                
                MouvementStock.objects.create(
                    stock=stock,
                    quantite=quantite_initiale,
                    raison='reception',
                    ancienne_quantite=0,
                    nouvelle_quantite=quantite_initiale,
                    reference='INIT-{}'.format(stock.produit.id_produit)
                )
                
                # Ajouter quelques mouvements aléatoires
                for _ in range(random.randint(2, 5)):
                    mouvement_type = random.choice(types_mouvements)
                    if mouvement_type in ['vente', 'ajustement']:
                        quantite = -random.randint(1, 10)
                    else:
                        quantite = random.randint(1, 10)
                    
                    ancienne_quantite = stock.quantite
                    stock.quantite = max(0, stock.quantite + quantite)
                    stock.save()
                    
                    MouvementStock.objects.create(
                        stock=stock,
                        quantite=quantite,
                        raison=mouvement_type,
                        ancienne_quantite=ancienne_quantite,
                        nouvelle_quantite=stock.quantite,
                        reference='TEST-{}'.format(random.randint(1000, 9999))
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Mouvements de stock créés avec succès'
                )
            )