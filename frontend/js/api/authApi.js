/**
 * WORKBRIDGE - AUTHENTICATION API MODULE
 * File: js/api/authApi.js
 * 
 * Endpoints for user onboarding, token issuance, domain persistence,
 * and session verification against Spring Boot & Neon Cloud DB.
 */

const AuthApi = (function () {
    const endpoints = window.APP_CONFIG?.ENDPOINTS?.AUTH || {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        ME: '/auth/me'
    };

    /**
     * Submit login credentials.
     * Normalizes token envelopes (accessToken vs token) for AuthState.
     * @param {Object} credentials - { email, password }
     * @returns {Promise<Object>} { token, user: { id, email, fullName, role, domain } }
     */
    async function login(credentials) {
        const payload = {
            email: (credentials.email || '').trim().toLowerCase(),
            password: credentials.password
        };

        const response = await window.ApiClient.post(endpoints.LOGIN, payload, {
            timeout: window.APP_CONFIG?.NETWORK?.COLD_START_TIMEOUT_MS || 45000
        });

        return normalizeAuthResponse(response);
    }

    /**
     * Submit new account registration.
     * Supports role-specific domain initialization for SERVICE_PROVIDER.
     * @param {Object} payload - { fullName, email, password, role, domain }
     * @returns {Promise<Object>} { token, user: { id, email, fullName, role, domain } }
     */
    async function register(payload) {
        const role = payload.role || window.APP_CONFIG?.ROLES?.CLIENT || 'CLIENT';
        
        const backendPayload = {
            fullName: (payload.fullName || '').trim(),
            email: (payload.email || '').trim().toLowerCase(),
            password: payload.password,
            role: role
        };

        // Attach domain specialization if registering as a Service Provider
        if (role === 'SERVICE_PROVIDER') {
            backendPayload.domain = payload.domain || 'Full-Stack Web Development';
            backendPayload.category = payload.category || payload.domain || 'Full-Stack Web Development';
        }

        const response = await window.ApiClient.post(endpoints.REGISTER, backendPayload, {
            timeout: window.APP_CONFIG?.NETWORK?.COLD_START_TIMEOUT_MS || 45000
        });

        return normalizeAuthResponse(response, backendPayload);
    }

    /**
     * Verify active session and fetch fresh user profile from backend.
     * @returns {Promise<Object>} Fresh user profile details
     */
    async function getCurrentUser() {
        try {
            return await window.ApiClient.get(endpoints.ME);
        } catch (error) {
            console.warn('Session verification failed (/auth/me):', error.message);
            throw error;
        }
    }

    /**
     * Helper to guarantee consistent { token, user } shape
     * across different Spring Boot AuthResponse variations.
     */
    function normalizeAuthResponse(res, originalPayload = {}) {
        if (!res) throw new Error('Empty response received from authentication server.');

        // Extract JWT token safely
        const token = res.token || res.accessToken || res.jwt || (typeof res === 'string' ? res : null);

        // Extract user object safely
        let user = res.user || res.userInfo || null;
        if (!user && (res.email || res.role || res.id)) {
            user = {
                id: res.id || res.userId,
                email: res.email || originalPayload.email,
                fullName: res.fullName || res.name || originalPayload.fullName,
                role: res.role || originalPayload.role,
                domain: res.domain || originalPayload.domain || null
            };
        } else if (user && originalPayload.domain && !user.domain) {
            user.domain = originalPayload.domain;
        }

        return {
            token,
            user
        };
    }

    return {
        login,
        register,
        getCurrentUser
    };
})();

// Attach to window for global access
window.AuthApi = AuthApi;