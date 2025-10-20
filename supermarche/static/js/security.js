window.AppSec = (function(){
  function showError(errorId, show){
    const el = document.getElementById(errorId);
    if(el){
      if(show){
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
  }

  function goto(page){
    const map = { login: '/security/login/', register: '/security/register/', reset: '/security/reset/' };
    window.location.href = map[page] || '#';
    return false;
  }

  function initLogin(){
    const form = document.getElementById('form-login');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const roleSel = document.getElementById('role');
      const okEmail = email.checkValidity();
      const okPwd = password.value.length >= 6;
      const okRole = !!roleSel?.value;
      
      // Afficher les erreurs uniquement après soumission
      showError('email-error', !okEmail);
      showError('password-error', !okPwd);
      showError('role-error', !okRole);
      if(okEmail && okPwd && okRole){
        // store session (front-only)
        localStorage.setItem('user_email', email.value);
        localStorage.setItem('role', roleSel.value);
        
        // Chercher le nom dans customers.json d'abord
        fetch('/static/data/customers.json')
          .then(res => res.json())
          .then(customers => {
            const client = customers.find(c => c.email === email.value);
            if(client) {
              localStorage.setItem('user_name', client.name);
            } else {
              // Sinon extraire depuis l'email
              const userName = email.value.split('@')[0].replace(/[._-]/g, ' ');
              const capitalizedName = userName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
              localStorage.setItem('user_name', capitalizedName);
            }
          })
          .catch(e => {
            // En cas d'erreur, extraire depuis l'email
            const userName = email.value.split('@')[0].replace(/[._-]/g, ' ');
            const capitalizedName = userName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            localStorage.setItem('user_name', capitalizedName);
          });
        
        // redirect per role
        const role = roleSel.value;
        const dest = {
          admin: '/reporting/',
          rh: '/employees/',
          caissier: '/sales/pos/',
          client: '/customers/'
        }[role] || '/';
        window.location.href = dest;
      }
    });
  }

  function initRegister(){
    const form = document.getElementById('form-register');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fullname = document.getElementById('fullname');
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const password2 = document.getElementById('password2');
      const okName = fullname.value.trim().length > 0;
      const okEmail = email.checkValidity();
      const okPwd = password.value.length >= 6;
      const okMatch = password.value === password2.value;
      
      // Afficher les erreurs uniquement après soumission
      showError('fullname-error', !okName);
      showError('email-error', !okEmail);
      showError('password-error', !okPwd);
      showError('password2-error', !okMatch);
      
      if(okName && okEmail && okPwd && okMatch){
        alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        window.location.href = '/security/login/';
      }
    });
  }

  function initReset(){
    const form = document.getElementById('form-reset');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email');
      const okEmail = email.checkValidity();
      
      showError('email-error', !okEmail);
      
      if(okEmail){ 
        alert('Lien de réinitialisation envoyé à ' + email.value);
        window.location.href = '/security/login/';
      }
    });
  }

  return { goto, initLogin, initRegister, initReset };
})();
