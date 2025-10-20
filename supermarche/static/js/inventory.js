window.Inventory = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  // Navigation
  function gotoStockDashboard(){ window.location.href = '/inventory/'; }
  function gotoStockList(){ window.location.href = '/inventory/stock/'; }
  function gotoAlerts(){ window.location.href = '/inventory/alerts/'; }
  function gotoInventory(){ window.location.href = '/inventory/inventory/'; }

  // Load data
  async function loadProducts(){ 
    const res = await fetch('/static/data/products.json'); 
    return await res.json(); 
  }
  async function loadStock(){ 
    const res = await fetch('/static/data/stock.json'); 
    return await res.json(); 
  }
  async function loadCategories(){ 
    const res = await fetch('/static/data/categories.json'); 
    return await res.json(); 
  }
  async function loadEntrepots(){ 
    const res = await fetch('/static/data/entrepots.json'); 
    return await res.json(); 
  }
  async function loadAlertes(){ 
    const res = await fetch('/static/data/alertes.json'); 
    return await res.json(); 
  }

  // Stock Dashboard
  async function initStockDashboard(){
    try{
      const [products, stock, categories, entrepots, alertes] = await Promise.all([
        loadProducts(), loadStock(), loadCategories(), loadEntrepots(), loadAlertes()
      ]);

      // Merge data
      const stockWithProducts = stock.map(s => {
        const product = products.find(p => p.id_produit === s.id_produit);
        const category = categories.find(c => c.id_categorie === product?.id_categorie);
        const entrepot = entrepots.find(e => e.id_entrepot === s.id_entrepot);
        return {
          ...s,
          product: product,
          category: category,
          entrepot: entrepot
        };
      });

      // KPIs
      const totalProducts = products.length;
      const totalStock = stock.reduce((sum, s) => sum + s.quantite_disponible, 0);
      const lowStock = stockWithProducts.filter(s => s.quantite_disponible <= s.product?.seuil_reapprovisionnement).length;
      const outOfStock = stockWithProducts.filter(s => s.quantite_disponible === 0).length;
      const totalValue = stockWithProducts.reduce((sum, s) => sum + (s.quantite_disponible * s.product?.prix_achat), 0);

      // Update KPI elements
      document.getElementById('kpi-total-products')?.textContent = fmt(totalProducts);
      document.getElementById('kpi-total-stock')?.textContent = fmt(totalStock);
      document.getElementById('kpi-low-stock')?.textContent = fmt(lowStock);
      document.getElementById('kpi-out-stock')?.textContent = fmt(outOfStock);
      document.getElementById('kpi-total-value')?.textContent = formatPrice(totalValue);

      // Render stock table
      renderStockTable(stockWithProducts);

      // Render alerts
      renderAlerts(alertes, products);

    }catch(e){ console.error('Stock dashboard error:', e); }
  }

  function renderStockTable(stockWithProducts){
    const tbody = document.getElementById('stock-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    stockWithProducts.forEach(s => {
      const tr = document.createElement('tr');
      const stockClass = s.quantite_disponible === 0 ? 'table-danger' : 
                        s.quantite_disponible <= s.product?.seuil_reapprovisionnement ? 'table-warning' : '';
      
      tr.className = stockClass;
      tr.innerHTML = `
        <td>${s.product?.nom || '-'}</td>
        <td>${s.category?.nom || '-'}</td>
        <td class="text-center">${fmt(s.quantite_disponible)}</td>
        <td class="text-center">${fmt(s.quantite_reservee)}</td>
        <td class="text-center">${fmt(s.product?.seuil_reapprovisionnement || 0)}</td>
        <td>${s.emplacement || '-'}</td>
        <td>${s.entrepot?.nom || '-'}</td>
        <td class="text-end">${formatPrice(s.quantite_disponible * s.product?.prix_achat || 0)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderAlerts(alertes, products){
    const tbody = document.getElementById('alerts-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    alertes.forEach(a => {
      const product = products.find(p => p.id_produit === a.id_produit);
      const tr = document.createElement('tr');
      const priorityClass = a.priorite === 'haute' ? 'table-danger' : 
                           a.priorite === 'moyenne' ? 'table-warning' : 'table-info';
      
      tr.className = priorityClass;
      tr.innerHTML = `
        <td>${product?.nom || '-'}</td>
        <td><span class="badge bg-${a.priorite === 'haute' ? 'danger' : a.priorite === 'moyenne' ? 'warning' : 'info'}">${a.type_alerte}</span></td>
        <td class="text-center">${fmt(a.quantite_actuelle)}</td>
        <td class="text-center">${fmt(a.quantite_suggeree)}</td>
        <td>${a.message}</td>
        <td class="text-center">${new Date(a.date_creation).toLocaleDateString('fr-FR')}</td>
        <td class="text-center">
          <button class="btn btn-sm btn-outline-primary" onclick="Inventory.resolveAlert(${a.id_alerte})">
            Résoudre
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function resolveAlert(alertId){
    if(confirm('Marquer cette alerte comme résolue ?')){
      // Simulation - en réalité, on ferait un appel API
      console.log('Résolution alerte:', alertId);
      alert('Alerte résolue (simulation)');
      // Recharger la page pour voir les changements
      window.location.reload();
    }
  }

  // Stock List with filters
  async function initStockList(){
    try{
      const [products, stock, categories, entrepots] = await Promise.all([
        loadProducts(), loadStock(), loadCategories(), loadEntrepots()
      ]);

      const stockWithProducts = stock.map(s => {
        const product = products.find(p => p.id_produit === s.id_produit);
        const category = categories.find(c => c.id_categorie === product?.id_categorie);
        const entrepot = entrepots.find(e => e.id_entrepot === s.id_entrepot);
        return { ...s, product, category, entrepot };
      });

      const searchEl = document.getElementById('stock-search');
      const categoryEl = document.getElementById('stock-category');
      const entrepotEl = document.getElementById('stock-entrepot');
      const statusEl = document.getElementById('stock-status');

      // Fill filters
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id_categorie;
        opt.textContent = c.nom;
        categoryEl?.appendChild(opt);
      });

      entrepots.forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id_entrepot;
        opt.textContent = e.nom;
        entrepotEl?.appendChild(opt);
      });

      function render(){
        const search = (searchEl?.value || '').toLowerCase();
        const category = categoryEl?.value || '';
        const entrepot = entrepotEl?.value || '';
        const status = statusEl?.value || '';

        const filtered = stockWithProducts.filter(s => {
          const okSearch = !search || (s.product?.nom || '').toLowerCase().includes(search);
          const okCategory = !category || s.product?.id_categorie == category;
          const okEntrepot = !entrepot || s.id_entrepot == entrepot;
          const okStatus = !status || 
            (status === 'rupture' && s.quantite_disponible === 0) ||
            (status === 'faible' && s.quantite_disponible <= s.product?.seuil_reapprovisionnement) ||
            (status === 'normal' && s.quantite_disponible > s.product?.seuil_reapprovisionnement);
          
          return okSearch && okCategory && okEntrepot && okStatus;
        });

        renderStockTable(filtered);
        document.getElementById('stock-count')?.textContent = fmt(filtered.length);
      }

      searchEl?.addEventListener('input', render);
      categoryEl?.addEventListener('change', render);
      entrepotEl?.addEventListener('change', render);
      statusEl?.addEventListener('change', render);
      
      render();
    }catch(e){ console.error('Stock list error:', e); }
  }

  // Inventory management
  async function initInventory(){
    try{
      const [products, stock, categories] = await Promise.all([
        loadProducts(), loadStock(), loadCategories()
      ]);

      const inventoryData = products.map(p => {
        const stockItem = stock.find(s => s.id_produit === p.id_produit);
        const category = categories.find(c => c.id_categorie === p.id_categorie);
        return {
          ...p,
          category,
          stock: stockItem,
          quantite_theorique: stockItem?.quantite_disponible || 0,
          quantite_reelle: 0, // À saisir lors de l'inventaire
          ecart: 0,
          valeur_ecart: 0
        };
      });

      const tbody = document.getElementById('inventory-tbody');
      if(!tbody) return;

      tbody.innerHTML = '';
      inventoryData.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${item.nom}</td>
          <td>${item.category?.nom || '-'}</td>
          <td class="text-center">${fmt(item.quantite_theorique)}</td>
          <td class="text-center">
            <input type="number" class="form-control form-control-sm" 
                   value="${item.quantite_reelle}" 
                   onchange="Inventory.updateInventory(${item.id_produit}, this.value)"
                   min="0">
          </td>
          <td class="text-center" id="ecart-${item.id_produit}">0</td>
          <td class="text-end" id="valeur-ecart-${item.id_produit}">0 FCFA</td>
        `;
        tbody.appendChild(tr);
      });

    }catch(e){ console.error('Inventory error:', e); }
  }

  function updateInventory(productId, quantiteReelle){
    const quantiteTheorique = document.querySelector(`input[onchange*="${productId}"]`)?.value || 0;
    const ecart = parseInt(quantiteReelle) - parseInt(quantiteTheorique);
    const valeurEcart = ecart * 10;
    document.getElementById(`ecart-${productId}`).textContent = ecart;
    document.getElementById(`valeur-ecart-${productId}`).textContent = formatPrice(valeurEcart);
  }

  async function initMovements(){
    try{
      const movements = await fetch('/static/data/stock_movements.json').then(r => r.json());
      renderMovementsTable(movements);
      document.getElementById('mov-type')?.addEventListener('change', () => filterMovements(movements));
    }catch(e){ console.error('Movements load error:', e); }
  }

  function filterMovements(movements){
    const type = document.getElementById('mov-type')?.value || '';
    const filtered = !type ? movements : movements.filter(m => m.type_mouvement === type);
    renderMovementsTable(filtered);
  }

  function renderMovementsTable(movements){
    const tbody = document.getElementById('movements-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    movements.forEach(m => {
      const typeClass = m.type_mouvement === 'entree' ? 'text-success' : m.type_mouvement === 'sortie' ? 'text-danger' : 'text-warning';
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${m.date_mouvement.split('T')[0]}</td><td>${m.nom_produit}</td><td class="${typeClass}">${m.type_mouvement}</td><td class="text-center">${m.quantite}</td><td>${m.entrepot_nom}</td><td>${m.reference}</td><td>${m.utilisateur}</td><td>${m.motif}</td>`;
      tbody.appendChild(tr);
    });
    document.getElementById('movements-count').textContent = movements.length;
  }

  return {
    initStockDashboard,
    initStockList,
    initInventory,
    initMovements,
    gotoStockDashboard,
    gotoStockList,
    gotoAlerts,
    gotoInventory,
    resolveAlert,
    updateInventory
  };
})();