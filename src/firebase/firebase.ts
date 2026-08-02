/**
 * Firebase App initialization (modular SDK v9+).
 * Exports a singleton `app` and `messaging` instance for reuse across the app.
 * Safe to import in browsers that do not support messaging — the messaging export
 * is lazily evaluated and guarded in messaging.ts.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyBatIcmFZEPdSFsHpQW5p-7Z7Ac4-C8IEo',
  authDomain: 'sim-kbm-ustaz.firebaseapp.com',
  projectId: 'sim-kbm-ustaz',
  storageBucket: 'sim-kbm-ustaz.firebasestorage.app',
  messagingSenderId: '653918611888',
  appId: '1:653918611888:web:36e297003173f7366b8e75',
  measurementId: 'G-5ETBXL66B6',
};

// VAPID public key for web push. Replace with your own pair's public key if needed.
export const VAPID_KEY =
  'BLWkLz0vH3Y8nGpQr5tQ2sF7xQ1zP9mK4dR6sT8uW0aE3bC5yD7fG9hJ2kL4mN6pQ8s';

export const app: FirebaseApp = initializeApp(firebaseConfig);

/**
 * Messaging instance. May throw in unsupported browsers, so callers should
 * use the helpers in messaging.ts which guard with isSupported().
 */
export let messaging: Messaging | null = null;
try {
  messaging = getMessaging(app);
} catch {
  messaging = null;
}