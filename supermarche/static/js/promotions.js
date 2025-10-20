window.Promotions = (function(){
  let promotions = [];
  let editingId = null;
  
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };

  async function loadPromotions(){ 
    try {
      const res = await fetch('/api/promotions/'); 
      promotions = await res.json();
      updateStats();
      renderTable();
    } catch(e) {
      console.error('Promotions load error:', e);
    }
  }
  
  function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const total = promotions.length;
    const active = promotions.filter(p => p.actif && p.date_debut <= today && p.date_fin >= today).length;
    const upcoming = promotions.filter(p => p.actif && p.date_debut > today).length;
    const expired = promotions.filter(p => p.date_fin < today).length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-active').textContent = active;
    document.getElementById('stat-upcoming').textContent = upcoming;
    document.getElementById('stat-expired').textContent = expired;
  }
  
  function renderTable() {
    const tbody = document.getElementById('promotions-tbody');
    if (!tbody) return;
    
    if (promotions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🎁</div>
            Aucune promotion trouvée
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = promotions.map(p => {
      const today = new Date().toISOString().split('T')[0];
      let statusBadge = '';
      if (!p.actif) {
        statusBadge = '<span class="badge text-bg-secondary">Inactive</span>';
      } else if (p.date_fin < today) {
        statusBadge = '<span class="badge text-bg-danger">Expirée</span>';
      } else if (p.date_debut > today) {
        statusBadge = '<span class="badge text-bg-warning">À venir</span>';
      } else {
        statusBadge = '<span class="badge text-bg-success">Active</span>';
      }
      
      const typeDisplay = {
        'pourcentage': '% Réduction',
        'montant_fixe': 'Montant fixe',
        '2_pour_1': '2 pour 1',
        'gratuit': 'Gratuit'
      }[p.type_promotion] || p.type_promotion;
      
      const valeurDisplay = p.type_promotion === 'pourcentage' ? `${p.valeur}%` : formatPrice(p.valeur);
      
      return `
        <tr>
          <td class="font-medium">${p.nom}</td>
          <td>${typeDisplay}</td>
          <td>${valeurDisplay}</td>
          <td>${new Date(p.date_debut).toLocaleDateString('fr-FR')} - ${new Date(p.date_fin).toLocaleDateString('fr-FR')}</td>
          <td>${statusBadge}</td>
          <td>
            <button onclick="Promotions.edit(${p.id_promotion})" class="btn-sm btn-primary">Modifier</button>
            <button onclick="Promotions.toggleActive(${p.id_promotion})" class="btn-sm ${p.actif ? 'btn-secondary' : 'btn-success'}">
              ${p.actif ? 'Désactiver' : 'Activer'}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  function showCreateModal() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nouvelle promotion';
    document.getElementById('form-promotion').reset();
    document.getElementById('promo-actif').checked = true;
    document.getElementById('modal-form').classList.remove('hidden');
  }
  
  async function edit(id) {
    try {
      const res = await fetch(`/api/promotions/${id}/`);
      const promo = await res.json();
      
      editingId = id;
      document.getElementById('modal-title').textContent = 'Modifier la promotion';
      document.getElementById('promo-nom').value = promo.nom;
      document.getElementById('promo-description').value = promo.description;
      document.getElementById('promo-type').value = promo.type_promotion;
      document.getElementById('promo-valeur').value = promo.valeur;
      document.getElementById('promo-debut').value = promo.date_debut;
      document.getElementById('promo-fin').value = promo.date_fin;
      document.getElementById('promo-actif').checked = promo.actif;
      
      document.getElementById('modal-form').classList.remove('hidden');
    } catch(e) {
      console.error('Erreur:', e);
      alert('Erreur lors du chargement de la promotion');
    }
  }
  
  async function toggleActive(id) {
    const promo = promotions.find(p => p.id_promotion === id);
    if (!promo) return;
    
    try {
      const res = await fetch(`/api/promotions/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ actif: !promo.actif })
      });
      
      if (res.ok) {
        loadPromotions();
      } else {
        alert('Erreur lors de la modification');
      }
    } catch(e) {
      console.error('Erreur:', e);
      alert('Erreur lors de la modification');
    }
  }
  
  function closeModal() {
    document.getElementById('modal-form').classList.add('hidden');
  }
  
  async function savePromotion(e) {
    e.preventDefault();
    
    const data = {
      nom: document.getElementById('promo-nom').value,
      description: document.getElementById('promo-description').value,
      type_promotion: document.getElementById('promo-type').value,
      valeur: document.getElementById('promo-valeur').value,
      date_debut: document.getElementById('promo-debut').value,
      date_fin: document.getElementById('promo-fin').value,
      actif: document.getElementById('promo-actif').checked,
    };
    
    try {
      const url = editingId ? `/api/promotions/${editingId}/` : '/api/promotions/';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + localStorage.getItem('token')
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        alert(editingId ? 'Promotion modifiée avec succès' : 'Promotion créée avec succès');
        closeModal();
        loadPromotions();
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch(e) {
      console.error('Erreur:', e);
      alert('Erreur lors de l\'enregistrement');
    }
  }
  
  function init() {
    loadPromotions();
    document.getElementById('form-promotion')?.addEventListener('submit', savePromotion);
  }

  return { init, showCreateModal, edit, toggleActive, closeModal };
})();
