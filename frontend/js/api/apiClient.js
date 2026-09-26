/**
 * WORKBRIDGE - UNIFIED REST API CLIENT
 * File: js/api/apiClient.js
 * 
 * Centralized fetch client that injects JWT authentication headers,
 * formats payloads, handles multipart file uploads correctly,
 * and standardizes error responses.
 */

const ApiClient = (function () {
    function getBaseUrl() {
        if (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) {
            return window.APP_CONFIG.API_BASE_URL.replace(/\/+$/, '');
        }
        return 'http://localhost:8080/api';
    }

    /**
     * Internal request dispatcher with JWT injection and multipart support.
     * @param {string} endpoint - Relative path (e.g. '/auth/login' or 'projects/1')
     * @param {object} options - Fetch options (method, headers, body)
     * @returns {Promise<any>}
     */
    async function request(endpoint, options = {}) {
        let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

        // Prevent duplicate /api/api/...
        if (cleanEndpoint.startsWith('/api/')) {
            cleanEndpoint = cleanEndpoint.substring(4);
        }

        const url = `${getBaseUrl()}${cleanEndpoint}`;

        const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

        // Base headers
        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        // Attach application/json ONLY when not sending FormData
        if (!isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        } else if (isFormData) {
            // Let the browser set Content-Type with multipart boundary automatically
            delete headers['Content-Type'];
        }

        // Inject JWT Authorization header
        const token = window.AuthState ? window.AuthState.getToken() : null;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Handle HTTP 401 Unauthorized (Expired or invalid token)
            if (response.status === 401) {
                console.warn('Session expired or unauthorized. Clearing session.');
                if (window.AuthState) {
                    window.AuthState.clearSession();
                }
                if (!window.location.pathname.includes('auth.html')) {
                    window.location.href = 'auth.html?session=expired';
                }
                throw new Error('Your session has expired. Please sign in again.');
            }

            // Parse response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                const errorMessage = (data && data.message) || (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
                const error = new Error(errorMessage);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            // Return unpacked data from standard ApiResponse<T> envelope if present
            if (data && typeof data === 'object' && 'data' in data && 'success' in data) {
                return data.data;
            }

            return data;

        } catch (error) {
            console.error(`API Error [${options.method || 'GET'} ${cleanEndpoint}]:`, error.message);
            throw error;
        }
    }

    function get(endpoint) {
        return request(endpoint, { method: 'GET' });
    }

    function post(endpoint, body) {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return request(endpoint, {
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body)
        });
    }

    function put(endpoint, body) {
        const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
        return request(endpoint, {
            method: 'PUT',
            body: isFormData ? body : JSON.stringify(body)
        });
    }

    function del(endpoint) {
        return request(endpoint, { method: 'DELETE' });
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