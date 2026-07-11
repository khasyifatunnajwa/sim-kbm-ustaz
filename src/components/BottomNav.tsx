import { NavLink } from 'react-router-dom'
import { Home, Calendar, ClipboardList, Settings as SettingsIcon } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavLinkItem {
  to: string
  label: string
  icon: LucideIcon
}

const links: NavLinkItem[] = [
  { to: '/', label: 'Beranda', icon: Home },
  { to: '/jadwal', label: 'Jadwal', icon: Calendar },
  { to: '/penilaian', label: 'Nilai', icon: ClipboardList },
  { to: '/pengaturan', label: 'Pengaturan', icon: SettingsIcon },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
        {links.map(link => {
          const Icon = link.icon
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                  isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500'
                }`
              }
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
