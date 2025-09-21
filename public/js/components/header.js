// Header component
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
                                    <li><a href="/wins" class="nav-link wins-highlight">Wins</a></li>
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
        
        // Add logout button listener - ADD THIS LINE
        this.addEventListener();
    },

    // Update authentication state
    async updateAuthState() {
        // Clear the current header
        document.getElementById('header').innerHTML = '';
        
        // Re-render the header
        await this.load();
        
        // Re-attach all event listeners
        this.addEventListeners();
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
            // Remove any existing listeners first to prevent duplicates
            const newLogoutButton = logoutButton.cloneNode(true);
            logoutButton.parentNode.replaceChild(newLogoutButton, logoutButton);
            
            // Add click event to the new button
            newLogoutButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                auth.logout();
            });
        }
    },

    // Update authentication state
    updateAuthState() {
        return this.load();
    }
};