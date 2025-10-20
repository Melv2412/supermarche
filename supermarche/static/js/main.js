window.App = window.App || {};
App.formatPrice = (v) => {
  const amount = (v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return amount + ' FCFA';
};

// Front-only role utilities
(function(){
  function getRole(){ return localStorage.getItem('role'); }
  function applySidebarVisibility(){
    const role = getRole();
    document.querySelectorAll('[data-roles]')?.forEach(el => {
      const roles = (el.getAttribute('data-roles')||'').split(',').map(s=>s.trim());
      if(roles.length && role && !roles.includes(role)){
        el.style.display = 'none';
      } else if(roles.length && role && roles.includes(role)){
        el.style.display = 'block';
      }
    });
    const badge = document.getElementById('role-badge');
    if(badge && role){ 
      const roleNames = {
        'admin': 'ADMIN',
        'rh': 'RH',
        'caissier': 'CAISSIER',
        'client': 'CLIENT'
      };
      badge.textContent = roleNames[role] || role.toUpperCase(); 
    }
  }
  function guard(){
    const path = window.location.pathname;
    // allow auth pages without role
    const publicPaths = ['/security/login/','/security/register/','/security/reset/'];
    if(publicPaths.includes(path)) return;
    const role = getRole();
    if(!role){ window.location.href = '/security/login/'; return; }
  }
  function logout(){ localStorage.removeItem('role'); localStorage.removeItem('user_email'); window.location.href = '/security/login/'; }
  window.App.Role = { getRole, applySidebarVisibility, guard, logout };
  // run on load
  document.addEventListener('DOMContentLoaded', function(){ guard(); applySidebarVisibility(); });
})();
