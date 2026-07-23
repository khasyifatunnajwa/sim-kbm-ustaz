import { useEffect, useRef, useCallback } from 'react';
import type { ActiveTab } from '../types';

interface BackButtonOptions {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExitDialog: () => void;
}

export function useBackButton({ activeTab, setActiveTab, onExitDialog }: BackButtonOptions) {
  const stateRef = useRef({ activeTab, setActiveTab, onExitDialog });
  const lastBackPressTime = useRef<number>(0);

  stateRef.current = { activeTab, setActiveTab, onExitDialog };

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const mainTab = hash.split('/')[0];

    if (mainTab && mainTab !== activeTab) {
      setActiveTab(mainTab as ActiveTab);
    } else if (!hash) {
      window.history.replaceState(null, '', '#dashboard');
    }
  }, []);

  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '').split('/')[0];
    if (currentHash !== activeTab) {
      window.history.pushState(null, '', `#${activeTab}`);
    }
  }, [activeTab]);

  useEffect(() => {
    const onPopState = () => {
      const { activeTab: current, setActiveTab: setTab, onExitDialog: exitDialog } = stateRef.current;

      const now = Date.now();
      const timeSinceLastPress = now - lastBackPressTime.current;
      lastBackPressTime.current = now;

      const rawHash = window.location.hash.replace('#', '');
      const hashParts = rawHash.split('/');
      const mainTab = hashParts[0] || 'dashboard';
      const hasSubRoute = hashParts.length > 1 && hashParts[1] !== '';

      if (hasSubRoute) {
        window.history.pushState(null, '', `#${current}`);
        const cleanHash = `#${current}`;
        if (window.location.hash !== cleanHash) {
          window.history.replaceState(null, '', cleanHash);
        }
        setTab(current as ActiveTab);
        return;
      }

      if (timeSinceLastPress < 400) {
        window.history.pushState(null, '', `#${current}`);
        exitDialog();
        return;
      }

      if (current === 'dashboard') {
        window.history.pushState(null, '', '#dashboard');
        exitDialog();
        return;
      }

      setTab(mainTab as ActiveTab);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const resetHistory = useCallback(() => {
    window.history.replaceState(null, '', '#dashboard');
  }, []);

  return { handleBack, resetHistory };
}
