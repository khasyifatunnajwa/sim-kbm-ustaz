import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';

const THEME_KEY = 'simkbm-theme';

function safeGetTheme(): Theme {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_KEY) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored;
      }
    }
  } catch { /* ignore */ }
  return 'system';
}

function safeSetTheme(theme: Theme) {
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
}

function safeMatchMediaDark(): boolean {
  try {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(safeGetTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    try {
      const root = document.documentElement;
      if (resolved === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } catch { /* ignore */ }
    setResolvedTheme(resolved);
  }, []);

  const resolveTheme = useCallback((t: Theme): 'light' | 'dark' => {
    if (t === 'system') {
      return safeMatchMediaDark() ? 'dark' : 'light';
    }
    return t;
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    safeSetTheme(newTheme);
    applyTheme(resolveTheme(newTheme));
  }, [applyTheme, resolveTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  useEffect(() => {
    applyTheme(resolveTheme(theme));

    try {
      if (typeof window === 'undefined' || !window.matchMedia) return;
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (theme === 'system') {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch { /* ignore */ }
  }, [theme, applyTheme, resolveTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}
