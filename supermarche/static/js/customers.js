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

  function getCurrentClientId(){
    // Simuler l'ID du client connecté (en réalité viendrait de la session)
    return 1; // Client ID 1 par défaut
  }

  function getCurrentClientEmail(){
    // Simuler l'email du client connecté
    return localStorage.getItem('user_email') || 'client@example.com';
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

  // ESPACE CLIENT - Voir uniquement SES propres données
  async function initMySpace(){
    try{
      const customers = await loadCustomers();
      const currentClientId = getCurrentClientId();
      const myData = customers.find(c => c.id === currentClientId);
      
      if(!myData){
        alert('Données client non trouvées');
        return;
      }

      // Afficher MES informations uniquement
  var el = document.getElementById('my-name');
  if (el) el.textContent = myData.name;
  var el2 = document.getElementById('my-email');
  if (el2) el2.textContent = myData.email;
  var el3 = document.getElementById('my-points');
  if (el3) el3.textContent = fmt(myData.points);
  var el4 = document.getElementById('my-status');
  if (el4) el4.textContent = myData.active ? 'Actif' : 'Inactif';
      
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
