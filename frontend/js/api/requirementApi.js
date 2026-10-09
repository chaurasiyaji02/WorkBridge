/**
 * WORKBRIDGE - REQUIREMENT MANAGEMENT API MODULE
 * File: js/api/requirementApi.js
 * 
 * Core Engine A: Structured Requirements Engineering, Draft Versioning,
 * Scope Immutability Locking, and AI Quality Auditing.
 */

const RequirementApi = (function () {
    const endpoints = window.APP_CONFIG?.ENDPOINTS?.REQUIREMENTS || {};

    /**
     * Fetch the active requirement document and current version details.
     * @param {string|number} projectId
     * @returns {Promise<Object|null>} Latest requirement version object
     */
    async function getLatestRequirements(projectId) {
        const path = typeof endpoints.GET === 'function'
            ? endpoints.GET(projectId)
            : `/requirements/project/${projectId}`;

        try {
            return await window.ApiClient.get(path);
        } catch (err) {
            if (err.status === 404) return null;
            console.warn('Could not fetch requirements:', err.message);
            throw err;
        }
    }

    /**
     * Save working draft matching the fields in #requirementForm.
     * Preserves structured fields: objective, targetUsers, features, techPreferences, nonFunctional.
     * 
     * @param {string|number} projectId
     * @param {Object} draftPayload
     * @returns {Promise<Object>} Updated draft details
     */
    async function saveDraft(projectId, draftPayload) {
        const payload = {
            projectId: Number(projectId),
            objectives: draftPayload.objectives || draftPayload.reqObjective || '',
            targetUsers: draftPayload.targetUsers || draftPayload.reqTargetUsers || '',
            features: draftPayload.features || draftPayload.reqFeatures || '',
            techPreferences: draftPayload.techPreferences || draftPayload.reqTechPreferences || '',
            nonFunctional: draftPayload.nonFunctional || draftPayload.reqNonFunctional || '',
            // Combined fallback text for legacy controllers expecting 'content'
            content: [
                draftPayload.objectives ? `## Objectives\n${draftPayload.objectives}` : '',
                draftPayload.targetUsers ? `## Target Users\n${draftPayload.targetUsers}` : '',
                draftPayload.features ? `## Key Features\n${draftPayload.features}` : '',
                draftPayload.techPreferences ? `## Tech Preferences\n${draftPayload.techPreferences}` : '',
                draftPayload.nonFunctional ? `## Non-Functional\n${draftPayload.nonFunctional}` : ''
            ].filter(Boolean).join('\n\n'),
            version: draftPayload.version || '1.0'
        };

        const targetPath = typeof endpoints.SAVE_DRAFT === 'function'
            ? endpoints.SAVE_DRAFT(projectId)
            : `/requirements/project/${projectId}/draft`;

        try {
            return await window.ApiClient.post(targetPath, payload);
        } catch (err) {
            // Fallback to top-level draft route
            return await window.ApiClient.post('/requirements/draft', payload);
        }
    }

    /**
     * Mutually lock the active requirement version into immutable state.
     * @param {string|number} projectId
     * @returns {Promise<Object>} Locked version metadata
     */
    async function lockVersion(projectId) {
        const path = typeof endpoints.LOCK === 'function'
            ? endpoints.LOCK(projectId)
            : `/requirements/project/${projectId}/lock`;

        return window.ApiClient.post(path, {});
    }

    /**
     * Propose a formal scope change against a locked requirement (v1.0 -> v2.0).
     * @param {string|number} projectId
     * @param {Object} changePayload - { reason, suggestedModifications }
     * @returns {Promise<Object>} Created revision proposal
     */
    async function proposeChange(projectId, changePayload) {
        const path = typeof endpoints.AMENDMENT === 'function'
            ? endpoints.AMENDMENT(projectId)
            : `/requirements/project/${projectId}/amendment`;

        const payload = {
            reason: changePayload.reason || changePayload.reasonForChange || 'Scope revision requested',
            modifications: changePayload.modifications || changePayload.suggestedModifications || '',
            requestedAt: new Date().toISOString()
        };

        try {
            return await window.ApiClient.post(path, payload);
        } catch (err) {
            return await window.ApiClient.post(`/requirements/project/${projectId}/change-request`, payload);
        }
    }

    /**
     * Trigger AI Quality Audit for #btnAiAnalyzeReq.
     * Evaluates clarity, detects ambiguities, and flags missing engineering requirements.
     * @param {string|number} projectId
     * @param {Object} [currentDraftData] - Optional unsaved draft content to audit
     * @returns {Promise<Object>} { qualityScore, ambiguityDetected, suggestions, breakdown }
     */
    async function analyzeWithAi(projectId, currentDraftData = null) {
        const path = typeof endpoints.AI_AUDIT === 'function'
            ? endpoints.AI_AUDIT(projectId)
            : `/ai/audit/requirement/${projectId}`;

        try {
            return await window.ApiClient.post(path, currentDraftData || {});
        } catch (err) {
            // Fallback endpoint variation
            return await window.ApiClient.post(`/requirements/project/${projectId}/ai-audit`, currentDraftData || {});
        }
    }

    /**
     * Fetch chronological version snapshot history for requirements.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>}
     */
    async function getVersionHistory(projectId) {
        try {
            const data = await window.ApiClient.get(`/requirements/project/${projectId}/history`);
            return Array.isArray(data) ? data : [];
        } catch (err) {
            return [];
        }
    }

    return {
        getLatestRequirements,
        saveDraft,
        lockVersion,
        proposeChange,
        analyzeWithAi,
        getVersionHistory
    };
})();

// Attach to global window
window.RequirementApi = RequirementApi;