from django.core.management.base import BaseCommand
from products.models import Product
from inventory.models import StockItem
from django.db import transaction

class Command(BaseCommand):
    help = 'Initialise les stocks pour tous les produits existants'

    def handle(self, *args, **kwargs):
        with transaction.atomic():
            products = Product.objects.all()
            created_count = 0
            
            for product in products:
                stock_item, created = StockItem.objects.get_or_create(
                    produit=product,
                    defaults={
                        'quantite': 0,
                        'seuil_alerte': 10,
                        'emplacement': f'Zone A-{created_count+1}'
                    }
                )
                if created:
                    created_count += 1
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Stock initialisé pour {created_count} nouveaux produits'
                )
            )