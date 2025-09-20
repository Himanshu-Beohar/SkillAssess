// // Single result page (for viewing individual results from history)
// const singleResultPage = {
//     async load(data) {
//         try {
//             utils.showLoading('Loading result...');
            
//             // Get result ID from URL parameters or data
//             const resultId = data?.id || router.getRouteParams().id;
            
//             if (!resultId) {
//                 throw new Error('Result ID not specified');
//             }
            
//             // Fetch result details from API
//             const response = await api.get(`/results/${resultId}`);
            
//             if (response.success) {
//                 this.renderResult(response.data.result);
//             } else {
//                 throw new Error(response.error || 'Failed to load result');
//             }
//         } catch (error) {
//             console.error('Error loading result:', error);
//             utils.showNotification(error.message, 'error');
//             router.navigateTo(config.ROUTES.RESULTS);
//         } finally {
//             utils.hideLoading();
//         }
//     },
    
//     renderResult(result) {
//         const percentage = Math.round((result.score / result.total_questions) * 100);
//         const passed = percentage >= 60;
        
//         const html = `
//             <div class="page-container">
//                 <div class="modern-result-container">
//                     <div class="result-hero ${passed ? 'passed' : 'failed'}">
//                         <h1>${result.assessment_title || 'Assessment Result'}</h1>
//                         <p>Completed on ${new Date(result.completed_at).toLocaleDateString()}</p>
//                     </div>
                    
//                     <div class="score-summary">
//                         <div class="score-display">
//                             <div class="score-percentage">${percentage}%</div>
//                             <div class="score-text">${passed ? 'Passed' : 'Failed'}</div>
//                         </div>
                        
//                         <div class="score-details">
//                             <p><strong>Score:</strong> ${result.score}/${result.total_questions}</p>
//                             <p><strong>Time Taken:</strong> ${this.formatTime(result.time_taken)}</p>
//                         </div>
//                     </div>
                    
//                     <div class="action-buttons">
//                         <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.RESULTS}')">
//                             Back to All Results
//                         </button>
//                     </div>
//                 </div>
//             </div>
//         `;
        
//         document.getElementById('page-content').innerHTML = html;
//     },
    
//     formatTime(seconds) {
//         if (!seconds) return 'N/A';
//         const mins = Math.floor(seconds / 60);
//         const secs = seconds % 60;
//         return `${mins}m ${secs}s`;
//     }
// };


// Single result page (for viewing individual results from history)
const singleResultPage = {
    result: null,
    detailedResults: [],

    async load(data) {
        try {
            utils.showLoading('Loading result details...');
            
            // Get result ID from URL parameters or data
            const resultId = data?.id || router.getRouteParams().id;
            
            console.log('Loading result ID:', resultId);
            
            if (!resultId) {
                throw new Error('Result ID not specified');
            }
            
            // Fetch result details from API
            const response = await api.get(`/results/${resultId}`);
            
            if (response.success) {
                this.result = response.data.result;
                this.detailedResults = response.data.detailed_results || [];
                this.renderResult();
            } else {
                throw new Error(response.error || 'Failed to load result');
            }
        } catch (error) {
            console.error('Error loading result:', error);
            utils.showNotification(error.message, 'error');
            
            // Show error state
            this.showErrorState(error.message);
        } finally {
            utils.hideLoading();
        }
    },
    
    renderResult() {
        if (!this.result) {
            this.showErrorState('No result data available');
            return;
        }
        
        const percentage = Math.round((this.result.score / this.result.total_questions) * 100);
        const passed = percentage >= 60;
        
        const html = `
            <div class="modern-result-container">
                <div class="result-hero ${passed ? 'passed' : 'failed'}">
                    <h1>${this.result.assessment_title || 'Assessment Result'}</h1>
                    <p>Completed on ${new Date(this.result.completed_at).toLocaleDateString()}</p>
                </div>
                
                <div class="score-summary">
                    <div class="score-display">
                        <div class="score-percentage">${percentage}%</div>
                        <div class="score-text">${passed ? 'Passed' : 'Failed'}</div>
                    </div>
                    
                    <div class="score-details">
                        <p><strong>Score:</strong> ${this.result.score}/${this.result.total_questions}</p>
                        <p><strong>Time Taken:</strong> ${this.formatTime(this.result.time_taken)}</p>
                        <p><strong>Date:</strong> ${new Date(this.result.completed_at).toLocaleDateString()}</p>
                    </div>
                </div>

                ${this.detailedResults.length > 0 ? this.renderDetailedResults() : ''}
                
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.RESULTS}')">
                        <i class="fas fa-arrow-left"></i> Back to All Results
                    </button>
                    <button class="btn btn-outline" onclick="window.print()">
                        <i class="fas fa-print"></i> Print Result
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
    },

    renderDetailedResults() {
        return `
            <div class="detailed-section">
                <h3>Question-wise Analysis</h3>
                <div class="questions-grid">
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
                                <div class="answer your-answer">
                                    <label>Your Answer:</label>
                                    <span>${result.options[result.selected_answer] || 'Not answered'}</span>
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
        `;
    },

    showErrorState(errorMessage) {
        const html = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Unable to Load Result</h2>
                <p>${errorMessage || 'The requested result could not be found.'}</p>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.RESULTS}')">
                        Back to Results
                    </button>
                    <button class="btn btn-outline" onclick="singleResultPage.load()">
                        Try Again
                    </button>
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