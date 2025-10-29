/**
 * Comprehensive Availability Management System
 * Handles real-time status updates, scheduling, and availability tracking
 */

class AvailabilityManager {
    constructor() {
        this.statusTypes = {
            AVAILABLE: 'available',
            BUSY: 'busy',
            OFFLINE: 'offline',
            IN_CONSULTATION: 'in_consultation',
            BREAK: 'break',
            EMERGENCY: 'emergency'
        };

        this.statusColors = {
            available: '#4CAF50',
            busy: '#FF9800',
            offline: '#f44336',
            in_consultation: '#2196F3',
            break: '#9C27B0',
            emergency: '#F44336'
        };

        this.statusLabels = {
            available: 'Available',
            busy: 'Busy',
            offline: 'Offline',
            in_consultation: 'In Consultation',
            break: 'On Break',
            emergency: 'Emergency'
        };

        this.listeners = [];
        this.schedules = this.loadSchedules();
        this.currentStatuses = this.loadCurrentStatuses();
        
        this.initializeRealTimeUpdates();
    }

    /**
     * Initialize real-time status updates
     */
    initializeRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            this.updateRandomStatuses();
        }, 30000);

        // Check schedules every minute
        setInterval(() => {
            this.checkScheduledChanges();
        }, 60000);

        // Auto-update break times
        setInterval(() => {
            this.updateBreakStatuses();
        }, 120000);
    }

    /**
     * Get current status for a specialist
     */
    getStatus(specialistId) {
        return this.currentStatuses[specialistId] || {
            status: this.statusTypes.OFFLINE,
            lastUpdated: new Date(),
            nextAvailable: null,
            responseTime: '> 24 hours'
        };
    }

    /**
     * Update specialist status
     */
    updateStatus(specialistId, status, options = {}) {
        const validStatuses = Object.values(this.statusTypes);
        if (!validStatuses.includes(status)) {
            throw new Error(`Invalid status: ${status}`);
        }

        const previousStatus = this.currentStatuses[specialistId];
        
        this.currentStatuses[specialistId] = {
            status: status,
            lastUpdated: new Date(),
            nextAvailable: options.nextAvailable || this.calculateNextAvailable(specialistId, status),
            responseTime: this.calculateResponseTime(status),
            reason: options.reason || null,
            estimatedDuration: options.estimatedDuration || null
        };

        // Save to localStorage
        this.saveCurrentStatuses();

        // Notify listeners
        this.notifyStatusChange(specialistId, status, previousStatus);

        // Update specialist database if available
        if (window.specialistDB) {
            window.specialistDB.updateAvailability(specialistId, {
                isOnline: status !== this.statusTypes.OFFLINE,
                status: status,
                lastSeen: new Date()
            });
        }

        return this.currentStatuses[specialistId];
    }

    /**
     * Set scheduled status change
     */
    scheduleStatusChange(specialistId, status, scheduledTime, options = {}) {
        const scheduleId = `${specialistId}_${Date.now()}`;
        
        this.schedules[scheduleId] = {
            specialistId: specialistId,
            status: status,
            scheduledTime: new Date(scheduledTime),
            options: options,
            active: true
        };

        this.saveSchedules();
        return scheduleId;
    }

    /**
     * Cancel scheduled status change
     */
    cancelScheduledChange(scheduleId) {
        if (this.schedules[scheduleId]) {
            this.schedules[scheduleId].active = false;
            this.saveSchedules();
            return true;
        }
        return false;
    }

    /**
     * Get all specialists with their current status
     */
    getAllStatuses() {
        const statuses = {};
        
        if (window.specialistDB) {
            const specialists = window.specialistDB.getAllSpecialists();
            specialists.forEach(specialist => {
                statuses[specialist.id] = {
                    ...specialist,
                    currentStatus: this.getStatus(specialist.id)
                };
            });
        }

        return statuses;
    }

    /**
     * Get specialists by status
     */
    getSpecialistsByStatus(status) {
        const allStatuses = this.getAllStatuses();
        return Object.values(allStatuses).filter(
            specialist => specialist.currentStatus.status === status
        );
    }

    /**
     * Get availability statistics
     */
    getAvailabilityStats() {
        const allStatuses = this.getAllStatuses();
        const specialists = Object.values(allStatuses);
        const total = specialists.length;

        const stats = {
            total: total,
            available: 0,
            busy: 0,
            offline: 0,
            in_consultation: 0,
            break: 0,
            emergency: 0
        };

        specialists.forEach(specialist => {
            const status = specialist.currentStatus.status;
            if (stats.hasOwnProperty(status)) {
                stats[status]++;
            }
        });

        // Calculate percentages
        Object.keys(stats).forEach(key => {
            if (key !== 'total') {
                stats[`${key}_percentage`] = total > 0 ? Math.round((stats[key] / total) * 100) : 0;
            }
        });

        return stats;
    }

    /**
     * Add status change listener
     */
    addStatusChangeListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove status change listener
     */
    removeStatusChangeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of status change
     */
    notifyStatusChange(specialistId, newStatus, previousStatus) {
        const event = {
            specialistId: specialistId,
            newStatus: newStatus,
            previousStatus: previousStatus,
            timestamp: new Date(),
            statusInfo: this.getStatus(specialistId)
        };

        this.listeners.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Error in status change listener:', error);
            }
        });

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('specialistStatusChanged', {
            detail: event
        }));
    }

    /**
     * Calculate next available time based on current status
     */
    calculateNextAvailable(specialistId, status) {
        const now = new Date();
        
        switch (status) {
            case this.statusTypes.AVAILABLE:
                return now;
            
            case this.statusTypes.BUSY:
                return new Date(now.getTime() + (15 + Math.random() * 30) * 60000); // 15-45 minutes
            
            case this.statusTypes.IN_CONSULTATION:
                return new Date(now.getTime() + (30 + Math.random() * 60) * 60000); // 30-90 minutes
            
            case this.statusTypes.BREAK:
                return new Date(now.getTime() + (10 + Math.random() * 20) * 60000); // 10-30 minutes
            
            case this.statusTypes.EMERGENCY:
                return new Date(now.getTime() + (60 + Math.random() * 120) * 60000); // 1-3 hours
            
            case this.statusTypes.OFFLINE:
                // Next business day at 8 AM
                const nextDay = new Date(now);
                nextDay.setDate(nextDay.getDate() + 1);
                nextDay.setHours(8, 0, 0, 0);
                return nextDay;
            
            default:
                return new Date(now.getTime() + 60 * 60000); // 1 hour
        }
    }

    /**
     * Calculate response time based on status
     */
    calculateResponseTime(status) {
        switch (status) {
            case this.statusTypes.AVAILABLE:
                return '< 5 minutes';
            case this.statusTypes.BUSY:
                return '15-45 minutes';
            case this.statusTypes.IN_CONSULTATION:
                return '30-90 minutes';
            case this.statusTypes.BREAK:
                return '10-30 minutes';
            case this.statusTypes.EMERGENCY:
                return '1-3 hours';
            case this.statusTypes.OFFLINE:
                return '> 24 hours';
            default:
                return '1 hour';
        }
    }

    /**
     * Check for scheduled status changes
     */
    checkScheduledChanges() {
        const now = new Date();
        
        Object.keys(this.schedules).forEach(scheduleId => {
            const schedule = this.schedules[scheduleId];
            
            if (schedule.active && schedule.scheduledTime <= now) {
                this.updateStatus(
                    schedule.specialistId,
                    schedule.status,
                    schedule.options
                );
                
                // Mark as completed
                schedule.active = false;
            }
        });

        this.saveSchedules();
    }

    /**
     * Update random statuses for simulation
     */
    updateRandomStatuses() {
        if (!window.specialistDB) return;

        const specialists = window.specialistDB.getAllSpecialists();
        const statusOptions = Object.values(this.statusTypes);
        
        // Randomly update 1-3 specialists
        const numUpdates = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < numUpdates; i++) {
            const randomSpecialist = specialists[Math.floor(Math.random() * specialists.length)];
            const currentStatus = this.getStatus(randomSpecialist.id);
            
            // Don't change status too frequently
            const timeSinceLastUpdate = Date.now() - new Date(currentStatus.lastUpdated).getTime();
            if (timeSinceLastUpdate < 300000) continue; // 5 minutes minimum
            
            // Weighted random status selection
            const weights = {
                available: 0.4,
                busy: 0.2,
                in_consultation: 0.15,
                break: 0.1,
                offline: 0.1,
                emergency: 0.05
            };
            
            const randomStatus = this.weightedRandomSelect(weights);
            
            if (randomStatus !== currentStatus.status) {
                this.updateStatus(randomSpecialist.id, randomStatus);
            }
        }
    }

    /**
     * Update break statuses automatically
     */
    updateBreakStatuses() {
        Object.keys(this.currentStatuses).forEach(specialistId => {
            const status = this.currentStatuses[specialistId];
            
            if (status.status === this.statusTypes.BREAK) {
                const breakDuration = Date.now() - new Date(status.lastUpdated).getTime();
                
                // Auto-return from break after 30 minutes
                if (breakDuration > 30 * 60000) {
                    this.updateStatus(specialistId, this.statusTypes.AVAILABLE);
                }
            }
        });
    }

    /**
     * Weighted random selection
     */
    weightedRandomSelect(weights) {
        const items = Object.keys(weights);
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= weights[item];
            if (random <= 0) {
                return item;
            }
        }
        
        return items[items.length - 1];
    }

    /**
     * Load schedules from localStorage
     */
    loadSchedules() {
        try {
            const saved = localStorage.getItem('specialist_schedules');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading schedules:', error);
            return {};
        }
    }

    /**
     * Save schedules to localStorage
     */
    saveSchedules() {
        try {
            localStorage.setItem('specialist_schedules', JSON.stringify(this.schedules));
        } catch (error) {
            console.error('Error saving schedules:', error);
        }
    }

    /**
     * Load current statuses from localStorage
     */
    loadCurrentStatuses() {
        try {
            const saved = localStorage.getItem('specialist_current_statuses');
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Error loading current statuses:', error);
            return {};
        }
    }

    /**
     * Save current statuses to localStorage
     */
    saveCurrentStatuses() {
        try {
            localStorage.setItem('specialist_current_statuses', JSON.stringify(this.currentStatuses));
        } catch (error) {
            console.error('Error saving current statuses:', error);
        }
    }

    /**
     * Get status color
     */
    getStatusColor(status) {
        return this.statusColors[status] || '#666';
    }

    /**
     * Get status label
     */
    getStatusLabel(status) {
        return this.statusLabels[status] || status;
    }

    /**
     * Format next available time
     */
    formatNextAvailable(nextAvailable) {
        if (!nextAvailable) return 'Unknown';
        
        const now = new Date();
        const next = new Date(nextAvailable);
        const diffMs = next.getTime() - now.getTime();
        
        if (diffMs <= 0) return 'Now';
        
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
        } else if (diffHours > 0) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
        } else {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
        }
    }
}

// Initialize global availability manager
window.availabilityManager = new AvailabilityManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvailabilityManager;
}