// // Assessments page
// const assessmentsPage = {
//     async load() {
//         const assessments = await this.loadAssessments();
        
//         const html = `
//             <div class="page-container">
//                 <div class="page-header">
//                     <h1>📚 Available Assessments</h1>
//                     <p class="page-subtitle">
//                         Browse free and premium assessments across various tech and professional domains. 
//                         Practice real-world questions, track your performance, and strengthen the skills that matter most 
//                         — from coding and data science to project management and cybersecurity.
//                     </p>
//                 </div>

//                 <div class="filter-toolbar">
//                     <!-- ✅ Toggle Buttons -->
//                     <div class="filter-group toggle-group">
//                         <button class="toggle-btn active" data-value="all">All</button>
//                         <button class="toggle-btn" data-value="free">Free</button>
//                         <button class="toggle-btn" data-value="premium">Premium</button>
//                     </div>

//                     <!-- Search bar -->
//                     <div class="search-group">
//                         <div class="search-wrapper">
//                             <input 
//                                 type="text" 
//                                 id="search-input" 
//                                 class="search-input" 
//                                 placeholder="🔍 Search assessments..."
//                             />
//                             <button class="search-btn" onclick="assessmentsPage.searchAssessments()">
//                                 <i class="fas fa-search"></i>
//                             </button>
//                         </div>
//                     </div>
//                 </div>

//                 <div class="assessments-grid" id="assessments-container">
//                     ${assessments.map(assessment => this.renderAssessmentCard(assessment)).join('')}
//                 </div>

//                 ${assessments.length === 0 ? `
//                     <div class="empty-state">
//                         <i class="fas fa-search"></i>
//                         <h3>No assessments found</h3>
//                         <p>Try adjusting your search criteria or check back later for new assessments.</p>
//                     </div>
//                 ` : ''}
//             </div>
//         `;

//         document.getElementById('page-content').innerHTML = html;
//         this.addEventListeners();
//         this.addAssessmentButtonListeners(); 
//     },

//     renderAssessmentCard(assessment) {
//         return `
//             <div class="assessment-card" data-assessment-id="${assessment.id}" data-is-premium="${assessment.is_premium}">
//                 <div class="assessment-image">
//                     <i class="fas ${assessment.is_premium ? 'fa-crown' : 'fa-book'}"></i>
//                 </div>
//                 <div class="assessment-content">
//                     <h3>${assessment.title}</h3>
//                     <p>${assessment.description || 'Test your knowledge and skills'}</p>
//                     <div class="assessment-meta">
//                         <span class="price ${assessment.is_premium ? 'paid' : 'free'}">
//                             ${assessment.is_premium ? utils.formatCurrency(assessment.price) : 'Free'}
//                         </span>
//                         <span class="tag ${assessment.is_premium ? 'tag-paid' : 'tag-free'}">
//                             ${assessment.is_premium ? 'Premium' : 'Free'}
//                         </span>
//                     </div>
//                     <button class="btn ${assessment.is_premium ? 'btn-accent' : 'btn-primary'} btn-full assessment-button" 
//                             data-assessment-id="${assessment.id}">
//                         View Details
//                     </button>
//                 </div>
//             </div>
//         `;
//     },

//     addEventListeners() {
//         // ✅ Toggle button listeners
//         document.querySelectorAll(".toggle-btn").forEach(btn => {
//             btn.addEventListener("click", (e) => {
//                 // Update active button
//                 document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
//                 btn.classList.add("active");

//                 // Apply filter
//                 const filterValue = btn.getAttribute("data-value");
//                 this.filterAssessments(filterValue);
//             });
//         });

//         // ✅ Search input listener
//         const searchInput = document.getElementById('search-input');
//         searchInput.addEventListener('input', utils.debounce(this.searchAssessments.bind(this), 300));
//     },

//     async loadAssessments() {
//         try {
//             const response = await api.get('/assessments');
//             return response.data.assessments || [];
//         } catch (error) {
//             console.error('Error loading assessments:', error);
//             utils.showNotification('Failed to load assessments', 'error');
//             return [];
//         }
//     },

//     // ✅ Updated filter function to work with toggle buttons
//     filterAssessments(filterType) {
//         const assessmentCards = document.querySelectorAll('.assessment-card');

//         assessmentCards.forEach(card => {
//             const isPremium = card.getAttribute('data-is-premium') === 'true';
//             let show = false;

//             if (filterType === 'all') {
//                 show = true;
//             } else if (filterType === 'free' && !isPremium) {
//                 show = true;
//             } else if (filterType === 'premium' && isPremium) {
//                 show = true;
//             }

//             card.style.display = show ? 'block' : 'none';
//         });
//     },

//     searchAssessments() {
//         const searchTerm = document.getElementById('search-input').value.toLowerCase();
//         const assessmentCards = document.querySelectorAll('.assessment-card');

//         assessmentCards.forEach(card => {
//             const title = card.querySelector('h3').textContent.toLowerCase();
//             const description = card.querySelector('p').textContent.toLowerCase();
            
//             if (title.includes(searchTerm) || description.includes(searchTerm)) {
//                 card.style.display = 'block';
//             } else {
//                 card.style.display = 'none';
//             }
//         });
//     },

//     addAssessmentButtonListeners() {
//         const buttons = document.querySelectorAll('.assessment-button');
//         buttons.forEach(button => {
//             button.addEventListener('click', (e) => {
//                 e.preventDefault();
//                 e.stopPropagation();
                
//                 const assessmentId = button.getAttribute('data-assessment-id');
                
//                 console.log('Navigating to instructions for assessment:', assessmentId);
//                 router.navigateTo(`/assessment/${assessmentId}/instructions`);
//             });
//         });
//     }
// };


// Assessments page
const assessmentsPage = {
    async load() {
        // ✅ 1. Check if a filter query parameter exists
        const urlParams = new URLSearchParams(window.location.search);
        const preselectedFilter = urlParams.get("filter") || "all";

        const assessments = await this.loadAssessments();
        
        const html = `
            <div class="page-container">
                <div class="page-header">
                    <h1>📚 Available Assessments</h1>
                    <p class="page-subtitle">
                        Browse free and premium assessments across various tech and professional domains. 
                        Practice real-world questions, track your performance, and strengthen the skills that matter most 
                        — from coding and data science to project management and cybersecurity.
                    </p>
                </div>

                <div class="filter-toolbar">
                    <!-- ✅ Toggle Buttons -->
                    <div class="filter-group toggle-group">
                        <button class="toggle-btn" data-value="all">All</button>
                        <button class="toggle-btn" data-value="free">Free</button>
                        <button class="toggle-btn" data-value="premium">Premium</button>
                    </div>

                    <!-- Search bar -->
                    <div class="search-group">
                        <div class="search-wrapper">
                            <input 
                                type="text" 
                                id="search-input" 
                                class="search-input" 
                                placeholder="🔍 Search assessments..."
                            />
                            <button class="search-btn" onclick="assessmentsPage.searchAssessments()">
                                <i class="fas fa-search"></i>
                            </button>
                        </div>
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

        // ✅ 2. Set up event listeners
        this.addEventListeners();
        this.addAssessmentButtonListeners(); 

        // ✅ 3. Automatically activate the correct toggle and filter
        const defaultBtn = document.querySelector(`.toggle-btn[data-value="${preselectedFilter}"]`);
        if (defaultBtn) {
            document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
            defaultBtn.classList.add("active");
            this.filterAssessments(preselectedFilter);
        }

        // ✅ 4. (Optional) Clean URL to remove ?filter=premium after use
        window.history.replaceState({}, document.title, config.ROUTES.ASSESSMENTS);
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
                            data-assessment-id="${assessment.id}">
                        View Details
                    </button>
                </div>
            </div>
        `;
    },

    addEventListeners() {
        // ✅ Toggle button listeners
        document.querySelectorAll(".toggle-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                const filterValue = btn.getAttribute("data-value");
                this.filterAssessments(filterValue);
            });
        });

        // ✅ Search input listener
        const searchInput = document.getElementById('search-input');
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

    filterAssessments(filterType) {
        const assessmentCards = document.querySelectorAll('.assessment-card');

        assessmentCards.forEach(card => {
            const isPremium = card.getAttribute('data-is-premium') === 'true';
            let show = false;

            if (filterType === 'all') {
                show = true;
            } else if (filterType === 'free' && !isPremium) {
                show = true;
            } else if (filterType === 'premium' && isPremium) {
                show = true;
            }

            card.style.display = show ? 'block' : 'none';
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

    addAssessmentButtonListeners() {
        const buttons = document.querySelectorAll('.assessment-button');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const assessmentId = button.getAttribute('data-assessment-id');
                console.log('Navigating to instructions for assessment:', assessmentId);
                router.navigateTo(`/assessment/${assessmentId}/instructions`);
            });
        });
    }
};
