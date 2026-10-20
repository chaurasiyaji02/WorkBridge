/**
 * WORKBRIDGE - DYNAMIC NAVBAR, MULTI-WORKSPACE SWITCHER & MOBILE DRAWER
 * File: js/components/navbar.js
 * 
 * Inspects AuthState, renders role-aware header navigation,
 * provides a live Supabase Multi-Workspace Quick-Switcher dropdown,
 * wires responsive mobile hamburger toggles, and connects profile settings.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const navContainer = document.getElementById('mainNav');
    if (!navContainer) return;

    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || {
        CLIENT: 'CLIENT',
        SERVICE_PROVIDER: 'SERVICE_PROVIDER',
        ADMIN: 'ADMIN'
    };

    const user = window.AuthState && typeof window.AuthState.getUser === 'function'
        ? window.AuthState.getUser()
        : null;

    const isLoggedIn = window.AuthState && typeof window.AuthState.isLoggedIn === 'function'
        ? window.AuthState.isLoggedIn()
        : Boolean(user);

    const currentPath = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const currentUrlProjectId = urlParams.get('id');

    const activeProjectId = currentUrlProjectId || (
        window.AuthState && typeof window.AuthState.getActiveProjectId === 'function'
            ? window.AuthState.getActiveProjectId()
            : localStorage.getItem(config.STORAGE_KEYS?.ACTIVE_PROJECT_ID || 'wb_active_project_id')
    );

    // Helper to determine active link state
    const isActive = (path) => {
        if (path === 'index.html' && (currentPath === '/' || currentPath.endsWith('/') || currentPath.endsWith('/index.html'))) {
            return 'active';
        }
        return currentPath.includes(path) ? 'active' : '';
    };

    // Safe string escape for user and project display names
    const escapeHtml = (str) => {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    };

    // Stage badge formatter for workspace switcher dropdown
    const formatStagePill = (stage) => {
        switch (stage) {
            case 'INVITED':
                return '<span class="badge badge-subtle" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Invited</span>';
            case 'REQUIREMENT_DISCUSSION':
                return '<span class="badge badge-warning" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Scoping</span>';
            case 'AGREEMENT_LOCKED':
                return '<span class="badge badge-info" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Locked</span>';
            case 'IN_PROGRESS':
                return '<span class="badge badge-primary" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Building</span>';
            case 'REVIEW':
                return '<span class="badge badge-warning" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Review</span>';
            case 'COMPLETED':
                return '<span class="badge badge-success" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Completed</span>';
            default:
                return '<span class="badge badge-subtle" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">Active</span>';
        }
    };

    if (!isLoggedIn || !user) {
        // ==========================================
        // GUEST NAVIGATION
        // ==========================================
        navContainer.innerHTML = `
            <a href="index.html" class="nav-link ${isActive('index.html')}">Home</a>
            <a href="provider-explore.html" class="nav-link ${isActive('provider-explore.html')}">Explore Providers</a>
            <a href="index.html#features" class="nav-link">How It Works</a>
            <a href="auth.html" class="btn btn-outline btn-sm">Sign In</a>
            <a href="auth.html?mode=register" class="btn btn-primary btn-sm">Get Started</a>
        `;
    } else {
        // ==========================================
        // ROLE-AWARE AUTHENTICATED NAVIGATION
        // ==========================================
        const isWorkspaceActive = currentPath.includes('project-view.html') ? 'active' : '';
        const fallbackHref = activeProjectId
            ? `project-view.html?id=${encodeURIComponent(activeProjectId)}`
            : (user.role === ROLES.CLIENT ? 'client-dashboard.html#activeProjectsSection' : 'provider-dashboard.html#providerProjectsSection');

        // Multi-Workspace Switcher Wrapper
        const workspaceSwitcherHtml = `
            <div class="nav-workspace-dropdown" id="navWorkspaceDropdown" style="position: relative; display: inline-flex; align-items: center;">
                <button type="button" id="navWorkspaceToggleBtn" class="nav-link ${isWorkspaceActive}" aria-expanded="false" title="Switch or enter active project workspaces" style="background: none; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700; color: var(--primary, #3b82f6); padding: 0.4rem 0.65rem; border-radius: 6px;">
                    <span>⚡ Active Workspaces</span>
                    <span id="navWorkspaceCountBadge" class="badge badge-primary" style="font-size: 0.68rem; padding: 0.1rem 0.4rem; display: none;">0</span>
                    <span style="font-size: 0.7rem; opacity: 0.8;">▾</span>
                </button>
                <div id="navWorkspaceMenu" class="hidden" style="position: absolute; top: calc(100% + 8px); right: 0; min-width: 310px; max-width: 360px; background: #ffffff; border: 1px solid var(--border-color, #e2e8f0); border-radius: 10px; box-shadow: 0 12px 28px -4px rgba(15, 23, 42, 0.15); z-index: 1200; padding: 0.5rem; overflow: hidden;">
                    <div style="padding: 0.4rem 0.6rem; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 0.72rem; font-weight: 700; color: #64748b; letter-spacing: 0.04em; text-transform: uppercase;">Your Project Workspaces</span>
                        <a href="${user.role === ROLES.CLIENT ? 'client-dashboard.html' : 'provider-dashboard.html'}" style="font-size: 0.72rem; color: var(--primary, #3b82f6); text-decoration: none; font-weight: 600;">View All &rarr;</a>
                    </div>
                    <div id="navWorkspaceList" style="max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.25rem; padding: 0.35rem 0;">
                        <div style="padding: 0.75rem; text-align: center; font-size: 0.8rem; color: #64748b;">
                            Loading workspaces...
                        </div>
                    </div>
                </div>
            </div>
        `;

        let roleLinks = '';

        if (user.role === ROLES.CLIENT) {
            roleLinks = `
                <a href="client-dashboard.html" class="nav-link ${isActive('client-dashboard.html')}">Dashboard</a>
                <a href="provider-explore.html" class="nav-link ${isActive('provider-explore.html')}">Explore Talent</a>
                ${workspaceSwitcherHtml}
            `;
        } else if (user.role === ROLES.SERVICE_PROVIDER) {
            roleLinks = `
                <a href="provider-dashboard.html" class="nav-link ${isActive('provider-dashboard.html')}">Workspace Hub</a>
                <a href="provider-explore.html" class="nav-link ${isActive('provider-explore.html')}">Explore Market</a>
                ${workspaceSwitcherHtml}
            `;
        } else if (user.role === ROLES.ADMIN) {
            roleLinks = `
                <a href="admin-dashboard.html" class="nav-link ${isActive('admin-dashboard.html')}">Governance Console</a>
                <a href="provider-explore.html" class="nav-link ${isActive('provider-explore.html')}">Explore Audits</a>
            `;
        }

        const rawName = user.fullName || user.name || user.username || user.email || 'My Profile';
        const truncatedName = rawName.length > 16 ? `${rawName.slice(0, 14)}…` : rawName;
        const displayName = escapeHtml(truncatedName);

        navContainer.innerHTML = `
            ${roleLinks}
            <div class="nav-user-meta" style="display: flex; align-items: center; gap: 0.5rem; margin-left: 0.5rem;">
                <a href="profile-settings.html" class="badge badge-subtle nav-profile-pill ${isActive('profile-settings.html')}" title="Manage Profile &amp; Capabilities" style="text-transform: none; text-decoration: none; display: flex; align-items: center; gap: 0.25rem;">
                    <span>⚙️</span>
                    <span>${displayName}</span>
                </a>
                <button type="button" id="navLogoutBtn" class="btn btn-outline btn-sm">Logout</button>
            </div>
        `;

        // Wire Logout Button
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                logoutBtn.disabled = true;
                logoutBtn.textContent = 'Signing out...';
                if (window.AuthState && typeof window.AuthState.logout === 'function') {
                    await window.AuthState.logout();
                } else {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = 'auth.html';
                }
            });
        }

        // Wire Multi-Workspace Dropdown Logic & Hydrate from Supabase
        const wsToggleBtn = document.getElementById('navWorkspaceToggleBtn');
        const wsMenu = document.getElementById('navWorkspaceMenu');
        const wsList = document.getElementById('navWorkspaceList');
        const wsCountBadge = document.getElementById('navWorkspaceCountBadge');

        if (wsToggleBtn && wsMenu) {
            wsToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isHidden = wsMenu.classList.toggle('hidden');
                wsToggleBtn.setAttribute('aria-expanded', String(!isHidden));
            });

            document.addEventListener('click', (e) => {
                if (!wsMenu.contains(e.target) && !wsToggleBtn.contains(e.target)) {
                    wsMenu.classList.add('hidden');
                    wsToggleBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // Fetch Live Workspaces for Dropdown
        if (wsList && window.sbClient && user.role !== ROLES.ADMIN) {
            try {
                const sb = window.sbClient;
                const userId = user.id || '';
                const userEmail = (user.email || '').trim().toLowerCase();
                const userName = rawName.trim();

                let query = sb
                    .from('projects')
                    .select('id, title, stage, client_name, assigned_provider_name, completion_percentage')
                    .neq('stage', 'DECLINED');

                if (user.role === ROLES.CLIENT) {
                    if (userId && userEmail) {
                        query = query.or(`client_id.eq.${userId},client_email.ilike.${userEmail},client_name.ilike.%${userName}%`);
                    } else if (userId) {
                        query = query.eq('client_id', userId);
                    }
                } else {
                    if (userId && userEmail) {
                        query = query.or(`assigned_provider_id.eq.${userId},assigned_provider_email.ilike.${userEmail},assigned_provider_name.ilike.%${userName}%`);
                    } else if (userId) {
                        query = query.eq('assigned_provider_id', userId);
                    }
                }

                const { data: projects } = await query.order('created_at', { ascending: false }).limit(8);
                const list = Array.isArray(projects) ? projects : [];

                if (wsCountBadge && list.length > 0) {
                    wsCountBadge.textContent = String(list.length);
                    wsCountBadge.style.display = 'inline-flex';
                }

                if (list.length === 0) {
                    wsList.innerHTML = `
                        <div style="padding: 1rem 0.75rem; text-align: center;">
                            <div style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">No active workspaces yet.</div>
                            <a href="${fallbackHref}" class="btn btn-outline btn-sm" style="width: 100%; font-size: 0.75rem;">Go to Dashboard</a>
                        </div>
                    `;
                } else {
                    wsList.innerHTML = list.map(p => {
                        const isCurrent = String(p.id) === String(activeProjectId);
                        const code = 'PRJ-' + String(p.id).slice(-4).toUpperCase();
                        const partnerLabel = user.role === ROLES.CLIENT
                            ? (p.assigned_provider_name || 'Unassigned')
                            : (p.client_name || 'Client');

                        return `
                            <a href="project-view.html?id=${encodeURIComponent(p.id)}" class="ws-dropdown-item" data-id="${escapeHtml(p.id)}" style="display: flex; flex-direction: column; gap: 0.2rem; padding: 0.55rem 0.65rem; border-radius: 6px; text-decoration: none; background: ${isCurrent ? '#eff6ff' : 'transparent'}; border-left: 3px solid ${isCurrent ? 'var(--primary, #3b82f6)' : 'transparent'}; transition: background 0.15s ease;">
                                <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.4rem;">
                                    <span style="font-size: 0.82rem; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.title || 'Untitled Workspace')}</span>
                                    ${formatStagePill(p.stage)}
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.72rem; color: #64748b;">
                                    <span>${code} &bull; ${escapeHtml(partnerLabel)}</span>
                                    <strong>${Number(p.completion_percentage || 0)}%</strong>
                                </div>
                            </a>
                        `;
                    }).join('');

                    wsList.querySelectorAll('.ws-dropdown-item').forEach(item => {
                        item.addEventListener('click', () => {
                            const pid = item.getAttribute('data-id');
                            if (window.AuthState && typeof window.AuthState.setActiveProjectId === 'function' && pid) {
                                window.AuthState.setActiveProjectId(pid);
                            }
                        });
                    });
                }
            } catch (err) {
                console.warn('Navbar workspace switcher fetch warning:', err);
                wsList.innerHTML = `
                    <a href="${fallbackHref}" style="display: block; padding: 0.65rem; text-align: center; font-size: 0.8rem; color: var(--primary, #3b82f6); text-decoration: none; font-weight: 600;">
                        Open Active Workspace &rarr;
                    </a>
                `;
            }
        }
    }

    // ==========================================
    // MOBILE NAVIGATION TOGGLE (HAMBURGER LOGIC)
    // ==========================================
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isExpanded = navContainer.classList.toggle('nav-open');
            mobileNavToggle.classList.toggle('active');
            mobileNavToggle.setAttribute('aria-expanded', String(isExpanded));
        });

        // Close drawer when clicking outside
        document.addEventListener('click', (e) => {
            if (!navContainer.contains(e.target) && !mobileNavToggle.contains(e.target)) {
                navContainer.classList.remove('nav-open');
                mobileNavToggle.classList.remove('active');
                mobileNavToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close drawer when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navContainer.classList.contains('nav-open')) {
                navContainer.classList.remove('nav-open');
                mobileNavToggle.classList.remove('active');
                mobileNavToggle.setAttribute('aria-expanded', 'false');
            }
        });

        // Close drawer when any direct navigation link is tapped
        navContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navContainer.classList.remove('nav-open');
                mobileNavToggle.classList.remove('active');
                mobileNavToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
});