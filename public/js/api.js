// // API service for making HTTP requests
// const api = {
//     // Base headers
//     getHeaders(includeAuth = true) {
//         const headers = {
//             'Content-Type': 'application/json',
//         };

//         if (includeAuth) {
//             const token = auth.getToken();
//             if (token) {
//                 headers['Authorization'] = `Bearer ${token}`;
//             }
//         }

//         return headers;
//     },

//     // Handle response
//     async handleResponse(response) {
//         const data = await response.json();
        
//         if (!response.ok) {
//             if (response.status === 401) {
//                 auth.clearAuthData();
//                 router.navigateTo(config.ROUTES.LOGIN);
//             }
//             throw new Error(data.error || `HTTP error! status: ${response.status}`);
//         }
        
//         return data;
//     },

//     // GET request
//     async get(endpoint, params = {}) {
//         try {
//             const url = new URL(`${config.API_BASE_URL}${endpoint}`);
//             Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
//             const response = await fetch(url, {
//                 method: 'GET',
//                 headers: this.getHeaders(),
//             });
            
//             return await this.handleResponse(response);
//         } catch (error) {
//             console.error('GET request failed:', error);
//             throw error;
//         }
//     },

//     // POST request
//     async post(endpoint, data = {}) {
//         try {
//             const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
//                 method: 'POST',
//                 headers: this.getHeaders(),
//                 body: JSON.stringify(data),
//             });
            
//             return await this.handleResponse(response);
//         } catch (error) {
//             console.error('POST request failed:', error);
//             throw error;
//         }
//     },

//     // PUT request
//     async put(endpoint, data = {}) {
//         try {
//             const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
//                 method: 'PUT',
//                 headers: this.getHeaders(),
//                 body: JSON.stringify(data),
//             });
            
//             return await this.handleResponse(response);
//         } catch (error) {
//             console.error('PUT request failed:', error);
//             throw error;
//         }
//     },

//     // DELETE request
//     async delete(endpoint) {
//         try {
//             const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
//                 method: 'DELETE',
//                 headers: this.getHeaders(),
//             });
            
//             return await this.handleResponse(response);
//         } catch (error) {
//             console.error('DELETE request failed:', error);
//             throw error;
//         }
//     },

//     // Upload file
//     async upload(endpoint, formData) {
//         try {
//             const headers = this.getHeaders();
//             delete headers['Content-Type']; // Let browser set content type for FormData
            
//             const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
//                 method: 'POST',
//                 headers: headers,
//                 body: formData,
//             });
            
//             return await this.handleResponse(response);
//         } catch (error) {
//             console.error('Upload request failed:', error);
//             throw error;
//         }
//     }
// };


// API service for making HTTP requests
const api = {
    // Base headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };

        if (includeAuth) {
            const token = auth.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            } else {
                console.warn("⚠️ No auth token found when preparing headers.");
            }
        }

        return headers;
    },

    // Handle response
    async handleResponse(response) {
        let data;
        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            console.error("❌ API error response:", data);
            if (response.status === 401) {
                auth.clearAuthData();
                router.navigateTo(config.ROUTES.LOGIN);
            }
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    },

    // GET request
    async get(endpoint, params = {}) {
        try {
            const url = new URL(`${config.API_BASE_URL}${endpoint}`);
            Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
            
            console.log("➡️ GET:", url.toString());

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('GET request failed:', error);
            throw error;
        }
    },

    // POST request
    async post(endpoint, data = {}) {
        try {
            console.log("➡️ POST:", `${config.API_BASE_URL}${endpoint}`, "Body:", data);

            const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('POST request failed:', error);
            throw error;
        }
    },

    // PUT request
    async put(endpoint, data = {}) {
        try {
            console.log("➡️ PUT:", `${config.API_BASE_URL}${endpoint}`, "Body:", data);

            const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data),
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('PUT request failed:', error);
            throw error;
        }
    },

    // DELETE request
    async delete(endpoint) {
        try {
            console.log("➡️ DELETE:", `${config.API_BASE_URL}${endpoint}`);

            const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
                method: 'DELETE',
                headers: this.getHeaders(),
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('DELETE request failed:', error);
            throw error;
        }
    },

    // Upload file
    async upload(endpoint, formData) {
        try {
            const headers = this.getHeaders();
            delete headers['Content-Type']; // Let browser set content type for FormData

            console.log("➡️ UPLOAD:", `${config.API_BASE_URL}${endpoint}`);

            const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: formData,
            });
            
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Upload request failed:', error);
            throw error;
        }
    }
};
