importScripts('/__/firebase/10.9.0/firebase-app-compat.js');
importScripts('/__/firebase/10.9.0/firebase-messaging-compat.js');
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon-192.png' // You might want to ensure this icon exists or use a default
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
