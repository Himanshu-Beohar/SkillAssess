// Profile page
const profilePage = {
    async load() {
        const user = auth.getCurrentUser();
        if (!user) {
            router.navigateTo(config.ROUTES.LOGIN);
            return;
        }

        this.renderProfile(user);
    },

    renderProfile(user) {
        const html = `
            <div class="page-container">
                <div class="page-header">
                    <h1>Your Profile</h1>
                    <p>Manage your account settings and preferences</p>
                </div>

                <div class="profile-content">
                    <div class="profile-card">
                        <h2>Personal Information</h2>
                        <form id="profile-form" class="profile-form">
                            <div class="form-group">
                                <label for="profile-name">Full Name</label>
                                <input type="text" id="profile-name" class="form-control" 
                                       value="${user.name}" required>
                            </div>
                            <div class="form-group">
                                <label for="profile-email">Email Address</label>
                                <input type="email" id="profile-email" class="form-control" 
                                       value="${user.email}" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Update Profile</button>
                        </form>
                    </div>

                    <div class="profile-card">
                        <h2>Change Password</h2>
                        <form id="password-form" class="profile-form">
                            <div class="form-group">
                                <label for="current-password">Current Password</label>
                                <input type="password" id="current-password" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="new-password">New Password</label>
                                <input type="password" id="new-password" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label for="confirm-password">Confirm New Password</label>
                                <input type="password" id="confirm-password" class="form-control" required>
                            </div>
                            <button type="submit" class="btn btn-primary">Change Password</button>
                        </form>
                    </div>

                    <div class="profile-card">
                        <h2>Account Statistics</h2>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <i class="fas fa-clipboard-list"></i>
                                <span class="stat-number">0</span>
                                <span class="stat-label">Assessments Taken</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-trophy"></i>
                                <span class="stat-number">0%</span>
                                <span class="stat-label">Average Score</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-clock"></i>
                                <span class="stat-number">0h</span>
                                <span class="stat-label">Total Time</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
        this.addEventListeners();
        this.loadUserStats();
    },

    addEventListeners() {
        const profileForm = document.getElementById('profile-form');
        const passwordForm = document.getElementById('password-form');

        profileForm.addEventListener('submit', this.handleProfileUpdate.bind(this));
        passwordForm.addEventListener('submit', this.handlePasswordChange.bind(this));
    },

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const name = document.getElementById('profile-name').value;
        const email = document.getElementById('profile-email').value;

        if (!name.trim()) {
            utils.showNotification('Please enter your name', 'error');
            return;
        }

        if (!utils.validateEmail(email)) {
            utils.showNotification('Please enter a valid email address', 'error');
            return;
        }

        try {
            await auth.updateProfile({ name, email });
        } catch (error) {
            console.error('Profile update failed:', error);
        }
    },

    async handlePasswordChange(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!currentPassword) {
            utils.showNotification('Please enter your current password', 'error');
            return;
        }

        if (!utils.validatePassword(newPassword)) {
            utils.showNotification('New password must be at least 6 characters long', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            utils.showNotification('New passwords do not match', 'error');
            return;
        }

        try {
            await auth.changePassword(currentPassword, newPassword);
            document.getElementById('password-form').reset();
        } catch (error) {
            console.error('Password change failed:', error);
        }
    },

    async loadUserStats() {
        try {
            const resultsResponse = await api.get('/results/my-results');
            if (resultsResponse.success) {
                const results = resultsResponse.data.results;
                this.updateStats(results);
            }
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    },

    updateStats(results) {
        if (results.length === 0) return;

        const totalAssessments = results.length;
        const totalScore = results.reduce((sum, result) => sum + result.score, 0);
        const totalQuestions = results.reduce((sum, result) => sum + result.total_questions, 0);
        const totalTime = results.reduce((sum, result) => sum + (result.time_taken || 0), 0);

        const averageScore = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
        const totalHours = Math.round(totalTime / 3600);

        document.querySelector('.stat-item:nth-child(1) .stat-number').textContent = totalAssessments;
        document.querySelector('.stat-item:nth-child(2) .stat-number').textContent = `${averageScore}%`;
        document.querySelector('.stat-item:nth-child(3) .stat-number').textContent = `${totalHours}h`;
    }
};