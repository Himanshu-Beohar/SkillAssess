// Single result page (for viewing individual results from history)
const singleResultPage = {
    async load(data) {
        try {
            utils.showLoading('Loading result...');
            
            // Get result ID from URL parameters or data
            const resultId = data?.id || router.getRouteParams().id;
            
            if (!resultId) {
                throw new Error('Result ID not specified');
            }
            
            // Fetch result details from API
            const response = await api.get(`/results/${resultId}`);
            
            if (response.success) {
                this.renderResult(response.data.result);
            } else {
                throw new Error(response.error || 'Failed to load result');
            }
        } catch (error) {
            console.error('Error loading result:', error);
            utils.showNotification(error.message, 'error');
            router.navigateTo(config.ROUTES.RESULTS);
        } finally {
            utils.hideLoading();
        }
    },
    
    renderResult(result) {
        const percentage = Math.round((result.score / result.total_questions) * 100);
        const passed = percentage >= 60;
        
        const html = `
            <div class="page-container">
                <div class="modern-result-container">
                    <div class="result-hero ${passed ? 'passed' : 'failed'}">
                        <h1>${result.assessment_title || 'Assessment Result'}</h1>
                        <p>Completed on ${new Date(result.completed_at).toLocaleDateString()}</p>
                    </div>
                    
                    <div class="score-summary">
                        <div class="score-display">
                            <div class="score-percentage">${percentage}%</div>
                            <div class="score-text">${passed ? 'Passed' : 'Failed'}</div>
                        </div>
                        
                        <div class="score-details">
                            <p><strong>Score:</strong> ${result.score}/${result.total_questions}</p>
                            <p><strong>Time Taken:</strong> ${this.formatTime(result.time_taken)}</p>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.RESULTS}')">
                            Back to All Results
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
    },
    
    formatTime(seconds) {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    }
};