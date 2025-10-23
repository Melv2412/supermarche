window.Clients = (function(){
  let clients = [];
  
  const fmt = (v) => (v||0).toLocaleString('fr-FR');
  const formatPrice = (v) => {
    const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return amount + ' FCFA';
  };
  
  async function loadClients() {
    try {
      const res = await fetch('/api/clients/');
      clients = await res.json();
      renderTable();
      updateStats();
    } catch(e) {
      console.error('Erreur chargement clients:', e);
    }
  }
  
  function updateStats() {
    const total = clients.length;
    const active = clients.filter(c => c.actif).length;
    const withCard = clients.filter(c => c.carte_fidelite).length;
    
  var st = document.getElementById('stat-total'); if (st) st.textContent = total;
  var sa = document.getElementById('stat-active'); if (sa) sa.textContent = active;
  var sc = document.getElementById('stat-cards'); if (sc) sc.textContent = withCard;
  }
  
  function renderTable() {
    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;
    
    // Filtres
    const searchFilter = document.getElementById('client-search')?.value.toLowerCase() || '';
    
    let filtered = clients.filter(c => {
      if (searchFilter && !c.nom.toLowerCase().includes(searchFilter) && 
          !c.prenom.toLowerCase().includes(searchFilter) && 
          !c.email.toLowerCase().includes(searchFilter)) return false;
      return true;
    });
    
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">👥</div>
            Aucun client trouvé
          </td>
        </tr>
      `;
      return;
    }
    
    tbody.innerHTML = filtered.map(c => `
      <tr>
        <td class="font-medium">#${c.id_client}</td>
        <td>${c.nom} ${c.prenom}</td>
        <td>${c.email}</td>
        <td>${c.telephone || 'N/A'}</td>
        <td>
          ${c.carte_fidelite ? 
            `<span class="badge text-bg-success">Oui (${c.carte_fidelite.points_actuels} pts)</span>` : 
            '<span class="badge text-bg-secondary">Non</span>'}
        </td>
        <td>
          <button onclick="Clients.showDetails(${c.id_client})" class="btn-sm btn-primary">
            Détails
          </button>
        </td>
      </tr>
    `).join('');
  }
  
  async function showDetails(id) {
    try {
      const res = await fetch(`/api/clients/${id}/`);
      const client = await res.json();
      
      // Charger les transactions
      const transRes = await fetch(`/api/clients/${id}/transactions/`);
      const transactions = await transRes.json();
      
      const content = document.getElementById('modal-details-content');
      content.innerHTML = `
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Nom complet</p>
              <p class="font-medium">${client.nom} ${client.prenom}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Email</p>
              <p class="font-medium">${client.email}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Téléphone</p>
              <p class="font-medium">${client.telephone || 'N/A'}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Date d'inscription</p>
              <p class="font-medium">${new Date(client.date_inscription).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
          
          ${client.carte_fidelite ? `
            <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-lg text-white">
              <p class="text-sm opacity-90">Carte de fidélité</p>
              <p class="text-2xl font-bold">${client.carte_fidelite.points_actuels} points</p>
              <p class="text-sm opacity-90 mt-1">Niveau: ${client.carte_fidelite.niveau}</p>
            </div>
          ` : ''}
          
          <div>
            <p class="text-sm text-gray-600 mb-2">Dernières transactions</p>
            ${transactions.length > 0 ? `
              <div class="space-y-2">
                ${transactions.slice(0, 5).map(t => `
                  <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p class="font-medium">${t.numero_ticket}</p>
                      <p class="text-sm text-gray-600">${new Date(t.date_transaction).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <p class="font-bold">${formatPrice(t.montant_final)}</p>
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-gray-500">Aucune transaction</p>'}
          </div>
        </div>
      `;
      
      document.getElementById('modal-details').classList.remove('hidden');
    } catch(e) {
      console.error('Erreur:', e);
      alert('Erreur lors du chargement des détails');
    }
  }
  
  function closeModal() {
    document.getElementById('modal-details')?.classList.add('hidden');
  }
  
  function init() {
    loadClients();
    document.getElementById('client-search')?.addEventListener('input', renderTable);
  }
  
  return {
    init,
    showDetails,
    closeModal
  };
})();
