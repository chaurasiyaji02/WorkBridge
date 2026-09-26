/**
 * WORKBRIDGE - REUSABLE TOAST NOTIFICATION COMPONENT
 * File: js/components/toast.js
 * 
 * Injects lightweight auto-dismissing feedback messages for user actions.
 */

const Toast = (function () {
    let container = null;

    /**
     * Ensure the toast DOM container exists.
     */
    function initContainer() {
        if (!container) {
            container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                document.body.appendChild(container);
            }
        }
    }

    /**
     * Show a styled toast alert.
     * @param {string} message - Feedback message
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {number} durationMs - Display duration in ms (default 3500)
     */
    function show(message, type = 'info', durationMs = 3500) {
        initContainer();

        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;

        // Icon indicator
        const icons = {
            success: '✅',
            error: '⚠️',
            warning: '⚡',
            info: 'ℹ️'
        };

        const icon = icons[type] || icons.info;
        toastEl.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

        // Apply type-specific colors
        if (type === 'error') {
            toastEl.style.backgroundColor = 'var(--danger-text)';
        } else if (type === 'success') {
            toastEl.style.backgroundColor = 'var(--success-text)';
        } else if (type === 'warning') {
            toastEl.style.backgroundColor = 'var(--warning-text)';
        }

        container.appendChild(toastEl);

        // Auto-dismiss
        setTimeout(() => {
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateX(100%)';
            toastEl.style.transition = 'all 0.3s ease-out';
            setTimeout(() => {
                if (toastEl.parentNode) {
                    toastEl.parentNode.removeChild(toastEl);
                }
            }, 300);
        }, durationMs);
    }

    return {
        success: (msg, duration) => show(msg, 'success', duration),
        error: (msg, duration) => show(msg, 'error', duration),
        warning: (msg, duration) => show(msg, 'warning', duration),
        info: (msg, duration) => show(msg, 'info', duration)
    };
})();

// Attach to window
window.Toast = Toast;