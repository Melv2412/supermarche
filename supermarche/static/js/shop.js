window.Shop = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  let cart = [];
  let products = [];
  let categories = [];

  async function loadProducts(){ 
    const res = await fetch('/static/data/products.json'); 
    return await res.json(); 
  }

  async function loadCategories(){ 
    const res = await fetch('/static/data/categories.json'); 
    return await res.json(); 
  }

  async function init(){
    try{
      [products, categories] = await Promise.all([loadProducts(), loadCategories()]);
      
      // Remplir le select des catégories
      const catSelect = document.getElementById('shop-category');
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_categorie;
        opt.textContent = c.nom;
        catSelect.appendChild(opt);
      });

      renderProducts(products);
      updateCartUI();
    }catch(e){ console.error('Shop init error:', e); }
  }

  function renderProducts(productsToShow){
    const grid = document.getElementById('products-grid');
    if(!grid) return;
    
    grid.innerHTML = '';
    productsToShow.forEach(p => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200';
      card.onclick = () => addToCart(p.id_produit);
      card.innerHTML = `
        <div class="relative">
          <div class="h-32 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
            <span class="text-4xl">${getProductEmoji(p.nom)}</span>
          </div>
          ${p.en_promotion ? '<div class="absolute top-1 right-1 bg-red-500 text-white px-2 py-0.5 rounded text-xs font-bold">PROMO</div>' : ''}
        </div>
        <div class="p-3">
          <h3 class="font-semibold text-sm mb-1 truncate">${p.nom}</h3>
          <div class="flex justify-between items-center">
            <span class="text-lg font-bold text-green-600">${formatPrice(p.prix_unitaire)}</span>
            <span class="text-xs text-gray-500">Stock: ${p.quantite_stock || 0}</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function getProductEmoji(name){
    const n = name.toLowerCase();
    if(n.includes('pain')) return '🍞';
    if(n.includes('lait')) return '🥛';
    if(n.includes('fromage')) return '🧀';
    if(n.includes('pomme')) return '🍎';
    if(n.includes('banane')) return '🍌';
    if(n.includes('tomate')) return '🍅';
    if(n.includes('viande') || n.includes('poulet')) return '🍗';
    if(n.includes('poisson')) return '🐟';
    if(n.includes('riz')) return '🍚';
    if(n.includes('eau')) return '💧';
    return '🛒';
  }

  function applyFilters(){
    const search = (document.getElementById('shop-search')?.value || '').toLowerCase();
    const category = document.getElementById('shop-category')?.value || '';
    const sort = document.getElementById('shop-sort')?.value || 'name';

    let filtered = products.filter(p => {
      const okSearch = !search || p.nom.toLowerCase().includes(search);
      const okCategory = !category || p.id_categorie == category;
      return okSearch && okCategory;
    });

    // Tri
    if(sort === 'name'){
      filtered.sort((a, b) => a.nom.localeCompare(b.nom));
    } else if(sort === 'price-asc'){
      filtered.sort((a, b) => a.prix_unitaire - b.prix_unitaire);
    } else if(sort === 'price-desc'){
      filtered.sort((a, b) => b.prix_unitaire - a.prix_unitaire);
    }

    renderProducts(filtered);
  }

  function addToCart(productId){
    const product = products.find(p => p.id_produit === productId);
    if(!product) return;

    const existingItem = cart.find(item => item.id_produit === productId);
    if(existingItem){
      existingItem.quantite += 1;
    } else {
      cart.push({
        id_produit: productId,
        nom: product.nom,
        prix_unitaire: product.prix_unitaire,
        quantite: 1
      });
    }

    updateCartUI();
    showNotification(`${product.nom} ajouté au panier !`);
  }

  function removeFromCart(productId){
    cart = cart.filter(item => item.id_produit !== productId);
    updateCartUI();
  }

  function updateQuantity(productId, quantity){
    const item = cart.find(item => item.id_produit === productId);
    if(item){
      if(quantity <= 0){
        removeFromCart(productId);
      } else {
        item.quantite = quantity;
        updateCartUI();
      }
    }
  }

  function updateCartUI(){
    const count = cart.reduce((sum, item) => sum + item.quantite, 0);
    const total = cart.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);

    document.getElementById('cart-count').textContent = count;
    document.getElementById('cart-total').textContent = formatPrice(total);
    document.getElementById('cart-subtotal').textContent = formatPrice(total);

    // Activer/désactiver le bouton paiement
    const btnCheckout = document.getElementById('btn-checkout');
    if(btnCheckout){
      btnCheckout.disabled = cart.length === 0;
    }

    renderCartItems();
  }

  function renderCartItems(){
    const container = document.getElementById('cart-items');
    if(!container) return;

    if(cart.length === 0){
      container.innerHTML = `
        <div class="text-center text-gray-400 py-12">
          <div class="text-5xl mb-3">🛒</div>
          <p>Votre panier est vide</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'bg-gray-50 rounded-lg p-3 mb-2';
      div.innerHTML = `
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-semibold text-sm flex-1">${item.nom}</h4>
          <button class="text-red-500 hover:text-red-700 ml-2" onclick="Shop.removeFromCart(${item.id_produit})">×</button>
        </div>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <button class="w-7 h-7 bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center" onclick="Shop.updateQuantity(${item.id_produit}, ${item.quantite - 1})">−</button>
            <span class="w-8 text-center font-semibold">${item.quantite}</span>
            <button class="w-7 h-7 bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center justify-center" onclick="Shop.updateQuantity(${item.id_produit}, ${item.quantite + 1})">+</button>
          </div>
          <span class="font-bold text-green-600">${formatPrice(item.prix_unitaire * item.quantite)}</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">${formatPrice(item.prix_unitaire)} × ${item.quantite}</div>
      `;
      container.appendChild(div);
    });
  }

  function proceedToCheckout(){
    if(cart.length === 0){
      alert('Votre panier est vide');
      return;
    }

    // Sauvegarder le panier dans localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Rediriger vers la page de paiement
    window.location.href = '/customers/checkout/';
  }

  function showNotification(message){
    const notif = document.createElement('div');
    notif.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-down';
    notif.textContent = message;
    document.body.appendChild(notif);
    setTimeout(() => notif.remove(), 3000);
  }

  return { init, addToCart, removeFromCart, updateQuantity, proceedToCheckout, applyFilters };
})();
