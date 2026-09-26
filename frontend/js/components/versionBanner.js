/**
 * WORKBRIDGE - REQUIREMENT & AGREEMENT VERSION BANNER COMPONENT
 * File: js/components/versionBanner.js
 * 
 * Renders visual status banners, lock alerts, pending approval notices,
 * and scope change warnings across workspace tabs.
 */

const VersionBanner = (function () {
    const { LOCK_STATUS } = window.APP_CONFIG;

    /**
     * Render or update a requirement version banner element.
     * @param {HTMLElement|string} container - Target container element or ID selector
     * @param {Object} versionData - { versionNumber, status, lockedBy, lockedAt, changeReason }
     */
    function renderRequirementBanner(container, versionData) {
        const target = typeof container === 'string' ? document.getElementById(container) : container;
        if (!target) return;

        const isLocked = versionData.status === LOCK_STATUS.LOCKED;
        const isPending = versionData.status === LOCK_STATUS.PENDING_REVIEW;
        
        let bannerStyle = 'background-color: var(--bg-surface-alt); border-left: 4px solid var(--primary);';
        let statusBadge = `<span class="badge badge-primary">v${versionData.versionNumber || '1.0'} - DRAFT</span>`;
        let message = 'This specification draft is currently editable by project participants.';

        if (isLocked) {
            bannerStyle = 'background-color: var(--success-bg); border-left: 4px solid var(--success);';
            statusBadge = `<span class="badge badge-success">🔒 v${versionData.versionNumber || '1.0'} - LOCKED</span>`;
            message = `Mutually locked on ${formatDate(versionData.lockedAt)}. Direct edits are restricted to ensure baseline scope integrity.`;
        } else if (isPending) {
            bannerStyle = 'background-color: var(--warning-bg); border-left: 4px solid var(--warning);';
            statusBadge = `<span class="badge badge-warning">⚡ v${versionData.versionNumber || '1.1'} - PENDING LOCK</span>`;
            message = 'A formal scope change proposal has been submitted and is awaiting mutual sign-off.';
        }

        target.innerHTML = `
            <div class="card mb-3" style="${bannerStyle} padding: 0.875rem 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        ${statusBadge}
                        <span style="font-size: 0.875rem; color: var(--text-main);">${message}</span>
                    </div>
                    ${versionData.changeReason ? `<div class="text-xs text-muted">Reason: <em>"${escapeHtml(versionData.changeReason)}"</em></div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render an agreement execution status banner.
     * @param {HTMLElement|string} container
     * @param {Object} agreementData - { status, clientApproved, providerApproved, lockedAt }
     */
    function renderAgreementBanner(container, agreementData) {
        const target = typeof container === 'string' ? document.getElementById(container) : container;
        if (!target) return;

        const isLocked = agreementData.status === LOCK_STATUS.LOCKED;
        
        if (isLocked) {
            target.innerHTML = `
                <div class="card mb-3" style="background-color: var(--success-bg); border-left: 4px solid var(--success); padding: 0.875rem 1.25rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span class="badge badge-success">⚖️ EXECUTED & LOCKED</span>
                        <span style="font-size: 0.875rem; color: var(--text-main);">
                            This digital agreement is legally ratified with verified dual digital signatures.
                        </span>
                    </div>
                </div>
            `;
        } else {
            const clientStatus = agreementData.clientApproved ? '✅ Client Signed' : '⏳ Client Awaiting';
            const providerStatus = agreementData.providerApproved ? '✅ Provider Signed' : '⏳ Provider Awaiting';

            target.innerHTML = `
                <div class="card mb-3" style="background-color: var(--warning-bg); border-left: 4px solid var(--warning); padding: 0.875rem 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span class="badge badge-warning">DRAFT AGREEMENT</span>
                            <span style="font-size: 0.875rem; color: var(--text-main);">
                                Both parties must digitally sign below to lock project terms and advance into development.
                            </span>
                        </div>
                        <div style="font-size: 0.75rem; display: flex; gap: 0.75rem;">
                            <span>${clientStatus}</span>
                            <span>${providerStatus}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'recently';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'recently' : d.toLocaleDateString();
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    return {
        renderRequirementBanner,
        renderAgreementBanner
    };
})();

// Attach to window
window.VersionBanner = VersionBanner;