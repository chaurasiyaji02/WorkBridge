/**
 * WORKBRIDGE - AUTH & SESSION STATE MANAGER
 * File: js/state/authState.js
 * 
 * Manages JWT tokens, user identities, client-side token expiration validation,
 * profile state hydration, and role-based route protection guards.
 */

const AuthState = (function () {
    const config = window.APP_CONFIG || {};
    const STORAGE_KEYS = config.STORAGE_KEYS || {
        AUTH_TOKEN: 'workbridge_jwt_token',
        USER_DATA: 'workbridge_user_info',
        ACTIVE_PROJECT_ID: 'workbridge_active_prj_id'
    };
    const ROLES = config.ROLES || {
        CLIENT: 'CLIENT',
        SERVICE_PROVIDER: 'SERVICE_PROVIDER',
        ADMIN: 'ADMIN'
    };

    /**
     * Persist JWT and user profile metadata after successful login/registration.
     * @param {string} token - JWT bearer token
     * @param {object} user - { id, email, fullName, role, domain, ... }
     */
    function setSession(token, user) {
        if (!token || !user) return;
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }

    /**
     * Update user profile in local session (used by profile-settings page).
     * @param {object} updatedFields
     */
    function setUser(updatedFields) {
        const currentUser = getUser() || {};
        const merged = { ...currentUser, ...updatedFields };
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(merged));
        return merged;
    }

    /**
     * Retrieve the stored JWT token.
     * @returns {string|null}
     */
    function getToken() {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    /**
     * Retrieve current logged-in user profile metadata.
     * @returns {object|null}
     */
    function getUser() {
        const rawUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
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
     * Inspects JWT payload expiration claim without an external library.
     * @param {string} token
     * @returns {boolean} True if token is expired or malformed
     */
    function isTokenExpired(token) {
        if (!token) return true;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return false; // Non-JWT string fallback
            const payload = JSON.parse(atob(parts[1]));
            if (!payload.exp) return false;
            // Buffer of 10 seconds against clock skew
            return Date.now() >= (payload.exp * 1000) - 10000;
        } catch (err) {
            console.warn('Unable to decode token expiration:', err);
            return false;
        }
    }

    /**
     * Check if a valid, unexpired session exists.
     * @returns {boolean}
     */
    function isLoggedIn() {
        const token = getToken();
        const user = getUser();
        if (!token || !user) return false;

        if (isTokenExpired(token)) {
            console.warn('WorkBridge session token has expired. Clearing session.');
            clearSession();
            return false;
        }
        return true;
    }

    /**
     * Verify if the active user matches a specific role.
     * @param {string} role - CLIENT | SERVICE_PROVIDER | ADMIN
     * @returns {boolean}
     */
    function hasRole(role) {
        const user = getUser();
        return isLoggedIn() && !!user && user.role === role;
    }

    /**
     * Active project ID cache helpers
     */
    function setActiveProjectId(projectId) {
        if (!projectId) return;
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, String(projectId));
    }

    function getActiveProjectId() {
        return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    }

    /**
     * Clear all session data from browser storage.
     */
    function clearSession() {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    }

    /**
     * Terminate session and redirect to auth.
     */
    function logout() {
        clearSession();
        window.location.href = 'auth.html';
    }

    /**
     * Route Protection Guard.
     * Redirects to auth.html if not logged in or role mismatch.
     * @param {Array<string>} [allowedRoles] - Optional list of permitted roles
     */
    function requireAuth(allowedRoles = []) {
        if (!isLoggedIn()) {
            const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `auth.html?redirect=${currentPath}`;
            return;
        }

        if (allowedRoles.length > 0) {
            const user = getUser();
            if (!user || !allowedRoles.includes(user.role)) {
                // Route user to their appropriate role portal
                if (user && user.role === ROLES.CLIENT) {
                    window.location.href = 'client-dashboard.html';
                } else if (user && user.role === ROLES.SERVICE_PROVIDER) {
                    window.location.href = 'provider-dashboard.html';
                } else if (user && user.role === ROLES.ADMIN) {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'index.html';
                }
            }
        }
    }

    return {
        setSession,
        setUser,
        getToken,
        getUser,
        isLoggedIn,
        isAuthenticated: isLoggedIn, // Safe alias for navbar & landing page calls
        hasRole,
        setActiveProjectId,
        getActiveProjectId,
        clearSession,
        logout,
        requireAuth
    };
})();

// Attach to window for global access
window.AuthState = AuthState;