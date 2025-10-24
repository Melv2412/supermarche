const POS = {
    state: {
        products: [],
        cart: []
    },
    searchTimeout: null,
    
    init: function() {
        this.initEventListeners();
        this.loadProducts();
        this.setupKeyboardShortcuts();
        this.initAnimations();
    },

    initEventListeners: function() {
        // Recherche de produits
        document.getElementById('pos-search').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.searchProducts(e.target.value), 300);
        });

        // Actions du panier
        document.getElementById('pos-clear').addEventListener('click', () => this.clearCart());
        document.getElementById('pos-pay').addEventListener('click', () => this.processSale());
    },

    setupKeyboardShortcuts: function() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                this.scanBarcode();
            } else if (e.key === 'F8') {
                e.preventDefault();
                const payBtn = document.getElementById('pos-pay');
                if (!payBtn.disabled) {
                    this.processSale();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.clearCart();
            }
        });
    },

    initAnimations: function() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-scale-in');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.product-card').forEach(card => observer.observe(card));
    },

    searchProducts: function(query) {
        const filtered = this.state.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.barcode?.includes(query)
        );
        this.renderProducts(filtered);
    },

    renderProducts: function(products) {
        const container = document.getElementById('pos-products');
        container.innerHTML = '';

        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = 'product-card opacity-0';
            card.style.animationDelay = `${index * 50}ms`;
            
            card.innerHTML = `
                <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer p-4">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-gradient-to-br from-violet-100 to-violet-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
                            <svg class="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                            </svg>
                        </div>
                        <h3 class="font-semibold text-gray-800 text-sm mb-1">${product.name}</h3>
                        <div class="flex items-center justify-center space-x-2">
                            <span class="text-lg font-bold text-violet-600">${this.formatPrice(product.price)}</span>
                            ${product.stock > 0 
                                ? `<span class="text-sm text-green-600 bg-green-100 px-2 py-0.5 rounded-full">En stock</span>`
                                : `<span class="text-sm text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Rupture</span>`}
                        </div>
                        ${product.promotion 
                            ? `<div class="mt-2 bg-gold-100 text-gold-800 text-sm px-2 py-1 rounded-full animate-pulse">
                                 -${product.promotion}% de réduction
                               </div>`
                            : ''}
                    </div>
                </div>
            `;

            card.addEventListener('click', () => this.addToCart(product));
            container.appendChild(card);

            requestAnimationFrame(() => card.classList.remove('opacity-0'));
        });
    },

    addToCart: function(product) {
        const existingItem = this.state.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            this.state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                promotion: product.promotion
            });
        }

        this.updateCart();
        this.animateCartItem(product.id);
    },

    updateCart: function() {
        const container = document.getElementById('cart-items');
        const emptyState = document.getElementById('pos-cart-empty');
        const cartContent = document.getElementById('pos-cart');
        
        if (this.state.cart.length === 0) {
            emptyState.classList.remove('hidden');
            cartContent.classList.add('hidden');
            document.getElementById('pos-pay').disabled = true;
            return;
        }

        emptyState.classList.add('hidden');
        cartContent.classList.remove('hidden');
        container.innerHTML = '';
        
        let subtotal = 0;

        this.state.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            const element = document.createElement('div');
            element.className = 'cart-item animate-slide-up p-4';
            element.setAttribute('data-product-id', item.id);
            element.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800">${item.name}</h4>
                        <p class="text-sm text-gray-600">${this.formatPrice(item.price)} × ${item.quantity}</p>
                    </div>
                    <div class="text-right">
                        <div class="font-bold text-violet-600">${this.formatPrice(itemTotal)}</div>
                        ${item.promotion 
                            ? `<div class="text-sm text-gold-600">-${item.promotion}%</div>` 
                            : ''}
                    </div>
                </div>
                <div class="mt-2 flex items-center space-x-2">
                    <button onclick="POS.updateQuantity(${item.id}, -1)" 
                            class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
                        <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                        </svg>
                    </button>
                    <span class="w-8 text-center font-semibold text-gray-800">${item.quantity}</span>
                    <button onclick="POS.updateQuantity(${item.id}, 1)"
                            class="w-8 h-8 bg-violet-100 hover:bg-violet-200 rounded-lg flex items-center justify-center transition-colors">
                        <svg class="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            container.appendChild(element);
        });

        const tax = subtotal * 0.2;
        const total = subtotal + tax;

        document.getElementById('cart-count').textContent = this.state.cart.length;
        document.getElementById('subtotal').textContent = this.formatPrice(subtotal);
        document.getElementById('tax').textContent = this.formatPrice(tax);
        document.getElementById('pos-total').textContent = this.formatPrice(total);
        document.getElementById('pos-pay').disabled = false;
    },

    updateQuantity: function(productId, delta) {
        const itemIndex = this.state.cart.findIndex(item => item.id === productId);
        if (itemIndex > -1) {
            this.state.cart[itemIndex].quantity += delta;
            if (this.state.cart[itemIndex].quantity <= 0) {
                this.state.cart.splice(itemIndex, 1);
            }
            this.updateCart();
        }
    },

    clearCart: function() {
        if (this.state.cart.length === 0) return;

        if (confirm('Voulez-vous vraiment vider le panier ?')) {
            this.state.cart = [];
            this.updateCart();
        }
    },

    processSale: function() {
        if (this.state.cart.length === 0) return;

        const btn = document.getElementById('pos-pay');
        btn.classList.add('animate-bounce-gentle');

        setTimeout(() => {
            btn.classList.remove('animate-bounce-gentle');
            
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up">
                    <div class="text-center">
                        <div class="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">Paiement réussi !</h3>
                        <p class="text-gray-600 mb-6">Total: ${document.getElementById('pos-total').textContent}</p>
                        <button class="btn-primary w-full" onclick="this.closest('.fixed').remove(); POS.state.cart = []; POS.updateCart();">
                            Nouvelle vente
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }, 300);
    },

    scanBarcode: function() {
        const input = document.getElementById('pos-search');
        const oldPlaceholder = input.placeholder;
        input.value = '';
        input.placeholder = 'Scanner le code-barres...';
        input.focus();

        const resetPlaceholder = () => input.placeholder = oldPlaceholder;
        input.addEventListener('blur', resetPlaceholder, { once: true });
    },

    animateCartItem: function(productId) {
        const item = document.querySelector(`[data-product-id="${productId}"]`);
        if (item) {
            item.classList.add('animate-pulse');
            setTimeout(() => item.classList.remove('animate-pulse'), 500);
        }
    },

    formatPrice: function(price) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    },

    loadProducts: function() {
        fetch('/api/products/')
            .then(response => response.json())
            .then(rawProducts => {
                this.state.products = rawProducts.map(p => ({
                    id: p.id_produit,
                    name: p.nom,
                    price: p.prix_unitaire,
                    barcode: p.code_barre,
                    category: p.id_categorie,
                    stock: p.stock || 0,
                    promotion: p.promotion || null
                }));
                
                this.renderProducts(this.state.products);
                this.updateCart();
            })
            .catch(error => {
                console.error('Erreur lors du chargement des produits:', error);
                this.showErrorMessage('Erreur lors du chargement des produits');
            });
    }
};

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => POS.init());

