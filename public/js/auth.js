// Authentication management
const auth = {
    // Get current user
    getCurrentUser() {
        const userData = localStorage.getItem(config.STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
    },

    // Get auth token
    getToken() {
        const token = localStorage.getItem(config.STORAGE_KEYS.AUTH_TOKEN);
        console.log("📥 Retrieved token:", token);
        return token;
    },

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Check if token is expired (simple check)
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch (error) {
            return false;
        }
    },

    // Save authentication data
    saveAuthData(token, user) {
        console.log("✅ Saving token:", token);
        localStorage.setItem(config.STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(config.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    },

    // Clear authentication data
    clearAuthData() {
        localStorage.removeItem(config.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(config.STORAGE_KEYS.USER_DATA);
    },

    // Login user
    // async login(email, password) {
    //     try {
    //         utils.showLoading('Signing in...');
    //         const response = await api.post('/auth/login', { email, password });
            
    //         if (response.success) {
    //             this.saveAuthData(response.data.token, response.data.user);
    //             utils.showNotification('Login successful!', 'success');
    //             return response;
    //         } else {
    //             throw new Error(response.error || 'Login failed');
    //         }
    //     } catch (error) {
    //         utils.showNotification(error.message, 'error');
    //         throw error;
    //     } finally {
    //         utils.hideLoading();
    //     }
    // },

    // Login function
async login(email, password) {
    try {
        utils.showLoading('Signing in...');
        const response = await api.post('/auth/login', { email, password });
        
        if (response.success) {
            this.saveAuthData(response.data.token, response.data.user);
            utils.showNotification('Login successful!', 'success');
            
            // Update the header to show authenticated state
            if (typeof headerComponent !== 'undefined') {
                await headerComponent.updateAuthState();
            }
            
            // Redirect to home page
            router.navigateTo(config.ROUTES.HOME);
            
            return response;
        } else {
            throw new Error(response.error || 'Login failed');
        }
    } catch (error) {
        utils.showNotification(error.message, 'error');
        throw error;
    } finally {
        utils.hideLoading();
    }
},

    // Register user
    async register(userData) {
        try {
            utils.showLoading('Creating account...');
            const response = await api.post('/auth/register', userData);
            
            if (response.success) {
                this.saveAuthData(response.data.token, response.data.user);
                utils.showNotification('Registration successful!', 'success');
                return response;
            } else {
                throw new Error(response.error || 'Registration failed');
            }
        } catch (error) {
            utils.showNotification(error.message, 'error');
            throw error;
        } finally {
            utils.hideLoading();
        }
    },

    // Logout user
    logout() {
        const confirmLogout = confirm('Are you sure you want to logout?');
        
        if (confirmLogout) {
            this.clearAuthData();
            utils.showNotification('Logged out successfully', 'info');
            
            // Update header and redirect
            if (typeof headerComponent !== 'undefined') {
                headerComponent.updateAuthState().then(() => {
                    router.navigateTo(config.ROUTES.HOME);
                });
            } else {
                router.navigateTo(config.ROUTES.HOME);
            }
        }
    },

    // Update user profile
    async updateProfile(profileData) {
        try {
            utils.showLoading('Updating profile...');
            const response = await api.put('/auth/profile', profileData);
            
            if (response.success) {
                const currentUser = this.getCurrentUser();
                const updatedUser = { ...currentUser, ...response.data.user };
                localStorage.setItem(config.STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
                utils.showNotification('Profile updated successfully!', 'success');
                return response;
            } else {
                throw new Error(response.error || 'Profile update failed');
            }
        } catch (error) {
            utils.showNotification(error.message, 'error');
            throw error;
        } finally {
            utils.hideLoading();
        }
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            utils.showLoading('Changing password...');
            const response = await api.put('/auth/change-password', {
                currentPassword,
                newPassword
            });
            
            if (response.success) {
                utils.showNotification('Password changed successfully!', 'success');
                return response;
            } else {
                throw new Error(response.error || 'Password change failed');
            }
        } catch (error) {
            utils.showNotification(error.message, 'error');
            throw error;
        } finally {
            utils.hideLoading();
        }
    }
};