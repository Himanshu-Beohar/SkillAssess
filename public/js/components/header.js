// Header component
const headerComponent = {
    // Load header
    async load() {
        const isAuthenticated = auth.isAuthenticated();
        const user = auth.getCurrentUser();
        
        const headerHTML = `
            <div class="header-content">
                <div class="logo">
                    <i class="fas fa-brain"></i>
                    <span>SkillAssess</span>
                </div>
                <nav>
                    <ul>
                        <li><a href="${config.ROUTES.HOME}" class="nav-link">Home</a></li>
                        <li><a href="${config.ROUTES.ASSESSMENTS}" class="nav-link">Assessments</a></li>
                        ${isAuthenticated ? `
                            <li><a href="${config.ROUTES.RESULTS}" class="nav-link">Results</a></li>
                            <li><a href="${config.ROUTES.PROFILE}" class="nav-link">Profile</a></li>
                            <li>
                                <div class="user-menu">
                                    <span class="user-greeting">Hello, ${user.name}</span>
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
        
        // Add click event listeners to nav links
        this.addNavEventListeners();
        
    },

    // Add navigation event listeners
    addNavEventListeners() {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                router.navigateTo(href);
            });
        });
    },

    addEventListener() {
        const logoutButton = document.querySelector('.logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                auth.logout();
            });
        }
    },

    // Update authentication state
    updateAuthState() {
        this.load();
    }
};