// Assessment taking page
const assessmentPage = {
    currentAssessment: null,
    questions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    timer: null,
    timeTaken: 0,

    async load(data) {
        const assessmentId = data?.id || router.getRouteParams().id;
        
        if (!assessmentId) {
            utils.showNotification('Assessment not found', 'error');
            router.navigateTo(config.ROUTES.ASSESSMENTS);
            return;
        }

        try {
            utils.showLoading('Loading assessment...');
            const response = await api.get(`/assessments/${assessmentId}`);
            
            if (response.success) {
                this.currentAssessment = response.data.assessment;
                this.questions = response.data.questions || [];
                this.userAnswers = new Array(this.questions.length).fill(undefined);
                
                if (this.currentAssessment.is_premium && !response.data.has_access) {
                    this.showPremiumWarning();
                    return;
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
        const html = `
            <div class="page-container">
                <div class="assessment-container">
                    
                    <!-- Title + Description -->
                    <div class="assessment-title" style="text-align:center; margin-bottom:1rem;">
                        <h2>${this.currentAssessment.title}</h2>
                        <p class="subtitle">${this.currentAssessment.description || ''}</p>
                    </div>

                    <!-- Progress & Timer -->
                    <div class="assessment-header">
                        <div class="progress" style="flex:1; margin-right:1rem;">
                            <div class="progress-bar" style="width: ${((this.currentQuestionIndex + 1) / this.questions.length) * 100}%"></div>
                        </div>
                        <span id="timer-display" class="timer">00:00</span>
                    </div>

                    <!-- Question + Options -->
                    <div class="question-container">
                        ${this.renderCurrentQuestion()}
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
                        <label class="option ${userAnswer === index ? 'selected' : ''}">
                            <input 
                                type="radio" 
                                name="question-${this.currentQuestionIndex}" 
                                value="${index}"
                                ${userAnswer === index ? 'checked' : ''}
                                onchange="assessmentPage.selectOption(${index})"
                            />
                            <span>${String.fromCharCode(65 + index)}. ${option}</span>
                        </label>
                    `).join('')}
                </div>

                <!-- Navigation buttons inside card -->
                <div class="assessment-footer">
                    ${
                        this.currentQuestionIndex > 0
                            ? `<button class="btn btn-outline" onclick="assessmentPage.previousQuestion()">
                                <i class="fas fa-arrow-left"></i> Previous
                            </button>`
                            : ''
                    }

                    ${
                        this.currentQuestionIndex < this.questions.length - 1
                            ? `<button class="btn btn-primary" onclick="assessmentPage.nextQuestion()">Next <i class="fas fa-arrow-right"></i></button>`
                            : `<button class="btn btn-accent" onclick="assessmentPage.submitAssessment()">Submit Assessment</button>`
                    }
                </div>
            </div>
        `;
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
        this.timeTaken = 0;
        this.timer = setInterval(() => {
            this.timeTaken++;
            this.updateTimerDisplay();
        }, 1000);
    },

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) {
            const minutes = Math.floor(this.timeTaken / 60);
            const seconds = this.timeTaken % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    },

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    },

    async submitAssessment() {
        // Check unanswered
        const unansweredQuestions = this.userAnswers.filter(answer => answer === undefined);
        if (unansweredQuestions.length > 0) {
            const confirmSubmit = confirm('You have unanswered questions. Are you sure you want to submit?');
            if (!confirmSubmit) return;
        }

        try {
            utils.showLoading('Submitting assessment...');
            
            const response = await api.post('/results/submit', {
                assessment_id: this.currentAssessment.id,
                answers: this.questions.map((question, index) => ({
                    question_id: question.id,
                    selected_answer: this.userAnswers[index] !== undefined ? this.userAnswers[index] : -1
                })),
                time_taken: this.timeTaken
            });

            if (response.success) {
                this.stopTimer();
                utils.showNotification('Assessment submitted successfully!', 'success');
                router.navigateTo('/results', {
                    assessmentId: this.currentAssessment.id,
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
