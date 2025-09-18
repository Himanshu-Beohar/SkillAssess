// Main application initialization
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('Initializing SkillAssess application...');
        
        // Debug: Log current URL and path
        console.log('Current URL:', window.location.href);
        console.log('Current path:', window.location.pathname);
        
        // Initialize components
        await headerComponent.load();
        await footerComponent.load();
        
        // Initialize router
        router.init();
        
        // Check authentication status
        if (auth.isAuthenticated()) {
            console.log('User is authenticated');
            headerComponent.updateAuthState();
        } else {
            console.log('User is not authenticated');
        }
        
        // Add global error handler
        window.addEventListener('error', function(e) {
            console.error('Global error:', e.error);
            utils.showNotification('An unexpected error occurred', 'error');
        });
        
        // Add offline/online detection
        window.addEventListener('online', function() {
            utils.showNotification('Connection restored', 'success');
        });
        
        window.addEventListener('offline', function() {
            utils.showNotification('You are offline', 'warning');
        });
        
        console.log('Application initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        utils.showNotification('Failed to initialize application', 'error');
    }
});

// Global functions for HTML onclick attributes
window.router = router;
window.auth = auth;
window.utils = utils;
window.assessmentPage = assessmentPage;
window.paymentPage = paymentPage;
window.resultsPage = resultsPage;
window.assessmentsPage = assessmentsPage;