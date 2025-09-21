// Enhanced Router for handling page navigation
const router = {
    currentRoute: '',
    routes: {},
    routeParams: {},

    // Initialize router
    init() {
        this.routes = {
            [config.ROUTES.HOME]: homePage,
            [config.ROUTES.LOGIN]: loginPage,
            [config.ROUTES.REGISTER]: registerPage,
            [config.ROUTES.ASSESSMENTS]: assessmentsPage,
            [config.ROUTES.PROFILE]: profilePage,
            [config.ROUTES.RESULTS]: resultsPage,
            '/wins': winsPage,   // ✅ make sure this matches
            '/assessment/:id/instructions': assessmentInstructionsPage,
            '/assessment/:id': assessmentPage,
            '/payment/:id': paymentPage,
            //[config.ROUTES.RESULTS]: resultsPage, // All results history
            '/result/:id': singleResultPage,      // Single result view
            '/assessment-result': assessmentResultPage, // New assessment result
            '/wins': winsPage
            
        };

        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            this.loadRoute(window.location.pathname, false);
        });

        // Handle link clicks
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.getAttribute('href').startsWith('/')) {
                e.preventDefault();
                this.navigateTo(link.getAttribute('href'));
            }
        });

        // Initial load
        this.loadRoute(window.location.pathname);
    },

    // Navigate to route
    navigateTo(route, data = {}) {
        // Store data for the next page
        sessionStorage.setItem('routeData', JSON.stringify(data));
        
        // Update URL without reloading page
        window.history.pushState({}, '', route);
        this.loadRoute(route, true, data);
    },

    // Load route
    async loadRoute(route, updateHistory = false, data = {}) {
        try {
            utils.showLoading();

            // Parse route parameters
            this.parseRouteParams(route);

            // Get route handler (support for parameterized routes)
            let routeHandler = this.routes[route];
            if (!routeHandler) {
                // Check for parameterized routes
                for (const routePattern in this.routes) {
                    if (routePattern.includes(':')) {
                        const patternRegex = new RegExp('^' + routePattern.replace(/:\w+/g, '([^/]+)') + '$');
                        if (patternRegex.test(route)) {
                            routeHandler = this.routes[routePattern];
                            break;
                        }
                    }
                }
            }

            // Default to home if no route found
            if (!routeHandler) {
                routeHandler = homePage;
            }

            // Check authentication for protected routes
            if (route !== config.ROUTES.HOME && 
                route !== config.ROUTES.LOGIN && 
                route !== config.ROUTES.REGISTER) {
                if (!auth.isAuthenticated()) {
                    this.navigateTo(config.ROUTES.LOGIN);
                    return;
                }
            }

            // Redirect to home if already authenticated and trying to access auth pages
            if ((route === config.ROUTES.LOGIN || route === config.ROUTES.REGISTER) && 
                auth.isAuthenticated()) {
                this.navigateTo(config.ROUTES.HOME);
                return;
            }

            // Load the page with route parameters
            await routeHandler.load({ ...this.routeParams, ...data });
            this.currentRoute = route;

            // Update active nav link
            this.updateActiveNavLink(route);

        } catch (error) {
            console.error('Error loading route:', error);
            utils.showNotification('Error loading page', 'error');
            this.navigateTo(config.ROUTES.HOME);
        } finally {
            utils.hideLoading();
        }
    },

    // Parse route parameters from URL
    parseRouteParams(route) {
        this.routeParams = {};
        const routeParts = route.split('/').filter(part => part);
        
        for (const routePattern in this.routes) {
            if (routePattern.includes(':')) {
                const patternParts = routePattern.split('/').filter(part => part);
                
                if (patternParts.length === routeParts.length) {
                    for (let i = 0; i < patternParts.length; i++) {
                        if (patternParts[i].startsWith(':')) {
                            const paramName = patternParts[i].substring(1);
                            this.routeParams[paramName] = routeParts[i];
                        }
                    }
                    break;
                }
            }
        }
    },

    // Update active navigation link
    updateActiveNavLink(route) {
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === route) {
                link.classList.add('active');
            }
        });
    },

    // Get route parameters
    getRouteParams() {
        return this.routeParams;
    },

    // Refresh current route
    refresh() {
        this.loadRoute(this.currentRoute);
    }
};