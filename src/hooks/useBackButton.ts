import { useEffect, useRef, useCallback } from 'react';
import type { ActiveTab } from '../types';

interface BackButtonOptions {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onExitDialog: () => void;
}

export function useBackButton({ activeTab, setActiveTab, onExitDialog }: BackButtonOptions) {
  const historyRef = useRef<ActiveTab[]>(['dashboard']);
  const stateRef = useRef({ activeTab, setActiveTab, onExitDialog });
  const isNavigatingBack = useRef(false);

  stateRef.current = { activeTab, setActiveTab, onExitDialog };

  // Track user-initiated tab changes to build history
  useEffect(() => {
    if (isNavigatingBack.current) {
      isNavigatingBack.current = false;
      return;
    }
    const hist = historyRef.current;
    const last = hist[hist.length - 1];
    if (activeTab !== last) {
      hist.push(activeTab);
      if (hist.length > 30) hist.shift();
    }
  }, [activeTab]);

  const handleBack = useCallback(() => {
    const { activeTab: current, setActiveTab: setTab, onExitDialog: exitDialog } = stateRef.current;
    const hist = historyRef.current;

    // If on dashboard and no history to go back to, show exit dialog
    if (current === 'dashboard' && hist.length <= 1) {
      exitDialog();
      return;
    }

    // Pop current tab from history
    if (hist.length > 1) {
      hist.pop();
      const prev = hist[hist.length - 1];
      if (prev && prev !== current) {
        isNavigatingBack.current = true;
        setTab(prev);
        return;
      }
    }

    // No previous tab in history — go to dashboard
    if (current !== 'dashboard') {
      isNavigatingBack.current = true;
      setTab('dashboard');
    } else {
      exitDialog();
    }
  }, []);

  // Listen to popstate (browser back / Android back)
  useEffect(() => {
    window.history.pushState({ app: 'simkbm', depth: 0 }, '');

    const onPopState = () => {
      handleBack();
      window.history.pushState({ app: 'simkbm', depth: 0 }, '');
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [handleBack]);

  const resetHistory = useCallback(() => {
    historyRef.current = ['dashboard'];
  }, []);

  return { handleBack, resetHistory };
}
