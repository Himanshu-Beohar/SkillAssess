// Footer component
const footerComponent = {
    // Load footer
    async load() {
        const footerHTML = `
            <div class="footer-content">
                <div class="footer-section">
                    <h3>SkillAssess</h3>
                    <p>Test your skills and improve your knowledge with our comprehensive assessment platform.</p>
                </div>
                
                <div class="footer-section">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="${config.ROUTES.HOME}">Skillassess Home</a></li>
                        <li><a href="${config.ROUTES.ASSESSMENTS}">Assessments</a></li>
                        
                        <li><a href="https://gyanovation.com/contact-us/">Contact Us</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Connect</h3>
                    <div class="social-links">
                        <a href="https://www.facebook.com/share/19dRiSDgdQ/"><i class="fab fa-facebook"></i></a>
                        <a href="https://x.com/GyanovationTech?t=QcLfNLWF6eYgwKP5OC92BA&s=09"><i class="fab fa-twitter"></i></a>
                        <a href="https://www.linkedin.com/company/gyanovationtechnologies"><i class="fab fa-linkedin"></i></a>
                        <a href="https://www.instagram.com/gyanovationtech?igsh=MWdmdTcyeXQwcWZzbA=="><i class="fab fa-instagram"></i></a>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>
                    &copy; 2025 SkillAssess. All rights reserved. | Powered by 
                    <a href="https://gyanovation.com/" target="_blank" rel="noopener noreferrer">
                        Gyanovation Technologies
                    </a> | 📧 contact@gyanovation.com
                </p>
                <div class="footer-bottom">
                <div class="footer-legal-links">
                    <a href="https://gyanovation.com/disclamer/" target="_blank">Disclaimer</a> 
                    <a href="https://gyanovation.com/terms-conditions/" target="_blank">Terms & Conditions</a>
                    <a href="https://gyanovation.com/privacy-policy-2/" target="_blank">Privacy Policy</a>
                    <a href="https://gyanovation.com/refund-cancellation-policy/" target="_blank">Refund & Cancellation</a>
                    <a href="https://gyanovation.com/shipping-delivery/" target="_blank">Shipping & Delivery</a>
                </div>
                </div>
            </div>
        `;
        
        document.getElementById('footer').innerHTML = footerHTML;
        
        // Add click event listeners to footer links
        this.addFooterEventListeners();
    },

    // Add footer event listeners
    addFooterEventListeners() {
        const footerLinks = document.querySelectorAll('footer a');
        footerLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('/')) {
                    e.preventDefault();
                    router.navigateTo(href);
                }
            });
        });
    }
};