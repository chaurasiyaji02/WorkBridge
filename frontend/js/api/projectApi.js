/**
 * WORKBRIDGE - PROJECT API MODULE
 * File: js/api/projectApi.js
 * 
 * Endpoints for project lifecycle management, invitations, stage transitions,
 * weighted milestones (Core Engine B), and status updates.
 */

const ProjectApi = (function () {
    const endpoints = window.APP_CONFIG?.ENDPOINTS?.PROJECTS || {};

    /**
     * Fetch projects initiated by the current client.
     * @param {string} [stageFilter] - Optional stage filter ('ALL', 'IN_PROGRESS', etc.)
     * @returns {Promise<Array<Object>>}
     */
    async function getClientProjects(stageFilter = 'ALL') {
        const path = endpoints.CLIENT_ALL || '/projects/client';
        const params = (stageFilter && stageFilter !== 'ALL') ? { stage: stageFilter } : null;
        return window.ApiClient.get(path, params);
    }

    /**
     * Fetch projects assigned to the current service provider.
     * @param {string} [stageFilter] - Optional stage filter
     * @returns {Promise<Array<Object>>}
     */
    async function getProviderProjects(stageFilter = 'ALL') {
        const path = endpoints.PROVIDER_ALL || '/projects/provider';
        const params = (stageFilter && stageFilter !== 'ALL') ? { stage: stageFilter } : null;
        return window.ApiClient.get(path, params);
    }

    /**
     * Fetch pending incoming invitations for the logged-in provider.
     * @returns {Promise<Array<Object>>}
     */
    async function getProviderInvitations() {
        const path = endpoints.INVITATIONS_PROVIDER || '/projects/invitations/provider';
        try {
            return await window.ApiClient.get(path);
        } catch (err) {
            // Fallback for legacy controller routing variations
            return await window.ApiClient.get('/projects/provider/invitations');
        }
    }

    /**
     * Fetch complete details of a single project by ID.
     * @param {string|number} projectId
     * @returns {Promise<Object>}
     */
    async function getProjectById(projectId) {
        const path = typeof endpoints.DETAILS === 'function' 
            ? endpoints.DETAILS(projectId) 
            : `/projects/${projectId}`;
        return window.ApiClient.get(path);
    }

    /**
     * Create a standalone project requirement posting (Client action from Dashboard).
     * @param {Object} payload - { title, summary/description, category, budget, deadline }
     * @returns {Promise<Object>}
     */
    async function createProject(payload) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);
        const defaultDeadline = targetDate.toISOString().split('T')[0];

        const backendPayload = {
            title: payload.title,
            description: payload.description || payload.summary || 'Project requirement posted on WorkBridge.',
            category: payload.category || 'WEB_DEVELOPMENT',
            budget: Number(payload.budget) > 0 ? Number(payload.budget) : 1000.0,
            deadline: payload.deadline || defaultDeadline
        };

        const path = endpoints.BASE || '/projects';
        return window.ApiClient.post(path, backendPayload);
    }

    /**
     * Create a new project and immediately send an invitation to a specific provider.
     * @param {Object} payload - { title, summary, providerId, budget, deadline }
     * @returns {Promise<Object>}
     */
    async function createAndInvite(payload) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);
        const defaultDeadline = targetDate.toISOString().split('T')[0];

        const backendPayload = {
            title: payload.title,
            description: payload.description || payload.summary || 'Collaborative technical project.',
            category: payload.category || 'FULL_STACK',
            budget: Number(payload.budget) > 0 ? Number(payload.budget) : 2000.0,
            deadline: payload.deadline || defaultDeadline,
            assignedProviderId: payload.providerId ? Number(payload.providerId) : null
        };

        try {
            return await window.ApiClient.post('/projects/invite', backendPayload);
        } catch (err) {
            // Fallback to standard project create endpoint with provider mapping
            return await window.ApiClient.post('/projects', backendPayload);
        }
    }

    /**
     * Accept or decline a project invitation (Provider action).
     * @param {string|number} projectId
     * @param {string} action - 'ACCEPT' | 'DECLINE'
     * @returns {Promise<Object>}
     */
    async function respondToInvitation(projectId, action) {
        const path = typeof endpoints.RESPOND_INVITATION === 'function'
            ? endpoints.RESPOND_INVITATION(projectId)
            : `/projects/${projectId}/invitations/respond`;
        
        try {
            return await window.ApiClient.post(path, { action });
        } catch (err) {
            // Fallback route variation
            return await window.ApiClient.post(`/projects/${projectId}/invitation`, { action });
        }
    }

    /**
     * Advance or transition the project to the next stage in the lifecycle.
     * @param {string|number} projectId
     * @param {string} targetStage - Enum from APP_CONFIG.PROJECT_STAGES
     * @param {string} [transitionNotes] - Reason/hand-off notes for audit logs
     * @returns {Promise<Object>}
     */
    async function updateProjectStage(projectId, targetStage, transitionNotes = '') {
        const path = typeof endpoints.UPDATE_STAGE === 'function'
            ? endpoints.UPDATE_STAGE(projectId)
            : `/projects/${projectId}/stage`;
        
        return window.ApiClient.put(path, { 
            stage: targetStage,
            notes: transitionNotes 
        });
    }

    /**
     * Fetch the daily/recent delivery updates feed for a project.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>}
     */
    async function getProjectUpdates(projectId) {
        return window.ApiClient.get(`/projects/${projectId}/updates`);
    }

    /**
     * Post a new status update to the project timeline.
     * @param {string|number} projectId
     * @param {Object} updatePayload - { title, content }
     * @returns {Promise<Object>}
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
            title: updatePayload.title || 'Delivery Update',
            content: content || 'Status update recorded.'
        });
    }

    // =========================================================================
    // CORE ENGINE B: MILESTONES & VERIFICATION STEPS
    // =========================================================================

    /**
     * Fetch all milestones for a project to calculate weighted progress.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>}
     */
    async function getProjectMilestones(projectId) {
        try {
            return await window.ApiClient.get(`/projects/${projectId}/milestones`);
        } catch (err) {
            // If project entity already has embedded milestones, caller will inspect that
            return [];
        }
    }

    /**
     * Create a new milestone with weight percentage.
     * @param {string|number} projectId
     * @param {Object} milestonePayload - { title, weightPercentage, targetDate, deliverables }
     * @returns {Promise<Object>}
     */
    async function createMilestone(projectId, milestonePayload) {
        return window.ApiClient.post(`/projects/${projectId}/milestones`, {
            title: milestonePayload.title,
            weightPercentage: Number(milestonePayload.weightPercentage) || 20,
            targetDate: milestonePayload.targetDate || null,
            deliverables: milestonePayload.deliverables || ''
        });
    }

    /**
     * Provider submits a deliverable URL (GitHub PR, Figma link) for milestone verification.
     * @param {string|number} projectId
     * @param {string|number} milestoneId
     * @param {Object} submission - { deliverableUrl, notes }
     * @returns {Promise<Object>}
     */
    async function submitMilestoneDeliverable(projectId, milestoneId, submission) {
        return window.ApiClient.post(`/projects/${projectId}/milestones/${milestoneId}/submit`, {
            deliverableUrl: submission.deliverableUrl,
            notes: submission.notes || ''
        });
    }

    /**
     * Client approves a milestone, locking its weight into the total project completion.
     * @param {string|number} projectId
     * @param {string|number} milestoneId
     * @returns {Promise<Object>}
     */
    async function approveMilestone(projectId, milestoneId) {
        return window.ApiClient.put(`/projects/${projectId}/milestones/${milestoneId}/approve`, {});
    }

    /**
     * Client requests a revision on a submitted milestone deliverable.
     * @param {string|number} projectId
     * @param {string|number} milestoneId
     * @param {string} feedbackNotes
     * @returns {Promise<Object>}
     */
    async function requestMilestoneRevision(projectId, milestoneId, feedbackNotes) {
        return window.ApiClient.put(`/projects/${projectId}/milestones/${milestoneId}/revision`, {
            feedback: feedbackNotes
        });
    }

    return {
        getClientProjects,
        getProviderProjects,
        getProviderInvitations,
        getProjectById,
        createProject,
        createAndInvite,
        respondToInvitation,
        updateProjectStage,
        getProjectUpdates,
        postProjectUpdate,
        // Milestone Engine
        getProjectMilestones,
        createMilestone,
        submitMilestoneDeliverable,
        approveMilestone,
        requestMilestoneRevision
    };
})();

// Attach to global window
window.ProjectApi = ProjectApi;