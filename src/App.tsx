import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'
import { useExitConfirmation } from './hooks/useExitConfirmation'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import BottomNav from './components/BottomNav'
import { Loader2 } from 'lucide-react'

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  useExitConfirmation()
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}

function AppRoutes() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 className="animate-spin text-teal-600" size={32} />
      </div>
    )
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
      <Route path="/pengaturan" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  )
}
