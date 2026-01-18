// Firebase Cloud Messaging Service Worker
// Works in both development (localhost) and production (Firebase Hosting)

// Check if we're in production (Firebase Hosting) or development (localhost)
const isProduction = self.location.hostname !== 'localhost' &&
    self.location.hostname !== '127.0.0.1';

if (isProduction) {
    // Production: Use Firebase Hosting auto-config
    importScripts('/__/firebase/10.9.0/firebase-app-compat.js');
    importScripts('/__/firebase/10.9.0/firebase-messaging-compat.js');
    importScripts('/__/firebase/init.js');
} else {
    // Development: Use CDN + manual config
    importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

    // Initialize Firebase manually with your config
    firebase.initializeApp({
        apiKey: "AIzaSyDiGmCMmhWIKHRXFcbOCDCOqTjqvPDgRhw",
        authDomain: "wise-weather-app.firebaseapp.com",
        projectId: "wise-weather-app",
        storageBucket: "wise-weather-app.firebasestorage.app",
        messagingSenderId: "1031906629754",
        appId: "1:1031906629754:web:1f8c0c9e8c5f8b8e8c5f8b"
    });
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    // CRITICAL: Do NOT call showNotification here if the payload has a 'notification' key.
    // The browser/OS handles it automatically. Calling it manually causes DOUBLE NOTIFICATIONS.

    // Only use this if you migrate to Data-Only messages in the future.
    // const notificationTitle = payload.notification.title;
    // const notificationOptions = { ... };
    // self.registration.showNotification(notificationTitle, notificationOptions);
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
    // Aggressive Simplification: JUST OPEN/NAVIGATE TO THE URL with params.
    // Trust the React app to read the URL on load/focus.

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Find ANY client for this scope
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.indexOf(self.registration.scope) === 0 && 'focus' in client) {
                    client.focus();
                    // Force navigation to the URL with the action (reloads the app, ensuring params are read)
                    return client.navigate(url);
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});
