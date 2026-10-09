/**
 * WORKBRIDGE - GLOBAL RUNTIME CONFIGURATION
 * File: js/config.js
 * 
 * Provides centralized API endpoints, enumeration keys, and application defaults.
 * Configured for Render Web Service + Neon PostgreSQL serverless cloud deployment.
 */

(function () {
    const hostname = window.location.hostname;
    const isLocalhost = Boolean(
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]'
    );

    // Root server domain (WITHOUT trailing /api to prevent /api/api double-prefix bugs)
    const SERVER_ROOT = isLocalhost
        ? 'http://localhost:8080'
        : 'https://workbridge-api-zpdo.onrender.com';

    const APP_CONFIG = {
        // Base API URL
        SERVER_ROOT: SERVER_ROOT,
        API_BASE_URL: `${SERVER_ROOT}/api`,

        // Security & Roles
        ROLES: {
            CLIENT: 'CLIENT',
            SERVICE_PROVIDER: 'SERVICE_PROVIDER',
            ADMIN: 'ADMIN'
        },

        // Client-side Session Persistence Keys
        STORAGE_KEYS: {
            AUTH_TOKEN: 'workbridge_jwt_token',
            USER_DATA: 'workbridge_user_info',
            ACTIVE_PROJECT_ID: 'workbridge_active_prj_id'
        },

        // Project Lifecycle Stages
        PROJECT_STAGES: {
            INVITED: 'INVITED',
            REQUIREMENT_DISCUSSION: 'REQUIREMENT_DISCUSSION',
            AGREEMENT_LOCKED: 'AGREEMENT_LOCKED',
            IN_PROGRESS: 'IN_PROGRESS',
            REVIEW: 'REVIEW',
            COMPLETED: 'COMPLETED'
        },

        // CORE ENGINE A: Scope Agreement & Version Locking
        AGREEMENT_STATUS: {
            DRAFT: 'DRAFT',
            PENDING_SIGNATURES: 'PENDING_SIGNATURES',
            LOCKED: 'LOCKED',
            ACTIVE: 'ACTIVE',
            AMENDMENT_REQUESTED: 'AMENDMENT_REQUESTED',
            SUPERSEDED: 'SUPERSEDED'
        },

        // Requirements Document Lock State
        LOCK_STATUS: {
            DRAFT: 'DRAFT',
            PENDING_REVIEW: 'PENDING_REVIEW',
            LOCKED: 'LOCKED',
            REJECTED: 'REJECTED'
        },

        // CORE ENGINE B: Visual Milestone Progression
        MILESTONE_STATUS: {
            PENDING: 'PENDING',
            SUBMITTED_FOR_REVIEW: 'SUBMITTED_FOR_REVIEW',
            APPROVED: 'APPROVED',
            REVISION_REQUESTED: 'REVISION_REQUESTED'
        },

        // Centralized API Route Mappings
        ENDPOINTS: {
            AUTH: {
                LOGIN: '/api/auth/login',
                REGISTER: '/api/auth/register',
                ME: '/api/auth/me'
            },
            PROJECTS: {
                BASE: '/api/projects',
                CLIENT_ALL: '/api/projects/client',
                PROVIDER_ALL: '/api/projects/provider',
                INVITATIONS_PROVIDER: '/api/projects/invitations/provider',
                RESPOND_INVITATION: (id) => `/api/projects/${id}/invitations/respond`,
                DETAILS: (id) => `/api/projects/${id}`,
                UPDATE_STAGE: (id) => `/api/projects/${id}/stage`
            },
            REQUIREMENTS: {
                GET: (projectId) => `/api/requirements/project/${projectId}`,
                SAVE_DRAFT: (projectId) => `/api/requirements/project/${projectId}/draft`,
                LOCK: (projectId) => `/api/requirements/project/${projectId}/lock`,
                AMENDMENT: (projectId) => `/api/requirements/project/${projectId}/amendment`,
                AI_AUDIT: (projectId) => `/api/ai/audit/requirement/${projectId}`
            },
            AGREEMENTS: {
                GET: (projectId) => `/api/agreements/project/${projectId}`,
                SIGN: (projectId) => `/api/agreements/project/${projectId}/sign`,
                REQUEST_CHANGE: (projectId) => `/api/agreements/project/${projectId}/change-request`,
                HISTORY: (projectId) => `/api/agreements/project/${projectId}/history`
            },
            WORKSPACE: {
                MESSAGES: (projectId) => `/api/workspace/projects/${projectId}/messages`,
                DECISIONS: (projectId) => `/api/workspace/projects/${projectId}/decisions`,
                AI_SUMMARIZE: (projectId) => `/api/ai/summarize/project/${projectId}`
            },
            RESOURCES: {
                LIST: (projectId) => `/api/resources/project/${projectId}`,
                UPLOAD: (projectId) => `/api/resources/project/${projectId}/upload`
            },
            PROFILE: {
                CLIENT: '/api/profile/client',
                PROVIDER: '/api/profile/provider',
                SEARCH_PROVIDERS: '/api/profile/providers/search'
            },
            GOVERNANCE: {
                METRICS: '/api/governance/metrics',
                VERIFICATION_QUEUE: '/api/governance/providers/queue',
                REPORTS: '/api/governance/reports',
                USERS: '/api/governance/users'
            }
        },

        // Network & Polling Configurations
        NETWORK: {
            DEFAULT_TIMEOUT_MS: 15000,
            COLD_START_TIMEOUT_MS: 45000, // Render free tier spin-up allowance
            CHAT_POLLING_MS: 5000
        }
    };

    // Deep freeze helper to protect configuration invariants
    function deepFreeze(obj) {
        Object.keys(obj).forEach(prop => {
            if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                deepFreeze(obj[prop]);
            }
        });
        return Object.freeze(obj);
    }

    deepFreeze(APP_CONFIG);

    // Attach to global window scope
    window.APP_CONFIG = APP_CONFIG;
})();