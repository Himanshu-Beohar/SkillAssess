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
    
    // renderResult() {
    //     if (!this.result) {
    //         this.showErrorState('No result data available');
    //         return;
    //     }
        
    //     const percentage = Math.round((this.result.score / this.result.total_questions) * 100);
    //     const passed = percentage >= 60;
        
    //     const html = `
    //         <div class="modern-result-container">
    //             <div class="result-hero ${passed ? 'passed' : 'failed'}">
    //                 <h1>${this.result.assessment_title || 'Assessment Result'}</h1>
    //                 <p>Completed on ${new Date(this.result.completed_at).toLocaleDateString()}</p>
    //             </div>
                
    //             <div class="score-summary">
    //                 <div class="score-display">
    //                     <div class="score-percentage">${percentage}%</div>
    //                     <div class="score-text">${passed ? 'Passed' : 'Failed'}</div>
    //                 </div>
                    
    //                 <div class="score-details">
    //                     <p><strong>Score:</strong> ${this.result.score}/${this.result.total_questions}</p>
    //                     <p><strong>Time Taken:</strong> ${this.formatTime(this.result.time_taken)}</p>
    //                     <p><strong>Date:</strong> ${new Date(this.result.completed_at).toLocaleDateString()}</p>
    //                 </div>
    //             </div>

    //             ${this.detailedResults.length > 0 ? this.renderDetailedResults() : ''}
                
    //             <div class="action-buttons">
    //                 <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.RESULTS}')">
    //                     <i class="fas fa-arrow-left"></i> Back to All Results
    //                 </button>
    //                 <button class="btn btn-outline" onclick="window.print()">
    //                     <i class="fas fa-print"></i> Print Result
    //                 </button>
    //             </div>
    //         </div>
    //     `;
        
    //     document.getElementById('page-content').innerHTML = html;
    // },

    renderResult() {
        if (!this.result) {
            this.showErrorState('No result data available');
            return;
        }

        const percentage = Math.round((this.result.score / this.result.total_questions) * 100);
        const passed = percentage >= 60;
        const incorrect = this.result.total_questions - this.result.score;
        const skipped = this.detailedResults.filter(q => q.selected_answer === null).length;

        const html = `
        <div class="result-page expanded-report">
            <!-- 🏆 Hero Section -->
            <div class="result-hero ${passed ? 'passed' : 'failed'}">
            <h1>${this.result.assessment_title}</h1>
            <p class="result-date">Completed on ${new Date(this.result.completed_at).toLocaleDateString()}</p>
            <div class="score-circle">
                <div class="circle-value">${percentage}%</div>
                <div class="circle-status">${passed ? '✅ Passed' : '❌ Failed'}</div>
            </div>
            </div>

            <!-- 📊 Quick Stats -->
            <div class="result-stats-grid">
            <div class="stat-card"><i class="fas fa-star"></i><h4>Score</h4><p>${this.result.score}/${this.result.total_questions}</p></div>
            <div class="stat-card"><i class="fas fa-clock"></i><h4>Time Taken</h4><p>${this.formatTime(this.result.time_taken)}</p></div>
            <div class="stat-card"><i class="fas fa-percentage"></i><h4>Accuracy</h4><p>${percentage}%</p></div>
            <div class="stat-card"><i class="fas fa-calendar"></i><h4>Date</h4><p>${new Date(this.result.completed_at).toLocaleDateString()}</p></div>
            </div>

            <div class="performance-breakdown">
            <h2>📊 Detailed Performance</h2>
            
            <div class="breakdown-grid">
                <div class="breakdown-item total">
                <strong>${this.result.total_questions}</strong>
                <span>Total<br>Questions</span>
                </div>
                <div class="breakdown-item correct">
                <strong>${this.result.score}</strong>
                <span>Correct</span>
                </div>
                <div class="breakdown-item incorrect">
                <strong>${incorrect}</strong>
                <span>Incorrect</span>
                </div>
                <div class="breakdown-item skipped">
                <strong>${skipped}</strong>
                <span>Skipped</span>
                </div>
            </div>

            <p class="analysis-text">
                ${passed ? '🎉 Great job! You passed this assessment.' : '💪 Keep practicing! You’re improving.'}
            </p>
            </div>


            <!-- 📚 Question-wise Analysis -->
            ${this.detailedResults.length > 0 ? this.renderDetailedResults() : ''}

            <!-- 🧭 Next Steps -->
            <div class="next-steps">
            <h2>🚀 Recommended Next Steps</h2>
            <ul>
                <li>Review incorrect questions and understand why the correct answer is right.</li>
                <li>Try similar assessments to reinforce your understanding.</li>
                <li>Revisit topics where your accuracy was below 70%.</li>
                <li>Consider attempting advanced-level assessments next.</li>
            </ul>
            </div>

            <!-- Actions -->
            <div class="action-buttons">
            <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.RESULTS}')"><i class="fas fa-arrow-left"></i> Back to All Results</button>
            <button class="btn btn-outline" onclick="window.print()"><i class="fas fa-print"></i> Print Report</button>
            </div>
        </div>
        `;

        document.getElementById('page-content').innerHTML = html;
    },



    // renderDetailedResults() {
    //     return `
    //         <div class="detailed-section">
    //             <h3>Question-wise Analysis</h3>
    //             <div class="questions-grid">
    //                 ${this.detailedResults.map((result, index) => `
    //                     <div class="question-result ${result.is_correct ? 'correct' : 'incorrect'}">
    //                         <div class="question-header">
    //                             <span class="question-number">Q${index + 1}</span>
    //                             <span class="result-status">
    //                                 ${result.is_correct ? '✓ Correct' : '✗ Incorrect'}
    //                             </span>
    //                         </div>
    //                         <p class="question-text">${result.question_text}</p>
    //                         <div class="answer-comparison">
    //                             <div class="answer your-answer">
    //                                 <label>Your Answer:</label>
    //                                 <span>${result.options[result.selected_answer] || 'Not answered'}</span>
    //                             </div>
    //                             ${!result.is_correct ? `
    //                             <div class="answer correct-answer">
    //                                 <label>Correct Answer:</label>
    //                                 <span>${result.options[result.correct_answer]}</span>
    //                             </div>
    //                             ` : ''}
    //                         </div>
    //                     </div>
    //                 `).join('')}
    //             </div>
    //         </div>
    //     `;
    // },
    renderDetailedResults() {
        return `
        <div class="detailed-section">
            <h2>📊 Question-wise Analysis</h2>
            <div class="questions-list">
            ${this.detailedResults.map((q, index) => `
                <div class="question-card ${q.is_correct ? 'correct' : 'incorrect'}">
                <div class="question-header">
                    <span class="q-number">Q${index + 1}</span>
                    <span class="q-status">${q.is_correct ? '✅ Correct' : '❌ Incorrect'}</span>
                </div>
                <p class="question-text">${q.question_text}</p>
                <div class="answers">
                    <div class="answer"><strong>Your Answer:</strong> ${q.options[q.selected_answer] || 'Not answered'}</div>
                    ${!q.is_correct ? `<div class="answer correct"><strong>Correct Answer:</strong> ${q.options[q.correct_answer]}</div>` : ''}
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