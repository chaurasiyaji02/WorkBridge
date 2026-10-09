/**
 * WORKBRIDGE - REQUIREMENT & AGREEMENT VERSION BANNER COMPONENT
 * File: js/components/versionBanner.js
 * 
 * Core Engine A: Visual status banners, version lock indicators (v1.0, v2.0),
 * scope amendment alerts, and digital signature state trackers.
 */

const VersionBanner = (function () {
    const config = window.APP_CONFIG || {};
    const LOCK_STATUS = config.LOCK_STATUS || {
        DRAFT: 'DRAFT',
        PENDING_REVIEW: 'PENDING_REVIEW',
        LOCKED: 'LOCKED',
        REJECTED: 'REJECTED'
    };
    const AGREEMENT_STATUS = config.AGREEMENT_STATUS || {
        DRAFT: 'DRAFT',
        LOCKED: 'LOCKED',
        AMENDMENT_REQUESTED: 'AMENDMENT_REQUESTED'
    };

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'recently';
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 'recently' : d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Render or update a requirement version banner element.
     * @param {HTMLElement|string} container - Target container element or selector ID
     * @param {Object} versionData - { version, status, lockedAt, changeReason }
     */
    function renderRequirementBanner(container, versionData = {}) {
        const target = typeof container === 'string' ? document.getElementById(container) : container;
        if (!target) return;

        const status = versionData?.status || LOCK_STATUS.DRAFT;
        const versionNumber = versionData?.version || versionData?.versionNumber || '1.0';
        const isLocked = status === LOCK_STATUS.LOCKED;
        const isPending = status === LOCK_STATUS.PENDING_REVIEW || status === 'PENDING';

        let bannerClass = 'banner-draft';
        let badgeClass = 'badge-primary';
        let badgeText = `v${versionNumber} • DRAFT`;
        let icon = '📝';
        let message = 'This specification is in active drafting. Both parties can collaborate and refine scope.';

        if (isLocked) {
            bannerClass = 'banner-locked';
            badgeClass = 'badge-success';
            badgeText = `🔒 v${versionNumber} • LOCKED`;
            icon = '🛡️';
            message = `Scope baseline locked on ${formatDate(versionData?.lockedAt)}. Direct edits restricted to preserve audit integrity.`;
        } else if (isPending) {
            bannerClass = 'banner-pending';
            badgeClass = 'badge-warning';
            badgeText = `⚡ v${versionNumber} • PENDING LOCK`;
            icon = '⏳';
            message = 'A scope amendment proposal has been submitted and is awaiting mutual sign-off.';
        }

        const reasonHtml = versionData?.changeReason 
            ? `<div class="banner-reason text-xs text-muted mt-1">Scope Change Note: <em>"${escapeHtml(versionData.changeReason)}"</em></div>` 
            : '';

        target.innerHTML = `
            <div class="version-banner card mb-3 ${bannerClass}" style="padding: 0.875rem 1.25rem; border-left: 4px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span class="badge ${badgeClass}">${badgeText}</span>
                        <span style="font-size: 0.875rem; color: var(--text-main); font-weight: 500;">
                            ${icon} ${message}
                        </span>
                    </div>
                </div>
                ${reasonHtml}
            </div>
        `;
    }

    /**
     * Render an agreement execution status banner.
     * @param {HTMLElement|string} container - Target container element or selector ID
     * @param {Object} agreementData - { status, version, clientApproved, providerApproved, lockedAt }
     */
    function renderAgreementBanner(container, agreementData = {}) {
        const target = typeof container === 'string' ? document.getElementById(container) : container;
        if (!target) return;

        const status = agreementData?.status || AGREEMENT_STATUS.DRAFT;
        const versionNumber = agreementData?.version || '1.0';
        const isLocked = status === AGREEMENT_STATUS.LOCKED || status === 'ACTIVE';
        const isAmendment = status === AGREEMENT_STATUS.AMENDMENT_REQUESTED || status === 'AMENDMENT';

        if (isAmendment) {
            target.innerHTML = `
                <div class="version-banner card mb-3 banner-warning" style="padding: 0.875rem 1.25rem; border-left: 4px solid var(--warning); background-color: var(--warning-bg, #fffbeb);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span class="badge badge-warning">📝 AMENDMENT PENDING (v2.0)</span>
                            <span style="font-size: 0.875rem; color: var(--text-main); font-weight: 500;">
                                A Scope Amendment (v2.0) is under review. Baseline v1.0 terms remain actively enforceable until ratified.
                            </span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (isLocked) {
            target.innerHTML = `
                <div class="version-banner card mb-3 banner-success" style="padding: 0.875rem 1.25rem; border-left: 4px solid var(--success); background-color: var(--success-bg, #ecfdf5);">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span class="badge badge-success">🔒 v${versionNumber} • RATIFIED & LOCKED</span>
                        <span style="font-size: 0.875rem; color: var(--text-main); font-weight: 500;">
                            Digital project agreement is legally executed with dual verified digital signatures.
                        </span>
                    </div>
                </div>
            `;
        } else {
            const clientStatus = agreementData?.clientApproved ? '✅ Client Signed' : '⏳ Client Awaiting';
            const providerStatus = agreementData?.providerApproved ? '✅ Provider Signed' : '⏳ Provider Awaiting';

            target.innerHTML = `
                <div class="version-banner card mb-3 banner-warning" style="padding: 0.875rem 1.25rem; border-left: 4px solid var(--warning); background-color: var(--warning-bg, #fffbeb);">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span class="badge badge-warning">v${versionNumber} • DRAFT AGREEMENT</span>
                            <span style="font-size: 0.875rem; color: var(--text-main); font-weight: 500;">
                                Both parties must digitally sign below to lock project terms and advance into development.
                            </span>
                        </div>
                        <div style="font-size: 0.75rem; display: flex; gap: 0.75rem; font-weight: 600;">
                            <span>${clientStatus}</span>
                            <span>${providerStatus}</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    return {
        renderRequirementBanner,
        renderAgreementBanner
    };
})();

// Attach to global window
window.VersionBanner = VersionBanner;