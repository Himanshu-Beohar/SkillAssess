// Results page
const resultsPage = {
    currentResult: null,
    detailedResults: null,
    assessment: null,

    async load(data) {
        if (data && data.result) {
            // Coming from assessment submission
            this.currentResult = data.result;
            this.detailedResults = data.detailedResults;
            this.showResults();
        } else {
            // Load from API
            await this.loadResults();
        }
    },

    async loadResults() {
        try {
            utils.showLoading('Loading results...');
            const response = await api.get('/results/my-results');
            
            if (response.success && response.data.results.length > 0) {
                // Show results list
                this.showResultsList(response.data.results);
            } else {
                this.showNoResults();
            }
        } catch (error) {
            console.error('Error loading results:', error);
            utils.showNotification(error.message, 'error');
            this.showNoResults();
        } finally {
            utils.hideLoading();
        }
    },

    showResultsList(results) {
        const html = `
            <div class="page-container">
                <div class="page-header">
                    <h1>Your Assessment Results</h1>
                    <p>View your performance across all assessments</p>
                </div>

                <div class="results-list">
                    ${results.map(result => `
                        <div class="result-item" onclick="resultsPage.viewResult(${result.id})">
                            <div class="result-header">
                                <h3>${result.assessment_title}</h3>
                                <span class="score-badge ${this.getScoreClass(result.score, result.total_questions)}">
                                    ${Math.round((result.score / result.total_questions) * 100)}%
                                </span>
                            </div>
                            <div class="result-details">
                                <p>Score: ${result.score}/${result.total_questions}</p>
                                <p>Time: ${utils.formatTime(result.time_taken)}</p>
                                <p>Date: ${utils.formatDate(result.completed_at)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
    },

    async viewResult(resultId) {
        try {
            utils.showLoading('Loading result details...');
            const response = await api.get(`/results/${resultId}`);
            
            if (response.success) {
                this.currentResult = response.data.result;
                await this.loadAssessmentDetails();
            } else {
                throw new Error(response.error || 'Failed to load result details');
            }
        } catch (error) {
            console.error('Error loading result:', error);
            utils.showNotification(error.message, 'error');
        } finally {
            utils.hideLoading();
        }
    },

    async loadAssessmentDetails() {
        try {
            const response = await api.get(`/assessments/${this.currentResult.assessment_id}`);
            if (response.success) {
                this.assessment = response.data.assessment;
                this.showDetailedResults();
            }
        } catch (error) {
            console.error('Error loading assessment details:', error);
        }
    },

    showDetailedResults() {
        const percentage = Math.round((this.currentResult.score / this.currentResult.total_questions) * 100);
        
        const html = `
            <div class="page-container">
                <div class="result-header">
                    <h1>Assessment Results</h1>
                    <h2>${this.assessment?.title || 'Assessment'}</h2>
                </div>

                <div class="result-summary">
                    <div class="score-circle ${this.getScoreClass(this.currentResult.score, this.currentResult.total_questions)}">
                        <span class="score-percentage">${percentage}%</span>
                    </div>
                    <div class="result-stats">
                        <p><strong>Score:</strong> ${this.currentResult.score}/${this.currentResult.total_questions}</p>
                        <p><strong>Time Taken:</strong> ${utils.formatTime(this.currentResult.time_taken)}</p>
                        <p><strong>Date Completed:</strong> ${utils.formatDate(this.currentResult.completed_at)}</p>
                    </div>
                </div>

                ${this.detailedResults ? this.renderQuestionResults() : ''}

                <div class="result-actions">
                    <button class="btn btn-primary" onclick="router.navigateTo(config.ROUTES.ASSESSMENTS)">
                        Take Another Assessment
                    </button>
                    <button class="btn btn-outline" onclick="resultsPage.loadResults()">
                        Back to Results List
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
    },

    renderQuestionResults() {
        return `
            <div class="detailed-results">
                <h3>Question-wise Results</h3>
                ${this.detailedResults.map((result, index) => `
                    <div class="question-result ${result.is_correct ? 'correct' : 'incorrect'}">
                        <div class="question-header">
                            <span class="question-number">Q${index + 1}</span>
                            <span class="result-status">
                                ${result.is_correct ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                        </div>
                        <p class="question-text">${result.question_text}</p>
                        <div class="answer-comparison">
                            <p><strong>Your answer:</strong> ${result.options[result.selected_answer]}</p>
                            ${!result.is_correct ? `
                                <p><strong>Correct answer:</strong> ${result.options[result.correct_answer]}</p>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    getScoreClass(score, total) {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return 'excellent';
        if (percentage >= 60) return 'good';
        if (percentage >= 40) return 'average';
        return 'poor';
    },

    showNoResults() {
        const html = `
            <div class="page-container">
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h2>No Results Yet</h2>
                    <p>You haven't taken any assessments yet. Start your first assessment to see your results here.</p>
                    <button class="btn btn-primary" onclick="router.navigateTo(config.ROUTES.ASSESSMENTS)">
                        Browse Assessments
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
    }
};