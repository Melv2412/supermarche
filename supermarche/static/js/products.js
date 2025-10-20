window.Products = (function(){
  const state = { items: [], page: 1, size: 8, filtered: [], categories: [], categoriesMap: {} };

  function formatPrice(v){ 
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  }

  function gotoList(){ window.location.href = '/products/'; }
  function gotoForm(){ window.location.href = '/products/create/'; }
  function gotoCategoryList(){ window.location.href = '/products/categories/'; }
  function gotoCategoryForm(){ window.location.href = '/products/categories/create/'; }
  function gotoScanner(){ window.location.href = '/products/barcode/'; }

  async function loadCategories(){
    try{
      const res = await fetch('/api/categories/');
      return await res.json();
    }catch(e){ console.error('Categories load error:', e); return []; }
  }

  function renderCategories(selectEl, categories){
    if(!selectEl) return;
    // Garder uniquement l'option par défaut si elle existe
    const hasDefault = selectEl.options.length > 0 && selectEl.options[0].value === '';
    if(!hasDefault) {
      selectEl.innerHTML = '<option value="">Choisir une catégorie...</option>';
    }
    
    categories.forEach(c => { 
      const opt = document.createElement('option'); 
      opt.value = c.id_categorie; 
      opt.textContent = c.nom; 
      selectEl.appendChild(opt); 
    });
  }

  function applyFilters(){
    const cat = document.getElementById('prod-category')?.value || '';
    const q = (document.getElementById('prod-search')?.value || '').toLowerCase();
    state.filtered = state.items.filter(i => {
      const okCat = !cat || i.id_categorie == cat;
      const okQ = (i.nom+' '+(i.code_barre||'')).toLowerCase().includes(q);
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
      const categoryName = state.categoriesMap[p.id_categorie] || 'Non définie';
      tr.innerHTML = `
        <td>${p.nom}</td>
        <td>${categoryName}</td>
        <td>${p.code_barre||'-'}</td>
        <td class="text-end">${formatPrice(p.prix_unitaire)}</td>
        <td class="text-end">${formatPrice(p.prix_achat)}</td>
        <td class="text-center">${p.seuil_reapprovisionnement||'-'}</td>
        <td class="text-center">${p.est_perissable ? 'Oui' : 'Non'}</td>
        <td class="text-center">${p.actif ? 'Actif' : 'Inactif'}</td>`;
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
      const [products, categories] = await Promise.all([
        fetch('/api/products/').then(r => r.json()),
        loadCategories()
      ]);
      
      console.log('Produits chargés:', products.length);
      console.log('Catégories chargées:', categories.length);
      
      state.items = products;
      state.categories = categories;
      
      // Créer un map ID -> Nom pour les catégories
      state.categoriesMap = {};
      categories.forEach(cat => {
        state.categoriesMap[cat.id_categorie] = cat.nom;
      });
      
      console.log('CategoriesMap créé:', state.categoriesMap);
      
      renderCategories(document.getElementById('prod-category'), categories);
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
    const priceAchat = document.getElementById('f-price-achat');
    const seuil = document.getElementById('f-seuil');
    const perissable = document.getElementById('f-perissable');
    const desc = document.getElementById('f-desc');

    const okName = name.value.trim().length>0;
    const okCat = cat.value.trim().length>0;
    const okPrice = Number(price.value)>=0;
    const okPriceAchat = Number(priceAchat.value)>=0;
    const okSeuil = Number(seuil.value)>=0;
    
    setValidity(name, okName);
    setValidity(cat, okCat);
    setValidity(price, okPrice);
    setValidity(priceAchat, okPriceAchat);
    setValidity(seuil, okSeuil);

    if(!(okName && okCat && okPrice && okPriceAchat && okSeuil)) return;

    const marge = Number(price.value) - Number(priceAchat.value);
    const margePercent = Number(priceAchat.value) > 0 ? ((marge / Number(priceAchat.value)) * 100).toFixed(1) : 0;
    
    const html = `
      <div class="row g-2">
        <div class="col-md-6"><strong>${name.value}</strong></div>
        <div class="col-md-3 text-muted small">Catégorie: ${cat.value}</div>
        <div class="col-md-3 text-end">${formatPrice(Number(price.value))}</div>
        <div class="col-12 text-muted small">Code-barres: ${barcode.value||'-'}</div>
        <div class="col-6">Prix d'achat: ${formatPrice(Number(priceAchat.value))}</div>
        <div class="col-6">Marge: ${formatPrice(marge)} (${margePercent}%)</div>
        <div class="col-6">Seuil: ${seuil.value} unités</div>
        <div class="col-6">Périssable: ${perissable.checked ? 'Oui' : 'Non'}</div>
        <div class="col-12">${(desc.value||'').replace(/\n/g,'<br>')}</div>
      </div>`;
    document.getElementById('preview').innerHTML = html;
  }

  async function initForm(){
    const loadingEl = document.getElementById('category-loading');
    try{
      const categories = await loadCategories();
      const sel = document.getElementById('f-category');
      renderCategories(sel, categories);
      
      // Masquer le message de chargement et afficher le résultat
      if(loadingEl) {
        if(categories.length > 0) {
          loadingEl.textContent = `✅ ${categories.length} catégorie(s) chargée(s)`;
          loadingEl.className = 'text-sm text-green-600 mt-1';
          setTimeout(() => loadingEl.classList.add('hidden'), 3000);
        } else {
          loadingEl.textContent = '⚠️ Aucune catégorie trouvée. Créez-en une d\'abord.';
          loadingEl.className = 'text-sm text-orange-600 mt-1';
        }
      }
    }catch(e){ 
      console.warn('Catégories non chargées:', e);
      if(loadingEl) {
        loadingEl.textContent = '❌ Erreur de chargement des catégories';
        loadingEl.className = 'text-sm text-red-600 mt-1';
      }
    }

    const form = document.getElementById('product-form');
    form?.addEventListener('submit', async (e) => { 
      e.preventDefault(); 
      
      const name = document.getElementById('f-name');
      const cat = document.getElementById('f-category');
      const barcode = document.getElementById('f-barcode');
      const price = document.getElementById('f-price');
      const priceAchat = document.getElementById('f-price-achat');
      const seuil = document.getElementById('f-seuil');
      const perissable = document.getElementById('f-perissable');
      const desc = document.getElementById('f-desc');

      const okName = name.value.trim().length>0;
      const okCat = cat.value.trim().length>0;
      const okPrice = Number(price.value)>=0;
      const okPriceAchat = Number(priceAchat.value)>=0;
      const okSeuil = Number(seuil.value)>=0;

      if(!(okName && okCat && okPrice && okPriceAchat && okSeuil)) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      try {
        const response = await fetch('/api/products/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
          },
          body: JSON.stringify({
            nom: name.value.trim(),
            id_categorie: Number(cat.value),
            code_barre: barcode.value.trim() || null,
            prix_unitaire: Number(price.value),
            prix_achat: Number(priceAchat.value),
            seuil_reapprovisionnement: Number(seuil.value),
            est_perissable: perissable.checked,
            description: desc.value.trim() || ''
          })
        });
        
        if(response.ok){
          alert('Produit créé avec succès !');
          window.location.href = '/products/';
        } else {
          const error = await response.json();
          alert('Erreur: ' + (error.nom?.[0] || error.code_barre?.[0] || 'Impossible de créer le produit'));
        }
      } catch(error) {
        console.error('Erreur création produit:', error);
        alert('Erreur lors de la création du produit');
      }
    });
  }

  // Categories
  async function initCategoryList(){
    try{
      const cats = await loadCategories();
      const qEl = document.getElementById('cat-search');
      const tbody = document.getElementById('cat-tbody');
      const count = document.getElementById('cat-count');
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const filtered = cats.filter(c => c.nom.toLowerCase().includes(q));
        tbody.innerHTML = '';
        filtered.forEach(c => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${c.nom}</td><td class="text-muted small">${c.description||''}</td>`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      render();
    }catch(e){ console.error('Categories load error:', e); }
  }

  async function initCategoryForm(){
    const form = document.getElementById('category-form');
    function setValidity(input, valid){ if(valid){ input.classList.remove('is-invalid'); input.classList.add('is-valid'); } else { input.classList.remove('is-valid'); input.classList.add('is-invalid'); } }
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('c-name');
      const desc = document.getElementById('c-desc');
      const ok = name.value.trim().length>0;
      setValidity(name, ok);
      
      if(ok){
        try {
          const response = await fetch('/api/categories/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
            },
            body: JSON.stringify({
              nom: name.value.trim(),
              description: desc?.value.trim() || ''
            })
          });
          
          if(response.ok){
            alert('Catégorie créée avec succès !');
            window.location.href = '/products/categories/';
          } else {
            const error = await response.json();
            alert('Erreur: ' + (error.nom?.[0] || 'Impossible de créer la catégorie'));
          }
        } catch(error) {
          console.error('Erreur création catégorie:', error);
          alert('Erreur lors de la création de la catégorie');
        }
      }
    });
  }

  // Scanner
  async function initScanner(){
    try{
      const [products, categories] = await Promise.all([
        fetch('/api/products/').then(r => r.json()),
        loadCategories()
      ]);
      const input = document.getElementById('scan-input');
      const btn = document.getElementById('scan-btn');
      const out = document.getElementById('scan-result');
      function search(){
        const code = (input.value||'').trim();
        if(!code){ out.textContent = 'Aucun résultat.'; return; }
        const p = products.find(x => (x.code_barre||'') === code);
        if(!p){ out.textContent = 'Produit introuvable.'; return; }
        const cat = categories.find(c => c.id_categorie === p.id_categorie);
        out.innerHTML = `<div class="row g-2">
          <div class="col-md-6"><strong>${p.nom}</strong></div>
          <div class="col-md-3 text-muted small">${cat?.nom||'-'}</div>
          <div class="col-md-3 text-end">${formatPrice(p.prix_unitaire)}</div>
          <div class="col-12 text-muted small">Code-barres: ${p.code_barre||'-'}</div>
          <div class="col-6">Prix achat: ${formatPrice(p.prix_achat)}</div>
          <div class="col-6">Seuil: ${p.seuil_reapprovisionnement}</div>
        </div>`;
      }
      btn.addEventListener('click', (e)=>{ e.preventDefault(); search(); });
    }catch(e){ console.error('Scanner error:', e); }
  }

  return { initList, initForm, gotoList, gotoForm, gotoCategoryList, gotoCategoryForm, gotoScanner, initCategoryList, initCategoryForm, initScanner };
})();
