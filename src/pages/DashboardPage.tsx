import { useAuth } from '../context/AuthContext'
import { Calendar, Users, BookOpen, ClipboardList, FileText, Settings as SettingsIcon, Bell, Megaphone, BookMarked } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface MenuItem {
  to: string
  label: string
  icon: LucideIcon
  color: string
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const menuItems: MenuItem[] = [
    { to: '/jadwal', label: 'Jadwal', icon: Calendar, color: 'bg-blue-500' },
    { to: '/murid', label: 'Murid', icon: Users, color: 'bg-green-500' },
    { to: '/kelas', label: 'Kelas', icon: BookOpen, color: 'bg-emerald-500' },
    { to: '/penilaian', label: 'Penilaian', icon: ClipboardList, color: 'bg-orange-500' },
    { to: '/raport', label: 'Raport', icon: FileText, color: 'bg-pink-500' },
    { to: '/materi', label: 'Materi', icon: BookMarked, color: 'bg-cyan-500' },
    { to: '/pengumuman', label: 'Pengumuman', icon: Megaphone, color: 'bg-yellow-500' },
    { to: '/notifikasi', label: 'Notifikasi', icon: Bell, color: 'bg-red-500' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin', icon: SettingsIcon, color: 'bg-slate-600' } as MenuItem] : []),
    { to: '/pengaturan', label: 'Pengaturan', icon: SettingsIcon, color: 'bg-teal-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      <div className="bg-teal-700 dark:bg-slate-800 text-white px-4 py-6">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-teal-100 text-sm mt-1">Selamat datang, {profile?.nama_lengkap || 'Pengguna'}!</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {menuItems.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-fadeIn"
              >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
