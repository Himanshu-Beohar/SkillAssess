// Payment page - Modern Design
const paymentPage = {
    currentAssessment: null,
    razorpayOptions: null,

    async load(data) {
        console.log('Payment page loading with data:', data);
        
        // Get assessment ID from route parameters or data
        let assessmentId = data?.id || router.getRouteParams().id;
        
        if (!assessmentId) {
            utils.showNotification('Assessment not found', 'error');
            router.navigateTo(config.ROUTES.ASSESSMENTS);
            return;
        }

        try {
            utils.showLoading('Loading premium access details...');
            const response = await api.get(`/assessments/${assessmentId}`);
            
            if (response.success) {
                this.currentAssessment = response.data.assessment;
                
                if (!this.currentAssessment.is_premium) {
                    utils.showNotification('This assessment is free', 'info');
                    router.navigateTo(`/assessment/${assessmentId}`);
                    return;
                }

                this.renderModernPaymentPage();
            } else {
                throw new Error(response.error || 'Failed to load assessment');
            }
        } catch (error) {
            console.error('Error loading payment page:', error);
            utils.showNotification(error.message, 'error');
            router.navigateTo(config.ROUTES.ASSESSMENTS);
        } finally {
            utils.hideLoading();
        }
    },

    renderModernPaymentPage() {
        const html = `
            <div class="modern-payment-container">
                <!-- Premium Header -->
                <div class="premium-header">
                    <div class="premium-badge">
                        <i class="fas fa-crown"></i>
                        <span>Premium Assessment</span>
                    </div>
                    <h1 class="premium-title">Unlock Premium Access</h1>
                    <p class="premium-subtitle">Elevate your learning experience with exclusive content</p>
                </div>

                <!-- Payment Card -->
                <div class="modern-payment-card">
                    <div class="payment-hero">
                        <div class="assessment-preview">
                            <i class="fas fa-graduation-cap"></i>
                            <h2>${this.currentAssessment.title}</h2>
                            <p>${this.currentAssessment.description || 'Premium assessment with detailed analytics'}</p>
                        </div>
                        
                        <div class="price-display">
                            <div class="price-amount">
                                ${utils.formatCurrency(this.currentAssessment.price)}
                            </div>
                            <div class="price-info">One-time payment • Lifetime access</div>
                        </div>
                    </div>

                    <!-- Features Grid -->
                    <div class="features-grid">
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fas fa-infinity"></i>
                            </div>
                            <div class="feature-content">
                                <h4>Lifetime Access</h4>
                                <p>Unlimited attempts forever</p>
                            </div>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fas fa-chart-line"></i>
                            </div>
                            <div class="feature-content">
                                <h4>Advanced Analytics</h4>
                                <p>Detailed performance insights</p>
                            </div>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fas fa-trophy"></i>
                            </div>
                            <div class="feature-content">
                                <h4>Certificate</h4>
                                <p>Digital certificate of completion</p>
                            </div>
                        </div>
                        
                        <div class="feature-item">
                            <div class="feature-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="feature-content">
                                <h4>Leaderboard</h4>
                                <p>Compare with other learners</p>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Actions -->
                    <div class="payment-actions-modern">
                        <button id="payBtn" class="btn-premium-pay">
                            <span class="btn-content">
                                <i class="fas fa-lock"></i>
                                <span>Secure Payment</span>
                                <span class="price-btn">${utils.formatCurrency(this.currentAssessment.price)}</span>
                            </span>
                        </button>
                        
                        <button id="cancelBtn" class="btn-outline-modern">
                            <i class="fas fa-arrow-left"></i>
                            Back to Assessments
                        </button>
                    </div>

                    <!-- Security & Trust -->
                    <div class="security-section">
                        <div class="security-badges">
                            <div class="security-item">
                                <i class="fas fa-shield-alt"></i>
                                <span>256-bit SSL Encryption</span>
                            </div>
                            <div class="security-item">
                                <i class="fas fa-lock"></i>
                                <span>PCI DSS Compliant</span>
                            </div>
                            <div class="security-item">
                                <i class="fas fa-check-circle"></i>
                                <span>Money Back Guarantee</span>
                            </div>
                        </div>
                        
                        <div class="trust-pilot">
                            <div class="trust-rating">
                                <div class="stars">★★★★★</div>
                                <span>4.9/5 from 2,500+ learners</span>
                            </div>
                        </div>
                    </div>

                    <!-- FAQ Section -->
                    <div class="faq-section">
                        <h3>Frequently Asked Questions</h3>
                        <div class="faq-item">
                            <div class="faq-question">
                                <span>What happens after payment?</span>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="faq-answer">
                                <p>Immediate access to the assessment. You'll receive a confirmation email and can start immediately.</p>
                            </div>
                        </div>
                        
                        <div class="faq-item">
                            <div class="faq-question">
                                <span>Is there a refund policy?</span>
                                <i class="fas fa-chevron-down"></i>
                            </div>
                            <div class="faq-answer">
                                <p>Yes! 30-day money-back guarantee if you're not satisfied with the assessment quality.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
        
        // Add event listeners
        document.getElementById("payBtn").addEventListener("click", () => this.initiatePayment());
        document.getElementById("cancelBtn").addEventListener("click", () => router.navigateTo(config.ROUTES.ASSESSMENTS));
        
        // Add FAQ toggle functionality
        this.addFAQListeners();
    },

    addFAQListeners() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const answer = question.nextElementSibling;
                const icon = question.querySelector('i');
                
                answer.classList.toggle('active');
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            });
        });
    },

    async loadRazorpayScript() {
        return new Promise((resolve, reject) => {
            if (typeof Razorpay !== 'undefined') {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Razorpay'));
            document.head.appendChild(script);
        });
    },

    async initiatePayment() {
        try {
            utils.showLoading('Preparing secure payment...');
            
            await this.loadRazorpayScript();
            
            const response = await api.post('/payments/create-order', {
                assessment_id: this.currentAssessment.id
            });

            if (response.success) {
                this.razorpayOptions = response.data;
                this.openRazorpayModal();
            } else {
                throw new Error(response.error || 'Failed to create payment order');
            }
        } catch (error) {
            console.error('Error initiating payment:', error);
            utils.showNotification(error.message, 'error');
        } finally {
            utils.hideLoading();
        }
    },

    openRazorpayModal() {
        if (typeof Razorpay === 'undefined') {
            utils.showNotification('Payment system is not available. Please refresh the page.', 'error');
            return;
        }

        const options = {
            key: this.razorpayOptions.key,
            amount: this.razorpayOptions.order.amount,
            currency: this.razorpayOptions.order.currency,
            name: 'SkillAssess Premium',
            description: `Premium Access: ${this.currentAssessment.title}`,
            order_id: this.razorpayOptions.order.id,
            handler: this.handlePaymentSuccess.bind(this),
            prefill: {
                name: auth.getCurrentUser()?.name || '',
                email: auth.getCurrentUser()?.email || '',
                contact: '' // Add phone if available
            },
            theme: {
                color: '#7C3AED'
            },
            modal: {
                ondismiss: this.handlePaymentDismiss.bind(this),
                animation: true,
                backdropclose: true
            },
            notes: {
                product: 'Premium Assessment',
                user_id: auth.getCurrentUser()?.id
            }
        };

        try {
            const rzp = new Razorpay(options);
            rzp.open();
            
            // Add payment analytics
            this.trackPaymentInitiation();
            
        } catch (error) {
            console.error('Error creating Razorpay instance:', error);
            utils.showNotification('Failed to initialize payment gateway', 'error');
        }
    },

    trackPaymentInitiation() {
        console.log('Payment initiated for:', this.currentAssessment.title);
        // Add analytics tracking here
    },

    async handlePaymentSuccess(response) {
        try {
            utils.showLoading('Verifying your payment...');
            
            const verifyResponse = await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.success) {
                this.showSuccessAnimation();
                
                setTimeout(() => {
                    utils.showNotification('🎉 Premium access granted! Redirecting...', 'success');
                    router.navigateTo(`/assessment/${this.currentAssessment.id}`);
                }, 2500);
                
            } else {
                throw new Error(verifyResponse.error || 'Payment verification failed');
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            utils.showNotification('Payment verification failed. Please contact support.', 'error');
        } finally {
            utils.hideLoading();
        }
    },

    showSuccessAnimation() {
        const paymentBtn = document.getElementById('payBtn');
        if (paymentBtn) {
            paymentBtn.innerHTML = '<i class="fas fa-check"></i> Payment Successful!';
            paymentBtn.classList.add('success');
        }
    },

    handlePaymentDismiss() {
        utils.showNotification('Payment cancelled. You can try again anytime.', 'info');
    }
};