/**
 * WORKBRIDGE - PROVIDER DISCOVERY PAGE CONTROLLER
 * File: js/pages/explorePage.js
 * 
 * Manages provider catalog rendering, search filters, and project invitation modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const providerGrid = document.getElementById('providerGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');
    const filterForm = document.getElementById('providerFilterForm');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const minRatingFilter = document.getElementById('minRatingFilter');
    const resetFilterBtn = document.getElementById('resetFilterBtn');

    // Modal Elements
    const inviteModal = document.getElementById('inviteModal');
    const inviteProjectForm = document.getElementById('inviteProjectForm');
    const selectedProviderIdInput = document.getElementById('selectedProviderId');
    const modalProviderTitle = document.getElementById('modalProviderTitle');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');

    let allProviders = [];

    // Initialize Page
    loadProviders();

    async function loadProviders() {
        try {
            // Call backend search endpoint
            const data = await window.ApiClient.get('/profiles/providers/search');
            allProviders = Array.isArray(data) ? data : [];
            renderProviders(allProviders);
        } catch (error) {
            console.error('Failed to load providers from backend:', error);
            allProviders = getFallbackProviders();
            renderProviders(allProviders);
        }
    }

    function renderProviders(providers) {
        if (!providerGrid) return;
        providerGrid.innerHTML = '';
        if (resultsCount) {
            resultsCount.textContent = `Showing ${providers.length} verified service provider${providers.length === 1 ? '' : 's'}`;
        }

        if (providers.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            providerGrid.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        providerGrid.classList.remove('hidden');

        providers.forEach(provider => {
            const card = document.createElement('div');
            card.className = 'card provider-card';

            const skillsBadges = (provider.skills || [])
                .map(skill => `<span class="badge badge-subtle">${escapeHtml(skill)}</span>`)
                .join(' ');

            card.innerHTML = `
                <div class="provider-card-header" style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h3 class="card-title">${escapeHtml(provider.userFullName || provider.fullName || 'Engineering Team')}</h3>
                        <span class="badge badge-primary">${escapeHtml(provider.title || 'Software Engineering')}</span>
                    </div>
                    <div class="rating-badge" style="font-weight: 700; color: var(--primary);">
                        ★ ${provider.averageRating ? Number(provider.averageRating).toFixed(1) : '5.0'}
                    </div>
                </div>

                <p class="card-text mt-2" style="font-size: 0.875rem; min-height: 48px;">
                    ${escapeHtml(provider.bio || 'Specialized technology team delivering robust, production-grade applications.')}
                </p>

                <div class="provider-skills-list mt-2" style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                    ${skillsBadges}
                </div>

                <div class="provider-card-footer mt-3" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.75rem;">
                    <span class="text-muted text-xs">Rate: $${provider.hourlyRate || 50}/hr</span>
                    <button type="button" class="btn btn-primary btn-sm btn-invite" data-id="${provider.userId || provider.id}" data-name="${escapeHtml(provider.userFullName || provider.fullName || 'Provider')}">
                        + Start Project
                    </button>
                </div>
            `;

            providerGrid.appendChild(card);
        });

        // Attach click listeners to "+ Start Project" buttons
        document.querySelectorAll('.btn-invite').forEach(btn => {
            btn.addEventListener('click', () => {
                const providerId = btn.getAttribute('data-id');
                const providerName = btn.getAttribute('data-name');
                handleInviteClick(providerId, providerName);
            });
        });
    }

    // -------------------------------------------------------------------------
    // Filter Handlers
    // -------------------------------------------------------------------------
    if (filterForm) {
        filterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFilters();
        });
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (minRatingFilter) minRatingFilter.addEventListener('change', applyFilters);

    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (minRatingFilter) minRatingFilter.value = '0';
            renderProviders(allProviders);
        });
    }

    function applyFilters() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const minRating = minRatingFilter ? (parseFloat(minRatingFilter.value) || 0) : 0;

        const filtered = allProviders.filter(p => {
            const nameMatch = (p.userFullName || p.fullName || '').toLowerCase().includes(query) ||
                              (p.bio || '').toLowerCase().includes(query) ||
                              (p.skills || []).some(s => s.toLowerCase().includes(query));

            const ratingMatch = (p.averageRating || 5.0) >= minRating;
            return nameMatch && ratingMatch;
        });

        renderProviders(filtered);
    }

    // -------------------------------------------------------------------------
    // Invitation Modal
    // -------------------------------------------------------------------------
    function handleInviteClick(providerId, providerName) {
        const isLoggedIn = window.AuthState ? window.AuthState.isLoggedIn() : false;

        if (!isLoggedIn) {
            window.Toast.info('Please sign in as a Client to start a project.');
            setTimeout(() => {
                window.location.href = 'auth.html?mode=login';
            }, 1000);
            return;
        }

        const user = window.AuthState.getUser();
        if (user.role !== window.APP_CONFIG.ROLES.CLIENT) {
            window.Toast.warning('Only Client accounts can initiate new project collaborations.');
            return;
        }

        if (selectedProviderIdInput) selectedProviderIdInput.value = providerId;
        if (modalProviderTitle) modalProviderTitle.textContent = `Invite ${providerName} to Collaborate`;
        if (window.Modal) window.Modal.open('inviteModal');
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => window.Modal && window.Modal.close('inviteModal'));
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => window.Modal && window.Modal.close('inviteModal'));

    if (inviteProjectForm) {
        inviteProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const providerId = selectedProviderIdInput ? selectedProviderIdInput.value : null;
            const title = document.getElementById('projectTitleInput').value.trim();
            const summary = document.getElementById('projectSummaryInput').value.trim();

            if (!title || !summary) {
                window.Toast.error('Please enter the project name and initial scope summary.');
                return;
            }

            modalSubmitBtn.disabled = true;
            modalSubmitBtn.textContent = 'Sending Invitation...';

            try {
                const newProject = await window.ProjectApi.createAndInvite({
                    providerId,
                    title,
                    summary,
                    description: summary
                });

                window.Toast.success('Project created and invitation sent successfully!');
                if (window.Modal) window.Modal.close('inviteModal');

                setTimeout(() => {
                    const projectId = (newProject && newProject.id) || 1;
                    window.location.href = `project-view.html?id=${projectId}`;
                }, 1000);

            } catch (error) {
                window.Toast.error(error.message || 'Failed to send invitation. Please try again.');
            } finally {
                modalSubmitBtn.disabled = false;
                modalSubmitBtn.textContent = 'Send Invitation';
            }
        });
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getFallbackProviders() {
        return [
            {
                id: 1,
                userId: 1,
                fullName: 'Apex Tech Solutions',
                title: 'Full-Stack Engineering Team',
                averageRating: 4.9,
                hourlyRate: 65,
                bio: 'Specialized enterprise team building Java 21, Spring Boot microservices, and modern web applications.',
                skills: ['Spring Boot', 'Java 21', 'REST APIs', 'PostgreSQL', 'JavaScript']
            },
            {
                id: 2,
                userId: 2,
                fullName: 'DevCore Systems',
                title: 'Backend & Cloud Architects',
                averageRating: 4.8,
                hourlyRate: 75,
                bio: 'High-throughput transactional systems, security hardening, and database optimization.',
                skills: ['Java', 'Spring Security', 'Docker', 'MySQL', 'Redis']
            }
        ];
    }
});