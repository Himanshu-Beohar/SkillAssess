// Results page - Modern All Results View
const resultsPage = {
    results: [],
    filters: {
        sortBy: 'newest',
        status: 'all'
    },

    async load(data) {
        try {
            utils.showLoading('Loading your results...');
            await this.loadResults();
        } catch (error) {
            console.error('Error loading results:', error);
            this.showError();
        }
    },

    async loadResults() {
        try {
            const response = await api.get('/results/my-results');
            
            if (response.success && response.data.results.length > 0) {
                this.results = response.data.results;
                this.renderModernResults();
            } else {
                this.showEmptyState();
            }
        } catch (error) {
            console.error('Error fetching results:', error);
            utils.showNotification('Failed to load results', 'error');
            this.showError();
        } finally {
            utils.hideLoading();
        }
    },

    renderModernResults() {
        const filteredResults = this.filterResults();
        const html = `
            <div class="modern-results-container">
                <!-- Modern Header -->
                <div class="modern-results-header">
                    <div class="header-main">
                        <div class="header-text">
                            <h1 class="header-title">Assessment History</h1>
                            <p class="header-subtitle">Track your learning journey and performance metrics</p>
                        </div>
                        <div class="header-stats-grid">
                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-clipboard-list"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-value">${this.results.length}</span>
                                    <span class="stat-label">Total Attempts</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-trophy"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-value">${this.calculateAverageScore()}%</span>
                                    <span class="stat-label">Avg. Score</span>
                                </div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-icon">
                                    <i class="fas fa-chart-line"></i>
                                </div>
                                <div class="stat-content">
                                    <span class="stat-value">${this.calculateSuccessRate()}%</span>
                                    <span class="stat-label">Success Rate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="header-achievement">
                        <div class="achievement-badge">
                            <i class="fas fa-star"></i>
                            <span>${this.getPerformanceLevel()}</span>
                        </div>
                    </div>
                </div>

                <!-- Rest of your content remains the same -->
                <div class="results-filters">
                <!-- ... filters code ... -->
                </div>
            </div>

                <!-- Filters -->
                <div class="results-filters">
                    <div class="filter-group">
                        <label>Sort by:</label>
                        <select class="filter-select" id="sort-filter">
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Score</option>
                            <option value="lowest">Lowest Score</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Status:</label>
                        <select class="filter-select" id="status-filter">
                            <option value="all">All Results</option>
                            <option value="passed">Passed Only</option>
                            <option value="failed">Failed Only</option>
                        </select>
                    </div>
                    <button class="btn btn-outline" onclick="resultsPage.applyFilters()">
                        <i class="fas fa-filter"></i> Apply Filters
                    </button>
                </div>

                <!-- Results Grid -->
                <div class="results-grid">
                    ${filteredResults.map(result => this.renderResultCard(result)).join('')}
                </div>

                <!-- Pagination (if needed) -->
                ${this.results.length > 10 ? `
                <div class="pagination">
                    <button class="pagination-btn" disabled>Previous</button>
                    <span class="pagination-info">Page 1 of 1</span>
                    <button class="pagination-btn" disabled>Next</button>
                </div>
                ` : ''}
            </div>
        `;

        document.getElementById('page-content').innerHTML = html;
        this.addEventListeners();
    },

    renderResultCard(result) {
        const percentage = Math.round((result.score / result.total_questions) * 100);
        const passed = percentage >= 60;
        const scoreClass = passed ? 'excellent' : (percentage >= 40 ? 'average' : 'poor');
        const timeTaken = result.time_taken ? this.formatTime(result.time_taken) : 'N/A';

        return `
            <div class="result-card ${passed ? 'passed' : 'failed'}" onclick="resultsPage.viewResult(${result.id})">
                <div class="card-header">
                    <h3 class="assessment-title">${result.assessment_title}</h3>
                    <div class="status-badge ${passed ? 'passed' : 'failed'}">
                        ${passed ? 'Passed' : 'Failed'}
                    </div>
                </div>
                
                <div class="card-content">
                    <div class="score-display">
                        <div class="circular-progress ${scoreClass}" style="--percentage: ${percentage}%">
                            <span class="score-value">${percentage}%</span>
                        </div>
                    </div>
                    
                    <div class="result-details">
                        <div class="detail-item">
                            <i class="fas fa-check-circle"></i>
                            <span>${result.score}/${result.total_questions} Correct</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-clock"></i>
                            <span>${timeTaken}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${new Date(result.completed_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div class="card-actions">
                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); resultsPage.viewResult(${result.id})">
                        View Details
                    </button>
                    ${passed ? `
                    <button class="btn btn-sm certificate-btn" onclick="event.stopPropagation(); resultsPage.downloadCertificate(${result.id})">
                        <i class="fas fa-download"></i> Certificate
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Add these methods to your resultsPage object
    calculateSuccessRate() {
        if (this.results.length === 0) return 0;
        const passedCount = this.results.filter(result => {
            const percentage = Math.round((result.score / result.total_questions) * 100);
            return percentage >= 60;
        }).length;
        return Math.round((passedCount / this.results.length) * 100);
    },

    getPerformanceLevel() {
        const successRate = this.calculateSuccessRate();
        if (successRate >= 80) return 'Expert Level';
        if (successRate >= 60) return 'Advanced';
        if (successRate >= 40) return 'Intermediate';
        return 'Beginner';
    },

    filterResults() {
        let filtered = [...this.results];

        // Status filter
        if (this.filters.status === 'passed') {
            filtered = filtered.filter(result => {
                const percentage = Math.round((result.score / result.total_questions) * 100);
                return percentage >= 60;
            });
        } else if (this.filters.status === 'failed') {
            filtered = filtered.filter(result => {
                const percentage = Math.round((result.score / result.total_questions) * 100);
                return percentage < 60;
            });
        }

        // Sort filter
        switch (this.filters.sortBy) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
                break;
            case 'highest':
                filtered.sort((a, b) => (b.score / b.total_questions) - (a.score / a.total_questions));
                break;
            case 'lowest':
                filtered.sort((a, b) => (a.score / a.total_questions) - (b.score / b.total_questions));
                break;
        }

        return filtered;
    },

    calculateAverageScore() {
        if (!this.results || this.results.length === 0) return 0;
        
        const validResults = this.results.filter(result => 
            result && 
            typeof result.score === 'number' && 
            typeof result.total_questions === 'number' && 
            result.total_questions > 0
        );
        
        if (validResults.length === 0) return 0;
        
        const totalPercentage = validResults.reduce((sum, result) => {
            return sum + (result.score / result.total_questions) * 100;
        }, 0);
        
        return Math.round(totalPercentage / validResults.length);
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    },

    addEventListeners() {
        // Filter change listeners
        document.getElementById('sort-filter').value = this.filters.sortBy;
        document.getElementById('status-filter').value = this.filters.status;

        document.getElementById('sort-filter').addEventListener('change', (e) => {
            this.filters.sortBy = e.target.value;
        });

        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filters.status = e.target.value;
        });
    },

    applyFilters() {
        this.renderModernResults();
    },

    async viewResult(resultId) {
        try {
            console.log('Viewing result:', resultId);
            
            // Show loading state
            utils.showLoading('Loading result details...');
            
            // Navigate to single result page
            await router.navigateTo(`/result/${resultId}`);
            
        } catch (error) {
            console.error('Error navigating to result:', error);
            utils.showNotification('Failed to load result details', 'error');
        }
    },

    downloadCertificate(resultId) {
        utils.showNotification('Certificate download will be available soon!', 'info');
    },

    showEmptyState() {
        const html = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h2>No Results Yet</h2>
                <p>You haven't taken any assessments yet. Start your learning journey today!</p>
                <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
                    Browse Assessments
                </button>
            </div>
        `;
        document.getElementById('page-content').innerHTML = html;
    },

    showError() {
        const html = `
            <div class="error-state">
                <div class="error-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h2>Something went wrong</h2>
                <p>We couldn't load your results. Please try again later.</p>
                <button class="btn btn-primary" onclick="resultsPage.loadResults()">
                    Try Again
                </button>
            </div>
        `;
        document.getElementById('page-content').innerHTML = html;
    }
};