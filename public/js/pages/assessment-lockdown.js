/* assessment-lockdown.js
   Usage:
     - import or include this script on your assessment page
     - call await startLockdown(assessmentId, {autoSubmitOnViolations: true, maxViolations: 3})
*/

const Lockdown = {
  assessmentId: null,
  violations: 0,
  maxViolations: 3,
  violationLog: [],
  startedAt: null,
  checkInterval: null,
  autoSubmit: true,
  enabled: false,

  // Call this to start enforcement (await for fullscreen)
  // In assessment-lockdown.js - UPDATE the start method with better user gesture handling
  async start(assessmentId, opts = {}) {
      // Don't start if we're not on an assessment page (but allow starting from instructions page)
      if (!window.location.pathname.includes('/assessment/') && 
          !window.location.pathname.includes('/instructions')) {
          console.warn('Lockdown not started: Not on assessment-related page');
          return;
      }
      
      try {
          this.assessmentId = assessmentId;
          this.maxViolations = opts.maxViolations ?? 3;
          this.autoSubmit = opts.autoSubmitOnViolations ?? true;
          this.violations = 0;
          this.violationLog = [];
          this.startedAt = Date.now();
          this.enabled = true;

          // Validate assessment ID
          if (!assessmentId) {
              throw new Error('Assessment ID is required');
          }

          console.log('Requesting fullscreen...');
          
          // 🔹 Request full screen IMMEDIATELY (within user gesture context)
          await this.requestFullScreen();
          
          console.log('Fullscreen granted, setting up lockdown...');
          
          // Wait a bit to ensure fullscreen is stable
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Verify we're actually in fullscreen
          const isFullscreen = this.getFullscreenStatus();
          if (!isFullscreen) {
              throw new Error('Fullscreen mode not active');
          }

          // Register event listeners
          this.addListeners();

          // Start periodic check
          this.checkInterval = setInterval(() => this.periodicCheck(), 2000);

          console.log('Lockdown started successfully');
          return true;
          
      } catch (err) {
          this.enabled = false;
          console.error('Lockdown start failed:', err);
          
          // Clean up on failure
          this.stop();
          throw err;
      }
  },

  // Stop enforcement (called after submit).
  stop() {
    this.enabled = false;
    this.removeListeners();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.getFullscreenStatus()) {
      this.exitFullScreen().catch(err => {
        console.warn('Error exiting fullscreen:', err);
      });
    }
  },

  // Request fullscreen on documentElement
  async requestFullScreen() {
    return new Promise((resolve, reject) => {
      const el = document.documentElement;
      
      // Check if already in fullscreen
      if (this.getFullscreenStatus()) {
        resolve(true);
        return;
      }
      
      const onFullscreenChange = () => {
        if (this.getFullscreenStatus()) {
          // Clean up event listeners
          document.removeEventListener('fullscreenchange', onFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
          resolve(true);
        }
      };
      
      // Set timeout for fullscreen request
      const timeoutId = setTimeout(() => {
        document.removeEventListener('fullscreenchange', onFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
        reject(new Error('Fullscreen request timed out'));
      }, 2000);
      
      // Add event listeners
      document.addEventListener('fullscreenchange', onFullscreenChange);
      document.addEventListener('webkitfullscreenchange', onFullscreenChange);
      
      // Request fullscreen
      try {
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(reject);
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen().catch(reject);
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen().catch(reject);
        } else {
          clearTimeout(timeoutId);
          reject(new Error('Fullscreen API not supported'));
        }
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  },

  // Exit fullscreen programmatically (if needed)
  async exitFullScreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
  },

  // Check fullscreen status
  getFullscreenStatus() {
    return !!(document.fullscreenElement || 
              document.webkitFullscreenElement || 
              document.msFullscreenElement);
  },

  addListeners() {
    // fullscreen state change
    this._fsHandler = () => {
      const fs = this.getFullscreenStatus();
      if (!fs && this.enabled) {
        this.logViolation('exit_fullscreen', 'User left fullscreen');
        // immediate auto-submit on fullscreen exit
        this.handleMaxViolationsCheck();
      }
    };
    document.addEventListener('fullscreenchange', this._fsHandler);
    document.addEventListener('webkitfullscreenchange', this._fsHandler);
    document.addEventListener('msfullscreenchange', this._fsHandler);

    // visibility change (tab switch, minimize)
    this._visibilityHandler = () => {
      if (document.hidden && this.enabled) {
        this.logViolation('visibility_hidden', 'Tab is hidden or minimized');
        this.handleMaxViolationsCheck();
      }
    };
    document.addEventListener('visibilitychange', this._visibilityHandler);

    // window blur (loss of window focus)
    this._blurHandler = () => {
      if (this.enabled) {
        this.logViolation('window_blur', 'Window lost focus (blur)');
        this.handleMaxViolationsCheck();
      }
    };
    window.addEventListener('blur', this._blurHandler);

    // detect keydown combos and PrintScreen
    this._keyHandler = (e) => {
      // Block common shortcuts: Ctrl/Cmd+C, V, X, S, P (save/print), F12, Ctrl+Tab detection (hard to catch)
      const ctrl = e.ctrlKey || e.metaKey;

      // PrintScreen detection (not reliable, but we can log)
      if (e.key === 'PrintScreen' || e.key === 'PrintScr' || e.code === 'PrintScreen') {
        e.preventDefault?.();
        this.logViolation('printscreen', 'PrintScreen key pressed');
        this.handleMaxViolationsCheck();
        return;
      }

      if (ctrl) {
        const blocked = ['c','v','x','a','s','p','C','V','X','A','S','P'];
        if (blocked.includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          this.logViolation('copy_paste_shortcut', `Blocked shortcut: ${e.key}`);
          this.handleMaxViolationsCheck();
          return;
        }
      }

      // block F12 (devtools)
      if (e.key === 'F12') {
        e.preventDefault();
        this.logViolation('devtools_open', 'F12 pressed');
        this.handleMaxViolationsCheck();
        return;
      }
    };
    document.addEventListener('keydown', this._keyHandler, true);

    // block right-click context menu
    this._contextHandler = (e) => {
      e.preventDefault();
      this.logViolation('contextmenu', 'Right-click/context menu used');
      this.handleMaxViolationsCheck();
    };
    document.addEventListener('contextmenu', this._contextHandler);

    // block copy/paste via clipboard events (additional)
    this._copyHandler = (e) => {
      e.preventDefault();
      this.logViolation('copy_event', 'Copy attempted');
      this.handleMaxViolationsCheck();
    };
    this._pasteHandler = (e) => {
      e.preventDefault();
      this.logViolation('paste_event', 'Paste attempted');
      this.handleMaxViolationsCheck();
    };
    document.addEventListener('copy', this._copyHandler);
    document.addEventListener('paste', this._pasteHandler);

    // prevent drag/drop that could leak content
    this._dropHandler = (e) => { e.preventDefault(); };
    document.addEventListener('drop', this._dropHandler);
    document.addEventListener('dragover', this._dropHandler);
  },

  removeListeners() {
    if (this._fsHandler) {
      document.removeEventListener('fullscreenchange', this._fsHandler);
      document.removeEventListener('webkitfullscreenchange', this._fsHandler);
      document.removeEventListener('msfullscreenchange', this._fsHandler);
    }
    if (this._visibilityHandler) {
      document.removeEventListener('visibilitychange', this._visibilityHandler);
    }
    if (this._blurHandler) {
      window.removeEventListener('blur', this._blurHandler);
    }
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler, true);
    }
    if (this._contextHandler) {
      document.removeEventListener('contextmenu', this._contextHandler);
    }
    if (this._copyHandler) {
      document.removeEventListener('copy', this._copyHandler);
    }
    if (this._pasteHandler) {
      document.removeEventListener('paste', this._pasteHandler);
    }
    if (this._dropHandler) {
      document.removeEventListener('drop', this._dropHandler);
      document.removeEventListener('dragover', this._dropHandler);
    }
  },

  // periodic check: ensure still fullscreen (fallback) and check window size
  periodicCheck() {
    if (!this.enabled) return;
    
    const fs = this.getFullscreenStatus();
    if (!fs) {
      this.logViolation('fs_missing_check', 'Fullscreen missing during periodic check');
      this.handleMaxViolationsCheck();
    }
    
    // optionally detect small viewport size (user resized or windowed)
    const minWidth = 1024;
    if (window.innerWidth < minWidth) {
      this.logViolation('small_viewport', `Viewport width ${window.innerWidth}`);
      this.handleMaxViolationsCheck();
    }
  },

  // increment violation and optionally send to server
  async logViolation(code, message) {
    this.violations++;
    const entry = {
      code,
      message,
      timestamp: new Date().toISOString(),
      violations: this.violations
    };
    this.violationLog.push(entry);
    console.warn('Lockdown violation:', entry);

    // send to server (non-blocking)
    try {
      await fetch(`/api/assessments/${this.assessmentId}/violation`, {
        method: 'POST',
        headers: this._headers(),
        body: JSON.stringify(entry)
      });
    } catch (err) {
      // ignore
    }

    // show small notification to user (optional)
    if (typeof utils !== 'undefined' && utils.showNotification) {
      utils.showNotification(`Security violation detected: ${message}`, 'warning');
    }
  },

  // check and handle max violations (submit or block)
  async handleMaxViolationsCheck() {
    if (this.violations >= this.maxViolations) {
      // Option 1: auto submit
      if (this.autoSubmit) {
        if (typeof utils !== 'undefined' && utils.showNotification) {
          utils.showNotification('Max security violations reached. Assessment will be submitted.', 'error');
        }
        // Wait a fraction then call your existing submit handler
        setTimeout(async () => {
          try {
            // submit via your existing assessmentPage.submitAssessment()
            if (typeof assessmentPage !== 'undefined' && assessmentPage.submitAssessment) {
              await assessmentPage.submitAssessment();
            } else {
              // fallback: call server to mark as auto-submitted
              await fetch(`/api/assessments/${this.assessmentId}/auto-submit`, {
                method: 'POST',
                headers: this._headers(),
                body: JSON.stringify({ reason: 'max_violations', violations: this.violationLog })
              });
              // navigate to results or show message
              if (typeof router !== 'undefined' && router.navigateTo) {
                router.navigateTo(config.ROUTES.RESULTS);
              }
            }
          } catch (err) {
            console.error('Auto-submit failed', err);
          } finally {
            this.stop();
          }
        }, 800);
      } else {
        // Option 2: block UI (show modal)
        // show modal asking user to contact support
      }
    }
  },

  _headers() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = auth && auth.getToken && auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  // Emergency exit function
  async emergencyExit() {
    console.warn('Emergency lockdown exit triggered');
    this.enabled = false;
    
    // Stop listeners and intervals first
    this.stop();
    
    // Exit fullscreen with proper promise handling
    try {
      if (this.getFullscreenStatus()) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Error exiting fullscreen:', err);
    }
    
    // Navigate away
    setTimeout(() => {
      if (typeof router !== 'undefined' && router.navigateTo) {
        router.navigateTo(config.ROUTES.ASSESSMENTS);
      } else {
        window.location.href = '/assessments';
      }
    }, 500);
    
    if (typeof utils !== 'undefined' && utils.showNotification) {
      utils.showNotification('Emergency exit from assessment mode', 'warning');
    }
  }
};

// Make it globally available for emergency use
window.emergencyLockdownExit = () => {
  if (typeof Lockdown !== "undefined" && Lockdown.emergencyExit) {
    Lockdown.emergencyExit();
  } else {
    // Fallback emergency exit
    if (document.exitFullscreen) document.exitFullscreen();
    if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    if (document.msExitFullscreen) document.msExitFullscreen();
    window.location.href = '/assessments';
  }
};

// Exported helper to call
async function startLockdown(assessmentId, opts = {}) {
  await Lockdown.start(assessmentId, opts);
  return Lockdown;
}