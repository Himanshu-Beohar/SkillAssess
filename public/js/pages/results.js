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
        const { successRate } = this.calculateSuccessRate();
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
                                    <span class="stat-value">${successRate}%</span>
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

    calculateSuccessRate() {
        if (this.results.length === 0) {
            return { successRate: 0, uniqueTotal: 0, uniquePassed: 0, totalPasses: 0, totalAttempts: 0 };
        }

        // Track unique assessments
        const assessmentMap = new Map(); // assessment_id → { attempts, passes }
        this.results.forEach(result => {
            const percentage = Math.round((result.score / result.total_questions) * 100);
            const passed = percentage >= 60;

            if (!assessmentMap.has(result.assessment_id)) {
                assessmentMap.set(result.assessment_id, { attempts: 0, passes: 0 });
            }

            const stats = assessmentMap.get(result.assessment_id);
            stats.attempts += 1;
            if (passed) stats.passes += 1;
            assessmentMap.set(result.assessment_id, stats);
        });

        const uniqueTotal = assessmentMap.size;
        const uniquePassed = Array.from(assessmentMap.values()).filter(stat => stat.passes > 0).length;

        const totalAttempts = Array.from(assessmentMap.values()).reduce((sum, stat) => sum + stat.attempts, 0);
        const totalPasses = Array.from(assessmentMap.values()).reduce((sum, stat) => sum + stat.passes, 0);

        // Coverage: how many unique assessments passed
        const coverage = uniqueTotal > 0 ? uniquePassed / uniqueTotal : 0;

        // Consistency: passes vs attempts
        const consistency = totalAttempts > 0 ? totalPasses / totalAttempts : 0;

        // Final Success Rate
        const successRate = Math.round(coverage * 100 * consistency);

        return { successRate, uniqueTotal, uniquePassed, totalPasses, totalAttempts };
    },


    getPerformanceLevel() {
        const { successRate, uniqueTotal } = this.calculateSuccessRate();

        if (uniqueTotal >= 15 && successRate >= 80) return 'Expert Level';
        if (uniqueTotal >= 10 && successRate >= 60) return 'Advanced';
        if (uniqueTotal >= 5 && successRate >= 40) return 'Intermediate';
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

    async downloadCertificate(resultId) {
        try {
            utils.showLoading('Preparing your certificate...');

            const baseUrl = config.API_BASE_URL.replace('/api', '');
            const certUrl = `${baseUrl}/api/results/${resultId}/certificate`;
            const token = auth.getToken();

            console.log('📄 Downloading certificate from:', certUrl);

            const response = await fetch(certUrl, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}`
            }
            });

            // Check if response is OK
            if (!response.ok) {
            let errorMessage = 'Unable to download certificate.';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch {
                errorMessage = response.statusText || errorMessage;
            }
            
            utils.hideLoading();
            utils.showNotification(errorMessage, 'error');
            return;
            }

            // Check if response is actually a PDF
            const contentType = response.headers.get('content-type');
            console.log('📄 Response Content-Type:', contentType);

            if (!contentType || !contentType.includes('application/pdf')) {
            throw new Error('Server returned an error instead of PDF');
            }

            // Create blob and download
            const blob = await response.blob();
            console.log('📄 Blob size:', blob.size);

            if (blob.size === 0) {
            throw new Error('Downloaded file is empty');
            }

            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `certificate_${resultId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);

            utils.hideLoading();
            utils.showNotification('Certificate downloaded successfully!', 'success');

        } catch (error) {
            console.error('❌ Certificate download error:', error);
            utils.hideLoading();
            utils.showNotification(error.message || 'Failed to download certificate. Please try again.', 'error');
        }
    },


    // Add this to your results.js for debugging
    // Updated debug function
    async debugCertificateDownload(resultId) {
        try {
            console.log('🔍 Debugging certificate download...');
            
            // Use the base URL without /api since routes already include it
            const baseUrl = config.API_BASE_URL.replace('/api', '');
            console.log('🌐 Using base URL:', baseUrl);
            
            // Test routes with correct URLs (no double /api)
            const routes = [
            `${baseUrl}/api/results/${resultId}/certificate`,
            `${baseUrl}/api/results/certificate-file/certificate_2_32_1760010833055.pdf`,
            `${baseUrl}/certificates/certificate_2_32_1760010833055.pdf`
            ];

            for (const route of routes) {
            console.log(`\n🧪 Testing route: ${route}`);
            
            const token = auth.getToken();

            try {
                const response = await fetch(route, {
                method: 'GET',
                headers: route.includes('/api/results/') ? { 
                    'Authorization': `Bearer ${token}`
                } : {}
                });

                console.log(`📊 Response status: ${response.status}`);
                console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
                
                const contentType = response.headers.get('content-type');
                console.log('📄 Content-Type:', contentType);
                
                // Clone response to read as text without consuming it
                const cloneResponse = response.clone();
                const text = await cloneResponse.text();
                
                if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
                console.log('❌ THIS ROUTE IS RETURNING INDEX.HTML');
                console.log('📝 Response content (first 200 chars):', text.substring(0, 200));
                } else if (contentType && contentType.includes('application/pdf')) {
                console.log('✅ THIS ROUTE RETURNS A PDF!');
                const blob = await response.blob();
                console.log('📄 Blob size:', blob.size);
                } else if (contentType && contentType.includes('application/json')) {
                console.log('📝 JSON Response:', JSON.parse(text));
                } else {
                console.log('❓ UNKNOWN RESPONSE TYPE');
                console.log('📝 Response content (first 200 chars):', text.substring(0, 200));
                }
                
            } catch (error) {
                console.log('❌ Request failed:', error.message);
            }
            }
            
        } catch (error) {
            console.error('Debug error:', error);
        }
        },

// Temporarily use this in your renderResultCard:
// onclick="event.stopPropagation(); resultsPage.debugCertificateDownload(${result.id})"

    

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