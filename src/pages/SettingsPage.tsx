import { useState } from 'react'
import { useSettings, type ThemeMode, type FontSize } from '../context/SettingsContext'
import { useAuth } from '../context/AuthContext'
import {
  Sun, Moon, Monitor, Type, Bell, BellOff, RefreshCw, Download,
  Trash2, Wifi, WifiOff, CheckCircle2, Smartphone, Database,
  AlertTriangle
} from 'lucide-react'

export default function SettingsPage() {
  const {
    theme, fontSize, notificationsEnabled, backgroundSync,
    setTheme, setFontSize, setNotificationsEnabled, setBackgroundSync,
    clearCache, checkForUpdate, installPWA, canInstall,
  } = useSettings()
  const { profile, signOut } = useAuth()
  const [clearing, setClearing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleClearCache = async () => {
    if (!confirm('Hapus semua data cache dan penyimpanan lokal? Aplikasi akan dimuat ulang.')) return
    setClearing(true)
    try {
      await clearCache()
      showToast('Cache dan data lokal berhasil dibersihkan')
      setTimeout(() => window.location.reload(), 1500)
    } catch {
      showToast('Gagal membersihkan cache')
    }
    setClearing(false)
  }

  const handleCheckUpdate = async () => {
    setUpdating(true)
    try {
      await checkForUpdate()
      showToast('Pemeriksaan pembaruan selesai')
    } catch {
      showToast('Gagal memeriksa pembaruan')
    }
    setUpdating(false)
  }

  const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Terang', icon: Sun },
    { value: 'dark', label: 'Gelap', icon: Moon },
    { value: 'system', label: 'Sistem', icon: Monitor },
  ]

  const fontOptions: { value: FontSize; label: string; sample: string }[] = [
    { value: 'small', label: 'Kecil', sample: 'Aa' },
    { value: 'medium', label: 'Sedang', sample: 'Aa' },
    { value: 'large', label: 'Besar', sample: 'Aa' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-teal-700 dark:bg-slate-800 text-white px-4 py-6 sticky top-0 z-10 shadow-lg">
        <h1 className="text-xl font-bold">Pengaturan</h1>
        <p className="text-teal-100 text-sm mt-1">
          {profile?.nama_lengkap || 'Pengguna'} • {profile?.role === 'admin' ? 'Administrator' : 'Ustaz/Ustadzah'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Tampilan */}
        <Section title="Tampilan" icon={Monitor}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tema</label>
              <div className="grid grid-cols-3 gap-2">
                {themeOptions.map(opt => {
                  const Icon = opt.icon
                  const active = theme === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        active
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                          : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Ukuran Teks</label>
              <div className="grid grid-cols-3 gap-2">
                {fontOptions.map(opt => {
                  const active = fontSize === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFontSize(opt.value)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        active
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                          : 'border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Type size={opt.value === 'small' ? 14 : opt.value === 'large' ? 22 : 18} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* Notifikasi */}
        <Section title="Notifikasi" icon={Bell}>
          <ToggleRow
            icon={notificationsEnabled ? Bell : BellOff}
            label="Notifikasi Push"
            description="Izinkan notifikasi web push"
            value={notificationsEnabled}
            onChange={async (v) => {
              if (v) {
                const perm = await Notification.requestPermission()
                if (perm !== 'granted') {
                  showToast('Izin notifikasi ditolak')
                  return
                }
              }
              setNotificationsEnabled(v)
            }}
          />
        </Section>

        {/* Pengelolaan Data & Mode Offline */}
        <Section title="Pengelolaan Data & Mode Offline" icon={Database}>
          <div className="space-y-3">
            <ToggleRow
              icon={backgroundSync ? Wifi : WifiOff}
              label="Sinkronisasi Latar Belakang"
              description="Perbarui data otomatis saat online"
              value={backgroundSync}
              onChange={setBackgroundSync}
            />
            <button
              onClick={handleClearCache}
              disabled={clearing}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
            >
              {clearing ? <RefreshCw className="animate-spin" size={20} /> : <Trash2 size={20} />}
              <div className="text-left flex-1">
                <div className="text-sm font-medium">Hapus Cache / Data Lokal</div>
                <div className="text-xs text-red-400">Bersihkan cache dan penyimpanan lokal</div>
              </div>
            </button>
          </div>
        </Section>

        {/* Fitur Khusus PWA */}
        <Section title="Fitur Khusus PWA" icon={Smartphone}>
          <div className="space-y-3">
            <button
              onClick={handleCheckUpdate}
              disabled={updating}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
            >
              {updating ? <RefreshCw className="animate-spin" size={20} /> : <RefreshCw size={20} />}
              <div className="text-left flex-1">
                <div className="text-sm font-medium">Periksa Pembaruan</div>
                <div className="text-xs text-blue-400">Cek versi terbaru aplikasi</div>
              </div>
            </button>

            {canInstall && (
              <button
                onClick={installPWA}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
              >
                <Download size={20} />
                <div className="text-left flex-1">
                  <div className="text-sm font-medium">Instal ke Layar Utama</div>
                  <div className="text-xs text-teal-400">Pasang aplikasi di perangkat Anda</div>
                </div>
              </button>
            )}

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
              <CheckCircle2 size={20} className="text-green-500" />
              <div className="text-sm">
                {('serviceWorker' in navigator) ? 'PWA aktif' : 'PWA tidak didukung'}
              </div>
            </div>
          </div>
        </Section>

        {/* Akun */}
        <Section title="Akun" icon={AlertTriangle}>
          <button
            onClick={() => {
              if (confirm('Yakin ingin keluar dari akun?')) signOut()
            }}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <AlertTriangle size={20} />
            <span className="text-sm font-medium">Keluar dari Akun</span>
          </button>
        </Section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 toast-enter">
          <div className="bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-xl shadow-lg text-sm flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-400" />
            {toast}
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Sun; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-slate-700">
        <Icon size={18} className="text-teal-600 dark:text-teal-400" />
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function ToggleRow({
  icon: Icon, label, description, value, onChange,
}: {
  icon: typeof Bell; label: string; description: string; value: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 p-2">
      <Icon size={20} className={value ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'} />
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-teal-600' : 'bg-gray-300 dark:bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  )
}
