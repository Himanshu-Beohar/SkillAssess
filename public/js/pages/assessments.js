// Assessments page
const assessmentsPage = {
  async load() {
    // ✅ 1. Capture query params
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedFilter = urlParams.get("filter") || "all";
    const skillFilter = urlParams.get("skill");
    const searchQuery = urlParams.get("search"); // ✅ declare once here

    // ✅ 2. Load assessments
    const assessments = await this.loadAssessments();
    let filteredAssessments = assessments;

    // ✅ 3. Apply skill filter if present
    if (skillFilter) {
      filteredAssessments = assessments.filter(a =>
        a.skill && a.skill.toLowerCase() === skillFilter.toLowerCase()
      );
      document.title = `${skillFilter} Assessments | SkillAssess`;
    }

    // ✅ 4. Render page
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

        ${skillFilter ? `
          <div class="skill-filter-banner">
            <h2>Showing assessments for: <strong>${skillFilter}</strong></h2>
            <p>These assessments will help you grow your ${skillFilter} expertise 🚀</p>
          </div>
        ` : ''}

        <div class="filter-toolbar">
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
          ${filteredAssessments.map(assessment => this.renderAssessmentCard(assessment)).join('')}
        </div>

        ${filteredAssessments.length === 0 ? `
          <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No assessments found</h3>
            <p>Try adjusting your search criteria or check back later for new assessments.</p>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('page-content').innerHTML = html;

    // ✅ 5. Auto-run search if ?search param is present
    // ✅ 5. Auto-run search if ?search param is present
    if (searchQuery) {
    const inputEl = document.getElementById("search-input");
    if (inputEl) {
        inputEl.value = searchQuery;
        // 🔁 Small delay ensures DOM is ready before filtering
        setTimeout(() => {
        this.searchAssessments();
        }, 100);
    }
    }


    // ✅ 6. Add listeners
    this.addEventListeners();
    this.addAssessmentButtonListeners();

    // ✅ 7. Activate toggle button
    const defaultBtn = document.querySelector(`.toggle-btn[data-value="${preselectedFilter}"]`);
    if (defaultBtn) {
      document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
      defaultBtn.classList.add("active");
      this.filterAssessments(preselectedFilter);
    }

    // ✅ 8. Clean URL
    window.history.replaceState({}, document.title, config.ROUTES.ASSESSMENTS);
  },

  renderAssessmentCard(assessment) {
    return `
      <div class="assessment-card" 
           data-assessment-id="${assessment.id}" 
           data-is-premium="${assessment.is_premium}" 
           data-skill="${assessment.skill || ''}">
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
    document.querySelectorAll(".toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.filterAssessments(btn.getAttribute("data-value"));
      });
    });

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
    const skillFilter = new URLSearchParams(window.location.search).get("skill");
    const assessmentCards = document.querySelectorAll('.assessment-card');

    assessmentCards.forEach(card => {
      const isPremium = card.getAttribute('data-is-premium') === 'true';
      let show = true;

      if (skillFilter) {
        const cardSkill = card.getAttribute('data-skill');
        if (!cardSkill || cardSkill.toLowerCase() !== skillFilter.toLowerCase()) {
          show = false;
        }
      }

      if (filterType === 'free' && isPremium) show = false;
      if (filterType === 'premium' && !isPremium) show = false;

      card.style.display = show ? 'block' : 'none';
    });
  },

  searchAssessments() {
    const urlParams = new URLSearchParams(window.location.search);
    const skillFilter = urlParams.get("skill");
    const searchInput = document.getElementById('search-input');
    const searchTerm = searchInput.value.toLowerCase();
    const assessmentCards = document.querySelectorAll('.assessment-card');

    assessmentCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const description = card.querySelector('p').textContent.toLowerCase();
      let show = title.includes(searchTerm) || description.includes(searchTerm);

      if (skillFilter) {
        const cardSkill = card.getAttribute('data-skill');
        if (!cardSkill || cardSkill.toLowerCase() !== skillFilter.toLowerCase()) {
          show = false;
        }
      }

      card.style.display = show ? 'block' : 'none';
    });
  },

  addAssessmentButtonListeners() {
    document.querySelectorAll('.assessment-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const assessmentId = button.getAttribute('data-assessment-id');
        router.navigateTo(`/assessment/${assessmentId}/instructions`);
      });
    });
  }
};
