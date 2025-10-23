from django.urls import path
from . import views

app_name = 'inventory'

urlpatterns = [
    path('', views.dashboard_stock, name='dashboard_stock'),
    path('list/', views.liste_stocks, name='liste_stocks'),
    path('detail/<int:id_produit>/', views.detail_stock, name='detail_stock'),
    path('detail/<int:id_produit>/ajuster/', views.ajuster_stock, name='ajuster_stock'),
    path('inventaire/nouveau/', views.nouvel_inventaire, name='nouvel_inventaire'),
    path('inventaire/<int:id_inventaire>/', views.inventaire_en_cours, name='inventaire_en_cours'),
]
