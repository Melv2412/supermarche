window.Audit = (function(){
  async function loadLogs(){ 
    const res = await fetch('/static/data/logs.json'); 
    return await res.json(); 
  }
  async function loadSessions(){ 
    const res = await fetch('/static/data/sessions.json'); 
    return await res.json(); 
  }

  function gotoLogs(){ window.location.href = '/security/logs/'; }
  function gotoSessions(){ window.location.href = '/security/sessions/'; }

  async function initLogs(){
    try{
      const logs = await loadLogs();
      renderLogsTable(logs);
      document.getElementById('log-type')?.addEventListener('change', () => filterLogs(logs));
      document.getElementById('log-level')?.addEventListener('change', () => filterLogs(logs));
    }catch(e){ console.error('Logs load error:', e); }
  }

  function filterLogs(logs){
    const type = document.getElementById('log-type')?.value || '';
    const level = document.getElementById('log-level')?.value || '';
    const filtered = logs.filter(l => (!type || l.type_log === type) && (!level || l.niveau === level));
    renderLogsTable(filtered);
  }

  function renderLogsTable(logs){
    const tbody = document.getElementById('logs-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    logs.forEach(l => {
      const levelBadges = {info: 'info', warning: 'warning', error: 'danger'};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${l.date_heure}</td><td>${l.username || '-'}</td><td>${l.module}</td><td>${l.action}</td><td><span class="badge text-bg-${levelBadges[l.niveau]}">${l.niveau}</span></td><td>${l.message}</td>`;
      tbody.appendChild(tr);
    });
    document.getElementById('logs-count').textContent = logs.length;
  }

  async function initSessions(){
    try{
      const sessions = await loadSessions();
      renderSessionsTable(sessions);
    }catch(e){ console.error('Sessions load error:', e); }
  }

  function renderSessionsTable(sessions){
    const tbody = document.getElementById('sessions-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    sessions.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${s.id_utilisateur}</td><td>${s.adresse_ip}</td><td>${s.date_debut}</td><td>${s.est_active ? '<span class="badge text-bg-success">Active</span>' : '<span class="badge text-bg-secondary">Fermée</span>'}</td><td class="text-center">${s.est_active ? `<button class="btn-sm btn-danger" onclick="Audit.terminateSession(${s.id_session})">Terminer</button>` : '-'}</td>`;
      tbody.appendChild(tr);
    });
  }

  function terminateSession(id){ if(confirm('Terminer cette session ?')){ alert('Session terminée !'); window.location.reload(); } }

  return { initLogs, initSessions, gotoLogs, gotoSessions, terminateSession };
})();
