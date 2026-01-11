/**
 * Pinokio Global UI Service
 * Wraps SweetAlert2 to provide consistent feedback across the application.
 */
(function () {
    const isDark = () => document.body.classList.contains('dark');

    // Default config for dark/light mode
    const getTheme = () => ({
        background: isDark() ? '#1F2937' : '#FFFFFF',
        color: isDark() ? '#FFFFFF' : '#000000',
        confirmButtonColor: '#3b82f6', // Tailwind blue-500 equivalent
        cancelButtonColor: '#6b7280',  // Tailwind gray-500 equivalent
        returnFocus: true,             // Return focus to triggering element
        backdrop: true,                // Dim background
        allowOutsideClick: false,      // Force user to interact with modal
        allowEscapeKey: true,          // Allow closing with Escape
    });

    window.UI = {
        /**
         * Show a simple informational alert or toast
         * @param {string|object} options - Message string or Swal options object
         */
        alert: async (options) => {
            const defaults = {
                icon: 'info',
                confirmButtonText: 'OK',
                ...getTheme()
            };

            if (typeof options === 'string') {
                return Swal.fire({ ...defaults, text: options });
            }
            return Swal.fire({ ...defaults, ...options });
        },

        /**
         * Show an error alert
         * @param {string} message - Error message
         */
        error: async (message) => {
            return Swal.fire({
                icon: 'error',
                title: 'Error',
                text: message,
                confirmButtonText: 'OK',
                ...getTheme()
            });
        },

        /**
         * Show a success alert (often auto-closing)
         * @param {string} message - Success message
         */
        success: async (message) => {
            return Swal.fire({
                icon: 'success',
                title: 'Success',
                text: message,
                timer: 2000,
                timerProgressBar: true,
                showConfirmButton: false,
                ...getTheme()
            });
        },

        /**
         * Request confirmation from user
         * @param {string} message - Question to ask
         * @param {string} confirmBtnText - Text for confirm button
         * @returns {Promise<boolean>} - true if confirmed, false otherwise
         */
        confirm: async (message, confirmBtnText = 'Yes, proceed') => {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: message,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: confirmBtnText,
                cancelButtonText: 'Cancel',
                reverseButtons: true,
                focusCancel: true,
                ...getTheme()
            });
            return result.isConfirmed;
        },

        /**
         * Toast notification (non-blocking)
         * @param {string} message 
         * @param {'success'|'error'|'info'|'warning'} type 
         */
        toast: (message, type = 'success') => {
            const Toast = Swal.mixin({
                toast: true,
                position: 'bottom-end',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                ...getTheme(),
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer)
                    toast.addEventListener('mouseleave', Swal.resumeTimer)
                }
            });

            Toast.fire({
                icon: type,
                title: message
            });
        }
    };

    console.log("[Pinokio] UI Service initialized");
})();
