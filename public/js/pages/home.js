// // Home page
// const homePage = {
//     async load() {
//         const user = auth.getCurrentUser();
//         const assessments = await this.loadFeaturedAssessments();
        
//         const html = `
//             <div class="page-container">
//                 <div class="hero-section">
//                     <div class="hero-content">
//                         <h1>Test Your Skills, Advance Your Career</h1>
//                         <p>Discover your strengths and areas for improvement with our comprehensive assessment platform.</p>
//                         <div class="hero-actions">
//                             <a href="${config.ROUTES.ASSESSMENTS}" class="btn btn-accent btn-large">Browse Assessments</a>
//                             ${!user ? `<a href="${config.ROUTES.REGISTER}" class="btn btn-outline btn-large">Get Started</a>` : ''}
//                         </div>
//                     </div>
//                     <div class="hero-image">
//                         <i class="fas fa-graduation-cap"></i>
//                     </div>
//                 </div>

//                 <section class="features-section">
//                     <h2>Why Choose SkillAssess?</h2>
//                     <div class="features-grid">
//                         <div class="feature-card">
//                             <i class="fas fa-check-circle"></i>
//                             <h3>Wide Range of Topics</h3>
//                             <p>From programming to design, we cover all essential skills.</p>
//                         </div>
//                         <div class="feature-card">
//                             <i class="fas fa-chart-line"></i>
//                             <h3>Detailed Analytics</h3>
//                             <p>Get comprehensive insights into your performance.</p>
//                         </div>
//                         <div class="feature-card">
//                             <i class="fas fa-lock"></i>
//                             <h3>Secure Platform</h3>
//                             <p>Your data is protected with enterprise-grade security.</p>
//                         </div>
//                     </div>
//                 </section>

//                 ${assessments.length > 0 ? `
//                 <section class="featured-assessments">
//                     <h2>Featured Assessments</h2>
//                     <div class="assessments-grid">
//                         ${assessments.slice(0, 3).map(assessment => `
//                             <div class="assessment-card">
//                                 <div class="assessment-image">
//                                     <i class="fas ${assessment.is_premium ? 'fa-crown' : 'fa-book'}"></i>
//                                 </div>
//                                 <div class="assessment-content">
//                                     <h3>${assessment.title}</h3>
//                                     <p>${assessment.description || 'Test your knowledge and skills'}</p>
//                                     <div class="assessment-meta">
//                                         <span class="price ${assessment.is_premium ? 'paid' : 'free'}">
//                                             ${assessment.is_premium ? utils.formatCurrency(assessment.price) : 'Free'}
//                                         </span>
//                                         <span class="tag ${assessment.is_premium ? 'tag-paid' : 'tag-free'}">
//                                             ${assessment.is_premium ? 'Premium' : 'Free'}
//                                         </span>
//                                     </div>
//                                     <button class="btn btn-primary btn-full" onclick="router.navigateTo('/assessment/${assessment.id}')">
//                                         ${assessment.is_premium ? 'View Details' : 'Start Now'}
//                                     </button>
//                                 </div>
//                             </div>
//                         `).join('')}
//                     </div>
//                 </section>
//                 ` : ''}

//                 ${user ? `
//                 <section class="recent-results">
//                     <h2>Your Recent Results</h2>
//                     <div class="results-summary">
//                         <p>You haven't taken any assessments yet.</p>
//                         <a href="${config.ROUTES.ASSESSMENTS}" class="btn btn-primary">Take Your First Assessment</a>
//                     </div>
//                 </section>
//                 ` : ''}
//             </div>
//         `;
        
//         document.getElementById('page-content').innerHTML = html;
//     },

//     async loadFeaturedAssessments() {
//         try {
//             const response = await api.get('/assessments');
//             return response.data.assessments || [];
//         } catch (error) {
//             console.error('Error loading assessments:', error);
//             return [];
//         }
//     }
// };


// Home page
const homePage = {
    async load() {
        const user = auth.getCurrentUser();
        const assessments = await this.loadFeaturedAssessments();
        
        const html = `
            <div class="page-container">
                <div class="hero-section">
                    <div class="hero-content">
                        <h1>Test Your Skills, Advance Your Career</h1>
                        <p>Discover your strengths and areas for improvement with our comprehensive assessment platform.</p>
                        <div class="hero-actions">
                            <a href="${config.ROUTES.ASSESSMENTS}" class="btn btn-accent btn-large">Browse Assessments</a>
                            ${!user ? `<a href="${config.ROUTES.REGISTER}" class="btn btn-outline btn-large">Get Started</a>` : ''}
                        </div>
                    </div>
                    <div class="hero-image">
                        <i class="fas fa-graduation-cap"></i>
                    </div>
                </div>

                <section class="features-section">
                    <h2>Why Choose SkillAssess?</h2>
                    <div class="features-grid">
                        <div class="feature-card">
                            <i class="fas fa-check-circle"></i>
                            <h3>Wide Range of Topics</h3>
                            <p>From programming to design, we cover all essential skills.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-chart-line"></i>
                            <h3>Detailed Analytics</h3>
                            <p>Get comprehensive insights into your performance.</p>
                        </div>
                        <div class="feature-card">
                            <i class="fas fa-lock"></i>
                            <h3>Secure Platform</h3>
                            <p>Your data is protected with enterprise-grade security.</p>
                        </div>
                    </div>
                </section>

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

        // 🔹 Load recent results dynamically
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

    // async loadRecentResults() {
    //     const container = document.getElementById('recent-results-container');
    //     if (!container) return;

    //     try {
    //         const response = await api.get('/results/my-results?limit=1');
    //         if (response.success && response.data.results.length > 0) {
    //             container.innerHTML = response.data.results.map(result => `
    //                 <div class="result-card" onclick="router.navigateTo('/results/${result.id}')">
    //                     <h3>${result.assessment_title}</h3>
    //                     <p><strong>Score:</strong> ${result.score}/${result.total_questions} 
    //                         (${Math.round((result.score / result.total_questions) * 100)}%)</p>
    //                     <p><strong>Date:</strong> ${utils.formatDate(result.completed_at)}</p>
    //                 </div>
    //             `).join('');
    //         } else {
    //             container.innerHTML = `
    //                 <p>You haven't taken any assessments yet.</p>
    //                 <a href="${config.ROUTES.ASSESSMENTS}" class="btn btn-primary">Take Your First Assessment</a>
    //             `;
    //         }
    //     } catch (error) {
    //         console.error("Error loading recent results:", error);
    //         container.innerHTML = `<p class="error">Failed to load results. Please try again later.</p>`;
    //     }
    // }

    async loadRecentResults() {
        const container = document.getElementById('recent-results-container');
        if (!container) return;

        try {
            const response = await api.get('/results/my-results?limit=1'); // 🔹 fetch only the latest
            if (response.success && response.data.results.length > 0) {
                const result = response.data.results[0]; // take the first one only
                // container.innerHTML = `
                //     <div class="result-card" onclick="router.navigateTo('/results/${result.id}')">
                //         <h3>${result.assessment_title}</h3>
                //         <p><strong>Score:</strong> ${result.score}/${result.total_questions} 
                //             (${Math.round((result.score / result.total_questions) * 100)}%)
                //         </p>
                //         <p><strong>Date:</strong> ${utils.formatDate(result.completed_at)}</p>
                //     </div>
                // `;

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
