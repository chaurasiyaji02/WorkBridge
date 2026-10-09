/**
 * WORKBRIDGE - CLIENT DASHBOARD PAGE CONTROLLER
 * File: js/pages/clientDashboardPage.js
 * 
 * Synchronized with client-dashboard.html DOM elements.
 * Handles client authentication guards, metric aggregates, project listing,
 * stage pill filtering, action item alerts, and the Create Project modal workflow.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || { CLIENT: 'CLIENT' };
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

    // DOM Elements - Modal & Buttons (Strictly matching client-dashboard.html)
    const openCreateProjectModalBtn = document.getElementById('openCreateProjectModalBtn');
    const quickCreateProjectBtn = document.getElementById('quickCreateProjectBtn');
    const emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
    const createProjectModal = document.getElementById('createProjectModal');
    const createProjectForm = document.getElementById('createProjectForm');
    const closeCreateProjectModalBtn = document.getElementById('closeCreateProjectModalBtn');
    const cancelCreateProjectBtn = document.getElementById('cancelCreateProjectBtn');
    const submitCreateProjectBtn = document.getElementById('submitCreateProjectBtn');

    // Populate Sidebar Profile Information
    const displayName = currentUser.fullName || currentUser.username || currentUser.email || 'Client Workspace';
    if (clientNameEl) clientNameEl.textContent = displayName;
    if (clientEmailEl) clientEmailEl.textContent = currentUser.email || '';
    if (clientAvatarEl) clientAvatarEl.textContent = displayName.charAt(0).toUpperCase();

    // In-memory projects cache
    let clientProjects = [];

    // Load initial dashboard data
    await loadClientDashboard();

    // Setup Event Listeners
    setupEventListeners();

    // -------------------------------------------------------------------------
    // 2. Fetch Dashboard Data & Projects (Safe Hybrid Sync)
    // -------------------------------------------------------------------------
    async function loadClientDashboard() {
        let remoteProjects = [];
        try {
            if (window.ProjectApi && typeof window.ProjectApi.getClientProjects === 'function') {
                const data = await window.ProjectApi.getClientProjects('ALL');
                remoteProjects = Array.isArray(data) ? data : [];
            }
        } catch (error) {
            console.warn('Backend client projects query deferred, loading local pipeline:', error.message);
        }

        // Merge with local projects created by this client (or from explore page invitations)
        const localProjects = JSON.parse(localStorage.getItem('wb_local_projects') || '[]');
        const localInvites = JSON.parse(localStorage.getItem('wb_local_invitations') || '[]');

        const combinedMap = new Map();

        // 1. Add remote projects
        remoteProjects.forEach(p => combinedMap.set(String(p.id), p));

        // 2. Add local created projects
        localProjects.forEach(p => {
            if (!combinedMap.has(String(p.id))) {
                combinedMap.set(String(p.id), p);
            }
        });

        // 3. Add explore invitations initiated by this client
        localInvites.forEach(inv => {
            if (!combinedMap.has(String(inv.id))) {
                combinedMap.set(String(inv.id), {
                    id: inv.id,
                    title: inv.title,
                    description: inv.description || inv.summary,
                    summary: inv.summary,
                    stage: inv.stage || PROJECT_STAGES.INVITED,
                    assignedProviderName: inv.providerName || 'Invited Provider',
                    budget: inv.budget,
                    completionPercentage: 10,
                    hasPendingApproval: false
                });
            }
        });

        clientProjects = Array.from(combinedMap.values());

        // Update UI
        updateMetrics(clientProjects);
        renderPendingAlerts(clientProjects);
        renderProjectsList(clientProjects);
    }

    // -------------------------------------------------------------------------
    // 3. Compute Metrics
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

        const pendingCount = projects.filter(p => 
            p.stage === PROJECT_STAGES.REQUIREMENT_DISCUSSION || 
            p.stage === PROJECT_STAGES.AGREEMENT_LOCKED ||
            p.hasPendingApproval
        ).length;

        if (statActiveProjectsEl) statActiveProjectsEl.textContent = activeCount;
        if (metricActiveCount) metricActiveCount.textContent = activeCount;
        if (metricLockedCount) metricLockedCount.textContent = lockedCount;
        if (metricCompletedCount) metricCompletedCount.textContent = completedCount;
        if (metricPendingSignoffs) metricPendingSignoffs.textContent = pendingCount;
        if (pendingApprovalsCountBadge) pendingApprovalsCountBadge.textContent = `${pendingCount} Pending`;
    }

    // -------------------------------------------------------------------------
    // 4. Render Pending Action Alerts (Sign-offs / Approvals)
    // -------------------------------------------------------------------------
    function renderPendingAlerts(projects) {
        if (!pendingApprovalsSection || !pendingActionsList) return;

        const actionableProjects = projects.filter(p => 
            p.stage === PROJECT_STAGES.REQUIREMENT_DISCUSSION || 
            p.stage === PROJECT_STAGES.AGREEMENT_LOCKED || 
            p.hasPendingApproval
        );

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

            let actionText = 'Action pending: Review & lock requirement specifications with provider.';
            if (p.stage === PROJECT_STAGES.AGREEMENT_LOCKED) {
                actionText = 'Action pending: Digital Agreement drafted. Review terms and apply signature.';
            }

            alertCard.innerHTML = `
                <div>
                    <strong style="color: var(--text-main); font-size: 1rem;">${escapeHtml(p.title)}</strong>
                    <p class="text-muted text-sm mb-0 mt-1">${actionText}</p>
                </div>
                <a href="project-view.html?id=${p.id}" class="btn btn-primary btn-sm">
                    Open Workspace &rarr;
                </a>
            `;
            pendingActionsList.appendChild(alertCard);
        });
    }

    // -------------------------------------------------------------------------
    // 5. Render Projects Grid
    // -------------------------------------------------------------------------
    function renderProjectsList(projects) {
        if (!projectsList) return;
        projectsList.innerHTML = '';

        if (projects.length === 0) {
            if (noProjectsState) noProjectsState.classList.remove('hidden');
            projectsList.classList.add('hidden');
            return;
        }

        if (noProjectsState) noProjectsState.classList.add('hidden');
        projectsList.classList.remove('hidden');

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'card project-card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            const stageBadge = getStageBadge(project.stage);
            const rawProgress = project.completionPercentage ?? project.progressPercentage ?? project.progress ?? 0;
            const progress = Math.min(100, Math.max(0, Number(rawProgress) || 0));

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <span class="badge badge-subtle">PRJ-${String(project.id).padStart(3, '0')}</span>
                        ${stageBadge}
                    </div>
                    <h3 class="card-title" style="font-size: 1.15rem; margin-top: 0.25rem;">
                        <a href="project-view.html?id=${project.id}" style="color: inherit; text-decoration: none;">
                            ${escapeHtml(project.title)}
                        </a>
                    </h3>
                    <p class="card-text text-sm" style="min-height: 40px; margin-top: 0.5rem; color: var(--text-muted);">
                        ${escapeHtml(project.description || project.summary || 'Collaborative engineering engagement on WorkBridge.')}
                    </p>
                </div>

                <div class="project-card-footer mt-3" style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                        <span>Milestone Completion</span>
                        <strong>${progress}%</strong>
                    </div>
                    <div style="width: 100%; height: 6px; background-color: var(--bg-muted, #e2e8f0); border-radius: 9999px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background-color: var(--primary, #3b82f6); transition: width 0.4s ease;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.85rem;">
                        <span class="text-xs text-muted">Provider: <strong>${escapeHtml(project.assignedProviderName || project.providerName || 'Pending Assignment')}</strong></span>
                        <a href="project-view.html?id=${project.id}" class="btn btn-outline btn-sm">Enter Workspace &rarr;</a>
                    </div>
                </div>
            `;

            projectsList.appendChild(card);
        });
    }

    // -------------------------------------------------------------------------
    // 6. Modal Functions (Open / Close)
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
    // 7. Event Listeners Setup
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
                if (window.Toast) window.Toast.info('Dashboard synced.');
                refreshClientDashboardBtn.disabled = false;
                refreshClientDashboardBtn.style.opacity = '1';
            });
        }

        // Connect ALL 3 buttons to open Create Project Modal
        if (openCreateProjectModalBtn) openCreateProjectModalBtn.addEventListener('click', openCreateModal);
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

        // Project Creation Form Submit Handler
        if (createProjectForm) {
            createProjectForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const title = (document.getElementById('projectTitleInput')?.value || '').trim();
                const category = document.getElementById('projectCategoryInput')?.value || 'WEB_DEVELOPMENT';
                const budget = document.getElementById('projectBudgetInput')?.value || 1000;
                const summary = (document.getElementById('projectSummaryInput')?.value || '').trim();

                if (!title || !summary) {
                    if (window.Toast) window.Toast.error('Please enter project title and scope summary.');
                    return;
                }

                if (submitCreateProjectBtn) {
                    submitCreateProjectBtn.disabled = true;
                    submitCreateProjectBtn.textContent = 'Creating Project...';
                }

                const newProjectPayload = {
                    id: Date.now(),
                    title,
                    category,
                    budget: Number(budget),
                    description: summary,
                    summary: summary,
                    stage: PROJECT_STAGES.INVITED,
                    assignedProviderName: 'Pending Assignment',
                    completionPercentage: 0,
                    hasPendingApproval: false,
                    createdAt: new Date().toISOString()
                };

                // 1. Immediately store into local pipeline so client dashboard updates without delay
                const localProjects = JSON.parse(localStorage.getItem('wb_local_projects') || '[]');
                localProjects.unshift(newProjectPayload);
                localStorage.setItem('wb_local_projects', JSON.stringify(localProjects));

                // 2. Attempt remote save if API is reachable
                try {
                    if (window.ProjectApi && typeof window.ProjectApi.createProject === 'function') {
                        await window.ProjectApi.createProject({
                            title,
                            category,
                            budget: Number(budget),
                            description: summary
                        });
                    }
                } catch (err) {
                    console.warn('Backend sync deferred, project registered in local dashboard:', err.message);
                }

                if (window.Toast) window.Toast.success('Project created successfully!');
                closeCreateModal();

                if (submitCreateProjectBtn) {
                    submitCreateProjectBtn.disabled = false;
                    submitCreateProjectBtn.textContent = 'Create & Open Scope';
                }

                // Immediately re-load to display new project card
                await loadClientDashboard();
            });
        }
    }

    // -------------------------------------------------------------------------
    // 8. Helpers & Fallbacks
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