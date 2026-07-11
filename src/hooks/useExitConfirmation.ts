import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const STORAGE_KEY = 'siak_exit_confirm'

/**
 * Fix bug: clear stale exit-confirmation state on every app load and login.
 * The bug was: state persisted in localStorage/sessionStorage and triggered
 * the popup on next load even though user was just logging in.
 */
export function clearExitConfirmState() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

export function useExitConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const showDialogRef = useRef<(() => void) | null>(null)
  const isMainPageRef = useRef(true)

  // Clear stale state on mount and whenever route changes
  useEffect(() => {
    clearExitConfirmState()
  }, [])

  useEffect(() => {
    clearExitConfirmState()
  }, [location.pathname])

  // Determine if we're on the main/home page (where back button = exit)
  useEffect(() => {
    isMainPageRef.current = location.pathname === '/' || location.pathname === '/dashboard' || location.pathname === '/home'
  }, [location.pathname])

  useEffect(() => {
    let exitDialogOpen = false

    const showExitDialog = () => {
      if (exitDialogOpen) return
      exitDialogOpen = true

      const isConfirmed = window.confirm('Apakah Anda yakin ingin keluar dari aplikasi?')
      exitDialogOpen = false

      if (!isConfirmed) {
        // User cancelled — push state back so they stay in the app
        history.pushState(null, '', location.pathname)
      } else {
        // User confirmed — set flag and try to close/redirect
        sessionStorage.setItem(STORAGE_KEY, 'true')
        // On mobile PWA, try to close the app window
        window.close()
        // Fallback: redirect to a blank exit page
        window.location.href = 'about:blank'
      }
    }

    showDialogRef.current = showExitDialog

    // History API: intercept back navigation on main page
    const handlePopState = (e: PopStateEvent) => {
      if (isMainPageRef.current) {
        // Prevent default back navigation by re-pushing state
        history.pushState(null, '', location.pathname)
        showExitDialog()
      }
    }

    // beforeunload: desktop browser close/tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only show prompt if user hasn't explicitly confirmed exit
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        e.preventDefault()
        e.returnValue = 'Apakah Anda yakin ingin keluar dari aplikasi?'
        return e.returnValue
      }
    }

    // Push initial state so we can intercept the first back
    history.pushState(null, '', location.pathname)

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [location.pathname])

  // Clear exit confirm state on login success
  return { clearOnLogin: clearExitConfirmState }
}
