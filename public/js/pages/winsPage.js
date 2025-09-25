// public/js/pages/winsPage.js
const winsPage = {
  results: [],

  // Define premium assessments (titles must match your DB titles)
  premiumAssessments: [
    'JavaScript Advanced Concepts',
    'SQL Advanced Mastery',
    'Python Advanced Programming',
    'Data Structures & Algorithms',
    'Software Testing & Quality Assurance',
    'Machine Learning Fundamentals',
    'Cloud Architecture & Design',
    'Cloud Computing & DevOps',
    'Generative AI & Prompt Engineering',
    'Engineer’s Kickstart Program 2025',
    'Scrum Mastery'
  ],

  async load() {
    try {
      utils.showLoading('Loading your achievements...');
      const response = await api.get('/results/my-results');

      if (response.success) {
        this.results = response.data.results || [];
        this.render();
      } else {
        this.renderEmpty();
      }
    } catch (err) {
      console.error('Error loading Wins page:', err);
      utils.showNotification('Failed to load achievements', 'error');
      this.renderError();
    } finally {
      utils.hideLoading();
    }
  },

  render() {
    const { successRate, uniqueTotal, uniquePassed, totalAttempts, totalPasses, premiumPasses } = this.calculateSuccessRate();
    const level = this.getPerformanceLevel();
    const { nextGoal, progressPercent, progressLabel, locked } = this.getNextGoal(uniquePassed, successRate, premiumPasses);


    // Determine badge icon based on level
    const badgeIcon = this.getBadgeIcon(level);
    

    const html = `
      <div class="wins-container">
        <div class="wins-header">
            <h1>🎉 Your Wins & Achievements</h1>
            <p>Track your progress, badges, and rewards journey with Skillassess</p>
        </div>

        <div class="badge-display">
            <i class="fas ${badgeIcon}"></i> ${level}
        </div>

        <div class="next-goal-card">
            <h2>🚀 Your Next Goal</h2>
            <p>${nextGoal}</p>
            ${locked ? `
            <div class="premium-lock">
                <i class="fas fa-lock"></i> 
                <span>You need a Premium Pass to unlock your next badge</span>
                <button class="btn btn-warning" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
                🔓 Unlock Premium
                </button>
            </div>
            ` : ''}
            <div class="progress-bar">
                <div class="progress-fill" style="width:${progressPercent}%"></div>
            </div>
            <small>${progressLabel} - ${progressPercent}% complete</small>
        </div>

        <div class="analytics-grid">
            <div class="analytics-card">
                <i class="fas fa-clipboard-list"></i>
                <div class="value">${totalAttempts}</div>
                <div class="label">Total Attempts</div>
            </div>
            <div class="analytics-card">
                <i class="fas fa-layer-group"></i>
                <div class="value">${uniqueTotal}</div>
                <div class="label">Unique Attempted</div>
            </div>
            <div class="analytics-card">
                <i class="fas fa-check-circle"></i>
                <div class="value">${uniquePassed}</div>
                <div class="label">Unique Passed</div>
            </div>
            <div class="analytics-card">
                <i class="fas fa-star"></i>
                <div class="value">${premiumPasses}</div>
                <div class="label">Premium Passes</div>
            </div>
            <div class="analytics-card">
                <i class="fas fa-chart-line"></i>
                <div class="value">${successRate}%</div>
                <div class="label">Success Rate</div>
            </div>
        </div>

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

        <!-- Recent Results Table -->
        ${this.renderRecentResults()}
      </div>
    `;

    document.getElementById('page-content').innerHTML = html;
  },

  getBadgeIcon(level) {
    switch(level) {
      case 'Expert Level': return 'fa-crown';
      case 'Advanced': return 'fa-trophy';
      case 'Intermediate': return 'fa-award';
      default: return 'fa-star';
    }
  },

  renderRecentResults() {
    if (this.results.length === 0) return '';

    const recentResults = this.results.slice(0, 5);
    

    return `
      <div class="recent-results">
          <h3>📊 Recent Assessments</h3>
          <div class="results-table">
              <table>
                  <thead>
                      <tr>
                          <th>Assessment</th>
                          <th>Date</th>
                          <th>Score</th>
                          <th>Status</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${recentResults.map(result => {
                        const percentage = Math.round((result.score / result.total_questions) * 100);
                        const passed = percentage >= 60;
                        //const date = new Date(result.submitted_at).toLocaleDateString();
                        console.log("Result submitted_at:", result.submitted_at);
                        let date = 'N/A';
                        const rawDate = result.submitted_at || result.created_at || result.updated_at;

                        if (rawDate) {
                        const parsedDate = new Date(rawDate);
                        if (!isNaN(parsedDate)) {
                            date = parsedDate.toLocaleDateString();
                        }
                        }
                        
                        return `
                            <tr>
                                <td>${result.assessment_title || 'Assessment'}</td>
                                <td>${date}</td>
                                <td>${percentage}%</td>
                                <td>
                                    <span class="status ${passed ? 'passed' : 'failed'}">
                                        ${passed ? '✅ Passed' : '❌ Failed'}
                                    </span>
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

  renderEmpty() {
    document.getElementById('page-content').innerHTML = `
      <div class="empty-state">
        <h2>No Wins Yet 😢</h2>
        <p>Start your first assessment today to begin your journey.</p>
        <button class="btn btn-primary" onclick="router.navigateTo('${config.ROUTES.ASSESSMENTS}')">
          Take an Assessment
        </button>
      </div>
    `;
  },

  renderError() {
    document.getElementById('page-content').innerHTML = `
      <div class="error-state">
        <h2>⚠️ Something went wrong</h2>
        <p>Could not load your wins right now. Try again later.</p>
      </div>
    `;
  },

  calculateSuccessRate() {
    if (this.results.length === 0) return { successRate: 0, uniqueTotal: 0, uniquePassed: 0, totalAttempts: 0, totalPasses: 0, premiumPasses: 0 };

    const assessmentMap = new Map();
    this.results.forEach(result => {
      const percentage = Math.round((result.score / result.total_questions) * 100);
      const passed = percentage >= 60;

      if (!assessmentMap.has(result.assessment_id)) {
        assessmentMap.set(result.assessment_id, { attempts: 0, passes: 0, title: result.assessment_title });
      }
      const stats = assessmentMap.get(result.assessment_id);
      stats.attempts++;
      if (passed) stats.passes++;
      assessmentMap.set(result.assessment_id, stats);
    });

    const uniqueTotal = assessmentMap.size;
    const uniquePassed = Array.from(assessmentMap.values()).filter(stat => stat.passes > 0).length;

    const totalAttempts = Array.from(assessmentMap.values()).reduce((s, st) => s + st.attempts, 0);
    const totalPasses = Array.from(assessmentMap.values()).reduce((s, st) => s + st.passes, 0);

    const coverage = uniqueTotal > 0 ? uniquePassed / uniqueTotal : 0;
    const consistency = totalAttempts > 0 ? totalPasses / totalAttempts : 0;
    const successRate = Math.round(coverage * 100 * consistency);

    // Count premium passes
    let premiumPasses = 0;
    assessmentMap.forEach(stat => {
      if (this.premiumAssessments.includes(stat.title) && stat.passes > 0) {
        premiumPasses++;
      }
    });

    return { successRate, uniqueTotal, uniquePassed, totalAttempts, totalPasses, premiumPasses };
  },

  getPerformanceLevel() {
    const { successRate, uniquePassed, premiumPasses } = this.calculateSuccessRate();

    if (uniquePassed >= 15 && successRate >= 80 && premiumPasses >= 5) return 'Expert Level';
    if (uniquePassed >= 10 && successRate >= 60 && premiumPasses >= 3) return 'Advanced';
    if (uniquePassed >= 5 && successRate >= 40 && premiumPasses >= 1) return 'Intermediate';
    return 'Beginner';
  },

  getNextGoal(uniquePassed, successRate, premiumPasses) {
    let target = 0;
    let label = '';
    let achieved = uniquePassed;
    let locked = false;

    if (uniquePassed < 5 || premiumPasses < 1) {
        target = 5;
        label = `Progress to Intermediate (need ≥1 premium pass)`;
        locked = premiumPasses < 1; // lock if no premium
    } else if (uniquePassed < 10 || successRate < 60 || premiumPasses < 3) {
        target = 10;
        label = `Progress to Advanced (need ≥3 premium passes)`;
        locked = premiumPasses < 3;
    } else if (uniquePassed < 15 || successRate < 80 || premiumPasses < 5) {
        target = 15;
        label = `Progress to Expert (need ≥5 premium passes)`;
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

};
