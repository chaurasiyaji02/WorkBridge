/**
 * WORKBRIDGE - WORKSPACE & DISCUSSIONS API MODULE
 * File: js/api/workspaceApi.js
 * 
 * Manages project-scoped chat messages, polling feeds,
 * and formalized technical decision records.
 */

const WorkspaceApi = (function () {
    /**
     * Retrieve chronological message history for a specific project.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>} List of chat message objects
     */
    async function getMessages(projectId) {
        return window.ApiClient.get(`/workspaces/projects/${projectId}/messages`);
    }

    /**
     * Post a new text message to the project conversation.
     * @param {string|number} projectId
     * @param {string} content - Message text
     * @param {string} [attachmentUrl] - Optional attachment URI
     * @returns {Promise<Object>} Created message entity
     */
    async function sendMessage(projectId, content, attachmentUrl = null) {
        return window.ApiClient.post('/workspaces/messages', {
            projectId: Number(projectId),
            content,
            attachmentUrl
        });
    }

    /**
     * Mark unread messages in the project feed as read.
     * @param {string|number} projectId
     * @returns {Promise<Object>}
     */
    async function markMessagesAsRead(projectId) {
        return window.ApiClient.put(`/workspaces/projects/${projectId}/messages/read`, {});
    }

    /**
     * Fetch all formalized architectural and project decisions.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>} List of logged decisions
     */
    async function getDecisions(projectId) {
        return window.ApiClient.get(`/workspaces/projects/${projectId}/decisions`);
    }

    /**
     * Log an immutable project decision extracted from discussion.
     * Maps title, context, and outcome appropriately for backend validation.
     * @param {string|number} projectId
     * @param {Object} decisionPayload - { title, summary, context, outcome }
     * @returns {Promise<Object>} Created decision entity
     */
    async function logDecision(projectId, decisionPayload) {
        return window.ApiClient.post('/workspaces/decisions', {
            projectId: Number(projectId),
            title: decisionPayload.title,
            context: decisionPayload.context || decisionPayload.summary || 'Recorded during workspace collaboration.',
            outcome: decisionPayload.outcome || decisionPayload.summary || 'Adopted and agreed.',
            summary: decisionPayload.summary || decisionPayload.title,
            status: decisionPayload.status || 'RECORDED'
        });
    }

    return {
        getMessages,
        sendMessage,
        markMessagesAsRead,
        getDecisions,
        logDecision
    };
})();

// Attach to global window
window.WorkspaceApi = WorkspaceApi;