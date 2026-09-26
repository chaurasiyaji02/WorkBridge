/**
 * WORKBRIDGE - AUTHENTICATION API MODULE
 * File: js/api/authApi.js
 * 
 * Endpoints for user onboarding, token issuance, and session verification.
 */

const AuthApi = (function () {
    /**
     * Submit login credentials.
     * @param {Object} credentials - { email, password }
     * @returns {Promise<Object>} { token, user: { id, email, fullName, role } }
     */
    async function login(credentials) {
        return window.ApiClient.post('/auth/login', credentials);
    }

    /**
     * Submit new account registration.
     * @param {Object} payload - { fullName, email, password, role }
     * @returns {Promise<Object>} { token, user: { id, email, fullName, role } }
     */
    async function register(payload) {
        return window.ApiClient.post('/auth/register', payload);
    }

    /**
     * Verify active session and fetch fresh user profile from backend.
     * @returns {Promise<Object>} User details
     */
    async function getCurrentUser() {
        return window.ApiClient.get('/auth/me');
    }

    return {
        login,
        register,
        getCurrentUser
    };
})();

// Attach to window for global access
window.AuthApi = AuthApi;