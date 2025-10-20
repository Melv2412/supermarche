window.Checkout = (function(){
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  let cart = [];
  let deliveryCost = 0;
  let pointsDiscount = 0;

  function init(){
    // Récupérer le panier depuis localStorage
    const cartData = localStorage.getItem('cart');
    if(!cartData){
      alert('Votre panier est vide');
      window.location.href = '/customers/shop/';
      return;
    }

    cart = JSON.parse(cartData);
    renderCartItems();
    updateTotals();

    // Écouter le changement de mode de livraison
    document.getElementById('delivery-mode')?.addEventListener('change', updateDeliveryCost);
  }

  function renderCartItems(){
    const container = document.getElementById('checkout-items');
    if(!container) return;

    container.innerHTML = '';
    cart.forEach(item => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between py-3 border-b';
      div.innerHTML = `
        <div class="flex items-center gap-4">
          <div class="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-2xl">
            🛒
          </div>
          <div>
            <h4 class="font-semibold">${item.nom}</h4>
            <p class="text-sm text-gray-600">${formatPrice(item.prix_unitaire)} × ${item.quantite}</p>
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold text-green-600">${formatPrice(item.prix_unitaire * item.quantite)}</div>
        </div>
      `;
      container.appendChild(div);
    });
  }

  function updateDeliveryCost(){
    const mode = document.getElementById('delivery-mode')?.value;
    if(mode === 'express'){
      deliveryCost = 1000;
    } else {
      deliveryCost = 0;
    }
    updateTotals();
  }

  function updateTotals(){
    const subtotal = cart.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
    const total = subtotal + deliveryCost - pointsDiscount;

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('delivery-cost').textContent = deliveryCost === 0 ? 'Gratuit' : formatPrice(deliveryCost);
    document.getElementById('points-used').textContent = pointsDiscount > 0 ? `-${formatPrice(pointsDiscount)}` : '0';
    document.getElementById('total').textContent = formatPrice(total);
  }

  function applyPoints(){
    const pointsInput = document.getElementById('points-input');
    const points = parseInt(pointsInput.value) || 0;
    const maxPoints = 820; // Points disponibles du client

    if(points > maxPoints){
      alert(`Vous n'avez que ${maxPoints} points disponibles`);
      pointsInput.value = maxPoints;
      return;
    }

    if(points < 0){
      alert('Nombre de points invalide');
      return;
    }

    pointsDiscount = points;
    updateTotals();
  }

  function confirmOrder(){
    // Validation
    const name = document.getElementById('delivery-name')?.value;
    const phone = document.getElementById('delivery-phone')?.value;
    const address = document.getElementById('delivery-address')?.value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value;

    if(!name || !phone || !address){
      alert('Veuillez remplir toutes les informations de livraison');
      return;
    }

    if(!payment){
      alert('Veuillez sélectionner un mode de paiement');
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.prix_unitaire * item.quantite), 0);
    const total = subtotal + deliveryCost - pointsDiscount;

    const order = {
      numero_commande: `CMD-${Date.now()}`,
      date: new Date().toISOString(),
      client_id: 1, // ID du client connecté
      items: cart,
      delivery: {
        name,
        phone,
        address,
        mode: document.getElementById('delivery-mode')?.value
      },
      payment: {
        method: payment,
        subtotal,
        delivery_cost: deliveryCost,
        points_used: pointsDiscount,
        total
      }
    };

    console.log('Commande créée:', order);

    // Simuler le paiement
    if(payment === 'mobile'){
      showPaymentModal(order);
    } else if(payment === 'card'){
      showCardPayment(order);
    } else {
      // Paiement à la livraison
      finalizeOrder(order);
    }
  }

  function showPaymentModal(order){
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 class="text-xl font-bold mb-4">📱 Paiement Mobile Money</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Opérateur</label>
            <select class="input-modern" id="mobile-operator">
              <option value="orange">Orange Money</option>
              <option value="mtn">MTN Mobile Money</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Numéro de téléphone</label>
            <input type="tel" class="input-modern" id="mobile-number" placeholder="+237 6XX XXX XXX">
          </div>
          <div class="bg-gray-100 p-4 rounded">
            <div class="text-sm text-gray-600">Montant à payer</div>
            <div class="text-2xl font-bold text-green-600">${formatPrice(order.payment.total)}</div>
          </div>
          <div class="flex gap-3">
            <button class="btn-secondary flex-1" onclick="this.closest('.fixed').remove()">Annuler</button>
            <button class="btn-primary flex-1" onclick="Checkout.processMobilePayment(${JSON.stringify(order).replace(/"/g, '&quot;')})">Payer</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function processMobilePayment(order){
    // Simuler le paiement
    const number = document.getElementById('mobile-number')?.value;
    if(!number){
      alert('Veuillez entrer votre numéro de téléphone');
      return;
    }

    // Fermer le modal
    document.querySelector('.fixed.inset-0')?.remove();

    // Afficher un loader
    showLoader('Traitement du paiement...');

    // Simuler un délai de traitement
    setTimeout(() => {
      hideLoader();
      finalizeOrder(order);
    }, 2000);
  }

  function showCardPayment(order){
    alert('Paiement par carte bancaire - Fonctionnalité à venir');
    // Pour l'instant, finaliser directement
    finalizeOrder(order);
  }

  function finalizeOrder(order){
    // Vider le panier
    localStorage.removeItem('cart');

    // Afficher la confirmation
    const confirmation = document.createElement('div');
    confirmation.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    confirmation.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 text-center">
        <div class="text-6xl mb-4">✅</div>
        <h3 class="text-2xl font-bold mb-2">Commande confirmée !</h3>
        <p class="text-gray-600 mb-4">Numéro de commande: <strong>${order.numero_commande}</strong></p>
        <p class="text-sm text-gray-500 mb-6">Vous recevrez un SMS de confirmation sous peu.</p>
        <button class="btn-primary w-full" onclick="window.location.href='/customers/'">
          Retour à mon espace
        </button>
      </div>
    `;
    document.body.appendChild(confirmation);
  }

  function showLoader(message){
    const loader = document.createElement('div');
    loader.id = 'payment-loader';
    loader.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    loader.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-8 text-center">
        <div class="animate-spin text-6xl mb-4">⏳</div>
        <p class="text-lg font-semibold">${message}</p>
      </div>
    `;
    document.body.appendChild(loader);
  }

  function hideLoader(){
    document.getElementById('payment-loader')?.remove();
  }

  return { init, applyPoints, confirmOrder, processMobilePayment };
})();
