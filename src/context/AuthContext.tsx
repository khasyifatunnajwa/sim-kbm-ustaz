import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { clearExitConfirmState } from '../hooks/useExitConfirmation'

interface Profile {
  id: string
  nama_lengkap: string | null
  nama_panggilan: string | null
  email: string | null
  role: string | null
  is_active: boolean | null
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      console.error('Failed to fetch profile:', error.message)
      return
    }
    setProfile(data as Profile | null)
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        fetchProfile(data.session.user.id)
      }
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      if (newSession?.user) {
        fetchProfile(newSession.user.id)
        // Clear stale exit confirmation state on login
        clearExitConfirmState()
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [fetchProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    // Clear stale exit confirmation state immediately on successful login
    clearExitConfirmState()
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setProfile(null)
    clearExitConfirmState()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
