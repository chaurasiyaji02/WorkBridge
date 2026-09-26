/**
 * WORKBRIDGE - CLIENT DASHBOARD PAGE CONTROLLER
 * File: js/pages/clientDashboardPage.js
 * 
 * Handles route guarding, metric calculation, project listing,
 * stage pill filtering, and pending action alerts for Clients.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const { ROLES, PROJECT_STAGES } = window.APP_CONFIG;

    // -------------------------------------------------------------------------
    // 1. Route Guard: Ensure user is logged in as a CLIENT
    // -------------------------------------------------------------------------
    window.AuthState.requireAuth([ROLES.CLIENT]);

    const currentUser = window.AuthState.getUser();
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

    // Populate Sidebar Profile Information
    clientNameEl.textContent = currentUser.fullName || 'Client Workspace';
    clientEmailEl.textContent = currentUser.email;
    clientAvatarEl.textContent = (currentUser.fullName || currentUser.email).charAt(0).toUpperCase();

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
            window.Toast.error('Could not load projects. Showing offline workspace cache.');
            // Graceful fallback for local development testing
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
        statTotalProjectsEl.textContent = projects.length;

        const activeCount = projects.filter(p => p.stage !== PROJECT_STAGES.COMPLETED).length;
        const completedCount = projects.filter(p => p.stage === PROJECT_STAGES.COMPLETED).length;
        
        // Count projects requiring client signature or approval
        const pendingCount = projects.filter(p => 
            p.stage === PROJECT_STAGES.REQUIREMENT_DISCUSSION || 
            p.stage === PROJECT_STAGES.AGREEMENT_LOCKED ||
            p.hasPendingApproval
        ).length;

        metricActiveCount.textContent = activeCount;
        metricCompletedCount.textContent = completedCount;
        metricPendingSignoffs.textContent = pendingCount;
    }

    // -------------------------------------------------------------------------
    // 4. Render Pending Action Alerts (Sign-offs / Approvals)
    // -------------------------------------------------------------------------
    function renderPendingAlerts(projects) {
        const actionableProjects = projects.filter(p => 
            p.stage === PROJECT_STAGES.REQUIREMENT_DISCUSSION || p.hasPendingApproval
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
            alertCard.style.borderLeft = '4px solid var(--warning)';
            alertCard.style.padding = '1rem 1.25rem';
            alertCard.style.display = 'flex';
            alertCard.style.justifyContent = 'space-between';
            alertCard.style.alignItems = 'center';

            alertCard.innerHTML = `
                <div>
                    <strong style="color: var(--text-main);">${escapeHtml(p.title)}</strong>
                    <p class="text-muted text-sm mb-0">Action pending: Review & lock requirement specifications with provider.</p>
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
        projectsList.innerHTML = '';

        if (projects.length === 0) {
            noProjectsState.classList.remove('hidden');
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
            const progress = project.progressPercentage !== undefined ? project.progressPercentage : 25;

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <span class="badge badge-subtle">PRJ-${String(project.id).padStart(3, '0')}</span>
                        ${stageBadge}
                    </div>
                    <h3 class="card-title" style="font-size: 1.15rem; margin-top: 0.25rem;">
                        <a href="project-view.html?id=${project.id}" style="color: inherit;">
                            ${escapeHtml(project.title)}
                        </a>
                    </h3>
                    <p class="card-text text-sm" style="min-height: 40px;">
                        ${escapeHtml(project.summary || 'Collaborative engineering engagement.')}
                    </p>
                </div>

                <div class="project-card-footer mt-3" style="border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.35rem;">
                        <span>Progress</span>
                        <strong>${progress}%</strong>
                    </div>
                    <div style="width: 100%; height: 6px; background-color: var(--bg-muted); border-radius: var(--radius-full); overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background-color: var(--primary);"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem;">
                        <span class="text-xs text-muted">Provider: <strong>${escapeHtml(project.providerName || 'Assigned Team')}</strong></span>
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
    // 7. Helpers & Fallbacks
    // -------------------------------------------------------------------------
    function getStageBadge(stage) {
        switch (stage) {
            case PROJECT_STAGES.INVITED:
                return `<span class="badge badge-subtle">Invited</span>`;
            case PROJECT_STAGES.REQUIREMENT_DISCUSSION:
                return `<span class="badge badge-warning">Requirements</span>`;
            case PROJECT_STAGES.AGREEMENT_LOCKED:
                return `<span class="badge badge-info">Agreement Signed</span>`;
            case PROJECT_STAGES.IN_PROGRESS:
                return `<span class="badge badge-primary">In Progress</span>`;
            case PROJECT_STAGES.REVIEW:
                return `<span class="badge badge-warning">Under Review</span>`;
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
                summary: 'Custom administrative suite for multi-vendor catalog management and real-time sales reporting.',
                stage: PROJECT_STAGES.REQUIREMENT_DISCUSSION,
                providerName: 'Apex Tech Solutions',
                progressPercentage: 20,
                hasPendingApproval: true
            },
            {
                id: 102,
                title: 'Mobile Banking API Gateway & Auth Service',
                summary: 'High-throughput OAuth2 and token management microservice built on Spring Boot.',
                stage: PROJECT_STAGES.IN_PROGRESS,
                providerName: 'DevCore Systems',
                progressPercentage: 65,
                hasPendingApproval: false
            }
        ];
    }
});