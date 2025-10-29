/**
 * Comprehensive Notification System for AfriDiag
 * Handles consultation requests, responses, status updates, and real-time notifications
 */

class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.listeners = [];
        this.settings = {
            sound: true,
            desktop: true,
            inApp: true,
            autoHide: 5000, // Auto-hide after 5 seconds
            maxNotifications: 10
        };
        this.notificationTypes = {
            CONSULTATION_REQUEST: {
                icon: '🩺',
                color: '#4CAF50',
                priority: 'high',
                sound: 'notification-high.mp3'
            },
            CONSULTATION_RESPONSE: {
                icon: '💬',
                color: '#2196F3',
                priority: 'high',
                sound: 'notification-message.mp3'
            },
            STATUS_UPDATE: {
                icon: '📊',
                color: '#FF9800',
                priority: 'medium',
                sound: 'notification-soft.mp3'
            },
            SPECIALIST_ONLINE: {
                icon: '🟢',
                color: '#4CAF50',
                priority: 'low',
                sound: 'notification-soft.mp3'
            },
            EMERGENCY: {
                icon: '🚨',
                color: '#F44336',
                priority: 'urgent',
                sound: 'notification-urgent.mp3'
            },
            APPOINTMENT_REMINDER: {
                icon: '⏰',
                color: '#9C27B0',
                priority: 'medium',
                sound: 'notification-reminder.mp3'
            },
            SYSTEM: {
                icon: 'ℹ️',
                color: '#607D8B',
                priority: 'low',
                sound: 'notification-soft.mp3'
            }
        };
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.createNotificationContainer();
        this.requestPermissions();
        this.setupEventListeners();
        
        // Load persisted notifications
        this.loadNotifications();
        
        console.log('NotificationSystem initialized');
    }

    loadSettings() {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    }

    loadNotifications() {
        const saved = localStorage.getItem('notifications');
        if (saved) {
            this.notifications = JSON.parse(saved).filter(n => 
                Date.now() - n.timestamp < 24 * 60 * 60 * 1000 // Keep notifications for 24 hours
            );
        }
    }

    saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(this.notifications));
    }

    createNotificationContainer() {
        if (document.getElementById('notification-container')) return;

        // Ensure document.body exists
        if (!document.body) {
            // If body doesn't exist yet, wait for DOM to load
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.createNotificationContainer());
                return;
            }
        }

        const container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(container);

        // Add notification styles
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                margin-bottom: 10px;
                padding: 16px;
                border-left: 4px solid;
                pointer-events: auto;
                transform: translateX(100%);
                transition: all 0.3s ease;
                opacity: 0;
                max-width: 100%;
                word-wrap: break-word;
            }
            
            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification.hide {
                transform: translateX(100%);
                opacity: 0;
            }
            
            .notification-header {
                display: flex;
                align-items: center;
                margin-bottom: 8px;
                font-weight: 600;
            }
            
            .notification-icon {
                margin-right: 8px;
                font-size: 18px;
            }
            
            .notification-title {
                flex: 1;
                font-size: 14px;
            }
            
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: #666;
                padding: 0;
                margin-left: 8px;
            }
            
            .notification-body {
                font-size: 13px;
                color: #666;
                line-height: 1.4;
            }
            
            .notification-actions {
                margin-top: 12px;
                display: flex;
                gap: 8px;
            }
            
            .notification-action {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .notification-action.primary {
                background: #2196F3;
                color: white;
            }
            
            .notification-action.secondary {
                background: #f5f5f5;
                color: #666;
            }
            
            .notification-action:hover {
                opacity: 0.8;
            }
            
            .notification-timestamp {
                font-size: 11px;
                color: #999;
                margin-top: 8px;
            }
            
            .notification-badge {
                position: fixed;
                top: 10px;
                right: 10px;
                background: #F44336;
                color: white;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                z-index: 10001;
                display: none;
            }
        `;
        document.head.appendChild(style);

        // Create notification badge
        const badge = document.createElement('div');
        badge.id = 'notification-badge';
        badge.className = 'notification-badge';
        document.body.appendChild(badge);
    }

    async requestPermissions() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    setupEventListeners() {
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateBadge();
            }
        });
    }

    show(type, title, message, options = {}) {
        const notification = {
            id: Date.now() + Math.random(),
            type,
            title,
            message,
            timestamp: Date.now(),
            read: false,
            ...options
        };

        this.notifications.unshift(notification);
        
        // Limit notifications
        if (this.notifications.length > this.settings.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.settings.maxNotifications);
        }

        this.saveNotifications();
        this.displayNotification(notification);
        this.updateBadge();
        this.playSound(type);
        this.showDesktopNotification(notification);
        this.notifyListeners('notificationAdded', notification);

        return notification.id;
    }

    displayNotification(notification) {
        if (!this.settings.inApp) return;

        const container = document.getElementById('notification-container');
        const typeConfig = this.notificationTypes[notification.type] || this.notificationTypes.SYSTEM;
        
        const element = document.createElement('div');
        element.className = 'notification';
        element.style.borderLeftColor = typeConfig.color;
        element.dataset.notificationId = notification.id;

        element.innerHTML = `
            <div class="notification-header">
                <span class="notification-icon">${typeConfig.icon}</span>
                <span class="notification-title">${notification.title}</span>
                <button class="notification-close" onclick="window.notificationSystem.hide('${notification.id}')">&times;</button>
            </div>
            <div class="notification-body">${notification.message}</div>
            ${notification.actions ? this.renderActions(notification.actions, notification.id) : ''}
            <div class="notification-timestamp">${this.formatTime(notification.timestamp)}</div>
        `;

        container.appendChild(element);

        // Animate in
        setTimeout(() => element.classList.add('show'), 10);

        // Auto-hide for non-urgent notifications
        if (typeConfig.priority !== 'urgent' && this.settings.autoHide > 0) {
            setTimeout(() => this.hide(notification.id), this.settings.autoHide);
        }
    }

    renderActions(actions, notificationId) {
        return `
            <div class="notification-actions">
                ${actions.map(action => `
                    <button class="notification-action ${action.type || 'secondary'}" 
                            onclick="window.notificationSystem.handleAction('${notificationId}', '${action.id}')">
                        ${action.label}
                    </button>
                `).join('')}
            </div>
        `;
    }

    handleAction(notificationId, actionId) {
        const notification = this.notifications.find(n => n.id == notificationId);
        if (notification && notification.actions) {
            const action = notification.actions.find(a => a.id === actionId);
            if (action && action.callback) {
                action.callback(notification);
            }
        }
        this.hide(notificationId);
    }

    hide(notificationId) {
        const element = document.querySelector(`[data-notification-id="${notificationId}"]`);
        if (element) {
            element.classList.add('hide');
            setTimeout(() => element.remove(), 300);
        }

        // Mark as read
        const notification = this.notifications.find(n => n.id == notificationId);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateBadge();
        }
    }

    playSound(type) {
        if (!this.settings.sound) return;

        const typeConfig = this.notificationTypes[type] || this.notificationTypes.SYSTEM;
        
        // Create audio element (in a real app, you'd have actual sound files)
        const audio = new Audio();
        
        // Simulate different notification sounds with different frequencies
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        // Different frequencies for different notification types
        const frequencies = {
            urgent: 800,
            high: 600,
            medium: 400,
            low: 300
        };
        
        oscillator.frequency.setValueAtTime(frequencies[typeConfig.priority] || 400, context.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
    }

    showDesktopNotification(notification) {
        if (!this.settings.desktop || !('Notification' in window) || Notification.permission !== 'granted') {
            return;
        }

        const typeConfig = this.notificationTypes[notification.type] || this.notificationTypes.SYSTEM;
        
        const desktopNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico', // You can add a proper icon
            badge: '/favicon.ico',
            tag: notification.id,
            requireInteraction: typeConfig.priority === 'urgent'
        });

        desktopNotification.onclick = () => {
            window.focus();
            desktopNotification.close();
            if (notification.onClick) {
                notification.onClick(notification);
            }
        };

        // Auto-close desktop notification
        setTimeout(() => desktopNotification.close(), this.settings.autoHide);
    }

    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notification-badge');
        
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        
        return new Date(timestamp).toLocaleDateString();
    }

    // Convenience methods for different notification types
    showConsultationRequest(specialistName, patientName, urgency = 'normal') {
        return this.show('CONSULTATION_REQUEST', 
            'New Consultation Request', 
            `${patientName} has requested a consultation with ${specialistName}`,
            {
                actions: [
                    {
                        id: 'accept',
                        label: 'Accept',
                        type: 'primary',
                        callback: (notification) => {
                            console.log('Consultation accepted:', notification);
                        }
                    },
                    {
                        id: 'view',
                        label: 'View Details',
                        type: 'secondary',
                        callback: (notification) => {
                            // Navigate to consultation details
                            window.location.href = 'specialist_consultation.html';
                        }
                    }
                ]
            }
        );
    }

    showConsultationResponse(specialistName, message) {
        return this.show('CONSULTATION_RESPONSE',
            `Response from ${specialistName}`,
            message,
            {
                actions: [
                    {
                        id: 'reply',
                        label: 'Reply',
                        type: 'primary',
                        callback: (notification) => {
                            // Navigate to chat
                            window.location.href = 'specialist_chat.html';
                        }
                    }
                ]
            }
        );
    }

    showSpecialistOnline(specialistName, specialization) {
        return this.show('SPECIALIST_ONLINE',
            'Specialist Available',
            `${specialistName} (${specialization}) is now online and available for consultations`
        );
    }

    showEmergencyAlert(message, location) {
        return this.show('EMERGENCY',
            'Emergency Alert',
            `${message} ${location ? `Location: ${location}` : ''}`,
            {
                actions: [
                    {
                        id: 'respond',
                        label: 'Respond',
                        type: 'primary',
                        callback: (notification) => {
                            console.log('Emergency response initiated:', notification);
                        }
                    }
                ]
            }
        );
    }

    showAppointmentReminder(specialistName, time) {
        return this.show('APPOINTMENT_REMINDER',
            'Appointment Reminder',
            `Your consultation with ${specialistName} is scheduled for ${time}`,
            {
                actions: [
                    {
                        id: 'join',
                        label: 'Join Now',
                        type: 'primary',
                        callback: (notification) => {
                            window.location.href = 'specialist_chat.html';
                        }
                    },
                    {
                        id: 'reschedule',
                        label: 'Reschedule',
                        type: 'secondary',
                        callback: (notification) => {
                            console.log('Reschedule requested:', notification);
                        }
                    }
                ]
            }
        );
    }

    showSystemNotification(title, message) {
        return this.show('SYSTEM', title, message);
    }

    // Settings management
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
    }

    getSettings() {
        return { ...this.settings };
    }

    // Event listener management
    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Notification listener error:', error);
            }
        });
    }

    // Get notification history
    getNotifications(filter = {}) {
        let filtered = [...this.notifications];
        
        if (filter.type) {
            filtered = filtered.filter(n => n.type === filter.type);
        }
        
        if (filter.unreadOnly) {
            filtered = filtered.filter(n => !n.read);
        }
        
        if (filter.limit) {
            filtered = filtered.slice(0, filter.limit);
        }
        
        return filtered;
    }

    // Mark all as read
    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateBadge();
    }

    // Clear all notifications
    clearAll() {
        this.notifications = [];
        this.saveNotifications();
        this.updateBadge();
        
        // Remove all notification elements
        const container = document.getElementById('notification-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Initialize the notification system when the script loads
window.notificationSystem = new NotificationSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationSystem;
}