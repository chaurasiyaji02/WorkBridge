/**
 * WORKBRIDGE - CLIENT DASHBOARD PAGE CONTROLLER
 * File: js/pages/clientDashboardPage.js
 * 
 * Handles client authentication guards, metric aggregates, project listing,
 * stage pill filtering, action item alerts, and the Post New Project modal workflow.
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

    // DOM Elements - Metrics
    const metricActiveCount = document.getElementById('metricActiveCount');
    const metricPendingSignoffs = document.getElementById('metricPendingSignoffs');
    const metricCompletedCount = document.getElementById('metricCompletedCount');

    // DOM Elements - Sections & Lists
    const pendingApprovalsSection = document.getElementById('pendingApprovalsSection');
    const pendingActionsList = document.getElementById('pendingActionsList');
    const projectsList = document.getElementById('projectsList');
    const noProjectsState = document.getElementById('noProjectsState');
    const filterPills = document.querySelectorAll('.filter-pill');

    // DOM Elements - New Project Modal
    const btnNewProject = document.getElementById('btnNewProject');
    const newProjectModal = document.getElementById('newProjectModal');
    const newProjectForm = document.getElementById('newProjectForm');
    const btnSubmitNewProject = document.getElementById('btnSubmitNewProject');

    // Populate Sidebar Profile Information
    const displayName = currentUser.fullName || currentUser.username || currentUser.email || 'Client Workspace';
    if (clientNameEl) clientNameEl.textContent = displayName;
    if (clientEmailEl) clientEmailEl.textContent = currentUser.email || '';
    if (clientAvatarEl) clientAvatarEl.textContent = displayName.charAt(0).toUpperCase();

    // In-memory projects cache
    let clientProjects = [];

    // Load initial dashboard data
    await loadClientDashboard();

    // -------------------------------------------------------------------------
    // 2. Fetch Dashboard Data & Projects
    // -------------------------------------------------------------------------
    async function loadClientDashboard() {
        try {
            const data = await window.ProjectApi.getClientProjects('ALL');
            clientProjects = Array.isArray(data) ? data : [];
            updateMetrics(clientProjects);
            renderPendingAlerts(clientProjects);
            renderProjectsList(clientProjects);
        } catch (error) {
            console.error('Failed to load client projects:', error);
            if (window.Toast) {
                window.Toast.error('Could not connect to database. Displaying offline cached workspace.');
            }
            clientProjects = getFallbackClientProjects();
            updateMetrics(clientProjects);
            renderPendingAlerts(clientProjects);
            renderProjectsList(clientProjects);
        }
    }

    // -------------------------------------------------------------------------
    // 3. Compute Metrics
    // -------------------------------------------------------------------------
    function updateMetrics(projects) {
        if (statTotalProjectsEl) statTotalProjectsEl.textContent = projects.length;

        const activeCount = projects.filter(p => p.stage !== PROJECT_STAGES.COMPLETED).length;
        const completedCount = projects.filter(p => p.stage === PROJECT_STAGES.COMPLETED).length;
        
        // Count projects requiring client signature or approval
        const pendingCount = projects.filter(p => 
            p.stage === PROJECT_STAGES.REQUIREMENT_DISCUSSION || 
            p.stage === PROJECT_STAGES.AGREEMENT_LOCKED ||
            p.hasPendingApproval
        ).length;

        if (metricActiveCount) metricActiveCount.textContent = activeCount;
        if (metricCompletedCount) metricCompletedCount.textContent = completedCount;
        if (metricPendingSignoffs) metricPendingSignoffs.textContent = pendingCount;
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
            if (p.stage === PROJECT_STAGES.AGREEMENT_LOCKED || p.stage === 'AGREEMENT_LOCKED') {
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
    // 6. Filter Pills Handler
    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // 7. Post New Project Modal Workflow
    // -------------------------------------------------------------------------
    if (btnNewProject && newProjectModal) {
        btnNewProject.addEventListener('click', () => {
            if (window.Modal) {
                window.Modal.open(newProjectModal);
            } else {
                newProjectModal.classList.remove('hidden');
            }
        });
    }

    // Also wire any CTA button inside the empty state
    const emptyStateCreateBtn = document.getElementById('emptyStateCreateBtn');
    if (emptyStateCreateBtn && newProjectModal) {
        emptyStateCreateBtn.addEventListener('click', () => {
            if (window.Modal) {
                window.Modal.open(newProjectModal);
            } else {
                newProjectModal.classList.remove('hidden');
            }
        });
    }

    if (newProjectForm) {
        newProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const title = (document.getElementById('projectTitleInput')?.value || '').trim();
            const category = document.getElementById('projectCategorySelect')?.value || 'FULL_STACK';
            const budget = document.getElementById('projectBudgetInput')?.value || 1000;
            const deadline = document.getElementById('projectDeadlineInput')?.value || '';
            const description = (document.getElementById('projectDescriptionInput')?.value || '').trim();

            if (!title) {
                if (window.Toast) window.Toast.error('Please enter a project title.');
                return;
            }

            if (btnSubmitNewProject) {
                btnSubmitNewProject.disabled = true;
                btnSubmitNewProject.textContent = 'Posting Project...';
            }

            try {
                const createdProject = await window.ProjectApi.createProject({
                    title,
                    category,
                    budget: Number(budget),
                    deadline,
                    description
                });

                if (window.Toast) window.Toast.success('Project created! Initializing workspace...');
                if (window.Modal) {
                    window.Modal.close(newProjectModal, true);
                } else {
                    newProjectModal.classList.add('hidden');
                    newProjectForm.reset();
                }

                // Add to memory and re-render or redirect directly to workspace
                if (createdProject && createdProject.id) {
                    window.location.href = `project-view.html?id=${createdProject.id}`;
                } else {
                    await loadClientDashboard();
                }

            } catch (err) {
                console.error('Project creation error:', err);
                if (window.Toast) {
                    window.Toast.error(err.message || 'Could not post project. Please retry.');
                }
            } finally {
                if (btnSubmitNewProject) {
                    btnSubmitNewProject.disabled = false;
                    btnSubmitNewProject.textContent = 'Create Project Requirement';
                }
            }
        });
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

    function getFallbackClientProjects() {
        return [
            {
                id: 101,
                title: 'E-Commerce Admin Dashboard & Analytics',
                description: 'Custom administrative suite for multi-vendor catalog management and real-time sales reporting.',
                stage: PROJECT_STAGES.REQUIREMENT_DISCUSSION,
                assignedProviderName: 'Apex Tech Solutions',
                completionPercentage: 20,
                hasPendingApproval: true
            },
            {
                id: 102,
                title: 'Mobile Banking API Gateway & Auth Service',
                description: 'High-throughput OAuth2 and token management microservice built on Spring Boot.',
                stage: PROJECT_STAGES.IN_PROGRESS,
                assignedProviderName: 'DevCore Systems',
                completionPercentage: 65,
                hasPendingApproval: false
            }
        ];
    }
});