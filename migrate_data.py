"""
Script de migration des données JSON vers la base de données Django
Exécuter avec : python migrate_data.py
"""

import os
import sys
import django
import json
from datetime import datetime, date

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'supermarche.settings')
django.setup()

# Imports des modèles
from products.models import Category, Product
from customers.models import Client, LoyaltyCard
from employees.models import Employee, LeaveRequest, PerformanceReview
from suppliers.models import Supplier
from sales.models import CashRegister, Transaction, TransactionLine, Payment


def load_json(filename):
    """Charge un fichier JSON"""
    filepath = os.path.join('supermarche', 'static', 'data', filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def migrate_categories():
    """Migre les catégories"""
    print("📦 Migration des catégories...")
    data = load_json('categories.json')
    
    for item in data:
        Category.objects.get_or_create(
            id_categorie=item['id_categorie'],
            defaults={
                'nom': item['nom'],
                'description': item.get('description', ''),
                'actif': item.get('actif', True)
            }
        )
    print(f"   ✅ {len(data)} catégories migrées")


def migrate_products():
    """Migre les produits"""
    print("🛒 Migration des produits...")
    data = load_json('products.json')
    
    for item in data:
        # Récupérer la catégorie
        category = None
        if item.get('id_categorie'):
            try:
                category = Category.objects.get(id_categorie=item['id_categorie'])
            except Category.DoesNotExist:
                pass
        
        Product.objects.get_or_create(
            id_produit=item['id_produit'],
            defaults={
                'nom': item['nom'],
                'description': item.get('description', ''),
                'code_barre': item.get('code_barre'),
                'prix_unitaire': item['prix_unitaire'],
                'prix_achat': item.get('prix_achat'),
                'stock': item.get('stock', 0),
                'seuil_reapprovisionnement': item.get('seuil_reapprovisionnement', 10),
                'id_categorie': category,
                'est_perissable': item.get('est_perissable', False),
                'unite_mesure': item.get('unite_mesure', 'unité'),
                'actif': item.get('actif', True)
            }
        )
    print(f"   ✅ {len(data)} produits migrés")


def migrate_clients():
    """Migre les clients"""
    print("👥 Migration des clients...")
    data = load_json('customers.json')
    
    for item in data:
        # Séparer le nom complet en nom et prénom
        name_parts = item['name'].split(' ', 1)
        nom = name_parts[0] if len(name_parts) > 0 else 'Client'
        prenom = name_parts[1] if len(name_parts) > 1 else ''
        
        client, created = Client.objects.get_or_create(
            id_client=item['id'],
            defaults={
                'nom': nom,
                'prenom': prenom,
                'email': item['email'],
                'telephone': '+225 07 00 00 00',  # Téléphone par défaut
                'adresse': '',
                'ville': 'Abidjan',
                'actif': item.get('active', True)
            }
        )
        
        # Créer la carte de fidélité si elle n'existe pas
        if created or not hasattr(client, 'carte_fidelite'):
            LoyaltyCard.objects.get_or_create(
                id_client=client,
                defaults={
                    'points': item.get('points', 0),
                    'niveau': 'bronze',
                    'actif': True
                }
            )
    print(f"   ✅ {len(data)} clients migrés")


def migrate_employees():
    """Migre les employés"""
    print("👔 Migration des employés...")
    data = load_json('employees.json')
    
    # Mapping des rôles
    role_mapping = {
        'Caissier': 'caissier',
        'Rayon': 'rayon',
        'Logistique': 'logistique',
        'Manager': 'manager',
        'RH': 'rh',
        'Sécurité': 'securite'
    }
    
    for item in data:
        # Séparer le nom complet
        name_parts = item['name'].split(' ', 1)
        nom = name_parts[0] if len(name_parts) > 0 else 'Employé'
        prenom = name_parts[1] if len(name_parts) > 1 else ''
        
        Employee.objects.get_or_create(
            id_employe=item['id'],
            defaults={
                'nom': nom,
                'prenom': prenom,
                'email': item['email'],
                'telephone': '+225 07 00 00 00',
                'adresse': '',
                'date_naissance': date(1990, 1, 1),
                'date_embauche': date(2024, 1, 1),
                'poste': role_mapping.get(item['role'], 'caissier'),
                'salaire': 200000,
                'actif': item.get('active', True)
            }
        )
    print(f"   ✅ {len(data)} employés migrés")


def migrate_leaves():
    """Migre les demandes de congés"""
    print("🏖️ Migration des demandes de congés...")
    data = load_json('leaves.json')
    
    for item in data:
        try:
            employee = Employee.objects.get(id_employe=item['id_employe'])
            
            LeaveRequest.objects.get_or_create(
                id_demande=item['id_demande'],
                defaults={
                    'id_employe': employee,
                    'date_debut': datetime.strptime(item['date_debut'], '%Y-%m-%d').date(),
                    'date_fin': datetime.strptime(item['date_fin'], '%Y-%m-%d').date(),
                    'duree_jours': item['duree_jours'],
                    'type': item['type'].replace(' ', '_').replace('é', 'e').lower(),
                    'motif': item['motif'],
                    'statut': item['statut'],
                    'valideur': item.get('valideur'),
                    'commentaire': item.get('commentaire', '')
                }
            )
        except Employee.DoesNotExist:
            print(f"   ⚠️ Employé {item['id_employe']} non trouvé pour congé {item['id_demande']}")
    
    print(f"   ✅ {len(data)} demandes de congés migrées")


def migrate_reviews():
    """Migre les évaluations de performance"""
    print("📈 Migration des évaluations...")
    data = load_json('reviews.json')
    
    for item in data:
        try:
            employee = Employee.objects.get(id_employe=item['id_employe'])
            
            # Extraire les scores de compétences
            competences = item.get('competences', {})
            
            PerformanceReview.objects.get_or_create(
                id_evaluation=item['id_evaluation'],
                defaults={
                    'id_employe': employee,
                    'periode': item['periode'],
                    'date_evaluation': datetime.strptime(item['date_evaluation'], '%Y-%m-%d').date(),
                    'evaluateur': item['evaluateur'],
                    'score_global': item['score_global'],
                    'score_ponctualite': competences.get('ponctualite'),
                    'score_qualite_travail': competences.get('qualite_travail'),
                    'score_relationnel': competences.get('relationnel'),
                    'score_autonomie': competences.get('autonomie'),
                    'points_forts': item.get('points_forts', ''),
                    'points_amelioration': item.get('points_amelioration', ''),
                    'objectifs': item.get('objectifs', ''),
                    'commentaire': item.get('commentaire', '')
                }
            )
        except Employee.DoesNotExist:
            print(f"   ⚠️ Employé {item['id_employe']} non trouvé pour évaluation {item['id_evaluation']}")
    
    print(f"   ✅ {len(data)} évaluations migrées")


def migrate_suppliers():
    """Migre les fournisseurs"""
    print("🚚 Migration des fournisseurs...")
    data = load_json('suppliers.json')
    
    for item in data:
        Supplier.objects.get_or_create(
            id_fournisseur=item['id_fournisseur'],
            defaults={
                'nom': item['nom'],
                'email': item['email'],
                'telephone': item['telephone'],
                'adresse': item['adresse'],
                'ville': item['ville'],
                'pays': item.get('pays', 'Côte d\'Ivoire'),
                'delai_livraison_jours': item['delai_livraison_jours'],
                'montant_commande_min': item['montant_commande_min'],
                'conditions_paiement': item['conditions_paiement'],
                'nb_commandes_total': item.get('nb_commandes_total', 0),
                'montant_total_achats': item.get('montant_total_achats', 0),
                'statut': item.get('statut', 'actif'),
                'notes': item.get('notes', '')
            }
        )
    print(f"   ✅ {len(data)} fournisseurs migrés")


def migrate_cash_registers():
    """Crée les caisses"""
    print("💰 Création des caisses...")
    
    caisses = [
        {'numero_caisse': 'CAISSE-01', 'emplacement': 'Entrée principale'},
        {'numero_caisse': 'CAISSE-02', 'emplacement': 'Sortie rapide'},
        {'numero_caisse': 'CAISSE-03', 'emplacement': 'Zone centrale'},
    ]
    
    for caisse in caisses:
        CashRegister.objects.get_or_create(
            numero_caisse=caisse['numero_caisse'],
            defaults={'emplacement': caisse['emplacement'], 'actif': True}
        )
    
    print(f"   ✅ {len(caisses)} caisses créées")


def main():
    """Fonction principale"""
    print("\n" + "="*60)
    print("🚀 MIGRATION DES DONNÉES JSON → BASE DE DONNÉES")
    print("="*60 + "\n")
    
    try:
        migrate_categories()
        migrate_products()
        migrate_clients()
        migrate_employees()
        migrate_leaves()
        migrate_reviews()
        migrate_suppliers()
        migrate_cash_registers()
        
        print("\n" + "="*60)
        print("✅ MIGRATION TERMINÉE AVEC SUCCÈS !")
        print("="*60 + "\n")
        
        # Afficher les statistiques
        print("📊 STATISTIQUES :")
        print(f"   Catégories : {Category.objects.count()}")
        print(f"   Produits : {Product.objects.count()}")
        print(f"   Clients : {Client.objects.count()}")
        print(f"   Cartes fidélité : {LoyaltyCard.objects.count()}")
        print(f"   Employés : {Employee.objects.count()}")
        print(f"   Demandes congés : {LeaveRequest.objects.count()}")
        print(f"   Évaluations : {PerformanceReview.objects.count()}")
        print(f"   Fournisseurs : {Supplier.objects.count()}")
        print(f"   Caisses : {CashRegister.objects.count()}")
        print()
        
    except Exception as e:
        print(f"\n❌ ERREUR : {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
