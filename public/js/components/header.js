// Enhanced Header Component with Mobile Responsiveness
const headerComponent = {
    // Load header
    async load() {
        const isAuthenticated = auth.isAuthenticated();
        const user = auth.getCurrentUser();
        
        const headerHTML = `
            <div class="header-content">
                <div class="logo">
                    <img src="/assets/images/skillassess_logo.png" alt="SkillAssess Logo" class="badge-logo">
                    <span>SkillAssess</span>
                </div>
                
                <!-- Mobile menu toggle button -->
                <button class="mobile-menu-toggle" aria-label="Toggle navigation menu">
                    <i class="fas fa-bars"></i>
                </button>
                
                <nav id="main-nav">
                    <ul>
                        <li><a href="${config.ROUTES.HOME}" class="nav-link">Home</a></li>
                        <li><a href="${config.ROUTES.ASSESSMENTS}" class="nav-link">Assessments</a></li>
                        ${isAuthenticated ? `
                            <li><a href="${config.ROUTES.RESULTS}" class="nav-link">Results</a></li>
                            <li><a href="${config.ROUTES.PROFILE}" class="nav-link">Profile</a></li>
                            <li>
                                <div class="user-menu">
                                    <span class="user-greeting">Hello, ${user.name}</span>
                                    <a href="/wins" class="nav-link wins-highlight">Wins</a>
                                    <button class="btn btn-outline btn-sm logout-button">Logout</button>
                                </div>
                            </li>
                        ` : `
                            <li><a href="${config.ROUTES.LOGIN}" class="nav-link">Login</a></li>
                            <li><a href="${config.ROUTES.REGISTER}" class="btn btn-primary btn-sm">Register</a></li>
                        `}
                    </ul>
                </nav>
            </div>
        `;
        
        document.getElementById('header').innerHTML = headerHTML;
        
        // Add all event listeners
        this.addNavEventListeners();
        this.addLogoutListener();
        this.addMobileMenuListener();
        this.addResizeListener();
    },

    // Add mobile menu toggle functionality
    addMobileMenuListener() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const nav = document.querySelector('#main-nav');
        
        if (menuToggle && nav) {
            // Toggle menu on button click
            menuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMobileMenu();
            });
            
            // Close menu when clicking on nav links
            const navLinks = nav.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    this.closeMobileMenu();
                });
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!menuToggle.contains(e.target) && !nav.contains(e.target)) {
                    this.closeMobileMenu();
                }
            });
            
            // Handle escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.closeMobileMenu();
                }
            });
        }
    },
    
    // Toggle mobile menu
    toggleMobileMenu() {
        const nav = document.querySelector('#main-nav');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const icon = menuToggle.querySelector('i');
        
        if (nav) {
            const isActive = nav.classList.contains('mobile-menu-active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                this.openMobileMenu();
            }
        }
    },
    
    // Open mobile menu
    openMobileMenu() {
        const nav = document.querySelector('#main-nav');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const icon = menuToggle.querySelector('i');
        
        if (nav) {
            nav.classList.add('mobile-menu-active');
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
            menuToggle.setAttribute('aria-expanded', 'true');
            
            // Prevent body scroll when menu is open
            document.body.style.overflow = 'hidden';
        }
    },
    
    // Close mobile menu
    closeMobileMenu() {
        const nav = document.querySelector('#main-nav');
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const icon = menuToggle?.querySelector('i');
        
        if (nav) {
            nav.classList.remove('mobile-menu-active');
            if (icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
            if (menuToggle) {
                menuToggle.setAttribute('aria-expanded', 'false');
            }
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
    },
    
    // Add window resize listener
    addResizeListener() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Close mobile menu when resizing to desktop
                if (window.innerWidth > 768) {
                    this.closeMobileMenu();
                }
            }, 250);
        });
    },

    // Add navigation event listeners
    addNavEventListeners() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                
                // Close mobile menu before navigation
                this.closeMobileMenu();
                
                // Small delay to allow menu close animation
                setTimeout(() => {
                    router.navigateTo(href);
                }, 100);
            });
        });
    },

    // Add logout button listener
    addLogoutListener() {
        const logoutButton = document.querySelector('.logout-button');
        if (logoutButton) {
            // Remove any existing listeners first to prevent duplicates
            const newLogoutButton = logoutButton.cloneNode(true);
            logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
            
            // Add click event to the new button
            newLogoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Close mobile menu before logout
                this.closeMobileMenu();
                
                // Small delay then logout
                setTimeout(() => {
                    auth.logout();
                }, 100);
            });
        }
    },

    // Update authentication state
    async updateAuthState() {
        // Close mobile menu first
        this.closeMobileMenu();
        
        // Clear the current header
        document.getElementById('header').innerHTML = '';
        
        // Re-render the header
        await this.load();
    },

    // Initialize header (compatibility method)
    init() {
        return this.load();
    },

    // Clean up event listeners (useful for SPA navigation)
    cleanup() {
        // Remove resize listener
        window.removeEventListener('resize', this.resizeHandler);
        
        // Remove click outside listener
        document.removeEventListener('click', this.clickOutsideHandler);
        
        // Remove keydown listener
        document.removeEventListener('keydown', this.keydownHandler);
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
};