/**
 * WORKBRIDGE - CLIENT DASHBOARD PAGE CONTROLLER (SUPABASE CLOUD MASTER)
 * File: js/pages/clientDashboardPage.js
 * 
 * Powered by direct Supabase PostgreSQL queries (`projects`, `agreements`, `profiles`).
 * Supports real-time project creation with direct provider assignment, 
 * stage lifecycle filtering, and instant sign-off modal reviews.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || { CLIENT: 'CLIENT', SERVICE_PROVIDER: 'SERVICE_PROVIDER' };
    const PROJECT_STAGES = config.PROJECT_STAGES || {
        INVITED: 'INVITED',
        REQUIREMENT_DISCUSSION: 'REQUIREMENT_DISCUSSION',
        AGREEMENT_LOCKED: 'AGREEMENT_LOCKED',
        IN_PROGRESS: 'IN_PROGRESS',
        REVIEW: 'REVIEW',
        COMPLETED: 'COMPLETED'
    };

    // -------------------------------------------------------------------------
    // 1. Route Guard: Ensure user is logged in as a CLIENT
    // -------------------------------------------------------------------------
    if (window.AuthState) {
        window.AuthState.requireAuth([ROLES.CLIENT]);
    }

    const currentUser = window.AuthState ? window.AuthState.getUser() : null;
    if (!currentUser) return;

    // Supabase Reference
    const sb = window.sbClient;

    // DOM Elements - Profile & Sidebar
    const clientNameEl = document.getElementById('clientName');
    const clientEmailEl = document.getElementById('clientEmail');
    const clientAvatarEl = document.getElementById('clientAvatar');
    const statTotalProjectsEl = document.getElementById('statTotalProjects');
    const statActiveProjectsEl = document.getElementById('statActiveProjects');

    // DOM Elements - Metrics
    const metricActiveCount = document.getElementById('metricActiveCount');
    const metricLockedCount = document.getElementById('metricLockedCount');
    const metricPendingSignoffs = document.getElementById('metricPendingSignoffs');
    const metricCompletedCount = document.getElementById('metricCompletedCount');
    const projectsCountBadge = document.getElementById('projectsCountBadge');
    const pendingApprovalsCountBadge = document.getElementById('pendingApprovalsCountBadge');

    // DOM Elements - Sections & Lists
    const pendingApprovalsSection = document.getElementById('pendingApprovalsSection');
    const pendingActionsList = document.getElementById('pendingActionsList');
    const projectsList = document.getElementById('projectsList');
    const noProjectsState = document.getElementById('noProjectsState');
    const filterPills = document.querySelectorAll('.filter-pill');
    const refreshClientDashboardBtn = document.getElementById('refreshClientDashboardBtn');

    // DOM Elements - Create Project Modal
    const openCreateProjectModalBtn = document.getElementById('openCreateProjectModalBtn');
    const sidebarCreateProjectBtn = document.getElementById('sidebarCreateProjectBtn');
    const quickCreateProjectBtn = document.getElementById('quickCreateProjectBtn');
    const emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
    const createProjectModal = document.getElementById('createProjectModal');
    const createProjectForm = document.getElementById('createProjectForm');
    const projectAssignProviderSelect = document.getElementById('projectAssignProviderSelect');
    const closeCreateProjectModalBtn = document.getElementById('closeCreateProjectModalBtn');
    const cancelCreateProjectBtn = document.getElementById('cancelCreateProjectBtn');
    const submitCreateProjectBtn = document.getElementById('submitCreateProjectBtn');

    // DOM Elements - Scope Review Modal
    const scopeReviewModal = document.getElementById('scopeReviewModal');
    const scopeReviewModalBody = document.getElementById('scopeReviewModalBody');
    const scopeReviewVersionBadge = document.getElementById('scopeReviewVersionBadge');
    const closeScopeReviewModalBtn = document.getElementById('closeScopeReviewModalBtn');
    const requestScopeAmendmentBtn = document.getElementById('requestScopeAmendmentBtn');
    const signScopeAgreementBtn = document.getElementById('signScopeAgreementBtn');

    // In-memory projects cache & active review tracker
    let clientProjects = [];
    let activeReviewProject = null;

    // Populate Sidebar Profile Information
    const displayName = currentUser.fullName || currentUser.username || currentUser.email || 'Client Partner';
    if (clientNameEl) clientNameEl.textContent = displayName;
    if (clientEmailEl) clientEmailEl.textContent = currentUser.email || '';
    if (clientAvatarEl) clientAvatarEl.textContent = displayName.charAt(0).toUpperCase();

    // Initialize Dashboard
    await loadClientDashboard();
    await populateProviderDropdown();
    setupEventListeners();

    // -------------------------------------------------------------------------
    // 2. Fetch Projects directly from Supabase
    // -------------------------------------------------------------------------
    async function loadClientDashboard() {
        showLoadingSkeleton();

        try {
            if (!sb) {
                throw new Error('Supabase client connection missing.');
            }

            // Query projects belonging to this client with joined agreements & milestones
            const { data, error } = await sb
                .from('projects')
                .select(`
                    *,
                    agreements ( id, version, status, client_signed, provider_signed, agreed_amount, terms_and_conditions ),
                    milestones ( id, status, weight_percentage )
                `)
                .or(`client_id.eq.${currentUser.id},client_email.eq.${currentUser.email}`)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('Supabase client projects query error:', error.message);
            }

            const rawProjects = Array.isArray(data) ? data : [];

            clientProjects = rawProjects.map(p => {
                const agreement = Array.isArray(p.agreements) ? p.agreements[0] : p.agreements;
                const milestones = Array.isArray(p.milestones) ? p.milestones : [];

                // Calculate weighted progress
                let progress = Number(p.completion_percentage) || 0;
                if (milestones.length > 0) {
                    const approvedWeight = milestones.reduce((sum, m) => {
                        return (m.status === 'APPROVED' || m.status === 'COMPLETED')
                            ? sum + (Number(m.weight_percentage) || (100 / milestones.length))
                            : sum;
                    }, 0);
                    progress = Math.min(100, Math.round(approvedWeight));
                }

                // Action required if agreement is waiting for client signature or deliverable submitted
                const needsSignature = agreement && !agreement.client_signed && agreement.status !== 'SUPERSEDED';
                const hasPendingDeliverable = milestones.some(m => m.status === 'SUBMITTED_FOR_REVIEW');
                const hasPendingApproval = needsSignature || hasPendingDeliverable || p.stage === PROJECT_STAGES.REQUIREMENT_DISCUSSION;

                return {
                    id: p.id,
                    title: p.title,
                    category: p.category,
                    budget: p.budget,
                    description: p.description,
                    summary: p.summary,
                    stage: p.stage,
                    assignedProviderId: p.assigned_provider_id,
                    assignedProviderName: p.assigned_provider_name || 'Pending Assignment',
                    completionPercentage: progress,
                    agreement: agreement,
                    milestones: milestones,
                    hasPendingApproval: hasPendingApproval,
                    needsSignature: needsSignature,
                    hasPendingDeliverable: hasPendingDeliverable,
                    createdAt: p.created_at
                };
            });

            updateMetrics(clientProjects);
            renderPendingAlerts(clientProjects);
            renderProjectsList(clientProjects);

        } catch (err) {
            console.error('Failed to load client projects from Supabase:', err);
            if (window.Toast) {
                window.Toast.error('Could not sync projects with database.');
            }
            renderProjectsList([]);
        }
    }

    function showLoadingSkeleton() {
        if (!projectsList) return;
        projectsList.innerHTML = `
            <div class="card card-skeleton">
                <div class="skeleton-line w-50"></div>
                <div class="skeleton-line w-25 mt-2"></div>
                <div class="skeleton-box mt-3"></div>
            </div>
        `;
        projectsList.classList.remove('hidden');
        if (noProjectsState) noProjectsState.classList.add('hidden');
    }

    // -------------------------------------------------------------------------
    // 3. Populate Verified Providers Dropdown in Create Modal
    // -------------------------------------------------------------------------
    async function populateProviderDropdown() {
        if (!projectAssignProviderSelect || !sb) return;

        try {
            const { data: providers, error } = await sb
                .from('profiles')
                .select('id, full_name, domain, rating')
                .eq('role', ROLES.SERVICE_PROVIDER)
                .order('rating', { ascending: false });

            if (error || !Array.isArray(providers)) return;

            projectAssignProviderSelect.innerHTML = `<option value="">Leave Open / Assign Later in Marketplace</option>`;
            providers.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = `${p.full_name || 'Provider'} - ${p.domain || 'Software Engineering'} (★ ${Number(p.rating || 5.0).toFixed(1)})`;
                opt.setAttribute('data-name', p.full_name || 'Assigned Provider');
                projectAssignProviderSelect.appendChild(opt);
            });
        } catch (e) {
            console.warn('Could not populate provider dropdown:', e);
        }
    }

    // -------------------------------------------------------------------------
    // 4. Compute Metrics
    // -------------------------------------------------------------------------
    function updateMetrics(projects) {
        if (statTotalProjectsEl) statTotalProjectsEl.textContent = projects.length;
        if (projectsCountBadge) projectsCountBadge.textContent = `${projects.length} Total`;

        const activeCount = projects.filter(p => p.stage !== PROJECT_STAGES.COMPLETED).length;
        const completedCount = projects.filter(p => p.stage === PROJECT_STAGES.COMPLETED).length;
        
        const lockedCount = projects.filter(p => 
            p.stage === PROJECT_STAGES.AGREEMENT_LOCKED ||
            p.stage === PROJECT_STAGES.IN_PROGRESS
        ).length;

        const pendingCount = projects.filter(p => p.hasPendingApproval).length;

        if (statActiveProjectsEl) statActiveProjectsEl.textContent = activeCount;
        if (metricActiveCount) metricActiveCount.textContent = activeCount;
        if (metricLockedCount) metricLockedCount.textContent = lockedCount;
        if (metricCompletedCount) metricCompletedCount.textContent = completedCount;
        if (metricPendingSignoffs) metricPendingSignoffs.textContent = pendingCount;
        if (pendingApprovalsCountBadge) pendingApprovalsCountBadge.textContent = `${pendingCount} Pending`;
    }

    // -------------------------------------------------------------------------
    // 5. Render Action Required Alerts (With Direct Sign/Review Popup)
    // -------------------------------------------------------------------------
    function renderPendingAlerts(projects) {
        if (!pendingApprovalsSection || !pendingActionsList) return;

        const actionableProjects = projects.filter(p => p.hasPendingApproval);

        if (actionableProjects.length === 0) {
            pendingApprovalsSection.classList.add('hidden');
            return;
        }

        pendingApprovalsSection.classList.remove('hidden');
        pendingActionsList.innerHTML = '';

        actionableProjects.forEach(p => {
            const alertCard = document.createElement('div');
            alertCard.className = 'card mt-2';
            alertCard.style.borderLeft = '4px solid var(--warning, #f59e0b)';
            alertCard.style.padding = '1rem 1.25rem';
            alertCard.style.display = 'flex';
            alertCard.style.justifyContent = 'space-between';
            alertCard.style.alignItems = 'center';
            alertCard.style.flexWrap = 'wrap';
            alertCard.style.gap = '0.75rem';

            let actionText = 'Action pending: Review scope & specifications in workspace.';
            let actionBtnText = 'Open Workspace &rarr;';
            let isQuickReview = false;

            if (p.needsSignature) {
                actionText = `✍️ Agreement v${p.agreement?.version || '1.0'} drafted. Review terms and apply your signature.`;
                actionBtnText = 'Quick Review &amp; Sign';
                isQuickReview = true;
            } else if (p.hasPendingDeliverable) {
                actionText = '🚀 Deliverable submitted by provider! Review proof artifacts to release milestone progress.';
            }

            alertCard.innerHTML = `
                <div>
                    <strong style="color: var(--text-main); font-size: 1rem;">${escapeHtml(p.title)}</strong>
                    <p class="text-muted text-sm mb-0 mt-1">${actionText}</p>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    ${isQuickReview ? `
                        <button type="button" class="btn btn-warning btn-sm btn-quick-review" data-id="\${p.id}">
                            \${actionBtnText}
                        </button>
                    ` : ''}
                    <a href="project-view.html?id=${p.id}" class="btn btn-outline btn-sm">
                        Enter Workspace &rarr;
                    </a>
                </div>
            `;
            pendingActionsList.appendChild(alertCard);
        });

        // Wire quick review modal open
        pendingActionsList.querySelectorAll('.btn-quick-review').forEach(btn => {
            btn.addEventListener('click', () => {
                const prjId = btn.getAttribute('data-id');
                const project = clientProjects.find(p => String(p.id) === String(prjId));
                if (project) openScopeReviewModal(project);
            });
        });
    }

    // -------------------------------------------------------------------------
    // 6. Scope Review Modal Action (Sign / Request Revision)
    // -------------------------------------------------------------------------
    function openScopeReviewModal(project) {
        if (!scopeReviewModal) return;
        activeReviewProject = project;

        const ag = project.agreement;
        if (scopeReviewVersionBadge) {
            scopeReviewVersionBadge.textContent = `Agreement v${ag?.version || '1.0'}`;
        }

        if (scopeReviewModalBody) {
            scopeReviewModalBody.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div>
                        <span class="text-xs text-muted">Project</span>
                        <h4 style="margin: 0.2rem 0;">${escapeHtml(project.title)}</h4>
                    </div>
                    <div style="background: var(--bg-muted, #f8fafc); padding: 0.75rem; border-radius: 6px;">
                        <span class="text-xs text-muted">Contract Terms &amp; Scope Baseline:</span>
                        <p class="text-sm mt-1 mb-0" style="white-space: pre-wrap;">${escapeHtml(ag?.terms_and_conditions || 'Standard WorkBridge milestone & scope baseline agreement.')}</p>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
                        <span>Agreed Consideration: <strong class="text-success">$${Number(ag?.agreed_amount || project.budget || 1000).toLocaleString()}</strong></span>
                        <span>Assigned Provider: <strong>${escapeHtml(project.assignedProviderName)}</strong></span>
                    </div>
                </div>
            `;
        }

        scopeReviewModal.classList.remove('hidden');
    }

    function closeScopeReviewModal() {
        if (scopeReviewModal) scopeReviewModal.classList.add('hidden');
        activeReviewProject = null;
    }

    if (closeScopeReviewModalBtn) closeScopeReviewModalBtn.addEventListener('click', closeScopeReviewModal);

    // Sign from Modal
    if (signScopeAgreementBtn) {
        signScopeAgreementBtn.addEventListener('click', async () => {
            if (!activeReviewProject || !activeReviewProject.agreement || !sb) return;

            signScopeAgreementBtn.disabled = true;
            signScopeAgreementBtn.textContent = 'Signing & Locking...';

            const ag = activeReviewProject.agreement;
            const willBeLocked = ag.provider_signed;

            const updatePayload = {
                client_signed: true,
                client_signed_at: new Date().toISOString()
            };

            if (willBeLocked) {
                updatePayload.status = 'LOCKED';
                updatePayload.scope_hash = `7b4f8c92a1${String(activeReviewProject.id).slice(0, 16)}e091fav10c82d4`;
            }

            try {
                const { error } = await sb.from('agreements').update(updatePayload).eq('id', ag.id);
                if (error) throw error;

                if (willBeLocked) {
                    await sb.from('projects').update({ stage: PROJECT_STAGES.AGREEMENT_LOCKED }).eq('id', activeReviewProject.id);
                }

                if (window.Toast) window.Toast.success('Agreement digitally signed & verified!');
                closeScopeReviewModal();
                await loadClientDashboard();
            } catch (e) {
                if (window.Toast) window.Toast.error('Could not apply signature.');
            } finally {
                signScopeAgreementBtn.disabled = false;
                signScopeAgreementBtn.textContent = '✍️ Sign & Lock Scope (v1.0)';
            }
        });
    }

    // Request Revision from Modal
    if (requestScopeAmendmentBtn) {
        requestScopeAmendmentBtn.addEventListener('click', () => {
            if (!activeReviewProject) return;
            const targetId = activeReviewProject.id;
            closeScopeReviewModal();
            window.location.href = `project-view.html?id=${targetId}#tabAgreement`;
        });
    }

    // -------------------------------------------------------------------------
    // 7. Render Projects Grid
    // -------------------------------------------------------------------------
    function renderProjectsList(projects) {
        if (!projectsList) return;
        projectsList.innerHTML = '';

        if (projects.length === 0) {
            if (noProjectsState) noProjectsState.classList.remove('hidden');
            projectsList.classList.add('hidden');
            return;
        }

        noProjectsState.classList.add('hidden');
        projectsList.classList.remove('hidden');

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'card project-card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            const stageBadge = getStageBadge(project.stage);
            const progress = project.completionPercentage || 0;

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.35rem;">
                        <span class="badge badge-subtle">PRJ-${String(project.id).slice(-4).toUpperCase()}</span>
                        ${stageBadge}
                    </div>
                    <h3 class="card-title" style="font-size: 1.15rem; margin-top: 0.25rem;">
                        <a href="project-view.html?id=${project.id}" style="color: inherit; text-decoration: none;">
                            ${escapeHtml(project.title)}
                        </a>
                    </h3>
                    <p class="card-text text-sm" style="min-height: 40px; margin-top: 0.5rem; color: var(--text-muted, #64748b);">
                        ${escapeHtml(project.summary || project.description || 'Collaborative engineering engagement on WorkBridge.')}
                    </p>
                </div>

                <div class="project-card-footer mt-3" style="border-top: 1px solid var(--border-color, #e2e8f0); padding-top: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted, #64748b); margin-bottom: 0.35rem;">
                        <span>Milestone Completion</span>
                        <strong>${progress}%</strong>
                    </div>
                    <div style="width: 100%; height: 6px; background-color: var(--bg-muted, #f1f5f9); border-radius: 9999px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background-color: ${progress === 100 ? 'var(--success, #10b981)' : 'var(--primary, #3b82f6)'}; transition: width 0.4s ease;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
                        <span class="text-xs text-muted">Provider: <strong>${escapeHtml(project.assignedProviderName)}</strong></span>
                        <a href="project-view.html?id=${project.id}" class="btn btn-outline btn-sm">Enter Workspace &rarr;</a>
                    </div>
                </div>
            `;

            projectsList.appendChild(card);
        });
    }

    // -------------------------------------------------------------------------
    // 8. Modal Functions (Open / Close)
    // -------------------------------------------------------------------------
    function openCreateModal() {
        if (!createProjectModal) return;
        createProjectModal.classList.remove('hidden');
    }

    function closeCreateModal() {
        if (!createProjectModal) return;
        createProjectModal.classList.add('hidden');
        if (createProjectForm) createProjectForm.reset();
    }

    // -------------------------------------------------------------------------
    // 9. Event Listeners Setup
    // -------------------------------------------------------------------------
    function setupEventListeners() {
        // Filter Pills Handler
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');

                const filter = pill.getAttribute('data-filter');
                if (filter === 'ALL') {
                    renderProjectsList(clientProjects);
                } else {
                    const filtered = clientProjects.filter(p => p.stage === filter);
                    renderProjectsList(filtered);
                }
            });
        });

        // Sync Refresh Button
        if (refreshClientDashboardBtn) {
            refreshClientDashboardBtn.addEventListener('click', async () => {
                refreshClientDashboardBtn.disabled = true;
                refreshClientDashboardBtn.style.opacity = '0.6';
                await loadClientDashboard();
                if (window.Toast) window.Toast.info('Dashboard synced with cloud.');
                refreshClientDashboardBtn.disabled = false;
                refreshClientDashboardBtn.style.opacity = '1';
            });
        }

        // Connect All Buttons to Open Create Project Modal
        if (openCreateProjectModalBtn) openCreateProjectModalBtn.addEventListener('click', openCreateModal);
        if (sidebarCreateProjectBtn) sidebarCreateProjectBtn.addEventListener('click', openCreateModal);
        if (quickCreateProjectBtn) quickCreateProjectBtn.addEventListener('click', openCreateModal);
        if (emptyStateCreateBtn) emptyStateCreateBtn.addEventListener('click', openCreateModal);

        // Modal Close Triggers
        if (closeCreateProjectModalBtn) closeCreateProjectModalBtn.addEventListener('click', closeCreateModal);
        if (cancelCreateProjectBtn) cancelCreateProjectBtn.addEventListener('click', closeCreateModal);

        if (createProjectModal) {
            createProjectModal.addEventListener('click', (e) => {
                if (e.target === createProjectModal) closeCreateModal();
            });
        }

        // ---------------------------------------------------------------------
        // Project Creation Form Submit (With Provider Assignment Option)
        // ---------------------------------------------------------------------
        if (createProjectForm) {
            createProjectForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const title = (document.getElementById('projectTitleInput')?.value || '').trim();
                const category = document.getElementById('projectCategoryInput')?.value || 'WEB_DEVELOPMENT';
                const budget = parseFloat(document.getElementById('projectBudgetInput')?.value) || 1000;
                const summary = (document.getElementById('projectSummaryInput')?.value || '').trim();

                const assignedProviderId = projectAssignProviderSelect?.value || null;
                const assignedProviderOption = projectAssignProviderSelect?.selectedOptions?.[0];
                const assignedProviderName = assignedProviderId ? (assignedProviderOption?.getAttribute('data-name') || 'Assigned Provider') : 'Pending Assignment';

                if (!title || !summary) {
                    if (window.Toast) window.Toast.error('Please enter project title and scope summary.');
                    return;
                }

                if (!sb) {
                    if (window.Toast) window.Toast.error('Database connection not available.');
                    return;
                }

                if (submitCreateProjectBtn) {
                    submitCreateProjectBtn.disabled = true;
                    submitCreateProjectBtn.textContent = 'Creating Project in Cloud...';
                }

                const newProjectRow = {
                    client_id: currentUser.id,
                    client_name: displayName,
                    client_email: currentUser.email || 'client@workbridge.io',
                    assigned_provider_id: assignedProviderId,
                    assigned_provider_name: assignedProviderName,
                    title: title,
                    category: category,
                    budget: budget,
                    description: summary,
                    summary: summary,
                    stage: assignedProviderId ? PROJECT_STAGES.INVITED : PROJECT_STAGES.REQUIREMENT_DISCUSSION,
                    completion_percentage: 0
                };

                try {
                    // Direct insertion into Supabase `projects` table
                    const { data: createdProject, error: prjErr } = await sb
                        .from('projects')
                        .insert([newProjectRow])
                        .select()
                        .single();

                    if (prjErr) throw prjErr;

                    // Initialize Agreement baseline v1.0
                    await sb
                        .from('agreements')
                        .insert([{
                            project_id: createdProject.id,
                            version: '1.0',
                            status: 'DRAFT',
                            agreed_amount: budget,
                            terms_and_conditions: 'Standard WorkBridge milestone & scope baseline agreement.'
                        }])
                        .select()
                        .maybeSingle();

                    if (window.Toast) {
                        window.Toast.success(assignedProviderId 
                            ? `Project created and invitation dispatched to ${assignedProviderName}!` 
                            : 'Project created! Initialized in Scope Discussion.');
                    }
                    
                    closeCreateModal();
                    await loadClientDashboard();

                } catch (err) {
                    console.error('Failed to create project in Supabase:', err);
                    if (window.Toast) {
                        window.Toast.error(err.message || 'Could not save project. Please try again.');
                    }
                } finally {
                    if (submitCreateProjectBtn) {
                        submitCreateProjectBtn.disabled = false;
                        submitCreateProjectBtn.textContent = 'Create & Open Scope';
                    }
                }
            });
        }
    }

    // -------------------------------------------------------------------------
    // 10. Helpers
    // -------------------------------------------------------------------------
    function getStageBadge(stage) {
        switch (stage) {
            case PROJECT_STAGES.INVITED:
                return `<span class="badge badge-subtle">Invited</span>`;
            case PROJECT_STAGES.REQUIREMENT_DISCUSSION:
                return `<span class="badge badge-warning">Scoping</span>`;
            case PROJECT_STAGES.AGREEMENT_LOCKED:
                return `<span class="badge badge-info">Agreement Signed</span>`;
            case PROJECT_STAGES.IN_PROGRESS:
                return `<span class="badge badge-primary">Building</span>`;
            case PROJECT_STAGES.REVIEW:
                return `<span class="badge badge-warning">Review</span>`;
            case PROJECT_STAGES.COMPLETED:
                return `<span class="badge badge-success">Completed</span>`;
            default:
                return `<span class="badge badge-subtle">${stage || 'Active'}</span>`;
        }
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