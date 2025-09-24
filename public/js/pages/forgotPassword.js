// Forgot Password page
const forgotPasswordPage = {
    async load() {
        console.log("📩 forgotPasswordPage.load() called"); // debug
        const html = `
            <div class="page-container">
                <div class="auth-card">
                    <h2 class="card-title">Forgot Password</h2>
                    <p class="card-subtitle">Enter your email address and we'll send you a link to reset your password.</p>

                    <form id="forgot-password-form" class="auth-form">
                        <div class="form-group">
                            <label for="forgot-email">Email</label>
                            <input type="email" id="forgot-email" class="form-control" placeholder="Enter your registered email" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Send Reset Link</button>
                    </form>

                    <p class="auth-link">
                        <a href="${config.ROUTES.LOGIN}">Back to Login</a>
                    </p>
                </div>
            </div>
        `;

        document.getElementById('page-content').innerHTML = html;
        this.addEventListeners();
    },

    addEventListeners() {
        const form = document.getElementById('forgot-password-form');
        form.addEventListener('submit', this.handleForgotPassword.bind(this));
    },

    async handleForgotPassword(e) {
        e.preventDefault();

        const email = document.getElementById('forgot-email').value;

        if (!utils.validateEmail(email)) {
            utils.showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            utils.showLoading("Sending reset link...");
            const response = await api.post('/auth/forgot-password', { email });

            if (response.success) {
                utils.showNotification("✅ Reset link sent! Please check your email.", "success");
                router.navigateTo(config.ROUTES.LOGIN);
            } else {
                throw new Error(response.error || "Failed to send reset link");
            }
        } catch (error) {
            console.error("Forgot password error:", error);
            utils.showNotification(error.message, "error");
        } finally {
            utils.hideLoading();
        }
    }
};
