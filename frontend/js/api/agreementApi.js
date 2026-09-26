/**
 * WORKBRIDGE - MUTUAL DIGITAL AGREEMENT API MODULE
 * File: js/api/agreementApi.js
 * 
 * Coordinates agreement document retrieval, milestone values,
 * mutual digital signatures, and formal change requests.
 */

const AgreementApi = (function () {
    /**
     * Fetch the active mutual agreement document and signature status for a project.
     * @param {string|number} projectId
     * @returns {Promise<Object>} Agreement details with client/provider approval states
     */
    async function getAgreement(projectId) {
        return window.ApiClient.get(`/agreements/project/${projectId}`);
    }

    /**
     * Create or draft terms of an agreement.
     * @param {string|number} projectId
     * @param {Object} draftPayload - { providerId, agreedAmount, termsAndConditions }
     * @returns {Promise<Object>} Updated agreement draft
     */
    async function saveAgreementDraft(projectId, draftPayload) {
        return window.ApiClient.post('/agreements', {
            projectId: Number(projectId),
            providerId: Number(draftPayload.providerId),
            agreedAmount: Number(draftPayload.amount || draftPayload.agreedAmount || 5000.00),
            termsAndConditions: draftPayload.terms || draftPayload.termsAndConditions || 'Standard scope terms ratified by both parties.'
        });
    }

    /**
     * Sign and approve the current agreement version.
     * @param {string|number} projectId
     * @param {string|number} [agreementId]
     * @returns {Promise<Object>} Updated approval status
     */
    async function approveAgreement(projectId, agreementId) {
        let targetId = agreementId;
        if (!targetId) {
            const agreement = await getAgreement(projectId);
            targetId = agreement ? agreement.id : null;
        }

        if (!targetId) {
            throw new Error('No active agreement found to sign for this project.');
        }

        return window.ApiClient.post(`/agreements/${targetId}/sign`, {
            agreedToTerms: true
        });
    }

    /**
     * Request specific alterations or dispute agreement terms.
     * @param {string|number} projectId
     * @param {string} changeReason
     * @param {string|number} [agreementId]
     * @returns {Promise<Object>} Reset agreement state for revisions
     */
    async function requestAgreementChange(projectId, changeReason, agreementId) {
        let targetId = agreementId;
        if (!targetId) {
            const agreement = await getAgreement(projectId);
            targetId = agreement ? agreement.id : null;
        }

        if (!targetId) {
            throw new Error('No active agreement found to request changes on.');
        }

        return window.ApiClient.post(`/agreements/${targetId}/action`, {
            action: 'DISPUTE',
            reason: changeReason
        });
    }

    /**
     * Fetch historical user agreements.
     * @returns {Promise<Array<Object>>} List of historical agreements
     */
    async function getAgreementHistory() {
        return window.ApiClient.get('/agreements/my');
    }

    return {
        getAgreement,
        saveAgreementDraft,
        approveAgreement,
        requestAgreementChange,
        getAgreementHistory
    };
})();

// Attach to global window
window.AgreementApi = AgreementApi;