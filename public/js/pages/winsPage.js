// public/js/pages/winsPage.js
const winsPage = {
  results: [],

  // In winsPage.js - UPDATE the load method to debug API response
  async load() {
      try {
          utils.showLoading('Loading your achievements...');
          const response = await api.get('/results/my-results');

          console.log('Wins API Response:', response); // Debug log

          if (response.success) {
              this.results = response.data.results || [];
              console.log('Results data loaded:', this.results); // Debug log
              this.render();
          } else {
              console.warn('Wins API returned unsuccessful:', response);
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

  // In winsPage.js - UPDATE the render method to use actual data
render() {
    const { successRate, uniqueTotal, uniquePassed, totalAttempts, totalPasses } = this.calculateSuccessRate();
    const level = this.getPerformanceLevel();
    const { nextGoal, progressPercent, progressLabel } = this.getNextGoal(uniquePassed, successRate);

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
                <i class="fas fa-chart-line"></i>
                <div class="value">${successRate}%</div>
                <div class="label">Success Rate</div>
            </div>
        </div>

        <div class="info-section">
            <h3>🥇 How Badges Work</h3>
            <ul>
                <li><b>Beginner:</b> Default level for all users</li>
                <li><b>Intermediate:</b> 5+ unique passes with 40%+ success rate</li>
                <li><b>Advanced:</b> 10+ unique passes with 60%+ success rate</li>
                <li><b>Expert:</b> 15+ unique passes with 80%+ success rate</li>
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

// ADD this helper method to get badge icons
getBadgeIcon(level) {
    switch(level) {
        case 'Expert Level': return 'fa-crown';
        case 'Advanced': return 'fa-trophy';
        case 'Intermediate': return 'fa-award';
        default: return 'fa-star';
    }
},

  // ADD this method to show recent results
  renderRecentResults() {
      if (this.results.length === 0) return '';

      const recentResults = this.results.slice(0, 5); // Show last 5 results

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
                              const date = new Date(result.submitted_at).toLocaleDateString();
                              
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

  // Same empty/error methods as before
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
    if (this.results.length === 0) return { successRate: 0, uniqueTotal: 0, uniquePassed: 0 };

    const assessmentMap = new Map();
    this.results.forEach(result => {
      const percentage = Math.round((result.score / result.total_questions) * 100);
      const passed = percentage >= 60;

      if (!assessmentMap.has(result.assessment_id)) {
        assessmentMap.set(result.assessment_id, { attempts: 0, passes: 0 });
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

    return { successRate, uniqueTotal, uniquePassed, totalAttempts, totalPasses };
  },

  getPerformanceLevel() {
    const { successRate, uniqueTotal } = this.calculateSuccessRate();
    if (uniqueTotal >= 15 && successRate >= 80) return 'Expert Level';
    if (uniqueTotal >= 10 && successRate >= 60) return 'Advanced';
    if (uniqueTotal >= 5 && successRate >= 40) return 'Intermediate';
    return 'Beginner';
  },

  getNextGoal(uniquePassed, successRate) {
    let target = 0;
    let label = '';
    let achieved = 0;

    if (uniquePassed < 5) {
      target = 5;
      achieved = uniquePassed;
      label = `Progress to Intermediate`;
    } else if (uniquePassed < 10 || successRate < 60) {
      target = 10;
      achieved = uniquePassed;
      label = `Progress to Advanced`;
    } else if (uniquePassed < 15 || successRate < 80) {
      target = 15;
      achieved = uniquePassed;
      label = `Progress to Expert`;
    } else {
      target = uniquePassed;
      achieved = uniquePassed;
      label = `You’ve reached the top!`;
    }

    const progressPercent = Math.min(100, Math.round((achieved / target) * 100));
    const nextGoal = label === `You’ve reached the top!`
      ? `You're at the top! Keep practicing to stay sharp.`
      : `Pass ${target - achieved} more unique assessments and maintain required success rate.`;

    return { nextGoal, progressPercent, progressLabel: label };
  }
};
