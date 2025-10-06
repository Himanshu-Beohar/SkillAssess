// Assessments page
const assessmentsPage = {
  async load() {
    // ✅ 1. Capture query params
    const urlParams = new URLSearchParams(window.location.search);
    const preselectedFilter = urlParams.get("filter") || "all";
    const skillFilter = urlParams.get("skill");
    const searchQuery = urlParams.get("search");

    // ✅ 2. Load assessments
    const assessments = await this.loadAssessments();
    let filteredAssessments = assessments;

    // ✅ 3. Apply skill filter (server-side param)
    if (skillFilter) {
      filteredAssessments = assessments.filter(a =>
        a.skill && a.skill.toLowerCase() === skillFilter.toLowerCase()
      );
      document.title = `${skillFilter} Assessments | SkillAssess`;
    }

    // ✅ 4. Generate category options dynamically
    const categories = [...new Set(assessments.map(a => a.category).filter(Boolean))];

    // ✅ 5. Render page
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

        <!-- Toggle + Search -->
        <div class="filter-toolbar">
          <div class="filter-group toggle-group">
            <button class="toggle-btn" data-value="all">All</button>
            <button class="toggle-btn" data-value="free">Free</button>
            <button class="toggle-btn" data-value="premium">Premium</button>
          </div>

          <div class="search-group">
            <div class="search-wrapper">
              <input 
                type="text" 
                id="search-input" 
                class="search-input" 
                placeholder="🔍 Search assessments..."
              />
              <button class="search-btn" onclick="assessmentsPage.applyAdvancedFilters()">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- 🧩 Category & Difficulty Filters -->
        <div class="advanced-filters">
          <select id="category-filter" class="filter-select">
            <option value="">All Categories</option>
            ${categories.map(c => `<option value="${c}">${c}</option>`).join("")}
          </select>

          <select id="difficulty-filter" class="filter-select">
            <option value="">All Difficulty</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Expert">Expert</option>
          </select>
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

    // ✅ 6. Pre-fill search from URL if needed
    if (searchQuery) {
      const inputEl = document.getElementById("search-input");
      if (inputEl) {
        inputEl.value = searchQuery;
        setTimeout(() => {
          this.applyAdvancedFilters();
        }, 100);
      }
    }

    // ✅ 7. Add listeners
    this.addEventListeners();
    this.addAssessmentButtonListeners();

    // ✅ 8. Activate toggle button & filter initially
    const defaultBtn = document.querySelector(`.toggle-btn[data-value="${preselectedFilter}"]`);
    if (defaultBtn) {
      document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
      defaultBtn.classList.add("active");
    }
    this.applyAdvancedFilters();

    // ✅ 9. Clean URL
    window.history.replaceState({}, document.title, config.ROUTES.ASSESSMENTS);
  },

  renderAssessmentCard(assessment) {
    return `
      <div class="assessment-card" 
           data-assessment-id="${assessment.id}" 
           data-is-premium="${assessment.is_premium}" 
           data-skill="${assessment.skill || ''}"
           data-category="${assessment.category || ''}"
           data-difficulty="${assessment.difficulty || ''}">
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
    // ✅ Toggle Free/Premium
    document.querySelectorAll(".toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.applyAdvancedFilters();
      });
    });

    // ✅ Search
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', utils.debounce(this.applyAdvancedFilters.bind(this), 300));
    }

    // ✅ Category & Difficulty
    const categorySelect = document.getElementById("category-filter");
    const difficultySelect = document.getElementById("difficulty-filter");
    if (categorySelect) categorySelect.addEventListener("change", this.applyAdvancedFilters.bind(this));
    if (difficultySelect) difficultySelect.addEventListener("change", this.applyAdvancedFilters.bind(this));
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

  applyAdvancedFilters() {
    const category = document.getElementById("category-filter")?.value || "";
    const difficulty = document.getElementById("difficulty-filter")?.value || "";
    const searchTerm = document.getElementById("search-input")?.value.toLowerCase() || "";
    const urlParams = new URLSearchParams(window.location.search);
    const skillFilter = urlParams.get("skill");
    const activeToggle = document.querySelector(".toggle-btn.active")?.getAttribute("data-value") || "all";

    const cards = document.querySelectorAll(".assessment-card");

    cards.forEach(card => {
      const title = card.querySelector("h3").textContent.toLowerCase();
      const description = card.querySelector("p").textContent.toLowerCase();
      const cardCategory = card.getAttribute("data-category") || "";
      const cardDifficulty = card.getAttribute("data-difficulty") || "";
      const cardSkill = card.getAttribute("data-skill") || "";
      const isPremium = card.getAttribute("data-is-premium") === "true";

      let show = true;

      // 🔍 Search filter
      if (searchTerm && !(title.includes(searchTerm) || description.includes(searchTerm))) {
        show = false;
      }

      // 🎯 Skill filter
      if (skillFilter && cardSkill.toLowerCase() !== skillFilter.toLowerCase()) {
        show = false;
      }

      // 📁 Category filter
      if (category && cardCategory !== category) {
        show = false;
      }

      // 📊 Difficulty filter
      if (difficulty && cardDifficulty !== difficulty) {
        show = false;
      }

      // 💰 Free/Premium filter
      if (activeToggle === "free" && isPremium) show = false;
      if (activeToggle === "premium" && !isPremium) show = false;

      card.style.display = show ? "block" : "none";
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

