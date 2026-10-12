/**
 * WORKBRIDGE - AUTHENTICATION PAGE CONTROLLER (SUPABASE CLOUD EDITION)
 * File: js/pages/authPage.js
 * 
 * Direct cloud authentication backed by Supabase PostgreSQL `profiles` table.
 * Supports cross-device real-time registration and login with zero cold-start delay.
 * Strict catalog safeguard: Registering establishes verified identity without auto-posting gigs.
 */

document.addEventListener('DOMContentLoaded', () => {
    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || {
        CLIENT: 'CLIENT',
        SERVICE_PROVIDER: 'SERVICE_PROVIDER',
        ADMIN: 'ADMIN'
    };

    // If user is already logged in with a valid session, redirect immediately
    if (window.AuthState && typeof window.AuthState.isLoggedIn === 'function' && window.AuthState.isLoggedIn()) {
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

    // Workstation Session Persistence Toggle
    const rememberMeCheckbox = document.getElementById('rememberMeCheckbox');

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
        const checkedRadio = document.querySelector('input[name="role"]:checked');
        const selectedRole = checkedRadio ? checkedRadio.value : ROLES.CLIENT;
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
    syncRoleFields();

    // -------------------------------------------------------------------------
    // 2. Tab Switching Handlers
    // -------------------------------------------------------------------------
    if (tabLogin) tabLogin.addEventListener('click', () => switchTab('LOGIN'));
    if (tabRegister) tabRegister.addEventListener('click', () => switchTab('REGISTER'));

    function switchTab(mode) {
        clearAlert();
        clearFieldErrors();

        if (mode === 'LOGIN') {
            if (tabLogin) {
                tabLogin.classList.add('active');
                tabLogin.setAttribute('aria-selected', 'true');
            }
            if (tabRegister) {
                tabRegister.classList.remove('active');
                tabRegister.setAttribute('aria-selected', 'false');
            }

            if (loginForm) loginForm.classList.remove('form-hidden');
            if (registerForm) registerForm.classList.add('form-hidden');
        } else {
            if (tabRegister) {
                tabRegister.classList.add('active');
                tabRegister.setAttribute('aria-selected', 'true');
            }
            if (tabLogin) {
                tabLogin.classList.remove('active');
                tabLogin.setAttribute('aria-selected', 'false');
            }

            if (registerForm) registerForm.classList.remove('form-hidden');
            if (loginForm) loginForm.classList.add('form-hidden');
            syncRoleFields();
        }
    }

    // -------------------------------------------------------------------------
    // 3. Relaxed Email Validation & Cryptographic Hash Helpers
    // -------------------------------------------------------------------------
    function validateEmail(email) {
        if (!email) return false;
        const clean = email.trim();
        return clean.length >= 3 && clean.includes('@');
    }

    async function computeSha256(str) {
        try {
            const buffer = new TextEncoder().encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            return str;
        }
    }

    // -------------------------------------------------------------------------
    // 4. Login Submission (Direct Supabase Cloud Query)
    // -------------------------------------------------------------------------
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert();
            clearFieldErrors();

            const emailInput = document.getElementById('loginEmail');
            const passwordInput = document.getElementById('loginPassword');

            const email = (emailInput ? emailInput.value : '').trim().toLowerCase();
            const password = passwordInput ? passwordInput.value : '';

            // Input Validation
            let hasError = false;
            if (!validateEmail(email)) {
                showFieldError('loginEmailError', 'Please enter your email address.');
                hasError = true;
            }
            if (!password) {
                showFieldError('loginPasswordError', 'Please enter your password.');
                hasError = true;
            }

            if (hasError) return;

            setButtonLoading(loginSubmitBtn, true, 'Signing in to Supabase...');

            try {
                const sb = window.sbClient;
                if (!sb) {
                    throw new Error('Supabase client is not initialized. Please verify supabaseClient.js.');
                }

                // Query `profiles` table directly
                const { data, error } = await sb
                    .from('profiles')
                    .select('*')
                    .eq('email', email)
                    .maybeSingle();

                if (error || !data) {
                    throw new Error('No account found with this email. Please register first.');
                }

                // Verify credential against plain text and SHA-256 hash
                const passwordDigest = await computeSha256(password);
                const isPasswordValid = (data.password === password) || (data.password === passwordDigest);

                if (!isPasswordValid) {
                    throw new Error('Incorrect password. Please verify credentials.');
                }

                // Profile verified: construct session user
                const sessionUser = {
                    id: data.id,
                    fullName: data.full_name || 'Member',
                    email: data.email,
                    role: data.role || ROLES.CLIENT,
                    domain: data.domain || null,
                    bio: data.bio || '',
                    rating: data.rating || 5.0,
                    companyName: data.company_name || null,
                    industry: data.industry || null,
                    websiteUrl: data.website_url || null,
                    hourlyRate: data.hourly_rate || null,
                    skills: data.skills || [],
                    githubUrl: data.github_url || null,
                    portfolioUrl: data.portfolio_url || null,
                    sprintCapacity: data.sprint_capacity || '2_PROJECTS',
                    timezoneSla: data.timezone_sla || 'UTC'
                };

                const sessionToken = 'wb_sb_token_' + data.id;
                const isPersistent = rememberMeCheckbox ? rememberMeCheckbox.checked : true;

                if (window.AuthState && typeof window.AuthState.setSession === 'function') {
                    window.AuthState.setSession(sessionToken, sessionUser, isPersistent);
                }

                showAlert('Sign in verified! Opening workspace...', 'success');
                if (window.Toast) window.Toast.success('Welcome back, ' + sessionUser.fullName + '!');

                setTimeout(() => {
                    redirectToTarget(sessionUser.role);
                }, 400);

            } catch (err) {
                console.error('Supabase Login Error:', err);
                const msg = err.message || 'Login failed. Please check your credentials.';
                showAlert(msg, 'danger');
                if (window.Toast) window.Toast.error(msg);
            } finally {
                setButtonLoading(loginSubmitBtn, false, 'Authenticate & Enter Workspace');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 5. Register Submission (Direct Supabase Cloud Insert)
    // -------------------------------------------------------------------------
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlert();
            clearFieldErrors();

            const roleElement = document.querySelector('input[name="role"]:checked');
            const role = roleElement ? roleElement.value : ROLES.CLIENT;
            const fullName = (document.getElementById('regFullName')?.value || '').trim();
            const email = (document.getElementById('regEmail')?.value || '').trim().toLowerCase();
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

            if (!password || password.length < 6) {
                showFieldError('regPasswordError', 'Password must be at least 6 characters long.');
                hasError = true;
            }

            if (password !== confirmPassword) {
                showFieldError('regConfirmPasswordError', 'Passwords do not match.');
                hasError = true;
            }

            if (hasError) return;

            setButtonLoading(registerSubmitBtn, true, 'Creating Account in Cloud...');

            try {
                const sb = window.sbClient;
                if (!sb) {
                    throw new Error('Supabase client is not initialized.');
                }

                // 1. Check if email already exists in profiles
                const { data: existingUser } = await sb
                    .from('profiles')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle();

                if (existingUser) {
                    throw new Error('An account with this email already exists. Please sign in instead.');
                }

                // Compute SHA-256 password hash for storage
                const passwordDigest = await computeSha256(password);

                // 2. Insert new profile record (NO automatic service package created here)
                const newProfile = {
                    email: email,
                    full_name: fullName,
                    password: passwordDigest,
                    role: role,
                    domain: role === ROLES.SERVICE_PROVIDER ? domain : null,
                    bio: role === ROLES.SERVICE_PROVIDER 
                        ? 'Verified technical lead specializing in ' + domain + '.'
                        : 'Enterprise client commissioning milestone-governed projects.',
                    rating: 5.0,
                    hourly_rate: role === ROLES.SERVICE_PROVIDER ? 50 : null,
                    skills: role === ROLES.SERVICE_PROVIDER ? ['Java', 'Spring Boot', 'PostgreSQL', 'JavaScript'] : [],
                    sprint_capacity: role === ROLES.SERVICE_PROVIDER ? '2_PROJECTS' : null,
                    timezone_sla: role === ROLES.SERVICE_PROVIDER ? 'UTC' : null,
                    created_at: new Date().toISOString()
                };

                const { data: createdData, error: insertError } = await sb
                    .from('profiles')
                    .insert([newProfile])
                    .select()
                    .single();

                if (insertError) {
                    throw new Error(insertError.message || 'Failed to create profile in database.');
                }

                const sessionUser = {
                    id: createdData.id,
                    fullName: createdData.full_name,
                    email: createdData.email,
                    role: createdData.role,
                    domain: createdData.domain,
                    bio: createdData.bio,
                    rating: createdData.rating,
                    hourlyRate: createdData.hourly_rate,
                    skills: createdData.skills,
                    sprintCapacity: createdData.sprint_capacity,
                    timezoneSla: createdData.timezone_sla
                };

                const sessionToken = 'wb_sb_token_' + createdData.id;

                if (window.AuthState && typeof window.AuthState.setSession === 'function') {
                    window.AuthState.setSession(sessionToken, sessionUser, true);
                }

                showAlert('Account registered in cloud! Redirecting...', 'success');
                if (window.Toast) window.Toast.success('Account successfully registered!');

                setTimeout(() => {
                    redirectToTarget(sessionUser.role);
                }, 500);

            } catch (err) {
                console.error('Supabase Registration Error:', err);
                const msg = err.message || 'Registration failed. Please try again.';
                showAlert(msg, 'danger');
                if (window.Toast) window.Toast.error(msg);
            } finally {
                setButtonLoading(registerSubmitBtn, false, 'Register Verified Account');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 6. Utility & Navigation Helpers
    // -------------------------------------------------------------------------
    function showFieldError(elementId, message) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = message;
    }

    function clearFieldErrors() {
        document.querySelectorAll('.form-error').forEach(el => {
            el.textContent = '';
        });
    }

    function showAlert(message, type) {
        if (!authAlert) return;
        authAlert.textContent = message;
        authAlert.className = 'alert alert-' + (type === 'danger' ? 'danger' : type);
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
        const redirectParam = urlParams.get('redirect');
        if (redirectParam && !redirectParam.includes('auth.html')) {
            window.location.href = decodeURIComponent(redirectParam);
            return;
        }

        if (role === ROLES.SERVICE_PROVIDER) {
            window.location.href = 'provider-dashboard.html';
        } else if (role === ROLES.ADMIN) {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'client-dashboard.html';
        }
    }
});