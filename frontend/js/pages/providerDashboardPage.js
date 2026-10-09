/**
 * WORKBRIDGE - SERVICE PROVIDER DASHBOARD CONTROLLER
 * File: js/pages/providerDashboardPage.js
 * 
 * Manages provider route guards, incoming project invitations (review/accept/decline),
 * active project milestone tracking, and service capability posting to the public explore catalog.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const { ROLES, PROJECT_STAGES } = window.APP_CONFIG || {
        ROLES: { SERVICE_PROVIDER: 'SERVICE_PROVIDER', CLIENT: 'CLIENT', ADMIN: 'ADMIN' },
        PROJECT_STAGES: {
            INVITED: 'INVITED',
            REQUIREMENT_DISCUSSION: 'REQUIREMENT_DISCUSSION',
            AGREEMENT_LOCKED: 'AGREEMENT_LOCKED',
            IN_PROGRESS: 'IN_PROGRESS',
            REVIEW: 'REVIEW',
            COMPLETED: 'COMPLETED'
        }
    };

    // -------------------------------------------------------------------------
    // 1. Route Guard: Ensure user is logged in as SERVICE_PROVIDER
    // -------------------------------------------------------------------------
    if (window.AuthState && typeof window.AuthState.requireAuth === 'function') {
        window.AuthState.requireAuth([ROLES.SERVICE_PROVIDER]);
    }

    const currentUser = window.AuthState ? window.AuthState.getUser() : null;
    if (!currentUser) return;

    // DOM Elements - Profile & Sidebar
    const providerNameEl = document.getElementById('providerName');
    const providerEmailEl = document.getElementById('providerEmail');
    const providerAvatarEl = document.getElementById('providerAvatar');
    const providerCategoryEl = document.getElementById('providerCategory');
    const capacitySubtextEl = document.getElementById('capacitySubtext');
    const activeCapacityBadgeEl = document.getElementById('activeCapacityBadge');

    // DOM Elements - Metrics
    const metricInvitesCount = document.getElementById('metricInvitesCount');
    const metricActiveProjects = document.getElementById('metricActiveProjects');
    const metricDraftAgreements = document.getElementById('metricDraftAgreements');
    const metricCompletedProjects = document.getElementById('metricCompletedProjects');
    const invitesBadge = document.getElementById('invitesBadge');
    const activeProjectsCountBadge = document.getElementById('activeProjectsCountBadge');

    // DOM Elements - Lists & Containers
    const invitationsList = document.getElementById('invitationsList');
    const noInvitesState = document.getElementById('noInvitesState');
    const providerProjectsList = document.getElementById('providerProjectsList');
    const noProviderProjectsState = document.getElementById('noProviderProjectsState');
    const filterPills = document.querySelectorAll('.filter-pill');
    const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');

    // DOM Elements - Review Invitation Modal
    const invitationModal = document.getElementById('invitationModal');
    const invitationModalTitle = document.getElementById('invitationModalTitle');
    const modalProjectCategory = document.getElementById('modalProjectCategory');
    const invitationModalContent = document.getElementById('invitationModalContent');
    const closeInvitationModalBtn = document.getElementById('closeInvitationModalBtn');
    const acceptInviteBtn = document.getElementById('acceptInviteBtn');
    const declineInviteBtn = document.getElementById('declineInviteBtn');

    // DOM Elements - Post Service Modal
    const btnOpenPostServiceModal = document.getElementById('btnOpenPostServiceModal');
    const postServiceModal = document.getElementById('postServiceModal');
    const postServiceForm = document.getElementById('postServiceForm');
    const closePostServiceModalBtn = document.getElementById('closePostServiceModalBtn');
    const cancelPostServiceBtn = document.getElementById('cancelPostServiceBtn');
    const btnSubmitService = document.getElementById('btnSubmitService');

    // Sidebar Profile Hydration
    const displayName = currentUser.fullName || currentUser.username || 'Provider Partner';
    if (providerNameEl) providerNameEl.textContent = displayName;
    if (providerEmailEl) providerEmailEl.textContent = currentUser.email || '';
    if (providerAvatarEl) {
        providerAvatarEl.textContent = displayName.charAt(0).toUpperCase();
    }
    if (providerCategoryEl && currentUser.domain) {
        providerCategoryEl.textContent = currentUser.domain;
    }

    // In-memory State
    let pendingInvitations = [];
    let providerProjects = [];
    let activeFilter = 'ALL';
    let selectedInviteForModal = null;

    // Initial Data Fetch
    await loadProviderDashboard();

    // Setup Event Listeners
    setupEventListeners();

    // -------------------------------------------------------------------------
    // 2. Fetch Live Dashboard Data
    // -------------------------------------------------------------------------
    async function loadProviderDashboard() {
        showLoadingState();

        try {
            const [invitesData, projectsData] = await Promise.all([
                fetchInvitationsSafe(),
                fetchProjectsSafe()
            ]);

            pendingInvitations = Array.isArray(invitesData) ? invitesData : [];
            providerProjects = Array.isArray(projectsData) ? projectsData : [];

            updateMetrics();
            renderInvitations();
            renderFilteredProjects();

            if (capacitySubtextEl && activeCapacityBadgeEl) {
                const activeCount = providerProjects.filter(p => p.stage !== PROJECT_STAGES.COMPLETED).length;
                if (activeCount >= 3) {
                    activeCapacityBadgeEl.textContent = 'High Load';
                    activeCapacityBadgeEl.className = 'badge badge-warning';
                    capacitySubtextEl.textContent = `${activeCount} active collaborations ongoing.`;
                } else {
                    activeCapacityBadgeEl.textContent = 'Available';
                    activeCapacityBadgeEl.className = 'badge badge-success';
                    capacitySubtextEl.textContent = `${activeCount} active engagements running.`;
                }
            }

        } catch (error) {
            console.error('Failed to hydrate provider workspace:', error);
            if (window.Toast) {
                window.Toast.error('Could not sync with live database. Displaying local workspace.');
            }
            renderInvitations();
            renderFilteredProjects();
        }
    }

    async function fetchInvitationsSafe() {
        let liveInvites = [];
        try {
            if (window.ProjectApi && typeof window.ProjectApi.getProviderInvitations === 'function') {
                liveInvites = await window.ProjectApi.getProviderInvitations();
            } else if (window.ApiClient && typeof window.ApiClient.get === 'function') {
                const res = await window.ApiClient.get('/api/projects/invitations/provider');
                liveInvites = res.data || res;
            }
        } catch (e) {
            console.warn('Backend invitations query deferred:', e.message);
        }

        // Merge with locally pending invitations created by clients in demo mode
        const localInvites = JSON.parse(localStorage.getItem('wb_local_invitations') || '[]');
        const myLocalInvites = localInvites.filter(inv => 
            !inv.providerId || String(inv.providerId) === String(currentUser.id) || String(inv.providerEmail) === String(currentUser.email)
        );

        const combined = Array.isArray(liveInvites) ? [...liveInvites] : [];
        myLocalInvites.forEach(localInv => {
            if (!combined.some(c => String(c.id) === String(localInv.id))) {
                combined.unshift(localInv);
            }
        });

        return combined;
    }

    async function fetchProjectsSafe() {
        try {
            if (window.ProjectApi && typeof window.ProjectApi.getProviderProjects === 'function') {
                return await window.ProjectApi.getProviderProjects('ALL');
            }
            if (window.ApiClient && typeof window.ApiClient.get === 'function') {
                const res = await window.ApiClient.get('/api/projects/provider?status=ALL');
                return res.data || res;
            }
        } catch (e) {
            console.warn('Backend provider projects query deferred:', e.message);
        }

        const localProjects = JSON.parse(localStorage.getItem('wb_local_projects') || '[]');
        return localProjects.filter(p => String(p.assignedProviderId) === String(currentUser.id));
    }

    function showLoadingState() {
        if (invitationsList) {
            invitationsList.innerHTML = `
                <div class="card card-skeleton">
                    <div class="skeleton-line w-50"></div>
                    <div class="skeleton-line w-75 mt-2"></div>
                </div>
            `;
            invitationsList.classList.remove('hidden');
        }
        if (noInvitesState) noInvitesState.classList.add('hidden');
    }

    // -------------------------------------------------------------------------
    // 3. Compute Metrics
    // -------------------------------------------------------------------------
    function updateMetrics() {
        const invitesCount = pendingInvitations.length;
        if (metricInvitesCount) metricInvitesCount.textContent = invitesCount;
        if (invitesBadge) invitesBadge.textContent = `${invitesCount} Pending`;

        const activeCount = providerProjects.filter(p => p.stage !== PROJECT_STAGES.COMPLETED).length;
        const completedCount = providerProjects.filter(p => p.stage === PROJECT_STAGES.COMPLETED).length;
        
        const scopeLockedCount = providerProjects.filter(p => 
            p.stage === PROJECT_STAGES.AGREEMENT_LOCKED || 
            (p.agreement && (p.agreement.status === 'LOCKED' || p.agreement.status === 'ACTIVE'))
        ).length;

        if (metricActiveProjects) metricActiveProjects.textContent = activeCount;
        if (metricCompletedProjects) metricCompletedProjects.textContent = completedCount;
        if (metricDraftAgreements) metricDraftAgreements.textContent = scopeLockedCount;
        if (activeProjectsCountBadge) activeProjectsCountBadge.textContent = `${providerProjects.length} Total`;
    }

    // -------------------------------------------------------------------------
    // 4. Render Incoming Invitations
    // -------------------------------------------------------------------------
    function renderInvitations() {
        if (!invitationsList || !noInvitesState) return;
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
            inviteCard.className = 'card mt-2 invite-item-card';
            inviteCard.style.borderLeft = '4px solid var(--primary, #3b82f6)';

            const budgetDisplay = invite.budget ? `$${Number(invite.budget).toLocaleString()}` : 'Negotiable';
            const clientNameDisplay = invite.clientName || invite.clientEmail || 'Client';

            inviteCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 260px;">
                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.35rem;">
                            <span class="badge badge-info">Project Invitation</span>
                            <span class="badge badge-subtle">Budget: ${budgetDisplay}</span>
                        </div>
                        <h3 class="card-title" style="font-size: 1.15rem; margin-top: 0.25rem;">${escapeHtml(invite.title || 'Untitled Project')}</h3>
                        <p class="card-text text-sm mt-1">${escapeHtml(invite.summary || invite.description || 'Client has requested your technical collaboration.')}</p>
                        <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--text-muted, #64748b);">
                            <span>Requested by: <strong>${escapeHtml(clientNameDisplay)}</strong></span>
                            ${invite.createdAt ? ` &bull; <span>\${new Date(invite.createdAt).toLocaleDateString()}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; align-items: center; align-self: center; flex-wrap: wrap;">
                        <button type="button" class="btn btn-outline btn-sm btn-review-invite" data-id="${invite.id}">
                            Review Scope
                        </button>
                        <button type="button" class="btn btn-primary btn-sm btn-accept-invite" data-id="${invite.id}">
                            Accept &amp; Enter
                        </button>
                    </div>
                </div>
            `;

            invitationsList.appendChild(inviteCard);
        });

        invitationsList.querySelectorAll('.btn-review-invite').forEach(btn => {
            btn.addEventListener('click', () => {
                const inviteId = btn.getAttribute('data-id');
                const invite = pendingInvitations.find(inv => String(inv.id) === String(inviteId));
                if (invite) openInvitationModal(invite);
            });
        });

        invitationsList.querySelectorAll('.btn-accept-invite').forEach(btn => {
            btn.addEventListener('click', () => handleInvitationResponse(btn.getAttribute('data-id'), 'ACCEPT'));
        });
    }

    // -------------------------------------------------------------------------
    // 5. Render Active Engagements
    // -------------------------------------------------------------------------
    function renderFilteredProjects() {
        if (!providerProjectsList || !noProviderProjectsState) return;

        let filtered = providerProjects;
        if (activeFilter !== 'ALL') {
            if (activeFilter === PROJECT_STAGES.AGREEMENT_LOCKED) {
                filtered = providerProjects.filter(p => 
                    p.stage === PROJECT_STAGES.AGREEMENT_LOCKED || 
                    (p.agreement && (p.agreement.status === 'LOCKED' || p.agreement.status === 'ACTIVE'))
                );
            } else {
                filtered = providerProjects.filter(p => p.stage === activeFilter);
            }
        }

        providerProjectsList.innerHTML = '';

        if (filtered.length === 0) {
            noProviderProjectsState.classList.remove('hidden');
            providerProjectsList.classList.add('hidden');
            return;
        }

        noProviderProjectsState.classList.add('hidden');
        providerProjectsList.classList.remove('hidden');

        filtered.forEach(project => {
            const card = document.createElement('div');
            card.className = 'card project-card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            const progress = calculateProjectProgress(project);
            const isScopeLocked = project.stage === PROJECT_STAGES.AGREEMENT_LOCKED || 
                (project.agreement && (project.agreement.status === 'LOCKED' || project.agreement.status === 'ACTIVE'));
            
            const scopeBadge = isScopeLocked 
                ? `<span class="badge badge-success" style="font-size: 0.75rem;">🔒 Scope Locked (v${project.agreement?.version || '1.0'})</span>` 
                : `<span class="badge badge-warning" style="font-size: 0.75rem;">📝 Scope Draft</span>`;

            const stageBadge = getStageBadge(project.stage);
            const clientDisplay = project.clientName || project.client?.fullName || 'Client Partner';

            card.innerHTML = `
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; flex-wrap: wrap;">
                        <span class="badge badge-subtle">PRJ-${String(project.id).padStart(3, '0')}</span>
                        <div style="display: flex; gap: 0.35rem; align-items: center;">
                            ${scopeBadge}
                            ${stageBadge}
                        </div>
                    </div>
                    <h3 class="card-title" style="font-size: 1.15rem; margin-top: 0.25rem;">
                        <a href="project-view.html?id=${project.id}" style="color: inherit; text-decoration: none;">
                            ${escapeHtml(project.title || 'Untitled Collaboration')}
                        </a>
                    </h3>
                    <p class="card-text text-sm" style="min-height: 38px; margin-top: 0.4rem; color: var(--text-muted, #64748b);">
                        ${escapeHtml(project.summary || project.description || 'Active technical delivery engagement.')}
                    </p>
                </div>

                <div class="project-card-footer mt-3" style="border-top: 1px solid var(--border-color, #e2e8f0); padding-top: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted, #64748b); margin-bottom: 0.35rem;">
                        <span>Milestone Progress</span>
                        <strong>${progress}%</strong>
                    </div>
                    <div style="width: 100%; height: 6px; background-color: var(--bg-muted, #f1f5f9); border-radius: 9999px; overflow: hidden;">
                        <div style="width: ${progress}%; height: 100%; background-color: ${progress === 100 ? 'var(--success, #10b981)' : 'var(--primary, #3b82f6)'}; transition: width 0.3s ease;"></div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
                        <span class="text-xs text-muted">Client: <strong>${escapeHtml(clientDisplay)}</strong></span>
                        <a href="project-view.html?id=${project.id}" class="btn btn-outline btn-sm">
                            Enter Workspace &rarr;
                        </a>
                    </div>
                </div>
            `;

            providerProjectsList.appendChild(card);
        });
    }

    function calculateProjectProgress(project) {
        if (project.stage === PROJECT_STAGES.COMPLETED) return 100;
        
        if (Array.isArray(project.milestones) && project.milestones.length > 0) {
            const approvedWeight = project.milestones.reduce((acc, m) => {
                if (m.status === 'APPROVED' || m.status === 'COMPLETED') {
                    return acc + (Number(m.weightPercentage) || (100 / project.milestones.length));
                }
                return acc;
            }, 0);
            return Math.min(100, Math.round(approvedWeight));
        }

        if (typeof project.progressPercentage === 'number') {
            return Math.min(100, Math.max(0, project.progressPercentage));
        }

        return 0;
    }

    // -------------------------------------------------------------------------
    // 6. Invitation Processing Handlers (Accept / Decline)
    // -------------------------------------------------------------------------
    async function handleInvitationResponse(projectId, action) {
        if (!projectId) return;

        try {
            if (window.ProjectApi && typeof window.ProjectApi.respondToInvitation === 'function') {
                await window.ProjectApi.respondToInvitation(projectId, action);
            } else if (window.ApiClient && typeof window.ApiClient.post === 'function') {
                await window.ApiClient.post(`/api/projects/${projectId}/invitations/respond`, { action });
            }

            // Sync with local fallback invitations
            let localInvites = JSON.parse(localStorage.getItem('wb_local_invitations') || '[]');
            const acceptedInvite = localInvites.find(inv => String(inv.id) === String(projectId));
            localInvites = localInvites.filter(inv => String(inv.id) !== String(projectId));
            localStorage.setItem('wb_local_invitations', JSON.stringify(localInvites));

            if (action === 'ACCEPT') {
                if (acceptedInvite) {
                    let localProjects = JSON.parse(localStorage.getItem('wb_local_projects') || '[]');
                    acceptedInvite.stage = PROJECT_STAGES.REQUIREMENT_DISCUSSION;
                    acceptedInvite.assignedProviderId = currentUser.id;
                    localProjects.unshift(acceptedInvite);
                    localStorage.setItem('wb_local_projects', JSON.stringify(localProjects));
                }

                if (window.Toast) window.Toast.success('Invitation accepted! Launching workspace...');
                closeInvitationModal();
                setTimeout(() => {
                    window.location.href = `project-view.html?id=${projectId}`;
                }, 600);
            } else {
                if (window.Toast) window.Toast.info('Invitation declined.');
                closeInvitationModal();
                pendingInvitations = pendingInvitations.filter(inv => String(inv.id) !== String(projectId));
                updateMetrics();
                renderInvitations();
            }
        } catch (error) {
            console.error(`Error processing invitation (${action}):`, error);
            if (window.Toast) {
                window.Toast.error(error.message || `Unable to ${action.toLowerCase()} invitation right now.`);
            }
        }
    }

    // -------------------------------------------------------------------------
    // 7. Modal Handlers
    // -------------------------------------------------------------------------
    function openInvitationModal(invite) {
        if (!invitationModal) return;
        selectedInviteForModal = invite;

        if (invitationModalTitle) {
            invitationModalTitle.textContent = invite.title || 'Project Scope Details';
        }
        if (modalProjectCategory) {
            modalProjectCategory.textContent = invite.category || 'Direct Engagement';
        }

        if (invitationModalContent) {
            const budgetText = invite.budget ? `$${Number(invite.budget).toLocaleString()}` : 'To be scoped';
            const clientName = invite.clientName || invite.clientEmail || 'Verified Client';

            invitationModalContent.innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <h4 style="margin: 0; font-size: 0.95rem; color: var(--text-muted, #64748b);">Client Description &amp; Scope Objectives</h4>
                        <p style="margin-top: 0.35rem; line-height: 1.5; font-size: 0.95rem;">
                            ${escapeHtml(invite.description || invite.summary || 'No detailed scope notes provided.')}
                        </p>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; background: var(--bg-muted, #f8fafc); padding: 0.75rem; border-radius: 6px;">
                        <div>
                            <span style="font-size: 0.75rem; color: var(--text-muted, #64748b);">Client</span>
                            <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(clientName)}</div>
                        </div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--text-muted, #64748b);">Initial Budget</span>
                            <div style="font-weight: 600; font-size: 0.9rem; color: var(--success, #10b981);">${budgetText}</div>
                        </div>
                        <div>
                            <span style="font-size: 0.75rem; color: var(--text-muted, #64748b);">Contract Type</span>
                            <div style="font-weight: 600; font-size: 0.9rem;">Milestone-Locked</div>
                        </div>
                    </div>

                    <p class="text-xs text-muted" style="margin: 0;">
                        Accepting will initialize a collaborative workspace where both parties finalize milestones before the agreement is version-locked.
                    </p>
                </div>
            `;
        }

        invitationModal.classList.remove('hidden');
    }

    function closeInvitationModal() {
        if (!invitationModal) return;
        invitationModal.classList.add('hidden');
        selectedInviteForModal = null;
    }

    function openPostServiceModal() {
        if (postServiceModal) {
            postServiceModal.classList.remove('hidden');
        }
    }

    function closePostServiceModal() {
        if (postServiceModal) {
            postServiceModal.classList.add('hidden');
            if (postServiceForm) postServiceForm.reset();
        }
    }

    // -------------------------------------------------------------------------
    // 8. Event Listeners & Post Service Submission
    // -------------------------------------------------------------------------
    function setupEventListeners() {
        // Stage Filter Pills
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                activeFilter = pill.getAttribute('data-filter') || 'ALL';
                renderFilteredProjects();
            });
        });

        // Manual Sync Button
        if (refreshDashboardBtn) {
            refreshDashboardBtn.addEventListener('click', async () => {
                refreshDashboardBtn.disabled = true;
                refreshDashboardBtn.style.opacity = '0.6';
                await loadProviderDashboard();
                if (window.Toast) window.Toast.info('Dashboard synced.');
                refreshDashboardBtn.disabled = false;
                refreshDashboardBtn.style.opacity = '1';
            });
        }

        // Invitation Modal Triggers
        if (closeInvitationModalBtn) closeInvitationModalBtn.addEventListener('click', closeInvitationModal);
        if (declineInviteBtn) {
            declineInviteBtn.addEventListener('click', () => {
                if (selectedInviteForModal) handleInvitationResponse(selectedInviteForModal.id, 'DECLINE');
            });
        }
        if (acceptInviteBtn) {
            acceptInviteBtn.addEventListener('click', () => {
                if (selectedInviteForModal) handleInvitationResponse(selectedInviteForModal.id, 'ACCEPT');
            });
        }
        if (invitationModal) {
            invitationModal.addEventListener('click', (e) => {
                if (e.target === invitationModal) closeInvitationModal();
            });
        }

        // Post Service Modal Triggers
        if (btnOpenPostServiceModal) btnOpenPostServiceModal.addEventListener('click', openPostServiceModal);
        if (closePostServiceModalBtn) closePostServiceModalBtn.addEventListener('click', closePostServiceModal);
        if (cancelPostServiceBtn) cancelPostServiceBtn.addEventListener('click', closePostServiceModal);
        if (postServiceModal) {
            postServiceModal.addEventListener('click', (e) => {
                if (e.target === postServiceModal) closePostServiceModal();
            });
        }

        // Post Service Form Submit
        if (postServiceForm) {
            postServiceForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const title = (document.getElementById('serviceTitleInput')?.value || '').trim();
                const category = document.getElementById('serviceCategorySelect')?.value || 'WEB_DEVELOPMENT';
                const hourlyRate = Number(document.getElementById('serviceRateInput')?.value) || 50;
                const deliveryDays = Number(document.getElementById('serviceDeliveryDaysInput')?.value) || 14;
                const skillsText = (document.getElementById('serviceSkillsInput')?.value || '').trim();
                const description = (document.getElementById('serviceDescriptionInput')?.value || '').trim();

                if (!title || !description) {
                    if (window.Toast) window.Toast.error('Please fill in service title and description.');
                    return;
                }

                if (btnSubmitService) {
                    btnSubmitService.disabled = true;
                    btnSubmitService.textContent = 'Publishing...';
                }

                const newServicePayload = {
                    id: Date.now(),
                    userId: currentUser.id,
                    userFullName: displayName,
                    title: title,
                    domain: document.getElementById('serviceCategorySelect')?.selectedOptions[0]?.text || 'Full-Stack Web Development',
                    category: category,
                    hourlyRate: hourlyRate,
                    deliveryDays: deliveryDays,
                    skills: skillsText ? skillsText.split(',').map(s => s.trim()).filter(Boolean) : ['Java', 'Spring Boot'],
                    bio: description,
                    averageRating: 5.0,
                    createdAt: new Date().toISOString()
                };

                // Store in shared local explore catalog
                const existingServices = JSON.parse(localStorage.getItem('wb_posted_services') || '[]');
                existingServices.unshift(newServicePayload);
                localStorage.setItem('wb_posted_services', JSON.stringify(existingServices));

                // Attempt backend post if API is live
                try {
                    if (window.ApiClient && typeof window.ApiClient.post === 'function') {
                        await window.ApiClient.post('/api/profile/services', newServicePayload);
                    }
                } catch (err) {
                    console.warn('Backend service publishing deferred, saved to explore catalog:', err.message);
                }

                if (window.Toast) {
                    window.Toast.success('Service successfully published! Clients can now discover and invite you.');
                }

                closePostServiceModal();

                if (btnSubmitService) {
                    btnSubmitService.disabled = false;
                    btnSubmitService.textContent = 'Publish to Explore';
                }
            });
        }
    }

    // -------------------------------------------------------------------------
    // 9. Helpers
    // -------------------------------------------------------------------------
    function getStageBadge(stage) {
        switch (stage) {
            case PROJECT_STAGES.INVITED:
                return `<span class="badge badge-subtle">Invited</span>`;
            case PROJECT_STAGES.REQUIREMENT_DISCUSSION:
                return `<span class="badge badge-warning">Scoping</span>`;
            case PROJECT_STAGES.AGREEMENT_LOCKED:
                return `<span class="badge badge-info">Locked</span>`;
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