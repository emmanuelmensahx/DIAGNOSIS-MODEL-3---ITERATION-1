/**
 * Fast Symptom Auto-completion System
 * Provides instant symptom suggestions for faster diagnosis input
 */

class SymptomAutocomplete {
    constructor() {
        this.symptoms = this.initializeSymptomDatabase();
        this.searchIndex = this.buildSearchIndex();
        this.recentSymptoms = this.loadRecentSymptoms();
        this.maxSuggestions = 8;
        this.minSearchLength = 2;
        
        // Performance optimization: pre-compile regex patterns
        this.searchPatterns = new Map();
    }

    // Comprehensive symptom database for fast lookup
    initializeSymptomDatabase() {
        return [
            // General symptoms
            'fever', 'high temperature', 'chills', 'sweating', 'fatigue', 'weakness',
            'headache', 'dizziness', 'nausea', 'vomiting', 'loss of appetite',
            'weight loss', 'weight gain', 'night sweats', 'malaise',
            
            // Respiratory symptoms
            'cough', 'dry cough', 'productive cough', 'shortness of breath',
            'difficulty breathing', 'chest pain', 'wheezing', 'sore throat',
            'runny nose', 'nasal congestion', 'sneezing', 'hoarse voice',
            
            // Gastrointestinal symptoms
            'abdominal pain', 'stomach pain', 'diarrhea', 'constipation',
            'bloating', 'gas', 'heartburn', 'acid reflux', 'blood in stool',
            'black stool', 'yellow stool', 'cramping', 'indigestion',
            
            // Neurological symptoms
            'severe headache', 'migraine', 'confusion', 'memory loss',
            'seizures', 'tremors', 'numbness', 'tingling', 'muscle weakness',
            'coordination problems', 'vision problems', 'hearing problems',
            
            // Musculoskeletal symptoms
            'joint pain', 'muscle pain', 'back pain', 'neck pain',
            'stiffness', 'swelling', 'bruising', 'limited mobility',
            'muscle cramps', 'bone pain',
            
            // Skin symptoms
            'rash', 'itching', 'skin discoloration', 'bumps', 'blisters',
            'dry skin', 'oily skin', 'acne', 'hives', 'eczema',
            'skin lesions', 'moles', 'warts',
            
            // Cardiovascular symptoms
            'chest tightness', 'heart palpitations', 'irregular heartbeat',
            'rapid heartbeat', 'slow heartbeat', 'leg swelling',
            'ankle swelling', 'cold hands', 'cold feet',
            
            // Urinary symptoms
            'frequent urination', 'painful urination', 'blood in urine',
            'dark urine', 'cloudy urine', 'strong urine odor',
            'difficulty urinating', 'incontinence',
            
            // Mental health symptoms
            'anxiety', 'depression', 'mood swings', 'irritability',
            'sleep problems', 'insomnia', 'excessive sleeping',
            'panic attacks', 'stress', 'restlessness',
            
            // Infectious disease symptoms
            'swollen lymph nodes', 'sore muscles', 'body aches',
            'red eyes', 'sensitivity to light', 'stiff neck',
            'difficulty swallowing', 'persistent cough',
            
            // Emergency symptoms
            'severe chest pain', 'difficulty breathing', 'severe headache',
            'high fever', 'severe abdominal pain', 'loss of consciousness',
            'severe bleeding', 'severe burns', 'poisoning symptoms'
        ];
    }

    // Build optimized search index for O(1) lookups
    buildSearchIndex() {
        const index = new Map();
        
        this.symptoms.forEach(symptom => {
            const words = symptom.toLowerCase().split(' ');
            
            // Index by full symptom
            const key = symptom.toLowerCase();
            if (!index.has(key)) {
                index.set(key, []);
            }
            index.get(key).push(symptom);
            
            // Index by individual words
            words.forEach(word => {
                if (word.length >= 2) {
                    if (!index.has(word)) {
                        index.set(word, []);
                    }
                    if (!index.get(word).includes(symptom)) {
                        index.get(word).push(symptom);
                    }
                }
            });
            
            // Index by prefixes for faster partial matching
            for (let i = 2; i <= key.length; i++) {
                const prefix = key.substring(0, i);
                if (!index.has(prefix)) {
                    index.set(prefix, []);
                }
                if (!index.get(prefix).includes(symptom)) {
                    index.get(prefix).push(symptom);
                }
            }
        });
        
        return index;
    }

    // Load recently used symptoms from localStorage
    loadRecentSymptoms() {
        try {
            const recent = localStorage.getItem('recent_symptoms');
            return recent ? JSON.parse(recent) : [];
        } catch (error) {
            console.warn('Failed to load recent symptoms:', error);
            return [];
        }
    }

    // Save recently used symptoms
    saveRecentSymptoms() {
        try {
            localStorage.setItem('recent_symptoms', JSON.stringify(this.recentSymptoms));
        } catch (error) {
            console.warn('Failed to save recent symptoms:', error);
        }
    }

    // Add symptom to recent list
    addToRecent(symptom) {
        const normalizedSymptom = symptom.toLowerCase().trim();
        
        // Remove if already exists
        this.recentSymptoms = this.recentSymptoms.filter(s => s !== normalizedSymptom);
        
        // Add to beginning
        this.recentSymptoms.unshift(normalizedSymptom);
        
        // Keep only last 20 symptoms
        this.recentSymptoms = this.recentSymptoms.slice(0, 20);
        
        this.saveRecentSymptoms();
    }

    // Fast symptom search with ranking
    searchSymptoms(query) {
        if (!query || query.length < this.minSearchLength) {
            return this.getRecentSuggestions();
        }

        const normalizedQuery = query.toLowerCase().trim();
        const results = new Map(); // Use Map to avoid duplicates and store scores
        
        // Get cached regex pattern or create new one
        let pattern = this.searchPatterns.get(normalizedQuery);
        if (!pattern) {
            pattern = new RegExp(normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            this.searchPatterns.set(normalizedQuery, pattern);
        }

        // Search in index
        for (const [key, symptoms] of this.searchIndex) {
            if (key.includes(normalizedQuery)) {
                symptoms.forEach(symptom => {
                    const score = this.calculateRelevanceScore(symptom, normalizedQuery, key);
                    if (!results.has(symptom) || results.get(symptom) < score) {
                        results.set(symptom, score);
                    }
                });
            }
        }

        // Convert to array and sort by relevance score
        const sortedResults = Array.from(results.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([symptom]) => symptom)
            .slice(0, this.maxSuggestions);

        return sortedResults;
    }

    // Calculate relevance score for ranking
    calculateRelevanceScore(symptom, query, matchedKey) {
        let score = 0;
        const symptomLower = symptom.toLowerCase();
        
        // Exact match gets highest score
        if (symptomLower === query) {
            score += 100;
        }
        // Starts with query gets high score
        else if (symptomLower.startsWith(query)) {
            score += 80;
        }
        // Contains query gets medium score
        else if (symptomLower.includes(query)) {
            score += 60;
        }
        // Word boundary match gets good score
        else if (new RegExp(`\\b${query}`, 'i').test(symptomLower)) {
            score += 70;
        }
        
        // Boost score for recent symptoms
        if (this.recentSymptoms.includes(symptomLower)) {
            score += 20;
        }
        
        // Boost score for shorter symptoms (more specific)
        score += Math.max(0, 50 - symptom.length);
        
        // Boost score for common symptoms
        const commonSymptoms = ['fever', 'cough', 'headache', 'fatigue', 'nausea'];
        if (commonSymptoms.includes(symptomLower)) {
            score += 10;
        }
        
        return score;
    }

    // Get recent symptom suggestions
    getRecentSuggestions() {
        return this.recentSymptoms
            .slice(0, this.maxSuggestions)
            .map(symptom => this.symptoms.find(s => s.toLowerCase() === symptom) || symptom);
    }

    // Initialize autocomplete for an input element
    initializeAutocomplete(inputElement, onSelect = null) {
        if (!inputElement) return;

        const suggestionContainer = this.createSuggestionContainer(inputElement);
        let currentSuggestions = [];
        let selectedIndex = -1;

        // Input event handler with debouncing
        let debounceTimer;
        inputElement.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const query = e.target.value;
                currentSuggestions = this.searchSymptoms(query);
                this.displaySuggestions(suggestionContainer, currentSuggestions, (symptom) => {
                    inputElement.value = symptom;
                    this.addToRecent(symptom);
                    this.hideSuggestions(suggestionContainer);
                    if (onSelect) onSelect(symptom);
                });
                selectedIndex = -1;
            }, 150);
        });

        // Keyboard navigation
        inputElement.addEventListener('keydown', (e) => {
            if (currentSuggestions.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
                    this.highlightSuggestion(suggestionContainer, selectedIndex);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, -1);
                    this.highlightSuggestion(suggestionContainer, selectedIndex);
                    break;
                case 'Enter':
                    if (selectedIndex >= 0) {
                        e.preventDefault();
                        const selectedSymptom = currentSuggestions[selectedIndex];
                        inputElement.value = selectedSymptom;
                        this.addToRecent(selectedSymptom);
                        this.hideSuggestions(suggestionContainer);
                        if (onSelect) onSelect(selectedSymptom);
                    }
                    break;
                case 'Escape':
                    this.hideSuggestions(suggestionContainer);
                    selectedIndex = -1;
                    break;
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target) && !suggestionContainer.contains(e.target)) {
                this.hideSuggestions(suggestionContainer);
            }
        });

        // Show recent suggestions on focus
        inputElement.addEventListener('focus', () => {
            if (!inputElement.value) {
                currentSuggestions = this.getRecentSuggestions();
                this.displaySuggestions(suggestionContainer, currentSuggestions, (symptom) => {
                    inputElement.value = symptom;
                    this.addToRecent(symptom);
                    this.hideSuggestions(suggestionContainer);
                    if (onSelect) onSelect(symptom);
                });
            }
        });
    }

    // Create suggestion container
    createSuggestionContainer(inputElement) {
        const container = document.createElement('div');
        container.className = 'symptom-suggestions';
        container.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 4px 4px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            display: none;
        `;
        
        // Position relative to input
        inputElement.parentNode.style.position = 'relative';
        inputElement.parentNode.appendChild(container);
        
        return container;
    }

    // Display suggestions
    displaySuggestions(container, suggestions, onSelect) {
        container.innerHTML = '';
        
        if (suggestions.length === 0) {
            container.style.display = 'none';
            return;
        }

        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.textContent = suggestion;
            item.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.1s;
            `;
            
            item.addEventListener('mouseenter', () => {
                this.highlightSuggestion(container, index);
            });
            
            item.addEventListener('click', () => {
                onSelect(suggestion);
            });
            
            container.appendChild(item);
        });
        
        container.style.display = 'block';
    }

    // Highlight suggestion
    highlightSuggestion(container, index) {
        const items = container.querySelectorAll('.suggestion-item');
        items.forEach((item, i) => {
            item.style.backgroundColor = i === index ? '#e3f2fd' : 'white';
        });
    }

    // Hide suggestions
    hideSuggestions(container) {
        container.style.display = 'none';
    }

    // Get performance statistics
    getStats() {
        return {
            totalSymptoms: this.symptoms.length,
            indexSize: this.searchIndex.size,
            recentSymptomsCount: this.recentSymptoms.length,
            cachedPatternsCount: this.searchPatterns.size
        };
    }
}

// Create global instance
window.symptomAutocomplete = new SymptomAutocomplete();

// Auto-initialize for existing symptom inputs
document.addEventListener('DOMContentLoaded', () => {
    const symptomInputs = document.querySelectorAll('input[data-symptom-autocomplete]');
    symptomInputs.forEach(input => {
        window.symptomAutocomplete.initializeAutocomplete(input);
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SymptomAutocomplete;
}