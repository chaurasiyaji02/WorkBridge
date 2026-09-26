/**
 * WORKBRIDGE - REUSABLE MODAL COMPONENT
 * File: js/components/modal.js
 * 
 * Provides unified open/close management, backdrop dismissals,
 * and keyboard accessibility for modals across all pages.
 */

const Modal = (function () {
    /**
     * Open a modal dialog by its element ID.
     * @param {string} modalId - The DOM ID of the modal backdrop element
     */
    function open(modalId) {
        const modalEl = document.getElementById(modalId);
        if (!modalEl) {
            console.warn(`Modal element with id "${modalId}" not found.`);
            return;
        }
        modalEl.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    /**
     * Close a modal dialog by its element ID.
     * @param {string} modalId - The DOM ID of the modal backdrop element
     */
    function close(modalId) {
        const modalEl = document.getElementById(modalId);
        if (!modalEl) return;
        modalEl.classList.add('hidden');
        document.body.style.overflow = ''; // Restore background scrolling
    }

    /**
     * Initialize automatic dismissal listeners (ESC key & backdrop clicks).
     */
    function initListeners() {
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const activeModals = document.querySelectorAll('.modal-backdrop:not(.hidden)');
                activeModals.forEach((modal) => close(modal.id));
            }
        });

        // Close on backdrop click outside modal-card
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                close(e.target.id);
            }
        });
    }

    // Auto-initialize listeners on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initListeners);
    } else {
        initListeners();
    }

    return {
        open,
        close
    };
})();

// Attach to window for global access
window.Modal = Modal;