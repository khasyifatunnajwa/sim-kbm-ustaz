/**
 * firebase-messaging-sw.js — Service worker for Firebase Cloud Messaging.
 * Handles push notifications while the app is closed / in the background.
 *
 * Loads the Firebase compat SDK from the gstatic CDN (required for SW scope,
 * since ES module imports are not reliably supported inside classic SWs).
 * When a background push arrives, it displays a notification; clicking it
 * focuses an existing tab or opens the app.
 */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: 'AIzaSyBt1iF6NuW3Dtqtm8MIn25mUPAUX91veWU',
  authDomain: 'sim-kbm-ustaz.firebaseapp.com',
  projectId: 'sim-kbm-ustaz',
  storageBucket: 'sim-kbm-ustaz.firebasestorage.app',
  messagingSenderId: '653918611888',
  appId: '1:653918611888:web:36e297003173f7366b8e75',
  measurementId: 'G-5ETBXL66B6',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Background message handler — show a notification when the app is closed.
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'SIM KBM Ustaz';
  const body = (payload.notification && payload.notification.body) || '';
  const url = (payload.data && payload.data.url) || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/icon/192x192.png',
    badge: '/icon/192x192.png',
    tag: 'simkbm-push',
    data: { url },
  });
});

// Notification click — focus an existing tab or open the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
