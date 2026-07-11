import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const STORAGE_KEY = 'siak_exit_confirm'

/**
 * Clear stale exit-confirmation state.
 * Bug fix: Previously, the exit confirmation state persisted in localStorage/sessionStorage
 * and was read on next app load, causing the popup to appear during login.
 * Now we clear it on every app load, route change, and successful login.
 */
export function clearExitConfirmState() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

/**
 * Main page paths where pressing Back should trigger exit confirmation.
 * On non-main pages, Back navigates normally within the app.
 */
const MAIN_PAGES = ['/', '/dashboard', '/home']

export function useExitConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMainPageRef = useRef(true)
  const exitDialogOpenRef = useRef(false)

  // Clear stale state on mount
  useEffect(() => {
    clearExitConfirmState()
  }, [])

  // Clear stale state on every route change
  useEffect(() => {
    clearExitConfirmState()
    isMainPageRef.current = MAIN_PAGES.includes(location.pathname)
  }, [location.pathname])

  useEffect(() => {
    const showExitDialog = () => {
      // Prevent multiple dialogs
      if (exitDialogOpenRef.current) return
      exitDialogOpenRef.current = true

      const isConfirmed = window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?')
      exitDialogOpenRef.current = false

      if (!isConfirmed) {
        // User cancelled — re-push state so they stay in the app
        history.pushState(null, '', location.pathname)
      } else {
        // User confirmed — set flag and attempt to close/exit
        sessionStorage.setItem(STORAGE_KEY, 'true')
        // Try to close the PWA window (works in some standalone PWA contexts)
        window.close()
        // Fallback: redirect to about:blank (effectively exits the PWA)
        window.location.href = 'about:blank'
      }
    }

    const handlePopState = (_e: PopStateEvent) => {
      if (isMainPageRef.current) {
        // On main page, intercept back navigation
        history.pushState(null, '', location.pathname)
        showExitDialog()
      }
      // On non-main pages, let React Router handle back navigation normally
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show prompt if user hasn't explicitly confirmed exit
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        e.preventDefault()
        e.returnValue = 'Apakah Anda yakin ingin keluar dari aplikasi?'
        return e.returnValue
      }
    }

    // Push initial state so we can intercept the first back press on main page
    history.pushState(null, '', location.pathname)

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [location.pathname])

  return { clearOnLogin: clearExitConfirmState }
}
