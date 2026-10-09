/**
 * WORKBRIDGE - PROFILE SETTINGS CONTROLLER
 * File: js/pages/profileSettingsPage.js
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

    // DOM Elements
    const roleIndicatorBadge = document.getElementById('roleIndicatorBadge');
    const profileFullName = document.getElementById('profileFullName');
    const profileEmail = document.getElementById('profileEmail');
    const providerSpecializedFields = document.getElementById('providerSpecializedFields');
    const providerDomainSelect = document.getElementById('providerDomainSelect');
    const providerSkillsInput = document.getElementById('providerSkillsInput');
    const providerHourlyRateInput = document.getElementById('providerHourlyRateInput');
    const profileBioInput = document.getElementById('profileBioInput');
    const bioLabel = document.getElementById('bioLabel');
    const form = document.getElementById('profileSettingsForm');
    const btnCancelProfile = document.getElementById('btnCancelProfile');
    const backToDashboardLink = document.getElementById('backToDashboardLink');

    const isProvider = currentUser.role === ROLES.SERVICE_PROVIDER;

    // Set Role Badges & Links
    if (roleIndicatorBadge) {
        roleIndicatorBadge.textContent = isProvider ? 'Service Provider' : 'Client Account';
        roleIndicatorBadge.className = isProvider ? 'badge badge-primary' : 'badge badge-info';
    }

    const dashboardUrl = isProvider ? 'provider-dashboard.html' : 'client-dashboard.html';
    if (backToDashboardLink) backToDashboardLink.href = dashboardUrl;
    if (btnCancelProfile) {
        btnCancelProfile.addEventListener('click', () => {
            window.location.href = dashboardUrl;
        });
    }

    // Populate Base User Fields
    if (profileEmail) profileEmail.value = currentUser.email || '';
    if (profileFullName) profileFullName.value = currentUser.fullName || currentUser.username || '';
    if (profileBioInput) profileBioInput.value = currentUser.bio || '';

    // Show/Hide Provider Specific Services
    if (isProvider) {
        if (providerSpecializedFields) providerSpecializedFields.classList.remove('hidden');
        if (bioLabel) bioLabel.textContent = 'Service Offerings & Professional Experience';
        if (providerDomainSelect && currentUser.domain) {
            providerDomainSelect.value = currentUser.domain;
        }
        if (providerSkillsInput && currentUser.skills) {
            providerSkillsInput.value = Array.isArray(currentUser.skills) ? currentUser.skills.join(', ') : currentUser.skills;
        }
        if (providerHourlyRateInput && currentUser.hourlyRate) {
            providerHourlyRateInput.value = currentUser.hourlyRate;
        }
    } else {
        if (bioLabel) bioLabel.textContent = 'Company / Organization Overview';
    }

    // 2. Fetch latest data from backend if available
    try {
        if (window.ApiClient && typeof window.ApiClient.get === 'function') {
            const endpoint = isProvider ? '/api/profile/provider' : '/api/profile/client';
            const res = await window.ApiClient.get(endpoint).catch(() => null);
            const liveProfile = res?.data || res;

            if (liveProfile) {
                if (liveProfile.fullName && profileFullName) profileFullName.value = liveProfile.fullName;
                if (liveProfile.bio && profileBioInput) profileBioInput.value = liveProfile.bio;
                if (isProvider) {
                    if (liveProfile.domain && providerDomainSelect) providerDomainSelect.value = liveProfile.domain;
                    if (liveProfile.skills && providerSkillsInput) {
                        providerSkillsInput.value = Array.isArray(liveProfile.skills) ? liveProfile.skills.join(', ') : liveProfile.skills;
                    }
                    if (liveProfile.hourlyRate && providerHourlyRateInput) {
                        providerHourlyRateInput.value = liveProfile.hourlyRate;
                    }
                }
            }
        }
    } catch (err) {
        console.warn('Could not fetch server profile, using local session state:', err);
    }

    // 3. Save Changes Handler
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const saveBtn = document.getElementById('btnSaveProfile');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.textContent = 'Saving...';
            }

            const updatedData = {
                fullName: profileFullName.value.trim(),
                bio: profileBioInput.value.trim()
            };

            if (isProvider) {
                updatedData.domain = providerDomainSelect.value;
                updatedData.skills = providerSkillsInput.value.split(',').map(s => s.trim()).filter(Boolean);
                updatedData.hourlyRate = Number(providerHourlyRateInput.value) || 0;
            }

            // Sync with local session immediately (guaranteed UI update)
            const updatedUser = { ...currentUser, ...updatedData };
            if (window.AuthState && typeof window.AuthState.setUser === 'function') {
                window.AuthState.setUser(updatedUser);
            } else {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }

            // Attempt backend persistence
            try {
                if (window.ApiClient && typeof window.ApiClient.put === 'function') {
                    const endpoint = isProvider ? '/api/profile/provider' : '/api/profile/client';
                    await window.ApiClient.put(endpoint, updatedData).catch(async () => {
                        // Fallback to POST if PUT isn't mapped
                        return await window.ApiClient.post(endpoint, updatedData);
                    });
                }
            } catch (error) {
                console.warn('Backend profile update note:', error.message);
            }

            if (window.Toast) {
                window.Toast.success('Profile and services updated successfully!');
            }

            setTimeout(() => {
                window.location.href = dashboardUrl;
            }, 800);
        });
    }
});