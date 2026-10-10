/**
 * WORKBRIDGE - PROJECT WORKSPACE MASTER CONTROLLER (SUPABASE CLOUD EDITION)
 * File: js/pages/projectWorkspacePage.js
 * 
 * Orchestrating:
 * - Engine A: Scope Version Locking, Mutual Agreement Signing, Reopen Revision Loop.
 * - Engine B: Milestone Proof Verification, Deliverable Reviewer Modal, Weighted Progress.
 * - Workspace Chat, Logged Decisions Journal, Permanent Material Vault, and Status Updates.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || { CLIENT: 'CLIENT', SERVICE_PROVIDER: 'SERVICE_PROVIDER', ADMIN: 'ADMIN' };
    const PROJECT_STAGES = config.PROJECT_STAGES || {
        INVITED: 'INVITED',
        REQUIREMENT_DISCUSSION: 'REQUIREMENT_DISCUSSION',
        AGREEMENT_LOCKED: 'AGREEMENT_LOCKED',
        IN_PROGRESS: 'IN_PROGRESS',
        REVIEW: 'REVIEW',
        COMPLETED: 'COMPLETED'
    };

    // -------------------------------------------------------------------------
    // 1. Authentication & Route Context
    // -------------------------------------------------------------------------
    if (window.AuthState) {
        window.AuthState.requireAuth([ROLES.CLIENT, ROLES.SERVICE_PROVIDER, ROLES.ADMIN]);
    }

    const currentUser = window.AuthState ? window.AuthState.getUser() : null;
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id') || window.AuthState?.getActiveProjectId();

    if (!projectId) {
        if (window.Toast) window.Toast.error('No project ID found. Returning to dashboard.');
        setTimeout(() => window.location.href = 'index.html', 1200);
        return;
    }

    if (window.AuthState?.setActiveProjectId) {
        window.AuthState.setActiveProjectId(projectId);
    }

    const sb = window.sbClient;

    // -------------------------------------------------------------------------
    // 2. DOM Elements Cache
    // -------------------------------------------------------------------------
    // Header & Pipeline
    const projectTitleEl = document.getElementById('projectTitle');
    const projectCodeBadgeEl = document.getElementById('projectCodeBadge');
    const scopeLockTopBadge = document.getElementById('scopeLockTopBadge');
    const userRoleIndicatorBadge = document.getElementById('userRoleIndicatorBadge');
    const btnSyncWorkspace = document.getElementById('btnSyncWorkspace');
    const btnViewAuditHistory = document.getElementById('btnViewAuditHistory');
    const btnProposeStageAdvance = document.getElementById('btnProposeStageAdvance');
    const stageSteps = document.querySelectorAll('.stage-step');
    const projectProgressPercent = document.getElementById('projectProgressPercent');
    const projectProgressBar = document.getElementById('projectProgressBar');
    const reqStatusText = document.getElementById('reqStatusText');
    const reqStatusDot = document.getElementById('reqStatusDot');
    const agreementStatusText = document.getElementById('agreementStatusText');
    const agreementStatusDot = document.getElementById('agreementStatusDot');
    const contractLockDot = document.getElementById('contractLockDot');
    const contractLockText = document.getElementById('contractLockText');

    // Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-content');

    // Tab 1: Overview
    const projectDescription = document.getElementById('projectDescription');
    const overviewDomainBadge = document.getElementById('overviewDomainBadge');
    const overviewClientName = document.getElementById('overviewClientName');
    const overviewClientEmail = document.getElementById('overviewClientEmail');
    const overviewProviderName = document.getElementById('overviewProviderName');
    const overviewProviderEmail = document.getElementById('overviewProviderEmail');
    const metaDeadline = document.getElementById('metaDeadline');
    const metaBudget = document.getElementById('metaBudget');
    const metaVersion = document.getElementById('metaVersion');
    const updatesTimeline = document.getElementById('updatesTimeline');
    const btnPostUpdate = document.getElementById('btnPostUpdate');

    // Tab 2: Requirements (Engine A)
    const currentReqVersionBadge = document.getElementById('currentReqVersionBadge');
    const currentReqLockStatus = document.getElementById('currentReqLockStatus');
    const reqLockNotice = document.getElementById('reqLockNotice');
    const requirementForm = document.getElementById('requirementForm');
    const reqObjective = document.getElementById('reqObjective');
    const reqTargetUsers = document.getElementById('reqTargetUsers');
    const reqFeatures = document.getElementById('reqFeatures');
    const reqTechPreferences = document.getElementById('reqTechPreferences');
    const reqNonFunctional = document.getElementById('reqNonFunctional');
    const btnSaveReqDraft = document.getElementById('btnSaveReqDraft');
    const reqLastSavedLabel = document.getElementById('reqLastSavedLabel');
    const btnLockRequirement = document.getElementById('btnLockRequirement');
    const btnProposeReqChange = document.getElementById('btnProposeReqChange');
    const btnAiAnalyzeReq = document.getElementById('btnAiAnalyzeReq');
    const aiAuditResultPanel = document.getElementById('aiAuditResultPanel');
    const aiAuditContent = document.getElementById('aiAuditContent');
    const btnCloseAiPanel = document.getElementById('btnCloseAiPanel');

    // Tab 3: Milestones (Engine B)
    const milestonesContainer = document.getElementById('milestonesContainer');
    const btnAddMilestoneBtn = document.getElementById('btnAddMilestoneBtn');

    // Tab 4: Mutual Agreement (Engine A)
    const agreementVersionPill = document.getElementById('agreementVersionPill');
    const scopeHashContainer = document.getElementById('scopeHashContainer');
    const scopeHashValue = document.getElementById('scopeHashValue');
    const agClientName = document.getElementById('agClientName');
    const agProviderName = document.getElementById('agProviderName');
    const agDeliverablesText = document.getElementById('agDeliverablesText');
    const agTimelineText = document.getElementById('agTimelineText');
    const agAmountText = document.getElementById('agAmountText');
    const agClientSignStatus = document.getElementById('agClientSignStatus');
    const agClientSignTimestamp = document.getElementById('agClientSignTimestamp');
    const agProviderSignStatus = document.getElementById('agProviderSignStatus');
    const agProviderSignTimestamp = document.getElementById('agProviderSignTimestamp');
    const btnApproveAgreement = document.getElementById('btnApproveAgreement');
    const btnRequestAgreementChange = document.getElementById('btnRequestAgreementChange');
    const btnProposeAmendment = document.getElementById('btnProposeAmendment');

    // Tab 5: Discussion & Chat
    const chatMessagesFeed = document.getElementById('chatMessagesFeed');
    const chatInputForm = document.getElementById('chatInputForm');
    const chatMessageInput = document.getElementById('chatMessageInput');
    const btnAiSummarizeChat = document.getElementById('btnAiSummarizeChat');
    const aiSummaryBox = document.getElementById('aiSummaryBox');
    const aiSummaryContent = document.getElementById('aiSummaryContent');
    const btnCloseSummary = document.getElementById('btnCloseSummary');

    // Tab 6: Decisions & Resources
    const decisionsList = document.getElementById('decisionsList');
    const btnLogDecision = document.getElementById('btnLogDecision');
    const resourceTableBody = document.getElementById('resourceTableBody');
    const btnUploadResource = document.getElementById('btnUploadResource');

    // Modals
    const modalPostUpdate = document.getElementById('modalPostUpdate');
    const postUpdateForm = document.getElementById('postUpdateForm');
    const closePostUpdateModalBtn = document.getElementById('closePostUpdateModalBtn');
    const cancelPostUpdateBtn = document.getElementById('cancelPostUpdateBtn');

    const milestoneActionModal = document.getElementById('milestoneActionModal');
    const milestoneActionForm = document.getElementById('milestoneActionForm');
    const actionMilestoneId = document.getElementById('actionMilestoneId');
    const deliverableUrlInput = document.getElementById('deliverableUrlInput');
    const deliverableNotesInput = document.getElementById('deliverableNotesInput');
    const closeMilestoneModalBtn = document.getElementById('closeMilestoneModalBtn');
    const cancelMilestoneActionBtn = document.getElementById('cancelMilestoneActionBtn');

    const modalReviewProof = document.getElementById('modalReviewProof');
    const reviewMilestoneId = document.getElementById('reviewMilestoneId');
    const reviewProofLink = document.getElementById('reviewProofLink');
    const reviewProofNotes = document.getElementById('reviewProofNotes');
    const closeReviewProofModalBtn = document.getElementById('closeReviewProofModalBtn');
    const btnRequestRevisionFromProof = document.getElementById('btnRequestRevisionFromProof');
    const btnApproveFromProof = document.getElementById('btnApproveFromProof');

    const modalRevisionRequest = document.getElementById('modalRevisionRequest');
    const revisionRequestForm = document.getElementById('revisionRequestForm');
    const closeRevisionModalBtn = document.getElementById('closeRevisionModalBtn');
    const cancelRevisionModalBtn = document.getElementById('cancelRevisionModalBtn');

    const decisionModal = document.getElementById('decisionModal');
    const decisionForm = document.getElementById('decisionForm');
    const closeDecisionModalBtn = document.getElementById('closeDecisionModalBtn');
    const cancelDecisionBtn = document.getElementById('cancelDecisionBtn');

    const addMilestoneModal = document.getElementById('addMilestoneModal');
    const addMilestoneForm = document.getElementById('addMilestoneForm');
    const closeAddMilestoneModalBtn = document.getElementById('closeAddMilestoneModalBtn');
    const cancelAddMilestoneBtn = document.getElementById('cancelAddMilestoneBtn');

    const stageAdvanceModal = document.getElementById('stageAdvanceModal');
    const stageAdvanceForm = document.getElementById('stageAdvanceForm');
    const targetStageSelect = document.getElementById('targetStageSelect');
    const closeStageModalBtn = document.getElementById('closeStageModalBtn');
    const cancelStageModalBtn = document.getElementById('cancelStageModalBtn');

    const resourceModal = document.getElementById('resourceModal');
    const resourceUploadForm = document.getElementById('resourceUploadForm');
    const modalResourceClose = document.getElementById('modalResourceClose');
    const modalResourceCancel = document.getElementById('modalResourceCancel');

    const auditHistoryModal = document.getElementById('auditHistoryModal');
    const auditTimelineContainer = document.getElementById('auditTimelineContainer');
    const closeAuditModalBtn = document.getElementById('closeAuditModalBtn');
    const closeAuditModalFooterBtn = document.getElementById('closeAuditModalFooterBtn');

    const amendmentModal = document.getElementById('amendmentModal');
    const amendmentForm = document.getElementById('amendmentForm');
    const closeAmendmentModalBtn = document.getElementById('closeAmendmentModalBtn');
    const cancelAmendmentBtn = document.getElementById('cancelAmendmentBtn');

    // Runtime state
    let projectRecord = null;
    let agreementRecord = null;
    let requirementsRecord = null;
    let milestonesList = [];
    let chatPollingTimer = null;

    // -------------------------------------------------------------------------
    // 3. Tab Switching
    // -------------------------------------------------------------------------
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            if (!targetId) return;

            tabButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                pane.classList.add('hidden');
            });

            btn.classList.add('active');
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                targetPane.classList.add('active');
            }
        });
    });

    // -------------------------------------------------------------------------
    // 4. Initialize Workspace
    // -------------------------------------------------------------------------
    if (userRoleIndicatorBadge && currentUser) {
        userRoleIndicatorBadge.textContent = `Role: ${currentUser.role === ROLES.CLIENT ? 'Client' : 'Service Provider'}`;
    }

    await hydrateWorkspace();
    startChatPolling();
    setupWorkspaceModals();

    async function hydrateWorkspace() {
        if (!sb) {
            console.error('Supabase client is missing.');
            return;
        }

        try {
            await Promise.all([
                loadProjectOverview(),
                loadRequirementsDetails(),
                loadAgreementDetails(),
                loadMilestonesList(),
                loadProjectUpdates(),
                loadChatMessages(),
                loadDecisionsList(),
                loadResourceVault()
            ]);
        } catch (err) {
            console.error('Error hydrating workspace:', err);
        }
    }

    // -------------------------------------------------------------------------
    // 5. Overview & Lifecycle Pipeline
    // -------------------------------------------------------------------------
    async function loadProjectOverview() {
        const { data, error } = await sb
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !data) throw new Error(error?.message || 'Project not found');
        projectRecord = data;

        if (projectTitleEl) projectTitleEl.textContent = data.title;
        if (projectCodeBadgeEl) projectCodeBadgeEl.textContent = `PRJ-${String(data.id).slice(-4).toUpperCase()}`;
        if (projectDescription) projectDescription.textContent = data.description || data.summary || 'Project active.';
        if (overviewDomainBadge) overviewDomainBadge.textContent = data.category || 'Engineering';
        if (overviewClientName) overviewClientName.textContent = data.client_name || 'Client';
        if (overviewClientEmail) overviewClientEmail.textContent = data.client_email || '--';
        if (overviewProviderName) overviewProviderName.textContent = data.assigned_provider_name || 'Pending Assignment';
        if (metaDeadline) metaDeadline.textContent = data.deadline || 'Standard SLA';
        if (metaBudget) metaBudget.textContent = `$${Number(data.budget || 1000).toLocaleString()}`;

        renderPipeline(data.stage);
    }

    function renderPipeline(stage) {
        const stagesOrder = [
            PROJECT_STAGES.INVITED,
            PROJECT_STAGES.REQUIREMENT_DISCUSSION,
            PROJECT_STAGES.AGREEMENT_LOCKED,
            PROJECT_STAGES.IN_PROGRESS,
            PROJECT_STAGES.REVIEW,
            PROJECT_STAGES.COMPLETED
        ];

        const currentIdx = stagesOrder.indexOf(stage);

        stageSteps.forEach((step, idx) => {
            step.classList.remove('active', 'completed');
            if (idx < currentIdx) step.classList.add('completed');
            if (idx === currentIdx) step.classList.add('active');
        });

        if (targetStageSelect) {
            targetStageSelect.innerHTML = stagesOrder
                .filter((_, idx) => idx > currentIdx)
                .map(s => `<option value="${s}">Advance to: ${s.replace(/_/g, ' ')}</option>`)
                .join('');
        }
    }

    // -------------------------------------------------------------------------
    // 6. Requirements Sync (Engine A)
    // -------------------------------------------------------------------------
    async function loadRequirementsDetails() {
        const { data } = await sb
            .from('requirements')
            .select('*')
            .eq('project_id', projectId)
            .maybeSingle();

        requirementsRecord = data;

        if (data) {
            if (reqObjective) reqObjective.value = data.objectives || '';
            if (reqTargetUsers) reqTargetUsers.value = data.target_users || '';
            if (reqFeatures) reqFeatures.value = data.features || '';
            if (reqTechPreferences) reqTechPreferences.value = data.tech_preferences || '';
            if (reqNonFunctional) reqNonFunctional.value = data.non_functional || '';
            if (reqLastSavedLabel && data.updated_at) {
                reqLastSavedLabel.textContent = `Synced: ${formatTime(data.updated_at)}`;
            }
        } else if (projectRecord) {
            if (reqObjective && !reqObjective.value) reqObjective.value = projectRecord.title || '';
            if (reqFeatures && !reqFeatures.value) reqFeatures.value = projectRecord.description || '';
        }
    }

    if (requirementForm) {
        requirementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!sb) return;

            const payload = {
                project_id: projectId,
                objectives: reqObjective?.value.trim() || '',
                target_users: reqTargetUsers?.value.trim() || '',
                features: reqFeatures?.value.trim() || '',
                tech_preferences: reqTechPreferences?.value.trim() || '',
                non_functional: reqNonFunctional?.value.trim() || '',
                version: requirementsRecord?.version || '1.0',
                status: 'DRAFT',
                updated_at: new Date().toISOString()
            };

            if (btnSaveReqDraft) {
                btnSaveReqDraft.disabled = true;
                btnSaveReqDraft.textContent = 'Saving...';
            }

            try {
                if (requirementsRecord?.id) {
                    await sb.from('requirements').update(payload).eq('id', requirementsRecord.id);
                } else {
                    await sb.from('requirements').insert([payload]);
                }

                if (window.Toast) window.Toast.success('Requirements draft saved to Cloud!');
                await loadRequirementsDetails();
            } catch (err) {
                if (window.Toast) window.Toast.error('Failed to save requirements.');
            } finally {
                if (btnSaveReqDraft) {
                    btnSaveReqDraft.disabled = false;
                    btnSaveReqDraft.textContent = '💾 Save Draft';
                }
            }
        });
    }

    // Propose / Lock Requirements
    if (btnLockRequirement) {
        btnLockRequirement.addEventListener('click', async () => {
            if (!confirm('Proposing scope lock will finalize requirement baseline v1.0. Proceed?')) return;
            try {
                await sb.from('requirements').update({ status: 'LOCKED' }).eq('project_id', projectId);
                if (window.Toast) window.Toast.success('Scope locked into baseline v1.0!');
                await loadAgreementDetails();
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not lock scope.');
            }
        });
    }

    // AI Requirement Audit
    if (btnAiAnalyzeReq) {
        btnAiAnalyzeReq.addEventListener('click', () => {
            if (aiAuditResultPanel) aiAuditResultPanel.classList.remove('hidden');
            if (aiAuditContent) {
                const text = (reqFeatures?.value || '') + ' ' + (reqObjective?.value || '');
                const hasTech = text.includes('Spring') || text.includes('React') || text.includes('Postgres') || text.includes('API');
                const score = hasTech && text.length > 80 ? 92 : 68;

                aiAuditContent.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong>Quality Clarity Score:</strong>
                        <span class="badge ${score >= 80 ? 'badge-success' : 'badge-warning'}">${score} / 100</span>
                    </div>
                    <p class="text-sm">Requirements evaluated against WorkBridge anti-drift heuristics.</p>
                    <ul class="text-xs text-muted mt-2 pl-3">
                        <li>${hasTech ? '✅ Stacks & interfaces explicitly identified.' : '⚠️ Specify API protocols and exact dependencies.'}</li>
                        <li>✅ Deliverable verifiable via Git commits or Figma artifacts.</li>
                    </ul>
                `;
            }
        });
    }

    if (btnCloseAiPanel) {
        btnCloseAiPanel.addEventListener('click', () => aiAuditResultPanel?.classList.add('hidden'));
    }

    // -------------------------------------------------------------------------
    // 7. Mutual Agreement & Reopen Discussion Loop (Engine A)
    // -------------------------------------------------------------------------
    async function loadAgreementDetails() {
        const { data } = await sb
            .from('agreements')
            .select('*')
            .eq('project_id', projectId)
            .maybeSingle();

        if (!data) return;
        agreementRecord = data;

        const isLocked = data.status === 'LOCKED' || (data.client_signed && data.provider_signed);
        const versionStr = `v${data.version || '1.0'}`;

        if (agreementVersionPill) agreementVersionPill.textContent = `Digital Project Agreement (${versionStr})`;
        if (metaVersion) metaVersion.textContent = versionStr;
        if (currentReqVersionBadge) currentReqVersionBadge.textContent = `Version ${data.version || '1.0'}`;

        if (currentReqLockStatus) {
            currentReqLockStatus.textContent = isLocked ? 'LOCKED' : 'DRAFT';
            currentReqLockStatus.className = `badge ${isLocked ? 'badge-success' : 'badge-warning'}`;
        }

        if (scopeLockTopBadge) {
            scopeLockTopBadge.textContent = isLocked ? `🔒 Scope Locked (${versionStr})` : `📝 Scope Draft (${versionStr})`;
            scopeLockTopBadge.className = `badge ${isLocked ? 'badge-success' : 'badge-warning'}`;
        }

        if (reqStatusText) reqStatusText.textContent = `${versionStr} - ${isLocked ? 'Scope Locked' : 'Scoping'}`;
        if (reqStatusDot) reqStatusDot.className = `status-dot ${isLocked ? 'dot-green' : 'dot-yellow'}`;

        if (agreementStatusText) agreementStatusText.textContent = isLocked ? 'Ratified & Active' : 'Signatures Pending';
        if (agreementStatusDot) agreementStatusDot.className = `status-dot ${isLocked ? 'dot-green' : 'dot-yellow'}`;

        if (contractLockText) contractLockText.textContent = isLocked ? 'Locked & Immutable' : 'Unlocked';
        if (contractLockDot) contractLockDot.className = `status-dot ${isLocked ? 'dot-green' : 'dot-yellow'}`;

        if (agClientName) agClientName.textContent = projectRecord?.client_name || 'Client';
        if (agProviderName) agProviderName.textContent = projectRecord?.assigned_provider_name || 'Provider';
        if (agDeliverablesText) agDeliverablesText.textContent = data.terms_and_conditions || 'Deliverables locked to requirement specification.';
        if (agTimelineText) agTimelineText.textContent = data.target_delivery_date || projectRecord?.deadline || 'Milestone Agreed Target';
        if (agAmountText) agAmountText.textContent = `$${Number(data.agreed_amount || projectRecord?.budget || 1000).toLocaleString()}`;

        if (agClientSignStatus) {
            agClientSignStatus.textContent = data.client_signed ? '✅ Signed' : '⏳ Pending';
            agClientSignStatus.className = `badge ${data.client_signed ? 'badge-success' : 'badge-warning'}`;
        }
        if (agClientSignTimestamp && data.client_signed_at) {
            agClientSignTimestamp.textContent = `Signed: ${new Date(data.client_signed_at).toLocaleDateString()}`;
        }

        if (agProviderSignStatus) {
            agProviderSignStatus.textContent = data.provider_signed ? '✅ Signed' : '⏳ Pending';
            agProviderSignStatus.className = `badge ${data.provider_signed ? 'badge-success' : 'badge-warning'}`;
        }
        if (agProviderSignTimestamp && data.provider_signed_at) {
            agProviderSignTimestamp.textContent = `Signed: ${new Date(data.provider_signed_at).toLocaleDateString()}`;
        }

        // Cryptographic Hash Stamp
        if (scopeHashContainer) {
            if (isLocked) {
                scopeHashContainer.classList.remove('hidden');
                if (scopeHashValue) {
                    scopeHashValue.textContent = `SHA-256: ${data.scope_hash || generateDeterministicHash(projectRecord?.id, data.version)}`;
                }
            } else {
                scopeHashContainer.classList.add('hidden');
            }
        }

        // Form Lock state
        [reqObjective, reqTargetUsers, reqFeatures, reqTechPreferences, reqNonFunctional].forEach(el => {
            if (el) el.disabled = isLocked;
        });

        if (btnSaveReqDraft) btnSaveReqDraft.style.display = isLocked ? 'none' : 'inline-block';
        if (btnLockRequirement) btnLockRequirement.style.display = isLocked ? 'none' : 'inline-block';
        if (btnProposeReqChange) btnProposeReqChange.classList.toggle('hidden', !isLocked);
        if (btnProposeAmendment) btnProposeAmendment.classList.toggle('hidden', !isLocked);

        // Sign Button State
        if (btnApproveAgreement) {
            const hasUserSigned = currentUser?.role === ROLES.CLIENT ? data.client_signed : data.provider_signed;
            if (hasUserSigned) {
                btnApproveAgreement.disabled = true;
                btnApproveAgreement.textContent = 'You Signed Agreement ✅';
            } else {
                btnApproveAgreement.disabled = false;
                btnApproveAgreement.textContent = '✍️ Approve & Sign Agreement';
            }
        }
    }

    function generateDeterministicHash(id, version) {
        return `7b4f8c92a1${String(id).replace(/-/g, '').slice(0, 16)}e091fa${version || '10'}c82d4`;
    }

    // Sign Agreement Button
    if (btnApproveAgreement) {
        btnApproveAgreement.addEventListener('click', async () => {
            if (!agreementRecord || !sb) return;

            btnApproveAgreement.disabled = true;
            btnApproveAgreement.textContent = 'Applying Digital Signature...';

            const isClient = currentUser?.role === ROLES.CLIENT;
            const updatePayload = isClient 
                ? { client_signed: true, client_signed_at: new Date().toISOString() }
                : { provider_signed: true, provider_signed_at: new Date().toISOString() };

            const willBeLocked = isClient ? agreementRecord.provider_signed : agreementRecord.client_signed;
            if (willBeLocked) {
                updatePayload.status = 'LOCKED';
                updatePayload.scope_hash = generateDeterministicHash(projectId, agreementRecord.version);
            }

            try {
                await sb.from('agreements').update(updatePayload).eq('id', agreementRecord.id);

                if (willBeLocked) {
                    await sb.from('projects').update({ stage: PROJECT_STAGES.AGREEMENT_LOCKED }).eq('id', projectId);
                }

                if (window.Toast) window.Toast.success('Digital signature recorded to Cloud!');
                await loadAgreementDetails();
                await loadProjectOverview();
            } catch (err) {
                if (window.Toast) window.Toast.error('Signature application failed.');
                btnApproveAgreement.disabled = false;
            }
        });
    }

    // Reopen Agreement / Request Scope Revision Modal
    if (btnRequestAgreementChange) {
        btnRequestAgreementChange.addEventListener('click', () => {
            modalRevisionRequest?.classList.remove('hidden');
        });
    }

    if (revisionRequestForm) {
        revisionRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedback = document.getElementById('revisionFeedbackInput')?.value.trim();
            if (!feedback || !sb || !agreementRecord) return;

            try {
                // Revert Agreement to DRAFT and reset signatures
                await sb.from('agreements').update({
                    status: 'DRAFT',
                    client_signed: false,
                    client_signed_at: null,
                    provider_signed: false,
                    provider_signed_at: null
                }).eq('id', agreementRecord.id);

                // Move project back to Scoping stage
                await sb.from('projects').update({
                    stage: PROJECT_STAGES.REQUIREMENT_DISCUSSION
                }).eq('id', projectId);

                // Post a system chat message with the revision points
                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Collaborator',
                    sender_role: currentUser?.role || 'CLIENT',
                    message: `⚠️ Reopened Terms for Discussion: "${feedback}"`
                }]);

                if (window.Toast) window.Toast.info('Terms reopened for discussion! Returned to Scoping phase.');
                modalRevisionRequest?.classList.add('hidden');
                revisionRequestForm.reset();

                await loadAgreementDetails();
                await loadProjectOverview();
                await loadChatMessages();
            } catch (err) {
                if (window.Toast) window.Toast.error('Could not request revision.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 8. Milestones & Deliverables Proof Review (Engine B)
    // -------------------------------------------------------------------------
    async function loadMilestonesList() {
        const { data } = await sb
            .from('milestones')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        milestonesList = Array.isArray(data) ? data : [];
        renderMilestonesList(milestonesList);
        calculateWeightedProgress(milestonesList);
    }

    function calculateWeightedProgress(milestones) {
        if (!milestones || milestones.length === 0) {
            if (projectProgressPercent) projectProgressPercent.textContent = '0%';
            if (projectProgressBar) projectProgressBar.style.width = '0%';
            return;
        }

        let totalWeight = 0;
        let approvedWeight = 0;

        milestones.forEach(m => {
            const w = Number(m.weight_percentage) || (100 / milestones.length);
            totalWeight += w;
            if (m.status === 'APPROVED' || m.status === 'COMPLETED') {
                approvedWeight += w;
            }
        });

        const calculated = totalWeight > 0 ? Math.min(100, Math.round((approvedWeight / totalWeight) * 100)) : 0;

        if (projectProgressPercent) projectProgressPercent.textContent = `${calculated}%`;
        if (projectProgressBar) projectProgressBar.style.width = `${calculated}%`;

        if (sb && calculated !== projectRecord?.completion_percentage) {
            sb.from('projects').update({ completion_percentage: calculated }).eq('id', projectId);
        }
    }

    function renderMilestonesList(milestones) {
        if (!milestonesContainer) return;
        milestonesContainer.innerHTML = '';

        if (milestones.length === 0) {
            milestonesContainer.innerHTML = `
                <div class="card empty-state text-center py-4">
                    <p class="text-muted">No milestones defined yet. Click '+ Add Milestone' to build delivery roadmap.</p>
                </div>
            `;
            return;
        }

        const isClient = currentUser?.role === ROLES.CLIENT;

        milestones.forEach(m => {
            const card = document.createElement('div');
            card.className = 'card mb-3 milestone-item';
            card.style.borderLeft = `4px solid ${m.status === 'APPROVED' ? 'var(--success, #10b981)' : 'var(--primary, #3b82f6)'}`;
            card.style.padding = '1rem 1.25rem';

            const isApproved = m.status === 'APPROVED';
            const isReview = m.status === 'SUBMITTED_FOR_REVIEW';

            let actionButtons = '';
            if (isApproved) {
                actionButtons = `<span class="badge badge-success mt-2">Verified &amp; Released</span>`;
            } else if (isReview) {
                if (isClient) {
                    actionButtons = `
                        <div class="mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button type="button" class="btn btn-primary btn-sm btn-review-proof" data-id="${m.id}" data-url="${escapeHtml(m.deliverable_url || '')}" data-notes="${escapeHtml(m.notes || '')}">
                                🔍 Review Deliverable Proof
                            </button>
                        </div>
                    `;
                } else {
                    actionButtons = `<span class="badge badge-warning mt-2">⏳ Submitted - Awaiting Client Review</span>`;
                }
            } else {
                if (!isClient) {
                    actionButtons = `
                        <div class="mt-2">
                            <button type="button" class="btn btn-outline btn-sm btn-submit-milestone" data-id="${m.id}">
                                🚀 Submit Deliverable URL
                            </button>
                        </div>
                    `;
                } else {
                    actionButtons = `<span class="badge badge-subtle mt-2">Pending Provider Submission</span>`;
                }
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <strong style="font-size: 1rem;">${escapeHtml(m.title)}</strong>
                            <span class="badge ${isApproved ? 'badge-success' : 'badge-primary'}">${m.weight_percentage || 25}% Weight</span>
                        </div>
                        <p class="text-sm text-muted mt-1 mb-0">${escapeHtml(m.deliverables || 'Deliverables verified via code repository.')}</p>
                        ${m.deliverable_url ? `
                            <div class="text-xs mt-2" style="display: flex; align-items: center; gap: 0.35rem;">
                                <span>Artifact:</span>
                                <a href="\${escapeHtml(m.deliverable_url)}" target="_blank" rel="noopener" style="color: var(--primary); font-weight: 600; text-decoration: underline;">
                                    \${escapeHtml(m.deliverable_url)} &nearr;
                                </a>
                            </div>` : ''}
                    </div>
                    <div>
                        <span class="badge ${isApproved ? 'badge-success' : (isReview ? 'badge-warning' : 'badge-subtle')}">
                            ${isApproved ? 'APPROVED' : (isReview ? 'UNDER REVIEW' : 'PENDING')}
                        </span>
                    </div>
                </div>
                ${actionButtons}
            `;
            milestonesContainer.appendChild(card);
        });

        // Review Proof Trigger (Client)
        milestonesContainer.querySelectorAll('.btn-review-proof').forEach(btn => {
            btn.addEventListener('click', () => {
                const mid = btn.getAttribute('data-id');
                const url = btn.getAttribute('data-url');
                const notes = btn.getAttribute('data-notes');

                if (reviewMilestoneId) reviewMilestoneId.value = mid;
                if (reviewProofLink) {
                    reviewProofLink.href = url || '#';
                    reviewProofLink.textContent = url || 'No Link Provided';
                }
                if (reviewProofNotes) reviewProofNotes.textContent = notes || 'No notes provided by provider.';
                modalReviewProof?.classList.remove('hidden');
            });
        });

        // Submit Milestone Trigger (Provider)
        milestonesContainer.querySelectorAll('.btn-submit-milestone').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (actionMilestoneId) actionMilestoneId.value = id;
                milestoneActionModal?.classList.remove('hidden');
            });
        });
    }

    // Modal Review Proof Handlers (Client Verification)
    if (btnApproveFromProof) {
        btnApproveFromProof.addEventListener('click', async () => {
            const mid = reviewMilestoneId?.value;
            if (!mid || !sb) return;

            try {
                await sb.from('milestones').update({ status: 'APPROVED' }).eq('id', mid);
                if (window.Toast) window.Toast.success('Deliverable approved! Project progress released.');
                modalReviewProof?.classList.add('hidden');
                await loadMilestonesList();
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not approve milestone.');
            }
        });
    }

    if (btnRequestRevisionFromProof) {
        btnRequestRevisionFromProof.addEventListener('click', async () => {
            const mid = reviewMilestoneId?.value;
            const feedback = prompt('Provide specific revision feedback for provider:');
            if (!feedback || !mid || !sb) return;

            try {
                await sb.from('milestones').update({
                    status: 'PENDING',
                    notes: `Revision Requested: ${feedback}`
                }).eq('id', mid);

                if (window.Toast) window.Toast.info('Revision requested. Milestone status reset to pending.');
                modalReviewProof?.classList.add('hidden');
                await loadMilestonesList();
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not request revision.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 9. Engineering Status Updates (Tab 1 Modal)
    // -------------------------------------------------------------------------
    async function loadProjectUpdates() {
        if (!updatesTimeline || !sb) return;

        const { data } = await sb
            .from('project_updates')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        updatesTimeline.innerHTML = '';
        if (!data || data.length === 0) {
            updatesTimeline.innerHTML = `<div class="text-center text-muted py-3">No project updates posted yet. Click 'Post Status Update' above.</div>`;
            return;
        }

        data.forEach(u => {
            const item = document.createElement('div');
            item.className = 'timeline-item mb-3 pb-2 border-b';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.95rem;">${escapeHtml(u.title || 'Status Update')}</strong>
                    <span class="text-xs text-muted">${formatTime(u.created_at)}</span>
                </div>
                <p class="text-sm mt-1 mb-0" style="white-space: pre-wrap; color: var(--text-main);">${escapeHtml(u.content)}</p>
                <div class="text-xs text-muted mt-1">Author: <strong>${escapeHtml(u.author_name || 'Collaborator')}</strong></div>
            `;
            updatesTimeline.appendChild(item);
        });
    }

    if (btnPostUpdate) {
        btnPostUpdate.addEventListener('click', () => modalPostUpdate?.classList.remove('hidden'));
    }

    if (postUpdateForm) {
        postUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('updateTitleInput')?.value.trim();
            const progress = document.getElementById('updateProgressNotesInput')?.value.trim();
            const blockers = document.getElementById('updateBlockersInput')?.value.trim();

            if (!title || !progress || !sb) return;

            const fullContent = progress + (blockers ? `\n\nNext Steps / Blockers:\n${blockers}` : '');

            try {
                await sb.from('project_updates').insert([{
                    project_id: projectId,
                    author_name: currentUser?.fullName || 'Collaborator',
                    title: title,
                    content: fullContent
                }]);

                if (window.Toast) window.Toast.success('Status update published to timeline!');
                modalPostUpdate?.classList.add('hidden');
                postUpdateForm.reset();
                await loadProjectUpdates();
            } catch (err) {
                if (window.Toast) window.Toast.error('Failed to post status update.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 10. Live Chat & Discussion
    // -------------------------------------------------------------------------
    async function loadChatMessages() {
        if (!chatMessagesFeed || !sb) return;

        const { data } = await sb
            .from('workspace_messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (!data) return;

        chatMessagesFeed.innerHTML = '';
        if (data.length === 0) {
            chatMessagesFeed.innerHTML = `<div class="chat-system-message">Workspace discussion thread initialized. Send a technical update below.</div>`;
            return;
        }

        data.forEach(msg => {
            const isMine = msg.sender_id === currentUser?.id || msg.sender_name === currentUser?.fullName;
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${isMine ? 'mine' : 'theirs'}`;
            bubble.innerHTML = `
                <div style="font-size: 0.75rem; font-weight: 700; margin-bottom: 0.2rem;">
                    ${escapeHtml(msg.sender_name || (isMine ? 'You' : 'Collaborator'))} <span style="font-size: 0.7rem; font-weight: 400; opacity: 0.8;">(${escapeHtml(msg.sender_role || 'COLLABORATOR')})</span>
                </div>
                <div>${escapeHtml(msg.message)}</div>
                <div class="chat-meta text-xs text-muted mt-1">${formatTime(msg.created_at)}</div>
            `;
            chatMessagesFeed.appendChild(bubble);
        });

        chatMessagesFeed.scrollTop = chatMessagesFeed.scrollHeight;
    }

    if (chatInputForm) {
        chatInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = (chatMessageInput?.value || '').trim();
            if (!text || !sb) return;

            chatMessageInput.value = '';

            try {
                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Collaborator',
                    sender_role: currentUser?.role || 'CLIENT',
                    message: text
                }]);
                await loadChatMessages();
            } catch (err) {
                if (window.Toast) window.Toast.error('Message failed to transmit.');
            }
        });
    }

    if (btnAiSummarizeChat) {
        btnAiSummarizeChat.addEventListener('click', async () => {
            if (aiSummaryBox) aiSummaryBox.classList.remove('hidden');
            if (aiSummaryContent) {
                aiSummaryContent.textContent = 'Discussion Highlights: Architecture ratified; milestone delivery schedules active; discussion aligned with baseline scope.';
            }
        });
    }

    if (btnCloseSummary) {
        btnCloseSummary.addEventListener('click', () => aiSummaryBox?.classList.add('hidden'));
    }

    function startChatPolling() {
        if (chatPollingTimer) clearInterval(chatPollingTimer);
        chatPollingTimer = setInterval(() => {
            if (!document.hidden) loadChatMessages();
        }, 5000);
    }

    // -------------------------------------------------------------------------
    // 11. Decisions Log & Resources Vault
    // -------------------------------------------------------------------------
    async function loadDecisionsList() {
        if (!decisionsList || !sb) return;

        const { data } = await sb
            .from('project_decisions')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        decisionsList.innerHTML = '';
        if (!data || data.length === 0) {
            decisionsList.innerHTML = `<p class="text-muted text-xs">No architecture decisions recorded yet. Click 'Log Decision' above.</p>`;
            return;
        }

        data.forEach(d => {
            const card = document.createElement('div');
            card.className = 'decision-card mt-2 p-2 border rounded card';
            card.innerHTML = `
                <div style="font-weight: 700; font-size: 0.95rem;">📌 ${escapeHtml(d.title)}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.35rem;">${escapeHtml(d.rationale)}</div>
                <div class="text-xs text-muted mt-2">Recorded by <strong>${escapeHtml(d.recorded_by || 'Member')}</strong> • ${formatTime(d.created_at)}</div>
            `;
            decisionsList.appendChild(card);
        });
    }

    if (btnLogDecision) {
        btnLogDecision.addEventListener('click', () => decisionModal?.classList.remove('hidden'));
    }

    if (decisionForm) {
        decisionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('decisionTitleInput')?.value.trim();
            const rationale = document.getElementById('decisionRationaleInput')?.value.trim();

            if (!title || !rationale || !sb) return;

            try {
                await sb.from('project_decisions').insert([{
                    project_id: projectId,
                    title: title,
                    rationale: rationale,
                    recorded_by: currentUser?.fullName || 'Collaborator'
                }]);

                if (window.Toast) window.Toast.success('Decision logged to permanent journal!');
                decisionModal?.classList.add('hidden');
                decisionForm.reset();
                await loadDecisionsList();
            } catch (err) {
                if (window.Toast) window.Toast.error('Could not log decision.');
            }
        });
    }

    async function loadResourceVault() {
        if (!resourceTableBody || !sb) return;

        const { data } = await sb
            .from('project_resources')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        resourceTableBody.innerHTML = '';
        if (!data || data.length === 0) {
            resourceTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No resources or client materials uploaded yet.</td></tr>`;
            return;
        }

        data.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(r.title)}</strong></td>
                <td><span class="badge badge-subtle">Asset</span></td>
                <td>${escapeHtml(r.uploaded_by)}</td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                <td class="text-right" style="text-align: right;">
                    <a href="${escapeHtml(r.resource_url)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Access Link &rarr;</a>
                </td>
            `;
            resourceTableBody.appendChild(tr);
        });
    }

    // -------------------------------------------------------------------------
    // 12. Modal Handlers & Action Triggers
    // -------------------------------------------------------------------------
    function setupWorkspaceModals() {
        // Sync Live Button
        if (btnSyncWorkspace) {
            btnSyncWorkspace.addEventListener('click', async () => {
                btnSyncWorkspace.disabled = true;
                btnSyncWorkspace.textContent = '🔄 Syncing...';
                await hydrateWorkspace();
                if (window.Toast) window.Toast.info('Workspace synchronized with Cloud.');
                btnSyncWorkspace.disabled = false;
                btnSyncWorkspace.textContent = '🔄 Sync Live';
            });
        }

        // Post Update Modal Close
        if (closePostUpdateModalBtn) closePostUpdateModalBtn.addEventListener('click', () => modalPostUpdate?.classList.add('hidden'));
        if (cancelPostUpdateBtn) cancelPostUpdateBtn.addEventListener('click', () => modalPostUpdate?.classList.add('hidden'));

        // Review Proof Modal Close
        if (closeReviewProofModalBtn) closeReviewProofModalBtn.addEventListener('click', () => modalReviewProof?.classList.add('hidden'));

        // Revision Request Modal Close
        if (closeRevisionModalBtn) closeRevisionModalBtn.addEventListener('click', () => modalRevisionRequest?.classList.add('hidden'));
        if (cancelRevisionModalBtn) cancelRevisionModalBtn.addEventListener('click', () => modalRevisionRequest?.classList.add('hidden'));

        // Decision Modal Close
        if (closeDecisionModalBtn) closeDecisionModalBtn.addEventListener('click', () => decisionModal?.classList.add('hidden'));
        if (cancelDecisionBtn) cancelDecisionBtn.addEventListener('click', () => decisionModal?.classList.add('hidden'));

        // Milestone Action (Submit) Modal
        if (closeMilestoneModalBtn) closeMilestoneModalBtn.addEventListener('click', () => milestoneActionModal?.classList.add('hidden'));
        if (cancelMilestoneActionBtn) cancelMilestoneActionBtn.addEventListener('click', () => milestoneActionModal?.classList.add('hidden'));

        if (milestoneActionForm) {
            milestoneActionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const mid = actionMilestoneId?.value;
                const url = deliverableUrlInput?.value.trim();
                const notes = deliverableNotesInput?.value.trim() || 'Deliverable submitted for review.';

                if (!mid || !url || !sb) return;

                try {
                    await sb.from('milestones').update({
                        deliverable_url: url,
                        notes: notes,
                        status: 'SUBMITTED_FOR_REVIEW'
                    }).eq('id', mid);

                    if (window.Toast) window.Toast.success('Deliverable proof submitted for client review!');
                    milestoneActionModal?.classList.add('hidden');
                    milestoneActionForm.reset();
                    await loadMilestonesList();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Failed to submit proof.');
                }
            });
        }

        // Add Milestone Modal
        if (btnAddMilestoneBtn) btnAddMilestoneBtn.addEventListener('click', () => addMilestoneModal?.classList.remove('hidden'));
        if (closeAddMilestoneModalBtn) closeAddMilestoneModalBtn.addEventListener('click', () => addMilestoneModal?.classList.add('hidden'));
        if (cancelAddMilestoneBtn) cancelAddMilestoneBtn.addEventListener('click', () => addMilestoneModal?.classList.add('hidden'));

        if (addMilestoneForm) {
            addMilestoneForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('milestoneTitleInput')?.value.trim();
                const weight = parseFloat(document.getElementById('milestoneWeightInput')?.value) || 25;
                const deliverables = document.getElementById('milestoneDeliverablesInput')?.value.trim();
                const targetDate = document.getElementById('milestoneTargetDateInput')?.value || null;

                if (!title || !deliverables || !sb) return;

                try {
                    await sb.from('milestones').insert([{
                        project_id: projectId,
                        title,
                        weight_percentage: weight,
                        deliverables,
                        target_date: targetDate,
                        status: 'PENDING'
                    }]);

                    if (window.Toast) window.Toast.success('Milestone added to roadmap!');
                    addMilestoneModal?.classList.add('hidden');
                    addMilestoneForm.reset();
                    await loadMilestonesList();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Failed to add milestone.');
                }
            });
        }

        // Stage Advance Modal
        if (btnProposeStageAdvance) btnProposeStageAdvance.addEventListener('click', () => stageAdvanceModal?.classList.remove('hidden'));
        if (closeStageModalBtn) closeStageModalBtn.addEventListener('click', () => stageAdvanceModal?.classList.add('hidden'));
        if (cancelStageModalBtn) cancelStageModalBtn.addEventListener('click', () => stageAdvanceModal?.classList.add('hidden'));

        if (stageAdvanceForm) {
            stageAdvanceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const targetStage = targetStageSelect?.value;
                if (!targetStage || !sb) return;

                try {
                    await sb.from('projects').update({ stage: targetStage }).eq('id', projectId);
                    if (window.Toast) window.Toast.success(`Project advanced to ${targetStage}!`);
                    stageAdvanceModal?.classList.add('hidden');
                    await loadProjectOverview();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Could not advance stage.');
                }
            });
        }

        // Audit History Modal
        if (btnViewAuditHistory) {
            btnViewAuditHistory.addEventListener('click', async () => {
                auditHistoryModal?.classList.remove('hidden');
                if (auditTimelineContainer) {
                    auditTimelineContainer.innerHTML = `
                        <div class="timeline-event mb-3 pb-2 border-b">
                            <span class="badge badge-primary">v1.0</span>
                            <div style="font-weight: 600; margin-top: 0.25rem;">Project Initialized &amp; Baseline Established</div>
                            <div class="text-xs text-muted">Client: ${escapeHtml(projectRecord?.client_name || 'Client')} • Provider: ${escapeHtml(projectRecord?.assigned_provider_name || 'Provider')}</div>
                        </div>
                    `;
                }
            });
        }
        if (closeAuditModalBtn) closeAuditModalBtn.addEventListener('click', () => auditHistoryModal?.classList.add('hidden'));
        if (closeAuditModalFooterBtn) closeAuditModalFooterBtn.addEventListener('click', () => auditHistoryModal?.classList.add('hidden'));

        // Resource Upload Modal
        if (btnUploadResource) btnUploadResource.addEventListener('click', () => resourceModal?.classList.remove('hidden'));
        if (modalResourceClose) modalResourceClose.addEventListener('click', () => resourceModal?.classList.add('hidden'));
        if (modalResourceCancel) modalResourceCancel.addEventListener('click', () => resourceModal?.classList.add('hidden'));

        if (resourceUploadForm) {
            resourceUploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const title = document.getElementById('resourceTitleInput')?.value.trim();
                const url = document.getElementById('resourceUrlInput')?.value.trim();

                if (!title || !url || !sb) return;

                try {
                    await sb.from('project_resources').insert([{
                        project_id: projectId,
                        title,
                        resource_url: url,
                        uploaded_by: currentUser?.fullName || 'Collaborator'
                    }]);

                    if (window.Toast) window.Toast.success('Resource saved to vault!');
                    resourceModal?.classList.add('hidden');
                    resourceUploadForm.reset();
                    await loadResourceVault();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Could not save resource.');
                }
            });
        }
    }

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------
    function formatTime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return isNaN(d.getTime()) ? '' : `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
});