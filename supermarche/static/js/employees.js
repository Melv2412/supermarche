window.Employees = (function(){
  const fmt = (v)=> (v||0).toLocaleString('fr-FR');
  const badge = (ok)=> ok? '<span class="badge text-bg-success">Actif</span>' : '<span class="badge text-bg-secondary">Inactif</span>';

  // navigation
  function gotoList(){ window.location.href = '/employees/'; }
  function gotoDetail(id){ window.location.href = `/employees/detail/?id=${id||1}`; }
  function gotoForm(){ window.location.href = '/employees/create/'; }

  async function loadEmployees(){ const r = await fetch('/api/employees/'); return await r.json(); }
  async function loadSchedules(){ const r = await fetch('/api/schedules/'); return await r.json(); }
  async function loadLeaves(){ const r = await fetch('/api/leaves/'); return await r.json(); }
  async function loadReviews(){ const r = await fetch('/api/performance/'); return await r.json(); }
  async function loadTrainings(){ const r = await fetch('/static/data/trainings.json'); return await r.json(); }

  // List
  async function initList(){
    try{
      const data = await loadEmployees();
      const qEl = document.getElementById('emp-search');
      const roleEl = document.getElementById('emp-role');
      const tbody = document.getElementById('emp-tbody');
      const count = document.getElementById('emp-count');
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const role = roleEl.value||'';
        const filtered = data.filter(e => {
          const okQ = (e.name+' '+e.email+' '+e.role).toLowerCase().includes(q);
          const okR = !role || e.role===role;
          return okQ && okR;
        });
        tbody.innerHTML = '';
        filtered.forEach(e=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${e.name}</td><td>${e.email}</td><td>${e.role}</td><td>${badge(e.active)}</td><td class="text-end"><a href="#" class="btn btn-sm btn-outline-primary" onclick="Employees.gotoDetail(${e.id});return false;">Voir</a></td>`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      roleEl.addEventListener('change', render);
      render();
    }catch(e){ console.error('Employees list error:', e); }
  }

  // Detail
  async function initDetail(){
    try{
      const params = new URLSearchParams(window.location.search);
      const id = Number(params.get('id')||1);
      const [emps, schedules, leaves] = await Promise.all([loadEmployees(), loadSchedules(), loadLeaves()]);
      const emp = emps.find(x=>x.id===id) || emps[0];
      document.getElementById('emp-name').textContent = emp.name;
      document.getElementById('emp-email').textContent = emp.email;
      document.getElementById('emp-role').textContent = emp.role;
      document.getElementById('emp-status').innerHTML = badge(emp.active);
      document.getElementById('emp-notes').textContent = emp.notes||'-';
      // week
      document.getElementById('emp-week').textContent = schedules.week;
      const ul = document.getElementById('emp-shifts');
      ul.innerHTML = '';
      const plan = (schedules.weekly || []).find(p=>p.id===emp.id);
      (plan?.days||[]).forEach(d=>{
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `<span>${d.day}</span><span class="small text-muted">${d.shift||'-'}</span>`;
        ul.appendChild(li);
      });
      // leaves
      const tbody = document.getElementById('emp-leaves');
      tbody.innerHTML = '';
      (leaves||[]).filter(l=>l.id===emp.id).forEach(l=>{
        const stClass = l.status==='approved'?'success':(l.status==='rejected'?'danger':'secondary');
        const stLabel = l.status==='approved'?'Approuvé':(l.status==='rejected'?'Refusé':'En attente');
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${l.from} → ${l.to}</td><td>${l.type}</td><td><span class="badge text-bg-${stClass}">${stLabel}</span></td>`;
        tbody.appendChild(tr);
      });
    }catch(e){ console.error('Employee detail error:', e); }
  }

  // Form
  function setValidity(input, valid){ if(valid){ input.classList.remove('is-invalid'); input.classList.add('is-valid'); } else { input.classList.remove('is-valid'); input.classList.add('is-invalid'); } }
  async function initForm(){
    const form = document.getElementById('emp-form');
    form?.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = document.getElementById('f-name');
      const email = document.getElementById('f-email');
      const role = document.getElementById('f-role');
      const phone = document.getElementById('f-phone');
      const salary = document.getElementById('f-salary');
      const hireDate = document.getElementById('f-hire-date');
      
      const ok = name.value.trim() && email.checkValidity() && role.value;
      setValidity(name, !!name.value.trim());
      setValidity(email, email.checkValidity());
      setValidity(role, !!role.value);
      
      if(ok){
        try {
          const birthDate = document.getElementById('f-birth-date');
          const address = document.getElementById('f-address');
          
          // Extraire nom et prénom du nom complet
          const nameParts = name.value.trim().split(' ');
          const prenom = nameParts[0] || 'Prénom';
          const nom = nameParts.slice(1).join(' ') || 'Nom';
          
          const response = await fetch('/api/employees/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]')?.value || ''
            },
            body: JSON.stringify({
              nom: nom,
              prenom: prenom,
              email: email.value.trim(),
              poste: role.value,
              telephone: phone?.value.trim() || '0000000000',
              adresse: address?.value.trim() || '',
              date_naissance: birthDate?.value || '1990-01-01',
              salaire: salary?.value ? Number(salary.value) : 150000,
              date_embauche: hireDate?.value || new Date().toISOString().split('T')[0]
            })
          });
          
          if(response.ok){
            alert('Employé créé avec succès !');
            window.location.href = '/employees/';
          } else {
            const error = await response.json();
            alert('Erreur: ' + (error.nom_complet?.[0] || error.email?.[0] || 'Impossible de créer l\'employé'));
          }
        } catch(error) {
          console.error('Erreur création employé:', error);
          alert('Erreur lors de la création de l\'employé');
        }
      }
    });
  }

  // Schedule table
  async function initSchedule(){
    try{
      const [emps, schedules] = await Promise.all([loadEmployees(), loadSchedules()]);
      const qEl = document.getElementById('sch-search');
      const weekEl = document.getElementById('sch-week');
      const tbody = document.getElementById('sch-tbody');
      const count = document.getElementById('sch-count');
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const filtered = emps.filter(e => (e.name+' '+e.role).toLowerCase().includes(q));
        tbody.innerHTML = '';
        filtered.forEach(e=>{
          const plan = (schedules.weekly||[]).find(p=>p.id===e.id);
          const tr = document.createElement('tr');
          const days = plan?.days || [];
          const tdDays = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => {
            const found = days.find(x=>x.day===d);
            return `<td class="small">${found?.shift||'-'}</td>`; }).join('');
          tr.innerHTML = `<td>${e.name}</td><td>${e.role}</td>${tdDays}`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      weekEl.addEventListener('change', render);
      render();
    }catch(e){ console.error('Schedule error:', e); }
  }

  // Shift planning (day)
  async function initShiftPlanning(){
    try{
      const [emps, schedules] = await Promise.all([loadEmployees(), loadSchedules()]);
      const dateEl = document.getElementById('sh-date');
      const listEl = document.getElementById('sh-list');
      const empSel = document.getElementById('sh-emp');
      const addBtn = document.getElementById('sh-add');
      // fill employees
      emps.forEach(e=>{ const opt=document.createElement('option'); opt.value=e.id; opt.textContent=e.name; empSel.appendChild(opt); });
      function render(){
        const day = (dateEl.value||schedules.today);
        const dayShifts = (schedules.shifts||[]).filter(s=>s.date===day);
        listEl.innerHTML = '';
        dayShifts.forEach(s=>{
          const e = emps.find(x=>x.id===s.id);
          const li = document.createElement('li');
          li.className = 'list-group-item d-flex justify-content-between align-items-center';
          li.innerHTML = `<span>${e?.name||'Employé'} — ${s.role}</span><span class="small text-muted">${s.start}–${s.end}</span>`;
          listEl.appendChild(li);
        });
      }
      addBtn.addEventListener('click', ()=>{
        alert('Ajout de shift simulé (front uniquement).');
      });
      dateEl.value = schedules.today;
      dateEl.addEventListener('change', render);
      render();
    }catch(e){ console.error('Shift planning error:', e); }
  }

  // Leave requests
  async function initLeaveRequests(){
    try{
      const leaves = await loadLeaves();
      const qEl = document.getElementById('lv-search');
      const sEl = document.getElementById('lv-status');
      const tbody = document.getElementById('lv-tbody');
      const count = document.getElementById('lv-count');
      
      function formatDate(date){
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      
      function getStatusBadge(statut){
        if(statut === 'approved') return '<span class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">✅ Approuvé</span>';
        if(statut === 'rejected') return '<span class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">❌ Refusé</span>';
        return '<span class="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">⏳ En attente</span>';
      }
      
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const st = sEl.value||'';
        const filtered = leaves.filter(l => {
          const okQ = (l.nom_employe+' '+l.type+' '+l.motif).toLowerCase().includes(q);
          const okS = !st || l.statut===st;
          return okQ && okS;
        });
        tbody.innerHTML = '';
        filtered.forEach(l=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>
              <div class="font-semibold text-gray-800">${l.nom_employe}</div>
              <div class="text-sm text-gray-500">${l.poste}</div>
            </td>
            <td>
              <div class="text-sm">${formatDate(l.date_debut)}</div>
              <div class="text-xs text-gray-500">au ${formatDate(l.date_fin)}</div>
            </td>
            <td class="text-center">
              <span class="px-2 py-1 bg-violet-100 text-violet-700 rounded text-sm font-medium">${l.duree_jours}j</span>
            </td>
            <td><span class="text-sm font-medium text-gray-700">${l.type}</span></td>
            <td class="text-center">${getStatusBadge(l.statut)}</td>
            <td class="text-sm text-gray-600">${l.motif}</td>
            <td class="text-center">
              ${l.statut === 'pending' ? `
                <button class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm mr-1" onclick="approveLeave(${l.id_demande})">✓</button>
                <button class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm" onclick="rejectLeave(${l.id_demande})">✗</button>
              ` : `<span class="text-gray-400 text-sm">${l.valideur || '-'}</span>`}
            </td>
          `;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      sEl.addEventListener('change', render);
      render();
    }catch(e){ console.error('Leaves error:', e); }
  }

  // Performance
  async function initPerformance(){
    try{
      const [emps, reviews] = await Promise.all([loadEmployees(), loadReviews()]);
      const qEl = document.getElementById('pr-search');
      const pEl = document.getElementById('pr-period');
      const tbody = document.getElementById('pr-tbody');
      const count = document.getElementById('pr-count');
      function render(){
        const q = (qEl.value||'').toLowerCase();
        const period = pEl.value||'';
        const filtered = reviews.filter(r => r.period===period).filter(r => {
          const e = emps.find(x=>x.id===r.id);
          return (e?.name+' '+(e?.role||'')).toLowerCase().includes(q);
        });
        tbody.innerHTML = '';
        filtered.forEach(r=>{
          const e = emps.find(x=>x.id===r.id);
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${e?.name||'-'}</td><td>${e?.role||'-'}</td><td>${r.score}/100</td><td>${r.comment||''}</td>`;
          tbody.appendChild(tr);
        });
        count.textContent = filtered.length;
      }
      qEl.addEventListener('input', render);
      pEl.addEventListener('change', render);
      render();
    }catch(e){ console.error('Performance error:', e); }
  }

  // Training (bonus)
  async function initTraining(){
    try{
      const data = await loadTrainings();
      const tbody = document.getElementById('trn-tbody');
      tbody.innerHTML = '';
      data.forEach(t=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${t.title}</td><td>${t.category}</td><td>${t.duration}</td><td>${t.level}</td>`;
        tbody.appendChild(tr);
      });
    }catch(e){ console.error('Training error:', e); }
  }

  return { gotoList, gotoDetail, gotoForm,
    initList, initDetail, initForm,
    initSchedule, initShiftPlanning, initLeaveRequests, initPerformance, initTraining };
})();
