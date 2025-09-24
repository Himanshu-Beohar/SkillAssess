// Reset Password page
const resetPasswordPage = {
    async load(data) {
        // Get token from URL params
        const token = data?.token || (router.getRouteParams ? router.getRouteParams().token : null);

        if (!token) {
            utils.showNotification("Invalid or missing reset token.", "error");
            router.navigateTo(config.ROUTES.LOGIN);
            return;
        }

        const html = `
            <div class="page-container">
                <div class="auth-card">
                    <h2 class="card-title">Reset Password</h2>
                    <p class="card-subtitle">Enter your new password below.</p>

                    <form id="reset-password-form" class="auth-form">
                        <div class="form-group">
                            <label for="new-password">New Password</label>
                            <input type="password" id="new-password" class="form-control" placeholder="Enter new password" required>
                        </div>
                        <div class="form-group">
                            <label for="confirm-password">Confirm Password</label>
                            <input type="password" id="confirm-password" class="form-control" placeholder="Confirm new password" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Reset Password</button>
                    </form>

                    <p class="auth-link">
                        <a href="${config.ROUTES.LOGIN}">Back to Login</a>
                    </p>
                </div>
            </div>
        `;

        document.getElementById('page-content').innerHTML = html;
        this.addEventListeners(token);
    },

    addEventListeners(token) {
        const form = document.getElementById('reset-password-form');
        form.addEventListener('submit', (e) => this.handleResetPassword(e, token));
    },

    async handleResetPassword(e, token) {
        e.preventDefault();

        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!utils.validatePassword(newPassword)) {
            utils.showNotification("Password must be at least 6 characters long", "error");
            return;
        }

        if (newPassword !== confirmPassword) {
            utils.showNotification("Passwords do not match", "error");
            return;
        }

        try {
            utils.showLoading("Resetting password...");
            const response = await api.post(`/auth/reset-password/${token}`, { newPassword });

            if (response.success) {
                utils.showNotification("✅ Password reset successful. Please login.", "success");
                router.navigateTo(config.ROUTES.LOGIN);
            } else {
                throw new Error(response.error || "Failed to reset password");
            }
        } catch (error) {
            console.error("Reset password error:", error);
            utils.showNotification(error.message, "error");
        } finally {
            utils.hideLoading();
        }
    }
};
