// Client simple pour la boutique en ligne
// Charge les catégories et produits depuis l'API et remplit la page
var Shop = (function () {
  var apiBase = '/api/';
  var products = [];
  var categories = [];

  async function fetchJson(url) {
    var resp = await fetch(url, { credentials: 'same-origin' });
    if (!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
    return resp.json();
  }

  async function loadCategories() {
    try {
      var data = await fetchJson(apiBase + 'categories/');
      categories = data;
      var sel = document.getElementById('shop-category');
      // clear
      sel.innerHTML = '<option value="">Toutes catégories</option>';
      data.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.id_categorie || c.id || '';
        opt.textContent = c.nom || c.name || 'Catégorie';
        sel.appendChild(opt);
      });
    } catch (e) {
      console.error('Erreur chargement categories', e);
    }
  }

  async function loadProducts() {
    try {
      var params = new URLSearchParams();
      // initial load without filters
      var url = apiBase + 'products/';
      var data = await fetchJson(url);
      products = data;
      renderProducts(products);
    } catch (e) {
      console.error('Erreur chargement produits', e);
      document.getElementById('products-grid').innerHTML = '<div class="col-span-full text-center text-gray-500">Impossible de charger les produits.</div>';
    }
  }

  function formatCurrency(v) {
    try {
      return Number(v).toLocaleString() + ' FCFA';
    } catch (e) {
      return v + ' FCFA';
    }
  }

  function renderProducts(list) {
    var grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    if (!list || list.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center text-gray-400 py-12">Aucun produit disponible</div>';
      return;
    }
    list.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'card bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow';
      var imgHtml = '';
      if (p.image) imgHtml = '<img src="' + p.image + '" alt="' + (p.nom||'') + '" class="w-full h-40 object-cover mb-2 rounded">';
      
      // Trouver le produit dans le panier
      var cartItem = cart.find(function(i) { return String(i.id) === String(p.id_produit || p.id); });
      var qtyInCart = cartItem ? cartItem.qty : 0;
      
      var addButtonHtml = '';
      if (p.stock <= 0) {
        addButtonHtml = '<button class="w-full bg-gray-300 text-gray-600 py-2 rounded cursor-not-allowed">Rupture de stock</button>';
      } else if (qtyInCart > 0) {
        addButtonHtml = 
          '<div class="flex items-center justify-between gap-2 bg-green-50 p-2 rounded">' +
            '<button class="btn-qty-dec h-8 w-8 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200" data-id="' + (p.id_produit || p.id) + '">-</button>' +
            '<span class="text-center font-medium">' + qtyInCart + '</span>' +
            '<button class="btn-qty-inc h-8 w-8 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200" data-id="' + (p.id_produit || p.id) + '">+</button>' +
          '</div>';
      } else {
        addButtonHtml = '<button class="btn-add w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition-colors" data-id="' + (p.id_produit || p.id || '') + '">Ajouter au panier</button>';
      }
      
      card.innerHTML = '' +
        imgHtml +
        '<h3 class="font-semibold text-lg">' + (p.nom || '') + '</h3>' +
        '<div class="text-sm text-gray-600">' + (p.categorie_nom || '') + '</div>' +
        '<div class="mt-2 flex items-center justify-between">' +
          '<div class="text-green-600 font-bold">' + formatCurrency(p.prix_unitaire) + '</div>' +
          '<div class="text-sm text-gray-600">Stock: ' + (p.stock == null ? '0' : p.stock) + '</div>' +
        '</div>' +
        '<div class="mt-3">' + addButtonHtml + '</div>';
      
      grid.appendChild(card);
    });

    // Bind events
    grid.querySelectorAll('.btn-add').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var id = this.getAttribute('data-id');
        addToCart(id);
      });
    });
    
    grid.querySelectorAll('.btn-qty-dec').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var id = this.getAttribute('data-id');
        updateQuantity(id, getCartItemQty(id) - 1);
        renderProducts(list); // Re-render pour mettre à jour les boutons
      });
    });
    
    grid.querySelectorAll('.btn-qty-inc').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var id = this.getAttribute('data-id');
        var product = products.find(function(p) { return String(p.id_produit || p.id) === String(id); });
        if (product && getCartItemQty(id) < product.stock) {
          updateQuantity(id, getCartItemQty(id) + 1);
          renderProducts(list); // Re-render pour mettre à jour les boutons
        }
      });
    });
  }

  function applyFilters() {
    var query = document.getElementById('shop-search').value.trim().toLowerCase();
    var cat = document.getElementById('shop-category').value;
    var sort = document.getElementById('shop-sort').value;
    var list = products.slice();
    if (cat) list = list.filter(function (p) { return String(p.id_categorie) === String(cat) || String(p.id_categorie || p.id_categorie) === String(cat); });
    if (query) list = list.filter(function (p) { return (p.nom || '').toLowerCase().indexOf(query) !== -1; });
    if (sort === 'price-asc') list.sort(function(a,b){return Number(a.prix_unitaire)-Number(b.prix_unitaire)});
    if (sort === 'price-desc') list.sort(function(a,b){return Number(b.prix_unitaire)-Number(a.prix_unitaire)});
    if (sort === 'name') list.sort(function(a,b){return (a.nom||'').localeCompare(b.nom||'')});
    renderProducts(list);
  }

  // Gestion du panier
  let cart = [];
  
  function cartKey() { return 'shop_cart_v1'; }
  
  function loadCart() {
    try {
      cart = JSON.parse(sessionStorage.getItem(cartKey()) || '[]');
    } catch (e) {
      cart = [];
    }
    updateCartUI();
    return cart;
  }
  
  function saveCart() {
    sessionStorage.setItem(cartKey(), JSON.stringify(cart));
    updateCartUI();
  }
  
  function getCartItemQty(productId) {
    const item = cart.find(i => String(i.id) === String(productId));
    return item ? item.qty : 0;
  }
  
  function addToCart(productId) {
    const product = products.find(p => String(p.id_produit || p.id) === String(productId));
    if (!product) {
      console.error('Produit non trouvé:', productId);
      return;
    }
    
    if (product.stock <= 0) {
      alert('Désolé, ce produit est en rupture de stock');
      return;
    }
    
    const existingItem = cart.find(i => String(i.id) === String(productId));
    if (existingItem) {
      if (existingItem.qty >= product.stock) {
        alert('Désolé, stock insuffisant');
        return;
      }
      existingItem.qty++;
    } else {
      cart.push({
        id: productId,
        name: product.nom,
        price: product.prix_unitaire,
        qty: 1
      });
    }
    
    saveCart();
    renderProducts(products); // Re-render pour mettre à jour les boutons +/-
  }

  function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('cart-count').textContent = count;
    
    const itemsDiv = document.getElementById('cart-items');
    if (!itemsDiv) return;
    
    if (cart.length === 0) {
      itemsDiv.innerHTML = '<div class="text-center text-gray-400 py-12"><div class="text-5xl mb-3">🛒</div><p>Votre panier est vide</p></div>';
      document.getElementById('btn-checkout').disabled = true;
      document.getElementById('cart-subtotal').textContent = '0 FCFA';
      document.getElementById('cart-total').textContent = '0 FCFA';
      return;
    }
    
    let html = '<div class="divide-y">';
    let subtotal = 0;
    
    cart.forEach(function(item) {
      const total = item.qty * item.price;
      subtotal += total;
      
      html += `
        <div class="py-3">
          <div class="flex items-center justify-between mb-2">
            <div class="font-medium">${item.name}</div>
            <button class="cart-remove text-gray-400 hover:text-red-500" data-id="${item.id}">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-center bg-gray-50 rounded-lg">
              <button class="cart-decrease h-8 w-8 flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-l-lg" data-id="${item.id}">-</button>
              <span class="w-12 text-center font-medium">${item.qty}</span>
              <button class="cart-increase h-8 w-8 flex items-center justify-center text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-r-lg" data-id="${item.id}">+</button>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500">${formatCurrency(item.price)} × ${item.qty}</div>
              <div class="font-bold text-green-600">${formatCurrency(total)}</div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    itemsDiv.innerHTML = html;
    
    // Ajouter les gestionnaires d'événements pour les boutons du panier
    itemsDiv.querySelectorAll('.cart-increase').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = cart.find(i => String(i.id) === String(id));
        const product = products.find(p => String(p.id_produit || p.id) === String(id));
        if (item && product && item.qty < product.stock) {
          updateQuantity(id, item.qty + 1);
        }
      });
    });

    itemsDiv.querySelectorAll('.cart-decrease').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = cart.find(i => String(i.id) === String(id));
        if (item && item.qty > 1) {
          updateQuantity(id, item.qty - 1);
        }
      });
    });

    itemsDiv.querySelectorAll('.cart-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        updateQuantity(id, 0);
      });
    });
    
    document.getElementById('cart-subtotal').textContent = formatCurrency(subtotal);
    document.getElementById('cart-total').textContent = formatCurrency(subtotal);
    document.getElementById('btn-checkout').disabled = false;
  }
  
  function updateQuantity(productId, quantity) {
    const product = products.find(p => String(p.id_produit || p.id) === String(productId));
    if (!product) {
      console.error('Produit non trouvé:', productId);
      return;
    }
    
    if (quantity > product.stock) {
      alert('Désolé, stock insuffisant');
      return;
    }
    
    if (quantity <= 0) {
      cart = cart.filter(item => String(item.id) !== String(productId));
    } else {
      const item = cart.find(item => String(item.id) === String(productId));
      if (item) {
        item.qty = quantity;
      } else if (quantity > 0) {
        cart.push({
          id: productId,
          name: product.nom,
          price: product.prix_unitaire,
          qty: quantity
        });
      }
    }
    
    saveCart();
    renderProducts(products); // Re-render pour mettre à jour les boutons +/-
  }

  async function proceedToCheckout() {
    try {
      if (!cart || cart.length === 0) {
        alert('Votre panier est vide');
        return;
      }

      // Préparer les données du panier dans le format attendu par la vue
      // la vue `online_checkout` attend { vente: { items: [{id, quantity}], total } }
      // Récupérer l'email du client depuis localStorage ou demander s'il manque
      let clientEmail = localStorage.getItem('user_email') || '';
      if (!clientEmail) {
        // Appeler l'API pour identifier/créer le client via un modal prompt
        const emailPrompt = prompt("Entrez l'email du client pour rattacher la commande (laisser vide si caissier) :", "");
        if (emailPrompt) {
          // Vérification basique et appel de l'API d'identification
          if (emailPrompt.indexOf('@') === -1) {
            alert('Email invalide. Veuillez réessayer.');
            return;
          }
          try {
            const resp = await fetch('/api/customers/identify/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
              body: JSON.stringify({ email: emailPrompt })
            });
            if (!resp.ok) {
              const err = await resp.json();
              throw new Error(err.error || 'Erreur identification client');
            }
            const data = await resp.json();
            clientEmail = data.email;
            localStorage.setItem('user_email', clientEmail);
          } catch (e) {
            alert('Impossible d\'identifier le client: ' + e.message);
            return;
          }
        } else {
          const ok = confirm("Aucune adresse fournie. Voulez-vous continuer ? (la transaction ne sera pas liée à un client)");
          if (!ok) return;
          clientEmail = null;
        }
      }

      const cartData = {
        vente: {
          items: cart.map(item => ({
            id: item.id,
            quantity: item.qty
          })),
          total: cart.reduce((sum, item) => sum + (item.qty * item.price), 0),
          client_email: clientEmail
        }
      };

      console.log('Envoi des données:', cartData);

      const response = await fetch(apiBase + 'checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(cartData)
      });

      if (!response.ok) {
        // try to read response body for debugging (may be JSON or text)
        let text = '';
        try {
          text = await response.text();
        } catch (e) {
          text = '<no response body>';
        }
        throw new Error('Erreur réseau: ' + response.status + ' - ' + text);
      }

      const result = await response.json();
      
      if (response.ok) {
        // Vider le panier après succès
        sessionStorage.removeItem(cartKey());
        updateCartUI();
        
        // Afficher confirmation
        alert(
          'Commande validée !\n' +
          'N° Ticket: ' + result.numero_ticket + '\n' +
          'Total: ' + formatCurrency(result.montant) + '\n' +
          (result.points_gagnes > 0 ? result.points_gagnes + ' points fidélité gagnés !' : '')
        );
        
        // Recharger les produits pour mettre à jour les stocks
        await loadProducts();
      } else {
        throw new Error(result.error || 'Erreur lors du paiement');
      }
    } catch (e) {
      console.error('Erreur checkout:', e);
      alert('Erreur: ' + e.message);
    }
  }

  // Utilitaire pour récupérer le cookie CSRF
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  return {
    init: function () {
      // Charger le panier depuis sessionStorage
      loadCart();
      
      // Charger les données
      loadCategories();
      loadProducts();
      
      // Bind des filtres
      document.getElementById('shop-search').addEventListener('keyup', applyFilters);
      document.getElementById('shop-category').addEventListener('change', applyFilters);
      document.getElementById('shop-sort').addEventListener('change', applyFilters);
      updateCartUI();
    },
    applyFilters: applyFilters,
    proceedToCheckout: proceedToCheckout
  };
})();
