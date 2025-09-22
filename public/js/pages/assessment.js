// Assessment taking page with timer and difficulty features
const assessmentPage = {
    currentAssessment: null,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    timer: null,
    timeRemaining: 0,
    timeLimit: 0,

    async load(data) {
        const assessmentId = data?.id || router.getRouteParams().id;
        
        if (!assessmentId) {
            utils.showNotification('Assessment not found', 'error');
            router.navigateTo(config.ROUTES.ASSESSMENTS);
            return;
        }

        try {
            utils.showLoading('Preparing your assessment...');
            
            // Use the new start endpoint that includes timer and randomized questions
            const response = await api.get(`/assessments/${assessmentId}/start`);
            
            if (response.success) {
                this.currentAssessment = response.data.assessment;
                this.questions = response.data.questions || [];
                this.timeLimit = response.data.time_limit;
                this.timeRemaining = this.timeLimit;
                this.userAnswers = new Array(this.questions.length).fill(undefined);
                
                if (this.currentAssessment.is_premium) {
                    // For premium assessments, check access (you might need to adjust this)
                    const hasAccess = true; // You'll need to implement access check
                    if (!hasAccess) {
                        this.showPremiumWarning();
                        return;
                    }
                }

                this.renderAssessment();
                this.startTimer();
            } else {
                throw new Error(response.error || 'Failed to load assessment');
            }
        } catch (error) {
            console.error('Error loading assessment:', error);
            utils.showNotification(error.message, 'error');
            router.navigateTo(config.ROUTES.ASSESSMENTS);
        } finally {
            utils.hideLoading();
        }
    },

    showPremiumWarning() {
        const html = `
            <div class="page-container">
                <div class="premium-warning">
                    <i class="fas fa-crown"></i>
                    <h2>Premium Assessment</h2>
                    <p>This is a premium assessment. Please purchase access to continue.</p>
                    <div class="premium-actions">
                        <button class="btn btn-accent" onclick="router.navigateTo('/payment/${this.currentAssessment.id}')">
                            Purchase Access - ${utils.formatCurrency(this.currentAssessment.price)}
                        </button>
                        <button class="btn btn-outline" onclick="router.navigateTo(config.ROUTES.ASSESSMENTS)">
                            Back to Assessments
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('page-content').innerHTML = html;
    },

    renderAssessment() {
        const progressPercentage = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        const timeFormatted = this.formatTime(this.timeRemaining);
        
        const html = `
            <div class="page-container">
                <div class="assessment-container">
                    
                    <!-- Header with title and timer -->
                    <div class="assessment-header">
                        <div class="header-main">
                            <h2>${this.currentAssessment.title}</h2>
                            <p class="subtitle">${this.currentAssessment.description || ''}</p>
                        </div>
                        <div class="timer-container">
                            <div class="timer-display" id="timer-display">${timeFormatted}</div>
                            <div class="timer-label">Time Remaining</div>
                        </div>
                    </div>

                    <!-- Progress bar -->
                    <div class="assessment-progress">
                        <div class="progress-bar">
                            <div class="progress" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="progress-info">
                            <span>Question ${this.currentQuestionIndex + 1} of ${this.questions.length}</span>
                            <span class="difficulty">Difficulty: ${this.getDifficultyStars(this.questions[this.currentQuestionIndex]?.d_level || 1)}</span>
                        </div>
                    </div>

                    <!-- Question and options -->
                    <div class="question-container">
                        ${this.renderCurrentQuestion()}
                    </div>

                    <!-- Navigation buttons -->
                    <div class="assessment-navigation">
                        <button class="btn btn-outline" onclick="assessmentPage.previousQuestion()" 
                                ${this.currentQuestionIndex === 0 ? 'disabled' : ''}>
                            <i class="fas fa-arrow-left"></i> Previous
                        </button>
                        
                        ${this.currentQuestionIndex < this.questions.length - 1 ? `
                            <button class="btn btn-primary" onclick="assessmentPage.nextQuestion()">
                                Next <i class="fas fa-arrow-right"></i>
                            </button>
                        ` : `
                            <button class="btn btn-accent" onclick="assessmentPage.submitAssessment()">
                                <i class="fas fa-paper-plane"></i> Submit Assessment
                            </button>
                        `}
                    </div>

                    <!-- Time warning (hidden initially) -->
                    <div class="time-warning" id="time-warning" style="display: none;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Time is running out! Submit your answers soon.</span>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
        this.updateTimerDisplay();
    },

    renderCurrentQuestion() {
        if (this.questions.length === 0) return '<p>No questions available.</p>';
        
        const question = this.questions[this.currentQuestionIndex];
        const userAnswer = this.userAnswers[this.currentQuestionIndex];
        
        return `
            <div class="question-card">
                <h3>${question.question_text}</h3>
                <div class="options-list">
                    ${question.options.map((option, index) => `
                        <div class="option ${userAnswer === index ? 'selected' : ''}" 
                             onclick="assessmentPage.selectOption(${index})">
                            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                            <span class="option-text">${option}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    getDifficultyStars(level) {
        return '★'.repeat(level) + '☆'.repeat(3 - level);
    },

    selectOption(optionIndex) {
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        
        // Update UI
        const options = document.querySelectorAll('.option');
        options.forEach((option, index) => {
            option.classList.toggle('selected', index === optionIndex);
        });
    },

    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderAssessment();
        }
    },

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderAssessment();
        }
    },

    startTimer() {
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();

            // Show warning when time is low (5 minutes)
            if (this.timeRemaining === 300) {
                this.showTimeWarning();
            }

            // Auto-submit when time expires
            if (this.timeRemaining <= 0) {
                this.autoSubmitAssessment();
            }
        }, 1000);
    },

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        const timerElement = document.querySelector('.timer-display');
        
        if (timerDisplay) {
            timerDisplay.textContent = this.formatTime(this.timeRemaining);
        }

        // Change color based on time remaining
        if (timerElement) {
            if (this.timeRemaining < 300) { // Less than 5 minutes
                timerElement.style.color = '#f94144';
                timerElement.classList.add('pulse');
            } else if (this.timeRemaining < 600) { // Less than 10 minutes
                timerElement.style.color = '#f8961e';
            } else {
                timerElement.style.color = '';
                timerElement.classList.remove('pulse');
            }
        }
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    showTimeWarning() {
        const warningElement = document.getElementById('time-warning');
        if (warningElement) {
            warningElement.style.display = 'flex';
            warningElement.classList.add('shake');
            
            // Remove shake animation after it completes
            setTimeout(() => {
                warningElement.classList.remove('shake');
            }, 500);
        }
    },

    async autoSubmitAssessment() {
        this.stopTimer();
        utils.showNotification('Time is up! Submitting your assessment...', 'warning');
        
        // Wait a moment for user to see the message
        setTimeout(async () => {
            await this.submitAssessment();
        }, 2000);
    },

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    resetState() {
        this.userAnswers = [];
        this.currentQuestionIndex = 0;
        this.questions = [];
        },

    async submitAssessment() {
        // Check if all questions are answered
        const unansweredQuestions = this.userAnswers.filter(answer => answer === undefined);
        
        if (unansweredQuestions.length > 0) {
            utils.showNotification(`You have ${unansweredQuestions.length} unanswered questions. Submitting anyway...`, 'info');
        }

        try {
            utils.showLoading('Submitting assessment...');
            
            const timeTaken = this.timeLimit - this.timeRemaining;
            const response = await api.post('/results/submit', {
                assessment_id: this.currentAssessment.id,
                answers: this.questions.map((question, index) => ({
                    question_id: question.id,
                    selected_answer: this.userAnswers[index] !== undefined ? this.userAnswers[index] : -1
                })),
                time_taken: timeTaken
            });

            if (response.success) {
                this.stopTimer();
                // ✅ Exit lockdown mode before navigating away
                if (typeof Lockdown !== "undefined") {
                    //stopLockdown();
                    Lockdown.stop();
                }
                this.resetState();
                utils.showNotification('Assessment submitted successfully!', 'success');
                
                // Navigate to modern results page
                router.navigateTo('/assessment-result', {
                    result: response.data.result,
                    detailedResults: response.data.detailed_results
                });
            } else {
                throw new Error(response.error || 'Failed to submit assessment');
            }
        } catch (error) {
            console.error('Error submitting assessment:', error);
            utils.showNotification(error.message, 'error');
        } finally {
            utils.hideLoading();
        }
    }
};