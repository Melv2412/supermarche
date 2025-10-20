(function(){
  const state = { products: [], cart: {} };
  const $list = $('#pos-products');
  const $search = $('#pos-search');
  const $cart = $('#pos-cart');
  const $cartEmpty = $('#pos-cart-empty');
  const $total = $('#pos-total');

  function renderProducts(items){
    $list.empty();
    items.forEach(p => {
      const card = $(`
        <div class="product-card animate-slide-up" data-id="${p.id}">
          <div class="text-center">
            <div class="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl mx-auto mb-3 flex items-center justify-center">
              <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
              </svg>
            </div>
            <h3 class="font-semibold text-gray-800 text-sm mb-1">${p.name}</h3>
            <p class="text-primary-600 font-bold">${App.formatPrice(p.price)}</p>
          </div>
        </div>`);
      card.on('click', () => {
        addToCart(p.id);
        card.addClass('animate-bounce-gentle');
        setTimeout(() => card.removeClass('animate-bounce-gentle'), 600);
      });
      $list.append(card);
    });
  }

  function addToCart(id){
    state.cart[id] = (state.cart[id] || 0) + 1;
    renderCart();
  }

  function updateQty(id, delta){
    if(!state.cart[id]) return;
    state.cart[id] += delta;
    if(state.cart[id] <= 0) delete state.cart[id];
    renderCart();
  }

  function renderCart(){
    const ids = Object.keys(state.cart);
    $cart.empty();
    if(ids.length === 0){
      $cartEmpty.show();
      $total.text(App.formatPrice(0));
      $('#pos-pay').prop('disabled', true);
      return;
    }
    $cartEmpty.hide();
    $('#pos-pay').prop('disabled', false);
    let sum = 0;
    ids.forEach(id => {
      const p = state.products.find(x => x.id === Number(id));
      const qty = state.cart[id];
      const line = p ? p.price * qty : 0;
      sum += line;
      const item = $(`
        <div class="cart-item animate-slide-up">
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h4 class="font-semibold text-gray-800">${p?.name || 'Produit'}</h4>
              <p class="text-sm text-gray-600">${App.formatPrice(p?.price)} x ${qty}</p>
            </div>
            <div class="flex items-center space-x-2">
              <button class="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors" data-act="dec">
                <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                </svg>
              </button>
              <span class="w-8 text-center font-semibold text-gray-800">${qty}</span>
              <button class="w-8 h-8 bg-primary-100 hover:bg-primary-200 rounded-lg flex items-center justify-center transition-colors" data-act="inc">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>`);
      item.find('[data-act="dec"]').on('click', () => updateQty(p.id, -1));
      item.find('[data-act="inc"]').on('click', () => updateQty(p.id, +1));
      $cart.append(item);
    });
    $total.text(App.formatPrice(sum));
  }

  function wireSearch(){
    $search.on('input', () => {
      const q = $search.val().toString().toLowerCase();
      const filtered = state.products.filter(p => p.name.toLowerCase().includes(q));
      renderProducts(filtered);
    });
  }

  function wireButtons(){
    $('#pos-pay').on('click', () => {
      if(Object.keys(state.cart).length === 0) return;
      
      // Animation du bouton
      const btn = $('#pos-pay');
      btn.addClass('animate-bounce-gentle');
      
      // Simulation de paiement avec modal moderne
      setTimeout(() => {
        btn.removeClass('animate-bounce-gentle');
        
        // Créer une modal de confirmation moderne
        const modal = $(`
          <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up">
              <div class="text-center">
                <div class="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Paiement réussi !</h3>
                <p class="text-gray-600 mb-6">Transaction simulée - Total: ${$total.text()}</p>
                <button class="btn-primary w-full" onclick="$(this).closest('.fixed').remove(); state.cart = {}; renderCart();">
                  Nouvelle vente
                </button>
              </div>
            </div>
          </div>
        `);
        $('body').append(modal);
      }, 300);
    });
    
    $('#pos-clear').on('click', () => { 
      state.cart = {}; 
      renderCart(); 
    });
  }

  async function init(){
    try {
      const res = await fetch('/static/data/products.json');
      const rawProducts = await res.json();
      
      // Mapper les produits au bon format
      state.products = rawProducts.map(p => ({
        id: p.id_produit,
        name: p.nom,
        price: p.prix_unitaire,
        barcode: p.code_barre,
        category: p.id_categorie
      }));
      
      renderProducts(state.products);
      renderCart();
      wireSearch();
      wireButtons();
    } catch(e){
      console.error('Erreur chargement produits:', e);
    }
  }

  $(init);
})();

