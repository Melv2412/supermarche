from django.contrib import admin
from .models import Supplier, PurchaseOrder, PurchaseOrderLine, Delivery

class PurchaseOrderLineInline(admin.TabularInline):
    model = PurchaseOrderLine
    extra = 1

@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('numero_commande', 'id_fournisseur', 'date_commande', 'date_livraison_prevue', 'montant_total', 'statut')
    list_filter = ('statut', 'date_commande', 'id_fournisseur')
    search_fields = ('numero_commande', 'id_fournisseur__nom')
    inlines = [PurchaseOrderLineInline]

@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('numero_livraison', 'id_commande', 'date_livraison', 'statut', 'receptionnaire')
    list_filter = ('statut', 'date_livraison')
    search_fields = ('numero_livraison', 'id_commande__numero_commande')

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('nom', 'email', 'telephone', 'ville', 'pays', 'statut')
    list_filter = ('statut', 'ville', 'pays')
    search_fields = ('nom', 'email', 'telephone')
