// Payment page
const paymentPage = {
    currentAssessment: null,
    razorpayOptions: null,

    async load(data) {
        console.log('Payment page loading with data:', data);
        
        // Get assessment ID from route parameters or data
        let assessmentId = data?.id || router.getRouteParams().id;
        
        console.log('Assessment ID:', assessmentId);
        
        if (!assessmentId) {
            utils.showNotification('Assessment not found', 'error');
            router.navigateTo(config.ROUTES.ASSESSMENTS);
            return;
        }

        try {
            utils.showLoading('Loading payment details...');
            const response = await api.get(`/assessments/${assessmentId}`);
            
            if (response.success) {
                this.currentAssessment = response.data.assessment;
                
                if (!this.currentAssessment.is_premium) {
                    utils.showNotification('This assessment is free', 'info');
                    router.navigateTo(`/assessment/${assessmentId}`);
                    return;
                }

                this.renderPaymentPage();
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

    // Then update initiatePayment():
    async initiatePayment() {
        try {
            utils.showLoading('Loading payment system...');
            
            // Load Razorpay script first
            await this.loadRazorpayScript();
            
            // Then create order
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

    renderPaymentPage() {
        const html = `
            <div class="page-container">
                <div class="payment-header">
                    <h1>Purchase Assessment</h1>
                    <p>You're purchasing: <strong>${this.currentAssessment.title}</strong></p>
                </div>

                <div class="payment-card">
                    <div class="payment-summary">
                        <div class="payment-amount">
                            ${utils.formatCurrency(this.currentAssessment.price)}
                        </div>
                        <p>One-time payment for lifetime access</p>
                    </div>

                    <div class="payment-features">
                        <h3>What's included:</h3>
                        <ul>
                            <li><i class="fas fa-check"></i> Lifetime access to this assessment</li>
                            <li><i class="fas fa-check"></i> Detailed results and analytics</li>
                            <li><i class="fas fa-check"></i> Performance comparison</li>
                            <li><i class="fas fa-check"></i> Certificate of completion</li>
                        </ul>
                    </div>

                    <div class="payment-actions">
                        <button id="payBtn" class="btn btn-accent btn-full">
                            <i class="fas fa-lock"></i> Pay with Razorpay
                        </button>
                        <button id="cancelBtn" class="btn btn-outline btn-full">
                            Cancel
                        </button>
                    </div>

                    <div class="payment-security">
                        <p><i class="fas fa-shield-alt"></i> Secure payment processed by Razorpay</p>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('page-content').innerHTML = html;
        //add listners
        //------------------------
        document.getElementById("payBtn").addEventListener("click", () => this.initiatePayment());
        document.getElementById("cancelBtn").addEventListener("click", () => router.navigateTo(config.ROUTES.ASSESSMENTS));
        //--------------------------
    },

    // async initiatePayment() {
    //     try {
    //         utils.showLoading('Creating payment order...');
            
    //         const response = await api.post('/payments/create-order', {
    //             assessment_id: this.currentAssessment.id
    //         });

    //         if (response.success) {
    //             this.razorpayOptions = response.data;
    //             this.openRazorpayModal();
    //         } else {
    //             throw new Error(response.error || 'Failed to create payment order');
    //         }
    //     } catch (error) {
    //         console.error('Error initiating payment:', error);
    //         utils.showNotification(error.message, 'error');
    //     } finally {
    //         utils.hideLoading();
    //     }
    // },

    openRazorpayModal() {
        if (typeof Razorpay === 'undefined') {
            utils.showNotification('Payment system is not available. Please refresh the page.', 'error');
            console.error('Razorpay script not loaded');
            return;
        }
        const options = {
            key: this.razorpayOptions.key,
            amount: this.razorpayOptions.order.amount,
            currency: this.razorpayOptions.order.currency,
            name: 'SkillAssess',
            description: `Purchase: ${this.currentAssessment.title}`,
            order_id: this.razorpayOptions.order.id,
            handler: this.handlePaymentSuccess.bind(this),
            prefill: {
                name: auth.getCurrentUser()?.name || '',
                email: auth.getCurrentUser()?.email || ''
            },
            theme: {
                color: '#4361ee'
            },
            modal: {
                ondismiss: this.handlePaymentDismiss.bind(this)
            }
        };

        try {
            const rzp = new Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error('Error creating Razorpay instance:', error);
            utils.showNotification('Failed to initialize payment', 'error');
        }
    },

    async handlePaymentSuccess(response) {
        try {
            utils.showLoading('Verifying payment...');
            
            const verifyResponse = await api.post('/payments/verify', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
            });

            if (verifyResponse.success) {
                utils.showNotification('Payment successful! You now have access to the assessment.', 'success');
                
                // Redirect to assessment page
                setTimeout(() => {
                    router.navigateTo(`/assessment/${this.currentAssessment.id}`);
                }, 2000);
            } else {
                throw new Error(verifyResponse.error || 'Payment verification failed');
            }
        } catch (error) {
            console.error('Error verifying payment:', error);
            utils.showNotification(error.message, 'error');
        } finally {
            utils.hideLoading();
        }
    },

    handlePaymentDismiss() {
        utils.showNotification('Payment cancelled', 'info');
    }
};