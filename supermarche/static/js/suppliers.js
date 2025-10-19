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
  function gotoSupplierDetail(id){ window.location.href = `/suppliers/${id}/`; }
  function gotoSupplierForm(){ window.location.href = '/suppliers/new/'; }
  function gotoOrderList(){ window.location.href = '/suppliers/orders/'; }
  function gotoOrderDetail(id){ window.location.href = `/suppliers/orders/${id}/`; }
  function gotoOrderForm(){ window.location.href = '/suppliers/orders/new/'; }

  async function loadSuppliers(){
    const res = await fetch('/static/data/suppliers.json');
    return await res.json();
  }
  async function loadOrders(){
    const res = await fetch('/static/data/orders.json');
    return await res.json();
  }
  async function loadTracking(){
    const res = await fetch('/static/data/tracking.json');
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
            <td>${s.name}</td>
            <td>${s.email||'-'}</td>
            <td>${s.phone||'-'}</td>
            <td>${(s.categories||[]).join(', ')||'-'}</td>
            <td class="text-end"><a href="#" class="btn btn-sm btn-outline-primary" onclick="Suppliers.gotoSupplierDetail(${s.id});return false;">Voir</a></td>`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      render();
    }catch(e){ console.error('Supplier list error:', e); }
  }

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
  function setValidity(input, valid){
    if(valid){ input.classList.remove('is-invalid'); input.classList.add('is-valid'); }
    else { input.classList.remove('is-valid'); input.classList.add('is-invalid'); }
  }
  function initSupplierForm(){
    const form = document.getElementById('supplier-form');
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('f-name');
      const email = document.getElementById('f-email');
      const okName = name.value.trim().length>0;
      const okEmail = email.checkValidity();
      setValidity(name, okName);
      setValidity(email, okEmail);
      if(okName && okEmail){ alert('Fournisseur enregistré (simulation).'); }
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
    form?.addEventListener('submit', (e)=>{ e.preventDefault(); alert('Commande enregistrée (simulation).'); });
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
})();
