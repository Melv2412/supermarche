window.Deliveries = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  async function loadDeliveries(){ 
    const res = await fetch('/static/data/deliveries.json'); 
    return await res.json(); 
  }

  function gotoTracking(){ window.location.href = '/suppliers/tracking/'; }
  function gotoReception(id){ window.location.href = `/suppliers/delivery/${id}/receive/`; }

  async function initTracking(){
    try{
      const deliveries = await loadDeliveries();
      renderDeliveriesTable(deliveries);
      
      document.getElementById('delivery-search')?.addEventListener('input', () => filterDeliveries(deliveries));
      document.getElementById('delivery-status')?.addEventListener('change', () => filterDeliveries(deliveries));
    }catch(e){ console.error('Deliveries load error:', e); }
  }

  function filterDeliveries(deliveries){
    const q = (document.getElementById('delivery-search')?.value || '').toLowerCase();
    const status = document.getElementById('delivery-status')?.value || '';
    
    const filtered = deliveries.filter(d => {
      const okQ = (d.numero_livraison + ' ' + d.numero_suivi).toLowerCase().includes(q);
      const okS = !status || d.statut === status;
      return okQ && okS;
    });
    
    renderDeliveriesTable(filtered);
  }

  function renderDeliveriesTable(deliveries){
    const tbody = document.getElementById('deliveries-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    deliveries.forEach(d => {
      const statusBadge = getStatusBadge(d.statut);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.numero_livraison}</td>
        <td>${d.numero_suivi}</td>
        <td>${d.transporteur}</td>
        <td>${d.date_livraison_prevue}</td>
        <td>${statusBadge}</td>
        <td class="text-center">
          ${d.statut === 'en_transit' ? `<button class="btn-sm btn-primary" onclick="Deliveries.gotoReception(${d.id_livraison})">Réceptionner</button>` : '-'}
        </td>
      `;
      tbody.appendChild(tr);
    });
    
    document.getElementById('deliveries-count').textContent = deliveries.length;
  }

  function getStatusBadge(status){
    const badges = {
      'en_transit': '<span class="badge text-bg-warning">En transit</span>',
      'livree': '<span class="badge text-bg-success">Livrée</span>',
      'retardee': '<span class="badge text-bg-danger">Retardée</span>'
    };
    return badges[status] || status;
  }

  async function initReception(deliveryId){
    try{
      const deliveries = await loadDeliveries();
      const delivery = deliveries.find(d => d.id_livraison == deliveryId);
      
      if(!delivery) {
        alert('Livraison non trouvée');
        return;
      }
      
      document.getElementById('delivery-number').textContent = delivery.numero_livraison;
      document.getElementById('tracking-number').textContent = delivery.numero_suivi;
      
      renderReceptionLines(delivery.lignes);
      
      document.getElementById('btn-validate-reception')?.addEventListener('click', () => validateReception(delivery));
    }catch(e){ console.error('Reception init error:', e); }
  }

  function renderReceptionLines(lines){
    const tbody = document.getElementById('reception-lines-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    lines.forEach((line, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${line.nom_produit}</td>
        <td class="text-center">${line.quantite_commandee}</td>
        <td class="text-center">
          <input type="number" class="form-control text-center" id="qty-received-${idx}" value="${line.quantite_commandee}" min="0" max="${line.quantite_commandee}">
        </td>
        <td class="text-center">
          <input type="number" class="form-control text-center" id="qty-damaged-${idx}" value="0" min="0">
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function validateReception(delivery){
    const lines = delivery.lignes.map((line, idx) => ({
      ...line,
      quantite_recue: parseInt(document.getElementById(`qty-received-${idx}`).value) || 0,
      quantite_endommagee: parseInt(document.getElementById(`qty-damaged-${idx}`).value) || 0
    }));
    
    alert('Livraison réceptionnée avec succès !');
    window.location.href = '/suppliers/tracking/';
  }

  return { initTracking, initReception, gotoTracking, gotoReception };
})();
