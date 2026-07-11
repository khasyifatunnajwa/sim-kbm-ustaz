import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react'
import { clearExitConfirmState } from '../hooks/useExitConfirmation'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Clear stale exit confirm state on mount — fixes the bug where
  // the exit popup appeared on login after previously exiting
  clearExitConfirmState()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scaleIn">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 dark:bg-teal-900 rounded-2xl mb-4">
            <GraduationCap size={32} className="text-teal-600 dark:text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SIAK Hafizh</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Sistem Informasi Akademik</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
