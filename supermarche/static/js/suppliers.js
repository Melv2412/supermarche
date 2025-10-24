window.Suppliers = (function(){
  const fmtPrice = (v)=> {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };
  
  const badgeStatus = (s)=>{
    const map={pending:'secondary',confirmed:'primary',shipped:'info',delivered:'success',cancelled:'danger',in_transit:'info',delayed:'warning'};
    const label={pending:'En attente',confirmed:'Confirmée',shipped:'Expédiée',delivered:'Livrée',cancelled:'Annulée',in_transit:'En transit',delayed:'Retardée'};
    return `<span class="badge text-bg-${map[s]||'secondary'}">${label[s]||s}</span>`;
  };

  function gotoSupplierList(){ window.location.href = '/suppliers/'; }
  function gotoSupplierDetail(id){ window.location.href = `/suppliers/detail/?id=${id||1}`; }
  function gotoSupplierForm(){ window.location.href = '/suppliers/create/'; }
  function gotoOrderList(){ window.location.href = '/suppliers/orders/'; }
  function gotoOrderDetail(id){ window.location.href = `/suppliers/orders/detail/?id=${id||1}`; }
  function gotoOrderForm(){ window.location.href = '/suppliers/orders/create/'; }

  async function loadSuppliers(){
    const res = await fetch('/api/suppliers/');
    return await res.json();
  }
  
  async function loadOrders(){
    const res = await fetch('/api/purchase-orders/');
    return await res.json();
  }
  
  async function loadTracking(){
    const res = await fetch('/api/deliveries/');
    return await res.json();
  }

  // Supplier List
  async function initSupplierList(){
    try{
      const data = await loadSuppliers();
      const qEl = document.getElementById('sup-search');
      const tbody = document.getElementById('sup-tbody');
      const count = document.getElementById('sup-count');
      
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const filtered = data.filter(s => (s.name+' '+s.email+' '+(s.phone||'')).toLowerCase().includes(q));
        tbody.innerHTML = '';
        filtered.forEach(s => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="text-violet-600 font-medium">${s.name}</td>
            <td>${s.email||'-'}</td>
            <td>${s.phone||'-'}</td>
            <td>${(s.categories||[]).join(', ')||'-'}</td>
            <td class="text-end">
              <button onclick="Suppliers.gotoSupplierDetail(${s.id})" 
                      class="btn-modern btn-modern-secondary btn-sm">
                Voir détails
              </button>
            </td>`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl?.addEventListener('input', render);
      render();
    }catch(e){ console.error('Supplier list error:', e); }
  }

  // Gestion des erreurs de formulaire
  function showError(elementId, show) {
    const error = document.getElementById(elementId);
    if (error) {
      if (show) {
        error.classList.remove('hidden');
      } else {
        error.classList.add('hidden');
      }
    }
  }

  function validateField(input, errorId, condition) {
    if (!input) return true;
    const isValid = condition(input.value);
    if (isValid) {
      input.classList.remove('border-red-500');
      input.classList.add('border-green-500');
    } else {
      input.classList.remove('border-green-500');
      input.classList.add('border-red-500');
    }
    showError(errorId, !isValid);
    return isValid;
  }

  // Supplier Form
  async function initSupplierForm(){
    const form = document.getElementById('supplier-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Récupération des champs
      const name = document.getElementById('f-name');
      const email = document.getElementById('f-email');
      const phone = document.getElementById('f-phone');
      const categories = document.getElementById('f-categories');
      const address = document.getElementById('f-address');
      const notes = document.getElementById('f-notes');

      // Validation
      const isValid = 
        validateField(name, 'name-error', value => value.trim().length > 0) &&
        validateField(email, 'email-error', value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) &&
        validateField(phone, 'phone-error', value => value.trim().length >= 8);

      if (!isValid) {
        return;
      }

      try {
        const formData = {
          nom: name.value.trim(),
          email: email.value.trim(),
          telephone: phone.value.trim(),
          categories: categories.value.split(',').map(c => c.trim()).filter(c => c),
          adresse: address.value.trim(),
          notes: notes.value.trim()
        };

        const response = await fetch('/api/suppliers/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
          },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const result = await response.json();
          // Redirection vers la liste des fournisseurs avec un message de succès
          window.location.href = '/suppliers/?success=created';
        } else {
          const error = await response.text();
          alert('Erreur lors de la création : ' + error);
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Une erreur est survenue lors de la création du fournisseur.');
      }
    });
  }

  return { 
    initSupplierList, 
    initSupplierForm,
    gotoSupplierList, 
    gotoSupplierForm, 
    gotoSupplierDetail,
    gotoOrderList,
    gotoOrderForm,
    gotoOrderDetail
  };
})();

  // Supplier Detail
  async function initSupplierDetail(){
    try{
      const params = new URLSearchParams(window.location.search);
      const id = Number(params.get('id')||1);
      const [suppliers, orders] = await Promise.all([loadSuppliers(), loadOrders()]);
      const sup = suppliers.find(s=>s.id===id) || suppliers[0];
      document.getElementById('sup-name').textContent = sup.name;
      document.getElementById('sup-email').textContent = sup.email||'-';
      document.getElementById('sup-phone').textContent = sup.phone||'-';
      document.getElementById('sup-categories').textContent = (sup.categories||[]).join(', ')||'-';
      document.getElementById('sup-address').textContent = sup.address||'-';
      document.getElementById('sup-notes').textContent = sup.notes||'-';
      const tbody = document.getElementById('sup-orders');
      const related = orders.filter(o=>o.supplier_id===sup.id).slice(0,10);
      tbody.innerHTML = '';
      related.forEach(o=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>#${o.id}</td><td>${o.date}</td><td>${badgeStatus(o.status)}</td><td class="text-end">${fmtPrice(o.amount)}</td>`;
        tbody.appendChild(tr);
      });
    }catch(e){ console.error('Supplier detail error:', e); }
  }

  // Supplier Form
  function showError(elementId, show) {
    const error = document.getElementById(elementId);
    if (error) {
      if (show) {
        error.classList.remove('hidden');
      } else {
        error.classList.add('hidden');
      }
    }
  }

  function validateField(input, errorId, condition) {
    if (!input) return true;
    const isValid = condition(input.value);
    if (isValid) {
      input.classList.remove('border-red-500');
      input.classList.add('border-green-500');
    } else {
      input.classList.remove('border-green-500');
      input.classList.add('border-red-500');
    }
    showError(errorId, !isValid);
    return isValid;
  }

  async function initSupplierForm(){
    const form = document.getElementById('supplier-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Récupération des champs
      const name = document.getElementById('f-name');
      const email = document.getElementById('f-email');
      const phone = document.getElementById('f-phone');
      const categories = document.getElementById('f-categories');
      const address = document.getElementById('f-address');
      const notes = document.getElementById('f-notes');

      // Validation
      const isValid = 
        validateField(name, 'name-error', value => value.trim().length > 0) &&
        validateField(email, 'email-error', value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) &&
        validateField(phone, 'phone-error', value => value.trim().length >= 8);
      setValidity(name, okName);
      setValidity(email, okEmail);
      
      if(okName && okEmail){
        try {
          const city = document.getElementById('f-city');
          const country = document.getElementById('f-country');
          const deliveryDays = document.getElementById('f-delivery-days');
          const minOrder = document.getElementById('f-min-order');
          const paymentTerms = document.getElementById('f-payment-terms');
          
          const response = await fetch('/api/suppliers/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
            },
            body: JSON.stringify({
              nom: name.value.trim(),
              email: email.value.trim(),
              telephone: phone?.value.trim() || '0000000000',
              adresse: address?.value.trim() || 'Non spécifié',
              ville: city?.value.trim() || 'Abidjan',
              pays: country?.value.trim() || 'Côte d\'Ivoire',
              delai_livraison_jours: deliveryDays?.value ? Number(deliveryDays.value) : 7,
              montant_commande_min: minOrder?.value ? Number(minOrder.value) : 0,
              conditions_paiement: paymentTerms?.value.trim() || '30 jours'
            })
          });
          
          if(response.ok){
            alert('Fournisseur créé avec succès !');
            window.location.href = '/suppliers/';
          } else {
            const error = await response.json();
            alert('Erreur: ' + (error.nom?.[0] || error.email?.[0] || 'Impossible de créer le fournisseur'));
          }
        } catch(error) {
          console.error('Erreur création fournisseur:', error);
          alert('Erreur lors de la création du fournisseur');
        }
      }
    });
  }

  // Order List
  async function initOrderList(){
    try{
      const data = await loadOrders();
      const qEl = document.getElementById('ord-search');
      const sEl = document.getElementById('ord-status');
      const tbody = document.getElementById('ord-tbody');
      const count = document.getElementById('ord-count');
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const st = sEl.value||'';
        const filtered = data.filter(o => {
          const okQ = (`#${o.id} `+o.supplier).toLowerCase().includes(q);
          const okS = !st || o.status===st;
          return okQ && okS;
        });
        tbody.innerHTML = '';
        filtered.forEach(o=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>#${o.id}</td><td>${o.supplier}</td><td>${o.date}</td><td>${badgeStatus(o.status)}</td><td class="text-end">${fmtPrice(o.amount)}</td>`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      sEl.addEventListener('change', render);
      render();
    }catch(e){ console.error('Order list error:', e); }
  }

  // Order Detail
  async function initOrderDetail(){
    try{
      const params = new URLSearchParams(window.location.search);
      const id = Number(params.get('id')||1);
      const data = await loadOrders();
      const o = data.find(x=>x.id===id) || data[0];
      document.getElementById('ord-id').textContent = `#${o.id}`;
      document.getElementById('ord-supplier').textContent = o.supplier;
      document.getElementById('ord-date').textContent = o.date;
      document.getElementById('ord-status').innerHTML = badgeStatus(o.status);
      document.getElementById('ord-amount').textContent = fmtPrice(o.amount);
      const tbody = document.getElementById('ord-lines');
      tbody.innerHTML = '';
      let total = 0;
      o.lines.forEach(l=>{
        const lineTotal = l.qty * l.unit_price;
        total += lineTotal;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${l.product}</td><td class="text-end">${l.qty}</td><td class="text-end">${fmtPrice(l.unit_price)}</td><td class="text-end">${fmtPrice(lineTotal)}</td>`;
        tbody.appendChild(tr);
      });
      document.getElementById('ord-total').textContent = fmtPrice(total);
    }catch(e){ console.error('Order detail error:', e); }
  }

  // Order Form
  async function initOrderForm(){
    const suppliers = await loadSuppliers();
    const sel = document.getElementById('o-supplier');
    suppliers.forEach(s=>{ const opt=document.createElement('option'); opt.value=s.id; opt.textContent=s.name; sel.appendChild(opt); });

    const tbody = document.getElementById('o-lines');
    const totalEl = document.getElementById('o-total');
    function recalc(){
      let total=0; tbody.querySelectorAll('tr').forEach(tr=>{ const q=Number(tr.querySelector('[data-qty]').value||0); const pu=Number(tr.querySelector('[data-unit]').value||0); total += q*pu; });
      totalEl.textContent = fmtPrice(total);
    }
    function addLine(){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input class="form-control form-control-sm" placeholder="Produit"></td>
        <td class="text-end"><input data-qty type="number" min="1" value="1" class="form-control form-control-sm text-end"></td>
        <td class="text-end"><input data-unit type="number" step="0.01" min="0" value="0" class="form-control form-control-sm text-end"></td>
        <td class="text-end" data-line>Total</td>
        <td class="text-end"><button type="button" class="btn btn-sm btn-outline-danger">X</button></td>`;
      const qty = tr.querySelector('[data-qty]');
      const unit = tr.querySelector('[data-unit]');
      const line = tr.querySelector('[data-line]');
      const btn = tr.querySelector('button');
      function update(){ const v = Number(qty.value||0)*Number(unit.value||0); line.textContent = fmtPrice(v); recalc(); }
      qty.addEventListener('input', update);
      unit.addEventListener('input', update);
      btn.addEventListener('click', ()=>{ tr.remove(); recalc(); });
      tbody.appendChild(tr); update();
    }
    document.getElementById('o-add-line').addEventListener('click', addLine);

    const form = document.getElementById('order-form');
    form?.addEventListener('submit', async (e)=>{ 
      e.preventDefault(); 
      
      const supplier = document.getElementById('o-supplier');
      const deliveryDate = document.getElementById('o-delivery-date');
      
      if(!supplier.value){
        alert('Veuillez sélectionner un fournisseur');
        return;
      }
      
      // Collecter les lignes de commande
      const lines = [];
      tbody.querySelectorAll('tr').forEach(tr => {
        const product = tr.querySelector('input[placeholder="Produit"]').value.trim();
        const qty = Number(tr.querySelector('[data-qty]').value || 0);
        const unit_price = Number(tr.querySelector('[data-unit]').value || 0);
        
        if(product && qty > 0){
          lines.push({ product, qty, unit_price });
        }
      });
      
      if(lines.length === 0){
        alert('Veuillez ajouter au moins un produit à la commande');
        return;
      }
      
      try {
        const response = await fetch('/api/suppliers/orders/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
          },
          body: JSON.stringify({
            id_fournisseur: Number(supplier.value),
            date_livraison_prevue: deliveryDate?.value || null,
            lignes: lines
          })
        });
        
        if(response.ok){
          alert('Commande créée avec succès !');
          window.location.href = '/suppliers/orders/';
        } else {
          const error = await response.json();
          alert('Erreur: ' + (error.detail || 'Impossible de créer la commande'));
        }
      } catch(error) {
        console.error('Erreur création commande:', error);
        alert('Erreur lors de la création de la commande');
      }
    });
  }

  // Tracking
  async function initTracking(){
    try{
      const data = await loadTracking();
      const qEl = document.getElementById('trk-search');
      const sEl = document.getElementById('trk-status');
      const tbody = document.getElementById('trk-tbody');
      const count = document.getElementById('trk-count');
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const st = sEl.value||'';
        const filtered = data.filter(t => {
          const okQ = (`#${t.order_id} `+t.supplier+' '+t.carrier).toLowerCase().includes(q);
          const okS = !st || t.status===st;
          return okQ && okS;
        });
        tbody.innerHTML = '';
        filtered.forEach(t=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>#${t.order_id}</td><td>${t.supplier}</td><td>${t.carrier}</td><td>${badgeStatus(t.status)}</td><td>${t.eta}</td>`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      sEl.addEventListener('change', render);
      render();
    }catch(e){ console.error('Tracking error:', e); }
  }

  return {
    initSupplierList, initSupplierDetail, initSupplierForm,
    initOrderList, initOrderDetail, initOrderForm,
    initTracking,
    gotoSupplierList, gotoSupplierDetail, gotoSupplierForm,
    gotoOrderList, gotoOrderDetail, gotoOrderForm
  };

