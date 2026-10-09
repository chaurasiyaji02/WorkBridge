/**
 * WORKBRIDGE - MUTUAL DIGITAL AGREEMENT API MODULE
 * File: js/api/agreementApi.js
 * 
 * Core Engine A: Version Locking, Mutual Digital Signatures, 
 * Scope Amendment Protocol (v1.0 -> v2.0), and Audit History.
 */

const AgreementApi = (function () {
    const endpoints = window.APP_CONFIG?.ENDPOINTS?.AGREEMENTS || {};

    /**
     * Fetch the active mutual agreement document and signature status for a project.
     * @param {string|number} projectId
     * @returns {Promise<Object>} Agreement entity with version, status, client/provider signatures
     */
    async function getAgreement(projectId) {
        const path = typeof endpoints.GET === 'function'
            ? endpoints.GET(projectId)
            : `/agreements/project/${projectId}`;
        try {
            return await window.ApiClient.get(path);
        } catch (err) {
            // Return null cleanly if agreement has not yet been drafted
            if (err.status === 404) return null;
            throw err;
        }
    }

    /**
     * Create or draft terms of an agreement before mutual locking.
     * @param {string|number} projectId
     * @param {Object} draftPayload - { providerId, amount, terms, timeline }
     * @returns {Promise<Object>} Created or updated agreement draft
     */
    async function saveAgreementDraft(projectId, draftPayload) {
        const payload = {
            projectId: Number(projectId),
            providerId: draftPayload.providerId ? Number(draftPayload.providerId) : null,
            agreedAmount: Number(draftPayload.amount || draftPayload.agreedAmount || 0),
            termsAndConditions: draftPayload.terms || draftPayload.termsAndConditions || 'Standard scope terms agreed by client and provider.',
            targetDeliveryDate: draftPayload.timeline || draftPayload.targetDeliveryDate || null,
            version: draftPayload.version || '1.0'
        };

        try {
            return await window.ApiClient.post('/agreements', payload);
        } catch (err) {
            // Project-scoped fallback
            return await window.ApiClient.post(`/agreements/project/${projectId}`, payload);
        }
    }

    /**
     * Mutual Digital Signature: Client or Provider signs the agreement.
     * When both parties sign, backend transitions status to LOCKED (v1.0 immutable).
     * @param {string|number} projectId
     * @param {string|number} [agreementId]
     * @returns {Promise<Object>} Updated agreement with sign timestamps
     */
    async function approveAgreement(projectId, agreementId) {
        // Preferred route: Project-scoped sign
        const path = typeof endpoints.SIGN === 'function'
            ? endpoints.SIGN(projectId)
            : `/agreements/project/${projectId}/sign`;

        const signPayload = {
            agreedToTerms: true,
            signedAt: new Date().toISOString()
        };

        try {
            return await window.ApiClient.post(path, signPayload);
        } catch (err) {
            // Fallback to agreement ID-scoped route if project-scoped fails
            let targetId = agreementId;
            if (!targetId) {
                const ag = await getAgreement(projectId);
                targetId = ag?.id;
            }
            if (targetId) {
                return await window.ApiClient.post(`/agreements/${targetId}/sign`, signPayload);
            }
            throw err;
        }
    }

    /**
     * Request alterations or dispute terms while agreement is in DRAFT.
     * @param {string|number} projectId
     * @param {string} changeReason
     * @returns {Promise<Object>}
     */
    async function requestAgreementChange(projectId, changeReason) {
        const path = typeof endpoints.REQUEST_CHANGE === 'function'
            ? endpoints.REQUEST_CHANGE(projectId)
            : `/agreements/project/${projectId}/change-request`;

        const payload = {
            action: 'REVISION_REQUESTED',
            reason: changeReason
        };

        try {
            return await window.ApiClient.post(path, payload);
        } catch (err) {
            return await window.ApiClient.post(`/agreements/project/${projectId}/action`, payload);
        }
    }

    /**
     * CORE ENGINE A: Formal Scope Amendment Protocol (Change Request)
     * Used when an agreement is already LOCKED. Proposes v2.0 without destroying v1.0.
     * @param {string|number} projectId
     * @param {Object} amendmentData - { reason, modifiedScope, budgetAdjustment }
     * @returns {Promise<Object>} Created amendment entity
     */
    async function proposeScopeAmendment(projectId, amendmentData) {
        const payload = {
            projectId: Number(projectId),
            amendmentReason: amendmentData.reason,
            scopeChanges: amendmentData.modifiedScope || amendmentData.details,
            budgetAdjustment: Number(amendmentData.budgetAdjustment) || 0,
            requestedAt: new Date().toISOString()
        };

        try {
            return await window.ApiClient.post(`/agreements/project/${projectId}/amendment`, payload);
        } catch (err) {
            // Fallback for general change request route
            return await window.ApiClient.post(`/agreements/project/${projectId}/change-request`, {
                action: 'AMENDMENT',
                ...payload
            });
        }
    }

    /**
     * CORE ENGINE A: Scope Audit History & Version Timeline
     * Fetches version milestones, signature dates, and amendments for #auditHistoryModal.
     * @param {string|number} projectId
     * @returns {Promise<Array<Object>>} Audit records timeline
     */
    async function getProjectAuditHistory(projectId) {
        const path = typeof endpoints.HISTORY === 'function'
            ? endpoints.HISTORY(projectId)
            : `/agreements/project/${projectId}/history`;

        try {
            const records = await window.ApiClient.get(path);
            return Array.isArray(records) ? records : [];
        } catch (err) {
            console.warn('Could not fetch remote audit history, returning empty history:', err.message);
            return [];
        }
    }

    /**
     * Fetch user's historical agreements across all projects.
     * @returns {Promise<Array<Object>>}
     */
    async function getAgreementHistory() {
        try {
            return await window.ApiClient.get('/agreements/my');
        } catch (err) {
            return [];
        }
    }

    return {
        getAgreement,
        saveAgreementDraft,
        approveAgreement,
        requestAgreementChange,
        proposeScopeAmendment,
        getProjectAuditHistory,
        getAgreementHistory
    };
})();

// Attach to global window
window.AgreementApi = AgreementApi;