document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (localStorage.getItem('isLoggedIn')) {
        window.location.href = '/profiles';
    }

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showError(element, message) {
        element.style.display = 'block';
        element.textContent = message;
    }

    function hideError(element) {
        element.style.display = 'none';
        element.textContent = '';
    }

    emailInput.addEventListener('input', function() {
        if (validateEmail(this.value)) {
            hideError(emailError);
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            showError(emailError, 'Please enter a valid email address.');
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
    });

    passwordInput.addEventListener('input', function() {
        if (this.value.length >= 6) {
            hideError(passwordError);
            this.classList.remove('is-invalid');
            this.classList.add('is-valid');
        } else {
            showError(passwordError, 'Password must be at least 6 characters long.');
            this.classList.remove('is-valid');
            this.classList.add('is-invalid');
        }
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        let isValid = true;

        // Validate email
        if (!validateEmail(emailInput.value)) {
            showError(emailError, 'Please enter a valid email address.');
            emailInput.classList.add('is-invalid');
            isValid = false;
        }

        // Validate password
        if (passwordInput.value.length < 6) {
            showError(passwordError, 'Password must be at least 6 characters long.');
            passwordInput.classList.add('is-invalid');
            isValid = false;
        }

        if (isValid) {
            // Store login state
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userEmail', emailInput.value);
            
            // Redirect to profiles page
            window.location.href = '/profiles';
        }
    });
});