window.Orders = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  async function loadOrders(){ 
    const res = await fetch('/api/orders/'); 
    return await res.json(); 
  }
  async function loadSuppliers(){ 
    const res = await fetch('/api/suppliers/'); 
    return await res.json(); 
  }
  async function loadProducts(){ 
    const res = await fetch('/api/products/'); 
    return await res.json(); 
  }

  function gotoList(){ window.location.href = '/suppliers/orders/'; }
  function gotoForm(){ window.location.href = '/suppliers/orders/create/'; }
  function gotoDetail(id){ window.location.href = `/suppliers/orders/${id}/`; }

  async function initList(){
    try{
      const orders = await loadOrders();
      renderOrdersTable(orders);
      
      document.getElementById('order-search')?.addEventListener('input', () => filterOrders(orders));
      document.getElementById('order-status')?.addEventListener('change', () => filterOrders(orders));
    }catch(e){ console.error('Orders load error:', e); }
  }

  function filterOrders(orders){
    const q = (document.getElementById('order-search')?.value || '').toLowerCase();
    const status = document.getElementById('order-status')?.value || '';
    
    const filtered = orders.filter(o => {
      const okQ = (o.supplier + ' ' + o.id).toLowerCase().includes(q);
      const okS = !status || o.status === status;
      return okQ && okS;
    });
    
    renderOrdersTable(filtered);
  }

  function renderOrdersTable(orders){
    const tbody = document.getElementById('orders-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    orders.forEach(o => {
      const statusBadge = getStatusBadge(o.status);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>#${o.id}</td>
        <td>${o.supplier}</td>
        <td>${o.date}</td>
        <td>${statusBadge}</td>
        <td class="text-end">${formatPrice(o.amount)}</td>
        <td class="text-center">
          <button class="btn-sm btn-primary" onclick="Orders.gotoDetail(${o.id})">Détails</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    document.getElementById('orders-count').textContent = orders.length;
  }

  function getStatusBadge(status){
    const badges = {
      'pending': '<span class="badge text-bg-warning">En attente</span>',
      'confirmed': '<span class="badge text-bg-info">Confirmée</span>',
      'shipped': '<span class="badge text-bg-primary">Expédiée</span>',
      'delivered': '<span class="badge text-bg-success">Livrée</span>',
      'cancelled': '<span class="badge text-bg-danger">Annulée</span>'
    };
    return badges[status] || status;
  }

  async function initForm(){
    try{
      const [suppliers, products] = await Promise.all([loadSuppliers(), loadProducts()]);
      
      const supplierSelect = document.getElementById('f-supplier');
      suppliers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        supplierSelect.appendChild(opt);
      });

      window.orderLines = [];
      renderOrderLines();
      
      document.getElementById('btn-add-line')?.addEventListener('click', () => addOrderLine(products));
      document.getElementById('btn-save-order')?.addEventListener('click', saveOrder);
    }catch(e){ console.error('Form init error:', e); }
  }

  function addOrderLine(products){
    const productId = document.getElementById('f-product')?.value;
    const qty = parseInt(document.getElementById('f-qty')?.value) || 0;
    
    if(!productId || qty <= 0){
      alert('Veuillez sélectionner un produit et une quantité valide');
      return;
    }
    
    const product = products.find(p => p.id_produit == productId);
    if(!product) return;
    
    window.orderLines.push({
      product: product.nom,
      product_id: product.id_produit,
      qty: qty,
      unit_price: product.prix_achat
    });
    
    renderOrderLines();
    document.getElementById('f-qty').value = '';
  }

  function renderOrderLines(){
    const tbody = document.getElementById('order-lines-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    let total = 0;
    
    window.orderLines.forEach((line, idx) => {
      const lineTotal = line.qty * line.unit_price;
      total += lineTotal;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${line.product}</td>
        <td class="text-center">${line.qty}</td>
        <td class="text-end">${formatPrice(line.unit_price)}</td>
        <td class="text-end">${formatPrice(lineTotal)}</td>
        <td class="text-center">
          <button class="btn-sm btn-danger" onclick="Orders.removeLine(${idx})">×</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    document.getElementById('order-total').textContent = formatPrice(total);
  }

  function removeLine(idx){
    window.orderLines.splice(idx, 1);
    renderOrderLines();
  }

  function saveOrder(){
    if(window.orderLines.length === 0){
      alert('Ajoutez au moins une ligne à la commande');
      return;
    }
    
    const supplierId = document.getElementById('f-supplier')?.value;
    if(!supplierId){
      alert('Sélectionnez un fournisseur');
      return;
    }
    
    alert('Commande créée avec succès !');
    window.location.href = '/suppliers/orders/';
  }

  return { initList, initForm, gotoList, gotoForm, gotoDetail, removeLine };
})();
