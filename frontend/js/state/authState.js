/**
 * WORKBRIDGE - AUTH & SESSION STATE MANAGER
 * File: js/state/authState.js
 * 
 * Manages JWT tokens, user identities, and route protection guards.
 */

const AuthState = (function () {
    const { AUTH_TOKEN, USER_DATA } = window.APP_CONFIG.STORAGE_KEYS;
    const { ROLES } = window.APP_CONFIG;

    /**
     * Persist JWT and user profile metadata after successful login/registration.
     * @param {string} token - JWT bearer token
     * @param {object} user - { id, email, fullName, role }
     */
    function setSession(token, user) {
        if (!token || !user) return;
        localStorage.setItem(AUTH_TOKEN, token);
        localStorage.setItem(USER_DATA, JSON.stringify(user));
    }

    /**
     * Retrieve the stored JWT token.
     * @returns {string|null}
     */
    function getToken() {
        return localStorage.getItem(AUTH_TOKEN);
    }

    /**
     * Retrieve current logged-in user profile metadata.
     * @returns {object|null}
     */
    function getUser() {
        const rawUser = localStorage.getItem(USER_DATA);
        if (!rawUser) return null;
        try {
            return JSON.parse(rawUser);
        } catch (e) {
            console.error('Error parsing stored user data', e);
            clearSession();
            return null;
        }
    }

    /**
     * Check if a valid session exists.
     * @returns {boolean}
     */
    function isLoggedIn() {
        return !!getToken() && !!getUser();
    }

    /**
     * Verify if the active user matches a specific role.
     * @param {string} role - CLIENT | SERVICE_PROVIDER | ADMIN
     * @returns {boolean}
     */
    function hasRole(role) {
        const user = getUser();
        return !!user && user.role === role;
    }

    /**
     * Clear all session data and redirect to landing or login.
     */
    function clearSession() {
        localStorage.removeItem(AUTH_TOKEN);
        localStorage.removeItem(USER_DATA);
    }

    function logout() {
        clearSession();
        window.location.href = 'auth.html';
    }

    /**
     * Protect private pages. Redirects to auth.html if not logged in
     * or if the user's role is not in the allowed list.
     * @param {Array<string>} [allowedRoles] - Optional list of permitted roles
     */
    function requireAuth(allowedRoles = []) {
        if (!isLoggedIn()) {
            window.location.href = 'auth.html';
            return;
        }

        if (allowedRoles.length > 0) {
            const user = getUser();
            if (!allowedRoles.includes(user.role)) {
                // Redirect user to their appropriate role home if unauthorized
                if (user.role === ROLES.CLIENT) {
                    window.location.href = 'client-dashboard.html';
                } else if (user.role === ROLES.SERVICE_PROVIDER) {
                    window.location.href = 'provider-dashboard.html';
                } else if (user.role === ROLES.ADMIN) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }
        }
    }

    return {
        setSession,
        getToken,
        getUser,
        isLoggedIn,
        hasRole,
        clearSession,
        logout,
        requireAuth
    };
})();

// Attach to window for global access
window.AuthState = AuthState;