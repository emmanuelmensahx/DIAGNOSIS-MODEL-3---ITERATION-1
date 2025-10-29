/**
 * AfriDiag API Client
 * Handles all backend API communications
 */

class AfriDiagAPI {
    constructor() {
        this.baseURL = '/api/v1';  // Use relative path to leverage proxy
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user') || '{}');
    }

    // Helper method to make API requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        // Add authorization header if token exists (get fresh token from localStorage)
        const currentToken = localStorage.getItem('authToken');
        if (currentToken) {
            config.headers['Authorization'] = `Bearer ${currentToken}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // GET method for compatibility with existing code
    async get(endpoint, options = {}) {
        return await this.request(endpoint, {
            method: 'GET',
            ...options,
        });
    }

    // POST method for convenience
    async post(endpoint, data = null, options = {}) {
        return await this.request(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : null,
            ...options,
        });
    }

    // PUT method for convenience
    async put(endpoint, data = null, options = {}) {
        return await this.request(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : null,
            ...options,
        });
    }

    // DELETE method for convenience
    async delete(endpoint, options = {}) {
        return await this.request(endpoint, {
            method: 'DELETE',
            ...options,
        });
    }

    // Authentication methods
    async login(email, password) {
        try {
            // Use form data for authentication as backend expects OAuth2PasswordRequestForm
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    'username': email,
                    'password': password
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.access_token) {
                this.token = data.access_token;
                localStorage.setItem('authToken', this.token);
                localStorage.setItem('user', JSON.stringify(data.user || {}));
                this.user = data.user || {};
            }
            
            return data;
        } catch (error) {
            throw new Error('Login failed: ' + error.message);
        }
    }

    async logout() {
        this.token = null;
        this.user = {};
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }

    // User methods
    async getCurrentUser() {
        return await this.request('/users/me');
    }

    async updateUser(userData) {
        return await this.request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    // Patient methods
    async getPatients(page = 1, limit = 10, search = '') {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(search && { search }),
        });
        return await this.request(`/patients/?${params}`);
    }

    async getPatient(patientId) {
        return await this.request(`/patients/${patientId}`);
    }

    async createPatient(patientData) {
        return await this.request('/patients/', {
            method: 'POST',
            body: JSON.stringify(patientData),
        });
    }

    async updatePatient(patientId, patientData) {
        return await this.request(`/patients/${patientId}`, {
            method: 'PUT',
            body: JSON.stringify(patientData),
        });
    }

    async deletePatient(patientId) {
        return await this.request(`/patients/${patientId}`, {
            method: 'DELETE',
        });
    }

    // Diagnosis methods
    async getDiagnoses(patientId = null) {
        const params = patientId ? `?patient_id=${patientId}` : '';
        return await this.request(`/diagnoses${params}`);
    }

    async createDiagnosis(diagnosisData) {
        return await this.request('/diagnoses/', {
            method: 'POST',
            body: JSON.stringify(diagnosisData),
        });
    }

    async updateDiagnosis(diagnosisId, diagnosisData) {
        return await this.request(`/diagnoses/${diagnosisId}`, {
            method: 'PUT',
            body: JSON.stringify(diagnosisData),
        });
    }

    // AI Prediction methods
    async predictDiagnosis(symptoms, patientData = {}) {
        return await this.request('/predictions/diagnose', {
            method: 'POST',
            body: JSON.stringify({
                symptoms,
                patient_data: patientData,
            }),
        });
    }

    async analyzeImage(imageData, imageType = 'xray') {
        const formData = new FormData();
        formData.append('image', imageData);
        formData.append('image_type', imageType);

        return await this.request('/predictions/analyze-image', {
            method: 'POST',
            headers: {
                // Remove Content-Type to let browser set it with boundary
                'Authorization': this.token ? `Bearer ${this.token}` : undefined,
            },
            body: formData,
        });
    }

    // Treatment methods
    async getTreatments(diseaseType = null) {
        const params = diseaseType ? `?disease_type=${diseaseType}` : '';
        return await this.request(`/treatments/${params}`);
    }

    async getTreatment(treatmentId) {
        return await this.request(`/treatments/${treatmentId}`);
    }

    async searchTreatments(query) {
        return await this.request(`/treatments/search?q=${encodeURIComponent(query)}`);
    }

    async getDrugInteractions(medications) {
        return await this.request('/treatments/drug-interactions', {
            method: 'POST',
            body: JSON.stringify({ medications }),
        });
    }

    async calculateDosage(medication, patientWeight, patientAge) {
        return await this.request('/treatments/calculate-dosage', {
            method: 'POST',
            body: JSON.stringify({
                medication,
                patient_weight: patientWeight,
                patient_age: patientAge,
            }),
        });
    }

    // Chat methods
    async getChatRooms() {
        return await this.request('/chat/rooms');
    }

    async createChatRoom(roomData) {
        return await this.request('/chat/rooms', {
            method: 'POST',
            body: JSON.stringify(roomData),
        });
    }

    async getChatRoom(roomId) {
        return await this.request(`/chat/rooms/${roomId}`);
    }

    async getChatMessages(roomId, skip = 0, limit = 50) {
        return await this.request(`/chat/rooms/${roomId}/messages?skip=${skip}&limit=${limit}`);
    }

    async sendChatMessage(roomId, messageData) {
        return await this.request(`/chat/rooms/${roomId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData),
        });
    }

    async joinChatRoom(roomId) {
        return await this.request(`/chat/rooms/${roomId}/join`, {
            method: 'POST',
        });
    }

    async leaveChatRoom(roomId) {
        return await this.request(`/chat/rooms/${roomId}/leave`, {
            method: 'POST',
        });
    }

    // Statistics methods
    async getUserStatistics() {
        return await this.request('/statistics/user');
    }

    async getSystemStatistics() {
        return await this.request('/statistics/system');
    }

    async getDiagnosisStatistics(period = '30d') {
        return await this.request(`/statistics/diagnoses?period=${period}`);
    }

    // Notification methods
    async getNotifications() {
        return await this.request('/notifications/');
    }

    async markNotificationRead(notificationId) {
        return await this.request(`/notifications/${notificationId}/read`, {
            method: 'PUT',
        });
    }

    // Sync methods
    async syncData() {
        return await this.request('/sync/data', {
            method: 'POST',
        });
    }

    async exportData(format = 'json') {
        return await this.request(`/sync/export?format=${format}`);
    }

    // Utility methods
    isAuthenticated() {
        return !!this.token;
    }

    getUser() {
        return this.user;
    }

    // Mock data for offline functionality
    getMockPatients() {
        return [
            {
                id: 1,
                name: "Sarah Johnson",
                age: 28,
                gender: "Female",
                phone: "+234 123 456 7890",
                email: "sarah.j@email.com",
                last_visit: "2024-01-15",
                status: "Active",
                diagnosis_count: 3
            },
            {
                id: 2,
                name: "Michael Chen",
                age: 45,
                gender: "Male",
                phone: "+234 987 654 3210",
                email: "m.chen@email.com",
                last_visit: "2024-01-14",
                status: "Follow-up",
                diagnosis_count: 1
            },
            {
                id: 3,
                name: "Amara Okafor",
                age: 32,
                gender: "Female",
                phone: "+234 555 123 4567",
                email: "amara.o@email.com",
                last_visit: "2024-01-13",
                status: "Recovered",
                diagnosis_count: 2
            }
        ];
    }

    getMockTreatments() {
        return [
            {
                id: "T001",
                name: "Malaria Treatment Protocol",
                disease: "Malaria",
                category: "Infectious Disease",
                severity: "Moderate",
                duration: "3 days",
                medications: [
                    {
                        name: "Artemether-Lumefantrine",
                        dosage: "20mg/120mg",
                        frequency: "Twice daily",
                        duration: "3 days"
                    },
                    {
                        name: "Paracetamol",
                        dosage: "500mg",
                        frequency: "Every 6 hours",
                        duration: "As needed"
                    }
                ],
                procedures: ["Blood smear examination", "Rapid diagnostic test"],
                precautions: ["Monitor for side effects", "Ensure complete course"],
                contraindications: ["Pregnancy (first trimester)", "Severe liver disease"],
                description: "Standard treatment protocol for uncomplicated malaria"
            },
            {
                id: "T002",
                name: "Pneumonia Management",
                disease: "Pneumonia",
                category: "Respiratory",
                severity: "Severe",
                duration: "7-10 days",
                medications: [
                    {
                        name: "Amoxicillin",
                        dosage: "500mg",
                        frequency: "Three times daily",
                        duration: "7 days"
                    },
                    {
                        name: "Azithromycin",
                        dosage: "250mg",
                        frequency: "Once daily",
                        duration: "5 days"
                    }
                ],
                procedures: ["Chest X-ray", "Sputum culture", "Blood tests"],
                precautions: ["Monitor respiratory status", "Ensure adequate hydration"],
                contraindications: ["Allergy to penicillin", "Severe kidney disease"],
                description: "Comprehensive pneumonia treatment protocol"
            },
            {
                id: "T003",
                name: "Tuberculosis Treatment",
                disease: "Tuberculosis",
                category: "Infectious Disease",
                severity: "Severe",
                duration: "6 months",
                medications: [
                    {
                        name: "Rifampin",
                        dosage: "600mg",
                        frequency: "Once daily",
                        duration: "6 months"
                    },
                    {
                        name: "Isoniazid",
                        dosage: "300mg",
                        frequency: "Once daily",
                        duration: "6 months"
                    },
                    {
                        name: "Ethambutol",
                        dosage: "15mg/kg",
                        frequency: "Once daily",
                        duration: "2 months"
                    },
                    {
                        name: "Pyrazinamide",
                        dosage: "25mg/kg",
                        frequency: "Once daily",
                        duration: "2 months"
                    }
                ],
                procedures: ["Sputum smear", "Chest X-ray", "Drug sensitivity testing"],
                precautions: ["Monitor liver function", "Check vision regularly", "Ensure DOT compliance"],
                contraindications: ["Severe liver disease", "Optic neuritis", "Pregnancy (for some drugs)"],
                description: "Standard DOTS protocol for tuberculosis treatment"
            }
        ];
    }

    getMockStatistics() {
        return {
            patients_diagnosed: 247,
            cases_this_month: 89,
            accuracy_rate: 96,
            active_days: 15,
            treatments_prescribed: 156,
            followups_pending: 23,
            recent_activity: [
                {
                    type: "diagnosis",
                    title: "Diagnosed Patient #247",
                    description: "Malaria case successfully identified",
                    time: "2 hours ago",
                    icon: "🩺"
                },
                {
                    type: "patient",
                    title: "New Patient Registered",
                    description: "Sarah Johnson added to system",
                    time: "4 hours ago",
                    icon: "👥"
                },
                {
                    type: "treatment",
                    title: "Treatment Updated",
                    description: "Modified pneumonia protocol",
                    time: "6 hours ago",
                    icon: "💊"
                }
            ]
        };
    }
}

// Create global API instance
const api = new AfriDiagAPI();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AfriDiagAPI;
}