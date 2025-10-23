from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('id_client', 'nom', 'prenom', 'email', 'telephone', 'ville', 'actif', 'date_inscription')
    list_filter = ('actif', 'ville', 'date_inscription')
    search_fields = ('nom', 'prenom', 'email', 'telephone')
    ordering = ('nom', 'prenom')
    date_hierarchy = 'date_inscription'
    list_per_page = 20
