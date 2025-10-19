window.Products = (function(){
  const state = { items: [], page: 1, size: 8, filtered: [], categories: [] };

  function formatPrice(v){ 
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  }

  function gotoList(){ window.location.href = '/products/list/'; }
  function gotoForm(){ window.location.href = '/products/new/'; }
  function gotoCategoryList(){ window.location.href = '/products/categories/'; }
  function gotoCategoryForm(){ window.location.href = '/products/categories/new/'; }
  function gotoScanner(){ window.location.href = '/products/scanner/'; }

  function renderCategories(selectEl){
    const set = new Set(state.items.map(i => i.category).filter(Boolean));
    const cats = Array.from(set).sort();
    cats.forEach(c => { const opt = document.createElement('option'); opt.value=c; opt.textContent=c; selectEl.appendChild(opt); });
  }

  function applyFilters(){
    const cat = document.getElementById('prod-category')?.value || '';
    const q = (document.getElementById('prod-search')?.value || '').toLowerCase();
    state.filtered = state.items.filter(i => {
      const okCat = !cat || i.category === cat;
      const okQ = (i.name+' '+(i.barcode||'')).toLowerCase().includes(q);
      return okCat && okQ;
    });
    state.page = 1;
    renderTable();
  }

  function renderTable(){
    const tbody = document.getElementById('prod-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    const total = state.filtered.length;
    const start = (state.page-1)*state.size;
    const end = Math.min(start+state.size, total);
    const slice = state.filtered.slice(start, end);

    slice.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.name}</td>
        <td>${p.category||'-'}</td>
        <td>${p.barcode||'-'}</td>
        <td class="text-end">${formatPrice(p.price)}</td>`;
      tbody.appendChild(tr);
    });

    const count = document.getElementById('prod-count');
    const range = document.getElementById('prod-range');
    const totalEl = document.getElementById('prod-total');
    count.textContent = total;
    range.textContent = total ? `${start+1}–${end}` : '0–0';
    totalEl.textContent = total;

    document.getElementById('prod-prev')?.addEventListener('click', () => { if(state.page>1){ state.page--; renderTable(); }});
    document.getElementById('prod-next')?.addEventListener('click', () => { if(end<total){ state.page++; renderTable(); }});
  }

  async function initList(){
    try{
      const res = await fetch('/static/data/products.json');
      state.items = await res.json();
      renderCategories(document.getElementById('prod-category'));
      state.filtered = state.items.slice();
      applyFilters();
      document.getElementById('prod-category')?.addEventListener('change', applyFilters);
      document.getElementById('prod-search')?.addEventListener('input', applyFilters);
    }catch(e){ console.error('Erreur chargement produits:', e); }
  }

  function setValidity(input, valid){
    if(valid){ input.classList.remove('is-invalid'); input.classList.add('is-valid'); }
    else { input.classList.remove('is-valid'); input.classList.add('is-invalid'); }
  }

  function preview(){
    const name = document.getElementById('f-name');
    const cat = document.getElementById('f-category');
    const barcode = document.getElementById('f-barcode');
    const price = document.getElementById('f-price');
    const vat = document.getElementById('f-vat');
    const desc = document.getElementById('f-desc');

    const okName = name.value.trim().length>0;
    const okCat = cat.value.trim().length>0;
    const okPrice = Number(price.value)>=0;
    setValidity(name, okName);
    setValidity(cat, okCat);
    setValidity(price, okPrice);

    if(!(okName && okCat && okPrice)) return;

    const totalTTC = Number(price.value) * (1 + (Number(vat.value||0)/100));
    const html = `
      <div class="row g-2">
        <div class="col-md-6"><strong>${name.value}</strong></div>
        <div class="col-md-3 text-muted small">${cat.value}</div>
        <div class="col-md-3 text-end">${formatPrice(totalTTC)}</div>
        <div class="col-12 text-muted small">Code-barres: ${barcode.value||'-'}</div>
        <div class="col-12">${(desc.value||'').replace(/\n/g,'<br>')}</div>
      </div>`;
    document.getElementById('preview').innerHTML = html;
  }

  async function initForm(){
    try{
      // categories depuis produits existants
      const res = await fetch('/static/data/products.json');
      const items = await res.json();
      const sel = document.getElementById('f-category');
      const set = new Set(items.map(i => i.category).filter(Boolean));
      Array.from(set).sort().forEach(c => { const opt = document.createElement('option'); opt.value=c; opt.textContent=c; sel.appendChild(opt); });
    }catch(e){ console.warn('Catégories non chargées:', e); }

    const form = document.getElementById('product-form');
    form?.addEventListener('submit', (e) => { e.preventDefault(); preview(); });
  }

  // Categories
  async function initCategoryList(){
    try{
      const res = await fetch('/static/data/categories.json');
      const cats = await res.json();
      const qEl = document.getElementById('cat-search');
      const tbody = document.getElementById('cat-tbody');
      const count = document.getElementById('cat-count');
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const filtered = cats.filter(c => c.name.toLowerCase().includes(q));
        tbody.innerHTML = '';
        filtered.forEach(c => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${c.name}</td><td class="text-muted small">${c.desc||''}</td>`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      render();
    }catch(e){ console.error('Categories load error:', e); }
  }

  function initCategoryForm(){
    const form = document.getElementById('category-form');
    function setValidity(input, valid){ if(valid){ input.classList.remove('is-invalid'); input.classList.add('is-valid'); } else { input.classList.remove('is-valid'); input.classList.add('is-invalid'); } }
    form?.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = document.getElementById('c-name');
      const ok = name.value.trim().length>0;
      setValidity(name, ok);
      if(ok){ alert('Catégorie enregistrée (simulation).'); }
    });
  }

  // Scanner
  async function initScanner(){
    try{
      const res = await fetch('/static/data/products.json');
      const items = await res.json();
      const input = document.getElementById('scan-input');
      const btn = document.getElementById('scan-btn');
      const out = document.getElementById('scan-result');
      function search(){
        const code = (input.value||'').trim();
        if(!code){ out.textContent = 'Aucun résultat.'; return; }
        const p = items.find(x => (x.barcode||'') === code);
        if(!p){ out.textContent = 'Produit introuvable.'; return; }
        out.innerHTML = `<div class="row g-2"><div class="col-md-6"><strong>${p.name}</strong></div><div class="col-md-3 text-muted small">${p.category||'-'}</div><div class="col-md-3 text-end">${formatPrice(p.price)}</div><div class="col-12 text-muted small">Code-barres: ${p.barcode||'-'}</div></div>`;
      }
      btn.addEventListener('click', (e)=>{ e.preventDefault(); search(); });
    }catch(e){ console.error('Scanner error:', e); }
  }

  return { initList, initForm, gotoList, gotoForm, gotoCategoryList, gotoCategoryForm, gotoScanner, initCategoryList, initCategoryForm, initScanner };
})();
