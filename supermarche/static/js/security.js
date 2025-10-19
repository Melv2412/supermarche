window.AppSec = (function(){
  function setValidity(input, valid){
    if(valid){ input.classList.remove('is-invalid'); input.classList.add('is-valid'); }
    else { input.classList.remove('is-valid'); input.classList.add('is-invalid'); }
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
      setValidity(email, okEmail);
      setValidity(password, okPwd);
      if(roleSel){ setValidity(roleSel, okRole); }
      if(okEmail && okPwd && okRole){
        // store session (front-only)
        localStorage.setItem('user_email', email.value);
        localStorage.setItem('role', roleSel.value);
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
      setValidity(fullname, okName);
      setValidity(email, okEmail);
      setValidity(password, okPwd);
      setValidity(password2, okMatch);
      if(okName && okEmail && okPwd && okMatch){
        alert('Inscription simulée (front uniquement).');
      }
    });
  }

  function initReset(){
    const form = document.getElementById('form-reset');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email');
      const okEmail = email.checkValidity();
      setValidity(email, okEmail);
      if(okEmail){ alert('Lien de réinitialisation envoyé (simulation).'); }
    });
  }

  return { goto, initLogin, initRegister, initReset };
})();
