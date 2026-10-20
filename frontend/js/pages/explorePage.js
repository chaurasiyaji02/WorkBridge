/**
 * WORKBRIDGE - PROVIDER DISCOVERY PAGE CONTROLLER (SUPABASE EDITION)
 * File: js/pages/explorePage.js
 * 
 * Powered by direct Supabase PostgreSQL queries (`services` & `profiles` tables).
 * Supports real-time gig discovery, strict SERVICE_PROVIDER role filtering,
 * multi-criteria sorting, provider credentials preview, and project invitation dispatching.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || { CLIENT: 'CLIENT', SERVICE_PROVIDER: 'SERVICE_PROVIDER', ADMIN: 'ADMIN' };

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
    const rateBracketFilter = document.getElementById('rateBracketFilter');
    const catalogSortSelect = document.getElementById('catalogSortSelect');
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const clearSearchStateBtn = document.getElementById('clearSearchStateBtn');
    const btnRefreshCatalog = document.getElementById('btnRefreshCatalog');
    const filterPills = document.querySelectorAll('.filter-pill[data-type]');

    // DOM Elements - Provider Profile Preview Modal
    const providerDetailModal = document.getElementById('providerDetailModal');
    const detailAvatar = document.getElementById('detailAvatar');
    const detailProviderName = document.getElementById('detailProviderName');
    const detailProviderDomain = document.getElementById('detailProviderDomain');
    const detailVerifiedBadge = document.getElementById('detailVerifiedBadge');
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
    const selectedProviderEmailInput = document.getElementById('selectedProviderEmail');
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

            // 2. Query verified profiles strictly with role = SERVICE_PROVIDER
            const { data: profilesData, error: profilesErr } = await sb
                .from('profiles')
                .select('*')
                .eq('role', ROLES.SERVICE_PROVIDER)
                .order('created_at', { ascending: false });

            if (profilesErr) {
                console.warn('Supabase profiles query error:', profilesErr.message);
            }

            const rawServices = Array.isArray(servicesData) ? servicesData : [];
            const rawProfiles = Array.isArray(profilesData) ? profilesData : [];

            // Build lookup map of provider profiles by ID for email/portfolio enrichment
            const profileMap = {};
            rawProfiles.forEach(p => {
                if (p.id) profileMap[p.id] = p;
            });

            // Format specialized services/gigs posted by providers
            const formattedServices = rawServices.map(svc => {
                const linkedProfile = profileMap[svc.provider_id] || {};
                return {
                    id: 'svc_' + svc.id,
                    rawServiceId: svc.id,
                    providerId: svc.provider_id,
                    providerName: svc.provider_name || linkedProfile.full_name || 'Verified Provider',
                    providerEmail: linkedProfile.email || '',
                    title: svc.title || 'Specialized Engineering Package',
                    domain: svc.domain || linkedProfile.domain || svc.title,
                    category: svc.category || inferCategoryFromDomain(svc.domain || linkedProfile.domain),
                    hourlyRate: Number(svc.hourly_rate) || Number(linkedProfile.hourly_rate) || 50,
                    deliveryDays: Number(svc.delivery_days) || 14,
                    skills: parseSkills(svc.skills || linkedProfile.skills),
                    description: svc.description || 'Full technical service package with milestone-locked commitments.',
                    rating: Number(svc.average_rating || linkedProfile.rating || 5.0).toFixed(1),
                    githubUrl: linkedProfile.github_url || null,
                    portfolioUrl: linkedProfile.portfolio_url || null,
                    createdAt: svc.created_at,
                    isLiveService: true,
                    type: 'GIGS'
                };
            });

            // Format standalone provider talent profiles
            const formattedProfiles = rawProfiles.map(prof => ({
                id: 'prof_' + prof.id,
                providerId: prof.id,
                providerName: prof.full_name || 'Verified Technical Lead',
                providerEmail: prof.email || '',
                title: prof.domain || 'Full-Stack Technical Lead',
                domain: prof.domain || 'Software Engineering',
                category: inferCategoryFromDomain(prof.domain),
                hourlyRate: Number(prof.hourly_rate) || 50,
                deliveryDays: 14,
                skills: parseSkills(prof.skills),
                description: prof.bio || 'Verified Technical Lead on WorkBridge ready for milestone-governed architecture and delivery.',
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

    function inferCategoryFromDomain(domainStr) {
        const d = (domainStr || '').toUpperCase();
        if (d.includes('AI') || d.includes('DATA') || d.includes('MACHINE LEARNING')) return 'AI';
        if (d.includes('BACKEND') || d.includes('MICROSERVICE') || d.includes('API')) return 'BACKEND';
        if (d.includes('FRONTEND') || d.includes('UI') || d.includes('UX')) return 'FRONTEND';
        if (d.includes('MOBILE') || d.includes('IOS') || d.includes('ANDROID')) return 'MOBILE';
        if (d.includes('DEVOPS') || d.includes('CLOUD') || d.includes('AWS')) return 'DEVOPS';
        return 'WEB_DEVELOPMENT';
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
                : `<span class="badge badge-primary">🛡️ Verified Engineer</span>`;

            const slaDisplay = item.deliveryDays 
                ? `<span class="text-muted text-xs ml-2">&bull; SLA: <strong>${item.deliveryDays}d</strong></span>` 
                : '';

            card.innerHTML = `
                <div>
                    <div class="provider-card-header" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap;">
                                <h3 class="card-title btn-preview-profile" data-item-id="${escapeHtml(item.id)}" style="font-size: 1.15rem; margin: 0; cursor: pointer; color: var(--text-main);">
                                    ${escapeHtml(item.providerName)} &nearr;
                                </h3>
                                ${serviceBadge}
                            </div>
                            <span class="badge badge-subtle">${escapeHtml(item.title)}</span>
                        </div>
                        <div class="rating-badge" style="font-weight: 700; color: var(--primary, #3b82f6); font-size: 0.95rem; flex-shrink: 0;">
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
                        ${slaDisplay}
                    </div>
                    <div style="display: flex; gap: 0.4rem; align-items: center;">
                        <button type="button" class="btn btn-outline btn-sm btn-preview-profile" data-item-id="${escapeHtml(item.id)}">
                            Details
                        </button>
                        <button type="button" class="btn btn-primary btn-sm btn-invite" 
                            data-id="${escapeHtml(item.providerId)}" 
                            data-name="${escapeHtml(item.providerName)}"
                            data-email="${escapeHtml(item.providerEmail || '')}"
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
                const providerEmail = btn.getAttribute('data-email');
                const providerDomain = btn.getAttribute('data-domain');
                handleInviteClick(providerId, providerName, providerDomain, providerEmail);
            });
        });

        // Wire click listeners for "Details" / Name click using unique item ID
        providerGrid.querySelectorAll('.btn-preview-profile').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.getAttribute('data-item-id');
                const item = allCatalogItems.find(i => String(i.id) === String(itemId));
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

        if (detailVerifiedBadge) {
            detailVerifiedBadge.textContent = item.isLiveService ? 'Verified Service Package' : 'Verified Engineer';
        }

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
            handleInviteClick(item.providerId, item.providerName, item.domain, item.providerEmail);
        });
    }

    // -------------------------------------------------------------------------
    // 4. Multi-Criteria Filtering & Sorting Engine
    // -------------------------------------------------------------------------
    function applyFilters() {
        const query = (searchInput?.value || '').toLowerCase().trim();
        const selectedCategory = (categoryFilter?.value || '').toUpperCase().trim();
        const minRating = parseFloat(minRatingFilter?.value) || 0;
        const selectedRateBracket = rateBracketFilter?.value || 'ALL';
        const sortOrder = catalogSortSelect?.value || 'RATING_DESC';

        let filtered = allCatalogItems.filter(item => {
            if (currentFilterType !== 'ALL' && item.type !== currentFilterType) {
                return false;
            }

            const providerName = (item.providerName || '').toLowerCase();
            const description = (item.description || '').toLowerCase();
            const title = (item.title || '').toLowerCase();
            const domain = (item.domain || '').toLowerCase();
            const skills = item.skills.map(s => s.toLowerCase());

            const matchesQuery = !query || 
                providerName.includes(query) || 
                description.includes(query) || 
                title.includes(query) || 
                domain.includes(query) ||
                skills.some(s => s.includes(query));

            const itemCategory = (item.category || '').toUpperCase();
            const matchesCategory = !selectedCategory || selectedCategory === 'ALL' || itemCategory.includes(selectedCategory);

            const rating = parseFloat(item.rating || 5.0);
            const matchesRating = rating >= minRating;

            const rate = Number(item.hourlyRate) || 0;
            let matchesBracket = true;
            if (selectedRateBracket === 'UNDER_50') matchesBracket = rate < 50;
            else if (selectedRateBracket === '50_100') matchesBracket = rate >= 50 && rate <= 100;
            else if (selectedRateBracket === 'ABOVE_100') matchesBracket = rate > 100;

            return matchesQuery && matchesCategory && matchesRating && matchesBracket;
        });

        filtered.sort((a, b) => {
            if (sortOrder === 'RATE_ASC') return (a.hourlyRate || 0) - (b.hourlyRate || 0);
            if (sortOrder === 'RATE_DESC') return (b.hourlyRate || 0) - (a.hourlyRate || 0);
            if (sortOrder === 'SLA_ASC') return (a.deliveryDays || 14) - (b.deliveryDays || 14);
            return parseFloat(b.rating || 5.0) - parseFloat(a.rating || 5.0);
        });

        renderCatalog(filtered);
    }

    function setupEventListeners() {
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
        if (rateBracketFilter) rateBracketFilter.addEventListener('change', applyFilters);
        if (catalogSortSelect) catalogSortSelect.addEventListener('change', applyFilters);

        function resetFilters() {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (minRatingFilter) minRatingFilter.value = '0';
            if (rateBracketFilter) rateBracketFilter.value = 'ALL';
            if (catalogSortSelect) catalogSortSelect.value = 'RATING_DESC';
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
    // 5. Project Invitation Modal Setup
    // -------------------------------------------------------------------------
    function handleInviteClick(providerId, providerName, providerDomain, providerEmail = '') {
        const user = window.AuthState && typeof window.AuthState.getUser === 'function'
            ? window.AuthState.getUser()
            : null;
        const isLoggedIn = window.AuthState && typeof window.AuthState.isLoggedIn === 'function'
            ? window.AuthState.isLoggedIn()
            : Boolean(user);

        if (!isLoggedIn || !user) {
            if (window.Toast) window.Toast.info('Please sign in as a Client to start a project.');
            setTimeout(() => {
                window.location.href = `auth.html?redirect=${encodeURIComponent('provider-explore.html')}`;
            }, 700);
            return;
        }

        if (user.role !== ROLES.CLIENT) {
            if (window.Toast) window.Toast.warning('Only Client accounts can dispatch project invitations.');
            return;
        }

        if (selectedProviderIdInput) selectedProviderIdInput.value = providerId;
        if (selectedProviderNameInput) selectedProviderNameInput.value = providerName;
        if (selectedProviderEmailInput) selectedProviderEmailInput.value = providerEmail || '';
        if (selectedProviderDomainInput) selectedProviderDomainInput.value = providerDomain || '';
        if (modalProviderTitle) modalProviderTitle.textContent = `Invite ${providerName} to Scope Project`;

        const categorySelect = document.getElementById('projectCategorySelect');
        if (categorySelect && providerDomain) {
            categorySelect.value = inferCategoryFromDomain(providerDomain);
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
    // 6. Submit Invitation -> Direct Insert into Supabase `projects`, `agreements`, `requirements`
    // -------------------------------------------------------------------------
    if (inviteProjectForm) {
        inviteProjectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const providerId = selectedProviderIdInput ? selectedProviderIdInput.value : null;
            const providerName = selectedProviderNameInput ? selectedProviderNameInput.value : 'Assigned Provider';
            const providerEmail = selectedProviderEmailInput ? selectedProviderEmailInput.value : null;
            const title = (document.getElementById('projectTitleInput')?.value || '').trim();
            const category = document.getElementById('projectCategorySelect')?.value || 'WEB_DEVELOPMENT';
            const summary = (document.getElementById('projectSummaryInput')?.value || '').trim();
            const budget = parseFloat(document.getElementById('projectBudgetInput')?.value) || 1500;
            const targetSla = document.getElementById('projectTargetSlaInput')?.value || null;
            const milestoneCount = parseInt(document.getElementById('projectEstimatedMilestonesSelect')?.value, 10) || 3;
            const repoUrl = (document.getElementById('projectRepoRefInput')?.value || '').trim();

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
            const clientDisplayName = currentUser?.fullName || currentUser?.name || currentUser?.username || 'Verified Client';

            const newProjectRow = {
                client_id: currentUser?.id,
                client_name: clientDisplayName,
                client_email: currentUser?.email || 'client@workbridge.io',
                assigned_provider_id: providerId,
                assigned_provider_name: providerName,
                assigned_provider_email: providerEmail || null,
                title: title,
                category: category,
                budget: budget,
                description: summary,
                summary: summary,
                stage: 'INVITED',
                completion_percentage: 0,
                target_sla_date: targetSla,
                milestone_count: milestoneCount,
                repository_url: repoUrl || null
            };

            try {
                // 1. Direct insert into Supabase `projects` table
                const { data, error } = await sb
                    .from('projects')
                    .insert([newProjectRow])
                    .select()
                    .single();

                if (error) throw error;

                // 2. Create initial agreement stub in draft state
                await sb
                    .from('agreements')
                    .insert([{
                        project_id: data.id,
                        version: '1.0',
                        status: 'DRAFT',
                        agreed_amount: budget,
                        target_delivery_date: targetSla,
                        terms_and_conditions: `Mutual scope baseline governed by WorkBridge milestone protocol. Estimated Milestones: ${milestoneCount}. Target SLA: ${targetSla || 'Standard'}.`
                    }]);

                // 3. Seed initial requirement draft from invitation summary
                await sb
                    .from('requirements')
                    .upsert([{
                        project_id: data.id,
                        version: '1.0',
                        status: 'DRAFT',
                        objectives: title,
                        features: summary
                    }], { onConflict: 'project_id' });

                // 4. Record system log in workspace messages
                await sb
                    .from('workspace_messages')
                    .insert([{
                        project_id: data.id,
                        sender_id: currentUser?.id,
                        sender_name: clientDisplayName,
                        sender_role: 'CLIENT',
                        message: `Project invitation dispatched to ${providerName} ($${budget.toLocaleString()} target budget). Awaiting provider acceptance to unlock scoping.`
                    }]);

                if (window.AuthState && typeof window.AuthState.setActiveProjectId === 'function') {
                    window.AuthState.setActiveProjectId(data.id);
                }

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
                    modalSubmitBtn.textContent = 'Dispatch Invitation';
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // Utilities
    // -------------------------------------------------------------------------
    function parseSkills(skills) {
        if (Array.isArray(skills) && skills.length > 0) return skills;
        if (typeof skills === 'string' && skills.trim()) {
            return skills.split(',').map(s => s.trim()).filter(Boolean);
        }
        return ['Java 21', 'Spring Boot', 'PostgreSQL', 'Vanilla JS'];
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});