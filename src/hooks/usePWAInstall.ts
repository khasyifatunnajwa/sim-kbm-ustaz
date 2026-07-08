import { useState, useEffect } from 'react';

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
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const isDismissed = () => {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (!dismissedAt) return false;
      return Date.now() - parseInt(dismissedAt, 10) < DISMISS_DURATION;
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
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
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
        localStorage.removeItem(DISMISS_KEY);
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
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
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
