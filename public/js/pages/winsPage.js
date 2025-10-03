const winsPage = {
  results: [],
  userStats: {},
  assessments: [],
  premiumAssessments: [],
  recommendedAssessments: [],

  async load() {
    try {
      await this.refreshUserOnLoad();
      utils.showLoading('Loading your dashboard...');
      
      // Fetch assessments from the correct endpoint
      const assessmentsResponse = await api.get('/assessments');
      
      if (assessmentsResponse.success) {
        this.assessments = assessmentsResponse.data.assessments || [];
        this.premiumAssessments = this.getPremiumAssessments();
      } else {
        console.warn('Could not load assessments, using fallback');
        this.assessments = [];
        this.premiumAssessments = [];
      }

      // Then fetch results
      const resultsResponse = await api.get('/results/my-results');
      
      if (resultsResponse.success) {
        this.results = resultsResponse.data.results || [];
        this.userStats = this.calculateUserStats();
        this.recommendedAssessments = this.getRecommendedAssessments();
        this.render();
      } else {
        this.renderEmpty();
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      utils.showNotification('Failed to load dashboard data', 'error');
      this.renderError();
    } finally {
      utils.hideLoading();
    }
  },

  getPremiumAssessments() {
    if (!this.assessments || this.assessments.length === 0) {
      return [];
    }
    
    return this.assessments
      .filter(assessment => assessment.is_premium)
      .map(assessment => assessment.title);
  },

  getRecommendedAssessments() {
    // If no assessments loaded, return empty array
    if (!this.assessments || this.assessments.length === 0) {
      return this.getDefaultRecommendations();
    }

    const user = auth.getCurrentUser();
    if (!user) return this.getDefaultRecommendations();

    // Filter out passed assessments
    const passedAssessmentTitles = new Set();
    this.results.forEach(result => {
      const percentage = Math.round((result.score / result.total_questions) * 100);
      if (percentage >= 60) {
        passedAssessmentTitles.add(result.assessment_title);
      }
    });

    // Get available assessments
    const availableAssessments = this.assessments.filter(
      assessment => !passedAssessmentTitles.has(assessment.title)
    );

    // If no available assessments, return some from database anyway
    if (availableAssessments.length === 0) {
      return this.assessments.slice(0, 3).map(assessment => this.formatAssessmentForDisplay(assessment));
    }

    // Simple recommendation: prefer free assessments for new users
    const recommendations = availableAssessments
      .sort((a, b) => {
        // Free assessments first
        if (a.is_premium !== b.is_premium) {
          return a.is_premium ? 1 : -1;
        }
        // Then by number of questions (more comprehensive first)
        return (b.num_questions || 0) - (a.num_questions || 0);
      })
      .slice(0, 5)
      .map(assessment => this.formatAssessmentForDisplay(assessment));

    return recommendations;
  },

  formatAssessmentForDisplay(assessment) {
    return {
      id: assessment.id,
      title: assessment.title,
      category: this.extractCategory(assessment),
      difficulty: this.determineDifficulty(assessment),
      duration: this.formatDuration(assessment.time_limit),
      is_premium: assessment.is_premium,
      description: assessment.description
    };
  },

  extractCategory(assessment) {
    if (!assessment.description) return 'General';
    
    const text = (assessment.description + ' ' + assessment.title).toLowerCase();
    const categories = {
      'javascript': 'Programming',
      'python': 'Programming', 
      'java': 'Programming',
      'sql': 'Database',
      'html': 'Web Development',
      'css': 'Web Development',
      'react': 'Frontend',
      'node': 'Backend',
      'data': 'Data Science',
      'machine learning': 'AI/ML',
      'cloud': 'Cloud Computing',
      'devops': 'DevOps'
    };

    for (const [keyword, category] of Object.entries(categories)) {
      if (text.includes(keyword)) {
        return category;
      }
    }

    return 'General';
  },

  determineDifficulty(assessment) {
    if (!assessment.description) return 'Beginner';
    
    const text = (assessment.description + ' ' + assessment.title).toLowerCase();
    
    if (text.includes('advanced') || text.includes('expert')) {
      return 'Advanced';
    } else if (text.includes('intermediate')) {
      return 'Intermediate';
    } else {
      return 'Beginner';
    }
  },

  formatDuration(timeLimit) {
    if (!timeLimit || timeLimit === 0) return '30 min';
    
    if (timeLimit < 60) {
      return `${timeLimit} min`;
    } else {
      const hours = Math.floor(timeLimit / 60);
      const minutes = timeLimit % 60;
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
  },

  getDefaultRecommendations() {
    return [
      { 
        id: 'default-1',
        title: 'Start with Basics', 
        category: 'General', 
        difficulty: 'Beginner', 
        duration: '30 min',
        is_premium: false 
      }
    ];
  },

  // Update the calculateUserStats method to use dynamic premium assessments
  calculateUserStats() {
    if (this.results.length === 0) {
      return { 
        successRate: 0, 
        uniqueTotal: 0, 
        uniquePassed: 0, 
        totalAttempts: 0, 
        totalPasses: 0, 
        premiumPasses: 0,
        recentActivity: []
      };
    }

    const assessmentMap = new Map();
    this.results.forEach(result => {
      const percentage = Math.round((result.score / result.total_questions) * 100);
      const passed = percentage >= 60;

      if (!assessmentMap.has(result.assessment_id)) {
        assessmentMap.set(result.assessment_id, { 
          attempts: 0, 
          passes: 0, 
          title: result.assessment_title,
          bestScore: 0 
        });
      }
      const stats = assessmentMap.get(result.assessment_id);
      stats.attempts++;
      if (passed) stats.passes++;
      if (percentage > stats.bestScore) stats.bestScore = percentage;
      assessmentMap.set(result.assessment_id, stats);
    });

    const uniqueTotal = assessmentMap.size;
    const uniquePassed = Array.from(assessmentMap.values()).filter(stat => stat.passes > 0).length;
    const totalAttempts = Array.from(assessmentMap.values()).reduce((s, st) => s + st.attempts, 0);
    const totalPasses = Array.from(assessmentMap.values()).reduce((s, st) => s + st.passes, 0);

    const coverage = uniqueTotal > 0 ? uniquePassed / uniqueTotal : 0;
    const consistency = totalAttempts > 0 ? totalPasses / totalAttempts : 0;
    const successRate = Math.round(coverage * 100 * consistency);

    // Count premium passes using dynamic premium assessments
    let premiumPasses = 0;
    assessmentMap.forEach(stat => {
      if (this.premiumAssessments.includes(stat.title) && stat.passes > 0) {
        premiumPasses++;
      }
    });

    // Recent activity (last 5 results) - UPDATED to include type
    const recentActivity = this.results
      .slice(0, 5)
      .map(result => {
        const percentage = Math.round((result.score / result.total_questions) * 100);
        const passed = percentage >= 60;
        const date = this.formatDate(result.submitted_at || result.created_at);
        const isPremium = this.premiumAssessments.includes(result.assessment_title);
        
        return {
          title: result.assessment_title,
          date,
          score: percentage,
          passed,
          isPremium: isPremium,
          type: isPremium ? 'premium' : 'free' // Add type for easy rendering
        };
      });

    return { successRate, uniqueTotal, uniquePassed, totalAttempts, totalPasses, premiumPasses, recentActivity };
  },

  // Update the recommendation item rendering to use actual assessment IDs
  renderRecommendedAssessments() {
    return this.recommendedAssessments.map(assessment => `
      <div class="recommendation-item" data-assessment-id="${assessment.id}">
        <div class="recommendation-icon">
          <i class="fas ${assessment.is_premium ? 'fa-gem' : 'fa-clipboard-check'}"></i>
        </div>
        <div class="recommendation-details">
          <div class="recommendation-title">${assessment.title}</div>
          <div class="recommendation-meta">
            <span class="category">${assessment.category}</span>
            <span class="difficulty ${assessment.difficulty.toLowerCase()}">${assessment.difficulty}</span>
            <span class="duration">${assessment.duration}</span>
            ${assessment.is_premium ? '<span class="premium-tag">Premium</span>' : ''}
          </div>
        </div>
        <button class="btn btn-outline btn-small" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}?id=${assessment.id}')">
          Start
        </button>
      </div>
    `).join('');
  },
  // Add this helper method to truncate long text
  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  // Update the formatDate method (if not already present)
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? 'N/A' : date.toLocaleDateString();
  },

  render() {
    const user = auth.getCurrentUser();
    if (!user) return;

    const { successRate, uniqueTotal, uniquePassed, totalAttempts, totalPasses, premiumPasses } = this.userStats;
    const level = this.getPerformanceLevel();
    const { nextGoal, progressPercent, progressLabel, locked } = this.getNextGoal(uniquePassed, successRate, premiumPasses);
    const badgeIcon = this.getBadgeIcon(level);
    const profileCompleteness = this.calculateProfileCompleteness();

    const html = `
      <div class="page-container dashboard-container">
        <!-- Profile Completeness Banner -->
        ${profileCompleteness.percent < 100 ? this.renderProfileBanner(profileCompleteness) : ''}

        <!-- Welcome Section -->
        <div class="welcome-section">
          <div class="welcome-content">
            <h1>Welcome to Skillassess, ${user.name?.split(' ')[0] || 'there'}! 👋</h1>
            <p>${this.getWelcomeMessage(level)}</p>
            <div class="welcome-actions">
              <button class="btn btn-accent" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
                <i class="fas fa-play-circle"></i> Start Assessment
              </button>
              <button class="btn btn-secondary" onclick="router.navigateTo('${config.ROUTES.PROFILE}')">
                <i class="fas fa-user-edit"></i> Edit Profile
              </button>
            </div>
          </div>
          <div class="welcome-badge">
            <div class="badge-display-large ${level.toLowerCase().replace(' ', '-')}">
              <i class="fas ${badgeIcon}"></i>
              <span>${level}</span>
            </div>
          </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="dashboard-grid">
          <!-- Left Column -->
          <div class="dashboard-column">
            <!-- Quick Stats -->
            <div class="stats-grid">
              <div class="stat-card primary">
                <div class="stat-icon">
                  <i class="fas fa-trophy"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">${uniquePassed}</div>
                  <div class="stat-label">Assessments Passed</div>
                </div>
              </div>
              <div class="stat-card success">
                <div class="stat-icon">
                  <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">${successRate}%</div>
                  <div class="stat-label">Success Rate</div>
                </div>
              </div>
              <div class="stat-card warning">
                <div class="stat-icon">
                  <i class="fas fa-star"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">${premiumPasses}</div>
                  <div class="stat-label">Premium Passes</div>
                </div>
              </div>
              <div class="stat-card info">
                <div class="stat-icon">
                  <i class="fas fa-clock"></i>
                </div>
                <div class="stat-content">
                  <div class="stat-value">${totalAttempts}</div>
                  <div class="stat-label">Total Attempts</div>
                </div>
              </div>
            </div>

            



            <!-- Progress Towards Next Level -->
            <div class="progress-card">
              <div class="progress-header">
                <h3>🚀 Level Progress</h3>
                <span class="current-level">${level}</span>
              </div>
              <p class="progress-description">${nextGoal}</p>
              ${locked ? `
              <div class="premium-lock">
                  <i class="fas fa-lock"></i> 
                  <span>You need a Premium Pass to unlock your next badge</span>
                  <!-- ✅ Pass query param to auto-filter premium -->
                  <button class="btn-premium" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}?filter=premium')">
                    🔓 Unlock Premium
                  </button>
              </div>
              ` : ''}
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${progressPercent}%"></div>
                </div>
                
                <div class="progress-text">${progressLabel} - ${progressPercent}% complete</div>
                
              </div>
              ${locked ? `
              <div class="premium-upsell">
                <i class="fas fa-gem"></i>
                <div class="upsell-content">
                  <strong>Premium Required</strong>
                  <p>Unlock advanced assessments to reach next level</p>
                </div>
                
              </div>
              
              ` : ''}
              <div class="info-section">
                <h3>🥇 How Badges Work</h3>
                <ul>
                    <li><b>Beginner:</b> Default level for all users</li>
                    <li><b>Intermediate:</b> 5+ unique passes, 40%+ success rate, and ≥1 premium pass</li>
                    <li><b>Advanced:</b> 10+ unique passes, 60%+ success rate, and ≥3 premium passes</li>
                    <li><b>Expert:</b> 15+ unique passes, 80%+ success rate, and ≥5 premium passes</li>
                </ul>
            </div>

            <div class="info-section">
                <h3>🎁 Rewards Await You!</h3>
                <p>Keep leveling up to unlock rewards from Skillassess & Gyanovation. 
                Earn certificates on passing any assessment, recognized by Gyanovation. 
                Showcase your skills and boost your resume!</p>
            </div>
            </div>

            <!-- 📜 My Premium Assessments -->
            <div class="premium-assessments-card">
              <div class="card-header">
                <h3>📜 My Premium Assessments</h3>
              </div>

              <!-- Tabs -->
              <div class="premium-tabs">
                
                <div class="premium-tab active" onclick="openPremiumTab(event, 'active')">Active</div>
                <div class="premium-tab" onclick="openPremiumTab(event, 'completed')">Completed</div>
                <div class="premium-tab" onclick="openPremiumTab(event, 'expired')">Expired</div>
              </div>

              <!-- Tab Contents -->
              

              <div id="premium-tab-active" class="premium-tab-content active">
                <div class="premium-assessments-list" id="premium-assessments-list-active"></div>
              </div>

              <div id="premium-tab-completed" class="premium-tab-content">
                <div class="premium-assessments-list" id="premium-assessments-list-completed"></div>
              </div>

              <div id="premium-tab-expired" class="premium-tab-content">
                <div class="premium-assessments-list" id="premium-assessments-list-expired"></div>
              </div>
            </div>

            <!-- Recent Activity -->
            ${this.renderRecentActivity()}
          </div>

          <!-- Right Column -->
          <div class="dashboard-column">
            <!-- Recommended Assessments -->
            <div class="recommendations-card">
              <div class="card-header">
                <h3>🎯 Recommended for You</h3>
                <span class="see-all" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">See all</span>
              </div>
              <div class="recommendations-list">
                ${this.renderRecommendedAssessments()}
              </div>
            </div>

            <!-- Skill Insights Analysis -->
            <div class="skill-gap-card">
              <div class="card-header">
                <h3>📊 Skill Insights</h3>
                <i class="fas fa-info-circle" title="Based on your profile and assessment history"></i>
              </div>
              ${this.renderSkillInsights()}
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions-card">
              <h3>⚡ Quick Actions</h3>
              <div class="actions-grid">
                <button class="action-btn" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
                  <i class="fas fa-play-circle"></i>
                  <span>Take Assessment</span>
                </button>
                <button class="action-btn" onclick="router.navigateTo('${config.ROUTES.PROFILE}')">
                  <i class="fas fa-user-cog"></i>
                  <span>Update Profile</span>
                </button>
                <button class="action-btn" onclick="router.navigateTo('/results')">
                  <i class="fas fa-history"></i>
                  <span>View History</span>
                </button>
                <button class="action-btn" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}?filter=premium')">
                  <i class="fas fa-gem"></i>
                  <span>Go Premium</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- For New Users - Getting Started Guide -->
        ${uniqueTotal === 0 ? this.renderGettingStarted() : ''}

        <!-- Recent Results Table (for users with history) -->
        <!-- ${this.results.length > 0 ? this.renderRecentResults() : ''} -->
      </div>
    `;

    document.getElementById('page-content').innerHTML = html;
    this.initializeChart();
    this.renderPremiumAssessments();
  },

  calculateUserStats() {
    if (this.results.length === 0) {
      return { 
        successRate: 0, 
        uniqueTotal: 0, 
        uniquePassed: 0, 
        totalAttempts: 0, 
        totalPasses: 0, 
        premiumPasses: 0,
        recentActivity: []
      };
    }

    const assessmentMap = new Map();
    this.results.forEach(result => {
      const percentage = Math.round((result.score / result.total_questions) * 100);
      const passed = percentage >= 60;

      if (!assessmentMap.has(result.assessment_id)) {
        assessmentMap.set(result.assessment_id, { 
          attempts: 0, 
          passes: 0, 
          title: result.assessment_title,
          bestScore: 0 
        });
      }
      const stats = assessmentMap.get(result.assessment_id);
      stats.attempts++;
      if (passed) stats.passes++;
      if (percentage > stats.bestScore) stats.bestScore = percentage;
      assessmentMap.set(result.assessment_id, stats);
    });

    const uniqueTotal = assessmentMap.size;
    const uniquePassed = Array.from(assessmentMap.values()).filter(stat => stat.passes > 0).length;
    const totalAttempts = Array.from(assessmentMap.values()).reduce((s, st) => s + st.attempts, 0);
    const totalPasses = Array.from(assessmentMap.values()).reduce((s, st) => s + st.passes, 0);

    const coverage = uniqueTotal > 0 ? uniquePassed / uniqueTotal : 0;
    const consistency = totalAttempts > 0 ? totalPasses / totalAttempts : 0;
    const successRate = Math.round(coverage * 100 * consistency);

    let premiumPasses = 0;
    assessmentMap.forEach(stat => {
      if (this.premiumAssessments.includes(stat.title) && stat.passes > 0) {
        premiumPasses++;
      }
    });

    // Recent activity (last 5 results)
    const recentActivity = this.results
      .slice(0, 5)
      .map(result => {
        const percentage = Math.round((result.score / result.total_questions) * 100);
        const passed = percentage >= 60;
        const date = this.formatDate(result.submitted_at || result.created_at);
        
        return {
          title: result.assessment_title,
          date,
          score: percentage,
          passed,
          isPremium: this.premiumAssessments.includes(result.assessment_title)
        };
      });

    return { successRate, uniqueTotal, uniquePassed, totalAttempts, totalPasses, premiumPasses, recentActivity };
  },

  renderProfileBanner(completeness) {
    return `
      <div class="profile-completeness-banner">
        <div class="banner-content">
          <div class="banner-icon">
            <i class="fas fa-user-check"></i>
          </div>
          <div class="banner-text">
            <h4>Complete your profile (${completeness.percent}%)</h4>
            <p>${completeness.missingFields} fields remaining to unlock personalized recommendations</p>
          </div>
          <button class="btn btn-accent" onclick="router.navigateTo('${config.ROUTES.PROFILE}')">
            Complete Profile
          </button>
        </div>
        <div class="banner-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completeness.percent}%"></div>
          </div>
        </div>
      </div>
    `;
  },

  async renderPremiumAssessments() {
  try {
    const res = await api.get("/assessments/purchased");
    const data = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
    console.log("📦 Premium assessments API response:", data);

    if (data.length === 0) {
      ["active", "completed", "expired"].forEach(tab => {
        document.getElementById(`premium-assessments-list-${tab}`).innerHTML = `
          <div class="empty-state">You haven’t purchased any premium assessments yet.</div>
        `;
      });
      return;
    }

    // 🔍 Categorize
    const categorized = {
      active: data.filter(a => a.attempts_used < a.max_attempts && !a.passed),
      completed: data.filter(a => a.passed === true),
      expired: data.filter(a => a.attempts_used >= a.max_attempts && !a.passed)
    };

    // 🧱 Render each category
    Object.keys(categorized).forEach(category => {
      const list = categorized[category];
      const html = list.map(a => {
        const status = a.attempts_used >= a.max_attempts ? "Expired" : (a.passed ? "Completed" : "Active");
        const resultText = a.last_score_pct != null ? `${a.last_score_pct}%` : '—';
        const lastAttemptText = a.last_attempt ? new Date(a.last_attempt).toLocaleDateString() : '—';

        return `
          <div class="premium-assessment-item ${status === 'Expired' ? 'expired' : ''}">
            <div class="premium-assessment-header">
              <div class="premium-title">${a.title}</div>
              ${status !== "Completed" ? `
                <button class="btn btn-sm btn-primary" ${status === "Expired" ? "disabled" : ""}
                  onclick="router.navigateTo('/assessment/${a.id}/instructions')">
                  Start
                </button>
              ` : ''}
            </div>
            <div class="premium-details">
              <span>Attempts: ${a.attempts_used} / ${a.max_attempts}</span>
              <span>Status: <strong class="${status}">${status}</strong></span>
              <span>Result: ${a.passed ? '✅ Passed' : '❌ Failed'} (${resultText})</span>
              <span>Last Attempt: ${lastAttemptText}</span>
            </div>
          </div>
        `;
      }).join("");


      document.getElementById(`premium-assessments-list-${category}`).innerHTML = html || `
        <div class="empty-state">No ${category} assessments found.</div>
      `;
    });

  } catch (e) {
    console.error("❌ Failed to load premium assessments:", e);
  }
},


  renderRecentActivity() {
    if (this.userStats.recentActivity.length === 0) {
      return `
        <div class="recent-activity-card">
          <div class="card-header">
            <h3>📈 Recent Activity</h3>
          </div>
          <div class="empty-activity">
            <i class="fas fa-clipboard-list"></i>
            <p>No assessments taken yet</p>
            <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
              Start Your First Assessment
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="recent-activity-card">
        <div class="card-header">
          <h3>📈 Recent Activity - Last 5 </h3>
          <span class="btn btn-outline" onclick="router.navigateTo('/results')">View all</span>
        </div>
        <div class="activity-list">
          ${this.userStats.recentActivity.map(activity => `
            <div class="activity-item">
              
              <!-- Left: Status Icon -->
              <div class="activity-icon ${activity.passed ? 'passed' : 'failed'}">
                <i class="fas ${activity.passed ? 'fa-check-circle' : 'fa-times-circle'}"></i>
              </div>

              <!-- Middle: Title + Date -->
              <div class="activity-info">
                <h4 class="activity-title">${activity.title}</h4>
                
              </div>

              <div class="activity-info">
                
                <small class="activity-date">${activity.date}</small>
              </div>

              <!-- Right: Score + Type -->
              <div class="activity-meta">
                <span class="activity-score ${activity.passed ? 'passed' : 'failed'}">${activity.score}%</span>
                
              </div>
              <div class="activity-meta">
                
                <span class="activity-type ${activity.isPremium ? 'premium-badge' : 'free-badge'}">
                  ${activity.isPremium ? '<i class="fas fa-gem"></i> Premium' : 'Free'}
                </span>
              </div>
              

            </div>
          `).join('')}
        </div>

      </div>
    `;
  },

  renderRecommendedAssessments() {
    return this.recommendedAssessments.map(assessment => `
      <div class="recommendation-item">
        <div class="recommendation-icon">
          <i class="fas fa-clipboard-check"></i>
        </div>
        <div class="recommendation-details">
          <div class="recommendation-title">${assessment.title}</div>
          <div class="recommendation-meta">
            <span class="category">${assessment.category}</span>
            <span class="difficulty ${assessment.difficulty.toLowerCase()}">${assessment.difficulty}</span>
            <span class="duration">${assessment.duration}</span>
          </div>
        </div>
        <button 
          class="btn btn-outline btn-small" 
          onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}?search=${encodeURIComponent(assessment.title)}')"
        >
          Start
        </button>
      </div>
    `).join('');
  },

   

  renderSkillInsights() {
  const user = auth.getCurrentUser();
  const userSkills = (user.skills || []).map(s => s.toLowerCase());
  
  if (userSkills.length === 0) {
    return `
      <div class="empty-skills">
        <i class="fas fa-lightbulb"></i>
        <p>Add skills to your profile to get personalized insights</p>
        <button class="btn btn-outline btn-small" onclick="router.navigateTo('${config.ROUTES.PROFILE}')">
          Add Skills
        </button>
      </div>
    `;
  }

  // 🧠 Build skill stats
  const skillsMap = new Map();
  this.assessments.forEach(a => {
    if (!a.skill) return;
    const key = a.skill.toLowerCase();

    if (!skillsMap.has(key)) {
      skillsMap.set(key, {
        skill: a.skill,
        category: a.category,
        job_role: a.job_role,
        total: 0,
        passed: 0
      });
    }

    const skill = skillsMap.get(key);
    skill.total++;

    const result = this.results.find(r => r.assessment_title === a.title);
    if (result) {
      const percentage = Math.round((result.score / result.total_questions) * 100);
      if (percentage >= 60) skill.passed++;
    }
  });

  // 📊 Categorize skills
  const mastered = [];
  const inProgress = [];
  const recommended = [];

  skillsMap.forEach(s => {
    const passRate = s.total > 0 ? s.passed / s.total : 0;
    const hasSkill = userSkills.includes(s.skill.toLowerCase());

    if (hasSkill && passRate >= 0.8) mastered.push(s);
    else if (hasSkill && s.passed > 0) inProgress.push(s);
    else recommended.push(s);
  });

  // 📉 Limit display
  const limit = 3;
  const limitedMastered = mastered.slice(0, limit);
  const limitedInProgress = inProgress.slice(0, limit);
  const limitedRecommended = recommended.slice(0, limit);

  const buildCard = (s) => {
    const passRate = s.total > 0 ? Math.round((s.passed / s.total) * 100) : 0;
    return `
      <div class="skill-card">
        <div class="skill-header">
          <h4>${s.skill}</h4>
          <span class="role">${s.job_role || ''}</span>
        </div>
        <div class="skill-meta">${s.category || ''}</div>
        <div class="progress-wrapper">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${passRate}%;"></div>
          </div>
          <small>${passRate}% mastery (${s.passed}/${s.total} passed)</small>
        </div>
        <button class="btn btn-outline btn-small" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}?skill=${encodeURIComponent(s.skill)}')">View</button>
      </div>
    `;
  };

  return `
    <div class="skill-insights">
      
      ${limitedMastered.length > 0 ? `
        <div class="skill-section mastered">
          <h4>✅ Mastered Skills</h4>
          <div class="skill-grid">${limitedMastered.map(buildCard).join('')}</div>
          ${mastered.length > limit ? `<div class="show-more">+${mastered.length - limit} more</div>` : ''}
        </div>
      ` : ''}

      ${limitedInProgress.length > 0 ? `
        <div class="skill-section in-progress">
          <h4>📈 In Progress</h4>
          <div class="skill-grid">${limitedInProgress.map(buildCard).join('')}</div>
          ${inProgress.length > limit ? `<div class="show-more">+${inProgress.length - limit} more</div>` : ''}
        </div>
      ` : ''}

      ${limitedRecommended.length > 0 ? `
        <div class="skill-section recommended">
          <h4>🚀 Recommended to Learn</h4>
          <div class="skill-grid">${limitedRecommended.map(buildCard).join('')}</div>
          ${recommended.length > limit ? `<div class="show-more">+${recommended.length - limit} more</div>` : ''}
        </div>
      ` : ''}
    </div>
  `;
},



  renderGettingStarted() {
    return `
      <div class="getting-started-section">
        <h2>🎯 Start Your Skill Assessment Journey</h2>
        <div class="getting-started-steps">
          <div class="step-card">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>Complete Your Profile</h4>
              <p>Tell us about your skills and goals for personalized recommendations</p>
            </div>
          </div>
          <div class="step-card">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>Take Your First Assessment</h4>
              <p>Choose from beginner-friendly assessments to start building your profile</p>
            </div>
          </div>
          <div class="step-card">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>Track Your Progress</h4>
              <p>Monitor your growth and unlock achievements as you improve</p>
            </div>
          </div>
        </div>
        <div class="getting-started-actions">
          <button class="btn btn-accent" onclick="router.navigateTo('${config.ROUTES.PROFILE}')">
            Complete Profile
          </button>
          <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
            Browse Assessments
          </button>
        </div>
      </div>
    `;
  },

  renderRecentResults() {
    return `
      <div class="recent-results-section">
        <div class="section-header">
          <h2>📊 Assessment History</h2>
          <button class="btn btn-outline" onclick="router.navigateTo('/results')">
            View Full History
          </button>
        </div>
        <div class="results-table-container">
          <table class="results-table">
            <thead>
              <tr>
                <th>Assessment</th>
                <th>Date</th>
                <th>Score</th>
                <th>Status</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              ${this.results.slice(0, 8).map(result => {
                const percentage = Math.round((result.score / result.total_questions) * 100);
                const passed = percentage >= 60;
                const date = this.formatDate(result.submitted_at || result.created_at);
                const isPremium = this.premiumAssessments.includes(result.assessment_title);
                
                return `
                  <tr>
                    <td>${result.assessment_title || 'Assessment'}</td>
                    <td>${date}</td>
                    <td>
                      <div class="score-display">
                        <span class="score-value">${percentage}%</span>
                        <div class="score-bar">
                          <div class="score-fill ${passed ? 'passed' : 'failed'}" style="width: ${percentage}%"></div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="status-badge ${passed ? 'passed' : 'failed'}">
                        ${passed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td>
                      ${isPremium ? 
                        '<span class="premium-badge"><i class="fas fa-gem"></i> Premium</span>' : 
                        '<span class="free-badge">Free</span>'
                      }
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  async refreshUserOnLoad() {
      try {
          const token = localStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN);
          if (!token) return;

          const response = await fetch('/api/auth/profile', {
              headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
              }
          });
          
          if (response.ok) {
              const data = await response.json();
              if (data.success) {
                  localStorage.setItem(config.STORAGE_KEYS.USER_DATA, JSON.stringify(data.data.user));
              }
          }
      } catch (error) {
          console.warn('Failed to refresh user data:', error);
      }
  },

  calculateProfileCompleteness() {
    const user = auth.getCurrentUser();
    if (!user) return { percent: 0, missingFields: 11 };

    const fields = [
      user.gender, user.phone, user.dob, user.city, user.country,
      user.qualification, user.college, user.occupation, user.experience,
      (user.skills || []).length > 0, user.goal
    ];

    const total = fields.length;
    const filled = fields.filter(Boolean).length;
    const percent = Math.round((filled / total) * 100);

    return { percent, missingFields: total - filled };
  },

  getWelcomeMessage(level) {
    const messages = {
      'Beginner': 'Start your skill assessment journey and discover your strengths!',
      'Intermediate': 'Great progress! Keep going to unlock advanced levels and premium features.',
      'Advanced': 'Impressive skills! You\'re among our top performers.',
      'Expert Level': 'Exceptional expertise! You\'ve mastered advanced concepts.'
    };
    return messages[level] || 'Welcome to your skill assessment dashboard!';
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date) ? 'N/A' : date.toLocaleDateString();
  },

  getBadgeIcon(level) {
    switch (level) {
      case 'Expert Level': return 'fa-crown';
      case 'Advanced': return 'fa-trophy';
      case 'Intermediate': return 'fa-award';
      default: return 'fa-seedling';
    }
  },

  getPerformanceLevel() {
    const { successRate, uniquePassed, premiumPasses } = this.userStats;

    if (uniquePassed >= 15 && successRate >= 80 && premiumPasses >= 5) return 'Expert Level';
    if (uniquePassed >= 10 && successRate >= 60 && premiumPasses >= 3) return 'Advanced';
    if (uniquePassed >= 5 && successRate >= 40 && premiumPasses >= 1) return 'Intermediate';
    return 'Beginner';
  },

  // getNextGoal(uniquePassed, successRate, premiumPasses) {
  //   let target = 0;
  //   let label = '';
  //   let achieved = uniquePassed;
  //   let locked = false;

  //   if (uniquePassed < 5 || premiumPasses < 1) {
  //     target = 5;
  //     label = `Pass 5 unique assessments`;
  //     locked = premiumPasses < 1;
  //   } else if (uniquePassed < 10 || successRate < 60 || premiumPasses < 3) {
  //     target = 10;
  //     label = `Reach 60% success rate`;
  //     locked = premiumPasses < 3;
  //   } else if (uniquePassed < 15 || successRate < 80 || premiumPasses < 5) {
  //     target = 15;
  //     label = `Master premium assessments`;
  //     locked = premiumPasses < 5;
  //   } else {
  //     target = uniquePassed;
  //     label = `Maintain expert status`;
  //   }

  //   const progressPercent = Math.min(100, Math.round((achieved / target) * 100));
  //   const nextGoal = label === `Maintain expert status` 
  //     ? `You've reached the highest level! Continue practicing to maintain your expertise.`
  //     : `${label} to unlock your next achievement badge.`;

  //   return { nextGoal, progressPercent, progressLabel: label, locked };
  // },

  getNextGoal(uniquePassed, successRate, premiumPasses) {
    let target = 0;
    let label = '';
    let achieved = uniquePassed;
    let locked = false;

    if (uniquePassed < 5 || premiumPasses < 1) {
      target = 5;
      label = `Progress to Intermediate (need success rate ≥ 40% and ≥1 premium passes)`;
      locked = premiumPasses < 1;
    } else if (uniquePassed < 10 || successRate < 60 || premiumPasses < 3) {
      target = 10;
      label = `Progress to Advanced (need success rate ≥ 60% and ≥3 premium passes)`;
      locked = premiumPasses < 3;
    } else if (uniquePassed < 15 || successRate < 80 || premiumPasses < 5) {
      target = 15;
      label = `Progress to Expert (need success rate ≥ 80% and ≥5 premium passes)`;
      locked = premiumPasses < 5;
    } else {
      target = uniquePassed;
      label = `You’ve reached the top!`;
    }

    const progressPercent = Math.min(100, Math.round((achieved / target) * 100));
    const nextGoal = label === `You’ve reached the top!`
      ? `You're at the top! Keep practicing to stay sharp.`
      : `Pass ${target - achieved} more unique assessments and meet success rate & premium requirements.`;

    return { nextGoal, progressPercent, progressLabel: label, locked };
  },

  initializeChart() {
    // Simple progress animation
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.width = width;
      }, 300);
    });
  },

  renderEmpty() {
    document.getElementById('page-content').innerHTML = `
      <div class="empty-dashboard">
        <div class="empty-content">
          <div class="empty-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <h2>Welcome to Your Dashboard! 🎉</h2>
          <p>Start your skill assessment journey to unlock insights and track your progress</p>
          <div class="empty-actions">
            <button class="btn btn-accent btn-large" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
              Take Your First Assessment
            </button>
            <button class="btn btn-outline btn-large" onclick="router.navigateTo('${config.ROUTES.PROFILE}')">
              Complete Your Profile
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderError() {
    document.getElementById('page-content').innerHTML = `
      <div class="error-dashboard">
        <div class="error-content">
          <div class="error-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h2>Unable to Load Dashboard</h2>
          <p>We're having trouble loading your data. Please try again later.</p>
          <button class="btn btn-primary" onclick="winsPage.load()">
            <i class="fas fa-redo"></i> Try Again
          </button>
        </div>
      </div>
    `;
  },

  
};

// 👇 Add this near the bottom of your script or in a <script> tag AFTER the HTML
// After winsPage is defined
window.openPremiumTab = function(evt, tabName) {
  document.querySelectorAll(".premium-tab").forEach(tab => tab.classList.remove("active"));
  document.querySelectorAll(".premium-tab-content").forEach(content => content.classList.remove("active"));

  evt.currentTarget.classList.add("active");
  document.getElementById(`premium-tab-${tabName}`).classList.add("active");
};