// Single assessment result page (modern design)
const assessmentResultPage = {
    currentResult: null,
    detailedResults: null,
    assessment: null,
    user: null,

    async load(data) {
        if (data && data.result) {
            this.currentResult = data.result;
            this.detailedResults = data.detailedResults;
            this.user = auth.getCurrentUser();
            await this.renderModernResult();
        } else {
            utils.showNotification('No result data available', 'error');
            router.navigateTo(config.ROUTES.ASSESSMENTS);
        }
    },

    async renderModernResult() {
        const percentage = Math.round((this.currentResult.score / this.currentResult.total_questions) * 100);
        const passed = percentage >= 60; // 60% passing threshold
        const scoreClass = passed ? 'excellent' : (percentage >= 40 ? 'average' : 'poor');

        const html = `
            <div class="modern-result-container">
                <!-- Header Section -->
                <div class="result-hero ${passed ? 'passed' : 'failed'}">
                    <div class="hero-icon">
                        ${passed ? '<i class="fas fa-trophy"></i>' : '<i class="fas fa-redo-alt"></i>'}
                    </div>
                    <h1>${passed ? 'Congratulations!' : 'Better Luck Next Time'}</h1>
                    <p class="hero-subtitle">${passed ? 'You have passed the assessment' : 'Keep practicing to improve your skills'}</p>
                </div>

                <!-- Score Summary -->
                <div class="circular-progress ${scoreClass}" data-percentage="${percentage}">
                    <div class="progress-circle"></div>
                    <span class="progress-value">${percentage}%</span>
                </div>
                    
                    <div class="score-details">
                        <h2>Performance Summary</h2>
                        <div class="score-stats">
                            <div class="stat">
                                <span class="stat-number">${this.currentResult.score}/${this.currentResult.total_questions}</span>
                                <span class="stat-label">Correct Answers</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${Math.round((this.currentResult.score / this.currentResult.total_questions) * 100)}%</span>
                                <span class="stat-label">Score</span>
                            </div>
                            <div class="stat">
                                <span class="stat-number">${this.formatTime(this.currentResult.time_taken)}</span>
                                <span class="stat-label">Time Taken</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${passed ? `
                <!-- Certificate Notification -->
                <div class="certificate-notification">
                    <i class="fas fa-award"></i>
                    <div class="certificate-content">
                        <h3>Certificate Generated!</h3>
                        <p>Your digital certificate will be emailed to ${this.user.email} shortly</p>
                    </div>
                </div>
                ` : ''}

                <!-- Detailed Results -->
                <div class="detailed-section">
                    <h3>Question Analysis</h3>
                    <div class="questions-grid">
                        ${this.detailedResults.map((result, index) => `
                            <div class="question-card ${result.is_correct ? 'correct' : 'incorrect'}">
                                <div class="question-header">
                                    <span class="question-number">Q${index + 1}</span>
                                    <span class="status-icon">${result.is_correct ? '✓' : '✗'}</span>
                                </div>
                                <p class="question-text">${result.question_text}</p>
                                <div class="answer-comparison">
                                    <div class="answer your-answer">
                                        <label>Your Answer:</label>
                                        <span>${result.options[result.selected_answer]}</span>
                                    </div>
                                    ${!result.is_correct ? `
                                    <div class="answer correct-answer">
                                        <label>Correct Answer:</label>
                                        <span>${result.options[result.correct_answer]}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
                        <i class="fas fa-graduation-cap"></i> Take Another Assessment
                    </button>
                    <button class="btn btn-outline" onclick="router.navigateTo('${config.ROUTES.RESULTS}')">
                        <i class="fas fa-history"></i> View All Results
                    </button>
                    ${passed ? `
                    <button class="btn btn-accent" onclick="assessmentResultPage.downloadCertificate()">
                        <i class="fas fa-download"></i> Download Certificate
                    </button>
                    ` : ''}
                </div>

                <!-- User Details -->
                <div class="user-details-card">
                    <h4>Assessment Details</h4>
                    <div class="user-info">
                        <div class="info-item">
                            <label>Name:</label>
                            <span>${this.user.name}</span>
                        </div>
                        <div class="info-item">
                            <label>Email:</label>
                            <span>${this.user.email}</span>
                        </div>
                        <div class="info-item">
                            <label>Date Completed:</label>
                            <span>${new Date(this.currentResult.completed_at).toLocaleDateString()}</span>
                        </div>
                        <div class="info-item">
                            <label>Status:</label>
                            <span class="status-badge ${passed ? 'passed' : 'failed'}">${passed ? 'Passed' : 'Failed'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
        this.animateProgressCircle();
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    },

    animateProgressCircle() {
        const circles = document.querySelectorAll('.progress-circle');
        circles.forEach(circle => {
            const percentage = circle.parentElement.getAttribute('data-percentage');
            circle.style.background = `conic-gradient(
                var(--primary) ${percentage}%,
                var(--light-gray) ${percentage}% 100%
            )`;
        });
    },

    downloadCertificate() {
        utils.showNotification('Certificate download will be available soon!\nYou will receive your certificate through email shortly.', 'info');
    }
};