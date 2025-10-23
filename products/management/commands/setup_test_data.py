from django.core.management.base import BaseCommand
from products.models import Category, Product
from decimal import Decimal

class Command(BaseCommand):
    help = 'Crée des données de test pour la boutique'

    def handle(self, *args, **kwargs):
        # Categories
        categories = [
            {'nom': 'Fruits et Légumes', 'description': 'Produits frais'},
            {'nom': 'Boulangerie', 'description': 'Pains et viennoiseries'},
            {'nom': 'Boissons', 'description': 'Sodas et jus'},
        ]
        
        for cat_data in categories:
            cat, created = Category.objects.get_or_create(
                nom=cat_data['nom'],
                defaults={'description': cat_data['description']}
            )
            action = 'créée' if created else 'existante'
            self.stdout.write(f"Catégorie {cat.nom} {action}")
        
        # Products
        products = [
            {
                'nom': 'Bananes',
                'description': 'Bananes fraîches',
                'prix_unitaire': '1000',
                'stock': 50,
                'categorie': 'Fruits et Légumes'
            },
            {
                'nom': 'Pain de campagne',
                'description': 'Pain traditionnel',
                'prix_unitaire': '500',
                'stock': 20,
                'categorie': 'Boulangerie'
            },
            {
                'nom': 'Coca Cola 1.5L',
                'description': 'Bouteille de soda',
                'prix_unitaire': '1200',
                'stock': 100,
                'categorie': 'Boissons'
            },
        ]
        
        for prod_data in products:
            cat = Category.objects.get(nom=prod_data['categorie'])
            prod, created = Product.objects.get_or_create(
                nom=prod_data['nom'],
                defaults={
                    'description': prod_data['description'],
                    'prix_unitaire': Decimal(prod_data['prix_unitaire']),
                    'stock': prod_data['stock'],
                    'id_categorie': cat,
                }
            )
            action = 'créé' if created else 'existant'
            self.stdout.write(f"Produit {prod.nom} {action}")