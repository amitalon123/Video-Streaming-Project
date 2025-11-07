document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('registerForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  function showError(el, msg) {
    el.style.display = 'block';
    el.textContent = msg;
  }

  function hideError(el) {
    el.style.display = 'none';
    el.textContent = '';
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Basic validation
    let ok = true;
    if (!nameInput.value.trim()) {
      showError(nameError, 'Please enter your full name.');
      nameInput.classList.add('is-invalid');
      ok = false;
    } else {
      hideError(nameError);
      nameInput.classList.remove('is-invalid');
      nameInput.classList.add('is-valid');
    }

    if (!validateEmail(emailInput.value)) {
      showError(emailError, 'Please enter a valid email address.');
      emailInput.classList.add('is-invalid');
      ok = false;
    } else {
      hideError(emailError);
      emailInput.classList.remove('is-invalid');
      emailInput.classList.add('is-valid');
    }

    if ((passwordInput.value || '').length < 6) {
      showError(passwordError, 'Password must be at least 6 characters long.');
      passwordInput.classList.add('is-invalid');
      ok = false;
    } else {
      hideError(passwordError);
      passwordInput.classList.remove('is-invalid');
      passwordInput.classList.add('is-valid');
    }

    if (!ok) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data && data.error ? data.error : 'Registration failed';
        showError(emailError, msg);
        emailInput.classList.add('is-invalid');
        return;
      }

      const user = data.data;
      // Auto-login client-side and proceed
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('currentUser', JSON.stringify(user));
      window.location.href = '/profiles';
    } catch (err) {
      showError(emailError, 'Network error. Please try again.');
    }
  });
});


