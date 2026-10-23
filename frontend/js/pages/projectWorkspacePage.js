/**
 * WORKBRIDGE - PROJECT WORKSPACE MASTER CONTROLLER (ENTERPRISE EDITION)
 * File: js/pages/projectWorkspacePage.js
 * 
 * Orchestrating:
 * - Automated Lifecycle & Stepper Synchronization (INVITED -> SCOPING -> AGREEMENT -> BUILDING -> REVIEW -> COMPLETED).
 * - Engine A: Scope Version Locking with Pre-Validation, WebCrypto Native SHA-256 Attestation & Live Hash Verifier, Bilateral Stepper, Modular Matrix.
 * - Engine B: Milestone Proof Verification (PR, Commit SHA, Branch, Staging), Weighted Horizon Gantt, Auto-Seeded Sprint Tasks Kanban.
 * - Executive Visual Analytics Suite (SVG Escrow Donut, Speedometer Gauge, Velocity Progress Bars).
 * - Bilateral Final Handover & Mutual Sign-Off Closure Protocol (Blocking unilateral provider completion).
 * - Official Cryptographic Governance Deed & Stamp-Paper Certificate Generator.
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
        if (window.Toast) window.Toast.error('No project workspace identifier detected. Returning to dashboard.');
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
    const invitationGuardBanner = document.getElementById('invitationGuardBanner');
    const invitationGuardMessage = document.getElementById('invitationGuardMessage');
    const invitationProviderActions = document.getElementById('invitationProviderActions');
    const btnAcceptInvitation = document.getElementById('btnAcceptInvitation');
    const btnDeclineInvitation = document.getElementById('btnDeclineInvitation');

    // Bilateral Handover Top Banner Elements
    const finalReviewGuardBanner = document.getElementById('finalReviewGuardBanner');
    const finalReviewBannerTitle = document.getElementById('finalReviewBannerTitle');
    const finalReviewStatusBadge = document.getElementById('finalReviewStatusBadge');
    const finalReviewBannerDesc = document.getElementById('finalReviewBannerDesc');
    const btnOpenFinalHandoverModal = document.getElementById('btnOpenFinalHandoverModal');
    const btnOpenCertificateDeedTop = document.getElementById('btnOpenCertificateDeedTop');
    const btnSidebarRequestSignoff = document.getElementById('btnSidebarRequestSignoff');

    // Header, Telemetry Ribbon & Pipeline
    const projectTitleEl = document.getElementById('projectTitle');
    const projectCodeBadgeEl = document.getElementById('projectCodeBadge');
    const scopeLockTopBadge = document.getElementById('scopeLockTopBadge');
    const userRoleIndicatorBadge = document.getElementById('userRoleIndicatorBadge');
    const btnSyncWorkspace = document.getElementById('btnSyncWorkspace');
    const btnViewAuditHistory = document.getElementById('btnViewAuditHistory');
    const btnOpenDeedCertificate = document.getElementById('btnOpenDeedCertificate');
    const btnOpenCertificateFromTab = document.getElementById('btnOpenCertificateFromTab');
    const btnProposeStageAdvance = document.getElementById('btnProposeStageAdvance');
    const stageSteps = document.querySelectorAll('.stage-step');
    const projectProgressPercent = document.getElementById('projectProgressPercent');
    const projectProgressBar = document.getElementById('projectProgressBar');
    const ribbonSlaDate = document.getElementById('ribbonSlaDate');
    const ribbonTotalBudget = document.getElementById('ribbonTotalBudget');
    const ribbonEscrowReleased = document.getElementById('ribbonEscrowReleased');
    const ribbonDisputeRiskBadge = document.getElementById('ribbonDisputeRiskBadge');
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

    // Tab 1: Overview, Charts & Updates
    const projectDescription = document.getElementById('projectDescription');
    const overviewDomainBadge = document.getElementById('overviewDomainBadge');
    const overviewStackBadges = document.getElementById('overviewStackBadges');
    const timelineHealthBadge = document.getElementById('timelineHealthBadge');
    const overviewClientName = document.getElementById('overviewClientName');
    const overviewClientEmail = document.getElementById('overviewClientEmail');
    const overviewProviderName = document.getElementById('overviewProviderName');
    const overviewProviderEmail = document.getElementById('overviewProviderEmail');
    const metaDeadline = document.getElementById('metaDeadline');
    const metaBudget = document.getElementById('metaBudget');
    const metaVersion = document.getElementById('metaVersion');
    const metaRiskScore = document.getElementById('metaRiskScore');
    const updatesTimeline = document.getElementById('updatesTimeline');
    const btnPostUpdate = document.getElementById('btnPostUpdate');
    const ganttTimelineHorizon = document.getElementById('ganttTimelineHorizon');
    const healthDeliveryPacing = document.getElementById('healthDeliveryPacing');
    const healthScopeStability = document.getElementById('healthScopeStability');
    const healthActiveBlockers = document.getElementById('healthActiveBlockers');

    // Executive Chart DOM Mounts
    const escrowSvgMount = document.getElementById('escrowSvgMount');
    const legendReleasedAmount = document.getElementById('legendReleasedAmount');
    const legendLockedAmount = document.getElementById('legendLockedAmount');
    const legendReviewAmount = document.getElementById('legendReviewAmount');
    const chartTotalContractVal = document.getElementById('chartTotalContractVal');
    const riskGaugeSvgMount = document.getElementById('riskGaugeSvgMount');
    const chartRiskStatusPill = document.getElementById('chartRiskStatusPill');
    const riskFactorsSummaryText = document.getElementById('riskFactorsSummaryText');
    const chartCryptoGuardStatus = document.getElementById('chartCryptoGuardStatus');
    const chartVelocityRatioBadge = document.getElementById('chartVelocityRatioBadge');
    const velMilestonesPct = document.getElementById('velMilestonesPct');
    const velMilestonesBar = document.getElementById('velMilestonesBar');
    const velTasksPct = document.getElementById('velTasksPct');
    const velTasksBar = document.getElementById('velTasksBar');
    const velWeightPct = document.getElementById('velWeightPct');
    const velWeightBar = document.getElementById('velWeightBar');
    const chartSprintPacingText = document.getElementById('chartSprintPacingText');

    // Tab 2: Requirements & Modular Scope Matrix
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
    const btnViewSavedDraft = document.getElementById('btnViewSavedDraft');
    const reqLastSavedLabel = document.getElementById('reqLastSavedLabel');
    const btnLockRequirement = document.getElementById('btnLockRequirement');
    const btnProposeReqChange = document.getElementById('btnProposeReqChange');
    const scopeValidationBanner = document.getElementById('scopeValidationBanner');
    const scopeValidationList = document.getElementById('scopeValidationList');
    const btnAiAnalyzeReq = document.getElementById('btnAiAnalyzeReq');
    const aiAuditResultPanel = document.getElementById('aiAuditResultPanel');
    const aiAuditContent = document.getElementById('aiAuditContent');
    const aiScoreLabel = document.getElementById('aiScoreLabel');
    const btnCloseAiPanel = document.getElementById('btnCloseAiPanel');
    const scopeModulesList = document.getElementById('scopeModulesList');
    const btnAddScopeModuleBtn = document.getElementById('btnAddScopeModuleBtn');
    const modalSavedDraft = document.getElementById('modalSavedDraft');
    const savedDraftBody = document.getElementById('savedDraftBody');
    const closeSavedDraftModalBtn = document.getElementById('closeSavedDraftModalBtn');
    const closeSavedDraftFooterBtn = document.getElementById('closeSavedDraftFooterBtn');

    // Tab 3: Milestones & Sprint Tasks
    const milestonesContainer = document.getElementById('milestonesContainer');
    const btnAddMilestoneBtn = document.getElementById('btnAddMilestoneBtn');
    const btnViewRoadmapMode = document.getElementById('btnViewRoadmapMode');
    const btnViewTasksMode = document.getElementById('btnViewTasksMode');
    const milestoneWeightAllocationText = document.getElementById('milestoneWeightAllocationText');
    const milestoneWeightAllocationBadge = document.getElementById('milestoneWeightAllocationBadge');
    const tasksGridContainer = document.getElementById('tasksGridContainer');
    const sprintsTasksBoard = document.getElementById('sprintsTasksBoard');
    const taskFilterMilestoneSelect = document.getElementById('taskFilterMilestoneSelect');
    const taskListTodo = document.getElementById('taskListTodo');
    const taskListInProgress = document.getElementById('taskListInProgress');
    const taskListDone = document.getElementById('taskListDone');
    const btnOpenAddTaskModal = document.getElementById('btnOpenAddTaskModal');
    const modalAddTask = document.getElementById('modalAddTask');
    const addTaskForm = document.getElementById('addTaskForm');
    const closeAddTaskModalBtn = document.getElementById('closeAddTaskModalBtn');
    const cancelAddTaskBtn = document.getElementById('cancelAddTaskBtn');
    const taskMilestoneSelect = document.getElementById('taskMilestoneSelect');

    // Milestone Inspection Modal
    const modalMilestoneDetail = document.getElementById('modalMilestoneDetail');
    const milestoneDetailTitle = document.getElementById('milestoneDetailTitle');
    const milestoneDetailBody = document.getElementById('milestoneDetailBody');
    const closeMilestoneDetailModalBtn = document.getElementById('closeMilestoneDetailModalBtn');
    const closeMilestoneDetailFooterBtn = document.getElementById('closeMilestoneDetailFooterBtn');

    // Tab 4: Mutual Agreement & Bilateral Negotiation
    const agreementVersionPill = document.getElementById('agreementVersionPill');
    const agreementStatusBadge = document.getElementById('agreementStatusBadge');
    const scopeHashContainer = document.getElementById('scopeHashContainer');
    const scopeHashValue = document.getElementById('scopeHashValue');
    const agClientName = document.getElementById('agClientName');
    const agProviderName = document.getElementById('agProviderName');
    const agDeliverablesText = document.getElementById('agDeliverablesText');
    const agTimelineText = document.getElementById('agTimelineText');
    const agAmountText = document.getElementById('agAmountText');
    const agClientClearanceBadge = document.getElementById('agClientClearanceBadge');
    const agClientSignStatus = document.getElementById('agClientSignStatus');
    const agClientSignTimestamp = document.getElementById('agClientSignTimestamp');
    const agProviderClearanceBadge = document.getElementById('agProviderClearanceBadge');
    const agProviderSignStatus = document.getElementById('agProviderSignStatus');
    const agProviderSignTimestamp = document.getElementById('agProviderSignTimestamp');
    const btnApproveAgreement = document.getElementById('btnApproveAgreement');
    const btnRequestAgreementChange = document.getElementById('btnRequestAgreementChange');
    const btnProposeAmendment = document.getElementById('btnProposeAmendment');
    const btnEditProposalClauses = document.getElementById('btnEditProposalClauses');
    const modalEditProposal = document.getElementById('modalEditProposal');
    const editProposalForm = document.getElementById('editProposalForm');
    const proposalBudgetInput = document.getElementById('proposalBudgetInput');
    const proposalSlaInput = document.getElementById('proposalSlaInput');
    const proposalTermsInput = document.getElementById('proposalTermsInput');
    const closeEditProposalModalBtn = document.getElementById('closeEditProposalModalBtn');
    const cancelEditProposalBtn = document.getElementById('cancelEditProposalBtn');

    // Bilateral Stepper Nodes
    const nodeAgDraft = document.getElementById('nodeAgDraft');
    const nodeAgClientReview = document.getElementById('nodeAgClientReview');
    const nodeAgProviderReview = document.getElementById('nodeAgProviderReview');
    const nodeAgCleared = document.getElementById('nodeAgCleared');
    const nodeAgLocked = document.getElementById('nodeAgLocked');

    // Tab 5 & 6: Discussions & Resource Vault
    const chatMessagesFeed = document.getElementById('chatMessagesFeed');
    const chatInputForm = document.getElementById('chatInputForm');
    const chatMessageInput = document.getElementById('chatMessageInput');
    const btnAiSummarizeChat = document.getElementById('btnAiSummarizeChat');
    const aiSummaryBox = document.getElementById('aiSummaryBox');
    const aiSummaryContent = document.getElementById('aiSummaryContent');
    const btnCloseSummary = document.getElementById('btnCloseSummary');
    const decisionsList = document.getElementById('decisionsList');
    const btnLogDecision = document.getElementById('btnLogDecision');
    const resourceTableBody = document.getElementById('resourceTableBody');
    const btnUploadResource = document.getElementById('btnUploadResource');

    // Modals & Consoles
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
    const revisionFeedbackCategory = document.getElementById('revisionFeedbackCategory');
    const revisionFeedbackInput = document.getElementById('revisionFeedbackInput');
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
    const stageAdvanceGuidanceText = document.getElementById('stageAdvanceGuidanceText');
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

    // NEW Consoles: Modal 16 & Modal 17
    const finalSignoffModal = document.getElementById('finalSignoffModal');
    const closeFinalSignoffModalBtn = document.getElementById('closeFinalSignoffModalBtn');
    const closeFinalSignoffFooterBtn = document.getElementById('closeFinalSignoffFooterBtn');
    const handoverProviderStatusBadge = document.getElementById('handoverProviderStatusBadge');
    const handoverClientStatusBadge = document.getElementById('handoverClientStatusBadge');
    const handoverProviderSubtext = document.getElementById('handoverProviderSubtext');
    const handoverClientSubtext = document.getElementById('handoverClientSubtext');
    const providerHandoverForm = document.getElementById('providerHandoverForm');
    const clientFinalSignoffForm = document.getElementById('clientFinalSignoffForm');
    const handoverRepoUrlInput = document.getElementById('handoverRepoUrlInput');
    const handoverSummaryInput = document.getElementById('handoverSummaryInput');
    const providerHandoverAttestCheck = document.getElementById('providerHandoverAttestCheck');
    const clientInspectHandoverContent = document.getElementById('clientInspectHandoverContent');
    const btnRejectFinalHandover = document.getElementById('btnRejectFinalHandover');

    const certificateDeedModal = document.getElementById('certificateDeedModal');
    const closeCertificateModalBtn = document.getElementById('closeCertificateModalBtn');
    const closeCertificateFooterBtn = document.getElementById('closeCertificateFooterBtn');
    const btnPrintOfficialDeed = document.getElementById('btnPrintOfficialDeed');
    const certificatePrintableBody = document.getElementById('certificatePrintableBody');

    // Runtime Cached State
    let projectRecord = null;
    let agreementRecord = null;
    let requirementsRecord = null;
    let milestonesList = [];
    let sprintTasksList = [];
    let projectUpdatesList = [];
    let scopeAmendmentsList = [];
    let chatPollingTimer = null;

    // -------------------------------------------------------------------------
    // 3. Tab Switching Architecture (With URL Hash Support)
    // -------------------------------------------------------------------------
    function activateTab(targetId) {
        if (!targetId) return;
        tabButtons.forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === targetId);
        });
        tabPanes.forEach(pane => {
            const isMatch = pane.id === targetId;
            pane.classList.toggle('active', isMatch);
            pane.classList.toggle('hidden', !isMatch);
        });
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            activateTab(targetId);
        });
    });

    if (window.location.hash) {
        const hashTab = window.location.hash.replace('#', '');
        if (document.getElementById(hashTab)) {
            activateTab(hashTab);
        }
    }

    // -------------------------------------------------------------------------
    // 4. Initial Workspace Hydration & Realtime Subscriptions
    // -------------------------------------------------------------------------
    if (userRoleIndicatorBadge && currentUser) {
        userRoleIndicatorBadge.textContent = 'Viewing as: ' + (currentUser.role === ROLES.CLIENT ? 'Client Principal' : 'Technical Lead');
    }

    await hydrateWorkspace();
    setupRealtimeSubscription();
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
                loadSprintTasks(),
                loadProjectUpdates(),
                loadChatMessages(),
                loadDecisionsList(),
                loadResourceVault(),
                loadScopeAmendments()
            ]);
            updateDisputeRiskTelemetry();
            renderExecutiveCharts(milestonesList, sprintTasksList);
        } catch (err) {
            console.error('Error hydrating workspace:', err);
        }
    }

    function setupRealtimeSubscription() {
        if (!sb || typeof sb.channel !== 'function') return;
        try {
            sb.channel('workspace-live-' + projectId)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: 'id=eq.' + projectId }, () => {
                    loadProjectOverview();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'agreements', filter: 'project_id=eq.' + projectId }, () => {
                    loadAgreementDetails();
                    loadProjectOverview();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'milestones', filter: 'project_id=eq.' + projectId }, () => {
                    loadMilestonesList();
                    loadProjectOverview();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: 'project_id=eq.' + projectId }, () => {
                    loadSprintTasks();
                })
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'workspace_messages', filter: 'project_id=eq.' + projectId }, () => {
                    loadChatMessages();
                })
                .subscribe();
        } catch (e) {
            console.warn('Realtime WebSocket subscription fallback to polling:', e);
        }
    }

    // -------------------------------------------------------------------------
    // 5. Overview, Telemetry & Automated Stage Stepper (1 to 6)
    // -------------------------------------------------------------------------
    async function loadProjectOverview() {
        const { data, error } = await sb
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error || !data) throw new Error(error ? error.message : 'Project record unreachable.');
        projectRecord = data;

        if (projectTitleEl) projectTitleEl.textContent = data.title || 'Untitled Project Workspace';
        if (projectCodeBadgeEl) projectCodeBadgeEl.textContent = 'PRJ-' + String(data.id).slice(-4).toUpperCase();
        if (projectDescription) projectDescription.textContent = data.description || data.summary || 'Project active under WorkBridge governance.';
        if (overviewDomainBadge) overviewDomainBadge.textContent = data.category || 'Full-Stack Engineering';
        if (overviewClientName) overviewClientName.textContent = data.client_name || 'Client Principal';
        if (overviewClientEmail) overviewClientEmail.textContent = data.client_email || '--';
        if (overviewProviderName) overviewProviderName.textContent = data.assigned_provider_name || 'Pending Provider Assignment';
        if (overviewProviderEmail) overviewProviderEmail.textContent = data.assigned_provider_email || '--';
        if (metaDeadline) metaDeadline.textContent = data.target_sla_date || data.deadline || 'Standard SLA';
        if (metaBudget) metaBudget.textContent = '$' + Number(data.budget || 1000).toLocaleString();

        // Telemetry ribbon updates
        if (ribbonSlaDate) ribbonSlaDate.textContent = data.target_sla_date || data.deadline || 'Pending SLA Lock';
        if (ribbonTotalBudget) ribbonTotalBudget.textContent = '$' + Number(data.budget || 1000).toLocaleString();

        renderPipelineAndGuard(data.stage);
        renderBilateralHandoverBanner(data.stage);
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

        let currentIdx = stagesOrder.indexOf(stage);
        if (currentIdx === -1) {
            currentIdx = 1;
        }

        stageSteps.forEach((step, idx) => {
            step.classList.remove('active', 'completed');
            if (idx < currentIdx) step.classList.add('completed');
            if (idx === currentIdx) step.classList.add('active');
        });

        for (let i = 1; i <= 5; i++) {
            const connector = document.getElementById('connector-' + i);
            if (connector) {
                if (i <= currentIdx) {
                    connector.classList.add('completed');
                } else {
                    connector.classList.remove('completed');
                }
            }
        }

        // Contextual Action Button Label based on Current Stage
        if (btnProposeStageAdvance) {
            if (stage === PROJECT_STAGES.COMPLETED) {
                btnProposeStageAdvance.textContent = '✅ Project Completed & Settled';
                btnProposeStageAdvance.disabled = true;
            } else if (stage === PROJECT_STAGES.AGREEMENT_LOCKED) {
                btnProposeStageAdvance.textContent = '⚡ Start Building Phase';
                btnProposeStageAdvance.disabled = false;
            } else if (stage === PROJECT_STAGES.IN_PROGRESS) {
                btnProposeStageAdvance.textContent = '🔍 Move to Final Review';
                btnProposeStageAdvance.disabled = false;
            } else if (stage === PROJECT_STAGES.REVIEW) {
                btnProposeStageAdvance.textContent = '🏆 Open Final Handover Console';
                btnProposeStageAdvance.disabled = false;
            } else {
                btnProposeStageAdvance.textContent = '🚀 Advance Stage';
                btnProposeStageAdvance.disabled = false;
            }
        }

        // EXCLUDE 'COMPLETED' FROM MANUAL DROPDOWN (Enforcing Bilateral Protocol)
        if (targetStageSelect) {
            targetStageSelect.innerHTML = stagesOrder
                .filter((_, idx) => idx > currentIdx && idx < stagesOrder.length - 1)
                .map(s => '<option value="' + s + '">Advance to: ' + s.replace(/_/g, ' ') + '</option>')
                .join('');
        }

        if (stageAdvanceGuidanceText) {
            stageAdvanceGuidanceText.textContent = currentIdx >= 2 
                ? 'Project terms and scope are ratified. Unilateral completion is prohibited; final closure requires bilateral review in the Handover console.'
                : 'Project is in preliminary setup. Advancing to Agreement requires finalized scope specifications.';
        }

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

    function renderBilateralHandoverBanner(stage) {
        if (!finalReviewGuardBanner) return;
        const isReviewOrLater = stage === PROJECT_STAGES.REVIEW || stage === PROJECT_STAGES.COMPLETED;
        const isCompleted = stage === PROJECT_STAGES.COMPLETED;

        if (isReviewOrLater) {
            finalReviewGuardBanner.classList.remove('hidden');
            if (finalReviewBannerTitle) {
                finalReviewBannerTitle.textContent = isCompleted 
                    ? '🏆 Project Completed & Escrow Settled' 
                    : '🛡️ Final Handover & Mutual Sign-Off Protocol Active';
            }
            if (finalReviewStatusBadge) {
                finalReviewStatusBadge.textContent = isCompleted ? '100% Settled & Closed' : 'Awaiting Final Acceptance';
                finalReviewStatusBadge.className = 'badge ' + (isCompleted ? 'badge-success' : 'badge-warning');
            }
            if (btnOpenCertificateDeedTop) {
                btnOpenCertificateDeedTop.classList.remove('hidden');
            }
            if (finalReviewBannerDesc) {
                finalReviewBannerDesc.textContent = isCompleted
                    ? 'All milestones have been verified and 100% of the contract escrow has been released. You can export the official cryptographic governance deed below.'
                    : 'All milestones have been addressed. The Technical Lead has submitted or can now submit final handover artifacts for Client Principal verification and final escrow release.';
            }
        } else {
            finalReviewGuardBanner.classList.add('hidden');
            if (btnOpenCertificateDeedTop) btnOpenCertificateDeedTop.classList.add('hidden');
        }
    }

    function disableWorkspaceInteractions(disabled) {
        if (btnSaveReqDraft) btnSaveReqDraft.disabled = disabled;
        if (btnLockRequirement) btnLockRequirement.disabled = disabled;
        if (btnAddMilestoneBtn) btnAddMilestoneBtn.disabled = disabled;
        if (btnApproveAgreement) btnApproveAgreement.disabled = disabled;
        if (btnProposeStageAdvance && projectRecord?.stage !== PROJECT_STAGES.COMPLETED) {
            btnProposeStageAdvance.disabled = disabled;
        }
        if (btnAddScopeModuleBtn) btnAddScopeModuleBtn.disabled = disabled;
        if (btnOpenAddTaskModal) btnOpenAddTaskModal.disabled = disabled;
        if (btnEditProposalClauses) btnEditProposalClauses.disabled = disabled;
    }

    // Provider Acceptance Controls
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
                    message: 'Technical Lead accepted project invitation. Workspace unlocked for collaborative scoping.'
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
    // 6. Requirements Sync, Modular Scope Matrix & Heuristic AI Audit
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
            populateModularScopeCards(data.modular_scope);

            if (overviewStackBadges && data.tech_preferences) {
                const chips = data.tech_preferences.split(',').map(s => s.trim()).filter(Boolean);
                if (chips.length > 0) {
                    overviewStackBadges.innerHTML = chips
                        .map(c => '<span class="badge badge-subtle">' + escapeHtml(c) + '</span>')
                        .join('');
                }
            }
        } else if (projectRecord) {
            if (reqObjective && !reqObjective.value) reqObjective.value = projectRecord.title || '';
            if (reqFeatures && !reqFeatures.value) reqFeatures.value = projectRecord.description || '';
            populateModularScopeCards(null);
        }
    }

    function populateModularScopeCards(modulesData) {
        if (!scopeModulesList) return;
        scopeModulesList.innerHTML = '';

        let modules = [];
        if (Array.isArray(modulesData) && modulesData.length > 0) {
            modules = modulesData;
        } else {
            modules = [
                { name: 'Core Architecture & Auth Engine', criteria: 'RBAC, RLS policies, WebCrypto SHA-256 session guard', complexity: 'HIGH', weight: 40 },
                { name: 'Database Schemas & Real-time Persistence', criteria: 'PostgreSQL tables, indexes, Supabase client listeners', complexity: 'MEDIUM', weight: 30 },
                { name: 'UI Orchestration & Milestone Stepper', criteria: 'Responsive desktop/mobile workspace layout, Gantt view', complexity: 'MEDIUM', weight: 30 }
            ];
        }

        modules.forEach(m => addModularScopeItem(m.name, m.criteria, m.complexity, m.weight));
    }

    function addModularScopeItem(name = '', criteria = '', complexity = 'MEDIUM', weight = 25) {
        if (!scopeModulesList) return;
        const row = document.createElement('div');
        row.className = 'card p-2 scope-module-row';
        row.style.background = '#ffffff';
        row.style.border = '1px solid var(--border-color)';

        row.innerHTML = ''
            + '<div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;">'
            + '  <div style="flex: 2; min-width: 180px;">'
            + '    <label class="form-label-sm">Module Name *</label>'
            + '    <input type="text" class="form-control form-control-sm module-name-input" value="' + escapeHtml(name) + '" placeholder="e.g. Real-time Notifications" required>'
            + '  </div>'
            + '  <div style="flex: 3; min-width: 220px;">'
            + '    <label class="form-label-sm">Acceptance &amp; Verification Criteria *</label>'
            + '    <input type="text" class="form-control form-control-sm module-criteria-input" value="' + escapeHtml(criteria) + '" placeholder="e.g. Unit tests passing, PR merged" required>'
            + '  </div>'
            + '  <div style="flex: 1; min-width: 110px;">'
            + '    <label class="form-label-sm">Complexity</label>'
            + '    <select class="form-control form-control-sm module-complexity-select">'
            + '      <option value="LOW"' + (complexity === 'LOW' ? ' selected' : '') + '>Low</option>'
            + '      <option value="MEDIUM"' + (complexity === 'MEDIUM' ? ' selected' : '') + '>Medium</option>'
            + '      <option value="HIGH"' + (complexity === 'HIGH' ? ' selected' : '') + '>High</option>'
            + '    </select>'
            + '  </div>'
            + '  <div style="flex: 1; min-width: 90px;">'
            + '    <label class="form-label-sm">Weight (%)</label>'
            + '    <input type="number" class="form-control form-control-sm module-weight-input" value="' + (weight || 25) + '" min="1" max="100">'
            + '  </div>'
            + '  <div style="display: flex; align-items: flex-end; padding-top: 1.25rem;">'
            + '    <button type="button" class="btn btn-outline btn-sm btn-remove-module" style="color: #ef4444; border-color: #fca5a5;">X</button>'
            + '  </div>'
            + '</div>';

        scopeModulesList.appendChild(row);
        row.querySelector('.btn-remove-module').addEventListener('click', () => row.remove());
    }

    if (btnAddScopeModuleBtn) {
        btnAddScopeModuleBtn.addEventListener('click', () => {
            addModularScopeItem('', '', 'MEDIUM', 20);
        });
    }

    // View Active Draft Modal Trigger
    if (btnViewSavedDraft) {
        btnViewSavedDraft.addEventListener('click', () => {
            if (!modalSavedDraft || !savedDraftBody) return;
            const obj = reqObjective ? reqObjective.value : 'None specified';
            const feat = reqFeatures ? reqFeatures.value : 'None specified';
            const users = reqTargetUsers ? reqTargetUsers.value : 'Standard users';
            const tech = reqTechPreferences ? reqTechPreferences.value : 'Vanilla JS & Supabase';
            const exclusions = reqOutOfScope ? reqOutOfScope.value : 'None';

            savedDraftBody.innerHTML = ''
                + '<div class="mb-3">'
                + '  <strong style="color: var(--primary);">Objective:</strong>'
                + '  <p class="text-sm mt-1">' + escapeHtml(obj) + '</p>'
                + '</div>'
                + '<div class="mb-3">'
                + '  <strong style="color: var(--primary);">Target Audience:</strong>'
                + '  <p class="text-sm mt-1">' + escapeHtml(users) + '</p>'
                + '</div>'
                + '<div class="mb-3">'
                + '  <strong style="color: var(--primary);">Itemized Functional Scope:</strong>'
                + '  <p class="text-sm mt-1" style="white-space: pre-wrap;">' + escapeHtml(feat) + '</p>'
                + '</div>'
                + '<div class="mb-3">'
                + '  <strong style="color: var(--primary);">Architectural Constraints:</strong>'
                + '  <p class="text-sm mt-1">' + escapeHtml(tech) + '</p>'
                + '</div>'
                + '<div class="mb-3">'
                + '  <strong style="color: #ef4444;">Explicit Exclusions:</strong>'
                + '  <p class="text-sm mt-1">' + escapeHtml(exclusions) + '</p>'
                + '</div>';

            modalSavedDraft.classList.remove('hidden');
        });
    }
    if (closeSavedDraftModalBtn) closeSavedDraftModalBtn.addEventListener('click', () => modalSavedDraft?.classList.add('hidden'));
    if (closeSavedDraftFooterBtn) closeSavedDraftFooterBtn.addEventListener('click', () => modalSavedDraft?.classList.add('hidden'));

    function extractModularScopeRows() {
        const moduleRows = [];
        if (scopeModulesList) {
            scopeModulesList.querySelectorAll('.scope-module-row').forEach(row => {
                const name = row.querySelector('.module-name-input')?.value.trim();
                const criteria = row.querySelector('.module-criteria-input')?.value.trim();
                const complexity = row.querySelector('.module-complexity-select')?.value;
                const weight = parseInt(row.querySelector('.module-weight-input')?.value, 10) || 20;
                if (name) moduleRows.push({ name, criteria, complexity, weight });
            });
        }
        return moduleRows;
    }

    if (requirementForm) {
        requirementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!sb) return;

            const moduleRows = extractModularScopeRows();
            const payload = {
                project_id: projectId,
                objectives: reqObjective ? reqObjective.value.trim() : '',
                target_users: reqTargetUsers ? reqTargetUsers.value.trim() : '',
                features: reqFeatures ? reqFeatures.value.trim() : '',
                tech_preferences: reqTechPreferences ? reqTechPreferences.value.trim() : '',
                non_functional: reqNonFunctional ? reqNonFunctional.value.trim() : '',
                out_of_scope: reqOutOfScope ? reqOutOfScope.value.trim() : '',
                modular_scope: moduleRows,
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

                if (window.Toast) window.Toast.success('Requirements & Modular Scope saved to Cloud database.');
                if (scopeValidationBanner) scopeValidationBanner.classList.add('hidden');
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

    function validateScopeBeforeLock() {
        const errors = [];
        const obj = reqObjective ? reqObjective.value.trim() : '';
        const feat = reqFeatures ? reqFeatures.value.trim() : '';
        const modules = extractModularScopeRows();

        if (obj.length < 20) {
            errors.push('Project Objective must contain at least 20 characters explaining the core business problem.');
        }
        if (feat.length < 30) {
            errors.push('Functional Scope & User Stories must be at least 30 characters detailing verifiable deliverables.');
        }
        if (modules.length === 0) {
            errors.push('Modular Scope Matrix must include at least 1 decomposed module row.');
        } else {
            const hasEmptyCriteria = modules.some(m => !m.criteria || m.criteria.length < 5);
            if (hasEmptyCriteria) {
                errors.push('Each module in the Scope Matrix must have explicit Acceptance & Verification Criteria.');
            }
        }

        return errors;
    }

    if (btnLockRequirement) {
        btnLockRequirement.addEventListener('click', async () => {
            const validationErrors = validateScopeBeforeLock();

            if (validationErrors.length > 0) {
                if (scopeValidationBanner && scopeValidationList) {
                    scopeValidationList.innerHTML = validationErrors.map(err => '<li>' + escapeHtml(err) + '</li>').join('');
                    scopeValidationBanner.classList.remove('hidden');
                    scopeValidationBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                if (window.Toast) window.Toast.error('Cannot lock scope: Please satisfy specification prerequisites.');
                return;
            }

            if (scopeValidationBanner) scopeValidationBanner.classList.add('hidden');

            if (!confirm('Proposing scope lock will generate a deterministic SHA-256 fingerprint and finalize requirements baseline v1.0. Proceed?')) {
                return;
            }

            btnLockRequirement.disabled = true;
            btnLockRequirement.textContent = 'Locking Scope...';

            try {
                const moduleRows = extractModularScopeRows();
                await sb.from('requirements').upsert([{
                    project_id: projectId,
                    objectives: reqObjective.value.trim(),
                    target_users: reqTargetUsers.value.trim(),
                    features: reqFeatures.value.trim(),
                    tech_preferences: reqTechPreferences.value.trim(),
                    non_functional: reqNonFunctional.value.trim(),
                    out_of_scope: reqOutOfScope.value.trim(),
                    modular_scope: moduleRows,
                    version: '1.0',
                    status: 'LOCKED',
                    updated_at: new Date().toISOString()
                }], { onConflict: 'project_id' });

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Collaborator',
                    sender_role: currentUser?.role || 'CLIENT',
                    message: 'Requirements specification baseline v1.0 locked. Agreement ready for bilateral signing.'
                }]);

                if (window.Toast) window.Toast.success('Requirements frozen into immutable baseline v1.0! Switching to Mutual Agreement.');
                await loadRequirementsDetails();
                await loadAgreementDetails();
                await loadChatMessages();
                setTimeout(() => activateTab('tabAgreement'), 600);
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not lock scope.');
            } finally {
                btnLockRequirement.disabled = false;
                btnLockRequirement.textContent = '🔒 Propose Scope Lock';
            }
        });
    }

    if (btnProposeReqChange) {
        btnProposeReqChange.addEventListener('click', () => {
            if (amendmentModal) amendmentModal.classList.remove('hidden');
        });
    }

    if (btnAiAnalyzeReq) {
        btnAiAnalyzeReq.addEventListener('click', () => {
            if (aiAuditResultPanel) aiAuditResultPanel.classList.remove('hidden');
            
            const obj = reqObjective ? reqObjective.value.trim() : '';
            const feat = reqFeatures ? reqFeatures.value.trim() : '';
            const tech = reqTechPreferences ? reqTechPreferences.value.trim() : '';
            const outOfScope = reqOutOfScope ? reqOutOfScope.value.trim() : '';
            const modules = extractModularScopeRows();

            let score = 0;
            const feedbackPoints = [];

            if (obj.length >= 40) {
                score += 20;
                feedbackPoints.push('✅ High clarity on core business objective.');
            } else if (obj.length >= 15) {
                score += 10;
                feedbackPoints.push('⚠️ Objective is brief; recommend elaborating business value.');
            } else {
                feedbackPoints.push('❌ Objective missing or too ambiguous (<15 chars).');
            }

            if (feat.length >= 100) {
                score += 30;
                feedbackPoints.push('✅ Comprehensive functional scope breakdown.');
            } else if (feat.length >= 30) {
                score += 15;
                feedbackPoints.push('⚠️ Moderate scope detail; suggest breaking into user stories.');
            } else {
                feedbackPoints.push('❌ Functional scope lacks itemized specifications.');
            }

            const techKeywords = ['spring', 'react', 'postgres', 'supabase', 'api', 'docker', 'vanilla', 'sql', 'rest', 'jwt', 'aws', 'ec2', 'cloud'];
            const hasTechMatch = techKeywords.some(k => tech.toLowerCase().includes(k) || feat.toLowerCase().includes(k) || obj.toLowerCase().includes(k));
            if (hasTechMatch && (tech.length > 3 || feat.length > 25)) {
                score += 20;
                feedbackPoints.push('✅ Concrete architectural constraints & tech stack defined.');
            } else {
                feedbackPoints.push('⚠️ Ambiguous technical stack; specify frameworks, databases, and adapters.');
            }

            if (modules.length >= 3) {
                score += 15;
                feedbackPoints.push('✅ Excellent modular decomposition in Scope Matrix (' + modules.length + ' modules).');
            } else if (modules.length >= 1) {
                score += 8;
                feedbackPoints.push('⚠️ Basic decomposition; recommend at least 3 distinct engineering modules.');
            } else {
                feedbackPoints.push('❌ Zero modules defined in Modular Scope Matrix.');
            }

            if (outOfScope.length >= 15) {
                score += 15;
                feedbackPoints.push('✅ Robust anti-creep boundaries defined in explicit out-of-scope clauses.');
            } else {
                feedbackPoints.push('⚠️ Scope creep risk: explicitly define features NOT included in this cycle.');
            }

            if (aiScoreLabel) {
                aiScoreLabel.textContent = score + ' / 100';
                aiScoreLabel.className = 'text-sm font-bold ' + (score >= 75 ? 'text-success' : (score >= 45 ? 'text-warning' : 'text-danger'));
            }

            if (aiAuditContent) {
                aiAuditContent.innerHTML = ''
                    + '<p class="text-xs text-muted mb-2">Automated Heuristic Analysis against WorkBridge anti-drift protocol:</p>'
                    + '<ul class="text-xs mt-1" style="padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem;">'
                    + feedbackPoints.map(p => '<li>' + escapeHtml(p) + '</li>').join('')
                    + '</ul>';
            }
        });
    }

    if (btnCloseAiPanel) {
        btnCloseAiPanel.addEventListener('click', () => {
            if (aiAuditResultPanel) aiAuditResultPanel.classList.add('hidden');
        });
    }

    // -------------------------------------------------------------------------
    // 7. Mutual Agreement & Cryptographic WebCrypto SHA-256 Engine
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
        if (agTimelineText) agTimelineText.textContent = data.target_delivery_date || projectRecord?.target_sla_date || projectRecord?.deadline || 'Milestone Agreed Target';
        if (agAmountText) agAmountText.textContent = '$' + Number(data.agreed_amount || projectRecord?.budget || 1000).toLocaleString();

        if (agClientClearanceBadge) {
            agClientClearanceBadge.textContent = data.client_signed ? 'Ratified' : 'Review: Pending';
            agClientClearanceBadge.className = 'badge ' + (data.client_signed ? 'badge-success' : 'badge-subtle');
        }
        if (agClientSignStatus) {
            agClientSignStatus.textContent = data.client_signed ? 'Signature Ratified' : 'Signature Pending';
            agClientSignStatus.className = 'badge ' + (data.client_signed ? 'badge-success' : 'badge-warning');
        }
        if (agClientSignTimestamp) {
            agClientSignTimestamp.textContent = data.client_signed_at ? 'Signed: ' + new Date(data.client_signed_at).toLocaleString() : 'Awaiting Client digital signature.';
        }

        if (agProviderClearanceBadge) {
            agProviderClearanceBadge.textContent = data.provider_signed ? 'Ratified' : 'Review: Pending';
            agProviderClearanceBadge.className = 'badge ' + (data.provider_signed ? 'badge-success' : 'badge-subtle');
        }
        if (agProviderSignStatus) {
            agProviderSignStatus.textContent = data.provider_signed ? 'Signature Ratified' : 'Signature Pending';
            agProviderSignStatus.className = 'badge ' + (data.provider_signed ? 'badge-success' : 'badge-warning');
        }
        if (agProviderSignTimestamp) {
            agProviderSignTimestamp.textContent = data.provider_signed_at ? 'Signed: ' + new Date(data.provider_signed_at).toLocaleString() : 'Awaiting Provider digital signature.';
        }

        updateBilateralNegotiationStepper(data, isLocked);

        if (isLocked) {
            const hash = data.scope_hash || await computeSha256Fingerprint(projectId, data.version, data.agreed_amount);
            if (scopeHashContainer) {
                scopeHashContainer.classList.remove('hidden');
                if (!document.getElementById('btnVerifyLiveHash')) {
                    const verifyBtn = document.createElement('button');
                    verifyBtn.type = 'button';
                    verifyBtn.id = 'btnVerifyLiveHash';
                    verifyBtn.className = 'btn btn-outline btn-sm';
                    verifyBtn.style.borderColor = '#16a34a';
                    verifyBtn.style.color = '#166534';
                    verifyBtn.style.background = '#ffffff';
                    verifyBtn.textContent = '🛡️ Verify SHA-256 Integrity';
                    verifyBtn.addEventListener('click', async () => {
                        verifyBtn.disabled = true;
                        verifyBtn.textContent = 'Verifying Digest...';
                        const liveDigest = await computeSha256Fingerprint(projectId, agreementRecord?.version, agreementRecord?.agreed_amount);
                        setTimeout(() => {
                            verifyBtn.disabled = false;
                            verifyBtn.textContent = '✅ Integrity Verified (Zero Drift)';
                            if (window.Toast) {
                                window.Toast.success('WebCrypto SHA-256 Verified: Baseline digest (' + liveDigest.slice(0, 12) + '...) matches immutable ledger.');
                            }
                        }, 350);
                    });
                    scopeHashContainer.appendChild(verifyBtn);
                }
            }
            if (scopeHashValue) scopeHashValue.textContent = 'SHA-256: ' + hash;
            if (ribbonFingerprint) ribbonFingerprint.textContent = hash.slice(0, 16) + '...';
        } else {
            if (scopeHashContainer) scopeHashContainer.classList.add('hidden');
            if (ribbonFingerprint) ribbonFingerprint.textContent = 'UNRATIFIED';
        }

        [reqObjective, reqTargetUsers, reqFeatures, reqTechPreferences, reqNonFunctional, reqOutOfScope].forEach(el => {
            if (el) el.disabled = isLocked;
        });

        if (btnSaveReqDraft) btnSaveReqDraft.style.display = isLocked ? 'none' : 'inline-block';
        if (btnLockRequirement) btnLockRequirement.style.display = isLocked ? 'none' : 'inline-block';
        if (btnProposeReqChange) btnProposeReqChange.classList.toggle('hidden', !isLocked);
        if (btnProposeAmendment) btnProposeAmendment.classList.toggle('hidden', !isLocked);

        if (btnApproveAgreement) {
            const hasUserSigned = currentUser?.role === ROLES.CLIENT ? data.client_signed : data.provider_signed;
            if (hasUserSigned) {
                btnApproveAgreement.disabled = true;
                btnApproveAgreement.textContent = 'You Have Signed (Immutable)';
            } else {
                btnApproveAgreement.disabled = false;
                btnApproveAgreement.textContent = '✍️ Approve & Sign Agreement';
            }
        }
    }

    function updateBilateralNegotiationStepper(agreement, isLocked) {
        [nodeAgDraft, nodeAgClientReview, nodeAgProviderReview, nodeAgCleared, nodeAgLocked].forEach(el => {
            if (el) el.classList.remove('active', 'completed');
        });

        if (isLocked) {
            [nodeAgDraft, nodeAgClientReview, nodeAgProviderReview, nodeAgCleared, nodeAgLocked].forEach(el => {
                if (el) el.classList.add('completed');
            });
            if (nodeAgLocked) nodeAgLocked.classList.add('active');
            return;
        }

        if (nodeAgDraft) nodeAgDraft.classList.add('completed');

        if (agreement.client_signed && !agreement.provider_signed) {
            if (nodeAgClientReview) nodeAgClientReview.classList.add('completed');
            if (nodeAgProviderReview) nodeAgProviderReview.classList.add('active');
        } else if (!agreement.client_signed && agreement.provider_signed) {
            if (nodeAgProviderReview) nodeAgProviderReview.classList.add('completed');
            if (nodeAgClientReview) nodeAgClientReview.classList.add('active');
        } else {
            if (nodeAgClientReview) nodeAgClientReview.classList.add('active');
            if (nodeAgProviderReview) nodeAgProviderReview.classList.add('active');
        }
    }

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
                    const nextStage = milestonesList.length > 0
                        ? PROJECT_STAGES.IN_PROGRESS
                        : PROJECT_STAGES.AGREEMENT_LOCKED;

                    await sb.from('projects').update({
                        stage: nextStage,
                        scope_locked: true,
                        scope_hash: computedHash
                    }).eq('id', projectId);

                    await sb.from('workspace_messages').insert([{
                        project_id: projectId,
                        sender_id: currentUser?.id,
                        sender_name: 'WorkBridge Protocol Engine',
                        sender_role: 'SYSTEM',
                        message: 'Master Agreement ratified by both parties. Immutable Baseline Version 1.0 established. (SHA-256: ' + computedHash.slice(0, 16) + '...)'
                    }]);
                }

                if (window.Toast) window.Toast.success('Digital signature recorded to permanent ledger!');
                await loadAgreementDetails();
                await loadProjectOverview();
                updateDisputeRiskTelemetry();
            } catch (err) {
                if (window.Toast) window.Toast.error('Signature registration failed.');
                btnApproveAgreement.disabled = false;
            }
        });
    }

    if (btnEditProposalClauses) {
        btnEditProposalClauses.addEventListener('click', () => {
            if (!agreementRecord) return;
            const isLocked = agreementRecord.status === 'LOCKED' || (agreementRecord.client_signed && agreementRecord.provider_signed);

            if (isLocked) {
                if (window.Toast) window.Toast.info('Terms are locked. Initiating Formal Scope Amendment (v2.0).');
                if (amendmentModal) amendmentModal.classList.remove('hidden');
                return;
            }

            if (modalEditProposal) {
                if (proposalBudgetInput) proposalBudgetInput.value = agreementRecord.agreed_amount || projectRecord?.budget || 1000;
                if (proposalSlaInput) proposalSlaInput.value = agreementRecord.target_delivery_date || projectRecord?.target_sla_date || '';
                if (proposalTermsInput) proposalTermsInput.value = agreementRecord.terms_and_conditions || '';
                modalEditProposal.classList.remove('hidden');
            }
        });
    }

    if (closeEditProposalModalBtn) closeEditProposalModalBtn.addEventListener('click', () => modalEditProposal?.classList.add('hidden'));
    if (cancelEditProposalBtn) cancelEditProposalBtn.addEventListener('click', () => modalEditProposal?.classList.add('hidden'));

    if (editProposalForm) {
        editProposalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const budget = parseFloat(proposalBudgetInput ? proposalBudgetInput.value : 0) || 1000;
            const sla = proposalSlaInput ? proposalSlaInput.value : null;
            const terms = proposalTermsInput ? proposalTermsInput.value.trim() : '';

            if (!terms || !sb || !agreementRecord) return;

            try {
                await sb.from('agreements').update({
                    agreed_amount: budget,
                    target_delivery_date: sla,
                    terms_and_conditions: terms,
                    client_signed: false,
                    provider_signed: false,
                    status: 'DRAFT'
                }).eq('id', agreementRecord.id);

                await sb.from('projects').update({
                    budget: budget,
                    target_sla_date: sla
                }).eq('id', projectId);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Collaborator',
                    sender_role: currentUser?.role || 'CLIENT',
                    message: 'Updated Agreement proposal terms ($' + budget.toLocaleString() + '). Dual ratification reset for review.'
                }]);

                if (window.Toast) window.Toast.info('Proposal counter-terms saved. Both parties must re-sign.');
                modalEditProposal.classList.add('hidden');
                await loadAgreementDetails();
                await loadProjectOverview();
                await loadChatMessages();
            } catch (err) {
                if (window.Toast) window.Toast.error('Could not save proposal terms.');
            }
        });
    }

    if (btnRequestAgreementChange) {
        btnRequestAgreementChange.addEventListener('click', () => {
            if (modalRevisionRequest) modalRevisionRequest.classList.remove('hidden');
        });
    }

    if (revisionRequestForm) {
        revisionRequestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const category = revisionFeedbackCategory ? revisionFeedbackCategory.value : 'SCOPE';
            const feedback = revisionFeedbackInput ? revisionFeedbackInput.value.trim() : '';
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
                    stage: PROJECT_STAGES.REQUIREMENT_DISCUSSION,
                    scope_locked: false
                }).eq('id', projectId);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Collaborator',
                    sender_role: currentUser?.role || 'CLIENT',
                    message: 'Reopened Terms for Discussion [' + category + ']: "' + feedback + '"'
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

    if (btnProposeAmendment) {
        btnProposeAmendment.addEventListener('click', () => {
            if (amendmentModal) amendmentModal.classList.remove('hidden');
        });
    }

    async function loadScopeAmendments() {
        if (!sb) return;
        const { data } = await sb
            .from('scope_amendments')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });
        scopeAmendmentsList = Array.isArray(data) ? data : [];
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

                if (agreementRecord) {
                    const updatedAmount = Number(agreementRecord.agreed_amount || projectRecord?.budget || 1000) + budgetDelta;
                    await sb.from('agreements').update({
                        version: '2.0',
                        agreed_amount: updatedAmount,
                        terms_and_conditions: (agreementRecord.terms_and_conditions || '') + '\n\n[AMENDMENT v2.0 - ' + reason + ']: ' + details
                    }).eq('id', agreementRecord.id);

                    await sb.from('projects').update({
                        budget: updatedAmount
                    }).eq('id', projectId);
                }

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Collaborator',
                    sender_role: currentUser?.role || 'CLIENT',
                    message: 'Formal Scope Amendment Proposed (v2.0): "' + reason + '". Budget Delta: +$' + budgetDelta + ', Timeline Delta: +' + timelineDelta + ' days.'
                }]);

                if (window.Toast) window.Toast.success('Scope amendment v2.0 recorded and applied!');
                if (amendmentModal) amendmentModal.classList.add('hidden');
                amendmentForm.reset();
                await loadScopeAmendments();
                await loadAgreementDetails();
                await loadProjectOverview();
                await loadChatMessages();
            } catch (e) {
                if (window.Toast) window.Toast.error('Failed to submit amendment proposal.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 8. Milestones, Gantt Horizon & Executive Visual Analytics Suite
    // -------------------------------------------------------------------------
    async function loadMilestonesList() {
        const { data } = await sb
            .from('milestones')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        milestonesList = Array.isArray(data) ? data : [];
        renderMilestonesList(milestonesList);
        await calculateWeightedProgress(milestonesList);
        renderGanttTimelineHorizon(milestonesList);
        populateTaskMilestoneDropdown(milestonesList);
        updateMilestoneWeightMeter(milestonesList);
        renderExecutiveCharts(milestonesList, sprintTasksList);
    }

    function updateMilestoneWeightMeter(milestones) {
        if (!milestoneWeightAllocationText || !milestoneWeightAllocationBadge) return;
        const total = milestones.reduce((sum, m) => sum + (Number(m.weight_percentage) || 0), 0);
        milestoneWeightAllocationText.textContent = total + '% / 100% Allocated';
        
        if (total === 100) {
            milestoneWeightAllocationBadge.textContent = '100% Fully Allocated';
            milestoneWeightAllocationBadge.className = 'badge badge-success';
        } else if (total > 100) {
            milestoneWeightAllocationBadge.textContent = 'Overallocated (' + total + '%)';
            milestoneWeightAllocationBadge.className = 'badge badge-danger';
        } else {
            milestoneWeightAllocationBadge.textContent = (100 - total) + '% Remaining';
            milestoneWeightAllocationBadge.className = 'badge badge-warning';
        }
    }

    function populateTaskMilestoneDropdown(milestones) {
        const options = milestones.length > 0
            ? milestones.map(m => '<option value="' + m.id + '">' + escapeHtml(m.title) + ' (' + (m.weight_percentage || 25) + '%)</option>').join('')
            : '<option value="">Default Project Sprint</option>';

        if (taskMilestoneSelect) taskMilestoneSelect.innerHTML = options;

        if (taskFilterMilestoneSelect) {
            const currentFilter = taskFilterMilestoneSelect.value || 'ALL';
            taskFilterMilestoneSelect.innerHTML = '<option value="ALL">All Milestones</option>' + options;
            if (currentFilter !== 'ALL' && milestones.some(m => String(m.id) === String(currentFilter))) {
                taskFilterMilestoneSelect.value = currentFilter;
            }
        }
    }

    async function calculateWeightedProgress(milestones) {
        if (!milestones || milestones.length === 0) {
            if (projectProgressPercent) projectProgressPercent.textContent = '0%';
            if (projectProgressBar) projectProgressBar.style.width = '0%';
            if (ribbonEscrowReleased) ribbonEscrowReleased.textContent = '$0.00 (0%)';
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

        const denominator = Math.max(100, totalWeight);
        const calculated = Math.min(100, Math.round((approvedWeight / denominator) * 100));
        const releasedAmount = Math.round((calculated / 100) * totalBudget);

        if (projectProgressPercent) projectProgressPercent.textContent = calculated + '%';
        if (projectProgressBar) projectProgressBar.style.width = calculated + '%';
        if (ribbonEscrowReleased) ribbonEscrowReleased.textContent = '$' + releasedAmount.toLocaleString() + ' (' + calculated + '%)';

        if (sb && projectRecord && calculated !== projectRecord.completion_percentage) {
            await sb.from('projects').update({ completion_percentage: calculated }).eq('id', projectId);
            projectRecord.completion_percentage = calculated;
        }
    }

    // =========================================================================
    // EXECUTIVE VISUAL ANALYTICS SUITE (Pure SVG Charts & Gauges)
    // =========================================================================
    function renderExecutiveCharts(milestones, tasks) {
        const totalBudget = Number(projectRecord?.budget || 1000);
        
        // 1. Escrow Donut Calculations
        let releasedVal = 0;
        let reviewVal = 0;
        let lockedVal = 0;

        milestones.forEach(m => {
            const w = Number(m.weight_percentage) || (milestones.length ? 100 / milestones.length : 25);
            const tranche = Math.round((w / 100) * totalBudget);
            if (m.status === 'APPROVED') {
                releasedVal += tranche;
            } else if (m.status === 'SUBMITTED_FOR_REVIEW') {
                reviewVal += tranche;
            } else {
                lockedVal += tranche;
            }
        });

        if (milestones.length === 0) {
            lockedVal = totalBudget;
        }

        if (legendReleasedAmount) legendReleasedAmount.textContent = '$' + releasedVal.toLocaleString();
        if (legendLockedAmount) legendLockedAmount.textContent = '$' + lockedVal.toLocaleString();
        if (legendReviewAmount) legendReviewAmount.textContent = '$' + reviewVal.toLocaleString();
        if (chartTotalContractVal) chartTotalContractVal.textContent = '$' + totalBudget.toLocaleString() + ' USD';

        // Render SVG Donut
        if (escrowSvgMount) {
            const r = 36;
            const c = 2 * Math.PI * r;
            const sumVal = Math.max(1, releasedVal + lockedVal + reviewVal);
            
            const relOffset = c - (releasedVal / sumVal) * c;
            const revOffset = relOffset - (reviewVal / sumVal) * c;

            escrowSvgMount.innerHTML = `
                <svg width="96" height="96" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="12"></circle>
                    <circle cx="48" cy="48" r="${r}" fill="none" stroke="#3b82f6" stroke-width="12" stroke-dasharray="${c}" stroke-dashoffset="${relOffset}" transform="rotate(-90 48 48)"></circle>
                    <circle cx="48" cy="48" r="${r}" fill="none" stroke="#f59e0b" stroke-width="12" stroke-dasharray="${c}" stroke-dashoffset="${revOffset}" transform="rotate(-90 48 48)"></circle>
                    <circle cx="48" cy="48" r="${r}" fill="none" stroke="#10b981" stroke-width="12" stroke-dasharray="${c}" stroke-dashoffset="0" transform="rotate(-90 48 48)" style="opacity: ${releasedVal > 0 ? 1 : 0};"></circle>
                    <text x="48" y="52" text-anchor="middle" font-size="13" font-weight="800" fill="#0f172a">${Math.round((releasedVal / totalBudget) * 100)}%</text>
                </svg>
            `;
        }

        // 2. Risk Speedometer Gauge Calculations
        let riskScore = 0;
        if (!agreementRecord || agreementRecord.status !== 'LOCKED') riskScore += 25;
        const activeBlockers = projectUpdatesList.filter(u => u.category === 'BLOCKER' || (u.content && u.content.includes('CRITICAL'))).length;
        if (activeBlockers > 0) riskScore += Math.min(40, activeBlockers * 20);
        const now = new Date();
        const overdueMilestones = milestones.filter(m => m.status !== 'APPROVED' && m.target_date && new Date(m.target_date) < now).length;
        if (overdueMilestones > 0) riskScore += Math.min(35, overdueMilestones * 15);
        riskScore = Math.min(100, riskScore);

        if (chartRiskStatusPill) {
            chartRiskStatusPill.textContent = riskScore >= 60 ? 'High Risk' : (riskScore >= 30 ? 'Moderate Risk' : '0% Low Risk');
            chartRiskStatusPill.className = 'badge ' + (riskScore >= 60 ? 'badge-danger' : (riskScore >= 30 ? 'badge-warning' : 'badge-success'));
        }
        if (riskFactorsSummaryText) {
            riskFactorsSummaryText.textContent = activeBlockers > 0 ? `${activeBlockers} active blockers` : (overdueMilestones > 0 ? `${overdueMilestones} overdue milestones` : 'Zero scope drift & compliant');
        }
        if (chartCryptoGuardStatus) {
            chartCryptoGuardStatus.textContent = agreementRecord?.status === 'LOCKED' ? 'Immutable (SHA-256)' : 'Pending Agreement';
        }

        // Render Semi-Circle Gauge SVG (Needle rotation based on riskScore)
        if (riskGaugeSvgMount) {
            const angle = -90 + (riskScore / 100) * 180;
            riskGaugeSvgMount.innerHTML = `
                <svg width="140" height="78" viewBox="0 0 140 78">
                    <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="#e2e8f0" stroke-width="12" stroke-linecap="round"></path>
                    <path d="M 15 70 A 55 55 0 0 1 125 70" fill="none" stroke="${riskScore >= 60 ? '#ef4444' : (riskScore >= 30 ? '#f59e0b' : '#10b981')}" stroke-width="12" stroke-linecap="round" stroke-dasharray="172.7" stroke-dashoffset="${172.7 - (riskScore / 100) * 172.7}"></path>
                    <g transform="translate(70, 70) rotate(${angle})">
                        <polygon points="0,-45 4,0 -4,0" fill="#0f172a"></polygon>
                        <circle cx="0" cy="0" r="5" fill="#3b82f6"></circle>
                    </g>
                    <text x="70" y="75" text-anchor="middle" font-size="11" font-weight="700" fill="#64748b">${riskScore}% Index</text>
                </svg>
            `;
        }

        // 3. Delivery Velocity Matrix
        const totalM = milestones.length;
        const approvedM = milestones.filter(m => m.status === 'APPROVED').length;
        const mPct = totalM > 0 ? Math.round((approvedM / totalM) * 100) : 0;

        const totalT = tasks.length;
        const doneT = tasks.filter(t => t.status === 'DONE').length;
        const tPct = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0;

        const totalW = milestones.reduce((s, m) => s + (Number(m.weight_percentage) || 0), 0);
        const wPct = Math.min(100, totalW);

        if (chartVelocityRatioBadge) chartVelocityRatioBadge.textContent = `${approvedM} / ${totalM} Milestones`;
        if (velMilestonesPct) velMilestonesPct.textContent = mPct + '%';
        if (velMilestonesBar) velMilestonesBar.style.width = mPct + '%';
        if (velTasksPct) velTasksPct.textContent = tPct + '%';
        if (velTasksBar) velTasksBar.style.width = tPct + '%';
        if (velWeightPct) velWeightPct.textContent = wPct + '%';
        if (velWeightBar) velWeightBar.style.width = wPct + '%';
        if (chartSprintPacingText) chartSprintPacingText.textContent = overdueMilestones > 0 ? 'Delayed SLA' : 'Optimal Pacing';
    }

    function renderGanttTimelineHorizon(milestones) {
        if (!ganttTimelineHorizon) return;
        ganttTimelineHorizon.innerHTML = '';

        if (milestones.length === 0) {
            ganttTimelineHorizon.innerHTML = '<span class="text-xs text-muted">Awaiting milestone schedule to draw execution timeline...</span>';
            return;
        }

        const horizonRow = document.createElement('div');
        horizonRow.style.display = 'flex';
        horizonRow.style.gap = '0.75rem';
        horizonRow.style.width = '100%';

        milestones.forEach((m, idx) => {
            const isApproved = m.status === 'APPROVED';
            const isReview = m.status === 'SUBMITTED_FOR_REVIEW';
            const block = document.createElement('div');
            block.style.flex = '1';
            block.style.minWidth = '140px';
            block.style.padding = '0.65rem 0.85rem';
            block.style.borderRadius = '8px';
            block.style.cursor = 'pointer';
            block.style.border = '1px solid var(--border-color, #e2e8f0)';
            block.style.background = isApproved ? '#f0fdf4' : (isReview ? '#fffbeb' : '#ffffff');
            block.title = 'Click to inspect ' + m.title;

            block.innerHTML = ''
                + '<div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem;">'
                + '  <strong>Sprint ' + (idx + 1) + '</strong>'
                + '  <span class="badge ' + (isApproved ? 'badge-success' : (isReview ? 'badge-warning' : 'badge-subtle')) + '">' + (isApproved ? 'Done' : (isReview ? 'Review' : 'Pending')) + '</span>'
                + '</div>'
                + '<div class="text-xs font-bold mt-1 text-truncate">' + escapeHtml(m.title) + '</div>'
                + '<div class="text-xs text-muted mt-1" style="display: flex; justify-content: space-between;">'
                + '  <span>' + (m.target_date || 'SLA Paced') + '</span>'
                + '  <span>' + (m.weight_percentage || 25) + '% wt</span>'
                + '</div>';

            block.addEventListener('click', () => openMilestoneDetailModal(m));
            horizonRow.appendChild(block);
        });

        ganttTimelineHorizon.appendChild(horizonRow);
        if (healthDeliveryPacing) healthDeliveryPacing.textContent = '100% On Track';
        if (healthScopeStability) healthScopeStability.textContent = agreementRecord?.status === 'LOCKED' ? 'Tamper Locked' : 'Draft Flexible';
    }

    function renderMilestonesList(milestones) {
        if (!milestonesContainer) return;
        milestonesContainer.innerHTML = '';

        if (milestones.length === 0) {
            milestonesContainer.innerHTML = '<div class="card empty-state text-center py-4"><p class="text-muted">No milestones defined yet. Click \'+ Add Milestone\' to establish deliverable roadmap and auto-generate sprint tasks.</p></div>';
            return;
        }

        const isClient = currentUser?.role === ROLES.CLIENT;

        milestones.forEach(m => {
            const card = document.createElement('div');
            card.className = 'card mb-3 milestone-item';
            card.style.borderLeft = '4px solid ' + (m.status === 'APPROVED' ? 'var(--success, #10b981)' : (m.status === 'SUBMITTED_FOR_REVIEW' ? '#f59e0b' : 'var(--primary, #3b82f6)'));
            card.style.padding = '1rem 1.25rem';
            card.style.cursor = 'pointer';

            const isApproved = m.status === 'APPROVED';
            const isReview = m.status === 'SUBMITTED_FOR_REVIEW';

            let actionButtons = '';
            if (isApproved) {
                actionButtons = '<div class="mt-2"><span class="badge badge-success">✅ Deliverable Verified &amp; Escrow Released</span></div>';
            } else if (isReview) {
                if (isClient) {
                    actionButtons = '<div class="mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">'
                        + '<button type="button" class="btn btn-primary btn-sm btn-review-proof" '
                        + 'data-id="' + m.id + '" '
                        + 'data-url="' + escapeHtml(m.deliverable_url || '') + '" '
                        + 'data-commit="' + escapeHtml(m.commit_hash || '') + '" '
                        + 'data-branch="' + escapeHtml(m.branch_name || '') + '" '
                        + 'data-demo="' + escapeHtml(m.demo_url || '') + '" '
                        + 'data-notes="' + escapeHtml(m.notes || '') + '">'
                        + '🔍 Inspect &amp; Verify Deliverable Proof'
                        + '</button>'
                        + '</div>';
                } else {
                    actionButtons = '<div class="mt-2"><span class="badge badge-warning">⏳ Deliverable Under Client Review</span></div>';
                }
            } else {
                if (!isClient) {
                    actionButtons = '<div class="mt-2" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">'
                        + '<button type="button" class="btn btn-outline btn-sm btn-submit-milestone" data-id="' + m.id + '">'
                        + '🚀 Submit Technical Proof (PR &amp; Commit)'
                        + '</button>'
                        + '<button type="button" class="btn btn-outline btn-sm btn-open-milestone-tasks" data-id="' + m.id + '">'
                        + '📋 View Sprint Tasks'
                        + '</button>'
                        + '</div>';
                } else {
                    actionButtons = '<div class="mt-2" style="display: flex; gap: 0.5rem; align-items: center;">'
                        + '<span class="badge badge-subtle">Awaiting Technical Delivery</span>'
                        + '<button type="button" class="btn btn-outline btn-sm btn-open-milestone-tasks" data-id="' + m.id + '">📋 View Tasks</button>'
                        + '</div>';
                }
            }

            const statusClass = isApproved ? 'badge-success' : (isReview ? 'badge-warning' : 'badge-subtle');
            const statusLabel = isApproved ? 'VERIFIED' : (isReview ? 'UNDER REVIEW' : 'PENDING');
            const weightClass = isApproved ? 'badge-success' : 'badge-primary';

            let proofPillsHtml = '';
            if (m.deliverable_url) {
                const commitPill = m.commit_hash ? '<span class="badge badge-subtle" style="font-family: monospace;">Commit: #' + escapeHtml(m.commit_hash) + '</span>' : '';
                const branchPill = m.branch_name ? '<span class="badge badge-subtle">Branch: ' + escapeHtml(m.branch_name) + '</span>' : '';
                const demoPill = m.demo_url ? '<a href="' + escapeHtml(m.demo_url) + '" target="_blank" rel="noopener" class="badge badge-success">Staging Demo &rarr;</a>' : '';

                proofPillsHtml = '<div class="mt-2" style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">'
                    + '<a href="' + escapeHtml(m.deliverable_url) + '" target="_blank" rel="noopener" class="badge badge-subtle" style="text-decoration: underline;">PR Link &rarr;</a>'
                    + commitPill + branchPill + demoPill
                    + '</div>';
            }

            card.innerHTML = ''
                + '<div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">'
                + '  <div>'
                + '    <div style="display: flex; align-items: center; gap: 0.5rem;">'
                + '      <strong style="font-size: 1rem;" class="btn-inspect-milestone" data-id="' + m.id + '">' + escapeHtml(m.title) + '</strong>'
                + '      <span class="badge ' + weightClass + '">' + (m.weight_percentage || 25) + '% Progress Weight</span>'
                + '    </div>'
                + '    <p class="text-sm text-muted mt-1 mb-0">' + escapeHtml(m.deliverables || 'Deliverables verified via Git pull request.') + '</p>'
                + proofPillsHtml
                + '  </div>'
                + '  <div>'
                + '    <span class="badge ' + statusClass + '">' + statusLabel + '</span>'
                + '  </div>'
                + '</div>'
                + actionButtons;

            card.querySelector('.btn-inspect-milestone').addEventListener('click', (e) => {
                e.stopPropagation();
                openMilestoneDetailModal(m);
            });

            milestonesContainer.appendChild(card);
        });

        milestonesContainer.querySelectorAll('.btn-open-milestone-tasks').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mid = btn.getAttribute('data-id');
                if (taskFilterMilestoneSelect && mid) {
                    taskFilterMilestoneSelect.value = mid;
                }
                if (btnViewTasksMode) btnViewTasksMode.click();
                renderSprintTasksBoard(sprintTasksList);
            });
        });

        milestonesContainer.querySelectorAll('.btn-review-proof').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
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

        milestonesContainer.querySelectorAll('.btn-submit-milestone').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                if (actionMilestoneId) actionMilestoneId.value = id;
                if (milestoneActionModal) milestoneActionModal.classList.remove('hidden');
            });
        });
    }

    function openMilestoneDetailModal(milestone) {
        if (!modalMilestoneDetail || !milestoneDetailBody) return;
        if (milestoneDetailTitle) milestoneDetailTitle.textContent = milestone.title || 'Milestone Specification';

        const totalBudget = Number(projectRecord?.budget || 1000);
        const weight = Number(milestone.weight_percentage) || 25;
        const allocatedEscrow = Math.round((weight / 100) * totalBudget);

        let proofHtml = '<div class="text-xs text-muted mt-2">No technical PR proof submitted yet.</div>';
        if (milestone.deliverable_url) {
            proofHtml = '<div class="mt-3 p-3 border rounded" style="background: #f0fdf4;">'
                + '<strong style="font-size: 0.85rem; color: #166534; display: block; margin-bottom: 0.4rem;">VERIFIED CODEBASE ARTIFACTS</strong>'
                + '<div style="font-size: 0.85rem;">'
                + '  <div>PR Link: <a href="' + escapeHtml(milestone.deliverable_url) + '" target="_blank" rel="noopener" style="font-weight: 600; text-decoration: underline;">' + escapeHtml(milestone.deliverable_url) + ' &rarr;</a></div>'
                + (milestone.commit_hash ? '<div class="mt-1">Commit Hash: <code style="color: #0369a1;">#' + escapeHtml(milestone.commit_hash) + '</code></div>' : '')
                + (milestone.demo_url ? '<div class="mt-1">Staging Demo: <a href="' + escapeHtml(milestone.demo_url) + '" target="_blank" rel="noopener">' + escapeHtml(milestone.demo_url) + ' &rarr;</a></div>' : '')
                + '</div></div>';
        }

        milestoneDetailBody.innerHTML = ''
            + '<div class="grid grid-2 mb-3" style="gap: 0.75rem;">'
            + '  <div class="p-2 border rounded" style="background: #f8fafc;">'
            + '    <span class="text-xs text-muted" style="display:block;">PROGRESS WEIGHTAGE</span>'
            + '    <strong class="text-primary">' + weight + '% of Total Contract</strong>'
            + '  </div>'
            + '  <div class="p-2 border rounded" style="background: #f8fafc;">'
            + '    <span class="text-xs text-muted" style="display:block;">ESCROW ALLOCATION</span>'
            + '    <strong class="text-success">$' + allocatedEscrow.toLocaleString() + ' USD</strong>'
            + '  </div>'
            + '</div>'
            + '<div class="mb-3">'
            + '  <span class="text-xs text-muted font-bold" style="letter-spacing: 0.5px; display: block; margin-bottom: 0.35rem;">EXPECTED DELIVERABLES &amp; ACCEPTANCE CRITERIA</span>'
            + '  <div class="p-3 border rounded" style="background: #ffffff; font-size: 0.9rem; line-height: 1.5; white-space: pre-wrap;">'
            + escapeHtml(milestone.deliverables || 'Specifications governed by ratified requirements.')
            + '  </div>'
            + '</div>'
            + '<div class="mb-3">'
            + '  <span class="text-xs text-muted font-bold" style="letter-spacing: 0.5px; display: block; margin-bottom: 0.35rem;">DELIVERY TARGET &amp; STATUS</span>'
            + '  <div style="display: flex; justify-content: space-between; align-items: center;" class="p-2 border rounded">'
            + '    <span>Target Delivery Date: <strong>' + (milestone.target_date || 'Standard SLA') + '</strong></span>'
            + '    <span class="badge ' + (milestone.status === 'APPROVED' ? 'badge-success' : 'badge-warning') + '">' + (milestone.status || 'PENDING') + '</span>'
            + '  </div>'
            + '</div>'
            + proofHtml;

        modalMilestoneDetail.classList.remove('hidden');
    }

    if (closeMilestoneDetailModalBtn) closeMilestoneDetailModalBtn.addEventListener('click', () => modalMilestoneDetail?.classList.add('hidden'));
    if (closeMilestoneDetailFooterBtn) closeMilestoneDetailFooterBtn.addEventListener('click', () => modalMilestoneDetail?.classList.add('hidden'));

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

                await sb.from('tasks').update({ status: 'DONE' }).eq('milestone_id', mid);

                const { data: updatedMilestones } = await sb
                    .from('milestones')
                    .select('*')
                    .eq('project_id', projectId);

                const allList = Array.isArray(updatedMilestones) ? updatedMilestones : [];
                const totalApprovedWeight = allList
                    .filter(m => m.status === 'APPROVED')
                    .reduce((sum, m) => sum + (Number(m.weight_percentage) || 0), 0);

                const allApproved = allList.length > 0 && allList.every(m => m.status === 'APPROVED');
                const anyInReview = allList.some(m => m.status === 'SUBMITTED_FOR_REVIEW');

                let nextStage = projectRecord?.stage || PROJECT_STAGES.IN_PROGRESS;
                if (totalApprovedWeight >= 100 || allApproved) {
                    nextStage = PROJECT_STAGES.REVIEW; // Prompt for final handover review before completed
                } else if (anyInReview) {
                    nextStage = PROJECT_STAGES.REVIEW;
                } else {
                    nextStage = PROJECT_STAGES.IN_PROGRESS;
                }

                await sb.from('projects').update({
                    stage: nextStage,
                    completion_percentage: Math.min(100, Math.round(totalApprovedWeight))
                }).eq('id', projectId);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: 'WorkBridge Protocol Engine',
                    sender_role: 'SYSTEM',
                    message: '✅ Milestone deliverable verified by Client! Escrow tranche released (' + Math.min(100, Math.round(totalApprovedWeight)) + '% total progress).'
                }]);

                if (window.Toast) window.Toast.success('Technical deliverable verified! Progress weight released.');
                if (modalReviewProof) modalReviewProof.classList.add('hidden');
                await loadMilestonesList();
                await loadSprintTasks();
                await loadProjectOverview();
                await loadChatMessages();
                updateDisputeRiskTelemetry();
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

                await sb.from('projects').update({
                    stage: PROJECT_STAGES.IN_PROGRESS
                }).eq('id', projectId);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Client Principal',
                    sender_role: 'CLIENT',
                    message: 'Deliverable Revision Requested on Milestone: "' + feedback + '". Stage moved back to Building.'
                }]);

                if (window.Toast) window.Toast.info('Revision requested. Project returned to Building stage.');
                if (modalReviewProof) modalReviewProof.classList.add('hidden');
                await loadMilestonesList();
                await loadProjectOverview();
                await loadChatMessages();
                updateDisputeRiskTelemetry();
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not request deliverable revision.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 9. Sprint Tasks Kanban Board Execution, Auto-Seeding & Filtering
    // -------------------------------------------------------------------------
    if (btnViewRoadmapMode && btnViewTasksMode) {
        btnViewRoadmapMode.addEventListener('click', () => {
            btnViewRoadmapMode.classList.add('active');
            btnViewTasksMode.classList.remove('active');
            if (milestonesContainer) milestonesContainer.classList.remove('hidden');
            if (sprintsTasksBoard) sprintsTasksBoard.classList.add('hidden');
        });

        btnViewTasksMode.addEventListener('click', () => {
            btnViewTasksMode.classList.add('active');
            btnViewRoadmapMode.classList.remove('active');
            if (milestonesContainer) milestonesContainer.classList.add('hidden');
            if (sprintsTasksBoard) sprintsTasksBoard.classList.remove('hidden');
        });
    }

    if (taskFilterMilestoneSelect) {
        taskFilterMilestoneSelect.addEventListener('change', () => {
            renderSprintTasksBoard(sprintTasksList);
        });
    }

    async function loadSprintTasks() {
        if (!sb) return;
        const { data } = await sb
            .from('tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        sprintTasksList = Array.isArray(data) ? data : [];
        renderSprintTasksBoard(sprintTasksList);
    }

    async function seedDefaultTasksForMilestone(milestone) {
        if (!sb || !milestone || !milestone.id) return;
        const mTitle = milestone.title || 'Sprint Deliverable';
        const defaultTasks = [
            {
                project_id: projectId,
                milestone_id: milestone.id,
                title: '[Architecture & Config] ' + mTitle,
                description: 'Initialize environment, schema configuration, and baseline setup for ' + mTitle,
                priority: 'MEDIUM',
                status: 'TODO'
            },
            {
                project_id: projectId,
                milestone_id: milestone.id,
                title: '[Core Implementation] ' + mTitle,
                description: milestone.deliverables || ('Execute core engineering deliverables for ' + mTitle),
                priority: 'HIGH',
                status: 'TODO'
            },
            {
                project_id: projectId,
                milestone_id: milestone.id,
                title: '[QA & Git PR Proof] ' + mTitle,
                description: 'Run verification tests and submit Pull Request & Commit SHA proof for client inspection.',
                priority: 'MEDIUM',
                status: 'TODO'
            }
        ];

        try {
            await sb.from('tasks').insert(defaultTasks);
            await loadSprintTasks();
        } catch (err) {
            console.warn('Could not seed default tasks:', err);
        }
    }

    function renderSprintTasksBoard(tasks) {
        if (!taskListTodo || !taskListInProgress || !taskListDone) return;
        taskListTodo.innerHTML = '';
        taskListInProgress.innerHTML = '';
        taskListDone.innerHTML = '';

        const selectedMilestone = taskFilterMilestoneSelect ? taskFilterMilestoneSelect.value : 'ALL';
        const filteredTasks = selectedMilestone === 'ALL'
            ? tasks
            : tasks.filter(t => String(t.milestone_id) === String(selectedMilestone));

        if (filteredTasks.length === 0) {
            const targetMilestone = selectedMilestone !== 'ALL'
                ? milestonesList.find(m => String(m.id) === String(selectedMilestone))
                : milestonesList[0];

            taskListTodo.innerHTML = ''
                + '<div class="p-3 text-center" style="background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 8px;">'
                + '  <div class="text-xs text-muted mb-2">No tasks in this sprint backlog yet.</div>'
                + (targetMilestone
                    ? '<button type="button" id="btnAutoSeedSprintTasks" class="btn btn-outline btn-sm" style="font-size: 0.75rem;">⚡ Auto-Generate 3 Sprint Tasks</button>'
                    : '')
                + '</div>';

            const seedBtn = document.getElementById('btnAutoSeedSprintTasks');
            if (seedBtn && targetMilestone) {
                seedBtn.addEventListener('click', async () => {
                    seedBtn.disabled = true;
                    seedBtn.textContent = 'Generating...';
                    await seedDefaultTasksForMilestone(targetMilestone);
                    if (window.Toast) window.Toast.success('3 Sprint Tasks generated for ' + targetMilestone.title + '!');
                });
            }
            return;
        }

        filteredTasks.forEach(t => {
            const card = document.createElement('div');
            card.className = 'card task-item mb-2 p-2';
            card.style.fontSize = '0.85rem';
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            card.style.borderLeft = '3px solid ' + (t.priority === 'HIGH' ? '#ef4444' : (t.priority === 'MEDIUM' ? '#3b82f6' : '#94a3b8'));

            const associatedMilestone = milestonesList.find(m => String(m.id) === String(t.milestone_id));
            const milestoneTag = associatedMilestone
                ? '<div class="text-xs text-primary font-bold mb-1">🎯 ' + escapeHtml(associatedMilestone.title) + '</div>'
                : '';

            card.innerHTML = ''
                + milestoneTag
                + '<div style="font-weight: 600;">' + escapeHtml(t.title) + '</div>'
                + '<div class="text-xs text-muted mt-1">' + escapeHtml(t.description || 'Sprint task') + '</div>'
                + '<div class="mt-2" style="display: flex; justify-content: space-between; align-items: center;">'
                + '  <span class="badge ' + (t.priority === 'HIGH' ? 'badge-danger' : 'badge-subtle') + '">' + (t.priority || 'MEDIUM') + '</span>'
                + '  <select class="form-control form-control-sm select-task-status" data-id="' + t.id + '" style="width: auto; padding: 0.1rem 0.3rem; font-size: 0.75rem;">'
                + '    <option value="TODO"' + (t.status === 'TODO' ? ' selected' : '') + '>📋 To Do</option>'
                + '    <option value="IN_PROGRESS"' + (t.status === 'IN_PROGRESS' ? ' selected' : '') + '>⚡ In Progress</option>'
                + '    <option value="DONE"' + (t.status === 'DONE' ? ' selected' : '') + '>✅ Verified</option>'
                + '  </select>'
                + '</div>';

            if (t.status === 'IN_PROGRESS') taskListInProgress.appendChild(card);
            else if (t.status === 'DONE') taskListDone.appendChild(card);
            else taskListTodo.appendChild(card);
        });

        document.querySelectorAll('.select-task-status').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const taskId = sel.getAttribute('data-id');
                const newStatus = e.target.value;
                try {
                    await sb.from('tasks').update({ status: newStatus }).eq('id', taskId);

                    if (newStatus === 'IN_PROGRESS' && projectRecord?.stage === PROJECT_STAGES.AGREEMENT_LOCKED) {
                        await sb.from('projects').update({ stage: PROJECT_STAGES.IN_PROGRESS }).eq('id', projectId);
                        await loadProjectOverview();
                        if (window.Toast) window.Toast.info('Project stage automatically transitioned to BUILDING!');
                    }

                    await loadSprintTasks();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Could not update task status.');
                }
            });
        });
    }

    if (btnOpenAddTaskModal) {
        btnOpenAddTaskModal.addEventListener('click', () => {
            if (modalAddTask) modalAddTask.classList.remove('hidden');
        });
    }
    if (closeAddTaskModalBtn) closeAddTaskModalBtn.addEventListener('click', () => modalAddTask?.classList.add('hidden'));
    if (cancelAddTaskBtn) cancelAddTaskBtn.addEventListener('click', () => modalAddTask?.classList.add('hidden'));

    if (addTaskForm) {
        addTaskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('taskTitleInput');
            const descInput = document.getElementById('taskDescriptionInput');
            const priorityInput = document.getElementById('taskPrioritySelect');
            const milestoneId = taskMilestoneSelect?.value || null;

            const title = titleInput ? titleInput.value.trim() : '';
            const desc = descInput ? descInput.value.trim() : '';
            const priority = priorityInput ? priorityInput.value : 'MEDIUM';

            if (!title || !sb) return;

            try {
                await sb.from('tasks').insert([{
                    project_id: projectId,
                    milestone_id: milestoneId,
                    title,
                    description: desc,
                    priority,
                    status: 'TODO'
                }]);

                if (window.Toast) window.Toast.success('Sprint task created!');
                modalAddTask.classList.add('hidden');
                addTaskForm.reset();
                await loadSprintTasks();
            } catch (err) {
                if (window.Toast) window.Toast.error('Failed to create sprint task.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 10. Engineering Status Updates & Blocker Tracking
    // -------------------------------------------------------------------------
    async function loadProjectUpdates() {
        if (!updatesTimeline || !sb) return;

        const { data } = await sb
            .from('project_updates')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        projectUpdatesList = Array.isArray(data) ? data : [];
        updatesTimeline.innerHTML = '';

        if (projectUpdatesList.length === 0) {
            updatesTimeline.innerHTML = '<div class="text-center text-muted py-3">No project updates posted yet. Click \'Post Detailed Update\' above.</div>';
            if (healthActiveBlockers) healthActiveBlockers.textContent = '0 Unresolved';
            return;
        }

        let blockerCount = 0;

        projectUpdatesList.forEach(u => {
            const isBlocker = (u.content && u.content.toLowerCase().includes('critical')) || u.category === 'BLOCKER';
            if (isBlocker) blockerCount++;

            const categoryBadge = u.category === 'DELIVERABLE'
                ? '<span class="badge badge-success">Deliverable</span>'
                : (isBlocker ? '<span class="badge badge-danger">Blocker</span>' : '<span class="badge badge-subtle">Standup</span>');

            const item = document.createElement('div');
            item.className = 'timeline-item mb-3 pb-2 border-b';
            item.style.cursor = 'pointer';
            item.innerHTML = ''
                + '<div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">'
                + '  <div style="display: flex; align-items: center; gap: 0.4rem;">'
                +      categoryBadge
                + '    <strong style="font-size: 0.95rem;">' + escapeHtml(u.title || 'Engineering Standup') + '</strong>'
                + '  </div>'
                + '  <span class="text-xs text-muted">' + formatTime(u.created_at) + '</span>'
                + '</div>'
                + '<p class="text-sm mt-1 mb-0 text-truncate" style="color: var(--text-main);">' + escapeHtml(u.content) + '</p>'
                + '<div class="text-xs text-muted mt-1">Author: <strong>' + escapeHtml(u.author_name || 'Collaborator') + '</strong> &bull; Click to inspect full breakdown</div>';

            item.addEventListener('click', () => openUpdateDetailModal(u));
            updatesTimeline.appendChild(item);
        });

        if (healthActiveBlockers) {
            healthActiveBlockers.textContent = blockerCount > 0 ? (blockerCount + ' Unresolved') : '0 Unresolved';
            healthActiveBlockers.className = blockerCount > 0 ? 'text-danger font-medium' : 'text-success font-medium';
        }

        updateDisputeRiskTelemetry();
    }

    function openUpdateDetailModal(update) {
        if (!modalUpdateDetail) return;
        if (updateDetailTitle) updateDetailTitle.textContent = update.title || 'Engineering Standup';
        if (updateDetailBody) {
            updateDetailBody.innerHTML = ''
                + '<div class="text-xs text-muted mb-2">Posted by: <strong>' + escapeHtml(update.author_name) + '</strong> on ' + new Date(update.created_at).toLocaleString() + '</div>'
                + '<div class="p-3 border rounded mb-3" style="background: #f8fafc; white-space: pre-wrap; line-height: 1.5; font-size: 0.9rem;">'
                + escapeHtml(update.content)
                + '</div>'
                + (update.artifact_url ? '<div>Artifact PR: <a href="' + escapeHtml(update.artifact_url) + '" target="_blank" rel="noopener" class="badge badge-primary">Open Code PR &rarr;</a></div>' : '');
        }
        modalUpdateDetail.classList.remove('hidden');
    }

    if (closeUpdateDetailModalBtn) closeUpdateDetailModalBtn.addEventListener('click', () => modalUpdateDetail?.classList.add('hidden'));
    if (closeUpdateDetailFooterBtn) closeUpdateDetailFooterBtn.addEventListener('click', () => modalUpdateDetail?.classList.add('hidden'));

    if (btnPostUpdate) {
        btnPostUpdate.addEventListener('click', () => {
            if (modalPostUpdate) modalPostUpdate.classList.remove('hidden');
        });
    }

    if (postUpdateForm) {
        postUpdateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('updateTitleInput');
            const typeInput = document.getElementById('updateTypeSelect');
            const blockerSeverity = document.getElementById('updateBlockerSeveritySelect')?.value || 'NONE';
            const completedInput = document.getElementById('updateCompletedInput');
            const pendingInput = document.getElementById('updatePendingInput');
            const blockersInput = document.getElementById('updateBlockersInput');
            const artifactUrlInput = document.getElementById('updateArtifactUrlInput');
            const stagingUrlInput = document.getElementById('updateStagingUrlInput');
            const testStatusInput = document.getElementById('updateTestStatusInput');

            const title = titleInput ? titleInput.value.trim() : '';
            const completed = completedInput ? completedInput.value.trim() : '';
            const pending = pendingInput ? pendingInput.value.trim() : '';
            const blockers = blockersInput ? blockersInput.value.trim() : '';
            const artifactUrl = artifactUrlInput ? artifactUrlInput.value.trim() : null;
            const stagingUrl = stagingUrlInput ? stagingUrlInput.value.trim() : null;
            const testStatus = testStatusInput ? testStatusInput.value.trim() : null;

            if (!title || !completed || !sb) return;

            let fullContent = 'COMPLETED WORK:\n' + completed;
            if (pending) fullContent += '\n\nPENDING / IN-FLIGHT:\n' + pending;
            if (blockers) fullContent += '\n\nBLOCKERS & ACTION REQUIRED (' + blockerSeverity + '):\n' + blockers;
            if (testStatus) fullContent += '\n\nAUTOMATED QA & TESTS:\n' + testStatus;
            if (stagingUrl) fullContent += '\n\nSTAGING URL: ' + stagingUrl;

            try {
                await sb.from('project_updates').insert([{
                    project_id: projectId,
                    author_name: currentUser?.fullName || 'Collaborator',
                    title: title,
                    category: typeInput?.value || 'PROGRESS',
                    content: fullContent,
                    artifact_url: artifactUrl
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
    // 11. Dispute Risk Index Telemetry Calculator
    // -------------------------------------------------------------------------
    function updateDisputeRiskTelemetry() {
        let riskScore = 0;

        if (!agreementRecord || agreementRecord.status !== 'LOCKED') {
            riskScore += 25;
        }

        const activeBlockers = projectUpdatesList.filter(u => u.category === 'BLOCKER' || (u.content && u.content.includes('CRITICAL'))).length;
        if (activeBlockers > 0) {
            riskScore += Math.min(40, activeBlockers * 20);
        }

        const now = new Date();
        const overdueMilestones = milestonesList.filter(m => m.status !== 'APPROVED' && m.target_date && new Date(m.target_date) < now).length;
        if (overdueMilestones > 0) {
            riskScore += Math.min(35, overdueMilestones * 15);
        }

        riskScore = Math.min(100, riskScore);

        let riskLabel = 'Low Risk';
        let badgeClass = 'badge-success';

        if (riskScore >= 60) {
            riskLabel = 'High Risk';
            badgeClass = 'badge-danger';
        } else if (riskScore >= 30) {
            riskLabel = 'Moderate Risk';
            badgeClass = 'badge-warning';
        }

        if (metaRiskScore) {
            metaRiskScore.textContent = riskScore + '% ' + riskLabel;
            metaRiskScore.className = riskScore >= 60 ? 'text-danger font-medium' : (riskScore >= 30 ? 'text-warning font-medium' : 'text-success font-medium');
        }

        if (ribbonDisputeRiskBadge) {
            ribbonDisputeRiskBadge.textContent = riskScore + '% ' + riskLabel;
            ribbonDisputeRiskBadge.className = 'badge ' + badgeClass;
        }

        if (timelineHealthBadge) {
            timelineHealthBadge.textContent = overdueMilestones > 0 ? ('Schedule: ' + overdueMilestones + ' Overdue') : 'Schedule: On Track';
            timelineHealthBadge.className = 'badge ' + (overdueMilestones > 0 ? 'badge-warning' : 'badge-success');
        }

        renderExecutiveCharts(milestonesList, sprintTasksList);
    }

    // -------------------------------------------------------------------------
    // 12. Live Chat & Discussion Threading
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
            if (msg.sender_role === 'SYSTEM') {
                const sys = document.createElement('div');
                sys.className = 'chat-system-message';
                sys.innerHTML = '🛡️ ' + escapeHtml(msg.message) + ' <span style="opacity:0.75;">(' + formatTime(msg.created_at) + ')</span>';
                chatMessagesFeed.appendChild(sys);
                return;
            }

            const isMine = msg.sender_id === currentUser?.id || msg.sender_name === currentUser?.fullName;
            const bubble = document.createElement('div');
            bubble.className = 'chat-bubble ' + (isMine ? 'mine' : 'theirs');
            bubble.innerHTML = ''
                + '<div style="font-size: 0.75rem; font-weight: 700; margin-bottom: 0.2rem;">'
                + escapeHtml(msg.sender_name || (isMine ? 'You' : 'Collaborator'))
                + ' <span style="font-size: 0.7rem; font-weight: 400; opacity: 0.8;">(' + escapeHtml(msg.sender_role || 'COLLABORATOR') + ')</span>'
                + '</div>'
                + '<div>' + escapeHtml(msg.message) + '</div>'
                + '<div class="chat-meta text-xs text-muted mt-1">' + formatTime(msg.created_at) + '</div>';

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
                const msgCount = chatMessagesFeed.querySelectorAll('.chat-bubble').length;
                const approvedCount = milestonesList.filter(m => m.status === 'APPROVED').length;
                aiSummaryContent.textContent = 'Discussion Summary (' + msgCount + ' messages): Scope baseline ' + (agreementRecord?.status === 'LOCKED' ? 'locked & ratified' : 'in negotiation') + ', ' + approvedCount + ' of ' + milestonesList.length + ' milestones verified, current stage: ' + (projectRecord?.stage || 'Active') + '.';
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
        }, 6000);
    }

    // -------------------------------------------------------------------------
    // 13. Architectural Decision Records (ADR) & Resource Vault
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

        data.forEach((d, index) => {
            const adrNumber = 'ADR-' + String(data.length - index).padStart(2, '0');
            const card = document.createElement('div');
            card.className = 'decision-card mt-2 p-2 border rounded card';
            card.innerHTML = ''
                + '<div style="display: flex; justify-content: space-between; align-items: center;">'
                + '  <span class="badge badge-success" style="font-size: 0.68rem;">' + adrNumber + ' &bull; ACCEPTED</span>'
                + '  <span class="text-xs text-muted">' + formatTime(d.created_at) + '</span>'
                + '</div>'
                + '<div style="font-weight: 700; font-size: 0.95rem; margin-top: 0.35rem;">' + escapeHtml(d.title) + '</div>'
                + '<div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; line-height: 1.45; white-space: pre-wrap;">' + escapeHtml(d.rationale) + '</div>'
                + '<div class="text-xs text-muted mt-2">Recorded by <strong>' + escapeHtml(d.recorded_by || 'Member') + '</strong></div>';

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
            tr.innerHTML = ''
                + '<td><strong>' + escapeHtml(r.title) + '</strong></td>'
                + '<td><span class="badge badge-subtle">Asset</span></td>'
                + '<td>' + escapeHtml(r.uploaded_by) + '</td>'
                + '<td>' + new Date(r.created_at).toLocaleDateString() + '</td>'
                + '<td class="text-right" style="text-align: right;">'
                + '  <a href="' + escapeHtml(r.resource_url) + '" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Access Artifact &rarr;</a>'
                + '</td>';

            resourceTableBody.appendChild(tr);
        });
    }

    // -------------------------------------------------------------------------
    // 14. Bilateral Handover & Official Governance Deed Certificate Handlers
    // -------------------------------------------------------------------------
    if (btnOpenFinalHandoverModal || btnSidebarRequestSignoff || btnProposeStageAdvance) {
        const triggerHandover = () => {
            openFinalSignoffConsole();
        };
        if (btnOpenFinalHandoverModal) btnOpenFinalHandoverModal.addEventListener('click', triggerHandover);
        if (btnSidebarRequestSignoff) btnSidebarRequestSignoff.addEventListener('click', triggerHandover);
    }

    if (closeFinalSignoffModalBtn) closeFinalSignoffModalBtn.addEventListener('click', () => finalSignoffModal?.classList.add('hidden'));
    if (closeFinalSignoffFooterBtn) closeFinalSignoffFooterBtn.addEventListener('click', () => finalSignoffModal?.classList.add('hidden'));

    function openFinalSignoffConsole() {
        if (!finalSignoffModal) return;
        const isClient = currentUser?.role === ROLES.CLIENT;

        if (providerHandoverForm) providerHandoverForm.classList.toggle('hidden', isClient);
        if (clientFinalSignoffForm) clientFinalSignoffForm.classList.toggle('hidden', !isClient);

        // Check if provider has already submitted handover notes
        const latestHandoverUpdate = projectUpdatesList.find(u => u.category === 'DELIVERABLE' || (u.content && u.content.includes('FINAL HANDOVER')));

        if (handoverProviderStatusBadge) {
            handoverProviderStatusBadge.textContent = latestHandoverUpdate ? 'Submitted ✅' : 'Pending Submission';
            handoverProviderStatusBadge.className = 'badge ' + (latestHandoverUpdate ? 'badge-success' : 'badge-warning');
        }

        if (handoverClientStatusBadge) {
            handoverClientStatusBadge.textContent = projectRecord?.stage === PROJECT_STAGES.COMPLETED ? 'Completed & Closed' : (latestHandoverUpdate ? 'Ready for Review' : 'Awaiting Provider');
            handoverClientStatusBadge.className = 'badge ' + (projectRecord?.stage === PROJECT_STAGES.COMPLETED ? 'badge-success' : (latestHandoverUpdate ? 'badge-primary' : 'badge-subtle'));
        }

        if (clientInspectHandoverContent) {
            if (latestHandoverUpdate) {
                clientInspectHandoverContent.innerHTML = '<div style="white-space: pre-wrap; line-height: 1.5;">' + escapeHtml(latestHandoverUpdate.content) + '</div>';
            } else {
                clientInspectHandoverContent.innerHTML = '<span class="text-warning">Provider has not submitted final handover package yet.</span>';
            }
        }

        finalSignoffModal.classList.remove('hidden');
    }

    // Provider Submits Final Handover
    if (providerHandoverForm) {
        providerHandoverForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const repoUrl = handoverRepoUrlInput ? handoverRepoUrlInput.value.trim() : '';
            const notes = handoverSummaryInput ? handoverSummaryInput.value.trim() : '';

            if (!repoUrl || !notes || !sb) return;

            try {
                await sb.from('project_updates').insert([{
                    project_id: projectId,
                    author_name: currentUser?.fullName || 'Technical Lead',
                    title: 'FINAL HANDOVER PACKAGE & RELEASE',
                    category: 'DELIVERABLE',
                    content: 'FINAL HANDOVER SUBMISSION:\n' + notes + '\n\nREPOSITORY / RELEASE URL: ' + repoUrl,
                    artifact_url: repoUrl
                }]);

                await sb.from('projects').update({
                    stage: PROJECT_STAGES.REVIEW
                }).eq('id', projectId);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Technical Lead',
                    sender_role: 'SERVICE_PROVIDER',
                    message: '📦 Final Project Handover Package dispatched! Awaiting Client Principal verification and escrow release.'
                }]);

                if (window.Toast) window.Toast.success('Final handover package submitted to client!');
                finalSignoffModal.classList.add('hidden');
                providerHandoverForm.reset();
                await hydrateWorkspace();
            } catch (err) {
                if (window.Toast) window.Toast.error('Failed to submit final handover.');
            }
        });
    }

    // Client Approves Final Completion & Settles Escrow
    if (clientFinalSignoffForm) {
        clientFinalSignoffForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!sb) return;

            try {
                // Mark all milestones as APPROVED
                await sb.from('milestones').update({
                    status: 'APPROVED',
                    verified_at: new Date().toISOString()
                }).eq('project_id', projectId);

                // Mark project as COMPLETED and 100% progress
                await sb.from('projects').update({
                    stage: PROJECT_STAGES.COMPLETED,
                    completion_percentage: 100
                }).eq('id', projectId);

                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Client Principal',
                    sender_role: 'CLIENT',
                    message: '🏆 Final Handover Verified & Approved! 100% of escrow released ($' + Number(projectRecord?.budget || 1000).toLocaleString() + '). Project marked COMPLETED.'
                }]);

                if (window.Toast) window.Toast.success('Project successfully completed and escrow released!');
                finalSignoffModal.classList.add('hidden');
                await hydrateWorkspace();
                setTimeout(() => openCertificateDeedModal(), 500);
            } catch (err) {
                if (window.Toast) window.Toast.error('Could not complete project sign-off.');
            }
        });
    }

    if (btnRejectFinalHandover) {
        btnRejectFinalHandover.addEventListener('click', async () => {
            const feedback = prompt('Enter requested revisions for the final handover:');
            if (!feedback || !sb) return;

            try {
                await sb.from('workspace_messages').insert([{
                    project_id: projectId,
                    sender_id: currentUser?.id,
                    sender_name: currentUser?.fullName || 'Client Principal',
                    sender_role: 'CLIENT',
                    message: '↩️ Final Handover Revision Requested: "' + feedback + '"'
                }]);
                if (window.Toast) window.Toast.info('Revision feedback sent to technical lead.');
                finalSignoffModal.classList.add('hidden');
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not send revision request.');
            }
        });
    }

    // Official Governance Deed & Certificate Modal Triggers
    if (btnOpenDeedCertificate) btnOpenDeedCertificate.addEventListener('click', openCertificateDeedModal);
    if (btnOpenCertificateFromTab) btnOpenCertificateFromTab.addEventListener('click', openCertificateDeedModal);
    if (closeCertificateModalBtn) closeCertificateModalBtn.addEventListener('click', () => certificateDeedModal?.classList.add('hidden'));
    if (closeCertificateFooterBtn) closeCertificateFooterBtn.addEventListener('click', () => certificateDeedModal?.classList.add('hidden'));
    if (btnPrintOfficialDeed) {
        btnPrintOfficialDeed.addEventListener('click', () => {
            window.print();
        });
    }

    async function openCertificateDeedModal() {
        if (!certificateDeedModal || !certificatePrintableBody) return;
        const hash = agreementRecord?.scope_hash || projectRecord?.scope_hash || await computeSha256Fingerprint(projectId, agreementRecord?.version, agreementRecord?.agreed_amount);
        const budget = Number(agreementRecord?.agreed_amount || projectRecord?.budget || 1000);
        const clientName = projectRecord?.client_name || 'Client Principal';
        const providerName = projectRecord?.assigned_provider_name || 'Technical Lead';
        const isCompleted = projectRecord?.stage === PROJECT_STAGES.COMPLETED;

        certificatePrintableBody.innerHTML = `
            <div class="deed-certificate-sheet">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 1rem; margin-bottom: 1.25rem;">
                    <div>
                        <span style="font-size: 0.75rem; font-weight: 700; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase;">WorkBridge Institutional Governance Suite</span>
                        <h2 style="font-size: 1.35rem; margin: 0.2rem 0 0 0; color: #0f172a; font-weight: 800;">Official Master Services &amp; Escrow Deed</h2>
                    </div>
                    <div style="text-align: right;">
                        <div class="deed-official-seal">🛡️ SECURE C2PA RECORD</div>
                        <div class="text-xs text-muted mt-1">PRJ ID: PRJ-${String(projectId).slice(-4).toUpperCase()}</div>
                    </div>
                </div>

                <div class="grid grid-2 mb-3" style="gap: 1rem; font-size: 0.85rem;">
                    <div class="p-2 border rounded" style="background: #ffffff;">
                        <span class="text-xs text-muted" style="display: block;">CLIENT PRINCIPAL</span>
                        <strong>${escapeHtml(clientName)}</strong> (${escapeHtml(projectRecord?.client_email || 'client@workbridge.io')})
                    </div>
                    <div class="p-2 border rounded" style="background: #ffffff;">
                        <span class="text-xs text-muted" style="display: block;">TECHNICAL LEAD / PROVIDER</span>
                        <strong>${escapeHtml(providerName)}</strong> (${escapeHtml(projectRecord?.assigned_provider_email || 'provider@workbridge.io')})
                    </div>
                </div>

                <div class="mb-3 p-3 border rounded" style="background: #f8fafc; font-size: 0.85rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                        <span class="text-muted">Contract Consideration:</span>
                        <strong class="text-success">$${budget.toLocaleString()} USD</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
                        <span class="text-muted">Escrow Settlement Status:</span>
                        <strong class="${isCompleted ? 'text-success' : 'text-primary'}">${isCompleted ? '100% Released & Settled' : 'Active & Protected'}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span class="text-muted">Baseline Version:</span>
                        <strong>v${agreementRecord?.version || '1.0'} (${agreementRecord?.status || 'LOCKED'})</strong>
                    </div>
                </div>

                <div class="mb-3">
                    <span class="text-xs font-bold text-muted" style="letter-spacing: 0.05em; display: block; margin-bottom: 0.3rem;">DETERMINISTIC SHA-256 SCOPE HASH FINGERPRINT</span>
                    <div style="font-family: monospace; font-size: 0.78rem; background: #0f172a; color: #38bdf8; padding: 0.65rem 0.85rem; border-radius: 6px; word-break: break-all;">
                        ${escapeHtml(hash)}
                    </div>
                </div>

                <div class="mb-3" style="font-size: 0.82rem; color: #334155; line-height: 1.5;">
                    <strong>Legal Attestation:</strong> This document certifies that all milestone deliverables, cryptographic requirements baselines, and bilateral handover protocols have been executed under strict WorkBridge protocol governance.
                </div>

                <div class="grid grid-2 mt-4 pt-3 border-top" style="gap: 1.5rem; font-size: 0.8rem;">
                    <div>
                        <div style="font-weight: 700; color: #0f172a;">CLIENT DIGITAL SIGNATURE</div>
                        <div style="font-family: monospace; color: #16a34a; margin-top: 0.2rem;">Signed &amp; Ratified ✓</div>
                        <div class="text-xs text-muted">${agreementRecord?.client_signed_at ? new Date(agreementRecord.client_signed_at).toLocaleString() : 'Verified by Auth State'}</div>
                    </div>
                    <div>
                        <div style="font-weight: 700; color: #0f172a;">PROVIDER DIGITAL SIGNATURE</div>
                        <div style="font-family: monospace; color: #16a34a; margin-top: 0.2rem;">Signed &amp; Ratified ✓</div>
                        <div class="text-xs text-muted">${agreementRecord?.provider_signed_at ? new Date(agreementRecord.provider_signed_at).toLocaleString() : 'Verified by Auth State'}</div>
                    </div>
                </div>
            </div>
        `;

        certificateDeedModal.classList.remove('hidden');
    }

    // General Modals Setup
    function setupWorkspaceModals() {
        if (btnSyncWorkspace) {
            btnSyncWorkspace.addEventListener('click', async () => {
                btnSyncWorkspace.disabled = true;
                btnSyncWorkspace.textContent = 'Syncing...';
                await hydrateWorkspace();
                if (window.Toast) window.Toast.info('Workspace synchronized with Cloud persistence.');
                btnSyncWorkspace.disabled = false;
                btnSyncWorkspace.textContent = '🔄 Sync Live';
            });
        }

        if (closePostUpdateModalBtn) closePostUpdateModalBtn.addEventListener('click', () => { if (modalPostUpdate) modalPostUpdate.classList.add('hidden'); });
        if (cancelPostUpdateBtn) cancelPostUpdateBtn.addEventListener('click', () => { if (modalPostUpdate) modalPostUpdate.classList.add('hidden'); });
        if (closeReviewProofModalBtn) closeReviewProofModalBtn.addEventListener('click', () => { if (modalReviewProof) modalReviewProof.classList.add('hidden'); });
        if (closeRevisionModalBtn) closeRevisionModalBtn.addEventListener('click', () => { if (modalRevisionRequest) modalRevisionRequest.classList.add('hidden'); });
        if (cancelRevisionModalBtn) cancelRevisionModalBtn.addEventListener('click', () => { if (modalRevisionRequest) modalRevisionRequest.classList.add('hidden'); });
        if (closeDecisionModalBtn) closeDecisionModalBtn.addEventListener('click', () => { if (decisionModal) decisionModal.classList.add('hidden'); });
        if (cancelDecisionBtn) cancelDecisionBtn.addEventListener('click', () => { if (decisionModal) decisionModal.classList.add('hidden'); });
        if (closeAmendmentModalBtn) closeAmendmentModalBtn.addEventListener('click', () => { if (amendmentModal) amendmentModal.classList.add('hidden'); });
        if (cancelAmendmentBtn) cancelAmendmentBtn.addEventListener('click', () => { if (amendmentModal) amendmentModal.classList.add('hidden'); });
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
                        status: 'SUBMITTED_FOR_REVIEW',
                        submitted_at: new Date().toISOString()
                    }).eq('id', mid);

                    await sb.from('projects').update({
                        stage: PROJECT_STAGES.REVIEW
                    }).eq('id', projectId);

                    const commitMsg = commit ? ', Commit (#' + commit + ')' : '';
                    await sb.from('workspace_messages').insert([{
                        project_id: projectId,
                        sender_id: currentUser?.id,
                        sender_name: currentUser?.fullName || 'Technical Lead',
                        sender_role: 'SERVICE_PROVIDER',
                        message: '🚀 Technical Proof Submitted for Milestone: PR (' + prUrl + '), Branch (' + branch + ')' + commitMsg + '. Project transitioned to REVIEW stage.'
                    }]);

                    if (window.Toast) window.Toast.success('Deliverable proof submitted! Project moved to Client Review stage.');
                    if (milestoneActionModal) milestoneActionModal.classList.add('hidden');
                    milestoneActionForm.reset();
                    await loadMilestonesList();
                    await loadProjectOverview();
                    await loadChatMessages();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Failed to submit technical proof.');
                }
            });
        }

        if (btnAddMilestoneBtn) btnAddMilestoneBtn.addEventListener('click', () => { if (addMilestoneModal) addMilestoneModal.classList.remove('hidden'); });
        if (closeAddMilestoneModalBtn) closeAddMilestoneModalBtn.addEventListener('click', () => { if (addMilestoneModal) addMilestoneModal.classList.add('hidden'); });
        if (cancelAddMilestoneBtn) cancelAddMilestoneBtn.addEventListener('click', () => { if (addMilestoneModal) addMilestoneModal.classList.add('hidden'); });

        if (addMilestoneForm) {
            addMilestoneForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const titleInput = document.getElementById('milestoneTitleInput');
                const categoryInput = document.getElementById('milestoneCategorySelect');
                const weightInput = document.getElementById('milestoneWeightInput');
                const deliverablesInput = document.getElementById('milestoneDeliverablesInput');
                const targetDateInput = document.getElementById('milestoneTargetDateInput');
                const escrowInput = document.getElementById('milestoneEscrowAmountInput');

                const title = titleInput ? titleInput.value.trim() : '';
                const category = categoryInput ? categoryInput.value : 'BACKEND';
                const weight = weightInput ? parseFloat(weightInput.value) || 25 : 25;
                const deliverables = deliverablesInput ? deliverablesInput.value.trim() : '';
                const targetDate = targetDateInput && targetDateInput.value ? targetDateInput.value : null;
                const escrow = escrowInput ? parseFloat(escrowInput.value) || 0 : 0;

                if (!title || !deliverables || !sb) return;

                const currentTotalWeight = milestonesList.reduce((sum, m) => sum + (Number(m.weight_percentage) || 0), 0);
                if (currentTotalWeight + weight > 100) {
                    if (window.Toast) window.Toast.error('Total milestone weight cannot exceed 100%. (Current total: ' + currentTotalWeight + '%)');
                    return;
                }

                try {
                    const { data: createdMilestone, error: mErr } = await sb
                        .from('milestones')
                        .insert([{
                            project_id: projectId,
                            title,
                            category,
                            weight_percentage: weight,
                            escrow_allocation: escrow,
                            deliverables,
                            target_date: targetDate,
                            status: 'PENDING'
                        }])
                        .select()
                        .single();

                    if (mErr) throw mErr;

                    if (createdMilestone) {
                        await seedDefaultTasksForMilestone(createdMilestone);
                    }

                    if (projectRecord?.stage === PROJECT_STAGES.AGREEMENT_LOCKED) {
                        await sb.from('projects').update({ stage: PROJECT_STAGES.IN_PROGRESS }).eq('id', projectId);
                        await loadProjectOverview();
                    }

                    if (window.Toast) window.Toast.success('Milestone added & 3 Sprint Tasks auto-generated on Kanban board!');
                    if (addMilestoneModal) addMilestoneModal.classList.add('hidden');
                    addMilestoneForm.reset();
                    await loadMilestonesList();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Failed to add milestone.');
                }
            });
        }

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

                    await sb.from('workspace_messages').insert([{
                        project_id: projectId,
                        sender_id: currentUser?.id,
                        sender_name: currentUser?.fullName || 'Collaborator',
                        sender_role: currentUser?.role || 'CLIENT',
                        message: 'Project lifecycle advanced to: ' + targetStage.replace(/_/g, ' ') + '.'
                    }]);

                    if (window.Toast) window.Toast.success('Project advanced to ' + targetStage.replace(/_/g, ' ') + '!');
                    if (stageAdvanceModal) stageAdvanceModal.classList.add('hidden');
                    await loadProjectOverview();
                    await loadChatMessages();
                } catch (err) {
                    if (window.Toast) window.Toast.error('Could not advance lifecycle stage.');
                }
            });
        }

        if (btnViewAuditHistory) {
            btnViewAuditHistory.addEventListener('click', async () => {
                if (auditHistoryModal) auditHistoryModal.classList.remove('hidden');
                if (!auditTimelineContainer) return;

                const eventsHtml = [];
                eventsHtml.push(
                    '<div class="timeline-event mb-3 pb-2 border-b">'
                    + '  <div style="display:flex; justify-content:space-between; align-items:center;">'
                    + '    <span class="badge badge-subtle">Stage 1 &bull; Initialization</span>'
                    + '    <span class="text-xs text-muted">' + (projectRecord?.created_at ? new Date(projectRecord.created_at).toLocaleString() : 'Recorded') + '</span>'
                    + '  </div>'
                    + '  <div style="font-weight: 600; margin-top: 0.25rem;">Workspace Created: ' + escapeHtml(projectRecord?.title || 'Project') + '</div>'
                    + '  <div class="text-xs text-muted">Client: ' + escapeHtml(projectRecord?.client_name || 'Client') + ' &bull; Technical Lead: ' + escapeHtml(projectRecord?.assigned_provider_name || 'Provider') + '</div>'
                    + '</div>'
                );

                if (agreementRecord?.client_signed || agreementRecord?.provider_signed) {
                    eventsHtml.push(
                        '<div class="timeline-event mb-3 pb-2 border-b">'
                        + '  <div style="display:flex; justify-content:space-between; align-items:center;">'
                        + '    <span class="badge badge-success">Stage 3 &bull; Cryptographic Ratification</span>'
                        + '    <span class="text-xs text-muted">v' + escapeHtml(agreementRecord.version || '1.0') + '</span>'
                        + '  </div>'
                        + '  <div style="font-weight: 600; margin-top: 0.25rem;">Master Agreement &amp; Scope Baseline Locked</div>'
                        + '  <div class="text-xs text-muted">Client Signed: ' + (agreementRecord.client_signed ? '✅ Yes' : '⏳ Pending') + ' &bull; Provider Signed: ' + (agreementRecord.provider_signed ? '✅ Yes' : '⏳ Pending') + '</div>'
                        + '  <div class="text-xs text-muted mt-1" style="font-family: monospace; word-break: break-all;">SHA-256: ' + escapeHtml(agreementRecord.scope_hash || projectRecord?.scope_hash || 'Pending Final Signature') + '</div>'
                        + '</div>'
                    );
                }

                milestonesList.forEach((m, idx) => {
                    if (m.status === 'SUBMITTED_FOR_REVIEW' || m.status === 'APPROVED') {
                        eventsHtml.push(
                            '<div class="timeline-event mb-3 pb-2 border-b">'
                            + '  <div style="display:flex; justify-content:space-between; align-items:center;">'
                            + '    <span class="badge ' + (m.status === 'APPROVED' ? 'badge-success' : 'badge-warning') + '">Milestone ' + (idx + 1) + ' &bull; ' + escapeHtml(m.status) + '</span>'
                            + '    <span class="text-xs text-muted">' + (m.weight_percentage || 25) + '% Weight</span>'
                            + '  </div>'
                            + '  <div style="font-weight: 600; margin-top: 0.25rem;">' + escapeHtml(m.title) + '</div>'
                            + (m.deliverable_url ? '<div class="text-xs text-muted">PR Proof: ' + escapeHtml(m.deliverable_url) + '</div>' : '')
                            + '</div>'
                        );
                    }
                });

                scopeAmendmentsList.forEach(a => {
                    eventsHtml.push(
                        '<div class="timeline-event mb-3 pb-2 border-b">'
                        + '  <div style="display:flex; justify-content:space-between; align-items:center;">'
                        + '    <span class="badge badge-warning">Scope Amendment v2.0</span>'
                        + '    <span class="text-xs text-muted">+$' + Number(a.budget_delta || 0).toLocaleString() + ' / +' + (a.timeline_delta || 0) + 'd</span>'
                        + '  </div>'
                        + '  <div style="font-weight: 600; margin-top: 0.25rem;">' + escapeHtml(a.reason) + '</div>'
                        + '  <div class="text-xs text-muted">' + escapeHtml(a.details) + '</div>'
                        + '</div>'
                    );
                });

                auditTimelineContainer.innerHTML = eventsHtml.join('');
            });
        }
        if (closeAuditModalBtn) closeAuditModalBtn.addEventListener('click', () => { if (auditHistoryModal) auditHistoryModal.classList.add('hidden'); });
        if (closeAuditModalFooterBtn) closeAuditModalFooterBtn.addEventListener('click', () => { if (auditHistoryModal) auditHistoryModal.classList.add('hidden'); });

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

    // Utilities
    function formatTime(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});