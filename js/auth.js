/**
 * AfriDiag Authentication Utility
 * Handles user authentication, session management, and access control
 */

class AfriDiagAuth {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8001/api/v1';
        this.tokenKey = 'authToken';
        this.userKey = 'userEmail';
        this.init();
    }

    init() {
        this.checkAuthOnLoad();
        this.setupTokenRefresh();
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem(this.tokenKey);
        return !!token && !this.isTokenExpired(token);
    }

    // Get current user info
    getCurrentUser() {
        return {
            email: localStorage.getItem(this.userKey),
            token: localStorage.getItem(this.tokenKey)
        };
    }

    // Login function
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'username': email,
                    'password': password
                })
            });

            if (response.ok) {
                const data = await response.json();
                this.setAuthData(data.access_token, email);
                return { success: true, data };
            } else {
                const error = await response.json();
                return { success: false, error: error.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error. Please try again.' };
        }
    }

    // Logout function
    logout() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
        this.redirectToLogin();
    }

    // Set authentication data
    setAuthData(token, email) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, email);
    }

    // Check if token is expired (basic check)
    isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp < currentTime;
        } catch (error) {
            return true; // If we can't parse the token, consider it expired
        }
    }

    // Redirect to login page
    redirectToLogin() {
        const currentPage = window.location.pathname;
        const loginPage = 'login.html';
        
        // Don't redirect if already on login page
        if (!currentPage.includes(loginPage)) {
            window.location.href = loginPage;
        }
    }

    // Redirect to home page
    redirectToHome() {
        window.location.href = 'index.html';
    }

    // Check authentication on page load
    checkAuthOnLoad() {
        const currentPage = window.location.pathname;
        const publicPages = ['login.html', 'index.html'];
        const isPublicPage = publicPages.some(page => currentPage.includes(page));

        // If on login page and authenticated, redirect to home
        if (currentPage.includes('login.html') && this.isAuthenticated()) {
            this.redirectToHome();
            return;
        }

        // If on protected page and not authenticated, redirect to login
        if (!isPublicPage && !this.isAuthenticated()) {
            this.redirectToLogin();
            return;
        }
    }

    // Setup automatic token refresh
    setupTokenRefresh() {
        // Check token validity every 5 minutes
        setInterval(() => {
            const token = localStorage.getItem(this.tokenKey);
            if (token && this.isTokenExpired(token)) {
                console.log('Token expired, logging out...');
                this.logout();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    // Make authenticated API requests
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem(this.tokenKey);
        
        if (!token) {
            this.redirectToLogin();
            return null;
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, mergedOptions);
            
            if (response.status === 401) {
                // Token is invalid, logout
                this.logout();
                return null;
            }

            return response;
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    // Show authentication status in UI
    updateAuthUI() {
        const user = this.getCurrentUser();
        const userEmailElement = document.getElementById('userEmail');
        
        if (userEmailElement && user.email) {
            userEmailElement.textContent = user.email;
        }
    }

    // Demo login for testing
    demoLogin(userType = 'doctor') {
        const demoUsers = {
            doctor: { email: 'dr.smith@afridiag.com', token: 'demo_token_doctor' },
            nurse: { email: 'nurse.jane@afridiag.com', token: 'demo_token_nurse' },
            admin: { email: 'admin@afridiag.com', token: 'demo_token_admin' }
        };

        const user = demoUsers[userType];
        if (user) {
            this.setAuthData(user.token, user.email);
            return { success: true, user };
        }
        return { success: false, error: 'Invalid demo user type' };
    }
}

// Global instance
window.afridiagAuth = new AfriDiagAuth();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AfriDiagAuth;
}