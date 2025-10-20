window.Sales = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return amount + ' FCFA';
  };

  // State
  const state = {
    cart: [],
    currentTransaction: null,
    products: [],
    promotions: [],
    customers: []
  };

  // Navigation
  function gotoPOS(){ window.location.href = '/sales/pos/'; }
  function gotoDashboard(){ window.location.href = '/sales/'; }
  function gotoPOSInterface(){ window.location.href = '/sales/pos/interface/'; }

  // Load data
  async function loadTransactions(){ 
    const res = await fetch('/static/data/transactions.json'); 
    return await res.json(); 
  }
  async function loadProducts(){ 
    const res = await fetch('/static/data/products.json'); 
    return await res.json(); 
  }
  async function loadPromotions(){ 
    const res = await fetch('/static/data/promotions.json'); 
    return await res.json(); 
  }
  async function loadCustomers(){ 
    const res = await fetch('/static/data/customers.json'); 
    return await res.json(); 
  }
  async function loadCaisses(){ 
    const res = await fetch('/static/data/caisses.json'); 
    return await res.json(); 
  }

  // Dashboard
  async function initDashboard(){
    try{
      const [transactions, products, customers] = await Promise.all([
        loadTransactions(), loadProducts(), loadCustomers()
      ]);

      // Merge data for display
      const transactionsWithDetails = transactions.map(t => {
        const customer = customers.find(c => c.id === t.id_client);
        const totalLignes = t.lignes.reduce((sum, l) => sum + l.sous_total, 0);
        return {
          ...t,
          customer: customer?.name || 'Client anonyme',
          total_lignes: totalLignes
        };
      });

      renderDashboard(transactionsWithDetails);
      
      // KPIs
      const totalRevenue = transactions.reduce((sum, t) => sum + t.montant_net, 0);
      const totalTransactions = transactions.length;
      const avgTicket = totalTransactions ? totalRevenue / totalTransactions : 0;
      const todayTransactions = transactions.filter(t => 
        new Date(t.date_transaction).toDateString() === new Date().toDateString()
      ).length;

      document.getElementById('kpi-revenue')?.textContent = formatPrice(totalRevenue);
      document.getElementById('kpi-transactions')?.textContent = fmt(totalTransactions);
      document.getElementById('kpi-avg-ticket')?.textContent = formatPrice(avgTicket);
      document.getElementById('kpi-today')?.textContent = fmt(todayTransactions);

    }catch(e){ console.error('Sales dashboard error:', e); }
  }

  function renderDashboard(transactions){
    const tbody = document.getElementById('sales-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    transactions.forEach(t => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${t.numero_ticket}</td>
        <td>${new Date(t.date_transaction).toLocaleDateString('fr-FR')}</td>
        <td>${t.customer}</td>
        <td class="text-center">${t.lignes.length}</td>
        <td class="text-end">${formatPrice(t.montant_brut)}</td>
        <td class="text-end">${formatPrice(t.montant_remises)}</td>
        <td class="text-end">${formatPrice(t.montant_net)}</td>
        <td><span class="badge bg-${t.statut === 'terminee' ? 'success' : 'warning'}">${t.statut}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // POS Interface
  async function initPOSInterface(){
    try{
      const [products, promotions, customers, caisses] = await Promise.all([
        loadProducts(), loadPromotions(), loadCustomers(), loadCaisses()
      ]);

      state.products = products;
      state.promotions = promotions;
      state.customers = customers;

      // Render products
      renderProducts(products);
      
      // Render cart
      renderCart();
      
      // Render customers
      renderCustomers(customers);
      
      // Render promotions
      renderPromotions(promotions);

      // Event listeners
      document.getElementById('pos-search')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.nom.toLowerCase().includes(query));
        renderProducts(filtered);
      });

      document.getElementById('pos-pay')?.addEventListener('click', processPayment);
      document.getElementById('pos-clear')?.addEventListener('click', clearCart);

    }catch(e){ console.error('POS interface error:', e); }
  }

  function renderProducts(products){
    const tbody = document.getElementById('pos-products-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    products.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.nom}</td>
        <td class="text-end">${formatPrice(p.prix_unitaire)}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-primary" onclick="Sales.addToCart(${p.id_produit})">
            <i class="fas fa-plus"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function addToCart(productId){
    const product = state.products.find(p => p.id_produit === productId);
    if(!product) return;

    const existingItem = state.cart.find(item => item.id_produit === productId);
    if(existingItem){
      existingItem.quantite += 1;
    } else {
      state.cart.push({
        id_produit: productId,
        nom: product.nom,
        prix_unitaire: product.prix_unitaire,
        quantite: 1,
        sous_total: product.prix_unitaire
      });
    }
    
    updateCartTotals();
    renderCart();
  }

  function removeFromCart(productId){
    state.cart = state.cart.filter(item => item.id_produit !== productId);
    updateCartTotals();
    renderCart();
  }

  function updateCartQuantity(productId, quantity){
    const item = state.cart.find(item => item.id_produit === productId);
    if(item){
      if(quantity <= 0){
        removeFromCart(productId);
      } else {
        item.quantite = quantity;
        item.sous_total = item.prix_unitaire * quantity;
        updateCartTotals();
        renderCart();
      }
    }
  }

  function updateCartTotals(){
    const montantBrut = state.cart.reduce((sum, item) => sum + item.sous_total, 0);
    const montantRemises = 0; // À calculer selon les promotions
    const montantNet = montantBrut - montantRemises;
    const montantTVA = montantNet * 0.20; // 20% TVA

    state.cartTotals = {
      montant_brut: montantBrut,
      montant_remises: montantRemises,
      montant_net: montantNet,
      montant_tva: montantTVA
    };
  }

  function renderCart(){
    const tbody = document.getElementById('pos-cart-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    state.cart.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.nom}</td>
        <td class="text-center">
          <div class="input-group input-group-sm">
            <button class="btn btn-outline-secondary" onclick="Sales.updateCartQuantity(${item.id_produit}, ${item.quantite - 1})">-</button>
            <input type="number" class="form-control text-center" value="${item.quantite}" 
                   onchange="Sales.updateCartQuantity(${item.id_produit}, parseInt(this.value))" min="1">
            <button class="btn btn-outline-secondary" onclick="Sales.updateCartQuantity(${item.id_produit}, ${item.quantite + 1})">+</button>
          </div>
        </td>
        <td class="text-end">${formatPrice(item.prix_unitaire)}</td>
        <td class="text-end">${formatPrice(item.sous_total)}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-danger" onclick="Sales.removeFromCart(${item.id_produit})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Update totals
    if(state.cartTotals){
      document.getElementById('pos-montant-brut')?.textContent = formatPrice(state.cartTotals.montant_brut);
      document.getElementById('pos-montant-remises')?.textContent = formatPrice(state.cartTotals.montant_remises);
      document.getElementById('pos-montant-net')?.textContent = formatPrice(state.cartTotals.montant_net);
      document.getElementById('pos-montant-tva')?.textContent = formatPrice(state.cartTotals.montant_tva);
    }
  }

  function renderCustomers(customers){
    const select = document.getElementById('pos-customer');
    if(!select) return;
    
    select.innerHTML = '<option value="">Client anonyme</option>';
    customers.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.points} pts)`;
      select.appendChild(opt);
    });
  }

  function renderPromotions(promotions){
    const select = document.getElementById('pos-promotion');
    if(!select) return;
    
    select.innerHTML = '<option value="">Aucune promotion</option>';
    promotions.filter(p => p.est_active).forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id_promotion;
      opt.textContent = `${p.nom} (${p.code})`;
      select.appendChild(opt);
    });
  }

  async function processPayment(){
    if(state.cart.length === 0){
      alert('Le panier est vide');
      return;
    }

    const customerId = document.getElementById('pos-customer')?.value;
    const promotionId = document.getElementById('pos-promotion')?.value;
    const paymentMethod = document.getElementById('pos-payment-method')?.value;

    if(!paymentMethod){
      alert('Veuillez sélectionner un mode de paiement');
      return;
    }

    // Création de la transaction via API
    const transactionData = {
      montant_brut: state.cartTotals.montant_brut,
      montant_remises: state.cartTotals.montant_remises,
      montant_net: state.cartTotals.montant_net,
      montant_tva: state.cartTotals.montant_tva,
      statut: 'terminee',
      id_caisse: 1,
      id_client: customerId || null,
      id_caissier: Number(localStorage.getItem('user_id')) || 1,
      lignes: state.cart.map(item => ({
        id_produit: item.id_produit,
        quantite: item.quantite,
        prix_unitaire: item.prix_unitaire,
        sous_total: item.sous_total,
        remise_appliquee: 0
      })),
      modes_paiement: [{
        type: paymentMethod,
        montant: state.cartTotals.montant_net,
        reference: paymentMethod === 'carte' ? `CARD-${Date.now()}` : null,
        statut: 'valide'
      }]
    };

    try {
      const response = await fetch('/api/transactions/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || '',
          'Authorization': 'Token ' + (localStorage.getItem('token') || '')
        },
        body: JSON.stringify(transactionData)
      });

      if(response.ok){
        const transaction = await response.json();
        console.log('Transaction créée:', transaction);
        alert(`Transaction terminée!\nTicket: ${transaction.numero_ticket}\nMontant: ${formatPrice(transaction.montant_net)}`);
        clearCart();
      } else {
        const error = await response.json();
        console.error('Erreur transaction:', error);
        alert('Erreur lors de la création de la transaction: ' + (error.detail || 'Erreur inconnue'));
      }
    } catch(error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la transaction');
    }
  }

  function clearCart(){
    state.cart = [];
    state.cartTotals = null;
    renderCart();
    document.getElementById('pos-customer')?.value = '';
    document.getElementById('pos-promotion')?.value = '';
    document.getElementById('pos-payment-method')?.value = '';
  }

  return {
    gotoPOS, gotoDashboard, gotoPOSInterface,
    initDashboard, initPOSInterface,
    addToCart, removeFromCart, updateCartQuantity, clearCart, processPayment
  };
})();
