window.Customers = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const els = {
    dash: { q: ()=>document.getElementById('cust-search'), tbody: ()=>document.getElementById('cust-tbody'), count: ()=>document.getElementById('cust-count'), kCust: ()=>document.getElementById('kpi-customers'), kPts: ()=>document.getElementById('kpi-points'), kAvg: ()=>document.getElementById('kpi-avg'), kAct: ()=>document.getElementById('kpi-active') },
    hist: { q: ()=>document.getElementById('hist-search'), type: ()=>document.getElementById('hist-type'), tbody: ()=>document.getElementById('hist-tbody'), count: ()=>document.getElementById('hist-count') }
  };

  function gotoHistory(){ window.location.href = '/customers/points/'; }
  function gotoManagement(){ window.location.href = '/customers/management/'; }
  function gotoMySpace(){ window.location.href = '/customers/'; }

  async function loadCustomers(){
    const res = await fetch('/static/data/customers.json');
    return await res.json();
  }

  async function loadHistory(){
    const res = await fetch('/static/data/points_history.json');
    return await res.json();
  }

  async function loadCurrentPromotions() {
    try {
        console.log('Chargement des promotions...');
        const userEmail = getCurrentClientEmail();
        const res = await fetch(`/api/promotions/current/?email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) {
            console.error('Erreur HTTP:', res.status, res.statusText);
            throw new Error(`Erreur HTTP: ${res.status}`);
        }
        const data = await res.json();
        console.log('Promotions reçues:', data);
        return data;
    } catch (error) {
        console.error('Erreur lors du chargement des promotions:', error);
        return [];
    }
  }

  function getCurrentClientId(){
    return 1; // Client ID 1 par défaut
  }

  function getCurrentClientEmail(){
    return localStorage.getItem('user_email') || 'client@example.com';
  }

  function formatDate(dateString) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  }

  function getPromotionStyle(type) {
    switch(type) {
        case 'pourcentage':
            return 'bg-green-50 border-l-4 border-green-500';
        case 'montant_fixe':
            return 'bg-blue-50 border-l-4 border-blue-500';
        case '2_pour_1':
            return 'bg-purple-50 border-l-4 border-purple-500';
        case 'gratuit':
            return 'bg-orange-50 border-l-4 border-orange-500';
        default:
            return 'bg-gray-50 border-l-4 border-gray-500';
    }
  }

  function formatPromotionValue(promotion) {
    switch(promotion.type_promotion) {
        case 'pourcentage':
            return `${promotion.valeur}% de réduction`;
        case 'montant_fixe':
            return `${promotion.valeur} FCFA de réduction`;
        case '2_pour_1':
            return '2 pour le prix d\'1';
        case 'gratuit':
            return 'Produit gratuit';
        default:
            return `${promotion.valeur} FCFA`;
    }
  }

  function renderDashboard(customers){
    const q = (els.dash.q()?.value||'').toLowerCase();
    const filtered = customers.filter(c => (c.name+' '+c.email).toLowerCase().includes(q));
    const tbody = els.dash.tbody();
    tbody.innerHTML = '';
    filtered.forEach(c => {
      const tr = document.createElement('tr');
      const active = c.active ? '<span class="badge text-bg-success">Actif</span>' : '<span class="badge text-bg-secondary">Inactif</span>';
      tr.innerHTML = `<td>${c.name}</td><td>${c.email}</td><td class="text-end">${fmt(c.points)}</td><td>${active}</td>`;
      tbody.appendChild(tr);
    });
    els.dash.count().textContent = filtered.length;

    // KPIs
    const total = customers.length;
    const sumPts = customers.reduce((s,c)=>s+(c.points||0),0);
    const avg = total? Math.round(sumPts/total) : 0;
    const act = customers.filter(c=>c.active).length;
    els.dash.kCust().textContent = fmt(total);
    els.dash.kPts().textContent = fmt(sumPts);
    els.dash.kAvg().textContent = fmt(avg);
    els.dash.kAct().textContent = fmt(act);
  }

  // Affichage des promotions dans l'espace client
  async function initPromotionsView() {
    console.log('Initialisation de la vue des promotions...');
    const promotionsContainer = document.getElementById('promotions-list');
    if (!promotionsContainer) {
      console.error('Container des promotions non trouvé');
      return;
    }

    try {
        console.log('Chargement des promotions en cours...');
        const promotions = await loadCurrentPromotions();
        console.log('Promotions reçues:', promotions);
        
        if (!Array.isArray(promotions)) {
            console.error('Les données reçues ne sont pas un tableau:', promotions);
            throw new Error('Format de données invalide');
        }
        
        if (promotions.length === 0) {
            promotionsContainer.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <div class="text-4xl mb-2">🎫</div>
                    <div>Aucune promotion en cours actuellement</div>
                </div>`;
            return;
        }

        promotionsContainer.innerHTML = promotions.map(promo => `
            <div class="transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                <div class="p-4 rounded-lg ${getPromotionStyle(promo.type_promotion)}">
                    <div class="flex justify-between items-start">
                        <div class="font-bold text-lg mb-1">
                            ${promo.nom}
                        </div>
                        ${promo.date_fin ? `
                            <div class="text-xs text-gray-600">
                                Jusqu'au ${formatDate(promo.date_fin)}
                            </div>
                        ` : `
                            <div class="text-xs text-gray-600">
                                Offre permanente
                            </div>
                        `}
                    </div>
                    <div class="text-sm font-medium text-gray-800 mt-1">
                        ${formatPromotionValue(promo)}
                    </div>
                    <div class="text-sm text-gray-600 mt-1">${promo.description}</div>
                    ${promo.categories?.length > 0 ? `
                        <div class="mt-2 flex flex-wrap gap-2">
                            ${promo.categories.map(cat => `
                                <span class="px-2 py-1 text-xs rounded-full bg-white bg-opacity-50">
                                    ${cat}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erreur lors de l\'initialisation des promotions:', error);
        promotionsContainer.innerHTML = `
            <div class="text-center text-red-500 py-4">
                <div class="text-4xl mb-2">⚠️</div>
                <div>Une erreur est survenue lors du chargement des offres</div>
            </div>`;
    }
  }

  // ESPACE CLIENT - Voir uniquement SES propres données
  async function initMySpace(){
    try {
      const userEmail = getCurrentClientEmail();
      if (!userEmail) {
        console.error('Email utilisateur non trouvé');
        window.location.href = '/security/login/';
        return;
      }

      // Charger les statistiques du client
      const response = await fetch(`/api/customers/my-stats/?email=${encodeURIComponent(userEmail)}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const data = await response.json();
      console.log('Données client chargées:', data);

      // Mettre à jour l'interface
      document.getElementById('client-name').textContent = data.client.nom;
      document.getElementById('client-email').textContent = data.client.email;
      document.getElementById('client-points').textContent = fmt(data.fidelite.points);
      document.getElementById('my-level').textContent = data.fidelite.niveau;
      
      // Mettre à jour les statistiques
      document.getElementById('my-purchases-month').textContent = data.stats_mois.achats;
      document.getElementById('my-spending-month').textContent = fmt(data.stats_mois.depenses) + ' FCFA';
      document.getElementById('my-savings').textContent = fmt(data.stats_mois.economies) + ' FCFA';

      // Mettre à jour les dernières transactions
      const transactionsContainer = document.getElementById('my-recent-purchases');
      if (transactionsContainer && data.dernieres_transactions?.length > 0) {
        transactionsContainer.innerHTML = data.dernieres_transactions.map(trans => `
          <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
              <div class="font-semibold text-gray-800">${trans.date}</div>
              <div class="text-sm text-gray-600">${trans.numero_ticket}</div>
            </div>
            <div class="text-right">
              <div class="font-bold text-gray-800">${fmt(trans.montant)} FCFA</div>
              <div class="text-sm ${trans.points > 0 ? 'text-green-600' : 'text-gray-600'} font-semibold">
                ${trans.points > 0 ? `+${trans.points} points` : 'Pas de points'}
              </div>
            </div>
          </div>
        `).join('');
      } else if (transactionsContainer) {
        transactionsContainer.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <div class="text-3xl mb-2">📝</div>
            <div>Aucun achat récent</div>
          </div>
        `;
      }

      // Initialiser les promotions
      await initPromotionsView();
      
    }catch(e){ console.error('My space load error:', e); }
  }

  // GESTION CLIENTS - Réservé ADMIN/RH uniquement
  async function initDashboard(){
    try{
      const role = App.Role.getRole();
      
      // Vérifier que l'utilisateur est admin ou RH
      if(role !== 'admin' && role !== 'rh'){
        alert('Accès non autorisé. Cette page est réservée aux administrateurs et RH.');
        window.location.href = '/customers/';
        return;
      }

      const data = await loadCustomers();
      renderDashboard(data);
      els.dash.q()?.addEventListener('input', ()=>renderDashboard(data));
    }catch(e){ console.error('Clients load error:', e); }
  }

  function renderHistory(history){
    const q = (els.hist.q()?.value||'').toLowerCase();
    const type = els.hist.type()?.value||'';
    const filtered = history.filter(h => {
      const okQ = (h.name+' '+h.email).toLowerCase().includes(q);
      const okT = !type || h.type === type;
      return okQ && okT;
    });
    const tbody = els.hist.tbody();
    tbody.innerHTML = '';
    filtered.forEach(h => {
      const badge = h.type==='earn' ? 'success' : (h.type==='redeem'?'warning':'secondary');
      const label = h.type==='earn' ? 'Gain' : (h.type==='redeem'?'Utilisation':'Ajustement');
      const sign = h.type==='redeem' ? '-' : '+';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${h.date}</td>
        <td>${h.name}</td>
        <td>${h.email}</td>
        <td class="text-end">${sign}${fmt(h.points)}</td>
        <td><span class="badge text-bg-${badge}">${label}</span></td>
        <td>${h.note||''}</td>`;
      tbody.appendChild(tr);
    });
    els.hist.count().textContent = filtered.length;
  }

  // HISTORIQUE POINTS - Client voit UNIQUEMENT son historique
  async function initHistory(){
    try{
      const role = App.Role.getRole();
      const allHistory = await loadHistory();
      
      let dataToShow;
      
      if(role === 'client'){
        // CLIENT: Voir uniquement SON historique
        const currentClientId = getCurrentClientId();
        dataToShow = allHistory.filter(h => h.id === currentClientId);
      } else if(role === 'admin' || role === 'rh'){
        // ADMIN/RH: Voir tout l'historique
        dataToShow = allHistory;
      } else {
        alert('Accès non autorisé');
        return;
      }
      
      renderHistory(dataToShow);
      els.hist.q()?.addEventListener('input', ()=>renderHistory(dataToShow));
      els.hist.type()?.addEventListener('change', ()=>renderHistory(dataToShow));
    }catch(e){ console.error('History load error:', e); }
  }

  return { initDashboard, initHistory, initMySpace, gotoHistory, gotoManagement, gotoMySpace };
})();
