// Home page
const homePage = {
    async load() {
        const user = auth.getCurrentUser();
        const assessments = await this.loadFeaturedAssessments();

        const html = `
            <div class="page-container">
                <!-- Hero Section -->
                <div class="hero-section">
                    <div class="hero-content">
                        <h1>Test Your Skills, Advance Your Career</h1>
                        <p>Skillassess helps you identify your strengths, improve weak areas, and showcase your expertise with badges, certificates, and achievements recognized by <strong>Gyanovation</strong>.</p>
                        <div class="hero-actions">
                            <a href="${config.ROUTES.ASSESSMENTS}" class="btn btn-accent btn-large">Browse Assessments</a>
                            ${!user ? `<a href="${config.ROUTES.REGISTER}" class="btn btn-outline btn-large">Get Started</a>` : ''}
                        </div>
                    </div>
                    <div class="hero-image">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                </div>

                <!-- About Section -->
                <section class="about-section">
                    <h2>About Skillassess</h2>
                    <p>We provide an interactive platform for learners and professionals to practice assessments, track progress, and earn recognition. Whether you’re preparing for interviews, upgrading your career, or simply testing your knowledge, Skillassess empowers you to grow confidently.</p>
                </section>

                <!-- Why Choose -->
                <section class="features-section">
                    <h2>Why Choose Skillassess?</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <i class="fas fa-check-circle"></i>
                            <h3>Wide Range of Topics</h3>
                            <p>From programming to aptitude, design to general knowledge, we cover essential skills for every learner.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-chart-line"></i>
                            <h3>Detailed Analytics</h3>
                            <p>Track your performance with smart analytics and personalized feedback to improve faster.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-lock"></i>
                            <h3>Secure & Reliable</h3>
                            <p>Your progress and data are safe with enterprise-grade security and transparency.</p>
                        </div>
                    </div>
                </section>

                <!-- Winspage Section -->
                <section class="features-section">
                    <h2>Wins Page – Showcase Your Achievements</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <i class="fas fa-award"></i>
                            <h3>Earn Badges</h3>
                            <p>Complete assessments and unlock exclusive badges that highlight your expertise.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-level-up-alt"></i>
                            <h3>Advance Your Level</h3>
                            <p>Climb the leaderboard as you progress, showcasing your growth journey.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-certificate"></i>
                            <h3>Get Recognized</h3>
                            <p>Win certificates and recognition from <strong>Gyanovation</strong> to boost your credibility.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-gift"></i>
                            <h3>Win Prizes</h3>
                            <p>Participate in challenges, earn rewards, and celebrate your achievements with exciting prizes.</p>
                        </div>
                    </div>
                </section>

                <!-- Career Impact Section -->
                <section class="career-impact">
                    <div class="career-impact-container">
                        <div class="career-text">
                        <h2>🚀 Boost Your Career</h2>
                        <p>
                            Skillassess not only helps you <strong>learn and practice</strong> but also ensures 
                            your <strong>achievements get recognized</strong>. By earning badges, certificates, 
                            and recognition from Gyanovation, you can stand out from the crowd.
                        </p>
                        <ul class="career-benefits">
                            <li>
                            <i class="fas fa-id-badge"></i> 
                            Add verified credentials to your&nbsp;<strong>resume</strong>&nbsp;or portfolio.
                            </li>
                            <li>
                            <i class="fas fa-briefcase"></i> 
                            Gain an edge in&nbsp;<strong>job applications</strong>&nbsp;and interviews.
                            </li>
                            <li>
                            <i class="fas fa-graduation-cap"></i> 
                            Demonstrate your commitment to&nbsp;<strong>continuous learning</strong>.
                            </li>
                        </ul>
                        </div>

                        <div class="career-visual">
                        <i class="fas fa-trophy"></i>
                        <p class="visual-caption">Badges • Certificates • Recognition</p>
                        </div>
                    </div>
                    </section>


                <!-- Featured Assessments -->
                ${assessments.length > 0 ? `
                <section class="featured-assessments">
                    <h2>Featured Assessments</h2>
                    <div class="assessments-grid">
                        ${assessments.slice(0, 3).map(assessment => `
                            <div class="assessment-card">
                                <div class="assessment-image">
                                    <i class="fas ${assessment.is_premium ? 'fa-crown' : 'fa-book'}"></i>
                                </div>
                                <div class="assessment-content">
                                    <h3>${assessment.title}</h3>
                                    <p>${assessment.description || 'Test your knowledge and skills'}</p>
                                    <div class="assessment-meta">
                                        <span class="price ${assessment.is_premium ? 'paid' : 'free'}">
                                            ${assessment.is_premium ? utils.formatCurrency(assessment.price) : 'Free'}
                                        </span>
                                        <span class="tag ${assessment.is_premium ? 'tag-paid' : 'tag-free'}">
                                            ${assessment.is_premium ? 'Premium' : 'Free'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
                ` : ''}

                <!-- Recent Results -->
                ${user ? `
                <section class="recent-results">
                    <h2>Your Recent Results</h2>
                    <div class="results-summary" id="recent-results-container">
                        <p>Loading your results...</p>
                    </div>
                </section>
                ` : ''}
            </div>
        `;

        document.getElementById('page-content').innerHTML = html;

        // Load recent results dynamically
        if (user) {
            this.loadRecentResults();
        }
    },

    async loadFeaturedAssessments() {
        try {
            const response = await api.get('/assessments');
            return response.data.assessments || [];
        } catch (error) {
            console.error('Error loading assessments:', error);
            return [];
        }
    },

    async loadRecentResults() {
        const container = document.getElementById('recent-results-container');
        if (!container) return;

        try {
            const response = await api.get('/results/my-results?limit=1');
            if (response.success && response.data.results.length > 0) {
                const result = response.data.results[0];
                
                container.innerHTML = `
                    <div class="result-card" onclick="router.navigateTo('/results/${result.id}')">
                        <div class="result-info">
                            <h3>${result.assessment_title}</h3>
                            <p><strong>Score:</strong> ${result.score}/${result.total_questions}</p>
                            <p><strong>Date:</strong> ${utils.formatDate(result.completed_at)}</p>
                        </div>
                        <div class="score-badge ${this.getScoreClass(result.score, result.total_questions)}">
                            ${Math.round((result.score / result.total_questions) * 100)}%
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <p>You haven't taken any assessments yet.</p>
                    <a href="${config.ROUTES.ASSESSMENTS}" class="btn btn-primary">Take Your First Assessment</a>
                `;
            }
        } catch (error) {
            console.error("Error loading recent results:", error);
            container.innerHTML = `<p class="error">Failed to load results. Please try again later.</p>`;
        }
    },

    getScoreClass(score, total) {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return "score-excellent";
        if (percentage >= 60) return "score-good";
        if (percentage >= 40) return "score-average";
        return "score-poor";
    }
};
