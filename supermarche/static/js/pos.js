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
        <div class="col">
          <div class="product" data-id="${p.id}">
            <div class="fw-semibold">${p.name}</div>
            <div class="text-muted small">${App.formatPrice(p.price)}</div>
          </div>
        </div>`);
      card.on('click', () => addToCart(p.id));
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
      return;
    }
    $cartEmpty.hide();
    let sum = 0;
    ids.forEach(id => {
      const p = state.products.find(x => x.id === Number(id));
      const qty = state.cart[id];
      const line = p ? p.price * qty : 0;
      sum += line;
      const item = $(`
        <li class="list-group-item d-flex align-items-center justify-content-between">
          <div class="me-2">
            <div class="fw-semibold">${p?.name || 'Produit'}</div>
            <div class="text-muted small">${App.formatPrice(p?.price)} x ${qty}</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-secondary" data-act="dec">-</button>
            <input class="form-control form-control-sm qty" value="${qty}" disabled />
            <button class="btn btn-sm btn-outline-secondary" data-act="inc">+</button>
          </div>
        </li>`);
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
      if(Object.keys(state.cart).length === 0) return alert('Panier vide');
      alert('Paiement simulÃ© (front uniquement).');
    });
    $('#pos-clear').on('click', () => { state.cart = {}; renderCart(); });
  }

  async function init(){
    try {
      const res = await fetch('/static/data/products.json');
      state.products = await res.json();
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

