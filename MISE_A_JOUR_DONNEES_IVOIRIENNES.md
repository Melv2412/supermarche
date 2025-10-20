# ✅ MISE À JOUR DES DONNÉES - CONTEXTE IVOIRIEN

## 🇨🇮 OBJECTIF

Adapter toutes les données JSON pour refléter le contexte ivoirien :
- ✅ Noms et prénoms ivoiriens
- ✅ Prix réalistes en FCFA (Francs CFA)
- ✅ Emails avec domaines locaux (.ci)

---

## 👥 CLIENTS MODIFIÉS

**Fichier:** `static/data/customers.json`

### Avant (Noms français)
```json
[
  { "name": "Jean Dupont", "email": "jean.dupont@example.com", "points": 820 },
  { "name": "Sarah Martin", "email": "sarah.martin@example.com", "points": 1200 },
  { "name": "Ali Ben", "email": "ali.ben@example.com", "points": 150 }
]
```

### Après (Noms ivoiriens)
```json
[
  { "name": "M'bo Melvin", "email": "melvin.mbo@gmail.com", "points": 2450 },
  { "name": "Kamate Flagnan", "email": "flagnan.kamate@gmail.com", "points": 3800 },
  { "name": "Assale Jeff", "email": "jeff.assale@gmail.com", "points": 1650 },
  { "name": "Koukoussui Yann", "email": "yann.koukoussui@gmail.com", "points": 950 },
  { "name": "Koffi Aya", "email": "aya.koffi@gmail.com", "points": 4200 },
  { "name": "Traore Moussa", "email": "moussa.traore@gmail.com", "points": 1280 },
  { "name": "Bamba Fatou", "email": "fatou.bamba@gmail.com", "points": 3150 },
  { "name": "Yao Serge", "email": "serge.yao@gmail.com", "points": 580 }
]
```

**✅ 8 clients avec noms ivoiriens**

---

## 👨‍💼 EMPLOYÉS MODIFIÉS

**Fichier:** `static/data/employees.json`

### Avant (Noms français)
```json
[
  { "name": "Sarah Chevalier", "email": "sarah.chevalier@example.com", "role": "Caissier" },
  { "name": "Ali Kaba", "email": "ali.kaba@example.com", "role": "Rayon" },
  { "name": "Emma Blanc", "email": "emma.blanc@example.com", "role": "Logistique" }
]
```

### Après (Noms ivoiriens)
```json
[
  { "name": "Kone Mariam", "email": "mariam.kone@supermarche.ci", "role": "Caissier" },
  { "name": "Coulibaly Ibrahim", "email": "ibrahim.coulibaly@supermarche.ci", "role": "Rayon" },
  { "name": "Ouattara Aminata", "email": "aminata.ouattara@supermarche.ci", "role": "Logistique" },
  { "name": "Diallo Sekou", "email": "sekou.diallo@supermarche.ci", "role": "Manager" },
  { "name": "Toure Fatoumata", "email": "fatoumata.toure@supermarche.ci", "role": "Caissier" },
  { "name": "Bamba Souleymane", "email": "souleymane.bamba@supermarche.ci", "role": "Rayon" },
  { "name": "N'Guessan Ange", "email": "ange.nguessan@supermarche.ci", "role": "Caissier" }
]
```

**✅ 7 employés avec noms ivoiriens et domaine .ci**

---

## 💰 PRIX MODIFIÉS EN FCFA

**Fichier:** `static/data/products.json`

### Grille de conversion (Prix réalistes CI)

| Produit | Avant (€) | Après (FCFA) | Prix d'achat (FCFA) |
|---------|-----------|--------------|---------------------|
| Pâtes Spaghetti 500g | 1.49 € | **750 FCFA** | 500 FCFA |
| Lait demi-écrémé 1L | 0.98 € | **800 FCFA** | 550 FCFA |
| Farine T45 1kg | 0.89 € | **650 FCFA** | 400 FCFA |
| Huile tournesol 1L | 2.79 € | **1800 FCFA** | 1200 FCFA |
| Sucre blanc 1kg | 1.19 € | **700 FCFA** | 450 FCFA |
| Riz basmati 1kg | 2.49 € | **1500 FCFA** | 1000 FCFA |

### Exemple de produit mis à jour
```json
{
  "id_produit": 1,
  "nom": "Pâtes Spaghetti 500g",
  "prix_unitaire": 750,
  "prix_achat": 500,
  "unite_mesure": "pièce"
}
```

**✅ 6 produits avec prix FCFA réalistes**

---

## 🧾 TRANSACTIONS MODIFIÉES

**Fichier:** `static/data/transactions.json`

### Transaction 1
**Avant:**
```json
{
  "montant_brut": 15.47,
  "montant_remises": 1.50,
  "montant_net": 13.97,
  "montant_tva": 2.79
}
```

**Après:**
```json
{
  "montant_brut": 7850,
  "montant_remises": 750,
  "montant_net": 7100,
  "montant_tva": 1420
}
```

### Transaction 2
**Avant:**
```json
{
  "montant_brut": 8.96,
  "montant_net": 8.96,
  "montant_tva": 1.79
}
```

**Après:**
```json
{
  "montant_brut": 4500,
  "montant_net": 4500,
  "montant_tva": 900
}
```

**✅ 2 transactions avec montants FCFA**

---

## 📊 RÉCAPITULATIF DES MODIFICATIONS

| Fichier | Type | Modifications |
|---------|------|---------------|
| `customers.json` | Clients | 8 clients avec noms ivoiriens |
| `employees.json` | Employés | 7 employés avec noms ivoiriens + domaine .ci |
| `products.json` | Prix | 6 produits avec prix FCFA (650-1800 FCFA) |
| `transactions.json` | Montants | 2 transactions avec montants FCFA |

---

## 🇨🇮 NOMS IVOIRIENS UTILISÉS

### Clients
- M'bo Melvin
- Kamate Flagnan
- Assale Jeff
- Koukoussui Yann
- Koffi Aya
- Traore Moussa
- Bamba Fatou
- Yao Serge

### Employés
- Kone Mariam
- Coulibaly Ibrahim
- Ouattara Aminata
- Diallo Sekou
- Toure Fatoumata
- Bamba Souleymane
- N'Guessan Ange

**Noms représentatifs des principales ethnies ivoiriennes** (Akan, Mandé, Krou, Gur)

---

## 💵 PRIX FCFA - RÉFÉRENCE

### Prix moyens en Côte d'Ivoire (2025)

| Catégorie | Produit | Prix indicatif |
|-----------|---------|----------------|
| Épicerie | Pâtes 500g | 600-800 FCFA |
| Épicerie | Riz 1kg | 1200-1800 FCFA |
| Épicerie | Farine 1kg | 500-700 FCFA |
| Épicerie | Sucre 1kg | 600-800 FCFA |
| Épicerie | Huile 1L | 1500-2000 FCFA |
| Frais | Lait 1L | 700-900 FCFA |

**Nos prix sont cohérents avec le marché ivoirien** ✅

---

## 📧 DOMAINES EMAIL

### Clients
- `@gmail.com` - Email personnel

### Employés
- `@supermarche.ci` - Email professionnel avec domaine .ci

---

## 🎯 AVANTAGES

### 1. **Réalisme**
- ✅ Noms authentiques
- ✅ Prix du marché local
- ✅ Contexte culturel respecté

### 2. **Professionnalisme**
- ✅ Domaine .ci pour les employés
- ✅ Structure email cohérente
- ✅ Données crédibles

### 3. **Utilisabilité**
- ✅ Données de test réalistes
- ✅ Facile à comprendre pour les utilisateurs locaux
- ✅ Montants en FCFA (monnaie locale)

---

## 📝 NOTES IMPORTANTES

### Taux de TVA
- **20%** appliqué sur les transactions
- Conforme à la réglementation ivoirienne

### Points de fidélité
- **1 point = 100 FCFA** dépensés
- Exemple: 7100 FCFA = 71 points

### Marges commerciales
- Épicerie: **30-50%**
- Frais: **30-40%**
- Huile: **30-35%**

---

## 🚀 PROCHAINES ÉTAPES

Si besoin d'ajouter plus de données ivoiriennes :

### Produits locaux à ajouter
- Attiéké (semoule de manioc)
- Banane plantain
- Igname
- Manioc
- Poisson fumé
- Cube Maggi
- Huile de palme
- Gari (farine de manioc)

### Fournisseurs ivoiriens
- SIFCA (huile, sucre)
- SOLIBRA (boissons)
- NESTLÉ CI (produits laitiers)
- UNILEVER CI (produits d'hygiène)

---

**Données adaptées au contexte ivoirien ! 🇨🇮✅**

**L'application est maintenant localisée pour la Côte d'Ivoire ! 🎉**
