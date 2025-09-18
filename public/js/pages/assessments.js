// Assessments page
const assessmentsPage = {
    async load() {
        const assessments = await this.loadAssessments();
        
        const html = `
            <div class="page-container">
                <div class="page-header">
                    <h1>Available Assessments</h1>
                    <p>Choose from our selection of free and premium assessments.</p>
                </div>

                <div class="filters-section">
                    <div class="filter-group">
                        <label>Filter by:</label>
                        <select id="filter-type" class="form-control">
                            <option value="all">All Assessments</option>
                            <option value="free">Free Only</option>
                            <option value="premium">Premium Only</option>
                        </select>
                    </div>
                    <div class="search-group">
                        <input type="text" id="search-input" class="form-control" placeholder="Search assessments...">
                        <button class="btn btn-primary" onclick="assessmentsPage.searchAssessments()">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                <div class="assessments-grid" id="assessments-container">
                    ${assessments.map(assessment => this.renderAssessmentCard(assessment)).join('')}
                </div>

                ${assessments.length === 0 ? `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No assessments found</h3>
                        <p>Try adjusting your search criteria or check back later for new assessments.</p>
                    </div>
                ` : ''}
            </div>
        `;
        document.getElementById('page-content').innerHTML = html;
        this.addEventListeners();
        this.addAssessmentButtonListeners(); // Add this line
        
    },

    renderAssessmentCard(assessment) {
        return `
            <div class="assessment-card" data-assessment-id="${assessment.id}" data-is-premium="${assessment.is_premium}">
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
                    <button class="btn ${assessment.is_premium ? 'btn-accent' : 'btn-primary'} btn-full assessment-button" 
                            data-assessment-id="${assessment.id}" 
                            data-is-premium="${assessment.is_premium}">
                        ${assessment.is_premium ? 'Purchase Access' : 'Start Assessment'}
                    </button>
                </div>
            </div>
        `;
    },

    addEventListeners() {
        const filterSelect = document.getElementById('filter-type');
        const searchInput = document.getElementById('search-input');

        filterSelect.addEventListener('change', this.filterAssessments.bind(this));
        searchInput.addEventListener('input', utils.debounce(this.searchAssessments.bind(this), 300));
    },

    async loadAssessments() {
        try {
            const response = await api.get('/assessments');
            return response.data.assessments || [];
        } catch (error) {
            console.error('Error loading assessments:', error);
            utils.showNotification('Failed to load assessments', 'error');
            return [];
        }
    },

    filterAssessments() {
        const filterType = document.getElementById('filter-type').value;
        const assessmentCards = document.querySelectorAll('.assessment-card');

        assessmentCards.forEach(card => {
            const isPremium = card.getAttribute('data-is-premium') === 'true';
            
            if (filterType === 'all') {
                card.style.display = 'block';
            } else if (filterType === 'free' && !isPremium) {
                card.style.display = 'block';
            } else if (filterType === 'premium' && isPremium) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },

    searchAssessments() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const assessmentCards = document.querySelectorAll('.assessment-card');

        assessmentCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },

    startAssessment(assessmentId, isPremium) {
        if (isPremium) {
            // Use router navigation instead of direct URL change
            router.navigateTo(`/payment/${assessmentId}`);
        } else {
            router.navigateTo(`/assessment/${assessmentId}`);
        }
    },
    
    addAssessmentButtonListeners() {
        const buttons = document.querySelectorAll('.assessment-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const assessmentId = button.getAttribute('data-assessment-id');
                const isPremium = button.getAttribute('data-is-premium') === 'true';
                
                console.log('Button clicked - Assessment ID:', assessmentId, 'Is Premium:', isPremium);
                
                if (isPremium) {
                    router.navigateTo(`/payment/${assessmentId}`);
                } else {
                    router.navigateTo(`/assessment/${assessmentId}`);
                }
            });
        });
    }
};