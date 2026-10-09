import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useNotificationStore } from '../store/useNotificationStore';
import { useSettings } from '../store/useSettings';
import { namaHari } from '../lib/utils';
import { showLocalNotification } from '../firebase/messaging';
import { playReminderSound } from '../lib/notificationSound';
import type { Profile, JadwalMengajar, Pengumuman, AgendaPenting } from '../types';

const REMINDER_MINUTES_BEFORE = 15;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * useScheduledNotifications — monitors jadwal, pengumuman, and agenda,
 * firing local notifications + adding to the notification store.
 *
 * - Jadwal: fires a reminder REMINDER_MINUTES_BEFORE minutes before class starts
 * - Pengumuman: fires when a new "Publish" pengumuman is detected
 * - Agenda: fires for upcoming agenda items (same day)
 *
 * Notifications work in the foreground (banner + sound) and via the browser
 * Notification API when permission is granted.
 */
export function useScheduledNotifications(profile: Profile | null) {
  const { addNotification } = useNotificationStore();
  const { settings } = useSettings();
  const firedRemindersRef = useRef<Set<string>>(new Set());
  const seenPengumumanRef = useRef<Set<string>>(new Set());
  const seenAgendaRef = useRef<Set<string>>(new Set());
  const initRef = useRef(false);

  const todayHari = namaHari[new Date().getDay()];
  const todayDate = new Date().toISOString().split('T')[0];
  const isUstaz = profile?.role !== 'admin';
  const userId = profile?.id ?? '';

  // Fetch today's jadwal
  const { data: jadwalHariIni = [] } = useQuery<JadwalMengajar[]>({
    queryKey: ['notif-jadwal', todayHari, userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('jadwal_mengajar').select('*').eq('hari', todayHari).order('jam_mulai');
      if (isUstaz) q = q.eq('user_id', userId);
      const { data } = await q;
      return (data ?? []) as JadwalMengajar[];
    },
    staleTime: 60 * 1000,
    enabled: !!userId,
  });

  // Fetch published pengumuman
  const { data: pengumumanList = [] } = useQuery<Pengumuman[]>({
    queryKey: ['notif-pengumuman'],
    queryFn: async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('pengumuman')
        .select('*')
        .eq('status', 'Publish')
        .lte('tanggal_mulai', todayStr)
        .or(`tanggal_selesai.is.null,tanggal_selesai.gte.${todayStr}`)
        .order('created_at', { ascending: false })
        .limit(5);
      return (data ?? []) as Pengumuman[];
    },
    staleTime: 60 * 1000,
    enabled: !!userId,
  });

  // Fetch today's agenda
  const { data: agendaList = [] } = useQuery<AgendaPenting[]>({
    queryKey: ['notif-agenda', todayDate, userId, isUstaz],
    queryFn: async () => {
      let q = supabase.from('agenda_penting').select('*').eq('tanggal', todayDate).order('tanggal', { ascending: true }).limit(5);
      if (isUstaz) q = q.eq('user_id', userId);
      const { data } = await q;
      return (data ?? []) as AgendaPenting[];
    },
    staleTime: 60 * 1000,
    enabled: !!userId,
  });

  // Fire a notification (both local + store)
  const fireNotification = useCallback((params: {
    type: 'jadwal' | 'pengumuman' | 'agenda';
    title: string;
    message: string;
    actionTab?: string;
    actionLabel?: string;
    dedupeKey: string;
  }) => {
    const { type, title, message, actionTab, actionLabel, dedupeKey } = params;

    // Add to notification store (for banner + center)
    addNotification({
      type,
      title,
      message,
      actionTab,
      actionLabel,
    });

    // Fire system notification (works even if app is in background tab)
    if (settings.notifSound || (typeof Notification !== 'undefined' && Notification.permission === 'granted')) {
      showLocalNotification(title, message, actionTab ? `#${actionTab}` : '/');

      if (settings.notifSound) {
        playReminderSound({ vibrate: settings.notifVibrate });
      }
    }
  }, [addNotification, settings.notifSound, settings.notifVibrate]);

  // Check jadwal reminders every 30 seconds
  useEffect(() => {
    if (!settings.notifJadwal) return;

    const checkJadwal = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      for (const j of jadwalHariIni) {
        const startMin = timeToMinutes(j.jam_mulai);
        const reminderTime = startMin - REMINDER_MINUTES_BEFORE;
        const dedupeKey = `jadwal-${todayDate}-${j.id}`;

        // Fire when we're within the reminder window (between reminder time and start time)
        if (
          currentMinutes >= reminderTime &&
          currentMinutes < startMin &&
          !firedRemindersRef.current.has(dedupeKey)
        ) {
          firedRemindersRef.current.add(dedupeKey);
          fireNotification({
            type: 'jadwal',
            title: `Jadwal: ${j.pelajaran}`,
            message: `Kelas ${j.kelas} akan dimulai pukul ${j.jam_mulai.slice(0, 5)}${j.ruangan ? ` di ${j.ruangan}` : ''}. Bersiap mengajar!`,
            actionTab: 'jadwal',
            actionLabel: 'Lihat Jadwal',
            dedupeKey,
          });
        }
      }
    };

    checkJadwal();
    const interval = setInterval(checkJadwal, 30000);
    return () => clearInterval(interval);
  }, [jadwalHariIni, todayDate, settings.notifJadwal, fireNotification]);

  // Check for new pengumuman
  useEffect(() => {
    if (!settings.notifPengumuman) return;

    // On first load, just mark all as seen (don't fire for old ones)
    if (!initRef.current) {
      pengumumanList.forEach(p => seenPengumumanRef.current.add(p.id));
      agendaList.forEach(a => seenAgendaRef.current.add(a.id));
      initRef.current = true;
      return;
    }

    // Check for new pengumuman
    for (const p of pengumumanList) {
      if (!seenPengumumanRef.current.has(p.id)) {
        seenPengumumanRef.current.add(p.id);
        fireNotification({
          type: 'pengumuman',
          title: p.judul || 'Pengumuman Baru',
          message: p.isi?.slice(0, 100) || 'Ada pengumuman baru dari admin',
          actionTab: 'dashboard',
          actionLabel: 'Lihat',
          dedupeKey: `pengumuman-${p.id}`,
        });
      }
    }

    // Check for today's agenda
    for (const a of agendaList) {
      if (!seenAgendaRef.current.has(a.id)) {
        seenAgendaRef.current.add(a.id);
        fireNotification({
          type: 'agenda',
          title: `Agenda: ${a.judul}`,
          message: `Agenda hari ini${a.jenis ? ` (${a.jenis})` : ''}`,
          actionTab: 'dashboard',
          actionLabel: 'Lihat',
          dedupeKey: `agenda-${a.id}`,
        });
      }
    }
  }, [pengumumanList, agendaList, settings.notifPengumuman, fireNotification]);

  // Clear fired reminders at midnight (so they can fire again next day)
  useEffect(() => {
    const cleanup = () => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 2) {
        firedRemindersRef.current.clear();
      }
    };
    const interval = setInterval(cleanup, 60000);
    return () => clearInterval(interval);
  }, []);
}
