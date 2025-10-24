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
  
  function validateForm() {
    let isValid = true;
    const fields = {
      name: document.getElementById('f-name'),
      category: document.getElementById('f-category'),
      price: document.getElementById('f-price')
    };

    // Réinitialiser les erreurs
    Object.keys(fields).forEach(key => {
      const errorEl = document.getElementById(`${key}-error`);
      if(errorEl) errorEl.classList.add('hidden');
    });

    // Validation du nom
    if(!fields.name.value.trim()) {
      document.getElementById('name-error').classList.remove('hidden');
      isValid = false;
    }

    // Validation de la catégorie
    if(!fields.category.value) {
      document.getElementById('category-error').classList.remove('hidden');
      isValid = false;
    }

    // Validation du prix
    const price = parseFloat(fields.price.value);
    if(isNaN(price) || price < 0) {
      document.getElementById('price-error').classList.remove('hidden');
      isValid = false;
    }

    return isValid;
  }

  async function loadCategories(){
    try{
      const res = await fetch('/api/categories/');
      return await res.json();
    }catch(e){ console.error('Categories load error:', e); return []; }
  }

  function updatePreview() {
    const data = {
      nom: document.getElementById('f-name').value,
      categorie: document.getElementById('f-category').options[document.getElementById('f-category').selectedIndex]?.text || '',
      code_barre: document.getElementById('f-barcode').value,
      prix: parseFloat(document.getElementById('f-price').value) || 0,
      tva: parseFloat(document.getElementById('f-vat').value) || 0,
      description: document.getElementById('f-desc').value
    };

    const preview = document.getElementById('preview');
    preview.innerHTML = `
      <div class="grid grid-cols-2 gap-6">
        <div>
          <h3 class="font-medium mb-2">Détails du produit</h3>
          <dl class="space-y-2">
            <dt class="text-sm text-gray-500">Nom</dt>
            <dd class="font-medium">${data.nom || '-'}</dd>
            
            <dt class="text-sm text-gray-500">Catégorie</dt>
            <dd class="font-medium">${data.categorie || '-'}</dd>
            
            <dt class="text-sm text-gray-500">Code-barres</dt>
            <dd class="font-medium">${data.code_barre || '-'}</dd>
          </dl>
        </div>
        <div>
          <h3 class="font-medium mb-2">Tarification</h3>
          <dl class="space-y-2">
            <dt class="text-sm text-gray-500">Prix unitaire HT</dt>
            <dd class="font-medium">${formatPrice(data.prix)}</dd>
            
            <dt class="text-sm text-gray-500">TVA</dt>
            <dd class="font-medium">${data.tva}%</dd>
            
            <dt class="text-sm text-gray-500">Prix TTC</dt>
            <dd class="font-medium text-violet-600">${formatPrice(data.prix * (1 + data.tva/100))}</dd>
          </dl>
        </div>
      </div>
      <div class="mt-4">
        <h3 class="font-medium mb-2">Description</h3>
        <p class="text-gray-600">${data.description || 'Aucune description fournie.'}</p>
      </div>`;

    // Afficher les boutons de confirmation
    document.getElementById('confirm-buttons').classList.remove('hidden');
  }

  async function saveProduct() {
    if(!validateForm()) return;

    const data = {
      nom: document.getElementById('f-name').value.trim(),
      id_categorie: parseInt(document.getElementById('f-category').value),
      code_barre: document.getElementById('f-barcode').value.trim(),
      prix_unitaire: parseFloat(document.getElementById('f-price').value),
      tva: parseFloat(document.getElementById('f-vat').value) || 0,
      description: document.getElementById('f-desc').value.trim()
    };

    try {
      const res = await fetch('/api/products/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify(data)
      });

      if(!res.ok) throw new Error('Erreur lors de la sauvegarde');

      // Redirection vers la liste des produits avec message de succès
      window.location.href = '/products/?success=created';
      
    } catch(e) {
      console.error('Erreur:', e);
      alert('Une erreur est survenue lors de la sauvegarde du produit. Veuillez réessayer.');
    }
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
    if(count) count.textContent = total;
    if(range) range.textContent = total ? `${start+1}–${end}` : '0–0';
    if(totalEl) totalEl.textContent = total;

    const prevBtn = document.getElementById('prod-prev');
    const nextBtn = document.getElementById('prod-next');
    
    if(prevBtn) {
      prevBtn.onclick = () => { 
        if(state.page>1){ 
          state.page--; 
          renderTable(); 
        }
      };
    }
    
    if(nextBtn) {
      nextBtn.onclick = () => { 
        if(end<total){ 
          state.page++; 
          renderTable(); 
        }
      };
    }
  }

  function updateStats() {
    // Nombre total de produits
    const totalProducts = state.items.length;
    document.getElementById('total-products').textContent = totalProducts;

    // Nombre de produits avec stock faible
    const lowStock = state.items.filter(p => p.stock <= p.seuil_reapprovisionnement).length;
    document.getElementById('low-stock').textContent = lowStock;

    // Valeur totale du stock (prix_achat × stock)
    const totalValue = state.items.reduce((sum, p) => {
      return sum + (p.prix_achat * (p.stock || 0));
    }, 0);
    document.getElementById('total-value').textContent = formatPrice(totalValue);
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
      
      // Mettre à jour les statistiques
      updateStats();
      
      renderCategories(document.getElementById('prod-category'), categories);
      state.filtered = state.items.slice();
      applyFilters();
      
      const catSelect = document.getElementById('prod-category');
      const searchInput = document.getElementById('prod-search');
      
      if(catSelect) catSelect.addEventListener('change', applyFilters);
      if(searchInput) searchInput.addEventListener('input', applyFilters);
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
    const form = document.getElementById('product-form');
    if(!form) return;

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

      // Ajout de l'écouteur de soumission du formulaire
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        preview(); // Valider une dernière fois

        const name = document.getElementById('f-name');
        const cat = document.getElementById('f-category');
        const barcode = document.getElementById('f-barcode');
        const price = document.getElementById('f-price');
        const priceAchat = document.getElementById('f-price-achat');
        const seuil = document.getElementById('f-seuil');
        const perissable = document.getElementById('f-perissable');
        const desc = document.getElementById('f-desc');
        const vat = document.getElementById('f-vat');

        // Vérifier la validité
        const okName = name.value.trim().length>0;
        const okCat = cat.value.trim().length>0;
        const okPrice = Number(price.value)>=0;
        const okPriceAchat = Number(priceAchat.value)>=0;
        const okSeuil = Number(seuil.value)>=0;

        if(!(okName && okCat && okPrice && okPriceAchat && okSeuil)){
          alert('Veuillez corriger les erreurs dans le formulaire.');
          return;
        }

        try {
          const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value;
          const response = await fetch('/api/products/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrf
            },
            body: JSON.stringify({
              nom: name.value.trim(),
              id_categorie: cat.value,
              code_barre: barcode.value.trim(),
              prix_unitaire: Number(price.value),
              prix_achat: Number(priceAchat.value),
              seuil_reapprovisionnement: Number(seuil.value),
              est_perissable: perissable.checked,
              description: desc.value.trim(),
              tva: Number(vat.value)
            })
          });

          if (response.ok) {
            const result = await response.json();
            alert('Produit créé avec succès !');
            window.location.href = '/products/';
          } else {
            const error = await response.text();
            alert('Erreur lors de la création : ' + error);
          }
        } catch (error) {
          console.error('Erreur:', error);
          alert('Erreur lors de la création du produit.');
        }
      });
    }catch(e){ 
      console.warn('Catégories non chargées:', e);
      if(loadingEl) {
        loadingEl.textContent = '❌ Erreur de chargement des catégories';
        loadingEl.className = 'text-sm text-red-600 mt-1';
      }
    }
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
    if(!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('c-name');
      const descInput = document.getElementById('c-desc');
      const nameError = document.getElementById('name-error');

      // Validation du nom
      const name = nameInput.value.trim();
      if (!name) {
        if(nameError) nameError.classList.remove('hidden');
        nameInput.classList.add('border-red-500');
        nameInput.focus();
        return;
      } else {
        if(nameError) nameError.classList.add('hidden');
        nameInput.classList.remove('border-red-500');
      }

      try {
        const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value;
        const response = await fetch('/api/categories/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf
          },
          body: JSON.stringify({
            nom: name,
            description: descInput ? descInput.value.trim() : ''
          })
        });

        if (response.ok) {
          const result = await response.json();
          alert('Catégorie créée avec succès !');
          window.location.href = '/products/categories/';
        } else {
          const error = await response.text();
          alert('Erreur lors de la création : ' + error);
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la création de la catégorie.');
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

  return { 
    initList, 
    initForm, 
    gotoList, 
    gotoForm, 
    gotoCategoryList, 
    gotoCategoryForm, 
    gotoScanner, 
    initCategoryList, 
    initCategoryForm, 
    initScanner 
  };
})();