/**
 * WORKBRIDGE - REQUIREMENT MANAGEMENT API MODULE
 * File: js/api/requirementApi.js
 * 
 * Handles draft saves, requirement locking, version history,
 * and formal scope change proposals.
 */

const RequirementApi = (function () {
    /**
     * Fetch the active requirement document and current version details.
     * @param {string|number} projectId
     * @returns {Promise<Object>} Latest requirement version object
     */
    async function getLatestRequirements(projectId) {
        return window.ApiClient.get(`/requirements/project/${projectId}`);
    }

    /**
     * Save an in-progress working draft of the requirement document.
     * @param {string|number} projectId
     * @param {Object} draftPayload - { title, content, changeSummary }
     * @returns {Promise<Object>} Updated draft details
     */
    async function saveDraft(projectId, draftPayload) {
        return window.ApiClient.post('/requirements/draft', {
            projectId: Number(projectId),
            title: draftPayload.title || 'System Functional Specification',
            content: draftPayload.content || draftPayload.features || '',
            changeSummary: draftPayload.changeSummary || 'Draft update saved'
        });
    }

    /**
     * Mutually lock the active requirement version.
     * @param {string|number} projectId
     * @returns {Promise<Object>} Locked version metadata
     */
    async function lockVersion(projectId) {
        return window.ApiClient.post(`/requirements/project/${projectId}/lock`, {});
    }

    /**
     * Submit a formal scope change request against a locked requirement.
     * @param {string|number} projectId
     * @param {Object} changePayload - { reasonForChange, summary, suggestedModifications }
     * @returns {Promise<Object>} New pending requirement version
     */
    async function proposeChange(projectId, changePayload) {
        return window.ApiClient.post(`/requirements/project/${projectId}/change-request`, {
            reason: changePayload.reasonForChange || changePayload.reason || 'Requested scope revision',
            suggestedModifications: changePayload.suggestedModifications || changePayload.summary || ''
        });
    }

    /**
     * Request approval before final locking.
     * @param {string|number} projectId
     * @returns {Promise<Object>}
     */
    async function requestApproval(projectId) {
        return window.ApiClient.post(`/requirements/project/${projectId}/request-approval`, {});
    }

    return {
        getLatestRequirements,
        saveDraft,
        lockVersion,
        proposeChange,
        requestApproval
    };
})();

// Attach to window
window.RequirementApi = RequirementApi;