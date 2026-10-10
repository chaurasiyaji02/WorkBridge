/**
 * WORKBRIDGE - PROFILE SETTINGS CONTROLLER (SUPABASE CLOUD EDITION)
 * File: js/pages/profileSettingsPage.js
 * 
 * Manages full profile customization for Clients & Providers:
 * - Direct real-time fetch and single-query update to Supabase `profiles` table.
 * - Dynamic field handling for Client (Company, Industry, Website) and Provider (Domain, Skills, Rate, Portfolio, GitHub).
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

    // DOM Elements - Provider-Specific
    const providerSpecializedFields = document.getElementById('providerSpecializedFields');
    const providerDomainSelect = document.getElementById('providerDomainSelect');
    const providerHourlyRateInput = document.getElementById('providerHourlyRateInput');
    const providerSkillsInput = document.getElementById('providerSkillsInput');
    const providerGithubInput = document.getElementById('providerGithubInput');
    const providerPortfolioInput = document.getElementById('providerPortfolioInput');

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
        roleIndicatorBadge.textContent = isProvider ? 'Service Provider' : (isClient ? 'Client Account' : 'Administrator');
        roleIndicatorBadge.className = isProvider ? 'badge badge-primary' : 'badge badge-success';
    }

    if (settingsRoleSubtext) {
        settingsRoleSubtext.textContent = isProvider ? 'Verified Technical Provider' : 'Project Commissioning Client';
    }

    // Role-Based Section Toggles
    if (isProvider) {
        if (providerSpecializedFields) providerSpecializedFields.classList.remove('hidden');
        if (clientSpecializedFields) clientSpecializedFields.classList.add('hidden');
        if (bioLabel) bioLabel.textContent = 'Service Scope & Engineering Bio *';
    } else {
        if (clientSpecializedFields) clientSpecializedFields.classList.remove('hidden');
        if (providerSpecializedFields) providerSpecializedFields.classList.add('hidden');
        if (bioLabel) bioLabel.textContent = 'Company / Client Overview *';
    }

    // Populate Initial Data from Session
    populateFormFromData(currentUser);

    // 3. Fetch latest ground-truth record from Supabase Cloud
    await fetchCloudProfile();

    async function fetchCloudProfile() {
        if (!sb) return;

        try {
            const { data, error } = await sb
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (error || !data) {
                // If not matched by id, fallback query by email
                const { data: dataByEmail } = await sb
                    .from('profiles')
                    .select('*')
                    .eq('email', currentUser.email)
                    .maybeSingle();
                
                if (dataByEmail) populateFormFromData(dataByEmail);
                return;
            }

            populateFormFromData(data);
        } catch (err) {
            console.warn('Could not fetch cloud profile, using session defaults:', err);
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
        }

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
        }
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

            // Construct unified payload
            const updatePayload = {
                full_name: fullNameVal,
                bio: bioVal
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
            }

            if (isClient) {
                updatePayload.company_name = (clientCompanyNameInput?.value || '').trim();
                updatePayload.industry = clientIndustrySelect?.value || 'Software & IT';
                updatePayload.website_url = (clientWebsiteInput?.value || '').trim();
            }

            try {
                if (!sb) throw new Error('Database client connection missing.');

                // 1. Direct Supabase Update to `profiles` table
                const { error: dbError } = await sb
                    .from('profiles')
                    .update(updatePayload)
                    .or(`id.eq.${currentUser.id},email.eq.${currentUser.email}`);

                if (dbError) throw dbError;

                // 2. Also update associated `services` records if provider changes domain or rate
                if (isProvider) {
                    await sb
                        .from('services')
                        .update({
                            provider_name: fullNameVal,
                            domain: updatePayload.domain,
                            hourly_rate: updatePayload.hourly_rate,
                            skills: updatePayload.skills
                        })
                        .eq('provider_id', currentUser.id)
                        .catch(() => null);
                }

                // 3. Immediately sync user session object in AuthState / LocalStorage
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
                    window.Toast.success('Profile and capabilities updated in Cloud!');
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