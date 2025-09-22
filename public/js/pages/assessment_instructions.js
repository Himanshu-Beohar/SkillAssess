// // // public/js/pages/assessmentInstructionsPage.js
// // const assessmentInstructionsPage = {
// //   currentAssessment: null,

// //   async load(data) {
// //     const assessmentId = data?.id || (typeof router !== 'undefined' && router.getRouteParams ? router.getRouteParams().id : null);
// //     if (!assessmentId) {
// //       utils.showNotification('Assessment not specified', 'error');
// //       router.navigateTo(config.ROUTES.ASSESSMENTS);
// //       return;
// //     }

// //     try {
// //       utils.showLoading('Loading instructions...');
// //       const response = await api.get(`/assessments/${assessmentId}/instructions`);
// //       if (!response || !response.success) {
// //         throw new Error(response?.error || 'Failed to load instructions');
// //       }

// //       // API returns data as { ...assessment, hasAccess }
// //       this.currentAssessment = response.data;
// //       this.render();
// //     } catch (err) {
// //       console.error('Error loading assessment instructions:', err);
// //       utils.showNotification(err.message || 'Could not load instructions', 'error');
// //       router.navigateTo(config.ROUTES.ASSESSMENTS);
// //     } finally {
// //       utils.hideLoading();
// //     }
// //   },

// //   render() {
// //     const a = this.currentAssessment;
// //     const hasAccess = !!a.hasAccess;
// //     const isPremium = !!a.is_premium;

// //     const html = `
// //       <div class="page-container">
// //         <div class="page-header">
// //           <h1>${utils.escapeHtml(a.title)}</h1>
// //           <p>${utils.escapeHtml(a.description || '')}</p>
// //         </div>

// //         <div class="instructions-wrapper">
// //           <div class="instructions-card">
// //             <div class="instructions-left">
// //               <h2>Assessment Summary</h2>
// //               <ul class="instructions-list">
// //                 <li><strong>Questions:</strong> ${a.num_questions || 'N/A'}</li>
// //                 <li><strong>Time Limit:</strong> ${a.time_limit ? `${a.time_limit} minute(s)` : 'N/A'}</li>
// //                 <li><strong>Type:</strong> ${isPremium ? 'Premium' : 'Free'}</li>
// //                 ${isPremium ? `<li><strong>Price:</strong> ${utils.formatCurrency(a.price)}</li>` : ''}
// //               </ul>

// //               <div class="instructions-notes">
// //                 <p><strong>Important:</strong> Once you click <em>Start Assessment</em> the timer will begin immediately. Do not refresh or close the tab during the test.</p>
// //               </div>
// //             </div>

// //             <div class="instructions-actions">
// //               ${isPremium && !hasAccess ? `
// //                 <button class="btn btn-accent btn-block" id="instruction-purchase-btn">
// //                   Purchase Access - ${utils.formatCurrency(a.price)}
// //                 </button>
// //               ` : `
// //                 <button class="btn btn-primary btn-block" id="instruction-start-btn">
// //                   Start Assessment
// //                 </button>
// //               `}
// //               <button class="btn btn-outline btn-block" id="instruction-back-btn">
// //                 Back to Assessments
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     `;

// //     document.getElementById('page-content').innerHTML = html;

// //     // Event listeners
// //     const backBtn = document.getElementById('instruction-back-btn');
// //     if (backBtn) backBtn.addEventListener('click', () => router.navigateTo(config.ROUTES.ASSESSMENTS));

// //     if (isPremium && !hasAccess) {
// //       const purchaseBtn = document.getElementById('instruction-purchase-btn');
// //       if (purchaseBtn) purchaseBtn.addEventListener('click', () => {
// //         // navigate to existing payment route — keep same flow as your app uses
// //         router.navigateTo(`/payment/${a.id}`);
// //       });
// //     } else {
// //       const startBtn = document.getElementById('instruction-start-btn');
// //       if (startBtn) startBtn.addEventListener('click', () => {
// //         // navigate to assessment start route (your existing assessment page)
// //         router.navigateTo(`/assessment/${a.id}`);
// //       });
// //     }
// //   }
// // };


// // public/js/pages/assessment_instructions.js
// const assessmentInstructionsPage = {
//   currentAssessment: null,

//   async load(data) {
//     const assessmentId =
//       data?.id ||
//       (typeof router !== "undefined" &&
//       router.getRouteParams
//         ? router.getRouteParams().id
//         : null);

//     if (!assessmentId) {
//       utils.showNotification("Assessment not specified", "error");
//       router.navigateTo(config.ROUTES.ASSESSMENTS);
//       return;
//     }

//     try {
//       utils.showLoading("Loading instructions...");
//       const response = await api.get(`/assessments/${assessmentId}/instructions`);
//       if (!response || !response.success) {
//         throw new Error(response?.error || "Failed to load instructions");
//       }

//       // API returns { ...assessment, hasAccess, attemptsUsed, maxAttempts }
//       this.currentAssessment = response.data;
//       this.render();
//     } catch (err) {
//       console.error("Error loading assessment instructions:", err);
//       utils.showNotification(err.message || "Could not load instructions", "error");
//       router.navigateTo(config.ROUTES.ASSESSMENTS);
//     } finally {
//       utils.hideLoading();
//     }
//   },

//   render() {
//     const a = this.currentAssessment;
//     const hasAccess = !!a.hasAccess;
//     const isPremium = !!a.is_premium;

//     // Default attempts
//     const maxAttempts = a.maxAttempts || 3;
//     const attemptsUsed = a.attemptsUsed || 0;
//     const remainingAttempts = Math.max(maxAttempts - attemptsUsed, 0);

//     const html = `
//       <div class="page-container">
//         <div class="page-header">
//           <h1>${utils.escapeHtml(a.title)}</h1>
//           <p>${utils.escapeHtml(a.description || "")}</p>
//         </div>

//         <div class="instructions-wrapper">
//           <div class="instructions-card">
//             <div class="instructions-left">
//               <h2>Assessment Summary</h2>
//               <ul class="instructions-list">
//                 <li><strong>Questions:</strong> ${a.num_questions || "N/A"}</li>
//                 <li><strong>Time Limit:</strong> ${
//                   a.time_limit ? `${a.time_limit} minute(s)` : "N/A"
//                 }</li>
//                 <li><strong>Type:</strong> ${isPremium ? "Premium" : "Free"}</li>
//                 ${
//                   isPremium
//                     ? `<li><strong>Price:</strong> ${utils.formatCurrency(a.price)}</li>
//                        <li><strong>Attempts Left:</strong> ${remainingAttempts} of ${maxAttempts}</li>`
//                     : ""
//                 }
//               </ul>

//               <div class="instructions-notes">
//                 <p><strong>Important:</strong> Once you click <em>Start Assessment</em> the timer will begin immediately. Do not refresh or close the tab during the test.</p>
//               </div>
//             </div>

//             <div class="instructions-actions">
//               ${
//                 isPremium && !hasAccess
//                   ? `
//                     <button class="btn btn-accent btn-block" id="instruction-purchase-btn">
//                       Purchase Access - ${utils.formatCurrency(a.price)}
//                     </button>
//                   `
//                   : remainingAttempts > 0
//                   ? `
//                     <button class="btn btn-primary btn-block" id="instruction-start-btn">
//                       Start Assessment
//                     </button>
//                   `
//                   : `
//                     <button class="btn btn-secondary btn-block" disabled>
//                       No Attempts Left
//                     </button>
//                     <p class="attempts-note">You have reached the maximum number of attempts. Please purchase again to continue.</p>
//                   `
//               }
//               <button class="btn btn-outline btn-block" id="instruction-back-btn">
//                 Back to Assessments
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     `;

//     document.getElementById("page-content").innerHTML = html;

//     // Event listeners
//     const backBtn = document.getElementById("instruction-back-btn");
//     if (backBtn) backBtn.addEventListener("click", () => router.navigateTo(config.ROUTES.ASSESSMENTS));

//     if (isPremium && !hasAccess) {
//       const purchaseBtn = document.getElementById("instruction-purchase-btn");
//       if (purchaseBtn) {
//         purchaseBtn.addEventListener("click", () => {
//           router.navigateTo(`/payment/${a.id}`);
//         });
//       }
//     } else if (remainingAttempts > 0) {
//       const startBtn = document.getElementById("instruction-start-btn");
//       if (startBtn) {
//         startBtn.addEventListener("click", () => {
//           router.navigateTo(`/assessment/${a.id}`);
//         });
//       }
//     }
//   },
// };


// public/js/pages/assessment_instructions.js
// const assessmentInstructionsPage = {
//   currentAssessment: null,

//   async load(data) {
//     const assessmentId = data?.id || (typeof router !== 'undefined' && router.getRouteParams ? router.getRouteParams().id : null);
//     if (!assessmentId) {
//       utils.showNotification('Assessment not specified', 'error');
//       router.navigateTo(config.ROUTES.ASSESSMENTS);
//       return;
//     }

//     try {
//       utils.showLoading('Loading instructions...');
//       const response = await api.get(`/assessments/${assessmentId}/instructions`);
//       if (!response || !response.success) {
//         throw new Error(response?.error || 'Failed to load instructions');
//       }

//       this.currentAssessment = response.data;
//       this.render();
//     } catch (err) {
//       console.error('Error loading assessment instructions:', err);
//       utils.showNotification(err.message || 'Could not load instructions', 'error');
//       router.navigateTo(config.ROUTES.ASSESSMENTS);
//     } finally {
//       utils.hideLoading();
//     }
//   },

//   render() {
//     const a = this.currentAssessment;
//     const hasAccess = !!a.hasAccess;
//     const isPremium = !!a.is_premium;

//     const html = `
//       <div class="page-container">
//         <div class="page-header">
//           <h1>${utils.escapeHtml(a.title)}</h1>
//           <p>${utils.escapeHtml(a.description || '')}</p>
//         </div>

//         <div class="instructions-wrapper">
//           <div class="instructions-card">
//             <div class="instructions-left">
//               <h2>Assessment Summary</h2>
//               <ul class="instructions-list">
//                 <li><strong>Questions:</strong> ${a.num_questions || 'N/A'}</li>
//                 <li><strong>Time Limit:</strong> ${a.time_limit ? `${a.time_limit} minute(s)` : 'N/A'}</li>
//                 <li><strong>Type:</strong> ${isPremium ? 'Premium' : 'Free'}</li>
//                 ${isPremium ? `<li><strong>Price:</strong> ${utils.formatCurrency(a.price)}</li>` : ''}

//                 ${isPremium ? `
//                   <li><strong>Attempts Used:</strong> ${a.attemptsUsed || 0} of ${a.maxAttempts || 3}</li>
//                   <li><strong>Attempts Left:</strong> ${a.attemptsLeft || 0}</li>
//                 ` : ''}
//               </ul>

//               <div class="instructions-notes">
//                 <p><strong>Important:</strong> Once you click <em>Start Assessment</em> the timer will begin immediately. Do not refresh or close the tab during the test.</p>
//               </div>
//             </div>

//             <div class="instructions-actions">
//               ${isPremium && !hasAccess ? `
//                 <button class="btn btn-accent btn-block" id="instruction-purchase-btn">
//                   Purchase Access - ${utils.formatCurrency(a.price)}
//                 </button>
//               ` : `
//                 <button class="btn btn-primary btn-block" id="instruction-start-btn" ${isPremium && a.attemptsLeft <= 0 ? 'disabled' : ''}>
//                   ${isPremium && a.attemptsLeft <= 0 ? 'No Attempts Left' : 'Start Assessment'}
//                 </button>
//               `}
//               <button class="btn btn-outline btn-block" id="instruction-back-btn">
//                 Back to Assessments
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     `;

//     document.getElementById('page-content').innerHTML = html;

//     // Event listeners
//     const backBtn = document.getElementById('instruction-back-btn');
//     if (backBtn) backBtn.addEventListener('click', () => router.navigateTo(config.ROUTES.ASSESSMENTS));

//     if (isPremium && !hasAccess) {
//       const purchaseBtn = document.getElementById('instruction-purchase-btn');
//       if (purchaseBtn) purchaseBtn.addEventListener('click', () => {
//         router.navigateTo(`/payment/${a.id}`);
//       });
//     } else {
//       const startBtn = document.getElementById('instruction-start-btn');
//       if (startBtn && !(isPremium && a.attemptsLeft <= 0)) {
//         startBtn.addEventListener('click', () => {
//           router.navigateTo(`/assessment/${a.id}`);
//         });
//       }
//     }
//   }
// };


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
                        Start Assessment
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
              <li>🔒 This assessment will run in <strong>Full-Screen Mode</strong>. 
                  If you exit full-screen, your attempt may be <strong>terminated</strong>.</li>
              <li>📋 <strong>Copy, paste, right-click, and print-screen</strong> are disabled during the test.</li>
              <li>🚫 <strong>Switching tabs, applications, or minimizing</strong> the browser will be treated as a violation.</li>
              <li>⏱️ Each violation will be logged. Multiple violations can lead to <strong>cancellation of your attempt</strong>.</li>
              <li>✅ Stay focused and complete the test in the given time without refreshing or closing the window.</li>
            </ul>
            <p class="violation-note">
              By clicking <strong>Start Assessment</strong>, you agree to follow these rules. 
              Violations may result in loss of attempts and require you to repurchase the assessment.
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
        const purchaseBtn = document.getElementById(
          "instruction-purchase-btn"
        );
        if (purchaseBtn)
          purchaseBtn.addEventListener("click", () => {
            router.navigateTo(`/payment/${a.id}`);
          });
      } else if (a.attemptsLeft <= 0) {
        const repurchaseBtn = document.getElementById(
          "instruction-repurchase-btn"
        );
        if (repurchaseBtn)
          repurchaseBtn.addEventListener("click", () => {
            router.navigateTo(`/payment/${a.id}`);
          });
      } else {
        const startBtn = document.getElementById("instruction-start-btn");
        if (startBtn)
          startBtn.addEventListener("click", () => {
            router.navigateTo(`/assessment/${a.id}`);
          });
      }
    } else {
      // const startBtn = document.getElementById("instruction-start-btn");
      // if (startBtn)
      //   // startBtn.addEventListener("click", () => {
      //   //   router.navigateTo(`/assessment/${a.id}`);
      //   // });
      //   // inside assessmentInstructionsPage.render() start button listener:
      //   startBtn.addEventListener('click', async () => {
      //     try {
      //       // start server-side session if needed, then start lockdown
      //       await startLockdown(a.id, { maxViolations: 3, autoSubmitOnViolations: true });
      //       // after Lockdown.start returns, navigate to actual assessment runner page if different
      //       router.navigateTo(`/assessment/${a.id}`);
      //     } catch (err) {
      //       utils.showNotification('Could not start secure assessment. Please allow fullscreen.', 'error');
      //     }
      //   });

      const startBtn = document.getElementById("instruction-start-btn");
      if (startBtn) {
        startBtn.addEventListener("click", async () => {
          try {
            // 🚨 Tell backend to create a new attempt
            //await api.post(`/assessments/${a.id}/start`, { newAttempt: true });
            await api.get(`/assessments/${a.id}/start?newAttempt=true`);

            // 🚨 Reset client-side state before loading assessment
            if (typeof assessmentPage !== "undefined" && assessmentPage.resetState) {
              assessmentPage.resetState();
            }

            // Start lockdown (fullscreen etc.)
            await startLockdown(a.id, { maxViolations: 3, autoSubmitOnViolations: true });

            // Navigate to assessment runner
            router.navigateTo(`/assessment/${a.id}`);
          } catch (err) {
            console.error("Error starting assessment:", err);
            utils.showNotification("Could not start assessment. Please try again.", "error");
          }
        });
      }

    }
  },
};
