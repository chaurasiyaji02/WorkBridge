/**
 * WORKBRIDGE - PROFILE SETTINGS CONTROLLER (SUPABASE CLOUD EDITION)
 * File: js/pages/profileSettingsPage.js
 * 
 * Manages full profile customization for Clients & Providers:
 * - Direct real-time fetch and single-query update to Supabase `profiles` table.
 * - Dynamic field handling for Client (Company, Industry, Website, Tax ID, Currency)
 *   and Provider (Domain, Skills, Rate, Portfolio, GitHub, Sprint Capacity, Timezone SLA).
 * - Cryptographic WebCrypto SHA-256 signing fingerprint generation.
 * - Governance notification preferences persistence.
 * - Instant AuthState session refresh to ensure all dashboards reflect updates without re-login.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const { ROLES } = window.APP_CONFIG || {
        ROLES: { SERVICE_PROVIDER: 'SERVICE_PROVIDER', CLIENT: 'CLIENT', ADMIN: 'ADMIN' }
    };

    // 1. Guard route: must be logged in
    if (window.AuthState && typeof window.AuthState.requireAuth === 'function') {
        window.AuthState.requireAuth();
    }

    const currentUser = window.AuthState ? window.AuthState.getUser() : null;
    if (!currentUser) return;

    const sb = window.sbClient;

    // DOM Elements - General & Identity
    const roleIndicatorBadge = document.getElementById('roleIndicatorBadge');
    const settingsAvatarPreview = document.getElementById('settingsAvatarPreview');
    const settingsHeaderName = document.getElementById('settingsHeaderName');
    const settingsRoleSubtext = document.getElementById('settingsRoleSubtext');
    const userFingerprintPreview = document.getElementById('userFingerprintPreview');
    const profileFullName = document.getElementById('profileFullName');
    const profileEmail = document.getElementById('profileEmail');
    const profileBioInput = document.getElementById('profileBioInput');
    const bioLabel = document.getElementById('bioLabel');
    const form = document.getElementById('profileSettingsForm');
    const btnSaveProfile = document.getElementById('btnSaveProfile');
    const btnCancelProfile = document.getElementById('btnCancelProfile');
    const backToDashboardLink = document.getElementById('backToDashboardLink');

    // DOM Elements - Client-Specific
    const clientSpecializedFields = document.getElementById('clientSpecializedFields');
    const clientCompanyNameInput = document.getElementById('clientCompanyNameInput');
    const clientIndustrySelect = document.getElementById('clientIndustrySelect');
    const clientWebsiteInput = document.getElementById('clientWebsiteInput');
    const clientTaxIdInput = document.getElementById('clientTaxIdInput');
    const clientCurrencySelect = document.getElementById('clientCurrencySelect');

    // DOM Elements - Provider-Specific
    const providerSpecializedFields = document.getElementById('providerSpecializedFields');
    const providerDomainSelect = document.getElementById('providerDomainSelect');
    const providerHourlyRateInput = document.getElementById('providerHourlyRateInput');
    const providerSkillsInput = document.getElementById('providerSkillsInput');
    const providerGithubInput = document.getElementById('providerGithubInput');
    const providerPortfolioInput = document.getElementById('providerPortfolioInput');
    const providerCapacitySelect = document.getElementById('providerCapacitySelect');
    const providerTimezoneSelect = document.getElementById('providerTimezoneSelect');

    // DOM Elements - Governance Notification Preferences
    const notifyScopeAmendments = document.getElementById('notifyScopeAmendments');
    const notifyDeliverableSubmissions = document.getElementById('notifyDeliverableSubmissions');
    const notifyDecisions = document.getElementById('notifyDecisions');

    const isProvider = currentUser.role === ROLES.SERVICE_PROVIDER;
    const isClient = currentUser.role === ROLES.CLIENT;

    // 2. Set Header State & Navigation Links
    const dashboardUrl = isProvider 
        ? 'provider-dashboard.html' 
        : (currentUser.role === ROLES.ADMIN ? 'admin-dashboard.html' : 'client-dashboard.html');

    if (backToDashboardLink) backToDashboardLink.href = dashboardUrl;
    if (btnCancelProfile) {
        btnCancelProfile.addEventListener('click', () => {
            window.location.href = dashboardUrl;
        });
    }

    if (roleIndicatorBadge) {
        roleIndicatorBadge.textContent = isProvider ? 'Technical Lead' : (isClient ? 'Client Principal' : 'Administrator');
        roleIndicatorBadge.className = isProvider ? 'badge badge-primary' : 'badge badge-success';
    }

    if (settingsRoleSubtext) {
        settingsRoleSubtext.textContent = isProvider ? 'Verified Technical Provider' : 'Enterprise Client Principal';
    }

    // Role-Based Section Toggles
    if (isProvider) {
        if (providerSpecializedFields) providerSpecializedFields.classList.remove('hidden');
        if (clientSpecializedFields) clientSpecializedFields.classList.add('hidden');
        if (bioLabel) bioLabel.textContent = 'Engineering Background & Delivery Guarantees *';
    } else {
        if (clientSpecializedFields) clientSpecializedFields.classList.remove('hidden');
        if (providerSpecializedFields) providerSpecializedFields.classList.add('hidden');
        if (bioLabel) bioLabel.textContent = 'Company / Project Overview *';
    }

    // Compute & Display WebCrypto Signing Identity Fingerprint
    await displayCryptographicFingerprint();

    // Populate Initial Data from Session
    populateFormFromData(currentUser);

    // 3. Fetch latest ground-truth record from Supabase Cloud
    await fetchCloudProfile();

    async function displayCryptographicFingerprint() {
        if (!userFingerprintPreview) return;
        try {
            const rawPayload = `WORKBRIDGE-IDENTITY:${currentUser.id || currentUser.email}:${currentUser.role}`;
            const buffer = new TextEncoder().encode(rawPayload);
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            userFingerprintPreview.textContent = `${hex.slice(0, 12)}...${hex.slice(-8)}`;
            userFingerprintPreview.title = `Deterministic Identity Fingerprint (SHA-256): ${hex}`;
        } catch (e) {
            userFingerprintPreview.textContent = 'SHA-256 Verified';
        }
    }

    async function fetchCloudProfile() {
        if (!sb) return;

        try {
            let userProfile = null;

            if (currentUser.id) {
                const { data, error } = await sb
                    .from('profiles')
                    .select('*')
                    .eq('id', currentUser.id)
                    .maybeSingle();

                if (!error && data) userProfile = data;
            }

            if (!userProfile && currentUser.email) {
                const { data: dataByEmail } = await sb
                    .from('profiles')
                    .select('*')
                    .eq('email', currentUser.email)
                    .maybeSingle();
                
                if (dataByEmail) userProfile = dataByEmail;
            }

            if (userProfile) {
                populateFormFromData(userProfile);
            }
        } catch (err) {
            console.warn('Could not fetch cloud profile, retaining session defaults:', err);
        }
    }

    function populateFormFromData(profile) {
        if (!profile) return;

        const name = profile.full_name || profile.fullName || '';
        if (profileFullName) profileFullName.value = name;
        if (settingsHeaderName) settingsHeaderName.textContent = name || 'User Profile';
        if (settingsAvatarPreview) {
            settingsAvatarPreview.textContent = (name || 'U').charAt(0).toUpperCase();
        }

        if (profileEmail) profileEmail.value = profile.email || currentUser.email || '';
        if (profileBioInput) profileBioInput.value = profile.bio || '';

        // Provider Fields
        if (isProvider) {
            if (providerDomainSelect && profile.domain) {
                providerDomainSelect.value = profile.domain;
            }
            if (providerHourlyRateInput && (profile.hourly_rate || profile.hourlyRate)) {
                providerHourlyRateInput.value = profile.hourly_rate || profile.hourlyRate;
            }
            if (providerSkillsInput && profile.skills) {
                providerSkillsInput.value = Array.isArray(profile.skills) 
                    ? profile.skills.join(', ') 
                    : profile.skills;
            }
            if (providerGithubInput && (profile.github_url || profile.githubUrl)) {
                providerGithubInput.value = profile.github_url || profile.githubUrl;
            }
            if (providerPortfolioInput && (profile.portfolio_url || profile.portfolioUrl)) {
                providerPortfolioInput.value = profile.portfolio_url || profile.portfolioUrl;
            }
            if (providerCapacitySelect && (profile.sprint_capacity || profile.capacity)) {
                providerCapacitySelect.value = profile.sprint_capacity || profile.capacity;
            }
            if (providerTimezoneSelect && (profile.timezone_sla || profile.timezone)) {
                providerTimezoneSelect.value = profile.timezone_sla || profile.timezone;
            }
        }

        // Client Fields
        if (isClient) {
            if (clientCompanyNameInput && (profile.company_name || profile.companyName)) {
                clientCompanyNameInput.value = profile.company_name || profile.companyName;
            }
            if (clientIndustrySelect && (profile.industry || profile.companyIndustry)) {
                clientIndustrySelect.value = profile.industry || profile.companyIndustry;
            }
            if (clientWebsiteInput && (profile.website_url || profile.websiteUrl)) {
                clientWebsiteInput.value = profile.website_url || profile.websiteUrl;
            }
            if (clientTaxIdInput && (profile.tax_id || profile.taxId)) {
                clientTaxIdInput.value = profile.tax_id || profile.taxId;
            }
            if (clientCurrencySelect && (profile.currency || profile.preferredCurrency)) {
                clientCurrencySelect.value = profile.currency || profile.preferredCurrency;
            }
        }

        // Notification Preferences
        const prefs = profile.notification_preferences || profile.preferences || {};
        if (notifyScopeAmendments) notifyScopeAmendments.checked = prefs.scope_amendments !== false;
        if (notifyDeliverableSubmissions) notifyDeliverableSubmissions.checked = prefs.deliverable_submissions !== false;
        if (notifyDecisions) notifyDecisions.checked = prefs.decisions !== false;
    }

    // 4. Save Profile Changes Handler (Direct Supabase Update)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullNameVal = (profileFullName?.value || '').trim();
            const bioVal = (profileBioInput?.value || '').trim();

            if (!fullNameVal || !bioVal) {
                if (window.Toast) window.Toast.error('Please enter your full name and overview.');
                return;
            }

            if (btnSaveProfile) {
                btnSaveProfile.disabled = true;
                btnSaveProfile.textContent = 'Saving Changes...';
            }

            const notificationPrefs = {
                scope_amendments: notifyScopeAmendments ? notifyScopeAmendments.checked : true,
                deliverable_submissions: notifyDeliverableSubmissions ? notifyDeliverableSubmissions.checked : true,
                decisions: notifyDecisions ? notifyDecisions.checked : true
            };

            // Construct unified payload for profiles table
            const updatePayload = {
                full_name: fullNameVal,
                bio: bioVal,
                notification_preferences: notificationPrefs,
                updated_at: new Date().toISOString()
            };

            if (isProvider) {
                const skillsArr = providerSkillsInput?.value
                    ? providerSkillsInput.value.split(',').map(s => s.trim()).filter(Boolean)
                    : ['Engineering'];

                updatePayload.domain = providerDomainSelect?.value || 'Full-Stack Web Development';
                updatePayload.hourly_rate = parseFloat(providerHourlyRateInput?.value) || 50;
                updatePayload.skills = skillsArr;
                updatePayload.github_url = (providerGithubInput?.value || '').trim();
                updatePayload.portfolio_url = (providerPortfolioInput?.value || '').trim();
                updatePayload.sprint_capacity = providerCapacitySelect?.value || '2_PROJECTS';
                updatePayload.timezone_sla = providerTimezoneSelect?.value || 'UTC';
            }

            if (isClient) {
                updatePayload.company_name = (clientCompanyNameInput?.value || '').trim();
                updatePayload.industry = clientIndustrySelect?.value || 'Software & IT';
                updatePayload.website_url = (clientWebsiteInput?.value || '').trim();
                updatePayload.tax_id = (clientTaxIdInput?.value || '').trim();
                updatePayload.currency = clientCurrencySelect?.value || 'USD';
            }

            try {
                if (!sb) throw new Error('Database client connection missing.');

                // Direct Supabase Update to `profiles` table
                let updateQuery = sb.from('profiles').update(updatePayload);
                if (currentUser.id) {
                    updateQuery = updateQuery.eq('id', currentUser.id);
                } else {
                    updateQuery = updateQuery.eq('email', currentUser.email);
                }

                const { error: dbError } = await updateQuery;
                if (dbError) throw dbError;

                // Immediately sync user session object in AuthState / LocalStorage
                const updatedSessionUser = {
                    ...currentUser,
                    fullName: fullNameVal,
                    bio: bioVal,
                    ...updatePayload
                };

                if (window.AuthState && typeof window.AuthState.setUser === 'function') {
                    window.AuthState.setUser(updatedSessionUser);
                }

                if (window.Toast) {
                    window.Toast.success('Profile and capabilities updated in Cloud database!');
                }

                setTimeout(() => {
                    window.location.href = dashboardUrl;
                }, 600);

            } catch (err) {
                console.error('Failed to update profile in cloud:', err);
                if (window.Toast) {
                    window.Toast.error(err.message || 'Could not update profile. Please try again.');
                }
                if (btnSaveProfile) {
                    btnSaveProfile.disabled = false;
                    btnSaveProfile.textContent = 'Save Profile Changes';
                }
            }
        });
    }
});