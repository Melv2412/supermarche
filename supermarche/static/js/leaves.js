window.Leaves = (function(){
  async function loadLeaves(){ 
    const res = await fetch('/static/data/leaves.json'); 
    return await res.json(); 
  }

  function gotoList(){ window.location.href = '/employees/leaves/'; }
  function gotoRequest(){ window.location.href = '/employees/leaves/request/'; }

  async function initList(){
    try{
      const leaves = await loadLeaves();
      renderLeavesTable(leaves);
      document.getElementById('leave-status')?.addEventListener('change', () => filterLeaves(leaves));
    }catch(e){ console.error('Leaves load error:', e); }
  }

  function filterLeaves(leaves){
    const status = document.getElementById('leave-status')?.value || '';
    const filtered = !status ? leaves : leaves.filter(l => l.status === status);
    renderLeavesTable(filtered);
  }

  function renderLeavesTable(leaves){
    const tbody = document.getElementById('leaves-tbody');
    if(!tbody) return;
    tbody.innerHTML = '';
    leaves.forEach(l => {
      const badges = {pending: 'warning', approved: 'success', rejected: 'danger'};
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${l.employee}</td><td>${l.type}</td><td>${l.start_date}</td><td>${l.end_date}</td><td>${l.days}</td><td><span class="badge text-bg-${badges[l.status]}">${l.status}</span></td><td class="text-center">${l.status === 'pending' ? `<button class="btn-sm btn-success" onclick="Leaves.approve(${l.id})">✓</button> <button class="btn-sm btn-danger" onclick="Leaves.reject(${l.id})">✗</button>` : '-'}</td>`;
      tbody.appendChild(tr);
    });
    document.getElementById('leaves-count').textContent = leaves.length;
  }

  function approve(id){ alert('Congé approuvé !'); window.location.reload(); }
  function reject(id){ alert('Congé rejeté !'); window.location.reload(); }

  return { initList, gotoList, gotoRequest, approve, reject };
})();
