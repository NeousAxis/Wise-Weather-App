importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAxhlF_Xa5BH95mO1jf7jQ6etd7Ca1hwSs",
    authDomain: "wise-weather-app.firebaseapp.com",
    projectId: "wise-weather-app",
    storageBucket: "wise-weather-app.firebasestorage.app",
    messagingSenderId: "282608109240",
    appId: "1:282608109240:web:5413bcc48a6ef7998e964d"
};

firebase.initializeApp(firebaseConfig);
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
