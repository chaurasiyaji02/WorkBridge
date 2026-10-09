/**
 * WORKBRIDGE - UNIFIED REST API CLIENT
 * File: js/api/apiClient.js
 * 
 * Centralized fetch client that injects JWT authentication headers,
 * formats payloads, handles multipart file uploads correctly,
 * manages Render free-tier timeouts, and standardizes error responses.
 */

const ApiClient = (function () {
    /**
     * Resolves the API base URL cleanly.
     * Uses APP_CONFIG.SERVER_ROOT or APP_CONFIG.API_BASE_URL.
     */
    function getBaseUrl() {
        const config = window.APP_CONFIG;
        if (config && config.API_BASE_URL) {
            return config.API_BASE_URL.replace(/\/+\$/, '');
        }

        const isLocalhost = Boolean(
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '[::1]'
        );

        return isLocalhost
            ? 'http://localhost:8080/api'
            : 'https://workbridge-api-zpdo.onrender.com/api';
    }

    /**
     * Internal request dispatcher with JWT injection, multipart support,
     * and configurable timeout for Render cold-starts.
     * 
     * @param {string} endpoint - Relative path (e.g. '/auth/login' or 'projects/1')
     * @param {object} options - Fetch options (method, headers, body, params, timeout)
     * @returns {Promise<any>}
     */
    async function request(endpoint, options = {}) {
        let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

        // Prevent duplicate /api/api/...
        if (cleanEndpoint.startsWith('/api/')) {
            cleanEndpoint = cleanEndpoint.substring(4);
        }

        // Attach query params if present
        if (options.params && typeof options.params === 'object') {
            const query = Object.entries(options.params)
                .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                .join('&');
            if (query) {
                cleanEndpoint += (cleanEndpoint.includes('?') ? '&' : '?') + query;
            }
        }

        const url = `${getBaseUrl()}${cleanEndpoint}`;
        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

        // Base headers
        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        // Attach application/json ONLY when not sending FormData
        if (!isFormData && !headers['Content-Type'] && options.body) {
            headers['Content-Type'] = 'application/json';
        } else if (isFormData) {
            // Let the browser set Content-Type with boundary automatically
            delete headers['Content-Type'];
        }

        // Inject JWT Authorization header
        const token = window.AuthState ? window.AuthState.getToken() : null;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Timeout handler (handles Render free-tier spin-up allowance)
        const timeoutMs = options.timeout || (window.APP_CONFIG?.NETWORK?.COLD_START_TIMEOUT_MS || 45000);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const fetchConfig = {
            ...options,
            headers,
            signal: controller.signal
        };

        try {
            const response = await fetch(url, fetchConfig);
            clearTimeout(timeoutId);

            // Handle HTTP 401 Unauthorized (Expired or invalid token)
            if (response.status === 401) {
                console.warn('Session expired or unauthorized (401). Clearing session.');
                if (window.AuthState) {
                    window.AuthState.clearSession();
                }
                if (!window.location.pathname.includes('auth.html')) {
                    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                    window.location.href = `auth.html?session=expired&redirect=${returnUrl}`;
                }
                throw new Error('Your session has expired. Please sign in again.');
            }

            // Handle HTTP 204 No Content
            if (response.status === 204) {
                return null;
            }

            // Parse response body safely
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                let errorMessage = `Request failed with status ${response.status}`;
                if (data && typeof data === 'object') {
                    errorMessage = data.message || data.error || errorMessage;
                } else if (typeof data === 'string' && data.trim()) {
                    errorMessage = data;
                }
                const error = new Error(errorMessage);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            // Unpack standard Spring Boot ApiResponse<T> envelope if present: { success: true, data: ... }
            if (data && typeof data === 'object' && 'data' in data && ('success' in data || 'message' in data)) {
                return data.data;
            }

            return data;

        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                const timeoutError = new Error('Server took too long to respond. Render web service may be waking up. Please retry.');
                timeoutError.status = 408;
                console.error(`API Timeout [${options.method || 'GET'} ${cleanEndpoint}]`);
                throw timeoutError;
            }

            console.error(`API Error [${options.method || 'GET'} ${cleanEndpoint}]:`, error.message);
            throw error;
        }
    }

    /**
     * Standard HTTP Methods
     */
    function get(endpoint, params = null, options = {}) {
        return request(endpoint, { method: 'GET', params, ...options });
    }

    function post(endpoint, body = null, options = {}) {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return request(endpoint, {
            method: 'POST',
            body: isFormData || body === null ? body : JSON.stringify(body),
            ...options
        });
    }

    function put(endpoint, body = null, options = {}) {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return request(endpoint, {
            method: 'PUT',
            body: isFormData || body === null ? body : JSON.stringify(body),
            ...options
        });
    }

    function del(endpoint, options = {}) {
        return request(endpoint, { method: 'DELETE', ...options });
    }

    return {
        get,
        post,
        put,
        delete: del,
        request
    };
})();

// Attach to global window
window.ApiClient = ApiClient;