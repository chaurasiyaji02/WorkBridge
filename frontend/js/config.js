/**
 * WORKBRIDGE - GLOBAL RUNTIME CONFIGURATION
 * File: js/config.js
 * 
 * Provides centralized runtime engines, Supabase table mappings,
 * enumeration keys, and application defaults.
 * Architecture: Supabase Cloud (Primary Data Engine) + REST Façade.
 */

(function () {
    const hostname = window.location.hostname;
    const isLocalhost = Boolean(
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '[::1]'
    );

    // Secondary / Legacy Façade Endpoint (Academic presentation fallback)
    const REST_FACADE_ROOT = isLocalhost
        ? 'http://localhost:8080'
        : 'https://workbridge-api-zpdo.onrender.com';

    const APP_CONFIG = {
        // Core Architecture Routing
        // 'SUPABASE' is the live, active database engine for client/provider workflows.
        // 'REST_FACADE' is retained as an academic demonstration layer.
        PRIMARY_BACKEND: 'SUPABASE',
        IS_LOCAL_ENV: isLocalhost,

        // Academic Façade Endpoints (Non-blocking)
        SERVER_ROOT: REST_FACADE_ROOT,
        API_BASE_URL: `${REST_FACADE_ROOT}/api`,

        // Centralized Supabase PostgreSQL Schema & Table Registry
        DATABASE: {
            TABLES: {
                PROFILES: 'profiles',
                PROJECTS: 'projects',
                AGREEMENTS: 'agreements',
                TASKS: 'tasks',
                SERVICES: 'services',
                DISCUSSIONS: 'discussions',
                DECISIONS: 'decisions',
                RESOURCES: 'resources',
                AUDIT_LOGS: 'audit_logs'
            },
            REALTIME_CHANNELS: {
                WORKSPACE: 'workspace-realtime',
                PROJECT_ALERTS: 'project-alerts'
            }
        },

        // Security & User Roles (3-Role Governance Model)
        ROLES: {
            CLIENT: 'CLIENT',
            SERVICE_PROVIDER: 'SERVICE_PROVIDER',
            ADMIN: 'ADMIN'
        },

        // Client-side Session Persistence Keys
        STORAGE_KEYS: {
            AUTH_TOKEN: 'workbridge_jwt_token',
            USER_DATA: 'workbridge_user_info',
            ACTIVE_PROJECT_ID: 'workbridge_active_prj_id',
            ACTIVE_TAB: 'workbridge_active_tab'
        },

        // Project Lifecycle Stages (Full 6-Stage Governance Pipeline)
        PROJECT_STAGES: {
            INVITED: 'INVITED',
            REQUIREMENT_DISCUSSION: 'REQUIREMENT_DISCUSSION',
            AGREEMENT_LOCKED: 'AGREEMENT_LOCKED',
            IN_PROGRESS: 'IN_PROGRESS',
            REVIEW: 'REVIEW',
            COMPLETED: 'COMPLETED'
        },

        // CORE ENGINE A: Scope Agreement & Bilateral Negotiation States
        AGREEMENT_STATUS: {
            DRAFT: 'DRAFT',
            CLIENT_REVIEW: 'CLIENT_REVIEW',
            PROVIDER_REVIEW: 'PROVIDER_REVIEW',
            CLEARED_FOR_SIGNING: 'CLEARED_FOR_SIGNING',
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
            IN_PROGRESS: 'IN_PROGRESS',
            SUBMITTED_FOR_REVIEW: 'SUBMITTED_FOR_REVIEW',
            APPROVED: 'APPROVED',
            REVISION_REQUESTED: 'REVISION_REQUESTED'
        },

        // Sprint Execution & Task Kanban Enums (Tab 3 Horizon & Board)
        TASK_STATUS: {
            TODO: 'TODO',
            IN_PROGRESS: 'IN_PROGRESS',
            DONE: 'DONE'
        },

        TASK_PRIORITY: {
            CRITICAL: 'CRITICAL',
            HIGH: 'HIGH',
            MEDIUM: 'MEDIUM',
            LOW: 'LOW'
        },

        // Deliverable Verification Formats
        VERIFICATION_TYPES: {
            GIT_PR: 'GIT_PR',
            STAGING_DEMO: 'STAGING_DEMO',
            CONTAINER: 'CONTAINER'
        },

        // Marketplace Catalog Filters & Sort Orders
        EXPLORE_FILTERS: {
            RATE_BRACKETS: {
                ALL: 'ALL',
                UNDER_50: 'UNDER_50',
                BETWEEN_50_100: '50_100',
                ABOVE_100: 'ABOVE_100'
            },
            SORT_ORDERS: {
                RATING_DESC: 'RATING_DESC',
                RATE_ASC: 'RATE_ASC',
                RATE_DESC: 'RATE_DESC',
                SLA_ASC: 'SLA_ASC'
            }
        },

        // Centralized API Route Mappings (Façade Reference Contracts)
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
                UPDATE_STAGE: (id) => `/api/projects/${id}/stage`,
                TASKS: (projectId) => `/api/projects/${projectId}/tasks`
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
                PROPOSE_TERMS: (projectId) => `/api/agreements/project/${projectId}/propose`,
                SIGN: (projectId) => `/api/agreements/project/${projectId}/sign`,
                REQUEST_CHANGE: (projectId) => `/api/agreements/project/${projectId}/change-request`,
                HISTORY: (projectId) => `/api/agreements/project/${projectId}/history`
            },
            WORKSPACE: {
                MESSAGES: (projectId) => `/api/workspace/projects/${projectId}/messages`,
                DECISIONS: (projectId) => `/api/workspace/projects/${projectId}/decisions`,
                UPDATES: (projectId) => `/api/workspace/projects/${projectId}/updates`,
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

        // Network Timing Configurations
        NETWORK: {
            DEFAULT_TIMEOUT_MS: 15000,
            POLLING_INTERVAL_MS: 5000
        }
    };

    // Deep freeze helper taaki runtime par constants mutate na ho sakein
    function deepFreeze(obj) {
        Object.keys(obj).forEach(prop => {
            if (typeof obj[prop] === 'object' && obj[prop] !== null) {
                deepFreeze(obj[prop]);
            }
        });
        return Object.freeze(obj);
    }

    deepFreeze(APP_CONFIG);

    // Global window scope mein attach karna
    window.APP_CONFIG = APP_CONFIG;
})();