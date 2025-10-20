window.Complaints = (function(){
  let complaints = [];
  let clients = [];
  
  const statusBadge = (status) => {
    const badges = {
      'ouverte': '<span class="badge text-bg-warning">Ouverte</span>',
      'en_cours': '<span class="badge text-bg-info">En cours</span>',
      'resolue': '<span class="badge text-bg-success">Résolue</span>',
      'fermee': '<span class="badge text-bg-secondary">Fermée</span>',
    };
    return badges[status] || status;
  };
  
  const priorityBadge = (priority) => {
    const badges = {
      'urgente': '<span class="badge text-bg-danger">🔴 Urgente</span>',
      'haute': '<span class="badge text-bg-warning">🟠 Haute</span>',
      'moyenne': '<span class="badge text-bg-info">🟡 Moyenne</span>',
      'basse': '<span class="badge text-bg-secondary">⚪ Basse</span>',
    };
    return badges[priority] || priority;
  };
  
  async function loadComplaints() {
    try {
      const res = await fetch('/api/complaints/');
      complaints = await res.json();
      updateStats();
      renderTable();
    } catch(e) {
      console.error('Erreur chargement réclamations:', e);
    }
  }
  
  async function loadClients() {
    try {
      const res = await fetch('/api/clients/');
      clients = await res.json();
      populateClientSelect();
    } catch(e) {
      console.error('Erreur chargement clients:', e);
    }
  }
  
  function populateClientSelect() {
    const select = document.getElementById('create-client');
    if (!select) return;
    
    select.innerHTML = '<option value="">Sélectionner un client...</option>';
    clients.forEach(client => {
      const option = document.createElement('option');
      option.value = client.id_client;
      option.textContent = `${client.nom} ${client.prenom} (${client.email})`;
      select.appendChild(option);
    });
  }
  
  function updateStats() {
    const total = complaints.length;
    const open = complaints.filter(c => c.statut === 'ouverte').length;
    const progress = complaints.filter(c => c.statut === 'en_cours').length;
    const resolved = complaints.filter(c => c.statut === 'resolue').length;
    
    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-open').textContent = open;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-resolved').textContent = resolved;
  }
  
  function renderTable() {
    const tbody = document.getElementById('complaints-tbody');
    if (!tbody) return;
    
    // Filtres
    const statusFilter = document.getElementById('filter-status')?.value || '';
    const priorityFilter = document.getElementById('filter-priority')?.value || '';
    const searchFilter = document.getElementById('filter-search')?.value.toLowerCase() || '';
    
    let filtered = complaints.filter(c => {
      if (statusFilter && c.statut !== statusFilter) return false;
      if (priorityFilter && c.priorite !== priorityFilter) return false;
      if (searchFilter && !c.sujet.toLowerCase().includes(searchFilter) && !c.client_nom.toLowerCase().includes(searchFilter)) return false;
      return true;
    });
    
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">📭</div>
            Aucune réclamation trouvée
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td class="font-medium">#${c.id_reclamation}</td>
        <td>${c.client_nom || 'N/A'}</td>
        <td>${c.sujet}</td>
        <td>${priorityBadge(c.priorite)}</td>
        <td>${statusBadge(c.statut)}</td>
        <td>${new Date(c.date_creation).toLocaleDateString('fr-FR')}</td>
        <td>
          <button onclick="Complaints.showDetails(${c.id_reclamation})" class="btn-sm btn-primary">
            Détails
          </button>
          ${c.statut !== 'resolue' && c.statut !== 'fermee' ? `
            <button onclick="Complaints.resolve(${c.id_reclamation})" class="btn-sm btn-success">
              Résoudre
            </button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  }
  
  async function showDetails(id) {
    try {
      const res = await fetch(`/api/complaints/${id}/`);
      const complaint = await res.json();
      
      const content = document.getElementById('modal-details-content');
      content.innerHTML = `
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Client</p>
              <p class="font-medium">${complaint.client_nom}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Date</p>
              <p class="font-medium">${new Date(complaint.date_creation).toLocaleString('fr-FR')}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Priorité</p>
              <p>${priorityBadge(complaint.priorite)}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Statut</p>
              <p>${statusBadge(complaint.statut)}</p>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-2">Sujet</p>
            <p class="font-medium text-lg">${complaint.sujet}</p>
          </div>
          <div>
            <p class="text-sm text-gray-600 mb-2">Description</p>
            <p class="text-gray-700">${complaint.description}</p>
          </div>
          ${complaint.reponse ? `
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-sm text-gray-600 mb-2">Réponse</p>
              <p class="text-gray-700">${complaint.reponse}</p>
              <p class="text-sm text-gray-500 mt-2">Par ${complaint.responsable} le ${new Date(complaint.date_resolution).toLocaleString('fr-FR')}</p>
            </div>
          ` : ''}
        </div>
      `;
      
      document.getElementById('modal-details').classList.remove('hidden');
    } catch(e) {
      console.error('Erreur:', e);
      alert('Erreur lors du chargement des détails');
    }
  }
  
  async function resolve(id) {
    const reponse = prompt('Entrez votre réponse à la réclamation:');
    if (!reponse) return;
    
    const responsable = localStorage.getItem('user_name') || 'Service client';
    
    try {
      const res = await fetch(`/api/complaints/${id}/resolve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ reponse, responsable })
      });
      
      if (res.ok) {
        alert('Réclamation résolue avec succès');
        loadComplaints();
      } else {
        alert('Erreur lors de la résolution');
      }
    } catch(e) {
      console.error('Erreur:', e);
      alert('Erreur lors de la résolution');
    }
  }
  
  function showCreateModal() {
    document.getElementById('modal-create').classList.remove('hidden');
  }
  
  function closeModal() {
    document.getElementById('modal-details')?.classList.add('hidden');
    document.getElementById('modal-create')?.classList.add('hidden');
  }
  
  async function createComplaint(e) {
    e.preventDefault();
    
    const data = {
      id_client: document.getElementById('create-client').value,
      sujet: document.getElementById('create-subject').value,
      description: document.getElementById('create-description').value,
      priorite: document.getElementById('create-priority').value,
    };
    
    try {
      const res = await fetch('/api/complaints/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Token ' + localStorage.getItem('token')
        },
        body: JSON.stringify(data)
      });
      
      if (res.ok) {
        alert('Réclamation créée avec succès');
        closeModal();
        document.getElementById('form-create-complaint').reset();
        loadComplaints();
      } else {
        alert('Erreur lors de la création');
      }
    } catch(e) {
      console.error('Erreur:', e);
      alert('Erreur lors de la création');
    }
  }
  
  function init() {
    loadComplaints();
    loadClients();
    
    // Événements filtres
    document.getElementById('filter-status')?.addEventListener('change', renderTable);
    document.getElementById('filter-priority')?.addEventListener('change', renderTable);
    document.getElementById('filter-search')?.addEventListener('input', renderTable);
    
    // Événement formulaire
    document.getElementById('form-create-complaint')?.addEventListener('submit', createComplaint);
  }
  
  return {
    init,
    showDetails,
    resolve,
    showCreateModal,
    closeModal
  };
})();
