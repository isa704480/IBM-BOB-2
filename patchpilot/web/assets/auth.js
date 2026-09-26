// PatchPilot auth (prototype): client-side validation only. No network, no storage.
(function () {
  const form = document.getElementById('form');
  if (!form) return;

  // Show/hide password
  form.querySelectorAll('.toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      input.focus();
    });
  });

  const setErr = (id, msg) => {
    const input = document.getElementById(id);
    const err = document.getElementById(id + '-err');
    if (err) err.textContent = msg || '';
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Clear error as the user fixes a field
  form.querySelectorAll('input').forEach((input) => {
    input.addEventListener('input', () => setErr(input.id, ''));
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    const val = (id) => (document.getElementById(id)?.value || '').trim();

    if (document.getElementById('name')) {
      ok = setErr('name', val('name') ? '' : 'Please enter your name.') && ok;
    }
    ok = setErr('email', !val('email') ? 'Email is required.' : !emailOk(val('email')) ? 'Enter a valid email address.' : '') && ok;
    const pw = document.getElementById('password').value;
    const min = document.getElementById('password').minLength > 0 ? 8 : 1;
    ok = setErr('password', !pw ? 'Password is required.' : pw.length < min ? `Use at least ${min} characters.` : '') && ok;

    if (!ok) {
      const firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'One moment…';
    setTimeout(() => { window.location.href = '/app'; }, 500);
  });
})();
