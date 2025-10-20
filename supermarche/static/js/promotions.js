window.Promotions = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  async function loadPromotions(){ 
    const res = await fetch('/static/data/promotions.json'); 
    return await res.json(); 
  }

  function gotoList(){ window.location.href = '/sales/promotions/'; }
  function gotoForm(){ window.location.href = '/sales/promotions/create/'; }

  async function initList(){
    try{
      const promotions = await loadPromotions();
      renderPromotionsTable(promotions);
      
      document.getElementById('promo-search')?.addEventListener('input', () => filterPromotions(promotions));
    }catch(e){ console.error('Promotions load error:', e); }
  }

  function filterPromotions(promotions){
    const q = (document.getElementById('promo-search')?.value || '').toLowerCase();
    
    const filtered = promotions.filter(p => {
      return (p.nom + ' ' + p.code).toLowerCase().includes(q);
    });
    
    renderPromotionsTable(filtered);
  }

  function renderPromotionsTable(promotions){
    const tbody = document.getElementById('promotions-tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '';
    promotions.forEach(p => {
      const activeBadge = p.est_active ? '<span class="badge text-bg-success">Active</span>' : '<span class="badge text-bg-secondary">Inactive</span>';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.code}</td>
        <td>${p.nom}</td>
        <td>${p.type_remise === 'pourcentage' ? p.valeur_remise + '%' : formatPrice(p.valeur_remise)}</td>
        <td class="text-end">${formatPrice(p.seuil_minimum)}</td>
        <td>${p.date_debut.split('T')[0]}</td>
        <td>${p.date_fin.split('T')[0]}</td>
        <td class="text-center">${activeBadge}</td>
      `;
      tbody.appendChild(tr);
    });
    
    document.getElementById('promotions-count').textContent = promotions.length;
  }

  function initForm(){
    document.getElementById('btn-save-promo')?.addEventListener('click', savePromotion);
  }

  function savePromotion(){
    const code = document.getElementById('f-code')?.value;
    const nom = document.getElementById('f-nom')?.value;
    
    if(!code || !nom){
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    alert('Promotion créée avec succès !');
    window.location.href = '/sales/promotions/';
  }

  return { initList, initForm, gotoList, gotoForm };
})();
