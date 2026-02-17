/* ═══════════════════════════════════════════════════════════
   Notification Service — Client-side push subscription
   
   Handles permission requests, service worker registration,
   and push subscription management.
   ═══════════════════════════════════════════════════════════ */

const API_BASE = '/api/notifications';

function getToken(): string | null {
    const authData = localStorage.getItem('OSIA_auth');
    return authData ? JSON.parse(authData).token : null;
}

export const notificationService = {
    /**
     * Check if push notifications are supported
     */
    isSupported(): boolean {
        return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    },

    /**
     * Get current permission status
     */
    getPermission(): NotificationPermission | 'unsupported' {
        if (!this.isSupported()) return 'unsupported';
        return Notification.permission;
    },

    /**
     * Request notification permission from user
     */
    async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) return 'denied';
        return Notification.requestPermission();
    },

    /**
     * Register service worker and subscribe to push
     */
    async subscribe(): Promise<boolean> {
        if (!this.isSupported()) return false;

        try {
            const permission = await this.requestPermission();
            if (permission !== 'granted') return false;

            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            // Get VAPID public key from server
            const token = getToken();
            const keyResponse = await fetch(`${API_BASE}/vapid-key`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!keyResponse.ok) {
                console.error('[Notifications] Failed to get VAPID key');
                return false;
            }
            const { publicKey } = await keyResponse.json();

            // Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            // Send subscription to server
            const response = await fetch(`${API_BASE}/subscribe`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subscription: subscription.toJSON() }),
            });

            return response.ok;
        } catch (err) {
            console.error('[Notifications] Subscribe failed:', err);
            return false;
        }
    },

    /**
     * Unsubscribe from push notifications
     */
    async unsubscribe(): Promise<boolean> {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
            }

            const token = getToken();
            await fetch(`${API_BASE}/unsubscribe`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            return true;
        } catch (err) {
            console.error('[Notifications] Unsubscribe failed:', err);
            return false;
        }
    },

    /**
     * Check if user has an active push subscription
     */
    async isSubscribed(): Promise<boolean> {
        if (!this.isSupported()) return false;
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            return !!subscription;
        } catch {
            return false;
        }
    },
};

/**
 * Convert a base64 VAPID key to Uint8Array for PushManager.subscribe
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
