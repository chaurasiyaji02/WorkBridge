/**
 * WORKBRIDGE - AUTHENTICATION PAGE CONTROLLER
 * File: js/pages/authPage.js
 * 
 * Manages tab toggles, form validations, API submissions,
 * error state rendering, and role-based redirects.
 */

document.addEventListener('DOMContentLoaded', () => {
    // If user is already logged in, automatically redirect to their home
    if (window.AuthState && window.AuthState.isLoggedIn()) {
        const currentUser = window.AuthState.getUser();
        redirectToDashboard(currentUser ? currentUser.role : null);
        return;
    }

    // DOM Elements - Tabs & Forms
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authAlert = document.getElementById('authAlert');

    // Submit Buttons
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');

    // Check URL parameters for direct tab activation
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'register') {
        switchTab('REGISTER');
    }

    if (urlParams.get('session') === 'expired') {
        showAlert('Your session has expired. Please sign in again.', 'warning');
    }

    // -------------------------------------------------------------------------
    // 1. Tab Switching Handlers
    // -------------------------------------------------------------------------
    tabLogin.addEventListener('click', () => switchTab('LOGIN'));
    tabRegister.addEventListener('click', () => switchTab('REGISTER'));

    function switchTab(mode) {
        clearAlert();
        clearFieldErrors();

        if (mode === 'LOGIN') {
            tabLogin.classList.add('active');
            tabLogin.setAttribute('aria-selected', 'true');
            tabRegister.classList.remove('active');
            tabRegister.setAttribute('aria-selected', 'false');

            loginForm.classList.remove('form-hidden');
            registerForm.classList.add('form-hidden');
        } else {
            tabRegister.classList.add('active');
            tabRegister.setAttribute('aria-selected', 'true');
            tabLogin.classList.remove('active');
            tabLogin.setAttribute('aria-selected', 'false');

            registerForm.classList.remove('form-hidden');
            loginForm.classList.add('form-hidden');
        }
    }

    // -------------------------------------------------------------------------
    // 2. Login Form Submission & Validation
    // -------------------------------------------------------------------------
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();
        clearFieldErrors();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Validation
        let hasError = false;
        if (!validateEmail(email)) {
            showFieldError('loginEmailError', 'Please enter a valid email address.');
            hasError = true;
        }
        if (!password) {
            showFieldError('loginPasswordError', 'Please enter your password.');
            hasError = true;
        }

        if (hasError) return;

        // Execute Login Request
        setButtonLoading(loginSubmitBtn, true, 'Signing in...');
        try {
            const data = await window.AuthApi.login({ email, password });
            
            // Extract user and token safely
            const userObj = data.user || data;
            const token = data.token || (data.data && data.data.token);
            const userRole = (userObj && userObj.role) ? userObj.role : null;

            if (window.AuthState && window.AuthState.setSession) {
                window.AuthState.setSession(token, userObj);
            }

            showAlert('Sign in successful! Redirecting...', 'success');
            
            setTimeout(() => {
                redirectToDashboard(userRole);
            }, 600);

        } catch (error) {
            showAlert(error.message || 'Invalid email or password. Please try again.', 'danger');
        } finally {
            setButtonLoading(loginSubmitBtn, false, 'Sign In to Workspace');
        }
    });

    // -------------------------------------------------------------------------
    // 3. Register Form Submission & Validation
    // -------------------------------------------------------------------------
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert();
        clearFieldErrors();

        const roleElement = document.querySelector('input[name="role"]:checked');
        const role = roleElement ? roleElement.value : 'CLIENT';
        const fullName = document.getElementById('regFullName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Validation
        let hasError = false;

        if (!fullName || fullName.length < 2) {
            showFieldError('regFullNameError', 'Full Name must be at least 2 characters.');
            hasError = true;
        }

        if (!validateEmail(email)) {
            showFieldError('regEmailError', 'Please enter a valid email address.');
            hasError = true;
        }

        if (!password || password.length < 8) {
            showFieldError('regPasswordError', 'Password must be at least 8 characters long.');
            hasError = true;
        }

        if (password !== confirmPassword) {
            showFieldError('regConfirmPasswordError', 'Passwords do not match.');
            hasError = true;
        }

        if (hasError) return;

        // Execute Registration Request
        setButtonLoading(registerSubmitBtn, true, 'Creating Account...');
        try {
            const data = await window.AuthApi.register({
                fullName,
                email,
                password,
                role
            });

            // Fallback object handling
            const userObj = data.user || data;
            const token = data.token || (data.data && data.data.token);
            const userRole = (userObj && userObj.role) ? userObj.role : role;

            if (window.AuthState && window.AuthState.setSession) {
                window.AuthState.setSession(token, userObj);
            }

            showAlert('Account created successfully! Redirecting...', 'success');

            setTimeout(() => {
                redirectToDashboard(userRole);
            }, 600);

        } catch (error) {
            showAlert(error.message || 'Registration failed. Email may already be in use.', 'danger');
        } finally {
            setButtonLoading(registerSubmitBtn, false, 'Create Account');
        }
    });

    // -------------------------------------------------------------------------
    // 4. Utility & Helper Functions
    // -------------------------------------------------------------------------
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function showFieldError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = message;
    }

    function clearFieldErrors() {
        document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    }

    function showAlert(message, type) {
        authAlert.textContent = message;
        authAlert.className = `alert alert-${type}`;
        authAlert.classList.remove('alert-hidden');
    }

    function clearAlert() {
        authAlert.textContent = '';
        authAlert.className = 'alert alert-hidden';
    }

    function setButtonLoading(button, isLoading, text) {
        button.disabled = isLoading;
        button.textContent = text;
    }

    function redirectToDashboard(role) {
        const targetRole = String(role || '').toUpperCase();

        if (targetRole.includes('SERVICE_PROVIDER') || targetRole.includes('PROVIDER')) {
            window.location.href = 'provider-dashboard.html';
        } else if (targetRole.includes('ADMIN')) {
            window.location.href = 'admin-dashboard.html';
        } else {
            // Default to client dashboard
            window.location.href = 'client-dashboard.html';
        }
    }
});