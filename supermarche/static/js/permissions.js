window.Permissions = (function(){
  async function loadRoles(){ 
    const res = await fetch('/static/data/roles.json'); 
    return await res.json(); 
  }
  async function loadPermissions(){ 
    const res = await fetch('/static/data/permissions.json'); 
    return await res.json(); 
  }

  function gotoRoles(){ window.location.href = '/security/roles/'; }
  function gotoUsers(){ window.location.href = '/security/users/'; }

  async function initMatrix(){
    try{
      const [roles, permissions] = await Promise.all([loadRoles(), loadPermissions()]);
      renderPermissionsMatrix(roles, permissions);
    }catch(e){ console.error('Matrix load error:', e); }
  }

  function renderPermissionsMatrix(roles, permissions){
    const container = document.getElementById('permissions-matrix');
    if(!container) return;
    
    let html = '<table class="table table-bordered"><thead><tr><th>Permission</th>';
    roles.forEach(r => html += `<th class="text-center">${r.nom_role}</th>`);
    html += '</tr></thead><tbody>';
    
    permissions.forEach(p => {
      html += `<tr><td>${p.nom_permission}</td>`;
      roles.forEach(r => {
        const hasPermission = r.permissions.includes(p.id_permission);
        html += `<td class="text-center">${hasPermission ? '✓' : '-'}</td>`;
      });
      html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
  }

  return { initMatrix, gotoRoles, gotoUsers };
})();
