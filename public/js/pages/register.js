// Register page
const registerPage = {
    async load() {
        const html = `
            <div class="page-container">
                <div class="auth-card">
                    <h2 class="card-title">Create an Account</h2>
                    <form id="register-form" class="auth-form">
                        <div class="form-group">
                            <label for="register-name">Full Name</label>
                            <input type="text" id="register-name" class="form-control" placeholder="Enter your full name" required>
                        </div>
                        <div class="form-group">
                            <label for="register-email">Email</label>
                            <input type="email" id="register-email" class="form-control" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="register-password">Password</label>
                            <input type="password" id="register-password" class="form-control" placeholder="Create a password" required>
                        </div>
                        <div class="form-group">
                            <label for="register-confirm-password">Confirm Password</label>
                            <input type="password" id="register-confirm-password" class="form-control" placeholder="Confirm your password" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-full">Register</button>
                    </form>
                    <p class="auth-link">
                        Already have an account? <a href="${config.ROUTES.LOGIN}">Login here</a>
                    </p>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
        this.addEventListeners();
    },

    addEventListeners() {
        const form = document.getElementById('register-form');
        form.addEventListener('submit', this.handleRegister.bind(this));
    },

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!name.trim()) {
            utils.showNotification('Please enter your name', 'error');
            return;
        }

        if (!utils.validateEmail(email)) {
            utils.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!utils.validatePassword(password)) {
            utils.showNotification('Password must be at least 6 characters long', 'error');
            return;
        }

        if (password !== confirmPassword) {
            utils.showNotification('Passwords do not match', 'error');
            return;
        }

        try {
            await auth.register({ name, email, password });
            router.navigateTo(config.ROUTES.HOME);
        } catch (error) {
            console.error('Registration failed:', error);
        }
    }
};