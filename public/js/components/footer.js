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
                        <li><a href="${config.ROUTES.HOME}">Home</a></li>
                        <li><a href="${config.ROUTES.ASSESSMENTS}">Assessments</a></li>
                        <li><a href="#">Pricing</a></li>
                        <li><a href="#">Contact</a></li>
                    </ul>
                </div>
                
                <div class="footer-section">
                    <h3>Connect</h3>
                    <div class="social-links">
                        <a href="#"><i class="fab fa-facebook"></i></a>
                        <a href="#"><i class="fab fa-twitter"></i></a>
                        <a href="#"><i class="fab fa-linkedin"></i></a>
                        <a href="#"><i class="fab fa-github"></i></a>
                    </div>
                </div>
            </div>
            
            <div class="footer-bottom">
                <p>&copy; 2023 SkillAssess. All rights reserved. | Ready for Railway Deployment</p>
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