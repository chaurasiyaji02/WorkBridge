/**
 * WORKBRIDGE - PROVIDER DISCOVERY PAGE CONTROLLER
 * File: js/pages/explorePage.js
 * 
 * Manages provider catalog queries, multi-criteria filtering (search, category, rating),
 * profile domain parsing, and direct project invitation workflows.
 */

document.addEventListener('DOMContentLoaded', () => {
    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || { CLIENT: 'CLIENT', SERVICE_PROVIDER: 'SERVICE_PROVIDER' };

    // DOM Elements - Filtering & Grid
    const providerGrid = document.getElementById('providerGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');
    const filterForm = document.getElementById('providerFilterForm');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const minRatingFilter = document.getElementById('minRatingFilter');
    const resetFilterBtn = document.getElementById('resetFilterBtn');

    // DOM Elements - Invitation Modal
    const inviteModal = document.getElementById('inviteModal');
    const inviteProjectForm = document.getElementById('inviteProjectForm');
    const selectedProviderIdInput = document.getElementById('selectedProviderId');
    const modalProviderTitle = document.getElementById('modalProviderTitle');
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');

    let allProviders = [];

    // Initialize Page
    loadProviders();

    /**
     * Fetch verified provider directory from backend.
     */
    async function loadProviders() {
        const searchPath = config.ENDPOINTS?.PROFILE?.SEARCH_PROVIDERS || '/profile/providers/search';

        try {
            let data = null;
            try {
                data = await window.ApiClient.get(searchPath);
            } catch (err) {
                // Secondary fallback attempt for route variations
                data = await window.ApiClient.get('/profiles/providers/search');
            }

            allProviders = Array.isArray(data) ? data : (data?.content || []);
            if (allProviders.length === 0) {
                allProviders = getFallbackProviders();
            }
            renderProviders(allProviders);
        } catch (error) {
            console.warn('Backend provider query failed, presenting local directory:', error.message);
            allProviders = getFallbackProviders();
            renderProviders(allProviders);
        }
    }

    /**
     * Render Provider Cards to the Grid.
     */
    function renderProviders(providers) {
        if (!providerGrid) return;
        providerGrid.innerHTML = '';

        if (resultsCount) {
            resultsCount.textContent = `Showing ${providers.length} verified technical provider${providers.length === 1 ? '' : 's'}`;
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
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            // Normalize skills whether returned as Array or comma-delimited string
            const skillsList = parseSkills(provider.skills);
            const skillsBadges = skillsList.slice(0, 5)
                .map(skill => `<span class="badge badge-subtle">${escapeHtml(skill)}</span>`)
                .join(' ');

            const providerId = provider.userId || provider.id;
            const providerName = provider.userFullName || provider.fullName || provider.name || 'Technical Team';
            const domainTitle = provider.domain || provider.title || provider.category || 'Software Engineering';
            const hourlyRate = provider.hourlyRate || provider.rate || 50;
            const rating = Number(provider.averageRating || provider.rating || 5.0).toFixed(1);

            card.innerHTML = `
                <div>
                    <div class="provider-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                        <div>
                            <h3 class="card-title" style="font-size: 1.15rem; margin-bottom: 0.25rem;">
                                ${escapeHtml(providerName)}
                            </h3>
                            <span class="badge badge-primary">${escapeHtml(domainTitle)}</span>
                        </div>
                        <div class="rating-badge" style="font-weight: 700; color: var(--primary, #3b82f6); font-size: 0.95rem;">
                            ★ ${rating}
                        </div>
                    </div>

                    <p class="card-text mt-3 text-sm" style="color: var(--text-muted); min-height: 48px; line-height: 1.5;">
                        ${escapeHtml(provider.bio || 'Verified service provider offering structured technical delivery on WorkBridge.')}
                    </p>

                    <div class="provider-skills-list mt-3" style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                        ${skillsBadges || '<span class="text-xs text-muted">Full-Stack Development</span>'}
                    </div>
                </div>

                <div class="provider-card-footer mt-4" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 0.85rem;">
                    <span class="text-muted text-xs">Standard: <strong>$${hourlyRate}/hr</strong></span>
                    <button type="button" class="btn btn-primary btn-sm btn-invite" data-id="${providerId}" data-name="${escapeHtml(providerName)}">
                        + Start Project
                    </button>
                </div>
            `;

            providerGrid.appendChild(card);
        });

        // Attach click listeners to "+ Start Project" action triggers
        providerGrid.querySelectorAll('.btn-invite').forEach(btn => {
            btn.addEventListener('click', () => {
                const providerId = btn.getAttribute('data-id');
                const providerName = btn.getAttribute('data-name');
                handleInviteClick(providerId, providerName);
            });
        });
    }

    /**
     * Filter Execution Logic (Search query, category dropdown, min-rating).
     */
    function applyFilters() {
        const query = (searchInput?.value || '').toLowerCase().trim();
        const selectedCategory = (categoryFilter?.value || '').toUpperCase().trim();
        const minRating = parseFloat(minRatingFilter?.value) || 0;

        const filtered = allProviders.filter(p => {
            const providerName = (p.userFullName || p.fullName || p.name || '').toLowerCase();
            const bio = (p.bio || '').toLowerCase();
            const domain = (p.domain || p.title || p.category || '').toLowerCase();
            const skills = parseSkills(p.skills).map(s => s.toLowerCase());

            // 1. Text Search matching name, bio, domain, or skills
            const matchesQuery = !query || 
                providerName.includes(query) || 
                bio.includes(query) || 
                domain.includes(query) || 
                skills.some(s => s.includes(query));

            // 2. Category matching
            const providerCat = (p.category || p.domain || '').toUpperCase();
            const matchesCategory = !selectedCategory || selectedCategory === 'ALL' || providerCat.includes(selectedCategory);

            // 3. Minimum Rating matching
            const rating = parseFloat(p.averageRating || p.rating || 5.0);
            const matchesRating = rating >= minRating;

            return matchesQuery && matchesCategory && matchesRating;
        });

        renderProviders(filtered);
    }

    // Filter Form & Input Event Listeners
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

    // -------------------------------------------------------------------------
    // Project Invitation & Initiation Workflow
    // -------------------------------------------------------------------------
    function handleInviteClick(providerId, providerName) {
        const isLoggedIn = window.AuthState ? window.AuthState.isLoggedIn() : false;

        if (!isLoggedIn) {
            if (window.Toast) window.Toast.info('Please sign in as a Client to start a project.');
            setTimeout(() => {
                window.location.href = `auth.html?redirect=${encodeURIComponent('provider-explore.html')}`;
            }, 800);
            return;
        }

        const user = window.AuthState.getUser();
        if (user && user.role !== ROLES.CLIENT) {
            if (window.Toast) window.Toast.warning('Only Client accounts can dispatch project invitations.');
            return;
        }

        if (selectedProviderIdInput) selectedProviderIdInput.value = providerId;
        if (modalProviderTitle) modalProviderTitle.textContent = `Invite ${providerName} to Collaborate`;

        if (window.Modal) {
            window.Modal.open('inviteModal');
        } else if (inviteModal) {
            inviteModal.classList.remove('hidden');
        }
    }

    if (inviteProjectForm) {
        inviteProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const providerId = selectedProviderIdInput ? selectedProviderIdInput.value : null;
            const title = (document.getElementById('projectTitleInput')?.value || '').trim();
            const summary = (document.getElementById('projectSummaryInput')?.value || '').trim();
            const budget = document.getElementById('projectBudgetInput')?.value || 1500;
            const deadline = document.getElementById('projectDeadlineInput')?.value || '';

            if (!title || !summary) {
                if (window.Toast) window.Toast.error('Please enter a project title and initial scope summary.');
                return;
            }

            if (modalSubmitBtn) {
                modalSubmitBtn.disabled = true;
                modalSubmitBtn.textContent = 'Dispatching Invitation...';
            }

            try {
                const newProject = await window.ProjectApi.createAndInvite({
                    providerId,
                    title,
                    summary,
                    description: summary,
                    budget: Number(budget),
                    deadline
                });

                if (window.Toast) window.Toast.success('Invitation sent! Opening collaborative workspace...');
                if (window.Modal) {
                    window.Modal.close('inviteModal', true);
                } else if (inviteModal) {
                    inviteModal.classList.add('hidden');
                    inviteProjectForm.reset();
                }

                setTimeout(() => {
                    const projectId = newProject?.id || 1;
                    window.location.href = `project-view.html?id=${projectId}`;
                }, 750);

            } catch (error) {
                console.error('Invitation dispatch error:', error);
                if (window.Toast) window.Toast.error(error.message || 'Failed to dispatch invitation.');
            } finally {
                if (modalSubmitBtn) {
                    modalSubmitBtn.disabled = false;
                    modalSubmitBtn.textContent = 'Send Invitation';
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // Utilities & Fallback Data
    // -------------------------------------------------------------------------
    function parseSkills(skills) {
        if (Array.isArray(skills)) return skills;
        if (typeof skills === 'string' && skills.trim()) {
            return skills.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
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
                domain: 'Full-Stack Web Development',
                category: 'WEB_DEVELOPMENT',
                averageRating: 4.9,
                hourlyRate: 65,
                bio: 'Specialized enterprise engineering team delivering high-performance Java 21, Spring Boot microservices, and modern web applications.',
                skills: ['Spring Boot', 'Java 21', 'REST APIs', 'PostgreSQL', 'JavaScript']
            },
            {
                id: 2,
                userId: 2,
                fullName: 'DevCore Systems',
                domain: 'Cloud Architecture & DevOps',
                category: 'DEVOPS',
                averageRating: 4.8,
                hourlyRate: 75,
                bio: 'High-throughput transactional systems, automated deployment pipelines, Docker containerization, and database optimization.',
                skills: ['Java', 'Spring Security', 'Docker', 'PostgreSQL', 'Redis']
            },
            {
                id: 3,
                userId: 3,
                fullName: 'Kavya Infotech',
                domain: 'Frontend & UI/UX Systems',
                category: 'FRONTEND',
                averageRating: 5.0,
                hourlyRate: 55,
                bio: 'Accessible, responsive user interface architecture with optimized client-side state handling and component frameworks.',
                skills: ['HTML5', 'CSS3', 'JavaScript', 'Responsive UI', 'Figma']
            }
        ];
    }
});