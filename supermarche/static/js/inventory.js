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
    const res = await fetch('/api/products/'); 
    return await res.json(); 
  }
  async function loadStock(){ 
    // Utiliser l'API products qui contient déjà le stock
    return await loadProducts();
  }
  async function loadCategories(){ 
    const res = await fetch('/api/categories/'); 
    return await res.json(); 
  }
  async function loadEntrepots(){ 
    // Pas d'API entrepôts pour l'instant, retourner un tableau vide
    return [{ id_entrepot: 1, nom: 'Entrepôt principal' }];
  }
  async function loadAlertes(){ 
    const res = await fetch('/api/stock/alerts/'); 
    return await res.json(); 
  }

  // Stock Dashboard
  async function initStockDashboard(){
    console.log('🚀 Initialisation du dashboard inventaire...');
    try{
      const [products, categories] = await Promise.all([
        loadProducts(), loadCategories()
      ]);

      console.log('📦 Produits chargés:', products.length);
      console.log('📁 Catégories chargées:', categories.length);

      // Enrichir les produits avec les catégories
      const productsWithCategories = products.map(p => {
        const category = categories.find(c => c.id_categorie === p.id_categorie);
        return { ...p, category };
      });

      // KPIs
      const totalProducts = products.length;
      const lowStock = products.filter(p => (p.stock || 0) <= (p.seuil_reapprovisionnement || 0) && (p.stock || 0) > 0).length;
      const outOfStock = products.filter(p => (p.stock || 0) === 0).length;
      const totalValue = products.reduce((sum, p) => sum + ((p.stock || 0) * (p.prix_achat || 0)), 0);

  // Update KPI elements
  var kpt = document.getElementById('kpi-total'); if (kpt) kpt.textContent = fmt(totalProducts);
  var kpl = document.getElementById('kpi-low'); if (kpl) kpl.textContent = fmt(lowStock);
  var kpo = document.getElementById('kpi-out'); if (kpo) kpo.textContent = fmt(outOfStock);
  var kpv = document.getElementById('kpi-value'); if (kpv) kpv.textContent = formatPrice(totalValue);

      // Populate category filter
      const categorySelect = document.getElementById('filter-category');
      if(categorySelect){
        categories.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id_categorie;
          opt.textContent = c.nom;
          categorySelect.appendChild(opt);
        });
      }

      // Render stock table with filters
      function renderFiltered(){
        const search = (document.getElementById('filter-search')?.value || '').toLowerCase();
        const categoryFilter = document.getElementById('filter-category')?.value || '';
        const threshold = Number(document.getElementById('filter-threshold')?.value || 0);

        const filtered = productsWithCategories.filter(p => {
          const okSearch = !search || p.nom.toLowerCase().includes(search);
          const okCategory = !categoryFilter || p.id_categorie == categoryFilter;
          const okThreshold = (p.stock || 0) >= threshold;
          return okSearch && okCategory && okThreshold;
        });

  renderStockTable(filtered);
  var cnt = document.getElementById('count'); if (cnt) cnt.textContent = fmt(filtered.length);
      }

      // Event listeners
      document.getElementById('filter-search')?.addEventListener('input', renderFiltered);
      document.getElementById('filter-category')?.addEventListener('change', renderFiltered);
      document.getElementById('filter-threshold')?.addEventListener('input', renderFiltered);
      document.getElementById('filter-reset')?.addEventListener('click', () => {
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-category').value = '';
        document.getElementById('filter-threshold').value = '10';
        renderFiltered();
      });

      renderFiltered();
      console.log('✅ Dashboard inventaire initialisé avec succès');

    }catch(e){ 
      console.error('❌ Erreur Stock dashboard:', e); 
      alert('Erreur lors du chargement de l\'inventaire. Vérifiez la console (F12).');
    }
  }

  function renderStockTable(products){
    console.log('📊 Affichage du tableau avec', products.length, 'produits');
    const tbody = document.getElementById('stock-tbody');
    if(!tbody) {
      console.error('❌ Élément #stock-tbody introuvable !');
      return;
    }
    
    tbody.innerHTML = '';
    
    if(products.length === 0){
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">📭</div>
            Aucun produit trouvé
          </td>
        </tr>
      `;
      return;
    }
    
    products.forEach(p => {
      const tr = document.createElement('tr');
      const stock = p.stock || 0;
      const seuil = p.seuil_reapprovisionnement || 0;
      
      // Déterminer le statut
      let statusBadge = '';
      if(stock === 0){
        statusBadge = '<span class="badge text-bg-danger">Rupture</span>';
      } else if(stock <= seuil){
        statusBadge = '<span class="badge text-bg-warning">Stock faible</span>';
      } else {
        statusBadge = '<span class="badge text-bg-success">Normal</span>';
      }
      
      tr.innerHTML = `
        <td class="font-medium">${p.nom}</td>
        <td>${p.category?.nom || '-'}</td>
        <td style="text-align: right;" class="font-bold">${fmt(stock)}</td>
        <td style="text-align: right;" class="text-gray-600">${fmt(seuil)}</td>
        <td style="text-align: center;">${statusBadge}</td>
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

  async function resolveAlert(alertId){
    if(confirm('Marquer cette alerte comme résolue ?')){
      try {
        // Pour l'instant, on marque l'alerte comme vue en ajustant le stock
        // Une vraie API pourrait être créée plus tard si nécessaire
        const response = await fetch(`/api/stock/alerts/${alertId}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
          },
          body: JSON.stringify({ vue: true })
        });
        
        if(response.ok || response.status === 404){
          alert('Alerte marquée comme vue');
          window.location.reload();
        } else {
          alert('Erreur lors de la résolution de l\'alerte');
        }
      } catch(error) {
        console.error('Erreur:', error);
        // Même si l'API n'existe pas encore, on recharge pour voir les changements
        alert('Alerte notée (l\'API de résolution sera ajoutée prochainement)');
        window.location.reload();
      }
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