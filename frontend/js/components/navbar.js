/**
 * WORKBRIDGE - DYNAMIC NAVBAR & MOBILE DRAWER COMPONENT
 * File: js/components/navbar.js
 * 
 * Inspects AuthState, renders role-aware header navigation,
 * wires responsive mobile hamburger toggles, and connects profile settings.
 */

document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.getElementById('mainNav');
    if (!navContainer) return;

    const config = window.APP_CONFIG || {};
    const ROLES = config.ROLES || {
        CLIENT: 'CLIENT',
        SERVICE_PROVIDER: 'SERVICE_PROVIDER',
        ADMIN: 'ADMIN'
    };

    const isLoggedIn = window.AuthState ? window.AuthState.isLoggedIn() : false;
    const user = window.AuthState ? window.AuthState.getUser() : null;
    const currentPath = window.location.pathname;

    // Helper to determine active link state
    const isActive = (path) => {
        if (path === 'index.html' && (currentPath === '/' || currentPath.endsWith('/') || currentPath.endsWith('/index.html'))) {
            return 'active';
        }
        return currentPath.includes(path) ? 'active' : '';
    };

    // Safe string escape for user display names
    const escapeHtml = (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
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
        let roleLinks = '';
        let dashboardUrl = 'index.html';

        if (user.role === ROLES.CLIENT) {
            dashboardUrl = 'client-dashboard.html';
            roleLinks = `
                <a href="client-dashboard.html" class="nav-link ${isActive('client-dashboard.html')}">Dashboard</a>
                <a href="provider-explore.html" class="nav-link ${isActive('provider-explore.html')}">Explore Talent</a>
            `;
        } else if (user.role === ROLES.SERVICE_PROVIDER) {
            dashboardUrl = 'provider-dashboard.html';
            roleLinks = `
                <a href="provider-dashboard.html" class="nav-link ${isActive('provider-dashboard.html')}">Workspace Hub</a>
                <a href="provider-explore.html" class="nav-link ${isActive('provider-explore.html')}">Explore Market</a>
            `;
        } else if (user.role === ROLES.ADMIN) {
            dashboardUrl = 'admin-dashboard.html';
            roleLinks = `
                <a href="admin-dashboard.html" class="nav-link ${isActive('admin-dashboard.html')}">Governance Console</a>
            `;
        }

        const displayName = escapeHtml(user.fullName || user.username || user.email || 'My Profile');

        navContainer.innerHTML = `
            ${roleLinks}
            <div class="nav-user-meta" style="display: flex; align-items: center; gap: 0.5rem; margin-left: 0.5rem;">
                <a href="profile-settings.html" class="badge badge-subtle nav-profile-pill ${isActive('profile-settings.html')}" title="Manage Profile & Capabilities" style="text-transform: none; text-decoration: none; display: flex; align-items: center; gap: 0.25rem;">
                    <span>⚙️</span>
                    <span>${displayName}</span>
                </a>
                <button type="button" id="navLogoutBtn" class="btn btn-outline btn-sm">Logout</button>
            </div>
        `;

        // Wire logout button
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.AuthState) {
                    window.AuthState.logout();
                } else {
                    localStorage.clear();
                    window.location.href = 'auth.html';
                }
            });
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

        // Close drawer when any nav link is tapped
        navContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navContainer.classList.remove('nav-open');
                mobileNavToggle.classList.remove('active');
                mobileNavToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
});