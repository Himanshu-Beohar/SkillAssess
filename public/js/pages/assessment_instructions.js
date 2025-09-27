function isMobileDevice() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

const assessmentInstructionsPage = {
  currentAssessment: null,

  async load(data) {
    const assessmentId =
      data?.id ||
      (typeof router !== "undefined" && router.getRouteParams
        ? router.getRouteParams().id
        : null);

    if (!assessmentId) {
      utils.showNotification("Assessment not specified", "error");
      router.navigateTo(config.ROUTES.ASSESSMENTS);
      return;
    }

    try {
      utils.showLoading("Loading instructions...");
      const response = await api.get(
        `/assessments/${assessmentId}/instructions`
      );
      if (!response || !response.success) {
        throw new Error(response?.error || "Failed to load instructions");
      }

      this.currentAssessment = response.data;
      this.render();
    } catch (err) {
      console.error("Error loading assessment instructions:", err);
      utils.showNotification(
        err.message || "Could not load instructions",
        "error"
      );
      router.navigateTo(config.ROUTES.ASSESSMENTS);
    } finally {
      utils.hideLoading();
    }
  },

  render() {
    const a = this.currentAssessment;
    const hasAccess = !!a.hasAccess;
    const isPremium = !!a.is_premium;

    const html = `
      <div class="page-container">
        <div class="page-header">
          <h1>${utils.escapeHtml(a.title)}</h1>
          <p>${utils.escapeHtml(a.description || "")}</p>
        </div>

        <div class="instructions-wrapper">
          <div class="instructions-card">
            <div class="instructions-left">
              <h2>Assessment Summary</h2>
              <ul class="instructions-list">
                <li><strong>Questions:</strong> ${a.num_questions || "N/A"}</li>
                <li><strong>Time Limit:</strong> ${
                  a.time_limit ? `${a.time_limit} minute(s)` : "N/A"
                }</li>
                <li><strong>Type:</strong> ${
                  isPremium ? "Premium" : "Free"
                }</li>
                ${
                  isPremium
                    ? `<li><strong>Price:</strong> ${utils.formatCurrency(
                        a.price
                      )}</li>`
                    : ""
                }

                ${
                  isPremium
                    ? `
                  <li><strong>Attempts Used:</strong> ${
                    a.attemptsUsed || 0
                  } of ${a.maxAttempts || 3}</li>
                  <li><strong>Attempts Left:</strong> ${
                    a.attemptsLeft || 0
                  }</li>
                `
                    : ""
                }
              </ul>

              
            </div>

            <div class="instructions-actions">
              ${isPremium ? (() => {
                  if (!hasAccess) {
                    return `
                      <button class="btn btn-accent btn-block" id="instruction-purchase-btn">
                        Purchase Access - ${utils.formatCurrency(a.price)}
                      </button>`;
                  } else if (a.attemptsLeft <= 0) {
                    return `
                      <button class="btn btn-accent btn-block" id="instruction-repurchase-btn">
                        Repurchase Access - ${utils.formatCurrency(a.price)}
                      </button>`;
                  } else {
                    return `
                      <button class="btn btn-primary btn-block" id="instruction-start-btn">
                        Start Assessment (${a.attemptsLeft} attempt(s) left)
                      </button>`;
                  }
                })()
                : `
                  <button class="btn btn-primary btn-block" id="instruction-start-btn">
                    Start Assessment
                  </button>`
              }
              <button class="btn btn-outline btn-block" id="instruction-back-btn">
                Back to Assessments
              </button>
              <div class="instructions-notes">
                <p><strong>Important:</strong> Once you click <em>Start Assessment</em> the timer will begin immediately. Do not refresh or close the tab during the test.</p>
            </div>
            </div>
          </div>
        </div>

        <div class="instructions-violations">
          <h3>⚠️ Important – Anti-Cheating Rules</h3>
          <ul>
            <li>🔒 This assessment will run in <strong>Full-Screen Mode</strong>. If you exit full-screen, your attempt may be <strong>terminated</strong>.</li>
            <li>📋 <strong>Copy, paste, right-click, and print-screen</strong> are disabled during the test. Doing so will be treated as violation.</li>
            <li>🚫 <strong>Switching tabs, applications, or minimizing</strong> the browser will be treated as a violation.</li>
            <li>⏱️ Each violation will be logged. Multiple violations can lead to <strong>cancellation of your attempt</strong>.</li>
            <li>✅ Stay focused and complete the test in the given time without refreshing or closing the window.</li>
          </ul>
          <p class="violation-note">
            By clicking <strong>Start Assessment</strong>, you agree to follow these rules. Violations may result in loss of attempts and require you to repurchase the assessment.
          </p>
        </div>
      </div>
    `;

    document.getElementById("page-content").innerHTML = html;

    // Event listeners
    const backBtn = document.getElementById("instruction-back-btn");
    if (backBtn)
      backBtn.addEventListener("click", () =>
        router.navigateTo(config.ROUTES.ASSESSMENTS)
      );

    if (isPremium) {
      if (!hasAccess) {
        const purchaseBtn = document.getElementById("instruction-purchase-btn");
        if (purchaseBtn)
          purchaseBtn.addEventListener("click", () => {
            router.navigateTo(`/payment/${a.id}`);
          });
      } else if (a.attemptsLeft <= 0) {
        const repurchaseBtn = document.getElementById("instruction-repurchase-btn");
        if (repurchaseBtn)
          repurchaseBtn.addEventListener("click", () => {
            router.navigateTo(`/payment/${a.id}`);
          });
      } else {
        const startBtn = document.getElementById("instruction-start-btn");
        if (startBtn) {
            startBtn.addEventListener("click", async () => {
                console.log("📱 User Agent:", navigator.userAgent);
                console.log("📱 Detected mobile:", isMobileDevice());
                // 📱 Block mobile users here
                if (isMobileDevice()) {
                    utils.showNotification(
                        "📵 To start the assessment, please use a laptop or desktop computer.",
                        "warning"
                    );
                    return;
                }

                try {
                    // Reset assessment state
                    if (typeof assessmentPage !== "undefined" && assessmentPage.resetState) {
                        assessmentPage.resetState();
                    }
                    
                    // Store assessment ID for the assessment page
                    sessionStorage.setItem('currentAssessmentId', a.id);
                    
                    // 🔹 START LOCKDOWN IMMEDIATELY (while still in user gesture context)
                    console.log('Starting lockdown before navigation...');
                    await startLockdown(a.id, { maxViolations: 3, autoSubmitOnViolations: true });
                    
                    // 🔹 Navigate after lockdown starts successfully
                    router.navigateTo(`/assessment/${a.id}`);
                    
                } catch (err) {
                    console.error("Lockdown failed:", err);
                    utils.showNotification("Could not start secure assessment. Please allow fullscreen.", "error");
                    
                    // Stop lockdown if it partially started
                    if (typeof Lockdown !== "undefined" && Lockdown.stop) {
                        Lockdown.stop();
                    }
                }
            });
        }
    }
    } else {
        const startBtn = document.getElementById("instruction-start-btn");
        if (startBtn) {
            startBtn.addEventListener("click", async () => {

                if (isMobileDevice()) {
                    utils.showNotification("📵 To start the assessment, please use a laptop or desktop computer.", "warning");
                    return; // ⛔ Stop execution here
                }
                try {
                    if (typeof assessmentPage !== "undefined" && assessmentPage.resetState) {
                        assessmentPage.resetState();
                    }
                    
                    // 🔹 START LOCKDOWN IMMEDIATELY (while still in user gesture context)
                    console.log('Starting lockdown before navigation...');
                    await startLockdown(a.id, { maxViolations: 3, autoSubmitOnViolations: true });
                    
                    // 🔹 Navigate after lockdown starts successfully
                    router.navigateTo(`/assessment/${a.id}`);
                    
                } catch (err) {
                    console.error("Lockdown failed:", err);
                    utils.showNotification("Could not start secure assessment. Please allow fullscreen.", "error");
                    
                    // Stop lockdown if it partially started
                    if (typeof Lockdown !== "undefined" && Lockdown.stop) {
                        Lockdown.stop();
                    }
                }
            });
        }
    }
  }
};