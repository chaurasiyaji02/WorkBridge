/**
 * WORKBRIDGE - WORKSPACE & DISCUSSIONS API MODULE
 * File: js/api/workspaceApi.js
 * 
 * Manages project-scoped chat messages, optimized polling feeds,
 * formalized architectural decision records, and AI discussion summaries.
 */

const WorkspaceApi = (function () {
    const endpoints = window.APP_CONFIG?.ENDPOINTS?.WORKSPACE || {};

    /**
     * Retrieve chronological message history for a specific project.
     * Supports timestamp filtering to minimize Neon DB query load.
     * @param {string|number} projectId
     * @param {string} [since] - Optional ISO timestamp for incremental fetch
     * @returns {Promise<Array<Object>>}
     */
    async function getMessages(projectId, since = null) {
        const basePath = typeof endpoints.MESSAGES === 'function'
            ? endpoints.MESSAGES(projectId)
            : `/workspace/projects/${projectId}/messages`;

        const params = since ? { since } : null;

        try {
            const data = await window.ApiClient.get(basePath, params);
            return Array.isArray(data) ? data : (data?.messages || []);
        } catch (err) {
            // Fallback for plural controller mapping variations
            try {
                const fallbackData = await window.ApiClient.get(`/workspaces/projects/${projectId}/messages`, params);
                return Array.isArray(fallbackData) ? fallbackData : [];
            } catch (fallbackErr) {
                console.warn('Could not fetch messages:', fallbackErr.message);
                return [];
            }
        }
    }

    /**
     * Post a new text message to the project conversation.
     * @param {string|number} projectId
     * @param {string} content - Message text
     * @param {string} [attachmentUrl] - Optional attachment URI
     * @returns {Promise<Object>} Created message entity
     */
    async function sendMessage(projectId, content, attachmentUrl = null) {
        const payload = {
            projectId: Number(projectId),
            content: content.trim(),
            attachmentUrl: attachmentUrl || null,
            sentAt: new Date().toISOString()
        };

        const targetPath = typeof endpoints.MESSAGES === 'function'
            ? endpoints.MESSAGES(projectId)
            : `/workspace/projects/${projectId}/messages`;

        try {
            return await window.ApiClient.post(targetPath, payload);
        } catch (err) {
            // Fallback to top-level workspace messages route
            return await window.ApiClient.post('/workspace/messages', payload);
        }
    }

    /**
     * Mark unread messages in the project feed as read.
     * @param {string|number} projectId
     * @returns {Promise<Object>}
     */
    async function markMessagesAsRead(projectId) {
        try {
            return await window.ApiClient.put(`/workspace/projects/${projectId}/messages/read`, {});
        } catch (err) {
            return null; // Non-blocking operation
        }
    }

    /**
     * Fetch all formalized architectural and project decisions.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>} List of logged decisions
     */
    async function getDecisions(projectId) {
        const basePath = typeof endpoints.DECISIONS === 'function'
            ? endpoints.DECISIONS(projectId)
            : `/workspace/projects/${projectId}/decisions`;

        try {
            const data = await window.ApiClient.get(basePath);
            return Array.isArray(data) ? data : (data?.decisions || []);
        } catch (err) {
            try {
                return await window.ApiClient.get(`/workspaces/projects/${projectId}/decisions`);
            } catch (fallbackErr) {
                console.warn('Could not fetch decisions:', fallbackErr.message);
                return [];
            }
        }
    }

    /**
     * Log an immutable project decision extracted from discussion or form (#decisionModal).
     * @param {string|number} projectId
     * @param {Object} decisionPayload - { title, rationale, context, outcome }
     * @returns {Promise<Object>} Created decision entity
     */
    async function logDecision(projectId, decisionPayload) {
        const rationaleText = decisionPayload.rationale || decisionPayload.context || decisionPayload.summary || 'Recorded during project engineering.';
        
        const payload = {
            projectId: Number(projectId),
            title: decisionPayload.title.trim(),
            rationale: rationaleText,
            context: rationaleText,
            outcome: decisionPayload.outcome || rationaleText,
            summary: decisionPayload.title.trim(),
            status: decisionPayload.status || 'RECORDED',
            recordedAt: new Date().toISOString()
        };

        const targetPath = typeof endpoints.DECISIONS === 'function'
            ? endpoints.DECISIONS(projectId)
            : `/workspace/projects/${projectId}/decisions`;

        try {
            return await window.ApiClient.post(targetPath, payload);
        } catch (err) {
            // Fallback route variation
            return await window.ApiClient.post('/workspace/decisions', payload);
        }
    }

    /**
     * AI Discussion Summarizer helper for #btnAiSummarizeChat
     * @param {string|number} projectId
     * @returns {Promise<Object>} { summary, actionItems, keyDecisions }
     */
    async function summarizeDiscussion(projectId) {
        const path = typeof endpoints.AI_SUMMARIZE === 'function'
            ? endpoints.AI_SUMMARIZE(projectId)
            : `/ai/summarize/project/${projectId}`;

        try {
            return await window.ApiClient.post(path, {});
        } catch (err) {
            // Fallback route variation
            return await window.ApiClient.get(`/workspace/projects/${projectId}/summary`);
        }
    }

    return {
        getMessages,
        sendMessage,
        markMessagesAsRead,
        getDecisions,
        logDecision,
        summarizeDiscussion
    };
})();

// Attach to global window
window.WorkspaceApi = WorkspaceApi;