/**
 * Optimized Diagnosis Processing Module
 * Improves performance through caching, debouncing, and efficient data handling
 */

class OptimizedDiagnosisProcessor {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.requestQueue = [];
        this.isProcessing = false;
        this.maxCacheSize = 100;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        // Pre-compile common symptom patterns for faster matching
        this.symptomPatterns = this.initializeSymptomPatterns();
        
        // Initialize performance monitoring
        this.performanceMetrics = {
            totalRequests: 0,
            cacheHits: 0,
            averageResponseTime: 0
        };
    }

    initializeSymptomPatterns() {
        return {
            fever: /fever|high temperature|pyrexia/i,
            cough: /cough|coughing|persistent cough/i,
            headache: /headache|head pain|migraine/i,
            fatigue: /fatigue|tired|weakness|exhaustion/i,
            nausea: /nausea|vomiting|sick/i,
            breathing: /breathing|shortness of breath|dyspnea/i
        };
    }

    // Generate cache key for diagnosis request
    generateCacheKey(symptoms, patientData, diseaseType) {
        const sortedSymptoms = [...symptoms].sort().join(',');
        const patientKey = patientData ? 
            `${patientData.age || 'unknown'}_${patientData.gender || 'unknown'}` : 'unknown';
        return `${sortedSymptoms}_${patientKey}_${diseaseType || 'general'}`;
    }

    // Check if cached result is still valid
    isCacheValid(cacheEntry) {
        return Date.now() - cacheEntry.timestamp < this.cacheExpiry;
    }

    // Get cached diagnosis result
    getCachedResult(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && this.isCacheValid(cached)) {
            this.performanceMetrics.cacheHits++;
            return cached.result;
        }
        
        // Remove expired cache entry
        if (cached) {
            this.cache.delete(cacheKey);
        }
        return null;
    }

    // Cache diagnosis result
    cacheResult(cacheKey, result) {
        // Implement LRU cache eviction
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(cacheKey, {
            result: result,
            timestamp: Date.now()
        });
    }

    // Debounced symptom processing to avoid excessive API calls
    debounceSymptomProcessing(callback, delay = 300) {
        const timerId = 'symptom_processing';
        
        if (this.debounceTimers.has(timerId)) {
            clearTimeout(this.debounceTimers.get(timerId));
        }
        
        const timer = setTimeout(() => {
            callback();
            this.debounceTimers.delete(timerId);
        }, delay);
        
        this.debounceTimers.set(timerId, timer);
    }

    // Fast symptom validation and preprocessing
    preprocessSymptoms(symptoms) {
        const startTime = performance.now();
        
        // Remove duplicates and normalize
        const normalizedSymptoms = [...new Set(symptoms)]
            .map(symptom => symptom.trim().toLowerCase())
            .filter(symptom => symptom.length > 0);
        
        // Group related symptoms for better processing
        const groupedSymptoms = this.groupRelatedSymptoms(normalizedSymptoms);
        
        console.log(`Symptom preprocessing took ${performance.now() - startTime}ms`);
        return groupedSymptoms;
    }

    // Group related symptoms to reduce processing overhead
    groupRelatedSymptoms(symptoms) {
        const groups = {
            respiratory: [],
            gastrointestinal: [],
            neurological: [],
            general: [],
            other: []
        };

        symptoms.forEach(symptom => {
            if (this.symptomPatterns.cough.test(symptom) || 
                this.symptomPatterns.breathing.test(symptom)) {
                groups.respiratory.push(symptom);
            } else if (this.symptomPatterns.nausea.test(symptom)) {
                groups.gastrointestinal.push(symptom);
            } else if (this.symptomPatterns.headache.test(symptom)) {
                groups.neurological.push(symptom);
            } else if (this.symptomPatterns.fever.test(symptom) || 
                       this.symptomPatterns.fatigue.test(symptom)) {
                groups.general.push(symptom);
            } else {
                groups.other.push(symptom);
            }
        });

        return groups;
    }

    // Optimized diagnosis submission with queue management
    async submitOptimizedDiagnosis(diagnosisData) {
        const startTime = performance.now();
        this.performanceMetrics.totalRequests++;

        try {
            // Preprocess symptoms for faster processing
            const processedSymptoms = this.preprocessSymptoms(diagnosisData.symptoms || []);
            
            // Generate cache key
            const cacheKey = this.generateCacheKey(
                diagnosisData.symptoms || [],
                diagnosisData.patient_data,
                diagnosisData.diseaseType
            );

            // Check cache first
            const cachedResult = this.getCachedResult(cacheKey);
            if (cachedResult) {
                console.log('Cache hit - returning cached result');
                return cachedResult;
            }

            // Add to processing queue if not already processing
            if (this.isProcessing) {
                return new Promise((resolve, reject) => {
                    this.requestQueue.push({ diagnosisData, resolve, reject, cacheKey });
                });
            }

            this.isProcessing = true;

            // Optimize request payload
            const optimizedPayload = this.optimizeRequestPayload(diagnosisData, processedSymptoms);

            // Make API request with timeout and retry logic
            const result = await this.makeOptimizedApiRequest(optimizedPayload);

            // Cache the result
            this.cacheResult(cacheKey, result);

            // Update performance metrics
            const responseTime = performance.now() - startTime;
            this.updatePerformanceMetrics(responseTime);

            // Process queued requests
            this.processQueue();

            return result;

        } catch (error) {
            console.error('Optimized diagnosis failed:', error);
            this.isProcessing = false;
            throw error;
        }
    }

    // Optimize request payload to match backend PredictionRequest schema
    optimizeRequestPayload(diagnosisData, processedSymptoms) {
        return {
            symptoms: diagnosisData.symptoms || [],
            patient_data: {
                name: diagnosisData.patient_data?.name || 'Patient',
                age: diagnosisData.patient_data?.age || 30,
                gender: diagnosisData.patient_data?.gender || 'unknown',
                medical_history: diagnosisData.patient_data?.medical_history || ''
            },
            region: diagnosisData.patient_data?.region || 'east_africa',
            medical_images: diagnosisData.medical_images || []
        };
    }

    // Determine request priority based on symptoms
    determinePriority(processedSymptoms) {
        const emergencySymptoms = ['chest pain', 'difficulty breathing', 'severe headache', 'high fever'];
        const hasEmergencySymptoms = Object.values(processedSymptoms)
            .flat()
            .some(symptom => emergencySymptoms.some(emergency => symptom.includes(emergency)));
        
        return hasEmergencySymptoms ? 'high' : 'normal';
    }

    // Optimized API request with connection pooling and retry logic
    async makeOptimizedApiRequest(payload) {
        const maxRetries = 3;
        const baseDelay = 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

                const response = await fetch('http://localhost:8001/api/v1/predict/grok-primary', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${await this.getAuthToken()}`
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                return await response.json();

            } catch (error) {
                console.warn(`API request attempt ${attempt} failed:`, error.message);
                
                if (attempt === maxRetries) {
                    throw error;
                }

                // Exponential backoff
                await new Promise(resolve => 
                    setTimeout(resolve, baseDelay * Math.pow(2, attempt - 1))
                );
            }
        }
    }

    // Process queued requests
    async processQueue() {
        if (this.requestQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        const { diagnosisData, resolve, reject, cacheKey } = this.requestQueue.shift();

        try {
            const result = await this.makeOptimizedApiRequest(
                this.optimizeRequestPayload(diagnosisData, this.preprocessSymptoms(diagnosisData.symptoms || []))
            );
            
            this.cacheResult(cacheKey, result);
            resolve(result);
        } catch (error) {
            reject(error);
        }

        // Continue processing queue
        setTimeout(() => this.processQueue(), 100);
    }

    // Get authentication token with caching
    async getAuthToken() {
        const cachedToken = sessionStorage.getItem('auth_token');
        const tokenExpiry = sessionStorage.getItem('token_expiry');
        
        if (cachedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            return cachedToken;
        }

        try {
            const response = await fetch('http://localhost:8001/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    username: 'worker@afridiag.com',
                    password: 'demo123'
                })
            });

            if (response.ok) {
                const data = await response.json();
                const token = data.access_token;
                const expiry = Date.now() + (55 * 60 * 1000); // 55 minutes
                
                sessionStorage.setItem('auth_token', token);
                sessionStorage.setItem('token_expiry', expiry.toString());
                
                return token;
            }
        } catch (error) {
            console.error('Token fetch failed:', error);
        }
        
        return null;
    }

    // Update performance metrics
    updatePerformanceMetrics(responseTime) {
        const { totalRequests, averageResponseTime } = this.performanceMetrics;
        this.performanceMetrics.averageResponseTime = 
            (averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    }

    // Get performance statistics
    getPerformanceStats() {
        const cacheHitRate = this.performanceMetrics.totalRequests > 0 ? 
            (this.performanceMetrics.cacheHits / this.performanceMetrics.totalRequests * 100).toFixed(2) : 0;
        
        return {
            ...this.performanceMetrics,
            cacheHitRate: `${cacheHitRate}%`,
            cacheSize: this.cache.size
        };
    }

    // Clear cache manually
    clearCache() {
        this.cache.clear();
        console.log('Diagnosis cache cleared');
    }
}

// Create global instance
window.optimizedDiagnosisProcessor = new OptimizedDiagnosisProcessor();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OptimizedDiagnosisProcessor;
}