/**
 * Progressive Loading System
 * Provides smooth loading indicators and progressive UI updates for better UX
 */

class ProgressiveLoader {
    constructor() {
        this.activeLoaders = new Map();
        this.loadingSteps = new Map();
        this.animationFrameId = null;
        this.isAnimating = false;
        
        // Initialize CSS styles
        this.initializeStyles();
    }

    // Initialize CSS styles for loaders
    initializeStyles() {
        if (document.getElementById('progressive-loader-styles')) return;

        const style = document.createElement('style');
        style.id = 'progressive-loader-styles';
        style.textContent = `
            .progressive-loader {
                position: relative;
                overflow: hidden;
            }

            .loader-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(255, 255, 255, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                transition: opacity 0.3s ease;
            }

            .loader-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f3f3f3;
                border-top: 3px solid #2196F3;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }

            .loader-progress {
                width: 200px;
                height: 4px;
                background: #f0f0f0;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 12px;
            }

            .loader-progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #2196F3, #21CBF3);
                border-radius: 2px;
                transition: width 0.3s ease;
                position: relative;
            }

            .loader-progress-bar::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 1.5s infinite;
            }

            .loader-text {
                font-size: 14px;
                color: #666;
                text-align: center;
                margin-bottom: 8px;
                min-height: 20px;
            }

            .loader-steps {
                font-size: 12px;
                color: #888;
                text-align: center;
            }

            .step-indicator {
                display: inline-flex;
                align-items: center;
                margin: 0 4px;
            }

            .step-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #ddd;
                margin-right: 4px;
                transition: background-color 0.3s ease;
            }

            .step-dot.completed {
                background: #4CAF50;
            }

            .step-dot.active {
                background: #2196F3;
                animation: pulse 1s infinite;
            }

            .diagnosis-preview {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 300px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                padding: 16px;
                z-index: 1001;
                transform: translateX(320px);
                transition: transform 0.3s ease;
            }

            .diagnosis-preview.visible {
                transform: translateX(0);
            }

            .preview-header {
                font-weight: bold;
                color: #333;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
            }

            .preview-icon {
                width: 20px;
                height: 20px;
                margin-right: 8px;
                border-radius: 50%;
                background: #2196F3;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
            }

            .preview-content {
                font-size: 13px;
                color: #666;
                line-height: 1.4;
            }

            .preview-progress {
                margin-top: 12px;
                height: 2px;
                background: #f0f0f0;
                border-radius: 1px;
                overflow: hidden;
            }

            .preview-progress-bar {
                height: 100%;
                background: #2196F3;
                transition: width 0.3s ease;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            .fade-in {
                animation: fadeIn 0.3s ease;
            }
        `;
        document.head.appendChild(style);
    }

    // Start progressive loading for diagnosis
    startDiagnosisLoading(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        const loaderId = `loader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const steps = options.steps || [
            { id: 'auth', text: 'Authenticating...', duration: 500 },
            { id: 'validate', text: 'Validating symptoms...', duration: 300 },
            { id: 'analyze', text: 'Analyzing patient data...', duration: 1000 },
            { id: 'predict', text: 'Running AI diagnosis...', duration: 2000 },
            { id: 'format', text: 'Formatting results...', duration: 500 }
        ];

        this.loadingSteps.set(loaderId, {
            steps,
            currentStep: 0,
            startTime: Date.now(),
            totalDuration: steps.reduce((sum, step) => sum + step.duration, 0)
        });

        // Create loader overlay
        const overlay = this.createLoaderOverlay(loaderId, steps);
        container.style.position = 'relative';
        container.appendChild(overlay);

        // Create diagnosis preview
        const preview = this.createDiagnosisPreview(loaderId);
        document.body.appendChild(preview);

        this.activeLoaders.set(loaderId, {
            container,
            overlay,
            preview,
            startTime: Date.now()
        });

        // Start animation
        this.startLoadingAnimation(loaderId);

        return loaderId;
    }

    // Create loader overlay
    createLoaderOverlay(loaderId, steps) {
        const overlay = document.createElement('div');
        overlay.className = 'loader-overlay';
        overlay.innerHTML = `
            <div class="loader-spinner"></div>
            <div class="loader-progress">
                <div class="loader-progress-bar" style="width: 0%"></div>
            </div>
            <div class="loader-text">Initializing diagnosis...</div>
            <div class="loader-steps">
                ${steps.map((step, index) => `
                    <span class="step-indicator">
                        <span class="step-dot ${index === 0 ? 'active' : ''}"></span>
                        <span class="step-text">${step.text.split('...')[0]}</span>
                    </span>
                `).join('')}
            </div>
        `;
        return overlay;
    }

    // Create diagnosis preview panel
    createDiagnosisPreview(loaderId) {
        const preview = document.createElement('div');
        preview.className = 'diagnosis-preview';
        preview.innerHTML = `
            <div class="preview-header">
                <div class="preview-icon">🔍</div>
                AI Diagnosis in Progress
            </div>
            <div class="preview-content">
                Analyzing symptoms and patient data to provide accurate diagnosis...
            </div>
            <div class="preview-progress">
                <div class="preview-progress-bar" style="width: 0%"></div>
            </div>
        `;
        
        // Show preview after a short delay
        setTimeout(() => {
            preview.classList.add('visible');
        }, 300);
        
        return preview;
    }

    // Start loading animation
    startLoadingAnimation(loaderId) {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.animateLoader(loaderId);
    }

    // Animate loader progress
    animateLoader(loaderId) {
        const loaderData = this.activeLoaders.get(loaderId);
        const stepData = this.loadingSteps.get(loaderId);
        
        if (!loaderData || !stepData) {
            this.isAnimating = false;
            return;
        }

        const elapsed = Date.now() - stepData.startTime;
        const totalDuration = stepData.totalDuration;
        const progress = Math.min(elapsed / totalDuration, 1);

        // Update progress bar
        const progressBar = loaderData.overlay.querySelector('.loader-progress-bar');
        const previewProgressBar = loaderData.preview.querySelector('.preview-progress-bar');
        
        if (progressBar) progressBar.style.width = `${progress * 100}%`;
        if (previewProgressBar) previewProgressBar.style.width = `${progress * 100}%`;

        // Update current step
        this.updateCurrentStep(loaderId, elapsed);

        // Continue animation
        if (progress < 1) {
            this.animationFrameId = requestAnimationFrame(() => this.animateLoader(loaderId));
        } else {
            this.isAnimating = false;
        }
    }

    // Update current step indicator
    updateCurrentStep(loaderId, elapsed) {
        const stepData = this.loadingSteps.get(loaderId);
        const loaderData = this.activeLoaders.get(loaderId);
        
        if (!stepData || !loaderData) return;

        let cumulativeDuration = 0;
        let currentStepIndex = 0;

        for (let i = 0; i < stepData.steps.length; i++) {
            cumulativeDuration += stepData.steps[i].duration;
            if (elapsed < cumulativeDuration) {
                currentStepIndex = i;
                break;
            }
            currentStepIndex = i + 1;
        }

        // Update step if changed
        if (currentStepIndex !== stepData.currentStep) {
            stepData.currentStep = currentStepIndex;
            
            // Update loader text
            const loaderText = loaderData.overlay.querySelector('.loader-text');
            if (loaderText && currentStepIndex < stepData.steps.length) {
                loaderText.textContent = stepData.steps[currentStepIndex].text;
                loaderText.classList.add('fade-in');
                setTimeout(() => loaderText.classList.remove('fade-in'), 300);
            }

            // Update step indicators
            const stepDots = loaderData.overlay.querySelectorAll('.step-dot');
            stepDots.forEach((dot, index) => {
                dot.classList.remove('active', 'completed');
                if (index < currentStepIndex) {
                    dot.classList.add('completed');
                } else if (index === currentStepIndex) {
                    dot.classList.add('active');
                }
            });

            // Update preview content
            this.updatePreviewContent(loaderId, currentStepIndex);
        }
    }

    // Update preview content based on current step
    updatePreviewContent(loaderId, stepIndex) {
        const loaderData = this.activeLoaders.get(loaderId);
        const stepData = this.loadingSteps.get(loaderId);
        
        if (!loaderData || !stepData) return;

        const previewContent = loaderData.preview.querySelector('.preview-content');
        if (!previewContent) return;

        const messages = [
            'Verifying user credentials and permissions...',
            'Checking symptom patterns and medical history...',
            'Processing patient demographics and vital signs...',
            'Running advanced AI algorithms for diagnosis...',
            'Preparing comprehensive treatment recommendations...'
        ];

        if (stepIndex < messages.length) {
            previewContent.textContent = messages[stepIndex];
            previewContent.classList.add('fade-in');
            setTimeout(() => previewContent.classList.remove('fade-in'), 300);
        }
    }

    // Update loading progress manually
    updateProgress(loaderId, progress, message = null) {
        const loaderData = this.activeLoaders.get(loaderId);
        if (!loaderData) return;

        const progressBar = loaderData.overlay.querySelector('.loader-progress-bar');
        const previewProgressBar = loaderData.preview.querySelector('.preview-progress-bar');
        
        if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;
        if (previewProgressBar) previewProgressBar.style.width = `${Math.min(progress, 100)}%`;

        if (message) {
            const loaderText = loaderData.overlay.querySelector('.loader-text');
            if (loaderText) {
                loaderText.textContent = message;
                loaderText.classList.add('fade-in');
                setTimeout(() => loaderText.classList.remove('fade-in'), 300);
            }
        }
    }

    // Show intermediate results
    showIntermediateResult(loaderId, result) {
        const loaderData = this.activeLoaders.get(loaderId);
        if (!loaderData) return;

        const previewContent = loaderData.preview.querySelector('.preview-content');
        if (previewContent && result.preliminary_diagnosis) {
            previewContent.innerHTML = `
                <strong>Preliminary finding:</strong><br>
                ${result.preliminary_diagnosis}<br>
                <small style="color: #888;">Confidence: ${result.confidence || 'Processing...'}%</small>
            `;
        }
    }

    // Complete loading
    completeLoading(loaderId, callback = null) {
        const loaderData = this.activeLoaders.get(loaderId);
        if (!loaderData) return;

        // Update to 100% progress
        this.updateProgress(loaderId, 100, 'Diagnosis complete!');

        // Fade out after a short delay
        setTimeout(() => {
            loaderData.overlay.style.opacity = '0';
            loaderData.preview.style.transform = 'translateX(320px)';
            
            setTimeout(() => {
                // Remove elements
                if (loaderData.overlay.parentNode) {
                    loaderData.overlay.parentNode.removeChild(loaderData.overlay);
                }
                if (loaderData.preview.parentNode) {
                    loaderData.preview.parentNode.removeChild(loaderData.preview);
                }
                
                // Clean up
                this.activeLoaders.delete(loaderId);
                this.loadingSteps.delete(loaderId);
                
                if (callback) callback();
            }, 300);
        }, 1000);
    }

    // Cancel loading
    cancelLoading(loaderId) {
        const loaderData = this.activeLoaders.get(loaderId);
        if (!loaderData) return;

        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Remove elements immediately
        if (loaderData.overlay.parentNode) {
            loaderData.overlay.parentNode.removeChild(loaderData.overlay);
        }
        if (loaderData.preview.parentNode) {
            loaderData.preview.parentNode.removeChild(loaderData.preview);
        }

        // Clean up
        this.activeLoaders.delete(loaderId);
        this.loadingSteps.delete(loaderId);
        this.isAnimating = false;
    }

    // Get active loaders count
    getActiveLoadersCount() {
        return this.activeLoaders.size;
    }
}

// Create global instance
window.progressiveLoader = new ProgressiveLoader();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressiveLoader;
}