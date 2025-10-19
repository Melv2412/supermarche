(function(){
  const state = { items: [], filtered: [], categories: [] };
  const els = {
    cat: document.getElementById('filter-category'),
    thr: document.getElementById('filter-threshold'),
    q: document.getElementById('filter-search'),
    reset: document.getElementById('filter-reset'),
    tbody: document.getElementById('stock-tbody'),
    kpiLow: document.getElementById('kpi-low'),
    kpiOut: document.getElementById('kpi-out'),
    count: document.getElementById('count'),
  };

  function statusBadge(stock, threshold){
    if(stock <= 0) return '<span class="badge text-bg-danger">Rupture</span>';
    if(stock <= threshold) return '<span class="badge text-bg-warning text-dark">Faible</span>';
    return '<span class="badge text-bg-success">OK</span>';
  }

  function renderCategories(){
    // unique categories
    const set = new Set(state.items.map(i => i.category).filter(Boolean));
    state.categories = Array.from(set).sort();
    state.categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      els.cat.appendChild(opt);
    });
  }

  function applyFilters(){
    const cat = els.cat.value || '';
    const thr = Number(els.thr.value || 0);
    const q = (els.q.value || '').toLowerCase();
    state.filtered = state.items.filter(i => {
      const okCat = !cat || i.category === cat;
      const okThr = i.threshold >= 0 ? i.threshold >= 0 : true; // threshold exists
      const okText = i.name.toLowerCase().includes(q);
      return okCat && okThr && okText;
    }).map(i => ({...i, threshold: Math.max(thr, i.threshold)}));
    renderTable();
    renderKPIs();
  }

  function renderTable(){
    els.tbody.innerHTML = '';
    state.filtered.forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.name}</td>
        <td>${i.category || '-'}</td>
        <td class="text-end">${i.stock}</td>
        <td class="text-end">${i.threshold}</td>
        <td>${statusBadge(i.stock, i.threshold)}</td>`;
      els.tbody.appendChild(tr);
    });
    els.count.textContent = state.filtered.length;
  }

  function renderKPIs(){
    const low = state.filtered.filter(i => i.stock > 0 && i.stock <= i.threshold).length;
    const out = state.filtered.filter(i => i.stock <= 0).length;
    els.kpiLow.textContent = low;
    els.kpiOut.textContent = out;
  }

  function wire(){
    els.cat.addEventListener('change', applyFilters);
    els.thr.addEventListener('input', applyFilters);
    els.q.addEventListener('input', applyFilters);
    els.reset.addEventListener('click', () => {
      els.cat.value = '';
      els.thr.value = 10;
      els.q.value = '';
      applyFilters();
    });
  }

  async function load(){
    try{
      const res = await fetch('/static/data/stock.json');
      state.items = await res.json();
      renderCategories();
      applyFilters();
      wire();
    }catch(e){ console.error('Erreur chargement stock:', e); }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
