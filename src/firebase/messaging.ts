/**
 * Firebase Cloud Messaging helpers.
 * - Request notification permission
 * - Get / refresh the FCM token
 * - Persist / update / delete the token in Supabase `device_tokens`
 * - Listen for foreground messages via onMessage()
 *
 * All functions degrade gracefully when push is unsupported (no Service Worker,
 * no Notification API, unsupported browser) so the app keeps working.
 */
import {
  getMessaging,
  getToken,
  onMessage,
  deleteToken,
  isSupported,
  type MessagePayload,
} from 'firebase/messaging';
import { app, messaging as messagingInstance, VAPID_KEY } from './firebase';
import { supabase } from '../lib/supabase';

/** Detect whether push notifications are supported in this browser. */
export async function isPushSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;
    if (!('serviceWorker' in navigator)) return false;
    return await isSupported();
  } catch {
    return false;
  }
}

/** Current Notification permission string. */
export function getPermission(): NotificationPermission {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
}

/** Request notification permission. Returns the resulting permission. */
export async function requestPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return 'denied';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

/**
 * Register the Firebase messaging service worker using a sub-scope so it
 * does not conflict with the PWA's main service worker (which controls `/`).
 * Returns the registration (or null) so callers can pass it to getToken().
 */
async function registerMessagingSW(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/firebase-cloud-messaging-push-scope/',
    });
    return reg;
  } catch {
    return null;
  }
}

/**
 * Get the current FCM token, persisting it to Supabase.
 * If the token changed from a previously stored one, the old row is updated.
 * Returns the token or null if push is unavailable / permission denied.
 */
export async function getAndSaveToken(userId: string, platform = 'web'): Promise<string | null> {
  if (!(await isPushSupported())) return null;
  if (Notification.permission !== 'granted') return null;
  if (!messagingInstance) return null;

  const swReg = await registerMessagingSW();
  const messaging = getMessaging(app);

  let token: string;
  try {
    token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
    });
  } catch {
    return null;
  }
  if (!token) return null;

  await upsertToken(userId, token, platform);
  return token;
}

/** Insert or update a token row for the current user. */
async function upsertToken(userId: string, token: string, platform: string): Promise<void> {
  try {
    // Check if this token already exists for this user
    const { data: existing } = await supabase
      .from('device_tokens')
      .select('id, token')
      .eq('user_id', userId)
      .eq('token', token)
      .maybeSingle();

    if (existing) {
      // Touch updated_at via update (trigger bumps it)
      await supabase
        .from('device_tokens')
        .update({ platform })
        .eq('id', existing.id);
      return;
    }

    // Insert new token
    await supabase.from('device_tokens').insert({
      user_id: userId,
      token,
      platform,
    });
  } catch {
    // best-effort — don't block the UI
  }
}

/** Delete a specific token from Supabase and revoke it from FCM. */
export async function revokeToken(token: string): Promise<void> {
  try {
    await supabase.from('device_tokens').delete().eq('token', token);
    if (messagingInstance) {
      await deleteToken(getMessaging(app));
    }
  } catch {
    // best-effort
  }
}

/** Delete all tokens for a user (used on logout). */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  try {
    await supabase.from('device_tokens').delete().eq('user_id', userId);
    if (messagingInstance) {
      await deleteToken(getMessaging(app));
    }
  } catch {
    // best-effort
  }
}

/** Subscribe to foreground (in-tab) push messages. Returns an unsubscribe fn. */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  if (!messagingInstance) return () => {};
  try {
    return onMessage(getMessaging(app), callback);
  } catch {
    return () => {};
  }
}

/** Display a local Notification (used for foreground messages). */
export function showLocalNotification(title: string, body: string, url = '/'): void {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(title, {
      body,
      icon: '/icon/192x192.png',
      badge: '/icon/192x192.png',
      tag: 'simkbm-push',
      data: { url },
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // ignore
  }
}


export { isPushSupported, getPermission, requestPermission, getAndSaveToken, revokeAllUserTokens, onForegroundMessage, showLocalNotification }