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
        const passed = percentage >= 60;
        const scoreClass = passed ? 'excellent' : (percentage >= 40 ? 'average' : 'poor');
        const incorrect = this.currentResult.total_questions - this.currentResult.score;
        const skipped = this.detailedResults.filter(q => q.selected_answer === null).length;

        const html = `
            <div class="modern-result-container">

                <!-- 🏆 Header -->
                <div class="result-hero ${passed ? 'passed' : 'failed'}">
                    <div class="hero-icon">
                        ${passed ? '<i class="fas fa-trophy"></i>' : '<i class="fas fa-redo-alt"></i>'}
                    </div>
                    <h1>${passed ? 'Congratulations!' : 'Better Luck Next Time'}</h1>
                    <p class="hero-subtitle">${passed ? 'You passed the assessment 🎉' : 'Keep practicing and improving 💪'}</p>
                </div>

                <!-- 📊 Circular Score -->
                <div class="circular-progress ${scoreClass}" data-percentage="${percentage}">
                    <div class="progress-circle"></div>
                    <span class="progress-value">${percentage}%</span>
                </div>

                <!-- 📈 Performance Summary -->
                <div class="score-details">
                    <h2>Performance Summary</h2>
                    <div class="score-stats">
                        <div class="stat"><span class="stat-number">${this.currentResult.score}/${this.currentResult.total_questions}</span><span class="stat-label">Correct Answers</span></div>
                        <div class="stat"><span class="stat-number">${percentage}%</span><span class="stat-label">Score</span></div>
                        <div class="stat"><span class="stat-number">${this.formatTime(this.currentResult.time_taken)}</span><span class="stat-label">Time Taken</span></div>
                    </div>
                </div>

                <!-- 📊 Detailed Performance Breakdown -->
                <div class="performance-breakdown">
                    <h2>📊 Detailed Performance</h2>
                    <div class="breakdown-grid">
                        <div class="breakdown-item total"><strong>${this.currentResult.total_questions}</strong><span>Total<br>Questions</span></div>
                        <div class="breakdown-item correct"><strong>${this.currentResult.score}</strong><span>Correct</span></div>
                        <div class="breakdown-item incorrect"><strong>${incorrect}</strong><span>Incorrect</span></div>
                        <div class="breakdown-item skipped"><strong>${skipped}</strong><span>Skipped</span></div>
                    </div>
                    <p class="analysis-text">${passed ? '🎉 Great job! You passed this assessment.' : '💪 Keep practicing! Continue your learning journey.'}</p>
                </div>

                ${passed ? `
                <!-- 🏅 Certificate -->
                <div class="certificate-notification">
                    <i class="fas fa-award"></i>
                    <div class="certificate-content">
                        <h3>Certificate Generated!</h3>
                        <p>Your certificate will be emailed to <strong>${this.user.email}</strong> shortly.</p>
                    </div>
                </div>
                ` : ''}

                <!-- 📚 Question Analysis -->
                <div class="detailed-section">
                    <h3>Question Analysis</h3>
                    <div class="questions-grid">
                        ${this.detailedResults.map((result, index) => `
                            <div class="question-card ${result.is_correct ? 'correct' : 'incorrect'}">
                                <div class="question-header">
                                    <span class="question-number">Q${index + 1}</span>
                                    <span class="status-icon">${result.is_correct ? '✅' : '❌'}</span>
                                </div>
                                <p class="question-text">${result.question_text}</p>
                                <div class="answer-comparison">
                                    <div class="answer your-answer">
                                        <label>Your Answer:</label>
                                        <span>${result.options[result.selected_answer] || 'Not answered'}</span>
                                    </div>
                                    ${!result.is_correct ? `
                                    <div class="answer correct-answer">
                                        <label>Correct Answer:</label>
                                        <span>${result.options[result.correct_answer]}</span>
                                    </div>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- ✅ Recommended Next Steps -->
                <div class="next-steps">
                    <h2>🚀 Next Steps</h2>
                    <ul>
                        <li>Review incorrect answers to understand where you went wrong.</li>
                        <li>Focus on skipped questions — they often indicate weaker areas.</li>
                        <li>Attempt similar assessments to build confidence.</li>
                        <li>Revisit topics where your accuracy is below 70%.</li>
                    </ul>
                </div>

                <!-- 📤 Actions -->
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')"><i class="fas fa-graduation-cap"></i> Take Another Assessment</button>
                    <button class="btn btn-outline" onclick="router.navigateTo('${config.ROUTES.RESULTS}')"><i class="fas fa-history"></i> View All Results</button>
                    ${passed ? `<button class="btn btn-accent" onclick="assessmentResultPage.downloadCertificate()"><i class="fas fa-download"></i> Download Certificate</button>` : ''}
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

    async downloadCertificate() {
        try {
            if (!this.currentResult?.id) {
                utils.showNotification('Invalid result', 'error');
                return;
            }

            utils.showLoading('Downloading certificate...');
            
            const baseUrl = config.API_BASE_URL.replace('/api', '');
            const certUrl = `${baseUrl}/api/results/${this.currentResult.id}/certificate`;
            const token = auth.getToken();

            const response = await fetch(certUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Download failed');
            
            // const blob = await response.blob();
            // const url = URL.createObjectURL(blob);
            // const link = document.createElement('a');
            // link.href = url;
            // link.download = `certificate_${this.currentResult.id}.pdf`;
            // link.click();

            const disposition = response.headers.get('Content-Disposition');
            let filename = `certificate_${this.currentResult.id}.pdf`;

            // ✅ Extract filename from backend header if available
            if (disposition && disposition.includes('filename')) {
            const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
            if (match && match[1]) filename = decodeURIComponent(match[1].replace(/['"]/g, '').trim());
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 100);

            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            utils.hideLoading();
            utils.showNotification('Certificate downloaded!', 'success');
            
        } catch (error) {
            utils.hideLoading();
            utils.showNotification('Download failed', 'error');
            console.error('Download error:', error);
        }
    }

};