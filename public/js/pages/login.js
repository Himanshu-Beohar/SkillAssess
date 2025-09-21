// Login page
const loginPage = {
    async load() {
        const html = `
            <div class="page-container">
                <div class="auth-card">
                    <h2 class="card-title">Login to Your Account</h2>
                    <form id="login-form" class="auth-form">
                        <div class="form-group">
                            <label for="login-email">Email</label>
                            <input type="email" id="login-email" class="form-control" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password</label>
                            <input type="password" id="login-password" class="form-control" placeholder="Enter your password" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Login</button>
                    </form>
                    <p class="auth-link">
                        Don't have an account? <a href="${config.ROUTES.REGISTER}">Register here</a>
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
        this.addEventListeners();
    },

    addEventListeners() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', this.handleLogin.bind(this));
    },

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!utils.validateEmail(email)) {
            utils.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!utils.validatePassword(password)) {
            utils.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        try {
            await auth.login(email, password);
            router.navigateTo(config.ROUTES.HOME);
            //router.navigateTo('/wins');
        } catch (error) {
            console.error('Login failed:', error);
        }
    }
};