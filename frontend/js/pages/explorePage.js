/**
 * WORKBRIDGE - PROVIDER DISCOVERY PAGE CONTROLLER (SUPABASE EDITION)
 * File: js/pages/explorePage.js
 * 
 * Powered by direct Supabase PostgreSQL queries (`services` & `profiles` tables).
 * Supports real-time gig discovery, provider profile credentials preview,
 * dual filter toggling (Gigs vs Talent), and direct invitation dispatching.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || { CLIENT: 'CLIENT', SERVICE_PROVIDER: 'SERVICE_PROVIDER' };

    // Supabase Client Reference
    const sb = window.sbClient;

    // DOM Elements - Filtering & Grid
    const providerGrid = document.getElementById('providerGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsCount = document.getElementById('resultsCount');
    const filterForm = document.getElementById('providerFilterForm');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const minRatingFilter = document.getElementById('minRatingFilter');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const clearSearchStateBtn = document.getElementById('clearSearchStateBtn');
    const btnRefreshCatalog = document.getElementById('btnRefreshCatalog');
    const filterPills = document.querySelectorAll('.filter-pill[data-type]');

    // DOM Elements - Provider Profile Preview Modal
    const providerDetailModal = document.getElementById('providerDetailModal');
    const detailAvatar = document.getElementById('detailAvatar');
    const detailProviderName = document.getElementById('detailProviderName');
    const detailProviderDomain = document.getElementById('detailProviderDomain');
    const detailBio = document.getElementById('detailBio');
    const detailSkillsContainer = document.getElementById('detailSkillsContainer');
    const detailRate = document.getElementById('detailRate');
    const detailDeliveryDays = document.getElementById('detailDeliveryDays');
    const detailPortfolioLink = document.getElementById('detailPortfolioLink');
    const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
    const cancelDetailModalBtn = document.getElementById('cancelDetailModalBtn');
    const btnInviteFromDetail = document.getElementById('btnInviteFromDetail');

    // DOM Elements - Invitation Modal
    const inviteModal = document.getElementById('inviteModal');
    const inviteProjectForm = document.getElementById('inviteProjectForm');
    const selectedProviderIdInput = document.getElementById('selectedProviderId');
    const selectedProviderNameInput = document.getElementById('selectedProviderName');
    const selectedProviderDomainInput = document.getElementById('selectedProviderDomain');
    const modalProviderTitle = document.getElementById('modalProviderTitle');
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');

    // In-memory Runtime State
    let allCatalogItems = [];
    let currentFilterType = 'ALL';
    let activePreviewItem = null;

    // Initialize Page
    await loadServicesCatalog();
    setupEventListeners();

    // -------------------------------------------------------------------------
    // 1. Fetch Live Catalog directly from Supabase (`services` & `profiles`)
    // -------------------------------------------------------------------------
    async function loadServicesCatalog() {
        showLoadingSkeleton();

        try {
            if (!sb) {
                throw new Error('Supabase client connection missing.');
            }

            // 1. Query all services posted by providers
            const { data: servicesData, error: servicesErr } = await sb
                .from('services')
                .select('*')
                .order('created_at', { ascending: false });

            if (servicesErr) {
                console.warn('Supabase services query error:', servicesErr.message);
            }

            // 2. Query verified profiles with role = SERVICE_PROVIDER
            const { data: profilesData, error: profilesErr } = await sb
                .from('profiles')
                .select('*')
                .eq('role', 'SERVICE_PROVIDER')
                .order('created_at', { ascending: false });

            if (profilesErr) {
                console.warn('Supabase profiles query error:', profilesErr.message);
            }

            const rawServices = Array.isArray(servicesData) ? servicesData : [];
            const rawProfiles = Array.isArray(profilesData) ? profilesData : [];

            // Format specialized services/gigs posted by providers
            const formattedServices = rawServices.map(svc => ({
                id: svc.id,
                providerId: svc.provider_id,
                providerName: svc.provider_name || 'Verified Provider',
                title: svc.title,
                domain: svc.domain || svc.title,
                category: svc.category || 'WEB_DEVELOPMENT',
                hourlyRate: svc.hourly_rate || 50,
                deliveryDays: svc.delivery_days || 14,
                skills: parseSkills(svc.skills),
                description: svc.description || 'Full technical service package with milestone-locked commitments.',
                rating: Number(svc.average_rating || 5.0).toFixed(1),
                createdAt: svc.created_at,
                isLiveService: true,
                type: 'GIGS'
            }));

            // Format standalone provider talent profiles
            const formattedProfiles = rawProfiles
                .filter(prof => !formattedServices.some(s => s.providerId === prof.id))
                .map(prof => ({
                    id: prof.id,
                    providerId: prof.id,
                    providerName: prof.full_name || 'Verified Engineer',
                    title: prof.domain || 'Technical Service Provider',
                    domain: prof.domain || 'Software Engineering',
                    category: 'WEB_DEVELOPMENT',
                    hourlyRate: prof.hourly_rate || 50,
                    deliveryDays: 14,
                    skills: parseSkills(prof.skills),
                    description: prof.bio || 'Verified provider on WorkBridge ready for milestone-locked technical delivery.',
                    rating: Number(prof.rating || 5.0).toFixed(1),
                    githubUrl: prof.github_url || null,
                    portfolioUrl: prof.portfolio_url || null,
                    createdAt: prof.created_at,
                    isLiveService: false,
                    type: 'TALENT'
                }));

            allCatalogItems = [...formattedServices, ...formattedProfiles];
            applyFilters();

        } catch (error) {
            console.error('Failed to query Supabase catalog:', error);
            if (window.Toast) {
                window.Toast.error('Could not sync explore catalog with cloud database.');
            }
            renderCatalog([]);
        }
    }

    function showLoadingSkeleton() {
        if (!providerGrid) return;
        providerGrid.innerHTML = `
            <div class="card card-skeleton">
                <div class="skeleton-line w-75"></div>
                <div class="skeleton-line w-50 mt-2"></div>
                <div class="skeleton-box mt-3"></div>
            </div>
            <div class="card card-skeleton">
                <div class="skeleton-line w-75"></div>
                <div class="skeleton-line w-50 mt-2"></div>
                <div class="skeleton-box mt-3"></div>
            </div>
            <div class="card card-skeleton">
                <div class="skeleton-line w-75"></div>
                <div class="skeleton-line w-50 mt-2"></div>
                <div class="skeleton-box mt-3"></div>
            </div>
        `;
        providerGrid.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
    }

    // -------------------------------------------------------------------------
    // 2. Render Cards to Grid
    // -------------------------------------------------------------------------
    function renderCatalog(items) {
        if (!providerGrid) return;
        providerGrid.innerHTML = '';

        if (resultsCount) {
            resultsCount.textContent = `Showing ${items.length} verified offering${items.length === 1 ? '' : 's'}`;
        }

        if (items.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            providerGrid.classList.add('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        providerGrid.classList.remove('hidden');

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card provider-card';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.justifyContent = 'space-between';

            const skillsBadges = item.skills.slice(0, 5)
                .map(skill => `<span class="badge badge-subtle">${escapeHtml(skill)}</span>`)
                .join(' ');

            const serviceBadge = item.isLiveService 
                ? `<span class="badge badge-success">⚡ Packaged Gig</span>`
                : `<span class="badge badge-primary">Verified Engineer</span>`;

            card.innerHTML = `
                <div>
                    <div class="provider-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap;">
                                <h3 class="card-title btn-preview-profile" data-id="${item.providerId}" style="font-size: 1.15rem; margin: 0; cursor: pointer; color: var(--text-main);">
                                    ${escapeHtml(item.providerName)} &nearr;
                                </h3>
                                ${serviceBadge}
                            </div>
                            <span class="badge badge-subtle">${escapeHtml(item.title)}</span>
                        </div>
                        <div class="rating-badge" style="font-weight: 700; color: var(--primary, #3b82f6); font-size: 0.95rem;">
                            ★ ${item.rating}
                        </div>
                    </div>

                    <p class="card-text mt-3 text-sm" style="color: var(--text-muted, #64748b); min-height: 48px; line-height: 1.5;">
                        ${escapeHtml(item.description)}
                    </p>

                    <div class="provider-skills-list mt-3" style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                        ${skillsBadges || '<span class="text-xs text-muted">Full-Stack Development</span>'}
                    </div>
                </div>

                <div class="provider-card-footer mt-4" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color, #e2e8f0); padding-top: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
                    <div>
                        <span class="text-muted text-xs">Rate: <strong>$${item.hourlyRate}/hr</strong></span>
                        ${item.deliveryDays ? `<span class="text-muted text-xs ml-2">&bull; SLA: <strong>\${item.deliveryDays}d</strong></span>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.4rem; align-items: center;">
                        <button type="button" class="btn btn-outline btn-sm btn-preview-profile" data-id="${item.providerId}">
                            Details
                        </button>
                        <button type="button" class="btn btn-primary btn-sm btn-invite" 
                            data-id="${item.providerId}" 
                            data-name="${escapeHtml(item.providerName)}"
                            data-domain="${escapeHtml(item.domain || item.title)}">
                            + Invite to Scope
                        </button>
                    </div>
                </div>
            `;

            providerGrid.appendChild(card);
        });

        // Wire click listeners for "+ Invite to Scope"
        providerGrid.querySelectorAll('.btn-invite').forEach(btn => {
            btn.addEventListener('click', () => {
                const providerId = btn.getAttribute('data-id');
                const providerName = btn.getAttribute('data-name');
                const providerDomain = btn.getAttribute('data-domain');
                handleInviteClick(providerId, providerName, providerDomain);
            });
        });

        // Wire click listeners for "Details" / Name click
        providerGrid.querySelectorAll('.btn-preview-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-id');
                const item = allCatalogItems.find(i => String(i.providerId) === String(pid));
                if (item) openDetailModal(item);
            });
        });
    }

    // -------------------------------------------------------------------------
    // 3. Provider Details Preview Modal Logic
    // -------------------------------------------------------------------------
    function openDetailModal(item) {
        if (!providerDetailModal) return;
        activePreviewItem = item;

        if (detailAvatar) detailAvatar.textContent = (item.providerName || 'P').charAt(0).toUpperCase();
        if (detailProviderName) detailProviderName.textContent = item.providerName || 'Provider';
        if (detailProviderDomain) detailProviderDomain.textContent = item.domain || item.title || 'Software Engineering';
        if (detailBio) detailBio.textContent = item.description || 'Verified technology provider with milestone-locked delivery commitments.';
        if (detailRate) detailRate.textContent = `$${item.hourlyRate || 50}/hr`;
        if (detailDeliveryDays) detailDeliveryDays.textContent = `${item.deliveryDays || 14} Days SLA`;

        if (detailSkillsContainer) {
            detailSkillsContainer.innerHTML = item.skills
                .map(s => `<span class="badge badge-subtle">${escapeHtml(s)}</span>`)
                .join('');
        }

        if (detailPortfolioLink) {
            const linkUrl = item.portfolioUrl || item.githubUrl;
            if (linkUrl) {
                detailPortfolioLink.href = linkUrl;
                detailPortfolioLink.textContent = linkUrl;
                detailPortfolioLink.style.display = 'inline';
            } else {
                detailPortfolioLink.textContent = 'Verified on WorkBridge Platform';
                detailPortfolioLink.removeAttribute('href');
            }
        }

        providerDetailModal.classList.remove('hidden');
    }

    function closeDetailModal() {
        if (providerDetailModal) providerDetailModal.classList.add('hidden');
        activePreviewItem = null;
    }

    if (closeDetailModalBtn) closeDetailModalBtn.addEventListener('click', closeDetailModal);
    if (cancelDetailModalBtn) cancelDetailModalBtn.addEventListener('click', closeDetailModal);
    if (providerDetailModal) {
        providerDetailModal.addEventListener('click', (e) => {
            if (e.target === providerDetailModal) closeDetailModal();
        });
    }

    if (btnInviteFromDetail) {
        btnInviteFromDetail.addEventListener('click', () => {
            if (!activePreviewItem) return;
            const item = activePreviewItem;
            closeDetailModal();
            handleInviteClick(item.providerId, item.providerName, item.domain);
        });
    }

    // -------------------------------------------------------------------------
    // 4. Multi-Criteria Filtering Logic
    // -------------------------------------------------------------------------
    function applyFilters() {
        const query = (searchInput?.value || '').toLowerCase().trim();
        const selectedCategory = (categoryFilter?.value || '').toUpperCase().trim();
        const minRating = parseFloat(minRatingFilter?.value) || 0;

        const filtered = allCatalogItems.filter(item => {
            // Pill filter match
            if (currentFilterType !== 'ALL' && item.type !== currentFilterType) {
                return false;
            }

            const providerName = (item.providerName || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const title = (item.title || '').toLowerCase();
            const skills = item.skills.map(s => s.toLowerCase());

            const matchesQuery = !query || 
                providerName.includes(query) || 
                description.includes(query) || 
                title.includes(query) || 
                skills.some(s => s.includes(query));

            const itemCategory = (item.category || '').toUpperCase();
            const matchesCategory = !selectedCategory || selectedCategory === 'ALL' || itemCategory.includes(selectedCategory);

            const rating = parseFloat(item.rating || 5.0);
            const matchesRating = rating >= minRating;

            return matchesQuery && matchesCategory && matchesRating;
        });

        renderCatalog(filtered);
    }

    function setupEventListeners() {
        // Pill Buttons
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentFilterType = pill.getAttribute('data-type') || 'ALL';
                applyFilters();
            });
        });

        if (filterForm) {
            filterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                applyFilters();
            });
        }

        if (searchInput) searchInput.addEventListener('input', applyFilters);
        if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
        if (minRatingFilter) minRatingFilter.addEventListener('change', applyFilters);

        function resetFilters() {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (minRatingFilter) minRatingFilter.value = '0';
            currentFilterType = 'ALL';
            filterPills.forEach(p => p.classList.toggle('active', p.getAttribute('data-type') === 'ALL'));
            applyFilters();
        }

        if (resetFilterBtn) resetFilterBtn.addEventListener('click', resetFilters);
        if (clearSearchStateBtn) clearSearchStateBtn.addEventListener('click', resetFilters);

        if (btnRefreshCatalog) {
            btnRefreshCatalog.addEventListener('click', async () => {
                btnRefreshCatalog.disabled = true;
                btnRefreshCatalog.style.opacity = '0.6';
                await loadServicesCatalog();
                if (window.Toast) window.Toast.info('Marketplace synchronized.');
                btnRefreshCatalog.disabled = false;
                btnRefreshCatalog.style.opacity = '1';
            });
        }
    }

    // -------------------------------------------------------------------------
    // 5. Project Invitation Modal & Direct Supabase Insertion
    // -------------------------------------------------------------------------
    function handleInviteClick(providerId, providerName, providerDomain) {
        const isLoggedIn = window.AuthState ? window.AuthState.isLoggedIn() : false;

        if (!isLoggedIn) {
            if (window.Toast) window.Toast.info('Please sign in as a Client to start a project.');
            setTimeout(() => {
                window.location.href = `auth.html?redirect=${encodeURIComponent('provider-explore.html')}`;
            }, 700);
            return;
        }

        const user = window.AuthState.getUser();
        if (user && user.role !== ROLES.CLIENT) {
            if (window.Toast) window.Toast.warning('Only Client accounts can dispatch project invitations.');
            return;
        }

        if (selectedProviderIdInput) selectedProviderIdInput.value = providerId;
        if (selectedProviderNameInput) selectedProviderNameInput.value = providerName;
        if (selectedProviderDomainInput) selectedProviderDomainInput.value = providerDomain || '';
        if (modalProviderTitle) modalProviderTitle.textContent = `Invite ${providerName} to Scope Project`;

        const categorySelect = document.getElementById('projectCategorySelect');
        if (categorySelect && providerDomain) {
            const domainUpper = providerDomain.toUpperCase();
            if (domainUpper.includes('BACKEND')) categorySelect.value = 'BACKEND';
            else if (domainUpper.includes('FRONTEND')) categorySelect.value = 'FRONTEND';
            else if (domainUpper.includes('MOBILE')) categorySelect.value = 'MOBILE';
            else if (domainUpper.includes('DEVOPS')) categorySelect.value = 'DEVOPS';
            else if (domainUpper.includes('AI')) categorySelect.value = 'AI';
            else categorySelect.value = 'WEB_DEVELOPMENT';
        }

        if (inviteModal) {
            inviteModal.classList.remove('hidden');
        }
    }

    function closeInviteModal() {
        if (inviteModal) {
            inviteModal.classList.add('hidden');
            if (inviteProjectForm) inviteProjectForm.reset();
        }
    }

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeInviteModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeInviteModal);
    if (inviteModal) {
        inviteModal.addEventListener('click', (e) => {
            if (e.target === inviteModal) closeInviteModal();
        });
    }

    // -------------------------------------------------------------------------
    // 6. Submit Invitation -> Directly Insert into Supabase `projects`
    // -------------------------------------------------------------------------
    if (inviteProjectForm) {
        inviteProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const providerId = selectedProviderIdInput ? selectedProviderIdInput.value : null;
            const providerName = selectedProviderNameInput ? selectedProviderNameInput.value : 'Assigned Provider';
            const title = (document.getElementById('projectTitleInput')?.value || '').trim();
            const category = document.getElementById('projectCategorySelect')?.value || 'WEB_DEVELOPMENT';
            const summary = (document.getElementById('projectSummaryInput')?.value || '').trim();
            const budget = parseFloat(document.getElementById('projectBudgetInput')?.value) || 1500;

            if (!title || !summary) {
                if (window.Toast) window.Toast.error('Please enter a project title and initial scope summary.');
                return;
            }

            if (!sb) {
                if (window.Toast) window.Toast.error('Database connection not available.');
                return;
            }

            if (modalSubmitBtn) {
                modalSubmitBtn.disabled = true;
                modalSubmitBtn.textContent = 'Dispatching to Cloud...';
            }

            const currentUser = window.AuthState ? window.AuthState.getUser() : null;

            const newProjectRow = {
                client_id: currentUser?.id,
                client_name: currentUser?.fullName || 'Verified Client',
                client_email: currentUser?.email || 'client@workbridge.io',
                assigned_provider_id: providerId,
                assigned_provider_name: providerName,
                title: title,
                category: category,
                budget: budget,
                description: summary,
                summary: summary,
                stage: 'INVITED',
                completion_percentage: 0
            };

            try {
                // Direct insert into Supabase `projects` table
                const { data, error } = await sb
                    .from('projects')
                    .insert([newProjectRow])
                    .select()
                    .single();

                if (error) throw error;

                // Create initial agreement stub in draft state
                await sb
                    .from('agreements')
                    .insert([{
                        project_id: data.id,
                        version: '1.0',
                        status: 'DRAFT',
                        agreed_amount: budget,
                        terms_and_conditions: 'Mutual scope baseline governed by WorkBridge milestone protocol.'
                    }])
                    .select()
                    .maybeSingle();

                if (window.Toast) {
                    window.Toast.success(`Invitation dispatched! ${providerName} can now review your proposal.`);
                }

                closeInviteModal();

                setTimeout(() => {
                    window.location.href = 'client-dashboard.html';
                }, 600);

            } catch (err) {
                console.error('Failed to dispatch invitation to Supabase:', err);
                if (window.Toast) {
                    window.Toast.error(err.message || 'Could not send invitation. Please try again.');
                }
            } finally {
                if (modalSubmitBtn) {
                    modalSubmitBtn.disabled = false;
                    modalSubmitBtn.textContent = 'Send Invitation';
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------
    function parseSkills(skills) {
        if (Array.isArray(skills)) return skills;
        if (typeof skills === 'string' && skills.trim()) {
            return skills.split(',').map(s => s.trim()).filter(Boolean);
        }
        return ['Java', 'Spring Boot', 'PostgreSQL', 'JavaScript'];
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