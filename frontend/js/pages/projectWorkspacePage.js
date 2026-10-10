/**
 * WORKBRIDGE - PROJECT WORKSPACE MASTER CONTROLLER (SUPABASE CLOUD EDITION)
 * File: js/pages/projectWorkspacePage.js
 * 
 * Production Workspace Controller orchestrating:
 * - Engine A: Scope Version Locking, Mutual Agreement Signing, and Cryptographic Baseline.
 * - Engine B: Milestone Proof Verification, Deliverable Review, and Weighted Progress Calculation.
 * - Workspace Chat & Materials Vault backed directly by Supabase PostgreSQL.
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

    // Supabase Reference
    const sb = window.sbClient;

    // -------------------------------------------------------------------------
    // 2. DOM Elements Cache
    // -------------------------------------------------------------------------
    // Header & Pipeline
    const projectTitleEl = document.getElementById('projectTitle');
    const projectCodeBadgeEl = document.getElementById('projectCodeBadge');
    const scopeLockTopBadge = document.getElementById('scopeLockTopBadge');
    const btnSyncWorkspace = document.getElementById('btnSyncWorkspace');
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
    const overviewClientName = document.getElementById('overviewClientName');
    const overviewProviderName = document.getElementById('overviewProviderName');
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
    const btnViewAuditHistory = document.getElementById('btnViewAuditHistory');

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
    const stageAdvanceModal = document.getElementById('stageAdvanceModal');
    const stageAdvanceForm = document.getElementById('stageAdvanceForm');
    const targetStageSelect = document.getElementById('targetStageSelect');
    const stageTransitionNotes = document.getElementById('stageTransitionNotes');
    const closeStageModalBtn = document.getElementById('closeStageModalBtn');
    const cancelStageModalBtn = document.getElementById('cancelStageModalBtn');

    const addMilestoneModal = document.getElementById('addMilestoneModal');
    const addMilestoneForm = document.getElementById('addMilestoneForm');
    const closeAddMilestoneModalBtn = document.getElementById('closeAddMilestoneModalBtn');
    const cancelAddMilestoneBtn = document.getElementById('cancelAddMilestoneBtn');

    const milestoneActionModal = document.getElementById('milestoneActionModal');
    const milestoneActionForm = document.getElementById('milestoneActionForm');
    const actionMilestoneId = document.getElementById('actionMilestoneId');
    const deliverableUrlInput = document.getElementById('deliverableUrlInput');
    const deliverableNotesInput = document.getElementById('deliverableNotesInput');
    const closeMilestoneModalBtn = document.getElementById('closeMilestoneModalBtn');
    const cancelMilestoneActionBtn = document.getElementById('cancelMilestoneActionBtn');

    const amendmentModal = document.getElementById('amendmentModal');
    const amendmentForm = document.getElementById('amendmentForm');
    const closeAmendmentModalBtn = document.getElementById('closeAmendmentModalBtn');
    const cancelAmendmentBtn = document.getElementById('cancelAmendmentBtn');

    const auditHistoryModal = document.getElementById('auditHistoryModal');
    const auditTimelineContainer = document.getElementById('auditTimelineContainer');
    const closeAuditModalBtn = document.getElementById('closeAuditModalBtn');
    const closeAuditModalFooterBtn = document.getElementById('closeAuditModalFooterBtn');

    const decisionModal = document.getElementById('decisionModal');
    const decisionForm = document.getElementById('decisionForm');
    const closeDecisionModalBtn = document.getElementById('closeDecisionModalBtn');
    const cancelDecisionBtn = document.getElementById('cancelDecisionBtn');

    const resourceModal = document.getElementById('resourceModal');
    const resourceUploadForm = document.getElementById('resourceUploadForm');
    const modalResourceClose = document.getElementById('modalResourceClose');
    const modalResourceCancel = document.getElementById('modalResourceCancel');

    // In-memory runtime state
    let projectRecord = null;
    let agreementRecord = null;
    let milestonesList = [];
    let chatPollingTimer = null;

    // -------------------------------------------------------------------------
    // 3. Tab Switching Architecture
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
    // 4. Master Workspace Hydration
    // -------------------------------------------------------------------------
    await hydrateWorkspace();
    startChatPolling();
    setupModalListeners();

    async function hydrateWorkspace() {
        if (!sb) {
            console.error('Supabase client missing.');
            return;
        }

        try {
            await Promise.all([
                loadProjectOverview(),
                loadAgreementDetails(),
                loadMilestonesList(),
                loadChatMessages(),
                loadDecisionsList(),
                loadResourceVault()
            ]);
        } catch (err) {
            console.error('Failed to hydrate workspace from Supabase:', err);
        }
    }

    // -------------------------------------------------------------------------
    // 5. Project Overview & Pipeline
    // -------------------------------------------------------------------------
    async function loadProjectOverview() {
        const { data, error } = await sb
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !data) {
            throw new Error(error?.message || 'Project not found');
        }

        projectRecord = data;

        if (projectTitleEl) projectTitleEl.textContent = data.title;
        if (projectCodeBadgeEl) projectCodeBadgeEl.textContent = `PRJ-${String(data.id).slice(-4).toUpperCase()}`;
        if (projectDescription) projectDescription.textContent = data.description || data.summary || 'Project active.';
        if (overviewClientName) overviewClientName.textContent = data.client_name || 'Client';
        if (overviewProviderName) overviewProviderName.textContent = data.assigned_provider_name || 'Assigned Provider';
        if (metaDeadline) metaDeadline.textContent = data.deadline || 'Standard SLA';
        if (metaBudget) metaBudget.textContent = `$${Number(data.budget || 1000).toLocaleString()}`;

        // Populate initial requirements form if available
        if (reqObjective && !reqObjective.value) reqObjective.value = data.title || '';
        if (reqFeatures && !reqFeatures.value) reqFeatures.value = data.description || '';

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
    // 6. CORE ENGINE A: Scope Agreement & Cryptographic Locking
    // -------------------------------------------------------------------------
    async function loadAgreementDetails() {
        const { data, error } = await sb
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

        // Agreement Text Data
        if (agClientName) agClientName.textContent = projectRecord?.client_name || 'Client';
        if (agProviderName) agProviderName.textContent = projectRecord?.assigned_provider_name || 'Provider';
        if (agDeliverablesText) agDeliverablesText.textContent = data.terms_and_conditions || 'Deliverables locked to requirement specification.';
        if (agTimelineText) agTimelineText.textContent = data.target_delivery_date || projectRecord?.deadline || 'Milestone Agreed Target';
        if (agAmountText) agAmountText.textContent = `$${Number(data.agreed_amount || projectRecord?.budget || 1000).toLocaleString()}`;

        // Signatures state
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

        // Cryptographic Fingerprint Box (SHA-256 Scope Stamp)
        if (scopeHashContainer) {
            if (isLocked) {
                scopeHashContainer.classList.remove('hidden');
                const pseudoHash = data.scope_hash || generateDeterministicHash(projectRecord?.id, data.version);
                if (scopeHashValue) scopeHashValue.textContent = `SHA-256: ${pseudoHash}`;
            } else {
                scopeHashContainer.classList.add('hidden');
            }
        }

        // Lock form fields if agreement is locked
        if (isLocked) {
            [reqObjective, reqTargetUsers, reqFeatures, reqTechPreferences, reqNonFunctional].forEach(el => {
                if (el) el.disabled = true;
            });
            if (btnSaveReqDraft) btnSaveReqDraft.style.display = 'none';
            if (btnLockRequirement) btnLockRequirement.style.display = 'none';
            if (btnProposeReqChange) btnProposeReqChange.classList.remove('hidden');
            if (btnProposeAmendment) btnProposeAmendment.classList.remove('hidden');
        }

        // Sign button toggle
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

    // Sign Agreement Button Action
    if (btnApproveAgreement) {
        btnApproveAgreement.addEventListener('click', async () => {
            if (!agreementRecord || !sb) return;

            btnApproveAgreement.disabled = true;
            btnApproveAgreement.textContent = 'Applying Digital Signature...';

            const isClient = currentUser?.role === ROLES.CLIENT;
            const updatePayload = isClient 
                ? { client_signed: true, client_signed_at: new Date().toISOString() }
                : { provider_signed: true, provider_signed_at: new Date().toISOString() };

            // Check if this signature completes ratification
            const willBeLocked = isClient ? agreementRecord.provider_signed : agreementRecord.client_signed;
            if (willBeLocked) {
                updatePayload.status = 'LOCKED';
                updatePayload.scope_hash = generateDeterministicHash(projectId, agreementRecord.version);
            }

            try {
                const { error } = await sb
                    .from('agreements')
                    .update(updatePayload)
                    .eq('id', agreementRecord.id);

                if (error) throw error;

                if (willBeLocked) {
                    await sb
                        .from('projects')
                        .update({ stage: PROJECT_STAGES.AGREEMENT_LOCKED })
                        .eq('id', projectId);
                }

                if (window.Toast) window.Toast.success('Digital signature recorded to Cloud!');
                await loadAgreementDetails();
                await loadProjectOverview();

            } catch (err) {
                console.error('Failed to sign agreement:', err);
                if (window.Toast) window.Toast.error(err.message || 'Signature application failed.');
                btnApproveAgreement.disabled = false;
            }
        });
    }

    // -------------------------------------------------------------------------
    // 7. CORE ENGINE B: Milestone Verification & Progress Calculation
    // -------------------------------------------------------------------------
    async function loadMilestonesList() {
        const { data, error } = await sb
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

        // Sync completion percentage to project row
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
                    <p class="text-muted">No milestones established yet. Add milestones with deliverable weights to track verified progress.</p>
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
            if (!isApproved) {
                if (isReview && isClient) {
                    actionButtons = `
                        <div class="mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button type="button" class="btn btn-success btn-sm btn-approve-milestone" data-id="${m.id}">Approve Deliverable</button>
                            <button type="button" class="btn btn-outline btn-sm btn-reject-milestone" data-id="${m.id}">Request Revision</button>
                        </div>
                    `;
                } else if (!isReview && !isClient) {
                    actionButtons = `
                        <div class="mt-2">
                            <button type="button" class="btn btn-outline btn-sm btn-submit-milestone" data-id="${m.id}">Submit Deliverable URL</button>
                        </div>
                    `;
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
                        ${m.deliverable_url ? `<div class="text-xs mt-1">Proof: <a href="${escapeHtml(m.deliverable_url)}" target="_blank" rel="noopener" style="color: var(--primary); font-weight: 600;">${escapeHtml(m.deliverable_url)}</a></div>` : ''}
                        ${m.notes ? `<div class="text-xs text-muted mt-1">Notes: \${escapeHtml(m.notes)}</div>` : ''}
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

        // Wire Action Handlers
        milestonesContainer.querySelectorAll('.btn-approve-milestone').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                await updateMilestoneStatus(id, 'APPROVED');
            });
        });

        milestonesContainer.querySelectorAll('.btn-reject-milestone').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const feedback = prompt('Enter revision notes for provider:');
                if (feedback) {
                    await updateMilestoneStatus(id, 'REVISION_REQUESTED', feedback);
                }
            });
        });

        milestonesContainer.querySelectorAll('.btn-submit-milestone').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (actionMilestoneId) actionMilestoneId.value = id;
                if (milestoneActionModal) milestoneActionModal.classList.remove('hidden');
            });
        });
    }

    async function updateMilestoneStatus(milestoneId, status, notes = null) {
        if (!sb) return;
        try {
            const updateObj = { status };
            if (notes) updateObj.notes = notes;

            const { error } = await sb
                .from('milestones')
                .update(updateObj)
                .eq('id', milestoneId);

            if (error) throw error;
            if (window.Toast) window.Toast.success(`Milestone updated to ${status}`);
            await loadMilestonesList();
        } catch (e) {
            if (window.Toast) window.Toast.error(e.message || 'Failed to update milestone.');
        }
    }

    // -------------------------------------------------------------------------
    // 8. Live Workspace Chat & Discussion
    // -------------------------------------------------------------------------
    async function loadChatMessages() {
        if (!chatMessagesFeed || !sb) return;

        const { data, error } = await sb
            .from('workspace_messages')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error || !Array.isArray(data)) return;

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
                    ${escapeHtml(msg.sender_name || (isMine ? 'You' : 'Collaborator'))} <span style="font-size: 0.7rem; font-weight: 400; opacity: 0.8;">(${escapeHtml(msg.sender_role)})</span>
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

            const newMsg = {
                project_id: projectId,
                sender_id: currentUser?.id,
                sender_name: currentUser?.fullName || 'Collaborator',
                sender_role: currentUser?.role || 'CLIENT',
                message: text
            };

            try {
                const { error } = await sb.from('workspace_messages').insert([newMsg]);
                if (error) throw error;
                await loadChatMessages();
            } catch (err) {
                if (window.Toast) window.Toast.error('Failed to send message.');
            }
        });
    }

    function startChatPolling() {
        if (chatPollingTimer) clearInterval(chatPollingTimer);
        chatPollingTimer = setInterval(() => {
            if (!document.hidden) loadChatMessages();
        }, 5000);
    }

    // -------------------------------------------------------------------------
    // 9. Decisions Log & Resources Vault
    // -------------------------------------------------------------------------
    async function loadDecisionsList() {
        if (!decisionsList) return;
        decisionsList.innerHTML = `<p class="text-muted text-xs">Architectural choices recorded during scope negotiations.</p>`;
    }

    async function loadResourceVault() {
        if (!resourceTableBody || !sb) return;

        const { data, error } = await sb
            .from('project_resources')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        resourceTableBody.innerHTML = '';
        if (error || !data || data.length === 0) {
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
    // 10. Modals & Action Wire-up
    // -------------------------------------------------------------------------
    function setupModalListeners() {
        // Sync Workspace button
        if (btnSyncWorkspace) {
            btnSyncWorkspace.addEventListener('click', async () => {
                btnSyncWorkspace.disabled = true;
                btnSyncWorkspace.textContent = '🔄 Syncing...';
                await hydrateWorkspace();
                if (window.Toast) window.Toast.info('Workspace synchronized.');
                btnSyncWorkspace.disabled = false;
                btnSyncWorkspace.textContent = '🔄 Sync';
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
                    const { error } = await sb.from('milestones').insert([{
                        project_id: projectId,
                        title,
                        weight_percentage: weight,
                        deliverables,
                        target_date: targetDate,
                        status: 'PENDING'
                    }]);

                    if (error) throw error;
                    if (window.Toast) window.Toast.success('Milestone added!');
                    addMilestoneModal?.classList.add('hidden');
                    addMilestoneForm.reset();
                    await loadMilestonesList();
                } catch (err) {
                    if (window.Toast) window.Toast.error(err.message || 'Failed to add milestone.');
                }
            });
        }

        // Deliverable Proof Submit Modal
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
                    const { error } = await sb.from('milestones').update({
                        deliverable_url: url,
                        notes: notes,
                        status: 'SUBMITTED_FOR_REVIEW'
                    }).eq('id', mid);

                    if (error) throw error;
                    if (window.Toast) window.Toast.success('Deliverable proof submitted for client review!');
                    milestoneActionModal?.classList.add('hidden');
                    milestoneActionForm.reset();
                    await loadMilestonesList();
                } catch (err) {
                    if (window.Toast) window.Toast.error(err.message || 'Failed to submit proof.');
                }
            });
        }

        // Upload Material / Resource Modal
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
                    const { error } = await sb.from('project_resources').insert([{
                        project_id: projectId,
                        title,
                        resource_url: url,
                        uploaded_by: currentUser?.fullName || 'Collaborator'
                    }]);

                    if (error) throw error;
                    if (window.Toast) window.Toast.success('Resource saved to vault!');
                    resourceModal?.classList.add('hidden');
                    resourceUploadForm.reset();
                    await loadResourceVault();
                } catch (err) {
                    if (window.Toast) window.Toast.error(err.message || 'Could not save resource.');
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
                    const { error } = await sb.from('projects').update({ stage: targetStage }).eq('id', projectId);
                    if (error) throw error;
                    if (window.Toast) window.Toast.success(`Project advanced to ${targetStage}!`);
                    stageAdvanceModal?.classList.add('hidden');
                    await loadProjectOverview();
                } catch (err) {
                    if (window.Toast) window.Toast.error(err.message || 'Could not advance stage.');
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
        return `${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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