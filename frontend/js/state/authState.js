/**
 * WORKBRIDGE - AUTH & SESSION STATE MANAGER
 * File: js/state/authState.js
 * 
 * Manages tokens, user identities, client-side expiration validation,
 * dual-tier storage persistence (localStorage vs sessionStorage),
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
     * Helper to select active storage mechanism
     */
    function getStorage(isPersistent = true) {
        return isPersistent ? localStorage : sessionStorage;
    }

    /**
     * Persist token and user profile metadata after successful login/registration.
     * @param {string} token - Session token or JWT
     * @param {object} user - { id, email, fullName, role, domain, ... }
     * @param {boolean} [isPersistent=true] - Persist across browser restarts
     */
    function setSession(token, user, isPersistent = true) {
        if (!token || !user) return;
        
        // Clean any existing residual session in both storages
        clearSession();

        const store = getStorage(isPersistent);
        store.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        store.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    }

    /**
     * Update user profile in active session (used by profile-settings page).
     * @param {object} updatedFields
     */
    function setUser(updatedFields) {
        const currentUser = getUser() || {};
        const merged = { ...currentUser, ...updatedFields };

        if (localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) {
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(merged));
        } else {
            sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(merged));
        }
        return merged;
    }

    /**
     * Retrieve the stored session token from either storage tier.
     * @returns {string|null}
     */
    function getToken() {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    /**
     * Retrieve current logged-in user profile metadata.
     * @returns {object|null}
     */
    function getUser() {
        const rawUser = localStorage.getItem(STORAGE_KEYS.USER_DATA) || sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
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
            if (parts.length !== 3) return false; // Non-JWT string fallback (Supabase local token)
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
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT_ID, String(projectId));
    }

    function getActiveProjectId() {
        return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID) || sessionStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
    }

    /**
     * Clear all session data from both browser storage layers.
     */
    function clearSession() {
        [localStorage, sessionStorage].forEach(store => {
            store.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            store.removeItem(STORAGE_KEYS.USER_DATA);
            store.removeItem(STORAGE_KEYS.ACTIVE_PROJECT_ID);
        });
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
        isAuthenticated: isLoggedIn,
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