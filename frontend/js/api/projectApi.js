/**
 * WORKBRIDGE - PROJECT API MODULE
 * File: js/api/projectApi.js
 * 
 * Endpoints for project creation, invitation dispatching, stage transitions,
 * dashboard queries, and daily standup updates.
 */

const ProjectApi = (function () {
    /**
     * Fetch projects initiated by the current client.
     * @param {string} [stageFilter] - Optional stage filter (e.g., 'IN_PROGRESS', 'ALL')
     * @returns {Promise<Array<Object>>} List of client projects
     */
    async function getClientProjects(stageFilter = 'ALL') {
        const query = stageFilter && stageFilter !== 'ALL' ? `?stage=${encodeURIComponent(stageFilter)}` : '';
        return window.ApiClient.get(`/projects/client${query}`);
    }

    /**
     * Fetch projects assigned to the current service provider.
     * @param {string} [stageFilter] - Optional stage filter
     * @returns {Promise<Array<Object>>} List of provider projects
     */
    async function getProviderProjects(stageFilter = 'ALL') {
        const query = stageFilter && stageFilter !== 'ALL' ? `?stage=${encodeURIComponent(stageFilter)}` : '';
        return window.ApiClient.get(`/projects/provider${query}`);
    }

    /**
     * Fetch pending incoming invitations for the logged-in provider.
     * @returns {Promise<Array<Object>>} List of invitations
     */
    async function getProviderInvitations() {
        return window.ApiClient.get('/projects/provider/invitations');
    }

    /**
     * Fetch complete details of a single project by ID.
     * @param {string|number} projectId
     * @returns {Promise<Object>} Project details & member records
     */
    async function getProjectById(projectId) {
        return window.ApiClient.get(`/projects/${projectId}`);
    }

    /**
     * Create a new project and send an invitation to a service provider.
     * Formatted to fulfill Spring Boot ProjectCreateRequest validation.
     * @param {Object} payload - { title, summary, providerId, budget, deadline }
     * @returns {Promise<Object>} Created project entity
     */
    async function createAndInvite(payload) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);
        const defaultDeadline = targetDate.toISOString().split('T')[0];

        const backendPayload = {
            title: payload.title,
            description: payload.description || payload.summary || 'Project collaboration initialized on WorkBridge.',
            budget: Number(payload.budget || payload.estimatedBudget || 5000.00),
            deadline: payload.deadline || payload.targetDeadline || defaultDeadline,
            assignedProviderId: payload.providerId ? Number(payload.providerId) : null
        };

        return window.ApiClient.post('/projects/invite', backendPayload);
    }

    /**
     * Accept or decline a project invitation (Provider action).
     * @param {string|number} projectId
     * @param {string} action - 'ACCEPT' | 'DECLINE'
     * @returns {Promise<Object>} Updated project state
     */
    async function respondToInvitation(projectId, action) {
        return window.ApiClient.post(`/projects/${projectId}/invitation`, { action });
    }

    /**
     * Advance or transition the project to the next stage in the lifecycle.
     * @param {string|number} projectId
     * @param {string} targetStage - Enum from APP_CONFIG.PROJECT_STAGES
     * @returns {Promise<Object>} Updated project state
     */
    async function updateProjectStage(projectId, targetStage) {
        return window.ApiClient.put(`/projects/${projectId}/stage`, { stage: targetStage });
    }

    /**
     * Fetch the daily/recent status updates feed for a project.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>} List of status updates
     */
    async function getProjectUpdates(projectId) {
        return window.ApiClient.get(`/projects/${projectId}/updates`);
    }

    /**
     * Post a new daily/milestone status update to the project timeline.
     * @param {string|number} projectId
     * @param {Object} updatePayload - { title, content }
     * @returns {Promise<Object>} Created update record
     */
    async function postProjectUpdate(projectId, updatePayload) {
        let content = updatePayload.content;
        if (!content) {
            content = [
                updatePayload.completedText ? `Completed: ${updatePayload.completedText}` : '',
                updatePayload.inProgressText ? `In Progress: ${updatePayload.inProgressText}` : '',
                updatePayload.blockersText ? `Blockers: ${updatePayload.blockersText}` : ''
            ].filter(Boolean).join('\n\n');
        }

        return window.ApiClient.post(`/projects/${projectId}/updates`, {
            title: updatePayload.title || 'Engineering Status Update',
            content: content || 'Status update logged.'
        });
    }

    return {
        getClientProjects,
        getProviderProjects,
        getProviderInvitations,
        getProjectById,
        createAndInvite,
        respondToInvitation,
        updateProjectStage,
        getProjectUpdates,
        postProjectUpdate
    };
})();

// Attach to global window
window.ProjectApi = ProjectApi;