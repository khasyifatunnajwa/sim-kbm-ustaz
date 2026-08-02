import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // On native platforms (Android APK), the app is already installed.
    if (Capacitor.isNativePlatform()) {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    try {
      const isStandalone =
        (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
        (typeof window !== 'undefined' && (window.navigator as any).standalone === true);

      if (isStandalone) {
        setIsInstalled(true);
        return;
      }

      const isDismissed = () => {
        try {
          const dismissedAt = localStorage.getItem(DISMISS_KEY);
          if (!dismissedAt) return false;
          return Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION;
        } catch {
          return false;
        }
      };

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        if (isDismissed()) return;
        setInstallPrompt(e as BeforeInstallPromptEvent);
        setIsInstallable(true);
      };

      const handleAppInstalled = () => {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        try { localStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    } catch {
      // Browser APIs unavailable — treat as not installable
      setIsInstalled(false);
      setIsInstallable(false);
    }
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setInstallPrompt(null);
        try { localStorage.removeItem(DISMISS_KEY); } catch { /* ignore */ }
        return true;
      } else {
        dismissInstall();
        return false;
      }
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  };

  const dismissInstall = () => {
    try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* ignore */ }
    setIsInstallable(false);
    setInstallPrompt(null);
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissInstall,
  };
}
