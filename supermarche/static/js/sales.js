'use strict';

// Module Sales
const Sales = {
    // État de l'application
    state: {
        cart: [],
        currentTransaction: null,
        products: [],
        promotions: [],
        customers: []
    },

    // Fonctions utilitaires
    fmt(v) {
        return (v || 0).toLocaleString('fr-FR');
    },
    
    formatPrice(v) {
        const amount = (v || 0).toLocaleString('fr-FR', { 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 0 
        });
        return amount + ' FCFA';
    },

    // Navigation
    gotoPOS() {
        window.location.href = '/sales/pos/';
    },
    
    gotoDashboard() {
        window.location.href = '/sales/';
    },
    
    gotoPOSInterface() {
        window.location.href = '/sales/pos/interface/';
    },

    // Chargement des données
    async loadTransactions() {
        const res = await fetch('/api/sales/transactions/');
        return await res.json();
    },
    
    async loadProducts() {
        const res = await fetch('/api/products/');
        return await res.json();
    },
    
    async loadPromotions() {
        const res = await fetch('/api/promotions/');
        return await res.json();
    },
    
    async loadCustomers() {
        const res = await fetch('/api/customers/');
        return await res.json();
    },
    
    async loadCurrentCashier() {
        const res = await fetch('/api/employees/current/');
        return await res.json();
    },

    // Gestion du panier
    addToCart(productId) {
        const product = this.state.products.find(p => p.id_produit === productId);
        if (!product) return;

        const existingItem = this.state.cart.find(item => item.id_produit === productId);
        if (existingItem) {
            existingItem.quantite += 1;
            existingItem.sous_total = existingItem.prix_unitaire * existingItem.quantite;
        } else {
            this.state.cart.push({
                id_produit: productId,
                nom: product.nom,
                prix_unitaire: product.prix_unitaire,
                quantite: 1,
                sous_total: product.prix_unitaire
            });
        }
        
        this.updateCartTotals();
        this.renderCart();
    },

    removeFromCart(productId) {
        this.state.cart = this.state.cart.filter(item => item.id_produit !== productId);
        this.updateCartTotals();
        this.renderCart();
    },

    updateCartQuantity(productId, quantity) {
        const item = this.state.cart.find(item => item.id_produit === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantite = quantity;
                item.sous_total = item.prix_unitaire * quantity;
                this.updateCartTotals();
                this.renderCart();
            }
        }
    },

    updateCartTotals() {
        const montantBrut = this.state.cart.reduce((sum, item) => sum + item.sous_total, 0);
        const montantRemises = 0; // À calculer selon les promotions
        const montantNet = montantBrut - montantRemises;
        const montantTVA = montantNet * 0.20; // 20% TVA

        this.state.cartTotals = {
            montant_brut: montantBrut,
            montant_remises: montantRemises,
            montant_net: montantNet,
            montant_tva: montantTVA
        };
    },

    clearCart() {
        this.state.cart = [];
        this.state.cartTotals = null;
        this.renderCart();
        document.getElementById('pos-customer')?.value = '';
        document.getElementById('pos-promotion')?.value = '';
        document.getElementById('pos-payment-method')?.value = '';
    },

    // Rendu de l'interface
    renderProducts(products) {
        const tbody = document.getElementById('pos-products-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${p.nom}</td>
                <td class="text-end">${this.formatPrice(p.prix_unitaire)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-primary" onclick="window.Sales.addToCart(${p.id_produit})">
                        <i class="fas fa-plus"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderCart() {
        const tbody = document.getElementById('pos-cart-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        this.state.cart.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.nom}</td>
                <td class="text-center">
                    <div class="input-group input-group-sm">
                        <button class="btn btn-outline-secondary" onclick="window.Sales.updateCartQuantity(${item.id_produit}, ${item.quantite - 1})">-</button>
                        <input type="number" class="form-control text-center" value="${item.quantite}" 
                               onchange="window.Sales.updateCartQuantity(${item.id_produit}, parseInt(this.value))" min="1">
                        <button class="btn btn-outline-secondary" onclick="window.Sales.updateCartQuantity(${item.id_produit}, ${item.quantite + 1})">+</button>
                    </div>
                </td>
                <td class="text-end">${this.formatPrice(item.prix_unitaire)}</td>
                <td class="text-end">${this.formatPrice(item.sous_total)}</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-outline-danger" onclick="window.Sales.removeFromCart(${item.id_produit})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Update totals
        if (this.state.cartTotals) {
            document.getElementById('pos-montant-brut')?.textContent = this.formatPrice(this.state.cartTotals.montant_brut);
            document.getElementById('pos-montant-remises')?.textContent = this.formatPrice(this.state.cartTotals.montant_remises);
            document.getElementById('pos-montant-net')?.textContent = this.formatPrice(this.state.cartTotals.montant_net);
            document.getElementById('pos-montant-tva')?.textContent = this.formatPrice(this.state.cartTotals.montant_tva);
        }
    },

    // Initialisation du dashboard
    async initPOSDashboard() {
        try {
            console.log('Chargement des données du tableau de bord...');
            const [transactions, cashier] = await Promise.all([
                this.loadTransactions(),
                this.loadCurrentCashier()
            ]);

            console.log('Données reçues:', { transactions, cashier });

            // Filtrer les transactions du caissier courant et terminées
            const cashierTransactions = transactions.filter(t => 
                t.id_caissier === cashier.id_employe && t.statut === 'terminee'
            );
            console.log('Transactions du caissier:', cashierTransactions);

            // Date du jour (sans l'heure)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Ventes du jour
            const todayTransactions = cashierTransactions.filter(t => {
                const transDate = new Date(t.date_transaction);
                transDate.setHours(0, 0, 0, 0);
                return transDate.getTime() === today.getTime();
            });
            console.log('Transactions du jour:', todayTransactions);
            
            // Calculs
            const todaySales = todayTransactions.reduce((sum, t) => sum + parseFloat(t.montant_final || 0), 0);
            const totalTransactions = cashierTransactions.length;
            const totalSales = cashierTransactions.reduce((sum, t) => sum + parseFloat(t.montant_final || 0), 0);
            const averageBasket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
            
            // Compter les articles vendus
            const totalItems = cashierTransactions.reduce((sum, t) => {
                if (t.lignes && Array.isArray(t.lignes)) {
                    return sum + t.lignes.reduce((s, l) => s + (l.quantite || 0), 0);
                }
                return sum;
            }, 0);

            console.log('KPIs calculés:', {
                todaySales,
                totalTransactions,
                averageBasket,
                totalItems
            });

            // Mise à jour des KPIs
            document.getElementById('kpi-sales')?.textContent = this.formatPrice(todaySales);
            document.getElementById('kpi-transactions')?.textContent = this.fmt(totalTransactions);
            document.getElementById('kpi-average')?.textContent = this.formatPrice(averageBasket);
            document.getElementById('kpi-items')?.textContent = this.fmt(totalItems);

            // Ajout du nom du caissier
            const cashierName = cashier.nom && cashier.prenom 
                ? `${cashier.prenom} ${cashier.nom}` 
                : cashier.nom || 'Caissier';
            document.getElementById('cashier-name')?.textContent = cashierName;
            
            console.log('Dashboard initialisé avec succès');
        } catch(e) { 
            console.error('Dashboard error:', e);
            alert('Erreur lors du chargement des données: ' + e.message);
        }
    },

    // Initialisation de l'interface POS
    async initPOSInterface() {
        try {
            console.log('Initialisation de l\'interface POS...');
            const [products, promotions, customers] = await Promise.all([
                this.loadProducts(),
                this.loadPromotions(),
                this.loadCustomers()
            ]);

            this.state.products = products;
            this.state.promotions = promotions;
            this.state.customers = customers;

            console.log('Données chargées:', {
                products: products.length,
                promotions: promotions.length,
                customers: customers.length
            });

            // Rendu initial
            this.renderProducts(products);
            this.renderCart();

            // Event listeners
            document.getElementById('pos-search')?.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                const filtered = products.filter(p => p.nom.toLowerCase().includes(query));
                this.renderProducts(filtered);
            });

            document.getElementById('pos-clear')?.addEventListener('click', () => this.clearCart());
            document.getElementById('pos-pay')?.addEventListener('click', () => this.processPayment());

            console.log('Interface POS initialisée avec succès');
        } catch(e) {
            console.error('POS interface error:', e);
            alert('Erreur lors du chargement des données: ' + e.message);
        }
    },

    // Traitement du paiement
    async processPayment() {
        try {
            if (this.state.cart.length === 0) {
                alert('Le panier est vide');
                return;
            }

            const paymentMethod = document.getElementById('pos-payment-method')?.value;
            if (!paymentMethod) {
                alert('Veuillez sélectionner un mode de paiement');
                return;
            }

            const transactionData = {
                id_client: document.getElementById('pos-customer')?.value || null,
                id_promotion: document.getElementById('pos-promotion')?.value || null,
                mode_paiement: paymentMethod,
                lignes: this.state.cart.map(item => ({
                    id_produit: item.id_produit,
                    quantite: item.quantite,
                    prix_unitaire: item.prix_unitaire,
                    sous_total: item.sous_total
                })),
                montant_brut: this.state.cartTotals.montant_brut,
                montant_remises: this.state.cartTotals.montant_remises,
                montant_net: this.state.cartTotals.montant_net,
                montant_tva: this.state.cartTotals.montant_tva
            };

            const response = await fetch('/api/sales/transactions/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
                },
                body: JSON.stringify(transactionData)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`Transaction réussie !\nTicket : ${result.numero_ticket}\nTotal : ${this.formatPrice(result.montant_final)}`);
                this.clearCart();
                // Rafraîchir les KPIs
                await this.initPOSDashboard();
            } else {
                const error = await response.text();
                alert('Erreur lors du paiement : ' + error);
            }
        } catch (e) {
            console.error('Payment error:', e);
            alert('Erreur lors du traitement du paiement');
        }
    },

    // Méthode générique d'initialisation
    async initDashboard() {
        console.log('Initialisation du dashboard...');
        await this.initPOSDashboard();
    }
};

// Initialisation après chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    // Exposer l'objet Sales globalement
    window.Sales = Sales;

    const currentPage = window.location.pathname;
    console.log('Page courante:', currentPage);
    
    if (currentPage.includes('/sales/pos/')) {
        console.log('Initialisation du POS...');
        if (currentPage.includes('/interface/')) {
            Sales.initPOSInterface();
        } else {
            Sales.initPOSDashboard();
        }
    }
});