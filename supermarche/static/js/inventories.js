window.Inventories = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  async function loadInventories(){ 
    const res = await fetch('/static/data/inventories.json'); 
    return await res.json(); 
  }
  async function loadProducts(){ 
    const res = await fetch('/static/data/products.json'); 
    return await res.json(); 
  }
  async function loadStock(){ 
    const res = await fetch('/static/data/stock.json'); 
    return await res.json(); 
  }

  function gotoList(){ window.location.href = '/inventory/inventories/'; }
  function gotoCreate(){ window.location.href = '/inventory/inventories/create/'; }
  function gotoValidate(id){ window.location.href = `/inventory/inventories/${id}/validate/`; }

  async function initList(){
    try{
      const inventories = await loadInventories();
      renderInventoriesTable(inventories);
      
      document.getElementById('inv-search')?.addEventListener('input', () => filterInventories(inventories));
      document.getElementById('inv-status')?.addEventListener('change', () => filterInventories(inventories));
    }catch(e){ console.error('Inventories load error:', e); }
  }

  function filterInventories(inventories){
    const q = (document.getElementById('inv-search')?.value || '').toLowerCase();
    const status = document.getElementById('inv-status')?.value || '';
    
    const filtered = inventories.filter(inv => {
      const okQ = (inv.responsable_nom + ' ' + inv.date_inventaire).toLowerCase().includes(q);
      const okS = !status || inv.statut === status;
      return okQ && okS;
    });
    
    renderInventoriesTable(filtered);
  }

  function renderInventoriesTable(inventories){
    const tbody = document.getElementById('inventories-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    inventories.forEach(inv => {
      const statusBadge = getStatusBadge(inv.statut);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${inv.id_inventaire}</td>
        <td>${inv.date_inventaire}</td>
        <td>${inv.type_inventaire}</td>
        <td>${inv.responsable_nom}</td>
        <td>${statusBadge}</td>
        <td class="text-end">${inv.taux_conformite}%</td>
        <td class="text-end">${formatPrice(inv.ecart_total_valeur)}</td>
        <td class="text-center">
          ${inv.statut === 'en_cours' ? `<button class="btn-sm btn-primary" onclick="Inventories.gotoValidate(${inv.id_inventaire})">Valider</button>` : '-'}
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    document.getElementById('inventories-count').textContent = inventories.length;
  }

  function getStatusBadge(status){
    const badges = {
      'en_cours': '<span class="badge text-bg-warning">En cours</span>',
      'valide': '<span class="badge text-bg-success">Validé</span>',
      'annule': '<span class="badge text-bg-danger">Annulé</span>'
    };
    return badges[status] || status;
  }

  async function initCreate(){
    try{
      const [products, stock] = await Promise.all([loadProducts(), loadStock()]);
      
      window.inventoryLines = [];
      
      products.forEach(p => {
        const stockItem = stock.find(s => s.id_produit === p.id_produit);
        window.inventoryLines.push({
          id_produit: p.id_produit,
          nom_produit: p.nom,
          quantite_theorique: stockItem?.quantite_disponible || 0,
          quantite_reelle: stockItem?.quantite_disponible || 0,
          ecart: 0,
          valeur_ecart: 0,
          prix_achat: p.prix_achat
        });
      });
      
      renderInventoryLines();
      
      document.getElementById('btn-save-inventory')?.addEventListener('click', saveInventory);
    }catch(e){ console.error('Create init error:', e); }
  }

  function renderInventoryLines(){
    const tbody = document.getElementById('inventory-lines-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    window.inventoryLines.forEach((line, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${line.nom_produit}</td>
        <td class="text-center">${line.quantite_theorique}</td>
        <td class="text-center">
          <input type="number" class="form-control text-center" id="qty-real-${idx}" value="${line.quantite_reelle}" min="0" onchange="Inventories.updateLine(${idx})">
        </td>
        <td class="text-center" id="ecart-${idx}">${line.ecart}</td>
        <td class="text-end" id="valeur-${idx}">${formatPrice(line.valeur_ecart)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function updateLine(idx){
    const line = window.inventoryLines[idx];
    const qtyReal = parseInt(document.getElementById(`qty-real-${idx}`).value) || 0;
    
    line.quantite_reelle = qtyReal;
    line.ecart = qtyReal - line.quantite_theorique;
    line.valeur_ecart = line.ecart * line.prix_achat;
    
    document.getElementById(`ecart-${idx}`).textContent = line.ecart;
    document.getElementById(`valeur-${idx}`).textContent = formatPrice(line.valeur_ecart);
  }

  function saveInventory(){
    alert('Inventaire créé avec succès !');
    window.location.href = '/inventory/inventories/';
  }

  return { initList, initCreate, gotoList, gotoCreate, gotoValidate, updateLine };
})();
