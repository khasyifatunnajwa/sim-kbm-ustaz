/**
 * Platform utilities for safe access to browser APIs across native (Android)
 * and web environments. All browser-only APIs are guarded so the app never
 * crashes inside the Android WebView.
 */
import { Capacitor } from '@capacitor/core';

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function isWebPlatform(): boolean {
  return !isNativePlatform();
}

/**
 * Safe localStorage wrapper. On native platforms localStorage works inside
 * the WebView, but we guard for environments where it may be disabled.
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
  clear(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.clear();
    } catch {
      // ignore
    }
  },
};

/**
 * Safe sessionStorage wrapper.
 */
export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof sessionStorage === 'undefined') return null;
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof sessionStorage === 'undefined') return;
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

/**
 * Safe navigator.onLine check.
 */
export function isOnline(): boolean {
  try {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  } catch {
    return true;
  }
}

/**
 * Safe window.matchMedia check.
 */
export function safeMatchMedia(query: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/**
 * Copy text to clipboard safely (web only; native uses Share plugin).
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    if (typeof document !== 'undefined') {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}
