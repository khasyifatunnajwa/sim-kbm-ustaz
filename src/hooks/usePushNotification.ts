/**
 * usePushNotification — React hook that wires Firebase Cloud Messaging
 * into the app lifecycle.
 *
 * Responsibilities:
 *  - On mount (when a userId is provided): request permission, get token,
 *    save to Supabase, and register a foreground onMessage listener.
 *  - On unmount / when userId becomes null: revoke tokens (logout).
 *  - Expose permission status and helper actions for the settings page.
 *
 * The hook is fully optional — if push is unsupported the app keeps running.
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  isPushSupported,
  getPermission,
  requestPermission,
  getAndSaveToken,
  revokeAllUserTokens,
  onForegroundMessage,
  showLocalNotification,
} from '../firebase/messaging';

export interface PushNotificationState {
  supported: boolean;
  permission: NotificationPermission;
  token: string | null;
  enable: () => Promise<boolean>;
  disable: () => Promise<void>;
  refreshPermission: () => void;
}

export function usePushNotification(userId: string | null | undefined): PushNotificationState {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [token, setToken] = useState<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  // Initial support + permission check
  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await isPushSupported();
      if (!alive) return;
      setSupported(ok);
      setPermission(getPermission());
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Register / unregister when userId changes
  useEffect(() => {
    if (!userId || !supported) return;

    let active = true;

    (async () => {
      // If permission already granted, fetch token immediately
      if (getPermission() === 'granted') {
        const t = await getAndSaveToken(userId);
        if (active) setToken(t);
      }

      // Foreground message listener
      const unsub = onForegroundMessage((payload) => {
        const title = payload.notification?.title ?? 'SIM KBM Ustaz';
        const body = payload.notification?.body ?? '';
        const url = (payload.data?.url as string) ?? '/';
        showLocalNotification(title, body, url);
      });
      unsubRef.current = unsub;
    })();

    return () => {
      active = false;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [userId, supported]);

  // On logout (userId becomes null): revoke tokens
  useEffect(() => {
    if (!userId && token) {
      revokeAllUserTokens(token).catch(() => {});
      setToken(null);
    }
  }, [userId, token]);

  const enable = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;
    const perm = await requestPermission();
    setPermission(perm);
    if (perm !== 'granted') return false;
    const t = await getAndSaveToken(userId);
    setToken(t);
    return !!t;
  }, [userId]);

  const disable = useCallback(async (): Promise<void> => {
    if (!userId) return;
    await revokeAllUserTokens(userId);
    setToken(null);
    setPermission(getPermission());
  }, [userId]);

  const refreshPermission = useCallback(() => {
    setPermission(getPermission());
  }, []);

  return { supported, permission, token, enable, disable, refreshPermission };
}
