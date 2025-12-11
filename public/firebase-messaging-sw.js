importScripts('/__/firebase/10.9.0/firebase-app-compat.js');
importScripts('/__/firebase/10.9.0/firebase-messaging-compat.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;

    // Check for actions in various places (FCM structure is complex)
    let actions = [];
    if (payload.webpush && payload.webpush.notification && payload.webpush.notification.actions) {
        actions = payload.webpush.notification.actions;
    } else if (payload.notification && payload.notification.actions) {
        actions = payload.notification.actions;
    } else if (payload.data && payload.data.actions) {
        try { actions = JSON.parse(payload.data.actions); } catch (e) { }
    }

    const notificationOptions = {
        body: payload.notification.body,
        icon: '/pwa-192x192.png',
        data: payload.data,
        actions: actions
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    console.log('[firebase-messaging-sw.js] Notification click Received.', event);
    event.notification.close();

    // Default URL
    let url = '/?action=contribution';

    // Handle Actions
    if (event.action === 'report_sun') {
        url = '/?action=contribution&select=Sunny';
    } else if (event.action === 'report_rain') {
        url = '/?action=contribution&select=Rain';
    }

    // This looks for an open window and focuses it, navigating to the new URL
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                if (client.url.indexOf(self.registration.scope) === 0 && 'focus' in client) {
                    client.focus();
                    return client.navigate(url);
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
