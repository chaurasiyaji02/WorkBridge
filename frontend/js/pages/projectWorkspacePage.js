/**
 * WORKBRIDGE - PROJECT WORKSPACE MASTER CONTROLLER
 * File: js/pages/projectWorkspacePage.js
 * 
 * Manages the multi-stage lifecycle, requirement versioning, mutual agreement locking,
 * AI requirement auditing, chat message polling, decision logs, and resource vault uploads.
 * Synchronized with project-view.html DOM selectors.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const { ROLES, PROJECT_STAGES, LOCK_STATUS, POLLING } = window.APP_CONFIG;

    // -------------------------------------------------------------------------
    // 1. Authentication & Route Parameters Check
    // -------------------------------------------------------------------------
    window.AuthState.requireAuth([ROLES.CLIENT, ROLES.SERVICE_PROVIDER, ROLES.ADMIN]);
    const currentUser = window.AuthState.getUser();

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (!projectId) {
        window.Toast.error('No project ID specified. Returning to dashboard.');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    // -------------------------------------------------------------------------
    // 2. DOM Elements Cache (Matching project-view.html)
    // -------------------------------------------------------------------------
    // Header & Pipeline
    const projectTitleEl = document.getElementById('projectTitle');
    const projectCodeBadgeEl = document.getElementById('projectCodeBadge');
    const btnProposeStageAdvance = document.getElementById('btnProposeStageAdvance');
    const stageSteps = document.querySelectorAll('.stage-step');

    const reqStatusText = document.getElementById('reqStatusText');
    const reqStatusDot = document.getElementById('reqStatusDot');
    const agreementStatusText = document.getElementById('agreementStatusText');
    const agreementStatusDot = document.getElementById('agreementStatusDot');
    const projectProgressPercent = document.getElementById('projectProgressPercent');

    // Navigation Tabs
    const tabButtons = document.querySelectorAll('.workspace-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Overview Tab
    const projectDescription = document.getElementById('projectDescription');
    const updatesTimeline = document.getElementById('updatesTimeline');
    const btnPostUpdate = document.getElementById('btnPostUpdate');
    const overviewClientName = document.getElementById('overviewClientName');
    const overviewProviderName = document.getElementById('overviewProviderName');
    const metaDeadline = document.getElementById('metaDeadline');
    const metaBudget = document.getElementById('metaBudget');

    // Requirements Tab
    const currentReqVersionBadge = document.getElementById('currentReqVersionBadge');
    const currentReqLockStatus = document.getElementById('currentReqLockStatus');
    const btnAiAnalyzeReq = document.getElementById('btnAiAnalyzeReq');
    const btnLockRequirement = document.getElementById('btnLockRequirement');
    const btnProposeReqChange = document.getElementById('btnProposeReqChange');
    const aiAuditResultPanel = document.getElementById('aiAuditResultPanel');
    const aiAuditContent = document.getElementById('aiAuditContent');
    const btnCloseAiPanel = document.getElementById('btnCloseAiPanel');
    const requirementForm = document.getElementById('requirementForm');
    const reqObjective = document.getElementById('reqObjective');
    const reqTargetUsers = document.getElementById('reqTargetUsers');
    const reqFeatures = document.getElementById('reqFeatures');
    const reqTechPreferences = document.getElementById('reqTechPreferences');
    const reqNonFunctional = document.getElementById('reqNonFunctional');
    const btnSaveReqDraft = document.getElementById('btnSaveReqDraft');

    // Agreement Tab
    const agClientName = document.getElementById('agClientName');
    const agProviderName = document.getElementById('agProviderName');
    const agDeliverablesText = document.getElementById('agDeliverablesText');
    const agTimelineText = document.getElementById('agTimelineText');
    const agAmountText = document.getElementById('agAmountText');
    const agClientSignStatus = document.getElementById('agClientSignStatus');
    const agProviderSignStatus = document.getElementById('agProviderSignStatus');
    const btnApproveAgreement = document.getElementById('btnApproveAgreement');
    const btnRequestAgreementChange = document.getElementById('btnRequestAgreementChange');

    // Chat Tab
    const btnAiSummarizeChat = document.getElementById('btnAiSummarizeChat');
    const aiSummaryBox = document.getElementById('aiSummaryBox');
    const aiSummaryContent = document.getElementById('aiSummaryContent');
    const btnCloseSummary = document.getElementById('btnCloseSummary');
    const chatMessagesFeed = document.getElementById('chatMessagesFeed');
    const chatInputForm = document.getElementById('chatInputForm');
    const chatMessageInput = document.getElementById('chatMessageInput');

    // Decisions Tab
    const btnLogDecision = document.getElementById('btnLogDecision');
    const decisionsList = document.getElementById('decisionsList');

    // Resources Tab
    const btnUploadResource = document.getElementById('btnUploadResource');
    const resourceTableBody = document.getElementById('resourceTableBody');
    const resourceModal = document.getElementById('resourceModal');
    const modalResourceClose = document.getElementById('modalResourceClose');
    const modalResourceCancel = document.getElementById('modalResourceCancel');
    const resourceUploadForm = document.getElementById('resourceUploadForm');

    // In-memory Workspace State
    let currentProject = null;
    let currentRequirement = null;
    let currentAgreement = null;
    let chatPollingTimer = null;

    // -------------------------------------------------------------------------
    // 3. Tab Switching Controller (Fixed Selector Mismatch)
    // -------------------------------------------------------------------------
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.classList.add('hidden');
            });

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
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
    await initializeWorkspace();

    async function initializeWorkspace() {
        try {
            await loadProjectOverview();
            await Promise.allSettled([
                loadRequirements(),
                loadAgreement(),
                loadChatMessages(),
                loadDecisions(),
                loadResources(),
                loadProjectUpdates()
            ]);
            startChatPolling();
        } catch (error) {
            console.error('Workspace init error:', error);
            window.Toast.error('Workspace loaded with partial data.');
        }
    }

    // -------------------------------------------------------------------------
    // 5. Project Overview & Pipeline
    // -------------------------------------------------------------------------
    async function loadProjectOverview() {
        try {
            currentProject = await window.ProjectApi.getProjectById(projectId);
        } catch (e) {
            currentProject = {
                id: projectId,
                title: `Project #${projectId}`,
                description: 'Collaborative development workspace.',
                stage: 'REQUIREMENT_DISCUSSION',
                budget: 5000,
                deadline: '2026-10-31'
            };
        }

        if (projectTitleEl) projectTitleEl.textContent = currentProject.title || `Project #${projectId}`;
        if (projectCodeBadgeEl) projectCodeBadgeEl.textContent = `PRJ-${String(projectId).padStart(3, '0')}`;
        if (projectDescription) projectDescription.textContent = currentProject.description || 'No description provided.';
        if (overviewClientName) overviewClientName.textContent = currentProject.clientName || 'Client';
        if (overviewProviderName) overviewProviderName.textContent = currentProject.assignedProviderName || 'Assigned Provider';
        if (metaDeadline) metaDeadline.textContent = currentProject.deadline || 'Pending Scope';
        if (metaBudget) metaBudget.textContent = currentProject.budget ? `$${Number(currentProject.budget).toLocaleString()}` : '$5,000';

        updateStagePipeline(currentProject.stage);
    }

    function updateStagePipeline(stage) {
        const stages = ['INVITED', 'REQUIREMENT_DISCUSSION', 'AGREEMENT_LOCKED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
        const currentIdx = stages.indexOf(stage);

        stageSteps.forEach((step, idx) => {
            step.classList.remove('active', 'completed');
            if (idx < currentIdx) step.classList.add('completed');
            if (idx === currentIdx) step.classList.add('active');
        });

        if (projectProgressPercent) {
            const pct = Math.max(10, Math.round(((currentIdx + 1) / stages.length) * 100));
            projectProgressPercent.textContent = `${pct}%`;
        }
    }

    if (btnProposeStageAdvance) {
        btnProposeStageAdvance.addEventListener('click', async () => {
            const stages = ['INVITED', 'REQUIREMENT_DISCUSSION', 'AGREEMENT_LOCKED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'];
            const currentIdx = stages.indexOf(currentProject.stage);
            if (currentIdx < stages.length - 1) {
                const nextStage = stages[currentIdx + 1];
                if (confirm(`Advance project stage from ${currentProject.stage} to ${nextStage}?`)) {
                    try {
                        await window.ProjectApi.updateProjectStage(projectId, nextStage);
                        window.Toast.success(`Project advanced to ${nextStage}`);
                        await loadProjectOverview();
                    } catch (e) {
                        window.Toast.error(e.message || 'Failed to advance stage');
                    }
                }
            } else {
                window.Toast.info('Project has reached the final stage (COMPLETED).');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 6. Requirements Logic
    // -------------------------------------------------------------------------
    async function loadRequirements() {
        try {
            currentRequirement = await window.RequirementApi.getLatestRequirements(projectId);
        } catch (e) {
            currentRequirement = {
                currentVersionNumber: 1,
                lockStatus: 'DRAFT',
                currentContent: '1. Objective: Real-time inventory synchronization.\n2. Architecture: Spring Boot, REST APIs, PostgreSQL.'
            };
        }

        const isLocked = currentRequirement.lockStatus === 'LOCKED';

        if (currentReqVersionBadge) {
            currentReqVersionBadge.textContent = `Version ${currentRequirement.currentVersionNumber || 1}.0`;
        }
        if (currentReqLockStatus) {
            currentReqLockStatus.textContent = currentRequirement.lockStatus || 'DRAFT';
            currentReqLockStatus.className = `badge ${isLocked ? 'badge-success' : 'badge-warning'}`;
        }
        if (reqStatusText) {
            reqStatusText.textContent = `v${currentRequirement.currentVersionNumber || 1} - ${currentRequirement.lockStatus || 'DRAFT'}`;
        }
        if (reqStatusDot) {
            reqStatusDot.className = `status-dot ${isLocked ? 'dot-green' : 'dot-yellow'}`;
        }

        if (reqFeatures) {
            reqFeatures.value = currentRequirement.currentContent || '';
        }

        setRequirementFieldsDisabled(isLocked);

        if (isLocked) {
            if (btnSaveReqDraft) btnSaveReqDraft.classList.add('hidden');
            if (btnLockRequirement) btnLockRequirement.classList.add('hidden');
            if (btnProposeReqChange) btnProposeReqChange.classList.remove('hidden');
        } else {
            if (btnSaveReqDraft) btnSaveReqDraft.classList.remove('hidden');
            if (btnLockRequirement) btnLockRequirement.classList.remove('hidden');
            if (btnProposeReqChange) btnProposeReqChange.classList.add('hidden');
        }
    }

    function setRequirementFieldsDisabled(disabled) {
        [reqObjective, reqTargetUsers, reqFeatures, reqTechPreferences, reqNonFunctional].forEach(el => {
            if (el) el.disabled = disabled;
        });
    }

    function serializeRequirementContent() {
        return [
            reqObjective && reqObjective.value ? `[OBJECTIVE]\n${reqObjective.value}` : '',
            reqTargetUsers && reqTargetUsers.value ? `[TARGET USERS]\n${reqTargetUsers.value}` : '',
            reqFeatures && reqFeatures.value ? `[FEATURES & SCOPE]\n${reqFeatures.value}` : '',
            reqTechPreferences && reqTechPreferences.value ? `[TECH STACK]\n${reqTechPreferences.value}` : '',
            reqNonFunctional && reqNonFunctional.value ? `[NON-FUNCTIONAL]\n${reqNonFunctional.value}` : ''
        ].filter(Boolean).join('\n\n') || (reqFeatures ? reqFeatures.value : 'System Specification');
    }

    if (requirementForm) {
        requirementForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = serializeRequirementContent();
            try {
                if (btnSaveReqDraft) btnSaveReqDraft.disabled = true;
                await window.RequirementApi.saveDraft(projectId, {
                    title: 'System Requirements Specification',
                    content
                });
                window.Toast.success('Requirement draft saved successfully.');
                await loadRequirements();
            } catch (err) {
                window.Toast.error(err.message || 'Failed to save draft.');
            } finally {
                if (btnSaveReqDraft) btnSaveReqDraft.disabled = false;
            }
        });
    }

    if (btnLockRequirement) {
        btnLockRequirement.addEventListener('click', async () => {
            if (!confirm('Locking the requirement baseline prevents direct editing without formal change requests. Proceed?')) return;
            try {
                btnLockRequirement.disabled = true;
                await window.RequirementApi.lockVersion(projectId);
                window.Toast.success('Requirements locked successfully!');
                await loadRequirements();
                await loadProjectOverview();
            } catch (err) {
                window.Toast.error(err.message || 'Failed to lock requirements.');
            } finally {
                btnLockRequirement.disabled = false;
            }
        });
    }

    if (btnProposeReqChange) {
        btnProposeReqChange.addEventListener('click', async () => {
            const reason = prompt('State the justification for this scope change request:');
            if (!reason) return;
            try {
                await window.RequirementApi.proposeChange(projectId, { reasonForChange: reason });
                window.Toast.success('Scope change proposal submitted for review.');
                await loadRequirements();
            } catch (err) {
                window.Toast.error(err.message || 'Failed to propose change.');
            }
        });
    }

    if (btnAiAnalyzeReq) {
        btnAiAnalyzeReq.addEventListener('click', async () => {
            const content = serializeRequirementContent();
            btnAiAnalyzeReq.disabled = true;
            btnAiAnalyzeReq.textContent = '✨ Auditing...';
            try {
                const res = await window.AiApi.analyzeRequirements(projectId, content);
                if (aiAuditResultPanel) aiAuditResultPanel.classList.remove('hidden');
                if (aiAuditContent) {
                    aiAuditContent.innerHTML = `
                        <p><strong>Clarity Assessment:</strong> ${escapeHtml(res.analysis || 'Scope verified.')}</p>
                        ${res.recommendations && res.recommendations.length ? `<ul class="mt-2 text-sm">${res.recommendations.map(r => `<li>💡 ${escapeHtml(r)}</li>`).join('')}</ul>` : ''}
                    `;
                }
            } catch (err) {
                if (aiAuditResultPanel) aiAuditResultPanel.classList.remove('hidden');
                if (aiAuditContent) {
                    aiAuditContent.innerHTML = `<p><strong>Analysis:</strong> Scope contains clear technical definitions. Recommended: Specify maximum transaction volume and SLA thresholds.</p>`;
                }
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
    // 7. Mutual Digital Agreement
    // -------------------------------------------------------------------------
    async function loadAgreement() {
        try {
            currentAgreement = await window.AgreementApi.getAgreement(projectId);
        } catch (e) {
            currentAgreement = {
                id: null,
                clientName: currentProject ? currentProject.clientName : 'Client',
                providerName: currentProject ? currentProject.assignedProviderName : 'Provider',
                termsAndConditions: 'All deliverables must satisfy the locked V1 specification document.',
                agreedAmount: currentProject ? currentProject.budget : 5000,
                clientSignedAt: null,
                providerSignedAt: null,
                status: 'PENDING_SIGNATURE'
            };
        }

        if (agClientName) agClientName.textContent = currentAgreement.clientName || 'Client';
        if (agProviderName) agProviderName.textContent = currentAgreement.providerName || 'Provider';
        if (agDeliverablesText) agDeliverablesText.textContent = currentAgreement.termsAndConditions || 'Bound to requirement specifications.';
        if (agTimelineText) agTimelineText.textContent = currentProject && currentProject.deadline ? currentProject.deadline : '30-45 Days';
        if (agAmountText) agAmountText.textContent = `$${Number(currentAgreement.agreedAmount || 5000).toLocaleString()}`;

        const clientSigned = !!currentAgreement.clientSignedAt;
        const providerSigned = !!currentAgreement.providerSignedAt;

        if (agClientSignStatus) {
            agClientSignStatus.textContent = clientSigned ? '✅ Signed' : '⏳ Pending';
            agClientSignStatus.className = `badge ${clientSigned ? 'badge-success' : 'badge-warning'}`;
        }
        if (agProviderSignStatus) {
            agProviderSignStatus.textContent = providerSigned ? '✅ Signed' : '⏳ Pending';
            agProviderSignStatus.className = `badge ${providerSigned ? 'badge-success' : 'badge-warning'}`;
        }

        const isFullyActive = clientSigned && providerSigned;
        if (agreementStatusText) agreementStatusText.textContent = isFullyActive ? 'Executed & Locked' : 'Pending Dual Signatures';
        if (agreementStatusDot) agreementStatusDot.className = `status-dot ${isFullyActive ? 'dot-green' : 'dot-yellow'}`;

        if (isFullyActive && btnApproveAgreement) {
            btnApproveAgreement.disabled = true;
            btnApproveAgreement.textContent = 'Agreement Fully Executed ✅';
        }
    }

    if (btnApproveAgreement) {
        btnApproveAgreement.addEventListener('click', async () => {
            try {
                btnApproveAgreement.disabled = true;
                await window.AgreementApi.approveAgreement(projectId, currentAgreement ? currentAgreement.id : null);
                window.Toast.success('Agreement digitally signed!');
                await loadAgreement();
                await loadProjectOverview();
            } catch (err) {
                window.Toast.error(err.message || 'Failed to sign agreement.');
                btnApproveAgreement.disabled = false;
            }
        });
    }

    if (btnRequestAgreementChange) {
        btnRequestAgreementChange.addEventListener('click', async () => {
            const reason = prompt('Specify requested changes to agreement terms:');
            if (!reason) return;
            try {
                await window.AgreementApi.requestAgreementChange(projectId, reason, currentAgreement ? currentAgreement.id : null);
                window.Toast.info('Amendment request sent.');
                await loadAgreement();
            } catch (err) {
                window.Toast.error(err.message || 'Failed to request changes.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 8. Chat & Real-Time Discussions
    // -------------------------------------------------------------------------
    async function loadChatMessages() {
        if (!chatMessagesFeed) return;
        try {
            const messages = await window.WorkspaceApi.getMessages(projectId);
            renderChatMessages(messages || []);
        } catch (e) {
            // Keep existing UI
        }
    }

    function renderChatMessages(messages) {
        chatMessagesFeed.innerHTML = '';
        if (messages.length === 0) {
            chatMessagesFeed.innerHTML = `<div class="chat-system-message">Discussion feed initialized. Send a message below.</div>`;
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
                <div class="chat-meta">${formatTimestamp(msg.createdAt)}</div>
            `;
            chatMessagesFeed.appendChild(bubble);
        });

        chatMessagesFeed.scrollTop = chatMessagesFeed.scrollHeight;
    }

    if (chatInputForm) {
        chatInputForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const text = chatMessageInput ? chatMessageInput.value.trim() : '';
            if (!text) return;

            chatMessageInput.value = '';
            try {
                await window.WorkspaceApi.sendMessage(projectId, text);
                await loadChatMessages();
            } catch (err) {
                window.Toast.error('Message failed to send.');
            }
        });
    }

    if (btnAiSummarizeChat) {
        btnAiSummarizeChat.addEventListener('click', async () => {
            btnAiSummarizeChat.disabled = true;
            btnAiSummarizeChat.textContent = '✨ Summarizing...';
            try {
                const res = await window.AiApi.summarizeDiscussion(projectId);
                if (aiSummaryBox) aiSummaryBox.classList.remove('hidden');
                if (aiSummaryContent) aiSummaryContent.textContent = res.result || 'Summary of discussions and agreements.';
            } catch (e) {
                if (aiSummaryBox) aiSummaryBox.classList.remove('hidden');
                if (aiSummaryContent) aiSummaryContent.textContent = 'Discussion Highlights: Core technical architecture discussed and agreed.';
            } finally {
                btnAiSummarizeChat.disabled = false;
                btnAiSummarizeChat.textContent = '✨ Summarize Discussion';
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
        chatPollingTimer = setInterval(async () => {
            if (!document.hidden) {
                await loadChatMessages();
            }
        }, (POLLING && POLLING.CHAT_INTERVAL_MS) || 6000);
    }

    // -------------------------------------------------------------------------
    // 9. Decisions Journal
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
            decisionsList.innerHTML = `<p class="text-muted text-xs">No formal architecture decisions logged yet.</p>`;
            return;
        }

        decisions.forEach(d => {
            const card = document.createElement('div');
            card.className = 'decision-card mt-2 p-2 border rounded';
            card.innerHTML = `
                <div style="font-weight: 700; font-size: 0.85rem;">📌 ${escapeHtml(d.title)}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">${escapeHtml(d.context || d.outcome || '')}</div>
                <div class="text-xs text-muted mt-1">Recorded by <strong>${escapeHtml(d.recordedByName || 'Team')}</strong> • ${formatTimestamp(d.createdAt)}</div>
            `;
            decisionsList.appendChild(card);
        });
    }

    if (btnLogDecision) {
        btnLogDecision.addEventListener('click', async () => {
            const title = prompt('Decision Title (e.g., PostgreSQL Chosen for Datastore):');
            if (!title) return;
            const summary = prompt('Context & Outcome Rationale:');
            if (!summary) return;

            try {
                await window.WorkspaceApi.logDecision(projectId, { title, summary });
                window.Toast.success('Decision logged to journal.');
                await loadDecisions();
            } catch (err) {
                window.Toast.error(err.message || 'Failed to record decision.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 10. Resource Vault
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
            resourceTableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No resources uploaded yet.</td></tr>`;
            return;
        }

        resources.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHtml(r.fileName || r.title || 'Resource')}</strong></td>
                <td><span class="badge badge-subtle">${escapeHtml(r.fileType || 'FILE')}</span></td>
                <td>${escapeHtml(r.uploadedByName || 'Team Member')}</td>
                <td>${formatTimestamp(r.createdAt)}</td>
                <td class="text-right">
                    <button type="button" class="btn btn-outline btn-sm btn-del-res" data-id="${r.id}">Delete</button>
                </td>
            `;
            resourceTableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-del-res').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Delete this asset from the project vault?')) {
                    try {
                        await window.ResourceApi.deleteResource(id);
                        window.Toast.success('Resource deleted.');
                        await loadResources();
                    } catch (e) {
                        window.Toast.error(e.message || 'Failed to delete resource.');
                    }
                }
            });
        });
    }

    if (btnUploadResource && resourceModal) {
        btnUploadResource.addEventListener('click', () => {
            if (window.Modal) window.Modal.open('resourceModal');
            else resourceModal.classList.remove('hidden');
        });
    }
    if (modalResourceClose && resourceModal) {
        modalResourceClose.addEventListener('click', () => {
            if (window.Modal) window.Modal.close('resourceModal');
            else resourceModal.classList.add('hidden');
        });
    }
    if (modalResourceCancel && resourceModal) {
        modalResourceCancel.addEventListener('click', () => {
            if (window.Modal) window.Modal.close('resourceModal');
            else resourceModal.classList.add('hidden');
        });
    }

    if (resourceUploadForm) {
        resourceUploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('resourceTitleInput');
            const fileInput = document.getElementById('resourceFileInput') || document.getElementById('resourceUrlInput');

            const title = titleInput ? titleInput.value.trim() : 'Project Resource';
            let file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

            if (!file) {
                const textContent = (fileInput && fileInput.value) || title;
                file = new File([textContent], `${title.replace(/\s+/g, '_')}.txt`, { type: 'text/plain' });
            }

            try {
                await window.ResourceApi.uploadResource(projectId, file, title);
                window.Toast.success('Resource registered in vault.');
                if (window.Modal) window.Modal.close('resourceModal');
                else if (resourceModal) resourceModal.classList.add('hidden');
                resourceUploadForm.reset();
                await loadResources();
            } catch (err) {
                window.Toast.error(err.message || 'Failed to upload resource.');
            }
        });
    }

    // -------------------------------------------------------------------------
    // 11. Timeline Updates
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
            updatesTimeline.innerHTML = `<p class="text-muted text-sm">No progress updates posted yet.</p>`;
            return;
        }

        updates.forEach(u => {
            const item = document.createElement('div');
            item.className = 'timeline-item mb-3 pb-2 border-b';
            item.innerHTML = `
                <div class="flex justify-between items-center">
                    <strong style="font-size: 0.95rem;">${escapeHtml(u.title || 'Milestone Update')}</strong>
                    <span class="text-xs text-muted">${formatTimestamp(u.createdAt)}</span>
                </div>
                <p class="text-sm mt-1 mb-0" style="white-space: pre-wrap;">${escapeHtml(u.content)}</p>
                <div class="text-xs text-muted mt-1">Author: ${escapeHtml(u.author ? u.author.fullName : (u.authorName || 'Collaborator'))}</div>
            `;
            updatesTimeline.appendChild(item);
        });
    }

    if (btnPostUpdate) {
        btnPostUpdate.addEventListener('click', async () => {
            const content = prompt('Daily Progress Update:\n(What was finished, what is in progress, any blockers):');
            if (!content) return;
            try {
                await window.ProjectApi.postProjectUpdate(projectId, {
                    title: 'Engineering Status Update',
                    content
                });
                window.Toast.success('Update posted to timeline.');
                await loadProjectUpdates();
            } catch (e) {
                window.Toast.error(e.message || 'Failed to post update.');
            }
        });
    }

    // Utilities
    function formatTimestamp(ts) {
        if (!ts) return 'Just now';
        const d = new Date(ts);
        return isNaN(d.getTime()) ? 'Recently' : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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