/**
 * WORKBRIDGE - AUTHENTICATION PAGE CONTROLLER
 * File: js/pages/authPage.js
 * 
 * Manages tab toggles, role-specific domain selectors, validation,
 * API requests, error state rendering, and return-URL preserved redirects.
 */

document.addEventListener('DOMContentLoaded', () => {
    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || {
        CLIENT: 'CLIENT',
        SERVICE_PROVIDER: 'SERVICE_PROVIDER',
        ADMIN: 'ADMIN'
    };

    // If user is already logged in with a valid token, redirect immediately
    if (window.AuthState && window.AuthState.isLoggedIn()) {
        const currentUser = window.AuthState.getUser();
        redirectToTarget(currentUser ? currentUser.role : null);
        return;
    }

    // DOM Elements - Tabs & Forms
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authAlert = document.getElementById('authAlert');

    // Provider Domain Container & Radios
    const providerDomainGroup = document.getElementById('providerDomainGroup');
    const roleRadios = document.querySelectorAll('input[name="role"]');
    const regDomainSelect = document.getElementById('regDomain');

    // Submit Buttons
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');

    // Check URL parameters for tab selection and messages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'register') {
        switchTab('REGISTER');
    }

    if (urlParams.get('session') === 'expired') {
        showAlert('Your session has expired. Please sign in again.', 'warning');
        if (window.Toast) window.Toast.warning('Session expired. Please re-authenticate.');
    }

    // -------------------------------------------------------------------------
    // 1. Role Toggle & Domain Visibility (Provider vs Client)
    // -------------------------------------------------------------------------
    function syncRoleFields() {
        const selectedRole = document.querySelector('input[name="role"]:checked')?.value || ROLES.CLIENT;
        if (providerDomainGroup) {
            if (selectedRole === ROLES.SERVICE_PROVIDER) {
                providerDomainGroup.classList.remove('hidden');
            } else {
                providerDomainGroup.classList.add('hidden');
            }
        }
    }

    roleRadios.forEach(radio => {
        radio.addEventListener('change', syncRoleFields);
    });
    syncRoleFields(); // Initial sync

    // -------------------------------------------------------------------------
    // 2. Tab Switching Handlers
    // -------------------------------------------------------------------------
    if (tabLogin) tabLogin.addEventListener('click', () => switchTab('LOGIN'));
    if (tabRegister) tabRegister.addEventListener('click', () => switchTab('REGISTER'));

    function switchTab(mode) {
        clearAlert();
        clearFieldErrors();

        if (mode === 'LOGIN') {
            tabLogin?.classList.add('active');
            tabLogin?.setAttribute('aria-selected', 'true');
            tabRegister?.classList.remove('active');
            tabRegister?.setAttribute('aria-selected', 'false');

            loginForm?.classList.remove('form-hidden');
            registerForm?.classList.add('form-hidden');
        } else {
            tabRegister?.classList.add('active');
            tabRegister?.setAttribute('aria-selected', 'true');
            tabLogin?.classList.remove('active');
            tabLogin?.setAttribute('aria-selected', 'false');

            registerForm?.classList.remove('form-hidden');
            loginForm?.classList.add('form-hidden');
            syncRoleFields();
        }
    }

    // -------------------------------------------------------------------------
    // 3. Login Form Submission & Validation
    // -------------------------------------------------------------------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert();
            clearFieldErrors();

            const email = (document.getElementById('loginEmail')?.value || '').trim();
            const password = document.getElementById('loginPassword')?.value || '';

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

            setButtonLoading(loginSubmitBtn, true, 'Signing in...');

            try {
                const data = await window.AuthApi.login({ email, password });
                const userObj = data.user || data;
                const token = data.token;
                const userRole = userObj?.role || null;

                if (window.AuthState && window.AuthState.setSession) {
                    window.AuthState.setSession(token, userObj);
                }

                showAlert('Sign in successful! Redirecting...', 'success');
                if (window.Toast) window.Toast.success('Welcome back to WorkBridge!');

                setTimeout(() => {
                    redirectToTarget(userRole);
                }, 500);

            } catch (error) {
                const msg = error.message || 'Invalid email or password. Please try again.';
                showAlert(msg, 'danger');
                if (window.Toast) window.Toast.error(msg);
            } finally {
                setButtonLoading(loginSubmitBtn, false, 'Sign In to Workspace');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 4. Register Form Submission & Validation
    // -------------------------------------------------------------------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert();
            clearFieldErrors();

            const roleElement = document.querySelector('input[name="role"]:checked');
            const role = roleElement ? roleElement.value : ROLES.CLIENT;
            const fullName = (document.getElementById('regFullName')?.value || '').trim();
            const email = (document.getElementById('regEmail')?.value || '').trim();
            const password = document.getElementById('regPassword')?.value || '';
            const confirmPassword = document.getElementById('regConfirmPassword')?.value || '';
            const domain = regDomainSelect ? regDomainSelect.value : 'Full-Stack Web Development';

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

            setButtonLoading(registerSubmitBtn, true, 'Creating Account...');

            try {
                const data = await window.AuthApi.register({
                    fullName,
                    email,
                    password,
                    role,
                    domain: role === ROLES.SERVICE_PROVIDER ? domain : null
                });

                const userObj = data.user || data;
                const token = data.token;
                const userRole = userObj?.role || role;

                if (window.AuthState && window.AuthState.setSession) {
                    window.AuthState.setSession(token, userObj);
                }

                showAlert('Account created successfully! Redirecting...', 'success');
                if (window.Toast) window.Toast.success('Account successfully registered!');

                setTimeout(() => {
                    redirectToTarget(userRole);
                }, 500);

            } catch (error) {
                const msg = error.message || 'Registration failed. Email may already be in use.';
                showAlert(msg, 'danger');
                if (window.Toast) window.Toast.error(msg);
            } finally {
                setButtonLoading(registerSubmitBtn, false, 'Create Account');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 5. Utility & Helper Functions
    // -------------------------------------------------------------------------
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+\$/;
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
        if (!authAlert) return;
        authAlert.textContent = message;
        authAlert.className = `alert alert-${type === 'danger' ? 'danger' : type}`;
        authAlert.classList.remove('alert-hidden');
    }

    function clearAlert() {
        if (!authAlert) return;
        authAlert.textContent = '';
        authAlert.className = 'alert alert-hidden';
    }

    function setButtonLoading(button, isLoading, text) {
        if (!button) return;
        button.disabled = isLoading;
        const textSpan = button.querySelector('.btn-text');
        if (textSpan) {
            textSpan.textContent = text;
        } else {
            button.textContent = text;
        }
    }

    function redirectToTarget(role) {
        // If an explicit return redirect parameter was provided, navigate there
        const redirectParam = urlParams.get('redirect');
        if (redirectParam && !redirectParam.includes('auth.html')) {
            window.location.href = decodeURIComponent(redirectParam);
            return;
        }

        // Otherwise navigate to the designated role home dashboard
        if (role === ROLES.SERVICE_PROVIDER) {
            window.location.href = 'provider-dashboard.html';
        } else if (role === ROLES.ADMIN) {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'client-dashboard.html';
        }
    }
});