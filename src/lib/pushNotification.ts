/**
 * Cross-platform push notification system.
 *
 * - On Android (Capacitor native): uses @capacitor/push-notifications with
 *   Firebase Cloud Messaging. No web service worker or VAPID key needed.
 * - On web (browser): falls back to Firebase Web Messaging (firebase/messaging)
 *   guarded by feature detection so it never crashes on unsupported browsers.
 *
 * Token lifecycle:
 *   login → requestPermission → register FCM → get token → save to Supabase
 *   logout → remove token from Supabase
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from './supabase';

export type PushPlatform = 'android' | 'ios' | 'web';

export interface PushNotificationState {
  supported: boolean;
  permission: 'granted' | 'denied' | 'prompt';
  token: string | null;
  platform: PushPlatform;
}

type Listener = () => void;
const listeners = new Set<Listener>();
function notifyListeners() {
  listeners.forEach((l) => l());
}

export function subscribePushState(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

function getPlatform(): PushPlatform {
  if (isNative()) {
    return Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  }
  return 'web';
}

/**
 * Whether push notifications are supported on this platform.
 * - Native: always supported via FCM plugin.
 * - Web: requires Notification API + service worker + firebase support.
 */
export async function isPushSupported(): Promise<boolean> {
  try {
    if (isNative()) return true;
    if (typeof window === 'undefined') return false;
    if (!('Notification' in window)) return false;
    if (!('serviceWorker' in navigator)) return false;
    return true;
  } catch {
    return false;
  }
}

export function getPermission(): 'granted' | 'denied' | 'prompt' {
  if (isNative()) return 'prompt';
  if (typeof Notification === 'undefined') return 'denied';
  const p = Notification.permission;
  if (p === 'granted') return 'granted';
  if (p === 'denied') return 'denied';
  return 'prompt';
}

// ── Supabase token persistence ─────────────────────────────────────────

async function saveToken(userId: string, token: string, platform: PushPlatform): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('device_tokens')
      .select('id, token')
      .eq('user_id', userId)
      .eq('token', token)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('device_tokens')
        .update({ platform, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
      return;
    }

    await supabase.from('device_tokens').insert({
      user_id: userId,
      token,
      platform,
    });
  } catch {
    // best-effort
  }
}

async function removeTokensForUser(userId: string): Promise<void> {
  try {
    await supabase.from('device_tokens').delete().eq('user_id', userId);
  } catch {
    // best-effort
  }
}

// ── Native (Android/iOS) path ──────────────────────────────────────────

let nativeInitialized = false;

async function initNativePush(userId: string): Promise<string | null> {
  if (nativeInitialized) return null;
  nativeInitialized = true;

  try {
    let permGranted = false;
    try {
      const result = await PushNotifications.requestPermissions();
      permGranted = result.receive === 'granted';
    } catch {
      permGranted = false;
    }

    if (!permGranted) return null;

    await PushNotifications.register();

    const token = await new Promise<string | null>((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 10000);

      PushNotifications.addListener('registration', (tokenObj) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(tokenObj.value);
        }
      });

      PushNotifications.addListener('registrationError', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(null);
        }
      });
    });

    if (token) {
      await saveToken(userId, token, getPlatform());
    }
    return token;
  } catch {
    return null;
  }
}

function setupNativeListeners(onNotificationClick?: (data: Record<string, string>) => void) {
  if (!isNative()) return;

  PushNotifications.addListener('pushNotificationReceived', () => {
    // App in foreground — OS shows notification automatically on native
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (event) => {
    const data = (event.notification.data ?? {}) as Record<string, string>;
    if (onNotificationClick) onNotificationClick(data);
  });
}

// ── Web fallback path (firebase/messaging) ────────────────────────────

let webMessagingModule: typeof import('../firebase/messaging') | null = null;

async function loadWebMessaging() {
  if (webMessagingModule) return webMessagingModule;
  try {
    webMessagingModule = await import('../firebase/messaging');
    return webMessagingModule;
  } catch {
    return null;
  }
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Initialize push notifications for the logged-in user.
 * Returns the device token (or null if unavailable / denied).
 */
export async function initPushNotification(userId: string): Promise<string | null> {
  if (!userId) return null;
  const supported = await isPushSupported();
  if (!supported) return null;

  if (isNative()) {
    setupNativeListeners((data) => {
      const url = data?.url || '/';
      try {
        window.location.hash = url.startsWith('#') ? url : `#${url}`;
      } catch {
        // ignore
      }
    });
    const token = await initNativePush(userId);
    notifyListeners();
    return token;
  }

  // Web fallback
  const mod = await loadWebMessaging();
  if (!mod) return null;

  const perm = await mod.requestPermission();
  if (perm !== 'granted') return null;

  const token = await mod.getAndSaveToken(userId);
  mod.onForegroundMessage((payload) => {
    const title = payload.notification?.title ?? 'SIM KBM Ustaz';
    const body = payload.notification?.body ?? '';
    const url = (payload.data?.url as string) ?? '/';
    mod.showLocalNotification(title, body, url);
  });
  notifyListeners();
  return token;
}

export async function requestPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (isNative()) {
    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted' ? 'granted' : 'denied';
    } catch {
      return 'denied';
    }
  }
  const mod = await loadWebMessaging();
  if (!mod) return 'denied';
  const perm = await mod.requestPermission();
  if (perm === 'granted') return 'granted';
  if (perm === 'denied') return 'denied';
  return 'prompt';
}

export async function registerToken(userId: string): Promise<string | null> {
  return initPushNotification(userId);
}

export async function removeToken(userId: string): Promise<void> {
  await removeTokensForUser(userId);
  if (isNative()) {
    try {
      await PushNotifications.unregister();
    } catch {
      // ignore
    }
  } else {
    const mod = await loadWebMessaging();
    if (mod) await mod.revokeAllUserTokens(userId);
  }
  notifyListeners();
}

export async function getPushState(): Promise<PushNotificationState> {
  const supported = await isPushSupported();
  return {
    supported,
    permission: getPermission(),
    token: null,
    platform: getPlatform(),
  };
}

// Re-export for compatibility with existing hook
export { PushNotifications };
