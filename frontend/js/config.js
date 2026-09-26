/**
 * WORKBRIDGE - GLOBAL RUNTIME CONFIGURATION
 * File: js/config.js
 * 
 * Provides centralized API endpoints, enumeration keys, and application defaults.
 */

const APP_CONFIG = {
    // Spring Boot Backend Base URL
    API_BASE_URL: 'http://localhost:8080/api',

    // Role Identifiers
    ROLES: {
        CLIENT: 'CLIENT',
        SERVICE_PROVIDER: 'SERVICE_PROVIDER',
        ADMIN: 'ADMIN'
    },

    // Storage Keys (LocalStorage)
    STORAGE_KEYS: {
        AUTH_TOKEN: 'workbridge_jwt_token',
        USER_DATA: 'workbridge_user_info'
    },

    // Project Stage Machine Constants
    PROJECT_STAGES: {
        INVITED: 'INVITED',
        REQUIREMENT_DISCUSSION: 'REQUIREMENT_DISCUSSION',
        AGREEMENT_LOCKED: 'AGREEMENT_LOCKED',
        IN_PROGRESS: 'IN_PROGRESS',
        REVIEW: 'REVIEW',
        COMPLETED: 'COMPLETED'
    },

    // Lock Statuses
    LOCK_STATUS: {
        DRAFT: 'DRAFT',
        PENDING_REVIEW: 'PENDING_REVIEW',
        LOCKED: 'LOCKED',
        REJECTED: 'REJECTED'
    },

    // Polling Intervals (in milliseconds)
    POLLING: {
        CHAT_INTERVAL_MS: 6000
    }
};

// Freeze object to prevent runtime mutations
Object.freeze(APP_CONFIG);
Object.freeze(APP_CONFIG.ROLES);
Object.freeze(APP_CONFIG.STORAGE_KEYS);
Object.freeze(APP_CONFIG.PROJECT_STAGES);
Object.freeze(APP_CONFIG.LOCK_STATUS);
Object.freeze(APP_CONFIG.POLLING);

// Attach to window for global browser access
window.APP_CONFIG = APP_CONFIG;