import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'medium' | 'large'

interface SettingsContextValue {
  theme: ThemeMode
  fontSize: FontSize
  notificationsEnabled: boolean
  backgroundSync: boolean
  setTheme: (t: ThemeMode) => void
  setFontSize: (s: FontSize) => void
  setNotificationsEnabled: (v: boolean) => void
  setBackgroundSync: (v: boolean) => void
  clearCache: () => Promise<void>
  checkForUpdate: () => Promise<void>
  installPWA: () => void
  canInstall: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

const STORAGE_KEY = 'siak_settings'

const FONT_SCALE: Record<FontSize, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
}

interface StoredSettings {
  theme: ThemeMode
  fontSize: FontSize
  notificationsEnabled: boolean
  backgroundSync: boolean
}

function loadSettings(): StoredSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { theme: 'system', fontSize: 'medium', notificationsEnabled: false, backgroundSync: true }
}

function saveSettings(s: StoredSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoredSettings>(loadSettings)
  const [canInstall, setCanInstall] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  // Apply theme
  useEffect(() => {
    const applyTheme = () => {
      const isDark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', isDark)
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) meta.setAttribute('content', isDark ? '#0f172a' : '#0f766e')
    }
    applyTheme()
    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      mq.addEventListener('change', applyTheme)
      return () => mq.removeEventListener('change', applyTheme)
    }
  }, [settings.theme])

  // Apply font size
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', String(FONT_SCALE[settings.fontSize]))
  }, [settings.fontSize])

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setCanInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const update = useCallback((patch: Partial<StoredSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
    if (indexedDB.databases) {
      const dbs = await indexedDB.databases()
      dbs.forEach(db => { if (db.name) indexedDB.deleteDatabase(db.name) })
    }
    localStorage.removeItem('siak_exit_confirm')
    sessionStorage.clear()
  }, [])

  const checkForUpdate = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.update()
      }
    }
  }, [])

  const installPWA = useCallback(() => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null)
        setCanInstall(false)
      })
    }
  }, [deferredPrompt])

  const value: SettingsContextValue = {
    theme: settings.theme,
    fontSize: settings.fontSize,
    notificationsEnabled: settings.notificationsEnabled,
    backgroundSync: settings.backgroundSync,
    setTheme: (t) => update({ theme: t }),
    setFontSize: (s) => update({ fontSize: s }),
    setNotificationsEnabled: (v) => update({ notificationsEnabled: v }),
    setBackgroundSync: (v) => update({ backgroundSync: v }),
    clearCache,
    checkForUpdate,
    installPWA,
    canInstall,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
