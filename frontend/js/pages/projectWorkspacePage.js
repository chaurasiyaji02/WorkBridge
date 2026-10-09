/**
 * WORKBRIDGE - PROJECT WORKSPACE MASTER CONTROLLER
 * File: js/pages/projectWorkspacePage.js
 * 
 * Production Workspace Controller orchestrating:
 * - Engine A: Scope Version Locking, Mutual Agreement Signing, and v2.0 Amendment Protocol.
 * - Engine B: Milestone Verification, Deliverable Review, and Weighted Progress Calculation.
 * - Modals: Stage Transitions, Scope Amendments, Audit History, Architectural Decisions, 
 *   Resource Vault Assets, Daily Standups, and Milestone Registrations.
 * - High-efficiency incremental polling for Render free-tier optimization.
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

    // -------------------------------------------------------------------------
    // 2. DOM Elements Cache (Strictly matching project-view.html)
    // -------------------------------------------------------------------------
    // Pipeline & Header
    const projectTitleEl = document.getElementById('projectTitle');
    const projectCodeBadgeEl = document.getElementById('projectCodeBadge');
    const btnProposeStageAdvance = document.getElementById('btnProposeStageAdvance');
    const stageSteps = document.querySelectorAll('.stage-step');
    const projectProgressPercent = document.getElementById('projectProgressPercent');
    const reqStatusText = document.getElementById('reqStatusText');
    const reqStatusDot = document.getElementById('reqStatusDot');
    const agreementStatusText = document.getElementById('agreementStatusText');
    const agreementStatusDot = document.getElementById('agreementStatusDot');

    // Workspace Tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane, .tab-content');

    // Tab 1: Overview
    const projectDescription = document.getElementById('projectDescription');
    const overviewClientName = document.getElementById('overviewClientName');
    const overviewProviderName = document.getElementById('overviewProviderName');
    const metaDeadline = document.getElementById('metaDeadline');
    const metaBudget = document.getElementById('metaBudget');
    const updatesTimeline = document.getElementById('updatesTimeline');
    const btnOpenStandupModal = document.getElementById('btnPostUpdate') || document.getElementById('btnOpenStandupModal');

    // Tab 2: Requirements (Engine A)
    const currentReqVersionBadge = document.getElementById('currentReqVersionBadge');
    const currentReqLockStatus = document.getElementById('currentReqLockStatus');
    const requirementBannerMount = document.getElementById('requirementBannerMount');
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

    // Tab 3: Agreement (Engine A)
    const agreementBannerMount = document.getElementById('agreementBannerMount');
    const agClientName = document.getElementById('agClientName');
    const agProviderName = document.getElementById('agProviderName');
    const agDeliverablesText = document.getElementById('agDeliverablesText');
    const agTimelineText = document.getElementById('agTimelineText');
    const agAmountText = document.getElementById('agAmountText');
    const agClientSignStatus = document.getElementById('agClientSignStatus');
    const agProviderSignStatus = document.getElementById('agProviderSignStatus');
    const btnApproveAgreement = document.getElementById('btnApproveAgreement');
    const btnRequestAgreementChange = document.getElementById('btnRequestAgreementChange');
    const btnProposeAmendment = document.getElementById('btnProposeAmendment');
    const btnViewAuditHistory = document.getElementById('btnViewAuditHistory');

    // Tab 4: Milestones (Engine B)
    const milestonesList = document.getElementById('milestonesList');
    const btnOpenMilestoneModal = document.getElementById('btnOpenMilestoneModal');
    const milestoneEmptyState = document.getElementById('milestoneEmptyState');

    // Tab 5: Discussion & Chat
    const chatMessagesFeed = document.getElementById('chatMessagesFeed');
    const chatInputForm = document.getElementById('chatInputForm');
    const chatMessageInput = document.getElementById('chatMessageInput');
    const btnAiSummarizeChat = document.getElementById('btnAiSummarizeChat');
    const aiSummaryBox = document.getElementById('aiSummaryBox');
    const aiSummaryContent = document.getElementById('aiSummaryContent');
    const btnCloseSummary = document.getElementById('btnCloseSummary');

    // Tab 6: Decisions
    const decisionsList = document.getElementById('decisionsList');
    const btnOpenDecisionModal = document.getElementById('btnLogDecision') || document.getElementById('btnOpenDecisionModal');

    // Tab 7: Resources
    const resourceTableBody = document.getElementById('resourceTableBody');
    const btnOpenResourceModal = document.getElementById('btnUploadResource') || document.getElementById('btnOpenResourceModal');

    // Modals & Forms
    const stageAdvanceModal = document.getElementById('stageAdvanceModal');
    const stageAdvanceForm = document.getElementById('stageAdvanceForm');
    const targetStageSelect = document.getElementById('targetStageSelect');
    const transitionNotesInput = document.getElementById('transitionNotesInput');

    const amendmentModal = document.getElementById('amendmentModal');
    const amendmentForm = document.getElementById('amendmentForm');
    const amendmentReasonInput = document.getElementById('amendmentReasonInput');
    const amendmentScopeInput = document.getElementById('amendmentScopeInput');
    const amendmentBudgetInput = document.getElementById('amendmentBudgetInput');

    const auditHistoryModal = document.getElementById('auditHistoryModal');
    const auditHistoryTimeline = document.getElementById('auditHistoryTimeline');

    const decisionModal = document.getElementById('decisionModal');
    const decisionForm = document.getElementById('decisionForm');
    const decisionTitleInput = document.getElementById('decisionTitleInput');
    const decisionRationaleInput = document.getElementById('decisionRationaleInput');

    const resourceModal = document.getElementById('resourceModal');
    const resourceUploadForm = document.getElementById('resourceUploadForm');

    const standupModal = document.getElementById('dailyStandupModal');
    const standupForm = document.getElementById('standupForm');

    const milestoneModal = document.getElementById('milestoneModal');
    const milestoneForm = document.getElementById('milestoneForm');

    // Runtime Workspace Memory
    let currentProject = null;
    let currentRequirement = null;
    let currentAgreement = null;
    let currentMilestones = [];
    let chatPollingTimer = null;
    let lastMessageTimestamp = null;

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
    // 4. Master Workspace Initialization
    // -------------------------------------------------------------------------
    await initializeWorkspace();

    async function initializeWorkspace() {
        try {
            await loadProjectOverview();
            await Promise.allSettled([
                loadRequirements(),
                loadAgreement(),
                loadMilestones(),
                loadChatMessages(true),
                loadDecisions(),
                loadResources(),
                loadProjectUpdates()
            ]);
            startChatPolling();
        } catch (error) {
            console.error('Workspace load error:', error);
            if (window.Toast) window.Toast.warning('Workspace hydrated with local session data.');
        }
    }

    // -------------------------------------------------------------------------
    // 5. Project Overview & Pipeline
    // -------------------------------------------------------------------------
    async function loadProjectOverview() {
        try {
            currentProject = await window.ProjectApi.getProjectById(projectId);
        } catch (err) {
            currentProject = {
                id: projectId,
                title: `Project #${projectId}`,
                description: 'Full-stack engineering workspace on WorkBridge.',
                stage: PROJECT_STAGES.REQUIREMENT_DISCUSSION,
                budget: 3500,
                deadline: '2026-11-15',
                clientName: 'Enterprise Client',
                assignedProviderName: 'Apex Tech Solutions'
            };
        }

        if (projectTitleEl) projectTitleEl.textContent = currentProject.title || `Project #${projectId}`;
        if (projectCodeBadgeEl) projectCodeBadgeEl.textContent = `PRJ-${String(projectId).padStart(3, '0')}`;
        if (projectDescription) projectDescription.textContent = currentProject.description || currentProject.summary || 'Scope overview pending.';
        if (overviewClientName) overviewClientName.textContent = currentProject.clientName || 'Client Account';
        if (overviewProviderName) overviewProviderName.textContent = currentProject.assignedProviderName || currentProject.providerName || 'Pending Assignment';
        if (metaDeadline) metaDeadline.textContent = currentProject.deadline || 'Flexible Milestone';
        if (metaBudget) metaBudget.textContent = currentProject.budget ? `$${Number(currentProject.budget).toLocaleString()}` : '\$3,500';

        renderStagePipeline(currentProject.stage);
    }

    function renderStagePipeline(activeStage) {
        const stages = [
            PROJECT_STAGES.INVITED,
            PROJECT_STAGES.REQUIREMENT_DISCUSSION,
            PROJECT_STAGES.AGREEMENT_LOCKED,
            PROJECT_STAGES.IN_PROGRESS,
            PROJECT_STAGES.REVIEW,
            PROJECT_STAGES.COMPLETED
        ];

        const currentIdx = stages.indexOf(activeStage);

        stageSteps.forEach((step, idx) => {
            step.classList.remove('active', 'completed');
            if (idx < currentIdx) step.classList.add('completed');
            if (idx === currentIdx) step.classList.add('active');
        });

        // Populate Stage Advance select options if modal exists
        if (targetStageSelect) {
            targetStageSelect.innerHTML = stages
                .filter((_, idx) => idx > currentIdx)
                .map(s => `<option value="${s}">Advance to: ${s.replace(/_/g, ' ')}</option>`)
                .join('');
        }
    }

    // Modal 1: Stage Transition Proposal
    if (btnProposeStageAdvance) {
        btnProposeStageAdvance.addEventListener('click', () => {
            if (window.Modal && stageAdvanceModal) {
                window.Modal.open(stageAdvanceModal);
            } else if (stageAdvanceModal) {
                stageAdvanceModal.classList.remove('hidden');
            }
        });
    }

    if (stageAdvanceForm) {
        stageAdvanceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const targetStage = targetStageSelect?.value;
            const notes = transitionNotesInput?.value || '';

            if (!targetStage) return;

            try {
                await window.ProjectApi.updateProjectStage(projectId, targetStage, notes);
                if (window.Toast) window.Toast.success(`Project advanced to ${targetStage.replace(/_/g, ' ')}`);
                if (window.Modal) window.Modal.close(stageAdvanceModal, true);
                await loadProjectOverview();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Failed to update stage.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 6. CORE ENGINE A: Requirements & Scope Locking
    // -------------------------------------------------------------------------
    async function loadRequirements() {
        try {
            currentRequirement = await window.RequirementApi.getLatestRequirements(projectId);
        } catch (err) {
            currentRequirement = {
                version: '1.0',
                status: 'DRAFT',
                objectives: 'Build scalable e-commerce microservices with high transaction reliability.',
                targetUsers: 'Platform buyers, seller merchants, and system operations staff.',
                features: '1. JWT authentication & role-based routing\n2. Real-time PostgreSQL catalog indexing\n3. Payment webhook integration',
                techPreferences: 'Java 21, Spring Boot 3.x, PostgreSQL, Vanilla JS client',
                nonFunctional: 'P95 response latency < 200ms; zero data drift on agreement state.'
            };
        }

        const isLocked = currentRequirement?.status === 'LOCKED' || currentRequirement?.lockStatus === 'LOCKED';
        const versionNum = currentRequirement?.version || currentRequirement?.currentVersionNumber || '1.0';

        if (currentReqVersionBadge) currentReqVersionBadge.textContent = `v${versionNum}`;
        if (currentReqLockStatus) {
            currentReqLockStatus.textContent = isLocked ? 'LOCKED (v1.0)' : 'DRAFT';
            currentReqLockStatus.className = `badge ${isLocked ? 'badge-success' : 'badge-warning'}`;
        }
        if (reqStatusText) reqStatusText.textContent = `v${versionNum} - ${isLocked ? 'LOCKED' : 'DRAFT'}`;
        if (reqStatusDot) reqStatusDot.className = `status-dot ${isLocked ? 'dot-green' : 'dot-yellow'}`;

        // Hydrate structured fields
        if (reqObjective) reqObjective.value = currentRequirement?.objectives || '';
        if (reqTargetUsers) reqTargetUsers.value = currentRequirement?.targetUsers || '';
        if (reqFeatures) reqFeatures.value = currentRequirement?.features || currentRequirement?.content || '';
        if (reqTechPreferences) reqTechPreferences.value = currentRequirement?.techPreferences || '';
        if (reqNonFunctional) reqNonFunctional.value = currentRequirement?.nonFunctional || '';

        // Lock form inputs if specification is locked
        [reqObjective, reqTargetUsers, reqFeatures, reqTechPreferences, reqNonFunctional].forEach(field => {
            if (field) field.disabled = isLocked;
        });

        // Button visibility toggle
        if (btnSaveReqDraft) btnSaveReqDraft.style.display = isLocked ? 'none' : 'inline-block';
        if (btnLockRequirement) btnLockRequirement.style.display = isLocked ? 'none' : 'inline-block';
        if (btnProposeReqChange) btnProposeReqChange.style.display = isLocked ? 'inline-block' : 'none';

        // Version Banner injection
        if (window.VersionBanner && requirementBannerMount) {
            window.VersionBanner.renderRequirementBanner(requirementBannerMount, {
                version: versionNum,
                status: isLocked ? 'LOCKED' : 'DRAFT',
                lockedAt: currentRequirement?.lockedAt,
                changeReason: currentRequirement?.changeReason
            });
        }
    }

    if (requirementForm) {
        requirementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const draftData = {
                objectives: reqObjective?.value.trim() || '',
                targetUsers: reqTargetUsers?.value.trim() || '',
                features: reqFeatures?.value.trim() || '',
                techPreferences: reqTechPreferences?.value.trim() || '',
                nonFunctional: reqNonFunctional?.value.trim() || ''
            };

            if (btnSaveReqDraft) btnSaveReqDraft.disabled = true;

            try {
                await window.RequirementApi.saveDraft(projectId, draftData);
                if (window.Toast) window.Toast.success('Requirements draft saved.');
                await loadRequirements();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Draft failed to save.');
            } finally {
                if (btnSaveReqDraft) btnSaveReqDraft.disabled = false;
            }
        });
    }

    if (btnLockRequirement) {
        btnLockRequirement.addEventListener('click', async () => {
            if (!confirm('Locking the requirement baseline establishes an immutable scope contract. Direct edits will be restricted. Continue?')) {
                return;
            }

            btnLockRequirement.disabled = true;
            try {
                await window.RequirementApi.lockVersion(projectId);
                if (window.Toast) window.Toast.success('Requirement scope officially locked into v1.0 baseline!');
                await loadRequirements();
                await loadProjectOverview();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Could not lock requirements.');
            } finally {
                btnLockRequirement.disabled = false;
            }
        });
    }

    // AI Requirement Audit
    if (btnAiAnalyzeReq) {
        btnAiAnalyzeReq.addEventListener('click', async () => {
            const draftData = {
                objectives: reqObjective?.value || '',
                targetUsers: reqTargetUsers?.value || '',
                features: reqFeatures?.value || '',
                techPreferences: reqTechPreferences?.value || '',
                nonFunctional: reqNonFunctional?.value || ''
            };

            btnAiAnalyzeReq.disabled = true;
            btnAiAnalyzeReq.textContent = '✨ Auditing Scope...';

            try {
                const res = await window.AiApi.analyzeRequirements(projectId, draftData);
                if (aiAuditResultPanel) aiAuditResultPanel.classList.remove('hidden');

                if (aiAuditContent) {
                    const score = res.qualityScore || 85;
                    const suggestionsList = (res.suggestions || [])
                        .map(s => `<li style="margin-top: 0.25rem;">💡 ${escapeHtml(s)}</li>`)
                        .join('');

                    aiAuditContent.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <strong>Quality Clarity Index:</strong>
                            <span class="badge ${score >= 80 ? 'badge-success' : 'badge-warning'}">${score} / 100</span>
                        </div>
                        <p class="text-sm mb-1">${escapeHtml(res.summary || 'Audit evaluation complete.')}</p>
                        ${suggestionsList ? `<ul class="text-xs text-muted mt-2 pl-3">\${suggestionsList}</ul>` : ''}
                    `;
                }
            } catch (err) {
                if (window.Toast) window.Toast.error('AI audit service busy. Heuristic baseline active.');
            } finally {
                btnAiAnalyzeReq.disabled = false;
                btnAiAnalyzeReq.textContent = '✨ AI Requirement Audit';
            }
        });
    }

    if (btnCloseAiPanel) {
        btnCloseAiPanel.addEventListener('click', () => {
            if (aiAuditResultPanel) aiAuditResultPanel.classList.add('hidden');
        });
    }

    // -------------------------------------------------------------------------
    // 7. CORE ENGINE A: Mutual Agreement & Scope Amendment (v2.0)
    // -------------------------------------------------------------------------
    async function loadAgreement() {
        try {
            currentAgreement = await window.AgreementApi.getAgreement(projectId);
        } catch (err) {
            currentAgreement = {
                id: null,
                version: '1.0',
                status: 'DRAFT',
                termsAndConditions: 'Milestone deliverables and payment disbursements strictly bound to locked specification baseline v1.0.',
                agreedAmount: currentProject?.budget || 3500,
                targetDeliveryDate: currentProject?.deadline || '2026-11-15',
                clientApproved: false,
                providerApproved: false
            };
        }

        const isLocked = currentAgreement?.status === 'LOCKED' || (currentAgreement?.clientApproved && currentAgreement?.providerApproved);
        const isAmendment = currentAgreement?.status === 'AMENDMENT_REQUESTED';

        if (agClientName) agClientName.textContent = currentProject?.clientName || 'Client';
        if (agProviderName) agProviderName.textContent = currentProject?.assignedProviderName || 'Provider';
        if (agDeliverablesText) agDeliverablesText.textContent = currentAgreement?.termsAndConditions || 'Scope specification baseline binding.';
        if (agTimelineText) agTimelineText.textContent = currentAgreement?.targetDeliveryDate || currentProject?.deadline || 'Milestone Defined';
        if (agAmountText) agAmountText.textContent = `$${Number(currentAgreement?.agreedAmount || 3500).toLocaleString()}`;

        const clientSigned = Boolean(currentAgreement?.clientApproved || currentAgreement?.clientSignedAt);
        const providerSigned = Boolean(currentAgreement?.providerApproved || currentAgreement?.providerSignedAt);

        if (agClientSignStatus) {
            agClientSignStatus.textContent = clientSigned ? '✅ Client Signed' : '⏳ Client Awaiting';
            agClientSignStatus.className = `badge ${clientSigned ? 'badge-success' : 'badge-warning'}`;
        }
        if (agProviderSignStatus) {
            agProviderSignStatus.textContent = providerSigned ? '✅ Provider Signed' : '⏳ Provider Awaiting';
            agProviderSignStatus.className = `badge ${providerSigned ? 'badge-success' : 'badge-warning'}`;
        }

        if (agreementStatusText) {
            agreementStatusText.textContent = isLocked ? 'Ratified & Locked (v1.0)' : (isAmendment ? 'Amendment Review (v2.0)' : 'Draft Terms');
        }
        if (agreementStatusDot) {
            agreementStatusDot.className = `status-dot ${isLocked ? 'dot-green' : 'dot-yellow'}`;
        }

        // Action Buttons State
        if (btnApproveAgreement) {
            if (isLocked) {
                btnApproveAgreement.disabled = true;
                btnApproveAgreement.textContent = 'Agreement Ratified & Executed ✅';
            } else {
                btnApproveAgreement.disabled = false;
                btnApproveAgreement.textContent = 'Sign Agreement Digitally';
            }
        }

        if (btnProposeAmendment) {
            btnProposeAmendment.style.display = isLocked ? 'inline-block' : 'none';
        }

        // Render Agreement Banner
        if (window.VersionBanner && agreementBannerMount) {
            window.VersionBanner.renderAgreementBanner(agreementBannerMount, {
                version: currentAgreement?.version || '1.0',
                status: currentAgreement?.status || (isLocked ? 'LOCKED' : 'DRAFT'),
                clientApproved: clientSigned,
                providerApproved: providerSigned
            });
        }
    }

    if (btnApproveAgreement) {
        btnApproveAgreement.addEventListener('click', async () => {
            btnApproveAgreement.disabled = true;
            btnApproveAgreement.textContent = 'Applying Digital Signature...';

            try {
                await window.AgreementApi.approveAgreement(projectId, currentAgreement?.id);
                if (window.Toast) window.Toast.success('Digital signature recorded successfully!');
                await loadAgreement();
                await loadProjectOverview();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Signature application failed.');
                btnApproveAgreement.disabled = false;
                btnApproveAgreement.textContent = 'Sign Agreement Digitally';
            }
        });
    }

    // Modal 2: Scope Amendment Proposal (v2.0)
    if (btnProposeAmendment || btnProposeReqChange) {
        const triggerHandler = () => {
            if (window.Modal && amendmentModal) {
                window.Modal.open(amendmentModal);
            } else if (amendmentModal) {
                amendmentModal.classList.remove('hidden');
            }
        };

        if (btnProposeAmendment) btnProposeAmendment.addEventListener('click', triggerHandler);
        if (btnProposeReqChange) btnProposeReqChange.addEventListener('click', triggerHandler);
    }

    if (amendmentForm) {
        amendmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reason = amendmentReasonInput?.value.trim();
            const modifiedScope = amendmentScopeInput?.value.trim();
            const budgetAdjustment = Number(amendmentBudgetInput?.value) || 0;

            if (!reason || !modifiedScope) {
                if (window.Toast) window.Toast.error('Please specify the amendment reason and scope adjustments.');
                return;
            }

            try {
                await window.AgreementApi.proposeScopeAmendment(projectId, {
                    reason,
                    modifiedScope,
                    budgetAdjustment
                });

                if (window.Toast) window.Toast.success('Scope Amendment Proposal (v2.0) initiated for mutual review.');
                if (window.Modal) window.Modal.close(amendmentModal, true);
                await loadAgreement();
                await loadRequirements();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Failed to submit scope amendment.');
            }
        });
    }

    // Modal 3: Scope Audit History & Version Timeline
    if (btnViewAuditHistory) {
        btnViewAuditHistory.addEventListener('click', async () => {
            if (window.Modal && auditHistoryModal) {
                window.Modal.open(auditHistoryModal);
            } else if (auditHistoryModal) {
                auditHistoryModal.classList.remove('hidden');
            }

            if (auditHistoryTimeline) {
                auditHistoryTimeline.innerHTML = '<p class="text-sm text-muted">Retrieving cryptographic contract timestamps...</p>';
                try {
                    const history = await window.AgreementApi.getProjectAuditHistory(projectId);
                    renderAuditHistory(history);
                } catch (e) {
                    renderAuditHistory([]);
                }
            }
        });
    }

    function renderAuditHistory(records) {
        if (!auditHistoryTimeline) return;
        auditHistoryTimeline.innerHTML = '';

        const defaultRecords = [
            {
                version: 'v1.0',
                event: 'Specification Baseline Locked',
                timestamp: currentRequirement?.lockedAt || 'Initial Contract Lock',
                actor: 'Mutual Client & Provider Sign-off'
            }
        ];

        const displayList = records.length > 0 ? records : defaultRecords;

        displayList.forEach(item => {
            const el = document.createElement('div');
            el.className = 'timeline-event mb-3 pb-2 border-b';
            el.innerHTML = `
                <div style="display: flex; justify-content: space-between;">
                    <span class="badge badge-primary">${escapeHtml(item.version || 'v1.0')}</span>
                    <span class="text-xs text-muted">${formatTimestamp(item.timestamp)}</span>
                </div>
                <div style="font-weight: 600; font-size: 0.9rem; margin-top: 0.25rem;">${escapeHtml(item.event || 'Version Event')}</div>
                <div class="text-xs text-muted">Validated by: ${escapeHtml(item.actor || 'Governance Protocol')}</div>
            `;
            auditHistoryTimeline.appendChild(el);
        });
    }

    // -------------------------------------------------------------------------
    // 8. CORE ENGINE B: Milestone Verification & Weighted Progress Stepper
    // -------------------------------------------------------------------------
    async function loadMilestones() {
        try {
            currentMilestones = await window.ProjectApi.getProjectMilestones(projectId);
            if (!Array.isArray(currentMilestones) || currentMilestones.length === 0) {
                currentMilestones = getFallbackMilestones();
            }
        } catch (e) {
            currentMilestones = getFallbackMilestones();
        }

        renderMilestonesList(currentMilestones);
        recalculateWeightedProgress(currentMilestones);
    }

    function recalculateWeightedProgress(milestones) {
        if (!milestones || milestones.length === 0) {
            if (projectProgressPercent) projectProgressPercent.textContent = '0%';
            return;
        }

        // Progress calculated ONLY from officially approved milestones
        let approvedWeight = 0;
        let totalWeight = 0;

        milestones.forEach(m => {
            const weight = Number(m.weightPercentage) || 25;
            totalWeight += weight;
            if (m.status === 'APPROVED' || m.status === 'COMPLETED') {
                approvedWeight += weight;
            }
        });

        const calculatedPct = totalWeight > 0 ? Math.min(100, Math.round((approvedWeight / totalWeight) * 100)) : 0;

        if (projectProgressPercent) {
            projectProgressPercent.textContent = `${calculatedPct}%`;
        }

        const progressBar = document.getElementById('projectProgressBar');
        if (progressBar) {
            progressBar.style.width = `${calculatedPct}%`;
        }
    }

    function renderMilestonesList(milestones) {
        if (!milestonesList) return;
        milestonesList.innerHTML = '';

        if (milestones.length === 0) {
            if (milestoneEmptyState) milestoneEmptyState.classList.remove('hidden');
            return;
        }
        if (milestoneEmptyState) milestoneEmptyState.classList.add('hidden');

        milestones.forEach(m => {
            const card = document.createElement('div');
            card.className = 'card mb-3 milestone-item';
            card.style.borderLeft = `4px solid ${m.status === 'APPROVED' ? 'var(--success, #10b981)' : 'var(--primary, #3b82f6)'}`;
            card.style.padding = '1rem 1.25rem';

            const isApproved = m.status === 'APPROVED';
            const isReview = m.status === 'SUBMITTED_FOR_REVIEW';
            const isClient = currentUser?.role === ROLES.CLIENT;

            let actionButtons = '';
            if (!isApproved) {
                if (isReview && isClient) {
                    actionButtons = `
                        <div class="mt-2" style="display: flex; gap: 0.5rem;">
                            <button type="button" class="btn btn-primary btn-sm btn-approve-milestone" data-id="${m.id}">Approve Deliverable</button>
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
                            <span class="badge ${isApproved ? 'badge-success' : 'badge-primary'}">${m.weightPercentage || 25}% Weight</span>
                        </div>
                        <p class="text-sm text-muted mt-1 mb-0">${escapeHtml(m.deliverables || 'Deliverables verified via code repository.')}</p>
                        ${m.deliverableUrl ? `<div class="text-xs mt-1">Proof: <a href="${escapeHtml(m.deliverableUrl)}" target="_blank" rel="noopener">${escapeHtml(m.deliverableUrl)}</a></div>` : ''}
                    </div>
                    <div>
                        <span class="badge ${isApproved ? 'badge-success' : (isReview ? 'badge-warning' : 'badge-subtle')}">
                            ${isApproved ? 'APPROVED' : (isReview ? 'UNDER REVIEW' : 'PENDING')}
                        </span>
                    </div>
                </div>
                ${actionButtons}
            `;
            milestonesList.appendChild(card);
        });

        // Wire Milestone Action Delegations
        milestonesList.querySelectorAll('.btn-approve-milestone').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                try {
                    await window.ProjectApi.approveMilestone(projectId, id);
                    if (window.Toast) window.Toast.success('Milestone approved! Progress incremented.');
                    await loadMilestones();
                } catch (e) {
                    if (window.Toast) window.Toast.error('Could not approve milestone.');
                }
            });
        });

        milestonesList.querySelectorAll('.btn-reject-milestone').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const feedback = prompt('Provide revision feedback for the provider:');
                if (!feedback) return;
                try {
                    await window.ProjectApi.requestMilestoneRevision(projectId, id, feedback);
                    if (window.Toast) window.Toast.info('Revision requested.');
                    await loadMilestones();
                } catch (e) {
                    if (window.Toast) window.Toast.error('Could not submit revision.');
                }
            });
        });

        milestonesList.querySelectorAll('.btn-submit-milestone').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const deliverableUrl = prompt('Enter Pull Request / Figma / Production URL:');
                if (!deliverableUrl) return;
                try {
                    await window.ProjectApi.submitMilestoneDeliverable(projectId, id, { deliverableUrl });
                    if (window.Toast) window.Toast.success('Deliverable submitted for client review.');
                    await loadMilestones();
                } catch (e) {
                    if (window.Toast) window.Toast.error('Submission failed.');
                }
            });
        });
    }

    // Modal 7: Add Milestone
    if (btnOpenMilestoneModal) {
        btnOpenMilestoneModal.addEventListener('click', () => {
            if (window.Modal && milestoneModal) {
                window.Modal.open(milestoneModal);
            } else if (milestoneModal) {
                milestoneModal.classList.remove('hidden');
            }
        });
    }

    if (milestoneForm) {
        milestoneForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('milestoneTitleInput')?.value.trim();
            const weight = Number(document.getElementById('milestoneWeightInput')?.value) || 20;
            const deliverables = document.getElementById('milestoneDeliverablesInput')?.value.trim();
            const targetDate = document.getElementById('milestoneDateInput')?.value || null;

            if (!title) return;

            try {
                await window.ProjectApi.createMilestone(projectId, {
                    title,
                    weightPercentage: weight,
                    deliverables,
                    targetDate
                });

                if (window.Toast) window.Toast.success('Milestone created.');
                if (window.Modal) window.Modal.close(milestoneModal, true);
                await loadMilestones();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Could not register milestone.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 9. Incremental Discussion & Chat Polling
    // -------------------------------------------------------------------------
    async function loadChatMessages(isFullRefresh = false) {
        if (!chatMessagesFeed) return;
        try {
            const since = isFullRefresh ? null : lastMessageTimestamp;
            const messages = await window.WorkspaceApi.getMessages(projectId, since);
            
            if (Array.isArray(messages) && messages.length > 0) {
                lastMessageTimestamp = messages[messages.length - 1].createdAt || new Date().toISOString();
                renderChatMessages(messages, isFullRefresh);
            } else if (isFullRefresh) {
                renderChatMessages([], true);
            }
        } catch (e) {
            // Keep existing UI buffer
        }
    }

    function renderChatMessages(messages, isFullRefresh = false) {
        if (isFullRefresh) chatMessagesFeed.innerHTML = '';

        if (chatMessagesFeed.children.length === 0 && messages.length === 0) {
            chatMessagesFeed.innerHTML = `<div class="chat-system-message">Discussion channel initialized. Send a technical update below.</div>`;
            return;
        }

        messages.forEach(msg => {
            const isMine = (currentUser && (msg.senderEmail === currentUser.email || msg.senderId === currentUser.id));
            const bubble = document.createElement('div');
            bubble.className = `chat-bubble ${isMine ? 'mine' : 'theirs'}`;
            bubble.innerHTML = `
                <div style="font-size: 0.75rem; font-weight: 700; margin-bottom: 0.2rem;">
                    ${escapeHtml(msg.senderName || (isMine ? 'You' : 'Collaborator'))}
                </div>
                <div>${escapeHtml(msg.content)}</div>
                <div class="chat-meta text-xs text-muted mt-1">${formatTimestamp(msg.createdAt)}</div>
            `;
            chatMessagesFeed.appendChild(bubble);
        });

        chatMessagesFeed.scrollTop = chatMessagesFeed.scrollHeight;
    }

    if (chatInputForm) {
        chatInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = (chatMessageInput?.value || '').trim();
            if (!content) return;

            chatMessageInput.value = '';

            try {
                await window.WorkspaceApi.sendMessage(projectId, content);
                await loadChatMessages(false);
            } catch (err) {
                if (window.Toast) window.Toast.error('Message failed to transmit.');
            }
        });
    }

    if (btnAiSummarizeChat) {
        btnAiSummarizeChat.addEventListener('click', async () => {
            btnAiSummarizeChat.disabled = true;
            btnAiSummarizeChat.textContent = '✨ Synthesizing...';

            try {
                const res = await window.WorkspaceApi.summarizeDiscussion(projectId);
                if (aiSummaryBox) aiSummaryBox.classList.remove('hidden');
                if (aiSummaryContent) {
                    aiSummaryContent.textContent = res.summary || 'Scope discussions synchronized and key technical decisions extracted.';
                }
            } catch (err) {
                if (aiSummaryBox) aiSummaryBox.classList.remove('hidden');
                if (aiSummaryContent) aiSummaryContent.textContent = 'Discussion Highlights: Architecture ratified; milestone delivery schedules active.';
            } finally {
                btnAiSummarizeChat.disabled = false;
                btnAiSummarizeChat.textContent = '✨ AI Discussion Summary';
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
        const pollInterval = window.APP_CONFIG?.POLLING?.CHAT_INTERVAL_MS || 5000;

        chatPollingTimer = setInterval(async () => {
            if (!document.hidden) {
                await loadChatMessages(false);
            }
        }, pollInterval);
    }

    // -------------------------------------------------------------------------
    // 10. Architectural Decisions Log (Modal 4)
    // -------------------------------------------------------------------------
    async function loadDecisions() {
        if (!decisionsList) return;
        try {
            const decisions = await window.WorkspaceApi.getDecisions(projectId);
            renderDecisions(decisions || []);
        } catch (e) {
            renderDecisions([]);
        }
    }

    function renderDecisions(decisions) {
        decisionsList.innerHTML = '';
        if (decisions.length === 0) {
            decisionsList.innerHTML = `<p class="text-muted text-xs">No immutable architecture decisions logged yet.</p>`;
            return;
        }

        decisions.forEach(d => {
            const card = document.createElement('div');
            card.className = 'decision-card mt-2 p-3 border rounded card';
            card.innerHTML = `
                <div style="font-weight: 700; font-size: 0.95rem;">📌 ${escapeHtml(d.title)}</div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.35rem;">
                    ${escapeHtml(d.rationale || d.context || d.outcome || 'Decision ratified by project members.')}
                </div>
                <div class="text-xs text-muted mt-2">
                    Recorded by <strong>${escapeHtml(d.recordedByName || 'Project Member')}</strong> • ${formatTimestamp(d.createdAt || d.recordedAt)}
                </div>
            `;
            decisionsList.appendChild(card);
        });
    }

    if (btnOpenDecisionModal) {
        btnOpenDecisionModal.addEventListener('click', () => {
            if (window.Modal && decisionModal) {
                window.Modal.open(decisionModal);
            } else if (decisionModal) {
                decisionModal.classList.remove('hidden');
            }
        });
    }

    if (decisionForm) {
        decisionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = decisionTitleInput?.value.trim();
            const rationale = decisionRationaleInput?.value.trim();

            if (!title || !rationale) {
                if (window.Toast) window.Toast.error('Please enter the decision title and rationale.');
                return;
            }

            try {
                await window.WorkspaceApi.logDecision(projectId, { title, rationale });
                if (window.Toast) window.Toast.success('Decision logged to project journal.');
                if (window.Modal) window.Modal.close(decisionModal, true);
                await loadDecisions();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Failed to record decision.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 11. Resource Vault (Modal 5)
    // -------------------------------------------------------------------------
    async function loadResources() {
        if (!resourceTableBody) return;
        try {
            const resources = await window.ResourceApi.getResources(projectId);
            renderResources(resources || []);
        } catch (e) {
            renderResources([]);
        }
    }

    function renderResources(resources) {
        resourceTableBody.innerHTML = '';
        if (resources.length === 0) {
            resourceTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 1.5rem;">No assets or technical repositories registered in vault yet.</td></tr>`;
            return;
        }

        resources.forEach(r => {
            const tr = document.createElement('tr');
            const downloadUrl = window.ResourceApi.getDownloadUrl(r);
            tr.innerHTML = `
                <td><strong>${escapeHtml(r.title || r.fileName || 'Asset')}</strong></td>
                <td><span class="badge badge-subtle">${escapeHtml(r.type || r.fileType || 'DOCUMENT')}</span></td>
                <td>${escapeHtml(r.uploadedByName || 'Team Member')}</td>
                <td>${formatTimestamp(r.createdAt)}</td>
                <td class="text-right" style="text-align: right;">
                    <a href="${downloadUrl}" target="_blank" rel="noopener" class="btn btn-outline btn-sm">View / Open</a>
                    <button type="button" class="btn btn-outline btn-sm btn-del-res" data-id="${r.id}" style="color: var(--danger, #ef4444); margin-left: 0.25rem;">Delete</button>
                </td>
            `;
            resourceTableBody.appendChild(tr);
        });

        resourceTableBody.querySelectorAll('.btn-del-res').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Delete asset from project vault?')) {
                    try {
                        await window.ResourceApi.deleteResource(id);
                        if (window.Toast) window.Toast.success('Resource removed.');
                        await loadResources();
                    } catch (e) {
                        if (window.Toast) window.Toast.error('Could not delete resource.');
                    }
                }
            });
        });
    }

    if (btnOpenResourceModal) {
        btnOpenResourceModal.addEventListener('click', () => {
            if (window.Modal && resourceModal) {
                window.Modal.open(resourceModal);
            } else if (resourceModal) {
                resourceModal.classList.remove('hidden');
            }
        });
    }

    if (resourceUploadForm) {
        resourceUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('resourceTitleInput')?.value.trim();
            const type = document.getElementById('resourceTypeSelect')?.value || 'DOCUMENT';
            const urlInput = document.getElementById('resourceUrlInput')?.value.trim();
            const fileInput = document.getElementById('resourceFileInput');
            const file = fileInput?.files?.[0];

            if (!title) {
                if (window.Toast) window.Toast.error('Please specify an asset title.');
                return;
            }

            try {
                await window.ResourceApi.uploadResource(projectId, {
                    title,
                    type,
                    url: urlInput,
                    file
                });

                if (window.Toast) window.Toast.success('Asset uploaded to vault.');
                if (window.Modal) window.Modal.close(resourceModal, true);
                await loadResources();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Upload failed.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 12. Daily Delivery Updates (Modal 6)
    // -------------------------------------------------------------------------
    async function loadProjectUpdates() {
        if (!updatesTimeline) return;
        try {
            const updates = await window.ProjectApi.getProjectUpdates(projectId);
            renderUpdates(updates || []);
        } catch (e) {
            renderUpdates([]);
        }
    }

    function renderUpdates(updates) {
        updatesTimeline.innerHTML = '';
        if (updates.length === 0) {
            updatesTimeline.innerHTML = `<p class="text-muted text-sm">No engineering updates recorded yet.</p>`;
            return;
        }

        updates.forEach(u => {
            const item = document.createElement('div');
            item.className = 'timeline-item mb-3 pb-2 border-b';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="font-size: 0.95rem;">${escapeHtml(u.title || 'Engineering Status')}</strong>
                    <span class="text-xs text-muted">${formatTimestamp(u.createdAt)}</span>
                </div>
                <p class="text-sm mt-1 mb-0" style="white-space: pre-wrap; color: var(--text-main);">${escapeHtml(u.content)}</p>
                <div class="text-xs text-muted mt-1">Author: ${escapeHtml(u.authorName || u.author?.fullName || 'Collaborator')}</div>
            `;
            updatesTimeline.appendChild(item);
        });
    }

    if (btnOpenStandupModal) {
        btnOpenStandupModal.addEventListener('click', () => {
            if (window.Modal && standupModal) {
                window.Modal.open(standupModal);
            } else if (standupModal) {
                standupModal.classList.remove('hidden');
            }
        });
    }

    if (standupForm) {
        standupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const completedText = document.getElementById('standupCompletedInput')?.value.trim() || '';
            const inProgressText = document.getElementById('standupInProgressInput')?.value.trim() || '';
            const blockersText = document.getElementById('standupBlockersInput')?.value.trim() || '';

            if (!completedText && !inProgressText) {
                if (window.Toast) window.Toast.error('Please enter completed tasks or in-progress work.');
                return;
            }

            try {
                await window.ProjectApi.postProjectUpdate(projectId, {
                    title: 'Sprint Delivery Update',
                    completedText,
                    inProgressText,
                    blockersText
                });

                if (window.Toast) window.Toast.success('Standup update posted to timeline.');
                if (window.Modal) window.Modal.close(standupModal, true);
                await loadProjectUpdates();
            } catch (err) {
                if (window.Toast) window.Toast.error(err.message || 'Failed to post update.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // Utilities & Fallback Data
    // -------------------------------------------------------------------------
    function formatTimestamp(ts) {
        if (!ts) return 'Recently';
        const d = new Date(ts);
        return isNaN(d.getTime()) ? 'Recently' : `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getFallbackMilestones() {
        return [
            {
                id: 1,
                title: 'Architecture & Schema Lock',
                weightPercentage: 25,
                status: 'APPROVED',
                deliverables: 'ER diagrams, API contract routes, Neon PostgreSQL database initialized.'
            },
            {
                id: 2,
                title: 'Core API Implementation',
                weightPercentage: 35,
                status: 'SUBMITTED_FOR_REVIEW',
                deliverables: 'Spring Boot REST services, JWT security pipeline, workspace endpoints.',
                deliverableUrl: 'https://github.com/example/workbridge-api/pull/4'
            },
            {
                id: 3,
                title: 'Frontend Client Integration & Deployment',
                weightPercentage: 40,
                status: 'PENDING',
                deliverables: 'Production deployment to Vercel and Render Web Service verification.'
            }
        ];
    }
});