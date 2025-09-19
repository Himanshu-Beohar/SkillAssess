// Application configuration
// const config = {
//     API_BASE_URL: window.location.origin.includes('localhost') 
//         ? 'http://localhost:3000/api' 
//         : '/api',

const config = {
    API_BASE_URL: window.location.origin.includes('localhost') 
        ? 'http://localhost:3000/api' 
        : `${window.location.origin}/api`,

    
    ROUTES: {
        HOME: '/',
        LOGIN: '/login',
        REGISTER: '/register',
        ASSESSMENTS: '/assessments',
        PROFILE: '/profile',
        RESULTS: '/results'
    },
    
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        USER_DATA: 'user_data',
        THEME: 'theme_preference'
    },
    
    ASSESSMENT_TYPES: {
        FREE: 'free',
        PREMIUM: 'premium'
    },
    
    // Razorpay configuration (will be overridden by environment variables)
    RAZORPAY: {
        KEY: window.location.origin.includes('localhost') 
            ? 'rzp_test_YOUR_TEST_KEY' 
            : 'rzp_live_YOUR_LIVE_KEY'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}