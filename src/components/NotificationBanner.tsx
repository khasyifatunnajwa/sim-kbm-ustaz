import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, CheckCircle, AlertCircle, Info, CalendarDays,
  Megaphone, Clock, ChevronRight, BellOff, Trash2,
} from 'lucide-react';
import { useNotificationStore, type AppNotification, type NotificationType } from '../store/useNotificationStore';
import { useSettings } from '../store/useSettings';
import { playNotificationChime, playReminderSound } from '../lib/notificationSound';

const TYPE_CONFIG: Record<NotificationType, {
  icon: React.ElementType;
  bg: string;
  iconBg: string;
  iconColor: string;
  titleColor: string;
  msgColor: string;
  barColor: string;
}> = {
  jadwal: {
    icon: CalendarDays,
    bg: 'bg-sky-50 dark:bg-sky-900/30',
    iconBg: 'bg-sky-100 dark:bg-sky-800/50',
    iconColor: 'text-sky-600 dark:text-sky-300',
    titleColor: 'text-sky-900 dark:text-sky-100',
    msgColor: 'text-sky-700 dark:text-sky-200',
    barColor: 'bg-sky-500',
  },
  pengumuman: {
    icon: Megaphone,
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    iconBg: 'bg-amber-100 dark:bg-amber-800/50',
    iconColor: 'text-amber-600 dark:text-amber-300',
    titleColor: 'text-amber-900 dark:text-amber-100',
    msgColor: 'text-amber-700 dark:text-amber-200',
    barColor: 'bg-amber-500',
  },
  agenda: {
    icon: Clock,
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    iconBg: 'bg-violet-100 dark:bg-violet-800/50',
    iconColor: 'text-violet-600 dark:text-violet-300',
    titleColor: 'text-violet-900 dark:text-violet-100',
    msgColor: 'text-violet-700 dark:text-violet-200',
    barColor: 'bg-violet-500',
  },
  reminder: {
    icon: Bell,
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-800/50',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
    titleColor: 'text-emerald-900 dark:text-emerald-100',
    msgColor: 'text-emerald-700 dark:text-emerald-200',
    barColor: 'bg-emerald-500',
  },
  info: {
    icon: Info,
    bg: 'bg-sky-50 dark:bg-sky-900/30',
    iconBg: 'bg-sky-100 dark:bg-sky-800/50',
    iconColor: 'text-sky-600 dark:text-sky-300',
    titleColor: 'text-sky-900 dark:text-sky-100',
    msgColor: 'text-sky-700 dark:text-sky-200',
    barColor: 'bg-sky-500',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    iconBg: 'bg-orange-100 dark:bg-orange-800/50',
    iconColor: 'text-orange-600 dark:text-orange-300',
    titleColor: 'text-orange-900 dark:text-orange-100',
    msgColor: 'text-orange-700 dark:text-orange-200',
    barColor: 'bg-orange-500',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    iconBg: 'bg-emerald-100 dark:bg-emerald-800/50',
    iconColor: 'text-emerald-600 dark:text-emerald-300',
    titleColor: 'text-emerald-900 dark:text-emerald-100',
    msgColor: 'text-emerald-700 dark:text-emerald-200',
    barColor: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    iconBg: 'bg-rose-100 dark:bg-rose-800/50',
    iconColor: 'text-rose-600 dark:text-rose-300',
    titleColor: 'text-rose-900 dark:text-rose-100',
    msgColor: 'text-rose-700 dark:text-rose-200',
    barColor: 'bg-rose-500',
  },
};

function formatTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Baru saja';
  if (min < 60) return `${min} menit lalu`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} jam lalu`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} hari lalu`;
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/**
 * Full-screen notification center panel (drawer from top-right).
 */
function NotificationCenter({
  open, onClose, onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (tab?: string) => void;
}) {
  const { notifications, unreadCount, markAllRead, markRead, clearAll, dismissNotification } = useNotificationStore();

  const handleAction = (n: AppNotification) => {
    markRead(n.id);
    if (n.actionTab) onNavigate(n.actionTab);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'tween', duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white dark:bg-slate-800 z-[61] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  <h2 className="font-bold text-lg">Notifikasi</h2>
                  {unreadCount > 0 && (
                    <span className="bg-white/25 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {notifications.length > 0 && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={markAllRead}
                    className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Tandai dibaca
                  </button>
                  <button
                    onClick={clearAll}
                    className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus semua
                  </button>
                </div>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                    <BellOff className="w-8 h-8 text-slate-300 dark:text-slate-500" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Tidak ada notifikasi</p>
                  <p className="text-xs text-slate-400 mt-1">Notifikasi jadwal dan pengumuman akan muncul di sini</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={n.id}
                      className={`rounded-2xl p-3.5 ${cfg.bg} border border-slate-100 dark:border-slate-700/50 relative overflow-hidden`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.barColor}`} />
                      <div className="flex items-start gap-3 pl-1">
                        <div className={`w-9 h-9 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4.5 h-4.5 ${cfg.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold ${cfg.titleColor}`}>{n.title}</p>
                          <p className={`text-xs ${cfg.msgColor} mt-0.5 leading-relaxed`}>{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1.5">{formatTimeAgo(n.timestamp)}</p>
                          {n.actionLabel && n.actionTab && (
                            <button
                              onClick={() => handleAction(n)}
                              className={`mt-2 text-xs font-bold ${cfg.iconColor} bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1`}
                            >
                              {n.actionLabel} <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {!n.read && (
                          <div className={`w-2 h-2 rounded-full ${cfg.barColor} flex-shrink-0 mt-1`} />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface NotificationBannerProps {
  onNavigate: (tab?: string) => void;
}

/**
 * NotificationBanner — top-of-screen animated notification banner.
 * Shows the latest unread notification with sound + vibration.
 * Includes a bell icon with badge in the header area that opens the notification center.
 */
export default function NotificationBanner({ onNavigate }: NotificationBannerProps) {
  const { notifications, dismissNotification, addNotification } = useNotificationStore();
  const { settings } = useSettings();
  const [bannerNotif, setBannerNotif] = useState<AppNotification | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const lastBannerRef = useRef<string | null>(null);

  // Pick the latest unread, non-dismissed notification for the banner
  useEffect(() => {
    const latest = notifications.find(n => !n.read && !n.dismissed && !shownIdsRef.current.has(n.id));
    if (latest && latest.id !== lastBannerRef.current) {
      setBannerNotif(latest);
      lastBannerRef.current = latest.id;
      shownIdsRef.current.add(latest.id);

      // Play sound + vibrate
      if (settings.notifSound) {
        if (latest.type === 'jadwal' || latest.type === 'reminder') {
          playReminderSound({ vibrate: settings.notifVibrate });
        } else {
          playNotificationChime({ vibrate: settings.notifVibrate });
        }
      } else if (settings.notifVibrate) {
        import('../lib/notificationSound').then(m => m.vibrateDevice([80, 40, 80]));
      }

      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        setBannerNotif(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notifications, settings.notifSound, settings.notifVibrate]);

  // Clean up old notifications on mount
  useEffect(() => {
    const { removeOldNotifications } = useNotificationStore.getState();
    removeOldNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleBannerAction = () => {
    if (bannerNotif) {
      dismissNotification(bannerNotif.id);
      if (bannerNotif.actionTab) onNavigate(bannerNotif.actionTab);
    }
    setBannerNotif(null);
  };

  const handleBannerDismiss = () => {
    if (bannerNotif) dismissNotification(bannerNotif.id);
    setBannerNotif(null);
  };

  const cfg = bannerNotif ? TYPE_CONFIG[bannerNotif.type] || TYPE_CONFIG.info : null;
  const BannerIcon = cfg?.icon || Bell;

  return (
    <>
      {/* Floating Bell Button with badge */}
      <button
        onClick={() => setPanelOpen(true)}
        className="fixed top-3 right-3 z-50 w-10 h-10 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Buka notifikasi"
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Top Banner — slides down from top */}
      <AnimatePresence>
        {bannerNotif && cfg && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-[55] px-3 pt-2"
          >
            <div className={`mx-auto max-w-md rounded-2xl shadow-xl ${cfg.bg} border border-slate-200/50 dark:border-slate-700/50 overflow-hidden`}>
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.barColor}`} />
              <div className="flex items-start gap-3 p-3.5 pl-4">
                <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <BannerIcon className={`w-5 h-5 ${cfg.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className={`text-sm font-bold ${cfg.titleColor} truncate`}>{bannerNotif.title}</p>
                  <p className={`text-xs ${cfg.msgColor} mt-0.5 line-clamp-2`}>{bannerNotif.message}</p>
                  {bannerNotif.actionLabel && (
                    <button
                      onClick={handleBannerAction}
                      className={`mt-2 text-xs font-bold ${cfg.iconColor} bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1`}
                    >
                      {bannerNotif.actionLabel} <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleBannerDismiss}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Progress bar for auto-dismiss */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
                className={`h-0.5 ${cfg.barColor} opacity-50`}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Center Panel */}
      <NotificationCenter
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onNavigate={onNavigate}
      />
    </>
  );
}
