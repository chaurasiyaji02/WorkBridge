/**
 * WORKBRIDGE - REUSABLE MODAL COMPONENT
 * File: js/components/modal.js
 * 
 * Provides unified open/close state management, backdrop click dismissal,
 * ESC-key dismissal, automated close-button delegation, and focus management.
 */

const Modal = (function () {
    /**
     * Resolve modal element from ID string or direct HTMLElement.
     * @param {string|HTMLElement} target
     * @returns {HTMLElement|null}
     */
    function resolveModalElement(target) {
        if (!target) return null;
        if (typeof target === 'string') {
            return document.getElementById(target);
        }
        if (target instanceof HTMLElement) {
            return target;
        }
        return null;
    }

    /**
     * Open a modal dialog.
     * @param {string|HTMLElement} modalTarget - DOM ID or modal HTMLElement
     */
    function open(modalTarget) {
        const modalEl = resolveModalElement(modalTarget);
        if (!modalEl) {
            console.warn(`Modal target not found:`, modalTarget);
            return;
        }

        modalEl.classList.remove('hidden');
        modalEl.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling

        // Auto-focus first interactive input for accessibility
        const firstInput = modalEl.querySelector('input:not([type="hidden"]), select, textarea, button:not(.modal-close-btn)');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 50);
        }
    }

    /**
     * Close a modal dialog and optionally reset forms inside it.
     * @param {string|HTMLElement} modalTarget - DOM ID or modal HTMLElement
     * @param {boolean} [resetForm=true] - Whether to reset any form inside the modal
     */
    function close(modalTarget, resetForm = false) {
        const modalEl = resolveModalElement(modalTarget);
        if (!modalEl) return;

        modalEl.classList.add('hidden');
        modalEl.setAttribute('aria-hidden', 'true');
        
        // Restore background scroll only if no other modals remain open
        const remainingOpen = document.querySelectorAll('.modal-backdrop:not(.hidden)');
        if (remainingOpen.length === 0) {
            document.body.style.overflow = '';
        }

        // Optional form reset on close
        if (resetForm) {
            const form = modalEl.querySelector('form');
            if (form) form.reset();
        }
    }

    /**
     * Close all active modals currently rendered in the DOM.
     */
    function closeAll() {
        const activeModals = document.querySelectorAll('.modal-backdrop:not(.hidden)');
        activeModals.forEach(modal => close(modal));
    }

    /**
     * Global event delegations (Close buttons, backdrop click, Escape key)
     */
    function initListeners() {
        // 1. Dismiss on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAll();
            }
        });

        // 2. Dismiss on backdrop click (click outside modal-card)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                close(e.target);
            }
        });

        // 3. Automated delegation for modal close & cancel triggers
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.modal-close-btn, .modal-close, [data-modal-close], button[id*="cancel" i], button[id*="close" i]');
            if (trigger) {
                // If it is explicitly inside a modal backdrop
                const modalBackdrop = trigger.closest('.modal-backdrop');
                if (modalBackdrop && !trigger.matches('[type="submit"]')) {
                    e.preventDefault();
                    close(modalBackdrop);
                }
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
        close,
        closeAll
    };
})();

// Attach to window for global access
window.Modal = Modal;