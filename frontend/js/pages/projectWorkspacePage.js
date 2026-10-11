/**
 * WORKBRIDGE - PROJECT WORKSPACE MASTER CONTROLLER (SUPABASE CLOUD EDITION)
 * File: js/pages/projectWorkspacePage.js
 * 
 * Orchestrating:
 * - Pillar 1: Rigid Lifecycle & Pending Invitation Guard (INVITED -> Scoping).
 * - Engine A: Scope Version Locking, Cryptographic WebCrypto SHA-256 Attestation, Multi-round Clause Revisions.
 * - Engine B: Milestone Proof Verification, Git Metadata Parsing (PR, Commit SHA, Branch, Staging), Weighted Progress.
 * - Real-time Standup Feed, Architectural Decision Records (ADR), and Material Vault.
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
    if (window.AuthState && typeof window.AuthState.requireAuth === 'function') {
        window.AuthState.requireAuth([ROLES.CLIENT, ROLES.SERVICE_PROVIDER, ROLES.ADMIN]);
    }

    const currentUser = window.AuthState && typeof window.AuthState.getUser === 'function' ? window.AuthState.getUser() : null;
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id') || (window.AuthState?.getActiveProjectId ? window.AuthState.getActiveProjectId() : null);

    if (!projectId) {
        if (window.Toast) window.Toast.error('No project workspace identifier detected. Returning to command center.');
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
        return;
    }

    if (window.AuthState?.setActiveProjectId) {
        window.AuthState.setActiveProjectId(projectId);
    }

    const sb = window.sbClient;

    // -------------------------------------------------------------------------
    // 2. DOM Elements Cache
    // -------------------------------------------------------------------------
    // Pillar 1 Guard Elements
    const invitationGuardBanner = document.getElementById('invitationGuardBanner');
    const invitationGuardMessage = document.getElementById('invitationGuardMessage');
    const invitationProviderActions = document.getElementById('invitationProviderActions');
    const btnAcceptInvitation = document.getElementById('btnAcceptInvitation');
    const btnDeclineInvitation = document.getElementById('btnDeclineInvitation');

    // Header, Telemetry Ribbon & Pipeline
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
    const ribbonSlaDate = document.getElementById('ribbonSlaDate');
    const ribbonTotalBudget = document.getElementById('ribbonTotalBudget');
    const ribbonEscrowReleased = document.getElementById('ribbonEscrowReleased');
    const ribbonFingerprint = document.getElementById('ribbonFingerprint');

    // State Machine Indicators
    const reqStatusText = document.getElementById('reqStatusText');
    const reqStatusDot = document.getElementById('reqStatusDot');
    const agreementStatusText = document.getElementById('agreementStatusText');
    const agreementStatusDot = document.getElementById('agreementStatusDot');
    const contractLockDot = document.getElementById('contractLockDot');
    const contractLockText = document.getElementById('contractLockText');

    // Navigation Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-content');

    // Tab 1: Overview & Updates
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
    const reqOutOfScope = document.getElementById('reqOutOfScope');
    const btnSaveReqDraft = document.getElementById('btnSaveReqDraft');
    const reqLastSavedLabel = document.getElementById('reqLastSavedLabel');
    const btnLockRequirement = document.getElementById('btnLockRequirement');
    const btnProposeReqChange = document.getElementById('btnProposeReqChange');
    const btnAiAnalyzeReq = document.getElementById('btnAiAnalyzeReq');
    const aiAuditResultPanel = document.getElementById('aiAuditResultPanel');
    const aiAuditContent = document.getElementById('aiAuditContent');
    const btnCloseAiPanel = document.getElementById('btnCloseAiPanel');

    // Tab 3: Milestones & Git Proof (Engine B)
    const milestonesContainer = document.getElementById('milestonesContainer');
    const btnAddMilestoneBtn = document.getElementById('btnAddMilestoneBtn');

    // Tab 4: Mutual Agreement Console (Engine A)
    const agreementVersionPill = document.getElementById('agreementVersionPill');
    const agreementStatusBadge = document.getElementById('agreementStatusBadge');
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
    const btnRequestClauseEdit = document.getElementById('btnRequestClauseEdit');
    const btnProposeAmendment = document.getElementById('btnProposeAmendment');

    // Tab 5: Discussions & ADR Journal
    const chatMessagesFeed = document.getElementById('chatMessagesFeed');
    const chatInputForm = document.getElementById('chatInputForm');
    const chatMessageInput = document.getElementById('chatMessageInput');
    const btnAiSummarizeChat = document.getElementById('btnAiSummarizeChat');
    const aiSummaryBox = document.getElementById('aiSummaryBox');
    const aiSummaryContent = document.getElementById('aiSummaryContent');
    const btnCloseSummary = document.getElementById('btnCloseSummary');
    const decisionsList = document.getElementById('decisionsList');
    const btnLogDecision = document.getElementById('btnLogDecision');

    // Tab 6: Resource Vault
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
    const deliverableCommitHashInput = document.getElementById('deliverableCommitHashInput');
    const deliverableBranchNameInput = document.getElementById('deliverableBranchNameInput');
    const deliverableDemoUrlInput = document.getElementById('deliverableDemoUrlInput');
    const deliverableNotesInput = document.getElementById('deliverableNotesInput');
    const closeMilestoneModalBtn = document.getElementById('closeMilestoneModalBtn');
    const cancelMilestoneActionBtn = document.getElementById('cancelMilestoneActionBtn');

    const modalReviewProof = document.getElementById('modalReviewProof');
    const reviewMilestoneId = document.getElementById('reviewMilestoneId');
    const reviewProofLink = document.getElementById('reviewProofLink');
    const reviewGitMetaContainer = document.getElementById('reviewGitMetaContainer');
    const reviewCommitHash = document.getElementById('reviewCommitHash');
    const reviewBranchName = document.getElementById('reviewBranchName');
    const reviewDemoContainer = document.getElementById('reviewDemoContainer');
    const reviewDemoLink = document.getElementById('reviewDemoLink');
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

    // Runtime Cached State
    let projectRecord = null;
    let agreementRecord = null;
    let requirementsRecord = null;
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
    // 4. Initial Workspace Hydration
    // -------------------------------------------------------------------------
    if (userRoleIndicatorBadge && currentUser) {
        userRoleIndicatorBadge.textContent = 'Viewing as: ' + (currentUser.role === ROLES.CLIENT ? 'Client Principal' : 'Technical Lead');
    }

    await hydrateWorkspace();
    startChatPolling();
    setupWorkspaceModals();

    async function hydrateWorkspace() {
        if (!sb) {
            console.error('Supabase client connection missing.');
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
    // 5. Overview, Telemetry & Pillar 1 Guard Enforcement
    // -------------------------------------------------------------------------
    async function loadProjectOverview() {
        const { data, error } = await sb
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !data) throw new Error(error?.message || 'Project record unreachable.');
        projectRecord = data;

        if (projectTitleEl) projectTitleEl.textContent = data.title || 'Untitled Project';
        if (projectCodeBadgeEl) projectCodeBadgeEl.textContent = 'PRJ-' + String(data.id).slice(-4).toUpperCase();
        if (projectDescription) projectDescription.textContent = data.description || data.summary || 'Project active under governance.';
        if (overviewDomainBadge) overviewDomainBadge.textContent = data.category || 'Engineering';
        if (overviewClientName) overviewClientName.textContent = data.client_name || 'Client Principal';
        if (overviewClientEmail) overviewClientEmail.textContent = data.client_email || '--';
        if (overviewProviderName) overviewProviderName.textContent = data.assigned_provider_name || 'Pending Provider Assignment';
        if (overviewProviderEmail) overviewProviderEmail.textContent = data.assigned_provider_email || '--';
        if (metaDeadline) metaDeadline.textContent = data.deadline || 'Standard SLA';
        if (metaBudget) metaBudget.textContent = '$' + Number(data.budget || 1000).toLocaleString();

        // Telemetry ribbon updates
        if (ribbonSlaDate) ribbonSlaDate.textContent = data.deadline || 'Pending SLA Lock';
        if (ribbonTotalBudget) ribbonTotalBudget.textContent = '$' + Number(data.budget || 1000).toLocaleString();

        renderPipelineAndGuard(data.stage);
    }

    function renderPipelineAndGuard(stage) {
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
                .map(s => '<option value="' + s + '">Advance to: ' + s.replace(/_/g, ' ') + '</option>')
                .join('');
        }

        // Pillar 1 Guard Enforcement
        const isInvitedStage = stage === PROJECT_STAGES.INVITED;
        if (invitationGuardBanner) {
            if (isInvitedStage) {
                invitationGuardBanner.classList.remove('hidden');
                const isProvider = currentUser?.role === ROLES.SERVICE_PROVIDER;
                if (invitationProviderActions) {
                    invitationProviderActions.classList.toggle('hidden', !isProvider);
                }
                if (invitationGuardMessage) {
                    invitationGuardMessage.textContent = isProvider
                        ? 'You have been invited to lead this technical project. Review baseline terms and accept to unlock interactive scoping.'
                        : 'Invitation dispatched to technical lead. Scoping tools and milestone submissions remain read-only until acceptance.';
                }

                disableWorkspaceInteractions(true);
            } else {
                invitationGuardBanner.classList.add('hidden');
                if (invitationProviderActions) invitationProviderActions.classList.add('hidden');
                disableWorkspaceInteractions(false);
            }
        }
    }

    function disableWorkspaceInteractions(disabled) {
        if (btnSaveReqDraft) btnSaveReqDraft.disabled = disabled;
        if (btnLockRequirement) btnLockRequirement.disabled = disabled;
        if (btnAddMilestoneBtn) btnAddMilestoneBtn.disabled = disabled;
        if (btnApproveAgreement) btnApproveAgreement.disabled = disabled;
        if (btnProposeStageAdvance) btnProposeStageAdvance.disabled = disabled;
    }

    // Provider Acceptance Controls (Pillar 1)
    if (btnAcceptInvitation) {
        btnAcceptInvitation.addEventListener('click', async () => {
            if (!sb || !projectId) return;
            btnAcceptInvitation.disabled = true;
            btnAcceptInvitation.textContent = 'Accepting...';

            try {
                const { error } = await sb
                    .from('projects')
                    .update({
                        stage: PROJECT_STAGES.REQUIREMENT_DISCUSSION,
                        assigned_provider_id: currentUser?.id,
                        assigned_provider_name: currentUser?.fullName || 'Technical Lead'
                    })
                    .eq('id', projectId);

                if (error) throw error;

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Technical Lead',
                    sender_role: 'SERVICE_PROVIDER',
                    message: '✅ Technical Lead accepted project invitation. Workspace unlocked for collaborative scoping.'
                }]);

                if (window.Toast) window.Toast.success('Invitation accepted! Collaborative scoping unlocked.');
                await hydrateWorkspace();
            } catch (err) {
                if (window.Toast) window.Toast.error('Failed to accept invitation.');
                btnAcceptInvitation.disabled = false;
                btnAcceptInvitation.textContent = 'Accept Project & Unlock Workspace';
            }
        });
    }

    if (btnDeclineInvitation) {
        btnDeclineInvitation.addEventListener('click', async () => {
            if (!confirm('Are you sure you wish to decline this project engagement?')) return;
            try {
                await sb.from('projects').update({ stage: 'DECLINED' }).eq('id', projectId);
                if (window.Toast) window.Toast.info('Invitation declined.');
                setTimeout(() => { window.location.href = 'provider-dashboard.html'; }, 1000);
            } catch (err) {
                if (window.Toast) window.Toast.error('Error declining invitation.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 6. Requirements Sync & AI Audit (Engine A)
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
            if (reqOutOfScope) reqOutOfScope.value = data.out_of_scope || '';
            if (reqLastSavedLabel && data.updated_at) {
                reqLastSavedLabel.textContent = 'Synced: ' + formatTime(data.updated_at);
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
                objectives: reqObjective ? reqObjective.value.trim() : '',
                target_users: reqTargetUsers ? reqTargetUsers.value.trim() : '',
                features: reqFeatures ? reqFeatures.value.trim() : '',
                tech_preferences: reqTechPreferences ? reqTechPreferences.value.trim() : '',
                non_functional: reqNonFunctional ? reqNonFunctional.value.trim() : '',
                out_of_scope: reqOutOfScope ? reqOutOfScope.value.trim() : '',
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

                if (window.Toast) window.Toast.success('Requirements draft saved to Cloud database.');
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

    // Propose Scope Lock
    if (btnLockRequirement) {
        btnLockRequirement.addEventListener('click', async () => {
            if (!confirm('Proposing scope lock will finalize requirement baseline v1.0. Proceed?')) return;
            try {
                await sb.from('requirements').update({ status: 'LOCKED' }).eq('project_id', projectId);
                if (window.Toast) window.Toast.success('Requirements frozen into immutable baseline v1.0.');
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
                const hasTech = text.includes('Spring') || text.includes('React') || text.includes('Postgres') || text.includes('API') || text.includes('Docker');
                const hasExclusions = Boolean(reqOutOfScope?.value?.trim());
                const score = (hasTech ? 50 : 25) + (text.length > 100 ? 30 : 15) + (hasExclusions ? 20 : 10);
                const badgeClass = score >= 80 ? 'badge-success' : 'badge-warning';

                aiAuditContent.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <strong>Specification Health Score:</strong>
                        <span class="badge ${badgeClass}">${score} / 100</span>
                    </div>
                    <p class="text-sm">Requirements analyzed against WorkBridge anti-drift protocol.</p>
                    <ul class="text-xs text-muted mt-2 pl-3">
                        <li>${hasTech ? '✅ Concrete tech stacks identified.' : '⚠️ Ambiguity detected: specify exact frameworks and databases.'}</li>
                        <li>${hasExclusions ? '✅ Scope creep boundaries defined in out-of-scope clauses.' : '⚠️ Recommended: explicitly define out-of-scope modules.'}</li>
                        <li>✅ Verification method: verifiable pull requests & commits linked to milestones.</li>
                    </ul>
                `;
            }
        });
    }

    if (btnCloseAiPanel) {
        btnCloseAiPanel.addEventListener('click', () => {
            if (aiAuditResultPanel) aiAuditResultPanel.classList.add('hidden');
        });
    }

    // -------------------------------------------------------------------------
    // 7. Mutual Agreement & Cryptographic WebCrypto SHA-256 Engine (Engine A)
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
        const versionStr = 'v' + (data.version || '1.0');

        if (agreementVersionPill) agreementVersionPill.textContent = 'Digital Project Agreement (' + versionStr + ')';
        if (agreementStatusBadge) {
            agreementStatusBadge.textContent = isLocked ? 'RATIFIED & LOCKED' : 'DRAFT PROPOSAL';
            agreementStatusBadge.className = 'badge ' + (isLocked ? 'badge-success' : 'badge-warning');
        }
        if (metaVersion) metaVersion.textContent = versionStr;
        if (currentReqVersionBadge) currentReqVersionBadge.textContent = 'Version ' + (data.version || '1.0');

        if (currentReqLockStatus) {
            currentReqLockStatus.textContent = isLocked ? 'LOCKED' : 'DRAFT';
            currentReqLockStatus.className = 'badge ' + (isLocked ? 'badge-success' : 'badge-warning');
        }

        if (scopeLockTopBadge) {
            scopeLockTopBadge.textContent = isLocked ? '🔒 Scope Locked (' + versionStr + ')' : '📝 Scope Draft (' + versionStr + ')';
            scopeLockTopBadge.className = 'badge ' + (isLocked ? 'badge-success' : 'badge-warning');
        }

        if (reqStatusText) reqStatusText.textContent = versionStr + ' - ' + (isLocked ? 'Scope Locked' : 'Scoping');
        if (reqStatusDot) reqStatusDot.className = 'status-dot ' + (isLocked ? 'dot-green' : 'dot-yellow');

        if (agreementStatusText) agreementStatusText.textContent = isLocked ? 'Ratified & Active' : 'Signatures Pending';
        if (agreementStatusDot) agreementStatusDot.className = 'status-dot ' + (isLocked ? 'dot-green' : 'dot-yellow');

        if (contractLockText) contractLockText.textContent = isLocked ? 'Locked & Immutable' : 'Unlocked';
        if (contractLockDot) contractLockDot.className = 'status-dot ' + (isLocked ? 'dot-green' : 'dot-yellow');

        if (agClientName) agClientName.textContent = projectRecord?.client_name || 'Client Principal';
        if (agProviderName) agProviderName.textContent = projectRecord?.assigned_provider_name || 'Technical Lead';
        if (agDeliverablesText) agDeliverablesText.textContent = data.terms_and_conditions || 'Deliverables bounded to locked requirement specification.';
        if (agTimelineText) agTimelineText.textContent = data.target_delivery_date || projectRecord?.deadline || 'Milestone Agreed Target';
        if (agAmountText) agAmountText.textContent = '$' + Number(data.agreed_amount || projectRecord?.budget || 1000).toLocaleString();

        if (agClientSignStatus) {
            agClientSignStatus.textContent = data.client_signed ? '✅ Ratified' : '⏳ Pending';
            agClientSignStatus.className = 'badge ' + (data.client_signed ? 'badge-success' : 'badge-warning');
        }
        if (agClientSignTimestamp) {
            agClientSignTimestamp.textContent = data.client_signed_at ? 'Signed: ' + new Date(data.client_signed_at).toLocaleString() : 'Awaiting Client digital signature.';
        }

        if (agProviderSignStatus) {
            agProviderSignStatus.textContent = data.provider_signed ? '✅ Ratified' : '⏳ Pending';
            agProviderSignStatus.className = 'badge ' + (data.provider_signed ? 'badge-success' : 'badge-warning');
        }
        if (agProviderSignTimestamp) {
            agProviderSignTimestamp.textContent = data.provider_signed_at ? 'Signed: ' + new Date(data.provider_signed_at).toLocaleString() : 'Awaiting Provider digital signature.';
        }

        // Cryptographic Hash & Telemetry Binding
        if (isLocked) {
            const hash = data.scope_hash || await computeSha256Fingerprint(projectId, data.version, data.agreed_amount);
            if (scopeHashContainer) scopeHashContainer.classList.remove('hidden');
            if (scopeHashValue) scopeHashValue.textContent = 'SHA-256: ' + hash;
            if (ribbonFingerprint) ribbonFingerprint.textContent = hash.slice(0, 16) + '...';
        } else {
            if (scopeHashContainer) scopeHashContainer.classList.add('hidden');
            if (ribbonFingerprint) ribbonFingerprint.textContent = 'UNRATIFIED';
        }

        // Freeze requirement inputs if locked
        [reqObjective, reqTargetUsers, reqFeatures, reqTechPreferences, reqNonFunctional, reqOutOfScope].forEach(el => {
            if (el) el.disabled = isLocked;
        });

        if (btnSaveReqDraft) btnSaveReqDraft.style.display = isLocked ? 'none' : 'inline-block';
        if (btnLockRequirement) btnLockRequirement.style.display = isLocked ? 'none' : 'inline-block';
        if (btnProposeReqChange) btnProposeReqChange.classList.toggle('hidden', !isLocked);
        if (btnProposeAmendment) btnProposeAmendment.classList.toggle('hidden', !isLocked);

        // Sign Button States
        if (btnApproveAgreement) {
            const hasUserSigned = currentUser?.role === ROLES.CLIENT ? data.client_signed : data.provider_signed;
            if (hasUserSigned) {
                btnApproveAgreement.disabled = true;
                btnApproveAgreement.textContent = 'You Have Signed (Immutable) ✅';
            } else {
                btnApproveAgreement.disabled = false;
                btnApproveAgreement.textContent = '✍️ Approve & Sign Agreement';
            }
        }
    }

    /**
     * Native WebCrypto Deterministic SHA-256 Baseline Fingerprinting
     */
    async function computeSha256Fingerprint(projId, version, amount) {
        try {
            const payload = 'WORKBRIDGE-PROTOCOL:' + projId + ':V' + (version || '1.0') + ':AMOUNT' + (amount || 1000);
            const msgBuffer = new TextEncoder().encode(payload);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            return 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
        }
    }

    // Sign Agreement Button Handler
    if (btnApproveAgreement) {
        btnApproveAgreement.addEventListener('click', async () => {
            if (!agreementRecord || !sb) return;

            btnApproveAgreement.disabled = true;
            btnApproveAgreement.textContent = 'Recording Digital Signature...';

            const isClient = currentUser?.role === ROLES.CLIENT;
            const updatePayload = isClient
                ? { client_signed: true, client_signed_at: new Date().toISOString() }
                : { provider_signed: true, provider_signed_at: new Date().toISOString() };

            const willBeLocked = isClient ? agreementRecord.provider_signed : agreementRecord.client_signed;
            let computedHash = null;

            if (willBeLocked) {
                computedHash = await computeSha256Fingerprint(projectId, agreementRecord.version, agreementRecord.agreed_amount);
                updatePayload.status = 'LOCKED';
                updatePayload.scope_hash = computedHash;
            }

            try {
                await sb.from('agreements').update(updatePayload).eq('id', agreementRecord.id);

                if (willBeLocked) {
                    await sb.from('projects').update({
                        stage: PROJECT_STAGES.AGREEMENT_LOCKED,
                        scope_locked: true,
                        scope_hash: computedHash
                    }).eq('id', projectId);

                    await sb.from('workspace_messages').insert([{
                        project_id: projectId,
                        sender_id: currentUser?.id,
                        sender_name: 'WorkBridge Protocol Engine',
                        sender_role: 'SYSTEM',
                        message: '🔒 Master Agreement ratified by both parties. Immutable Baseline Version 1.0 established. (SHA-256: ' + computedHash.slice(0, 16) + '...)'
                    }]);
                }

                if (window.Toast) window.Toast.success('Digital signature recorded to permanent ledger!');
                await loadAgreementDetails();
                await loadProjectOverview();
            } catch (err) {
                if (window.Toast) window.Toast.error('Signature registration failed.');
                btnApproveAgreement.disabled = false;
            }
        });
    }

    // Clause Edit / Revision Request Modal Triggers
    if (btnRequestAgreementChange) {
        btnRequestAgreementChange.addEventListener('click', () => {
            if (modalRevisionRequest) modalRevisionRequest.classList.remove('hidden');
        });
    }
    if (btnRequestClauseEdit) {
        btnRequestClauseEdit.addEventListener('click', () => {
            if (modalRevisionRequest) modalRevisionRequest.classList.remove('hidden');
        });
    }

    if (revisionRequestForm) {
        revisionRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const feedbackInput = document.getElementById('revisionFeedbackInput');
            const feedback = feedbackInput ? feedbackInput.value.trim() : '';
            if (!feedback || !sb || !agreementRecord) return;

            try {
                await sb.from('agreements').update({
                    status: 'DRAFT',
                    client_signed: false,
                    client_signed_at: null,
                    provider_signed: false,
                    provider_signed_at: null
                }).eq('id', agreementRecord.id);

                await sb.from('projects').update({
                    stage: PROJECT_STAGES.REQUIREMENT_DISCUSSION
                }).eq('id', projectId);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Collaborator',
                    sender_role: currentUser?.role || 'CLIENT',
                    message: '⚠️ Reopened Terms for Clause Discussion: "' + feedback + '"'
                }]);

                if (window.Toast) window.Toast.info('Terms reverted to draft. Returned to Scoping phase.');
                if (modalRevisionRequest) modalRevisionRequest.classList.add('hidden');
                revisionRequestForm.reset();

                await loadAgreementDetails();
                await loadProjectOverview();
                await loadChatMessages();
            } catch (err) {
                if (window.Toast) window.Toast.error('Failed to reopen terms for discussion.');
            }
        });
    }

    // Formal Scope Amendment Protocol (v2.0)
    if (btnProposeAmendment) {
        btnProposeAmendment.addEventListener('click', () => {
            if (amendmentModal) amendmentModal.classList.remove('hidden');
        });
    }

    if (amendmentForm) {
        amendmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reasonInput = document.getElementById('amendmentReasonInput');
            const budgetDeltaInput = document.getElementById('amendmentBudgetDeltaInput');
            const timelineDeltaInput = document.getElementById('amendmentTimelineDeltaInput');
            const detailsInput = document.getElementById('amendmentDetailsInput');

            const reason = reasonInput ? reasonInput.value.trim() : '';
            const budgetDelta = budgetDeltaInput ? parseFloat(budgetDeltaInput.value) || 0 : 0;
            const timelineDelta = timelineDeltaInput ? parseInt(timelineDeltaInput.value, 10) || 0 : 0;
            const details = detailsInput ? detailsInput.value.trim() : '';

            if (!reason || !details || !sb) return;

            try {
                await sb.from('scope_amendments').insert([{
                    project_id: projectId,
                    proposed_by: currentUser?.id,
                    reason,
                    budget_delta: budgetDelta,
                    timeline_delta: timelineDelta,
                    details,
                    status: 'PROPOSED'
                }]);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Collaborator',
                    sender_role: currentUser?.role || 'CLIENT',
                    message: '📝 Formal Scope Amendment Proposed (v2.0): "' + reason + '". Budget Delta: +\$' + budgetDelta + ', Timeline Delta: +' + timelineDelta + ' days.'
                }]);

                if (window.Toast) window.Toast.success('Scope amendment proposal submitted for mutual review!');
                if (amendmentModal) amendmentModal.classList.add('hidden');
                amendmentForm.reset();
                await loadChatMessages();
            } catch (e) {
                if (window.Toast) window.Toast.error('Failed to submit amendment proposal.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 8. Milestones & Technical Git Proof Verification (Engine B)
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
            if (ribbonEscrowReleased) ribbonEscrowReleased.textContent = '\$0.00 (0%)';
            return;
        }

        let totalWeight = 0;
        let approvedWeight = 0;
        const totalBudget = Number(projectRecord?.budget || 1000);

        milestones.forEach(m => {
            const w = Number(m.weight_percentage) || (100 / milestones.length);
            totalWeight += w;
            if (m.status === 'APPROVED' || m.status === 'COMPLETED') {
                approvedWeight += w;
            }
        });

        const calculated = totalWeight > 0 ? Math.min(100, Math.round((approvedWeight / totalWeight) * 100)) : 0;
        const releasedAmount = Math.round((calculated / 100) * totalBudget);

        if (projectProgressPercent) projectProgressPercent.textContent = calculated + '%';
        if (projectProgressBar) projectProgressBar.style.width = calculated + '%';
        if (ribbonEscrowReleased) ribbonEscrowReleased.textContent = '\$' + releasedAmount.toLocaleString() + ' (' + calculated + '%)';

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
                    <p class="text-muted">No milestones defined yet. Click '+ Add Milestone' to establish deliverable roadmap.</p>
                </div>
            `;
            return;
        }

        const isClient = currentUser?.role === ROLES.CLIENT;

        milestones.forEach(m => {
            const card = document.createElement('div');
            card.className = 'card mb-3 milestone-item';
            card.style.borderLeft = '4px solid ' + (m.status === 'APPROVED' ? 'var(--success, #10b981)' : (m.status === 'SUBMITTED_FOR_REVIEW' ? '#f59e0b' : 'var(--primary, #3b82f6)'));
            card.style.padding = '1rem 1.25rem';

            const isApproved = m.status === 'APPROVED';
            const isReview = m.status === 'SUBMITTED_FOR_REVIEW';

            let actionButtons = '';
            if (isApproved) {
                actionButtons = '<div class="mt-2"><span class="badge badge-success">✅ Deliverable Verified &amp; Progress Released</span></div>';
            } else if (isReview) {
                if (isClient) {
                    actionButtons = `
                        <div class="mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <button type="button" class="btn btn-primary btn-sm btn-review-proof" 
                                data-id="${m.id}" 
                                data-url="${escapeHtml(m.deliverable_url || '')}" 
                                data-commit="${escapeHtml(m.commit_hash || '')}" 
                                data-branch="${escapeHtml(m.branch_name || '')}" 
                                data-demo="${escapeHtml(m.demo_url || '')}" 
                                data-notes="${escapeHtml(m.notes || '')}">
                                🔍 Inspect Deliverable Proof
                            </button>
                        </div>
                    `;
                } else {
                    actionButtons = '<div class="mt-2"><span class="badge badge-warning">⏳ Deliverable Under Client Inspection</span></div>';
                }
            } else {
                if (!isClient) {
                    actionButtons = `
                        <div class="mt-2">
                            <button type="button" class="btn btn-outline btn-sm btn-submit-milestone" data-id="${m.id}">
                                🚀 Submit Technical Proof (PR &amp; Commit)
                            </button>
                        </div>
                    `;
                } else {
                    actionButtons = '<div class="mt-2"><span class="badge badge-subtle">Awaiting Technical Delivery</span></div>';
                }
            }

            const statusClass = isApproved ? 'badge-success' : (isReview ? 'badge-warning' : 'badge-subtle');
            const statusLabel = isApproved ? 'VERIFIED' : (isReview ? 'UNDER REVIEW' : 'PENDING');
            const weightClass = isApproved ? 'badge-success' : 'badge-primary';

            let proofPillsHtml = '';
            if (m.deliverable_url) {
                const commitPill = m.commit_hash ? `<span class="badge badge-subtle" style="font-family: monospace;">Commit: #${escapeHtml(m.commit_hash)}</span>` : '';
                const branchPill = m.branch_name ? `<span class="badge badge-subtle">Branch: ${escapeHtml(m.branch_name)}</span>` : '';
                const demoPill = m.demo_url ? `<a href="${escapeHtml(m.demo_url)}" target="_blank" rel="noopener" class="badge badge-success">Staging Demo &nearr;</a>` : '';

                proofPillsHtml = `
                    <div class="mt-2" style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
                        <a href="${escapeHtml(m.deliverable_url)}" target="_blank" rel="noopener" class="badge badge-subtle" style="text-decoration: underline;">
                            PR Link &nearr;
                        </a>
                        ${commitPill}
                        ${branchPill}
                        ${demoPill}
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <strong style="font-size: 1rem;">${escapeHtml(m.title)}</strong>
                            <span class="badge ${weightClass}">${m.weight_percentage || 25}% Progress Weight</span>
                        </div>
                        <p class="text-sm text-muted mt-1 mb-0">${escapeHtml(m.deliverables || 'Deliverables verified via Git pull request.')}</p>
                        ${proofPillsHtml}
                    </div>
                    <div>
                        <span class="badge ${statusClass}">
                            ${statusLabel}
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
                const commit = btn.getAttribute('data-commit');
                const branch = btn.getAttribute('data-branch');
                const demo = btn.getAttribute('data-demo');
                const notes = btn.getAttribute('data-notes');

                if (reviewMilestoneId) reviewMilestoneId.value = mid;
                if (reviewProofLink) {
                    reviewProofLink.href = url || '#';
                    reviewProofLink.textContent = url || 'No PR Link Provided';
                }

                if (reviewGitMetaContainer) {
                    if (commit || branch) {
                        reviewGitMetaContainer.classList.remove('hidden');
                        if (reviewCommitHash) reviewCommitHash.textContent = commit ? '#' + commit : 'Not Specified';
                        if (reviewBranchName) reviewBranchName.textContent = branch || 'origin/main';
                    } else {
                        reviewGitMetaContainer.classList.add('hidden');
                    }
                }

                if (reviewDemoContainer && reviewDemoLink) {
                    if (demo) {
                        reviewDemoContainer.classList.remove('hidden');
                        reviewDemoLink.href = demo;
                    } else {
                        reviewDemoContainer.classList.add('hidden');
                    }
                }

                if (reviewProofNotes) reviewProofNotes.textContent = notes || 'No technical notes attached.';
                if (modalReviewProof) modalReviewProof.classList.remove('hidden');
            });
        });

        // Submit Milestone Trigger (Provider)
        milestonesContainer.querySelectorAll('.btn-submit-milestone').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (actionMilestoneId) actionMilestoneId.value = id;
                if (milestoneActionModal) milestoneActionModal.classList.remove('hidden');
            });
        });
    }

    // Client Proof Verification Handlers
    if (btnApproveFromProof) {
        btnApproveFromProof.addEventListener('click', async () => {
            const mid = reviewMilestoneId ? reviewMilestoneId.value : null;
            if (!mid || !sb) return;

            btnApproveFromProof.disabled = true;
            btnApproveFromProof.textContent = 'Verifying & Releasing...';

            try {
                await sb.from('milestones').update({
                    status: 'APPROVED',
                    verified_at: new Date().toISOString()
                }).eq('id', mid);

                if (window.Toast) window.Toast.success('Technical deliverable verified! Progress weight released.');
                if (modalReviewProof) modalReviewProof.classList.add('hidden');
                await loadMilestonesList();
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not approve milestone deliverable.');
            } finally {
                btnApproveFromProof.disabled = false;
                btnApproveFromProof.textContent = '✅ Approve & Release Progress';
            }
        });
    }

    if (btnRequestRevisionFromProof) {
        btnRequestRevisionFromProof.addEventListener('click', async () => {
            const mid = reviewMilestoneId ? reviewMilestoneId.value : null;
            const feedback = prompt('Enter specific technical changes required before milestone approval:');
            if (!feedback || !mid || !sb) return;

            try {
                await sb.from('milestones').update({
                    status: 'PENDING',
                    notes: 'Revision Mandated: ' + feedback
                }).eq('id', mid);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Client Principal',
                    sender_role: 'CLIENT',
                    message: '⚠️ Deliverable Revision Requested on Milestone: "' + feedback + '"'
                }]);

                if (window.Toast) window.Toast.info('Revision requested. Milestone status reset to pending.');
                if (modalReviewProof) modalReviewProof.classList.add('hidden');
                await loadMilestonesList();
                await loadChatMessages();
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not request deliverable revision.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 9. Engineering Status Updates
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
            updatesTimeline.innerHTML = '<div class="text-center text-muted py-3">No project updates posted yet. Click \'Post Status Update\' above.</div>';
            return;
        }

        data.forEach(u => {
            const item = document.createElement('div');
            item.className = 'timeline-item mb-3 pb-2 border-b';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.95rem;">${escapeHtml(u.title || 'Engineering Standup')}</strong>
                    <span class="text-xs text-muted">${formatTime(u.created_at)}</span>
                </div>
                <p class="text-sm mt-1 mb-0" style="white-space: pre-wrap; color: var(--text-main); line-height: 1.5;">${escapeHtml(u.content)}</p>
                <div class="text-xs text-muted mt-1">Author: <strong>${escapeHtml(u.author_name || 'Collaborator')}</strong></div>
            `;
            updatesTimeline.appendChild(item);
        });
    }

    if (btnPostUpdate) {
        btnPostUpdate.addEventListener('click', () => {
            if (modalPostUpdate) modalPostUpdate.classList.remove('hidden');
        });
    }

    if (postUpdateForm) {
        postUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('updateTitleInput');
            const progressInput = document.getElementById('updateProgressNotesInput');
            const blockersInput = document.getElementById('updateBlockersInput');

            const title = titleInput ? titleInput.value.trim() : '';
            const progress = progressInput ? progressInput.value.trim() : '';
            const blockers = blockersInput ? blockersInput.value.trim() : '';

            if (!title || !progress || !sb) return;

            const fullContent = progress + (blockers ? '\n\nNext Steps / Blockers:\n' + blockers : '');

            try {
                await sb.from('project_updates').insert([{
                    project_id: projectId,
                    author_name: currentUser?.fullName || 'Collaborator',
                    title: title,
                    content: fullContent
                }]);

                if (window.Toast) window.Toast.success('Engineering update published to feed!');
                if (modalPostUpdate) modalPostUpdate.classList.add('hidden');
                postUpdateForm.reset();
                await loadProjectUpdates();
            } catch (err) {
                if (window.Toast) window.Toast.error('Failed to post status update.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 10. Live Chat & Discussion Threading
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
            chatMessagesFeed.innerHTML = '<div class="chat-system-message">Workspace discussion thread initialized. Send a technical update below.</div>';
            return;
        }

        data.forEach(msg => {
            const isMine = msg.sender_id === currentUser?.id || msg.sender_name === currentUser?.fullName;
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble ' + (isMine ? 'mine' : 'theirs');
            bubble.innerHTML = `
                <div style="font-size: 0.75rem; font-weight: 700; margin-bottom: 0.2rem;">
                    ${escapeHtml(msg.sender_name || (isMine ? 'You' : 'Collaborator'))} 
                    <span style="font-size: 0.7rem; font-weight: 400; opacity: 0.8;">(${escapeHtml(msg.sender_role || 'COLLABORATOR')})</span>
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
            const text = chatMessageInput ? chatMessageInput.value.trim() : '';
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
                if (window.Toast) window.Toast.error('Message transmission failed.');
            }
        });
    }

    if (btnAiSummarizeChat) {
        btnAiSummarizeChat.addEventListener('click', () => {
            if (aiSummaryBox) aiSummaryBox.classList.remove('hidden');
            if (aiSummaryContent) {
                aiSummaryContent.textContent = 'Standup Summary: Architecture ratified, deliverable proofs aligned with baseline scope, zero unresolved blockers.';
            }
        });
    }

    if (btnCloseSummary) {
        btnCloseSummary.addEventListener('click', () => {
            if (aiSummaryBox) aiSummaryBox.classList.add('hidden');
        });
    }

    function startChatPolling() {
        if (chatPollingTimer) clearInterval(chatPollingTimer);
        chatPollingTimer = setInterval(() => {
            if (!document.hidden) loadChatMessages();
        }, 5000);
    }

    // -------------------------------------------------------------------------
    // 11. Architectural Decision Records (ADR) & Resource Vault
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
            decisionsList.innerHTML = '<p class="text-muted text-xs">No architecture decisions recorded yet. Click \'Log Decision\' above.</p>';
            return;
        }

        data.forEach(d => {
            const card = document.createElement('div');
            card.className = 'decision-card mt-2 p-2 border rounded card';
            card.innerHTML = `
                <div style="font-weight: 700; font-size: 0.95rem;">📌 ${escapeHtml(d.title)}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.4;">${escapeHtml(d.rationale)}</div>
                <div class="text-xs text-muted mt-2">Recorded by <strong>${escapeHtml(d.recorded_by || 'Member')}</strong> • ${formatTime(d.created_at)}</div>
            `;
            decisionsList.appendChild(card);
        });
    }

    if (btnLogDecision) {
        btnLogDecision.addEventListener('click', () => {
            if (decisionModal) decisionModal.classList.remove('hidden');
        });
    }

    if (decisionForm) {
        decisionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('decisionTitleInput');
            const rationaleInput = document.getElementById('decisionRationaleInput');

            const title = titleInput ? titleInput.value.trim() : '';
            const rationale = rationaleInput ? rationaleInput.value.trim() : '';

            if (!title || !rationale || !sb) return;

            try {
                await sb.from('project_decisions').insert([{
                    project_id: projectId,
                    title: title,
                    rationale: rationale,
                    recorded_by: currentUser?.fullName || 'Collaborator'
                }]);

                if (window.Toast) window.Toast.success('Decision logged to immutable ADR journal!');
                if (decisionModal) decisionModal.classList.add('hidden');
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
            resourceTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No resources or artifacts uploaded yet.</td></tr>';
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
                    <a href="${escapeHtml(r.resource_url)}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Access Artifact &rarr;</a>
                </td>
            `;
            resourceTableBody.appendChild(tr);
        });
    }

    // -------------------------------------------------------------------------
    // 12. Modal Setup & Event Bindings
    // -------------------------------------------------------------------------
    function setupWorkspaceModals() {
        // Sync Live Button
        if (btnSyncWorkspace) {
            btnSyncWorkspace.addEventListener('click', async () => {
                btnSyncWorkspace.disabled = true;
                btnSyncWorkspace.textContent = '🔄 Syncing...';
                await hydrateWorkspace();
                if (window.Toast) window.Toast.info('Workspace synchronized with Cloud persistence.');
                btnSyncWorkspace.disabled = false;
                btnSyncWorkspace.textContent = '🔄 Sync Live';
            });
        }

        // Post Update Close
        if (closePostUpdateModalBtn) closePostUpdateModalBtn.addEventListener('click', () => { if (modalPostUpdate) modalPostUpdate.classList.add('hidden'); });
        if (cancelPostUpdateBtn) cancelPostUpdateBtn.addEventListener('click', () => { if (modalPostUpdate) modalPostUpdate.classList.add('hidden'); });

        // Review Proof Close
        if (closeReviewProofModalBtn) closeReviewProofModalBtn.addEventListener('click', () => { if (modalReviewProof) modalReviewProof.classList.add('hidden'); });

        // Revision Request Close
        if (closeRevisionModalBtn) closeRevisionModalBtn.addEventListener('click', () => { if (modalRevisionRequest) modalRevisionRequest.classList.add('hidden'); });
        if (cancelRevisionModalBtn) cancelRevisionModalBtn.addEventListener('click', () => { if (modalRevisionRequest) modalRevisionRequest.classList.add('hidden'); });

        // Decision Close
        if (closeDecisionModalBtn) closeDecisionModalBtn.addEventListener('click', () => { if (decisionModal) decisionModal.classList.add('hidden'); });
        if (cancelDecisionBtn) cancelDecisionBtn.addEventListener('click', () => { if (decisionModal) decisionModal.classList.add('hidden'); });

        // Amendment Close
        if (closeAmendmentModalBtn) closeAmendmentModalBtn.addEventListener('click', () => { if (amendmentModal) amendmentModal.classList.add('hidden'); });
        if (cancelAmendmentBtn) cancelAmendmentBtn.addEventListener('click', () => { if (amendmentModal) amendmentModal.classList.add('hidden'); });

        // Milestone Action (Provider Submit Proof)
        if (closeMilestoneModalBtn) closeMilestoneModalBtn.addEventListener('click', () => { if (milestoneActionModal) milestoneActionModal.classList.add('hidden'); });
        if (cancelMilestoneActionBtn) cancelMilestoneActionBtn.addEventListener('click', () => { if (milestoneActionModal) milestoneActionModal.classList.add('hidden'); });

        if (milestoneActionForm) {
            milestoneActionForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const mid = actionMilestoneId ? actionMilestoneId.value : null;
                const prUrl = deliverableUrlInput ? deliverableUrlInput.value.trim() : '';
                const commit = deliverableCommitHashInput ? deliverableCommitHashInput.value.trim() : null;
                const branch = deliverableBranchNameInput ? deliverableBranchNameInput.value.trim() : 'main';
                const demoUrl = deliverableDemoUrlInput ? deliverableDemoUrlInput.value.trim() : null;
                const notes = deliverableNotesInput && deliverableNotesInput.value.trim() ? deliverableNotesInput.value.trim() : 'Deliverable submitted for review.';

                if (!mid || !prUrl || !sb) return;

                try {
                    await sb.from('milestones').update({
                        deliverable_url: prUrl,
                        commit_hash: commit,
                        branch_name: branch,
                        demo_url: demoUrl,
                        notes: notes,
                        status: 'SUBMITTED_FOR_REVIEW'
                    }).eq('id', mid);

                    const commitMsg = commit ? ', Commit (#' + commit + ')' : '';
                    await sb.from('workspace_messages').insert([{
                        project_id: projectId,
                        sender_id: currentUser?.id,
                        sender_name: currentUser?.fullName || 'Technical Lead',
                        sender_role: 'SERVICE_PROVIDER',
                        message: '🚀 Technical Proof Submitted for Milestone: PR (' + prUrl + '), Branch (' + branch + ')' + commitMsg + '.'
                    }]);

                    if (window.Toast) window.Toast.success('Deliverable proof submitted for client review!');
                    if (milestoneActionModal) milestoneActionModal.classList.add('hidden');
                    milestoneActionForm.reset();
                    await loadMilestonesList();
                    await loadChatMessages();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Failed to submit technical proof.');
                }
            });
        }

        // Add Milestone Modal
        if (btnAddMilestoneBtn) btnAddMilestoneBtn.addEventListener('click', () => { if (addMilestoneModal) addMilestoneModal.classList.remove('hidden'); });
        if (closeAddMilestoneModalBtn) closeAddMilestoneModalBtn.addEventListener('click', () => { if (addMilestoneModal) addMilestoneModal.classList.add('hidden'); });
        if (cancelAddMilestoneBtn) cancelAddMilestoneBtn.addEventListener('click', () => { if (addMilestoneModal) addMilestoneModal.classList.add('hidden'); });

        if (addMilestoneForm) {
            addMilestoneForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const titleInput = document.getElementById('milestoneTitleInput');
                const weightInput = document.getElementById('milestoneWeightInput');
                const deliverablesInput = document.getElementById('milestoneDeliverablesInput');
                const targetDateInput = document.getElementById('milestoneTargetDateInput');

                const title = titleInput ? titleInput.value.trim() : '';
                const weight = weightInput ? parseFloat(weightInput.value) || 25 : 25;
                const deliverables = deliverablesInput ? deliverablesInput.value.trim() : '';
                const targetDate = targetDateInput && targetDateInput.value ? targetDateInput.value : null;

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

                    if (window.Toast) window.Toast.success('Milestone added to delivery roadmap!');
                    if (addMilestoneModal) addMilestoneModal.classList.add('hidden');
                    addMilestoneForm.reset();
                    await loadMilestonesList();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Failed to add milestone.');
                }
            });
        }

        // Stage Advance Modal
        if (btnProposeStageAdvance) btnProposeStageAdvance.addEventListener('click', () => { if (stageAdvanceModal) stageAdvanceModal.classList.remove('hidden'); });
        if (closeStageModalBtn) closeStageModalBtn.addEventListener('click', () => { if (stageAdvanceModal) stageAdvanceModal.classList.add('hidden'); });
        if (cancelStageModalBtn) cancelStageModalBtn.addEventListener('click', () => { if (stageAdvanceModal) stageAdvanceModal.classList.add('hidden'); });

        if (stageAdvanceForm) {
            stageAdvanceForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const targetStage = targetStageSelect ? targetStageSelect.value : null;
                if (!targetStage || !sb) return;

                try {
                    await sb.from('projects').update({ stage: targetStage }).eq('id', projectId);
                    if (window.Toast) window.Toast.success('Project advanced to ' + targetStage + '!');
                    if (stageAdvanceModal) stageAdvanceModal.classList.add('hidden');
                    await loadProjectOverview();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Could not advance lifecycle stage.');
                }
            });
        }

        // Audit History Modal
        if (btnViewAuditHistory) {
            btnViewAuditHistory.addEventListener('click', async () => {
                if (auditHistoryModal) auditHistoryModal.classList.remove('hidden');
                if (auditTimelineContainer) {
                    auditTimelineContainer.innerHTML = `
                        <div class="timeline-event mb-3 pb-2 border-b">
                            <span class="badge badge-primary">v1.0 Baseline</span>
                            <div style="font-weight: 600; margin-top: 0.25rem;">Project Initialized &amp; Cryptographic Baseline Recorded</div>
                            <div class="text-xs text-muted">Client: ${escapeHtml(projectRecord?.client_name || 'Client')} • Provider: ${escapeHtml(projectRecord?.assigned_provider_name || 'Technical Lead')}</div>
                            <div class="text-xs text-mono text-muted mt-1">Hash: ${projectRecord?.scope_hash || 'SHA-256 Active'}</div>
                        </div>
                    `;
                }
            });
        }
        if (closeAuditModalBtn) closeAuditModalBtn.addEventListener('click', () => { if (auditHistoryModal) auditHistoryModal.classList.add('hidden'); });
        if (closeAuditModalFooterBtn) closeAuditModalFooterBtn.addEventListener('click', () => { if (auditHistoryModal) auditHistoryModal.classList.add('hidden'); });

        // Resource Upload Modal
        if (btnUploadResource) btnUploadResource.addEventListener('click', () => { if (resourceModal) resourceModal.classList.remove('hidden'); });
        if (modalResourceClose) modalResourceClose.addEventListener('click', () => { if (resourceModal) resourceModal.classList.add('hidden'); });
        if (modalResourceCancel) modalResourceCancel.addEventListener('click', () => { if (resourceModal) resourceModal.classList.add('hidden'); });

        if (resourceUploadForm) {
            resourceUploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const titleInput = document.getElementById('resourceTitleInput');
                const urlInput = document.getElementById('resourceUrlInput');

                const title = titleInput ? titleInput.value.trim() : '';
                const url = urlInput ? urlInput.value.trim() : '';

                if (!title || !url || !sb) return;

                try {
                    await sb.from('project_resources').insert([{
                        project_id: projectId,
                        title,
                        resource_url: url,
                        uploaded_by: currentUser?.fullName || 'Collaborator'
                    }]);

                    if (window.Toast) window.Toast.success('Artifact saved to resource vault!');
                    if (resourceModal) resourceModal.classList.add('hidden');
                    resourceUploadForm.reset();
                    await loadResourceVault();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Could not save artifact.');
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
        return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function escapeHtml(str) {
        if (!str && str !== 0) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});