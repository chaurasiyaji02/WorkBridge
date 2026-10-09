/**
 * WORKBRIDGE - REUSABLE TOAST NOTIFICATION COMPONENT
 * File: js/components/toast.js
 * 
 * Injects lightweight auto-dismissing feedback messages for user actions,
 * with XSS-safe text nodes, tap-to-dismiss, and maximum stack controls.
 */

const Toast = (function () {
    let container = null;
    const MAX_VISIBLE_TOASTS = 4;

    /**
     * Ensure the toast DOM container exists.
     */
    function initContainer() {
        if (!container || !document.body.contains(container)) {
            container = document.getElementById('toastContainer') || document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toastContainer';
                container.className = 'toast-container';
                container.setAttribute('aria-live', 'polite');
                document.body.appendChild(container);
            }
        }
    }

    /**
     * Show a styled toast alert.
     * @param {string} message - Feedback message text
     * @param {string} type - 'success' | 'error' | 'warning' | 'info'
     * @param {number} [durationMs=3500] - Display duration in ms
     */
    function show(message, type = 'info', durationMs = 3500) {
        initContainer();

        // Prune older toasts if flooding the viewport
        const existingToasts = container.querySelectorAll('.toast');
        if (existingToasts.length >= MAX_VISIBLE_TOASTS) {
            existingToasts[0].remove();
        }

        const toastEl = document.createElement('div');
        toastEl.className = `toast toast-${type}`;
        toastEl.setAttribute('role', 'alert');

        const icons = {
            success: '✅',
            error: '⚠️',
            warning: '⚡',
            info: 'ℹ️'
        };

        const iconSpan = document.createElement('span');
        iconSpan.className = 'toast-icon';
        iconSpan.textContent = icons[type] || icons.info;

        const textSpan = document.createElement('span');
        textSpan.className = 'toast-message';
        textSpan.textContent = String(message || 'Notification');

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close-btn';
        closeBtn.setAttribute('aria-label', 'Dismiss notification');
        closeBtn.innerHTML = '&times;';

        toastEl.appendChild(iconSpan);
        toastEl.appendChild(textSpan);
        toastEl.appendChild(closeBtn);

        // Tap to dismiss
        const dismiss = () => {
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateY(-8px)';
            toastEl.style.transition = 'all 0.25s ease-out';
            setTimeout(() => {
                if (toastEl.parentNode) {
                    toastEl.parentNode.removeChild(toastEl);
                }
            }, 250);
        };

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss();
        });

        toastEl.addEventListener('click', dismiss);

        container.appendChild(toastEl);

        // Auto-dismiss timeout
        if (durationMs > 0) {
            setTimeout(dismiss, durationMs);
        }
    }

    return {
        show,
        success: (msg, duration) => show(msg, 'success', duration),
        error: (msg, duration) => show(msg, 'error', duration || 4500),
        warning: (msg, duration) => show(msg, 'warning', duration),
        info: (msg, duration) => show(msg, 'info', duration)
    };
})();

// Attach to global window
window.Toast = Toast;