/**
 * WORKBRIDGE - DYNAMIC NAVBAR COMPONENT
 * File: js/components/navbar.js
 * 
 * Inspects AuthState and renders role-aware header navigation links.
 */

document.addEventListener('DOMContentLoaded', () => {
    const navContainer = document.getElementById('mainNav');
    if (!navContainer) return;

    const { ROLES } = window.APP_CONFIG;
    const isLoggedIn = window.AuthState ? window.AuthState.isLoggedIn() : false;
    const user = window.AuthState ? window.AuthState.getUser() : null;

    const currentPath = window.location.pathname;

    // Helper to determine active state
    const isActive = (path) => currentPath.includes(path) ? 'active' : '';

    if (!isLoggedIn || !user) {
        // Guest Navigation State
        navContainer.innerHTML = `
            <a href="index.html" class="nav-link ${isActive('index.html')}">Home</a>
            <a href="provider-explore.html" class="nav-link ${isActive('provider-explore.html')}">Explore Providers</a>
            <a href="index.html#features" class="nav-link">How It Works</a>
            <a href="auth.html" class="btn btn-outline btn-sm">Sign In</a>
            <a href="auth.html?mode=register" class="btn btn-primary btn-sm">Get Started</a>
        `;
        return;
    }

    // Role-Aware Authenticated Navigation State
    let roleLinks = '';
    let dashboardUrl = 'index.html';

    if (user.role === ROLES.CLIENT) {
        dashboardUrl = 'client-dashboard.html';
        roleLinks = `
            <a href="client-dashboard.html" class="nav-link ${isActive('client-dashboard.html')}">Dashboard</a>
            <a href="provider-explore.html" class="nav-link ${isActive('provider-explore.html')}">Explore Providers</a>
        `;
    } else if (user.role === ROLES.SERVICE_PROVIDER) {
        dashboardUrl = 'provider-dashboard.html';
        roleLinks = `
            <a href="provider-dashboard.html" class="nav-link ${isActive('provider-dashboard.html')}">Workspace Hub</a>
        `;
    } else if (user.role === ROLES.ADMIN) {
        dashboardUrl = 'admin-dashboard.html';
        roleLinks = `
            <a href="admin-dashboard.html" class="nav-link ${isActive('admin-dashboard.html')}">Governance Console</a>
        `;
    }

    navContainer.innerHTML = `
        ${roleLinks}
        <div class="nav-user-meta" style="display: flex; align-items: center; gap: 0.75rem; margin-left: 0.5rem;">
            <a href="${dashboardUrl}" class="badge badge-subtle" style="text-transform: none;">
                👤 ${user.fullName || user.email}
            </a>
            <button type="button" id="navLogoutBtn" class="btn btn-outline btn-sm">Logout</button>
        </div>
    `;

    // Attach logout event
    const logoutBtn = document.getElementById('navLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.AuthState.logout();
        });
    }
});