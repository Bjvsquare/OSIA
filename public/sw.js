/* ═══════════════════════════════════════════════════════════
   Service Worker — Push Notification Handler
   Receives push events and shows OS-level notifications.
   Click → navigates user to /practice to complete nudge.
   ═══════════════════════════════════════════════════════════ */

self.addEventListener('push', function (event) {
    const defaultData = {
        title: 'OSIA Practice',
        body: 'Time for your practice nudge',
        icon: '/osia-icon-192.png',
        badge: '/osia-badge-72.png',
        url: '/practice',
        nudgeId: null,
    };

    let data = defaultData;
    try {
        if (event.data) {
            data = { ...defaultData, ...event.data.json() };
        }
    } catch (e) {
        // fallback to defaults
    }

    const options = {
        body: data.body,
        icon: data.icon || '/osia-icon-192.png',
        badge: data.badge || '/osia-badge-72.png',
        vibrate: [100, 50, 100],
        tag: data.nudgeId ? `nudge-${data.nudgeId}` : 'osia-practice',
        renotify: true,
        data: {
            url: data.url || '/practice',
            nudgeId: data.nudgeId,
        },
        actions: [
            { action: 'complete', title: '✓ Complete' },
            { action: 'later', title: 'Later' },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const url = event.notification.data?.url || '/practice';

    if (event.action === 'later') {
        return; // dismiss
    }

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // Focus existing window if available
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Open new window
            return clients.openWindow(url);
        })
    );
});

self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(self.clients.claim());
});
