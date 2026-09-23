const form = document.querySelector('#login-form');
const password = document.querySelector('#login-password');
const passwordToggle = document.querySelector('#password-toggle');
const feedback = document.querySelector('#login-feedback');

function showFeedback(message) {
  feedback.textContent = message;
  feedback.hidden = false;
}

function clearCredentials() {
  form.reset();
  password.value = '';
  password.type = 'password';
  passwordToggle.setAttribute('aria-pressed', 'false');
  passwordToggle.setAttribute('aria-label', 'Passwort anzeigen');
}

// Clear values before navigation and after restoration from the back/forward cache.
window.addEventListener('pagehide', clearCredentials);
window.addEventListener('pageshow', clearCredentials);

// This design preview has no authentication service. Never send or persist credentials.
form.addEventListener('submit', event => {
  event.preventDefault();
  clearCredentials();
  showFeedback('Die Anmeldung ist noch nicht freigeschaltet. Bitte versuche es später erneut.');
});

passwordToggle.addEventListener('click', () => {
  const visible = password.type === 'password';
  password.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  passwordToggle.setAttribute('aria-label', visible ? 'Passwort verbergen' : 'Passwort anzeigen');
});

document.querySelectorAll('[data-login-action]').forEach(button => {
  button.addEventListener('click', () => {
    showFeedback(button.dataset.loginAction === 'forgot'
      ? 'Das Zurücksetzen von Passwörtern ist noch nicht freigeschaltet.'
      : 'Die Registrierung ist noch nicht freigeschaltet.');
  });
});

// Enable interactions only after the submit guard is registered.
document.querySelectorAll('.login-card button').forEach(button => { button.disabled = false; });
