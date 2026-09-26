/**
 * WORKBRIDGE - SERVICE PROVIDER DASHBOARD CONTROLLER
 * File: js/pages/providerDashboardPage.js
 * 
 * Handles route guarding, invitation processing (Accept/Decline),
 * provider metric calculation, and active engagement listing.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const { ROLES, PROJECT_STAGES } = window.APP_CONFIG;

    // -------------------------------------------------------------------------
    // 1. Route Guard: Ensure user is logged in as a SERVICE_PROVIDER
    // -------------------------------------------------------------------------
    window.AuthState.requireAuth([ROLES.SERVICE_PROVIDER]);

    const currentUser = window.AuthState.getUser();
    if (!currentUser) return;

    // DOM Elements - Profile & Sidebar
    const providerNameEl = document.getElementById('providerName');
    const providerEmailEl = document.getElementById('providerEmail');
    const providerAvatarEl = document.getElementById('providerAvatar');

    // DOM Elements - Metrics
    const metricInvitesCount = document.getElementById('metricInvitesCount');
    const metricActiveProjects = document.getElementById('metricActiveProjects');
    const metricDraftAgreements = document.getElementById('metricDraftAgreements');
    const metricCompletedProjects = document.getElementById('metricCompletedProjects');
    const invitesBadge = document.getElementById('invitesBadge');

    // DOM Elements - Lists & Containers
    const invitationsList = document.getElementById('invitationsList');
    const noInvitesState = document.getElementById('noInvitesState');
    const providerProjectsList = document.getElementById('providerProjectsList');
    const noProviderProjectsState = document.getElementById('noProviderProjectsState');
    const filterPills = document.querySelectorAll('.filter-pill');

    // Populate Sidebar Profile Info
    providerNameEl.textContent = currentUser.fullName || 'Engineering Team';
    providerEmailEl.textContent = currentUser.email;
    providerAvatarEl.textContent = (currentUser.fullName || currentUser.email).charAt(0).toUpperCase();

    // In-memory data store
    let pendingInvitations = [];
    let providerProjects = [];

    // Load initial dashboard data
    await loadProviderDashboard();

    // -------------------------------------------------------------------------
    // 2. Fetch Dashboard Data
    // -------------------------------------------------------------------------
    async function loadProviderDashboard() {
        try {
            const [invitesData, projectsData] = await Promise.all([
                window.ProjectApi.getProviderInvitations().catch(() => []),
                window.ProjectApi.getProviderProjects('ALL').catch(() => [])
            ]);

            pendingInvitations = Array.isArray(invitesData) ? invitesData : [];
            providerProjects = Array.isArray(projectsData) ? projectsData : [];

            // Fallback mock items if testing locally without running backend
            if (pendingInvitations.length === 0 && providerProjects.length === 0) {
                const mock = getFallbackProviderData();
                pendingInvitations = mock.invitations;
                providerProjects = mock.projects;
            }

            updateMetrics();
            renderInvitations();
            renderProjectsList(providerProjects);

        } catch (error) {
            console.error('Failed to load provider workspace:', error);
            window.Toast.error('Could not load workspace. Showing offline cache.');
        }
    }

    // -------------------------------------------------------------------------
    // 3. Compute Metrics
    // -------------------------------------------------------------------------
    function updateMetrics() {
        metricInvitesCount.textContent = pendingInvitations.length;
        invitesBadge.textContent = `${pendingInvitations.length} Pending`;

        const activeCount = providerProjects.filter(p => p.stage !== PROJECT_STAGES.COMPLETED).length;
        const completedCount = providerProjects.filter(p => p.stage === PROJECT_STAGES.COMPLETED).length;
        const draftAgreementsCount = providerProjects.filter(p => p.stage === PROJECT_STAGES.REQUIREMENT_DISCUSSION).length;

        metricActiveProjects.textContent = activeCount;
        metricCompletedProjects.textContent = completedCount;
        metricDraftAgreements.textContent = draftAgreementsCount;
    }

    // -------------------------------------------------------------------------
    // 4. Render Incoming Invitations (With Accept / Decline Handlers)
    // -------------------------------------------------------------------------
    function renderInvitations() {
        invitationsList.innerHTML = '';

        if (pendingInvitations.length === 0) {
            noInvitesState.classList.remove('hidden');
            invitationsList.classList.add('hidden');
            return;
        }

        noInvitesState.classList.add('hidden');
        invitationsList.classList.remove('hidden');

        pendingInvitations.forEach(invite => {
            const inviteCard = document.createElement('div');
            inviteCard.className = 'card mt-2';
            inviteCard.style.borderLeft = '4px solid var(--info)';

            inviteCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 250px;">
                        <span class="badge badge-info mb-1">New Collaboration Invite</span>
                        <h3 class="card-title mt-1" style="font-size: 1.15rem;">${escapeHtml(invite.title)}</h3>
                        <p class="card-text text-sm mt-1">${escapeHtml(invite.summary || 'Initial project collaboration request.')}</p>
                        <span class="text-xs text-muted">Client: <strong>${escapeHtml(invite.clientName || 'Verified Client')}</strong></span>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-self: center;">
                        <button type="button" class="btn btn-outline btn-sm btn-decline-invite" data-id="${invite.id}">
                            Decline
                        </button>
                        <button type="button" class="btn btn-primary btn-sm btn-accept-invite" data-id="${invite.id}">
                            Accept & Open Workspace
                        </button>
                    </div>
                </div>
            `;

            invitationsList.appendChild(inviteCard);
        });

        // Attach listeners for invitation actions
        document.querySelectorAll('.btn-accept-invite').forEach(btn => {
            btn.addEventListener('click', () => handleInvitationResponse(btn.getAttribute('data-id'), 'ACCEPT'));
        });

        document.querySelectorAll('.btn-decline-invite').forEach(btn => {
            btn.addEventListener('click', () => handleInvitationResponse(btn.getAttribute('data-id'), 'DECLINE'));
        });
    }

    async function handleInvitationResponse(projectId, action) {
        try {
            await window.ProjectApi.respondToInvitation(projectId, action);
            
            if (action === 'ACCEPT') {
                window.Toast.success('Invitation accepted! Opening collaboration workspace...');
                setTimeout(() => {
                    window.location.href = `project-view.html?id=${projectId}`;
                }, 800);
            } else {
                window.Toast.info('Invitation declined.');
                // Remove locally and re-render
                pendingInvitations = pendingInvitations.filter(inv => String(inv.id) !== String(projectId));
                updateMetrics();
                renderInvitations();
            }
        } catch (error) {
            window.Toast.error(error.message || `Failed to ${action.toLowerCase()} invitation.`);
        }
    }

    // -------------------------------------------------------------------------
    // 5. Render Active Engagements
    // -------------------------------------------------------------------------
    function renderProjectsList(projects) {
        providerProjectsList.innerHTML = '';

        if (projects.length === 0) {
            noProviderProjectsState.classList.remove('hidden');
            providerProjectsList.classList.add('hidden');
            return;
        }

        noProviderProjectsState.classList.add('hidden');
        providerProjectsList.classList.remove('hidden');

        projects.forEach(project => {
            const card = document.createElement('div');
            card.className = 'card project-card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            const stageBadge = getStageBadge(project.stage);
            const progress = project.progressPercentage !== undefined ? project.progressPercentage : 30;

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
                        ${escapeHtml(project.summary || 'Active technical collaboration.')}
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
                        <span class="text-xs text-muted">Client: <strong>${escapeHtml(project.clientName || 'Client')}</strong></span>
                        <a href="project-view.html?id=${project.id}" class="btn btn-outline btn-sm">Enter Workspace &rarr;</a>
                    </div>
                </div>
            `;

            providerProjectsList.appendChild(card);
        });
    }

    // -------------------------------------------------------------------------
    // 6. Stage Filter Pills Handler
    // -------------------------------------------------------------------------
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filter = pill.getAttribute('data-filter');
            if (filter === 'ALL') {
                renderProjectsList(providerProjects);
            } else {
                const filtered = providerProjects.filter(p => p.stage === filter);
                renderProjectsList(filtered);
            }
        });
    });

    // -------------------------------------------------------------------------
    // 7. Helpers & Fallback Generator
    // -------------------------------------------------------------------------
    function getStageBadge(stage) {
        switch (stage) {
            case PROJECT_STAGES.INVITED:
                return `<span class="badge badge-subtle">Invited</span>`;
            case PROJECT_STAGES.REQUIREMENT_DISCUSSION:
                return `<span class="badge badge-warning">Scoping</span>`;
            case PROJECT_STAGES.AGREEMENT_LOCKED:
                return `<span class="badge badge-info">Agreement Locked</span>`;
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

    function getFallbackProviderData() {
        return {
            invitations: [
                {
                    id: 201,
                    title: 'Fintech Payment Gateway Integration',
                    summary: 'Need a team to architect secure tokenized payment settlement webhooks using Spring Boot.',
                    clientName: 'Nexus Corp'
                }
            ],
            projects: [
                {
                    id: 202,
                    title: 'Inventory & Supply Chain Sync Service',
                    summary: 'Warehouse logistics synchronization pipeline with automated stock threshold alerts.',
                    stage: PROJECT_STAGES.IN_PROGRESS,
                    clientName: 'Global Retailers Ltd',
                    progressPercentage: 55
                }
            ]
        };
    }
});