/**
 * WORKBRIDGE - AI INTELLIGENCE API MODULE
 * File: js/api/aiApi.js
 * 
 * Secure frontend endpoints for on-demand requirement analysis,
 * ambiguity detection, and conversational summaries via the backend AI gateway.
 */

const AiApi = (function () {
    /**
     * Trigger an on-demand AI quality audit on requirement text.
     * Maps to backend AiController (/api/ai/analyze).
     * @param {string|number} projectId
     * @param {string} requirementText - Full requirement draft or scope content
     * @returns {Promise<Object>}
     */
    async function analyzeRequirements(projectId, requirementText) {
        return window.ApiClient.post('/ai/analyze', {
            content: requirementText,
            contextType: 'REQUIREMENT_SPECIFICATION'
        });
    }

    /**
     * Generate an AI synthesis summarizing unresolved questions and key agreements
     * from the project discussion thread. Maps to backend AiController (/api/ai/summarize).
     * @param {string|number} projectId
     * @param {string} [discussionText]
     * @returns {Promise<Object>}
     */
    async function summarizeDiscussion(projectId, discussionText = '') {
        return window.ApiClient.post('/ai/summarize', {
            text: discussionText || `Discussion feed summary request for Project ID #${projectId}`,
            maxTokens: 500
        });
    }

    /**
     * Audit a formal contract/agreement using AI legal intelligence.
     * @param {string|number} agreementId
     * @param {string} [focusArea]
     * @returns {Promise<Object>}
     */
    async function auditAgreement(agreementId, focusArea = 'ALL') {
        return window.ApiClient.post('/ai/audit-agreement', {
            agreementId: Number(agreementId),
            focusArea
        });
    }

    return {
        analyzeRequirements,
        summarizeDiscussion,
        auditAgreement
    };
})();

// Attach to global window
window.AiApi = AiApi;