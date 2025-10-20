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
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const okEmail = email.checkValidity();
      const okPwd = password.value.length >= 6;
      
      // Afficher les erreurs uniquement après soumission
      showError('email-error', !okEmail);
      showError('password-error', !okPwd);
      
      if(okEmail && okPwd){
        try {
          // Appel à l'API de connexion
          const response = await fetch('/api/auth/login/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.value,
              password: password.value
            })
          });
          
          const data = await response.json();
          
          if(response.ok) {
            // Stocker les informations utilisateur
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('user_name', data.user.nom_complet);
            localStorage.setItem('role', data.user.role);
            localStorage.setItem('user_id', data.user.id);
            
            // Redirection selon le rôle
            const role = data.user.role;
            const dest = {
              admin: '/reporting/',
              rh: '/employees/',
              caissier: '/sales/pos/',
              client: '/customers/'
            }[role] || '/';
            
            window.location.href = dest;
          } else {
            // Afficher l'erreur
            alert(data.email?.[0] || data.password?.[0] || data.non_field_errors?.[0] || 'Email ou mot de passe incorrect');
          }
        } catch(error) {
          console.error('Erreur de connexion:', error);
          alert('Erreur de connexion. Veuillez réessayer.');
        }
      }
    });
  }

  function initRegister(){
    const form = document.getElementById('form-register');
    form?.addEventListener('submit', async (e) => {
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
        try {
          // Extraire nom et prénom
          const nameParts = fullname.value.trim().split(' ');
          const prenom = nameParts[0] || '';
          const nom = nameParts.slice(1).join(' ') || nameParts[0];
          
          // Appel à l'API d'inscription
          const response = await fetch('/api/auth/register/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: email.value,
              password: password.value,
              password_confirm: password2.value,
              nom: nom,
              prenom: prenom
            })
          });
          
          const data = await response.json();
          
          if(response.ok) {
            // Stocker les informations utilisateur
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_email', data.user.email);
            localStorage.setItem('user_name', data.user.nom_complet);
            localStorage.setItem('role', data.user.role);
            localStorage.setItem('user_id', data.user.id);
            
            // Redirection selon le rôle
            const role = data.user.role;
            const dest = {
              admin: '/reporting/',
              rh: '/employees/',
              caissier: '/sales/pos/',
              client: '/customers/'
            }[role] || '/customers/';
            
            // Redirection immédiate sans alert
            window.location.href = dest;
          } else {
            // Afficher l'erreur
            const errorMsg = data.email?.[0] || data.password?.[0] || data.non_field_errors?.[0] || 'Erreur lors de l\'inscription';
            alert(errorMsg);
          }
        } catch(error) {
          console.error('Erreur d\'inscription:', error);
          alert('Erreur d\'inscription. Veuillez réessayer.');
        }
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
