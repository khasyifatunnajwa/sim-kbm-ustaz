import { useState, useEffect, useMemo } from 'react';
import {
  User, Users, Shield, Plus, Trash2, Pencil, CheckCircle, KeyRound,
  BookOpen, Calendar, Search, Database, GraduationCap, Megaphone,
  Building2, Clock, FileText, BarChart3, Settings, Bell,
  ChevronRight, LayoutDashboard, AlertTriangle,
  UsersRound, UserX, School, MessageCircleWarning,
  ArrowLeft, Phone, MapPin, Download, Upload, Lock,
  ChevronDown, ChevronUp, Target, NotebookPen, BookCopy, History, Activity, Mic,
  Palette, Type, Sun, Moon, Monitor, RotateCcw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';
import { useLembaga } from '../hooks/useLembaga';
import { useThemeContext } from '../contexts/ThemeContext';
import type {
  Profile, ShowToast, TahunAjaran, Semester, MataPelajaran, UserRole, KelompokMapel, Ruangan, ActiveTab, DataAkademikTab,
  KelasKosong,
  KenakalanUstaz,
  PresensiMuridByKelas,
  Lembaga, Murid, JadwalMengajar
} from '../types';
import DataSiswaPage from './DataSiswaPage';
import DataUstazPage from './DataUstazPage';
import AdminPengumuman from './AdminPengumumanPage';

type AdminSection = 'dashboard' | 'kelola-user' | 'data-master' | 'jadwal' | 'akademik' | 'presensi' | 'penilaian' | 'pengumuman' | 'laporan' | 'statistik' | 'pengaturan' | 'audit';
type KelolaUserTab = 'admin' | 'ustaz' | 'operator' | 'reset-password' | 'hak-akses' | 'riwayat-login';
type DataMasterTab = 'ustaz' | 'murid' | 'kelas' | 'lembaga' | 'ruang' | 'mapel' | 'tahun' | 'semester' | 'jam-pelajaran' | 'hari-belajar';
type JadwalTab = 'mengajar' | 'ujian' | 'kalender';
type AkademikTab = 'kbm-harian' | 'jurnal' | 'target' | 'bank-soal' | 'muhafadhoh' | 'buku-saku';
type PresensiTab = 'ustaz' | 'murid' | 'guru-pengganti' | 'rekap-harian' | 'rekap-bulanan' | 'rekap-semester';
type PresensiUstazSubTab = 'presensi-ustaz' | 'jadwal-ustaz';
type PenilaianTab = 'harian' | 'ulangan' | 'ujian-tulis' | 'ujian-lisan' | 'hafalan' | 'baca-kitab' | 'sikap' | 'rapor' | 'lainnya';
type PengumumanTab = 'pengumuman' | 'agenda' | 'event' | 'notifikasi';
type LaporanTab = 'presensi' | 'nilai' | 'kbm' | 'jadwal' | 'guru-pengganti';
type StatistikTab = 'kehadiran-ustaz' | 'kehadiran-murid' | 'kbm' | 'nilai' | 'top-guru' | 'top-kelas' | 'top-murid';
type PengaturanTab = 'identitas' | 'tahun-semester' | 'jam' | 'hari-libur' | 'tema' | 'backup';
type AuditTab = 'riwayat-login' | 'aktivitas' | 'perubahan' | 'error' | 'ekspor' | 'impor';
type KenakalanTab = 'ustaz' | 'murid';

const PAGE_SIZE = 10;

// ================== ADMIN DASHBOARD ==================
// ================== ADMIN DASHBOARD ==================
interface DashboardStats {
  ustazTotal: number; ustazAktif: number; ustazNonaktif: number;
  muridTotal: number; muridAktif: number; muridAlumni: number;
  kelasTotal: number; lembagaTotal: number; ruangTotal: number; mapelTotal: number;
  jadwalHariIni: number; kbmBerlangsung: number;
  presensiHadir: number; presensiTerlambat: number; presensiBelum: number; presensiIzin: number; presensiSakit: number; presensiAlfa: number;
  muridHadir: number; muridSakit: number; muridIzin: number; muridAlfa: number;
  kelasKosongCount: number; guruPenggantiCount: number; jurnalCount: number;
  kbmAktif: number;
}

interface ActivityItem {
  id: string;
  text: string;
  time: string;
  type: 'presensi' | 'nilai' | 'murid' | 'pengumuman' | 'jurnal';
  user?: string;
}

interface AgendaItem {
  id: string;
  judul: string;
  waktu: string;
  jenis: string;
}

function AdminDashboard({ onViewChange, profile }: { onViewChange: (section: AdminSection) => void; profile: Profile | null }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [kelasKosong, setKelasKosong] = useState<KelasKosong[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [agendaToday, setAgendaToday] = useState<AgendaItem[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      const [ustazRes, muridRes, kelasRes, lembagaRes, ruanganRes, mapelRes, jadwalRes, jurnalRes, presensiRes, absensiRes, izinRes, agendaRes] = await Promise.all([
        supabase.from('profiles').select('id, is_active, role', { count: 'exact' }).eq('role', 'ustaz'),
        supabase.from('murid').select('id, status_aktif', { count: 'exact' }),
        supabase.from('kelas').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('lembaga').select('id', { count: 'exact' }),
        supabase.from('ruangan').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('mata_pelajaran').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('jadwal_mengajar').select('id', { count: 'exact' }).eq('hari', dayName),
        supabase.from('jurnal_kbm').select('id', { count: 'exact' }).eq('tanggal', today),
        supabase.from('presensi_guru').select('status, telat_menit').eq('tanggal', today),
        supabase.from('absensi').select('status').eq('tanggal', today),
        supabase.from('izin_mengajar').select('id, user_id').eq('status', 'disetujui').lte('tanggal_mulai', today).gte('tanggal_selesai', today),
        supabase.from('agenda_penting').select('id, judul, tanggal, jenis').gte('tanggal', today).order('tanggal', { ascending: true }).limit(5),
      ]);

      const ustazTotal = ustazRes.data?.length || 0;
      const ustazAktif = (ustazRes.data || []).filter((u: any) => u.is_active !== false).length;
      const muridTotal = muridRes.data?.length || 0;
      const muridAktif = (muridRes.data || []).filter((m: any) => m.status_aktif !== false).length;
      const kelasTotal = kelasRes.count || 0;
      const lembagaTotal = lembagaRes.count || 0;
      const ruangTotal = ruanganRes.count || 0;
      const mapelTotal = mapelRes.count || 0;
      const jadwalHariIni = jadwalRes.count || 0;
      const jurnalCount = jurnalRes.count || 0;

      const presensiData = presensiRes.data || [];
      const presensiHadir = presensiData.filter((p: any) => p.status === 'Hadir' && !p.telat_menit).length;
      const presensiTerlambat = presensiData.filter((p: any) => p.status === 'Hadir' && p.telat_menit).length;
      const presensiBelum = Math.max(0, ustazAktif - presensiData.length);
      const presensiIzin = presensiData.filter((p: any) => p.status === 'Izin').length;
      const presensiSakit = presensiData.filter((p: any) => p.status === 'Sakit').length;
      const presensiAlfa = presensiData.filter((p: any) => p.status === 'Alfa' || p.status === 'Alpha').length;

      const absensiData = absensiRes.data || [];
      const muridHadir = absensiData.filter((a: any) => a.status === 'Hadir').length;
      const muridSakit = absensiData.filter((a: any) => a.status === 'Sakit').length;
      const muridIzin = absensiData.filter((a: any) => a.status === 'Izin').length;
      const muridAlfa = absensiData.filter((a: any) => a.status === 'Alpha' || a.status === 'Alfa').length;

      const guruPenggantiCount = izinRes.data?.length || 0;

      const now = new Date();
      const nowTime = now.getHours() * 60 + now.getMinutes();
      const kbmBerlangsung = jadwalRes.data ?
        (jadwalRes.data as any[]).filter(j => {
          const [h, m] = (j.jam_mulai || '00:00').split(':').map(Number);
          const [h2, m2] = (j.jam_selesai || '23:59').split(':').map(Number);
          return nowTime >= h * 60 + m && nowTime <= h2 * 60 + m2;
        }).length : 0;

      const kelasKosongCount = Math.max(0, jadwalHariIni - presensiData.length - guruPenggantiCount);

      setStats({
        ustazTotal, ustazAktif, ustazNonaktif: ustazTotal - ustazAktif,
        muridTotal, muridAktif, muridAlumni: muridTotal - muridAktif,
        kelasTotal, lembagaTotal, ruangTotal, mapelTotal,
        jadwalHariIni, kbmBerlangsung,
        presensiHadir, presensiTerlambat, presensiBelum, presensiIzin, presensiSakit, presensiAlfa,
        muridHadir, muridSakit, muridIzin, muridAlfa,
        kelasKosongCount, guruPenggantiCount, jurnalCount, kbmAktif: kbmBerlangsung,
      });

      // Fetch kelas kosong detail
      if (jadwalHariIni > 0) {
        const { data: jadwalData } = await supabase.from('jadwal').select('id, kelas_id, mapel_id, user_id, jam_mulai').eq('is_active', true).eq('hari', dayName);
        if (jadwalData && jadwalData.length > 0) {
          const sudahIds = new Set(presensiData.map((p: any) => p.guru_id || p.user_id));
          const izinIds = new Set((izinRes.data || []).map((i: any) => i.user_id));
          const { data: kelasData } = await supabase.from('kelas').select('id, nama_kelas').eq('is_active', true);
          const { data: mapelData } = await supabase.from('mata_pelajaran').select('id, nama_mapel').eq('is_active', true);
          const { data: profilesData } = await supabase.from('profiles').select('id, nama_lengkap');
          const kelasMap = new Map((kelasData || []).map(k => [k.id, (k as any).nama_kelas]));
          const mapelMap = new Map((mapelData || []).map(m => [m.id, (m as any).nama_mapel]));
          const profilesMap = new Map((profilesData || []).map(p => [p.id, (p as any).nama_lengkap]));
          const kelasKosongList: KelasKosong[] = jadwalData
            .filter(j => !sudahIds.has(j.user_id) && !izinIds.has(j.user_id))
            .map(j => ({
              jadwal_id: j.id,
              nama_kelas: kelasMap.get(j.kelas_id) || '-',
              nama_mapel: mapelMap.get(j.mapel_id) || '-',
              nama_guru: profilesMap.get(j.user_id) || '-',
              jam_mulai: j.jam_mulai || '-',
              jam_selesai: '-',
              guru_id: j.user_id,
              lama_belum_presensi: '-'
            }));
          setKelasKosong(kelasKosongList);
        }
      }

      // Build activity feed from recent data
      const [recentPresensi, recentJurnal, recentPengumuman] = await Promise.all([
        supabase.from('presensi_guru').select('guru_id, tanggal, status, telat_menit').eq('tanggal', today).order('created_at', { ascending: false }).limit(5),
        supabase.from('jurnal_kbm').select('user_id, tanggal, materi, kelas').eq('tanggal', today).order('created_at', { ascending: false }).limit(3),
        supabase.from('pengumuman').select('judul, created_at').order('created_at', { ascending: false }).limit(3),
      ]);

      const { data: profileNames } = await supabase.from('profiles').select('id, nama_lengkap, nama_panggilan');
      const nameMap = new Map((profileNames || []).map(p => [p.id, (p as any).nama_panggilan || (p as any).nama_lengkap || '']));

      const acts: ActivityItem[] = [];
      (recentPresensi.data || []).forEach((p: any) => {
        acts.push({
          id: `presensi-${p.guru_id}`,
          text: `melakukan presensi`,
          time: p.tanggal,
          type: 'presensi',
          user: nameMap.get(p.guru_id) || 'Ustaz',
        });
      });
      (recentJurnal.data || []).forEach((j: any) => {
        acts.push({
          id: `jurnal-${j.user_id}-${j.tanggal}`,
          text: `mengisi jurnal ${j.kelas || ''}`,
          time: j.tanggal,
          type: 'jurnal',
          user: nameMap.get(j.user_id) || 'Ustaz',
        });
      });
      (recentPengumuman.data || []).forEach((p: any) => {
        acts.push({
          id: `pengumuman-${p.judul}`,
          text: `Pengumuman "${p.judul}" dipublikasikan`,
          time: p.created_at,
          type: 'pengumuman',
        });
      });
      setActivities(acts);

      // Agenda today
      const agendaItems: AgendaItem[] = (agendaRes.data || []).map((a: any) => ({
        id: a.id,
        judul: a.judul,
        waktu: new Date(a.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        jenis: a.jenis || '',
      }));
      setAgendaToday(agendaItems);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const summaryCards = [
    { icon: Users, label: 'Data Ustaz', value: stats?.ustazTotal ?? 0, sub: `${stats?.ustazAktif ?? 0} aktif · ${stats?.ustazNonaktif ?? 0} nonaktif`, section: 'kelola-user' as AdminSection, color: 'emerald' },
    { icon: GraduationCap, label: 'Data Murid', value: stats?.muridTotal ?? 0, sub: `${stats?.muridAktif ?? 0} aktif · ${stats?.muridAlumni ?? 0} alumni`, section: 'data-master' as AdminSection, color: 'sky' },
    { icon: School, label: 'Data Kelas', value: stats?.kelasTotal ?? 0, sub: 'Total kelas', section: 'kelola-user' as AdminSection, color: 'violet' },
    { icon: Building2, label: 'Data Lembaga', value: stats?.lembagaTotal ?? 0, sub: 'Lembaga', section: 'data-master' as AdminSection, color: 'rose' },
    { icon: Building2, label: 'Data Ruang', value: stats?.ruangTotal ?? 0, sub: 'Ruang belajar', section: 'kelola-user' as AdminSection, color: 'amber' },
    { icon: BookOpen, label: 'Mata Pelajaran', value: stats?.mapelTotal ?? 0, sub: 'Mapel', section: 'kelola-user' as AdminSection, color: 'sky' },
    { icon: Calendar, label: 'Jadwal Hari Ini', value: stats?.jadwalHariIni ?? 0, sub: 'KBM hari ini', section: 'presensi' as AdminSection, color: 'emerald' },
    { icon: BookOpen, label: 'KBM Berlangsung', value: stats?.kbmBerlangsung ?? 0, sub: 'Sedang aktif', section: 'presensi' as AdminSection, color: 'sky' },
  ];

  const monitoringCards = [
    { icon: Users, label: 'Presensi Ustaz', items: [
      { label: 'Hadir', val: stats?.presensiHadir ?? 0, color: 'text-emerald-600' },
      { label: 'Terlambat', val: stats?.presensiTerlambat ?? 0, color: 'text-amber-600' },
      { label: 'Belum', val: stats?.presensiBelum ?? 0, color: 'text-slate-400' },
      { label: 'Izin', val: stats?.presensiIzin ?? 0, color: 'text-sky-600' },
      { label: 'Sakit', val: stats?.presensiSakit ?? 0, color: 'text-blue-600' },
      { label: 'Alfa', val: stats?.presensiAlfa ?? 0, color: 'text-rose-600' },
    ], section: 'presensi' as AdminSection },
    { icon: GraduationCap, label: 'Presensi Murid', items: [
      { label: 'Hadir', val: stats?.muridHadir ?? 0, color: 'text-emerald-600' },
      { label: 'Sakit', val: stats?.muridSakit ?? 0, color: 'text-amber-600' },
      { label: 'Izin', val: stats?.muridIzin ?? 0, color: 'text-sky-600' },
      { label: 'Alfa', val: stats?.muridAlfa ?? 0, color: 'text-rose-600' },
    ], section: 'presensi' as AdminSection },
  ];

  const menuItems = [
    { icon: Shield, label: 'Kelola User', desc: 'Admin, ustaz, operator', section: 'kelola-user' as AdminSection, color: 'violet' },
    { icon: Database, label: 'Data Master', desc: 'Ustaz, murid, kelas, mapel', section: 'data-master' as AdminSection, color: 'sky' },
    { icon: Calendar, label: 'Jadwal', desc: 'Mengajar, ujian, kalender', section: 'jadwal' as AdminSection, color: 'emerald' },
    { icon: BookOpen, label: 'Akademik', desc: 'KBM, jurnal, bank soal', section: 'akademik' as AdminSection, color: 'amber' },
    { icon: CheckCircle, label: 'Presensi', desc: 'Ustaz, murid, rekap', section: 'presensi' as AdminSection, color: 'emerald' },
    { icon: BarChart3, label: 'Penilaian', desc: 'Nilai, rapor, hafalan', section: 'penilaian' as AdminSection, color: 'sky' },
    { icon: Megaphone, label: 'Pengumuman', desc: 'Info, agenda, event', section: 'pengumuman' as AdminSection, color: 'amber' },
    { icon: FileText, label: 'Laporan', desc: 'Presensi, nilai, KBM', section: 'laporan' as AdminSection, color: 'rose' },
    { icon: BarChart3, label: 'Statistik', desc: 'Grafik & analitik', section: 'statistik' as AdminSection, color: 'violet' },
    { icon: Settings, label: 'Pengaturan', desc: 'Sistem & konfigurasi', section: 'pengaturan' as AdminSection, color: 'sky' },
    { icon: History, label: 'Audit', desc: 'Log & keamanan', section: 'audit' as AdminSection, color: 'rose' },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-800' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', border: 'border-violet-100 dark:border-violet-800' },
    sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-100 dark:border-sky-800' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-800' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-800' },
  };

  const activityIcons: Record<string, React.ElementType> = {
    presensi: CheckCircle, nilai: BarChart3, murid: GraduationCap, pengumuman: Megaphone, jurnal: FileText,
  };
  const activityColors: Record<string, string> = {
    presensi: 'text-emerald-500', nilai: 'text-sky-500', murid: 'text-violet-500', pengumuman: 'text-amber-500', jurnal: 'text-slate-500',
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-xl p-3.5 text-white shadow-md flex items-center gap-2.5">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
          <LayoutDashboard className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate">Dashboard Admin</h2>
          <p className="text-slate-300 text-[11px] truncate">Halo, {profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || 'Admin'}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400">{new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
        </div>
      </div>

      {/* A. Summary Cards */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Ringkasan Data</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {summaryCards.map((card, i) => {
            const Icon = card.icon;
            const c = colorClasses[card.color];
            return (
              <button key={i} onClick={() => onViewChange(card.section)} className="card p-3 card-hover text-left group">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${c.text}`} />
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-slate-400 ml-auto transition-colors" />
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-none">{card.value}</p>
                <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{card.label}</p>
                <p className="text-[10px] text-slate-400">{card.sub}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* B. Monitoring Hari Ini */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Monitoring Hari Ini</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {monitoringCards.map((mc, i) => {
            const Icon = mc.icon;
            return (
              <button key={i} onClick={() => onViewChange(mc.section)} className="card p-3 card-hover text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{mc.label}</span>
                  <ChevronRight className="w-3 h-3 text-slate-300 ml-auto" />
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {mc.items.map((item, j) => (
                    <div key={j} className="text-center bg-slate-50 dark:bg-slate-700/30 rounded-lg p-1.5">
                      <p className={`text-sm font-bold ${item.color}`}>{item.val}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{item.label}</p>
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Secondary monitoring row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-2">
          <button onClick={() => onViewChange('presensi')} className="card p-2.5 card-hover text-left flex items-center gap-2">
            <div className="w-7 h-7 bg-rose-50 dark:bg-rose-900/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats?.kelasKosongCount ?? 0}</p>
              <p className="text-[10px] text-slate-500">Kelas Kosong</p>
            </div>
          </button>
          <button onClick={() => onViewChange('presensi')} className="card p-2.5 card-hover text-left flex items-center gap-2">
            <div className="w-7 h-7 bg-sky-50 dark:bg-sky-900/20 rounded-lg flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-sky-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats?.guruPenggantiCount ?? 0}</p>
              <p className="text-[10px] text-slate-500">Guru Pengganti</p>
            </div>
          </button>
          <button onClick={() => onViewChange('akademik')} className="card p-2.5 card-hover text-left flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats?.kbmBerlangsung ?? 0}</p>
              <p className="text-[10px] text-slate-500">KBM Berlangsung</p>
            </div>
          </button>
          <button onClick={() => onViewChange('akademik')} className="card p-2.5 card-hover text-left flex items-center gap-2">
            <div className="w-7 h-7 bg-violet-50 dark:bg-violet-900/20 rounded-lg flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{stats?.jurnalCount ?? 0}</p>
              <p className="text-[10px] text-slate-500">Jurnal Mengajar</p>
            </div>
          </button>
        </div>
      </div>

      {/* C. Menu Utama */}
      <div>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Menu Utama</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {menuItems.map((item, i) => {
            const Icon = item.icon;
            const c = colorClasses[item.color];
            return (
              <button key={i} onClick={() => onViewChange(item.section)} className={`card p-2.5 card-hover text-left border ${c.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.bg}`}>
                    <Icon className={`w-3.5 h-3.5 ${c.text}`} />
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-300 ml-auto" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* D. Aktivitas Terbaru & E. Agenda Hari Ini */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Aktivitas Terbaru */}
        <div className="card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">Aktivitas Terbaru</h3>
          </div>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">Belum ada aktivitas hari ini</p>
          ) : (
            <div className="space-y-1.5">
              {activities.slice(0, 6).map((act, i) => {
                const Icon = activityIcons[act.type] || FileText;
                return (
                  <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${activityColors[act.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-700 dark:text-slate-300">
                        {act.user && <span className="font-semibold">{act.user} </span>}
                        {act.text}
                      </p>
                      <p className="text-[9px] text-slate-400">{new Date(act.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Agenda Hari Ini */}
        <div className="card p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200">Agenda Mendatang</h3>
          </div>
          {agendaToday.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-3">Tidak ada agenda</p>
          ) : (
            <div className="space-y-1.5">
              {agendaToday.map((a, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                  <div className="w-8 h-8 bg-amber-50 dark:bg-amber-900/30 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{a.waktu}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{a.judul}</p>
                    {a.jenis && <span className="badge badge-warning text-[9px]">{a.jenis}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Kelas Kosong Alert */}
      {kelasKosong.length > 0 && (
        <div className="card p-3 border-l-2 border-l-rose-500">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Perhatian: Kelas Kosong</span>
          </div>
          <div className="space-y-1">
            {kelasKosong.slice(0, 3).map((k, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <span className="text-rose-600 dark:text-rose-400 font-medium w-10">{k.jam_mulai}</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{k.nama_kelas}</span>
                <span className="text-slate-500 dark:text-slate-400 truncate">{k.nama_guru}</span>
              </div>
            ))}
            {kelasKosong.length > 3 && (
              <button onClick={() => onViewChange('presensi')} className="text-[10px] text-rose-600 dark:text-rose-400 font-medium hover:underline">
                +{kelasKosong.length - 3} kelas lainnya
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ================== MAIN COMPONENT ==================
export default function AdminPage({ showToast, profile, initialSection, initialSubTab }: { showToast: ShowToast; profile: Profile | null; setActiveTab?: (tab: ActiveTab) => void; initialSection?: string; initialSubTab?: string }) {
  const allSections: AdminSection[] = ['dashboard', 'kelola-user', 'data-master', 'jadwal', 'akademik', 'presensi', 'penilaian', 'pengumuman', 'laporan', 'statistik', 'pengaturan', 'audit'];

  const [section, setSection] = useState<AdminSection>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (initialSection && allSections.includes(initialSection as AdminSection)) return initialSection as AdminSection;
    if (allSections.includes(hashParts[1] as AdminSection)) return hashParts[1] as AdminSection;
    return 'dashboard';
  });

  const [presensiTab, setPresensiTab] = useState<PresensiTab>('ustaz');
  const [presensiUstazSubTab, setPresensiUstazSubTab] = useState<PresensiUstazSubTab>('presensi-ustaz');
  const [kelolaUserTab, setKelolaUserTab] = useState<KelolaUserTab>('admin');
  const [dataMasterTab, setDataMasterTab] = useState<DataMasterTab>('ustaz');
  const [jadwalTab, setJadwalTab] = useState<JadwalTab>('mengajar');
  const [akademikTab, setAkademikTab] = useState<AkademikTab>('kbm-harian');
  const [penilaianTab, setPenilaianTab] = useState<PenilaianTab>('harian');
  const [pengumumanTab, setPengumumanTab] = useState<PengumumanTab>('pengumuman');
  const [laporanTab, setLaporanTab] = useState<LaporanTab>('presensi');
  const [statistikTab, setStatistikTab] = useState<StatistikTab>('kehadiran-ustaz');
  const [pengaturanTab, setPengaturanTab] = useState<PengaturanTab>('identitas');
  const [auditTab, setAuditTab] = useState<AuditTab>('riwayat-login');
  const [kenakalanTab, setKenakalanTab] = useState<KenakalanTab>('ustaz');

  const [loading, setLoading] = useState(false);
  const [saving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resetPassId, setResetPassId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [users, setUsers] = useState<Profile[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
  const [muridList, setMuridList] = useState<any[]>([]);
  const [jamPelajaranList, setJamPelajaranList] = useState<any[]>([]);
  const [hariBelajarList, setHariBelajarList] = useState<any[]>([]);

  const [userForm, setUserForm] = useState({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', role: 'ustaz' as UserRole, is_active: true });
  const [tahunForm, setTahunForm] = useState({ nama: '', aktif: false });
  const [semesterForm, setSemesterForm] = useState({ nama: '', aktif: false });
  const [kelasForm, setKelasForm] = useState({ nama_kelas: '', tingkat: '1', kode: '' });
  const [mapelForm, setMapelForm] = useState({ nama_mapel: '', kelompok: 'Diniyah' as KelompokMapel, kode: '' });
  const [ruanganForm, setRuanganForm] = useState({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '' });
  const [lembagaForm, setLembagaForm] = useState({ nama_lembaga: '', alamat: '', telepon: '' });
  const [muridForm, setMuridForm] = useState({ nis: '', nama: '', jenis_kelamin: '', kelas_id: '', nama_wali: '', no_hp_wali: '', status: 'Aktif' });
  const [jamPelajaranForm, setJamPelajaranForm] = useState({ nama_jam: '', jam_mulai: '', jam_selesai: '', urutan: '' });
  const [hariBelajarForm, setHariBelajarForm] = useState({ nama_hari: '', urutan: '' });

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (allSections.includes(hashParts[1] as AdminSection)) {
        setSection(hashParts[1] as AdminSection);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSectionChange = (newSection: AdminSection) => {
    setSection(newSection);
    window.history.pushState(null, '', `#admin/${newSection}`);
  };

  useEffect(() => { if (isAdmin) fetchMasterData(); }, [isAdmin]);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [usersRes, tahunRes, semesterRes, kelasRes, mapelRes, ruanganRes, muridRes, jamPelRes, hariBelajarRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('tahun_ajaran').select('*').order('nama'),
        supabase.from('semester').select('*').order('nama'),
        supabase.from('kelas').select('*').eq('is_active', true).order('nama_kelas'),
        supabase.from('mata_pelajaran').select('*').eq('is_active', true).order('nama_mapel'),
        supabase.from('ruangan').select('*').eq('is_active', true).order('nama_ruangan'),
        supabase.from('murid').select('*').order('nama'),
        supabase.from('jam_pelajaran').select('*').order('urutan'),
        supabase.from('hari_belajar').select('*').order('urutan'),
      ]);
      if (usersRes.data) setUsers(usersRes.data as Profile[]);
      if (tahunRes.data) setTahunList(tahunRes.data as TahunAjaran[]);
      if (semesterRes.data) setSemesterList(semesterRes.data as Semester[]);
      if (kelasRes.data) setKelasList(kelasRes.data);
      if (mapelRes.data) setMapelList(mapelRes.data as MataPelajaran[]);
      if (ruanganRes.data) setRuanganList(ruanganRes.data as Ruangan[]);
      if (muridRes.data) setMuridList(muridRes.data);
      if (jamPelRes.data) setJamPelajaranList(jamPelRes.data);
      if (hariBelajarRes.data) setHariBelajarList(hariBelajarRes.data);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => { setSearch(''); setPage(1); }, [kelolaUserTab, section]);

  const isAdminSection = section !== 'dashboard';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Akses ditolak</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {isAdminSection && (
        <button onClick={() => handleSectionChange('dashboard')} className="mb-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </button>
      )}

      {section === 'dashboard' && <AdminDashboard onViewChange={handleSectionChange} profile={profile} />}
      {section === 'kelola-user' && <KelolaUserSection kelolaUserTab={kelolaUserTab} setKelolaUserTab={setKelolaUserTab} showToast={showToast} profile={profile} users={users} loading={loading} showModal={showModal} setShowModal={setShowModal} editingId={editingId} setEditingId={setEditingId} search={search} setSearch={setSearch} page={page} setPage={setPage} userForm={userForm} setUserForm={setUserForm} resetPassId={resetPassId} setResetPassId={setResetPassId} newPassword={newPassword} setNewPassword={setNewPassword} isResetting={isResetting} setIsResetting={setIsResetting} fetchMasterData={fetchMasterData} />}
      {section === 'data-master' && <DataMasterSection dataMasterTab={dataMasterTab} setDataMasterTab={setDataMasterTab} showToast={showToast} profile={profile} users={users} tahunList={tahunList} semesterList={semesterList} kelasList={kelasList} mapelList={mapelList} ruanganList={ruanganList} muridList={muridList} jamPelajaranList={jamPelajaranList} hariBelajarList={hariBelajarList} loading={loading} showModal={showModal} setShowModal={setShowModal} editingId={editingId} setEditingId={setEditingId} search={search} setSearch={setSearch} page={page} setPage={setPage} tahunForm={tahunForm} setTahunForm={setTahunForm} semesterForm={semesterForm} setSemesterForm={setSemesterForm} kelasForm={kelasForm} setKelasForm={setKelasForm} mapelForm={mapelForm} setMapelForm={setMapelForm} ruanganForm={ruanganForm} setRuanganForm={setRuanganForm} lembagaForm={lembagaForm} setLembagaForm={setLembagaForm} muridForm={muridForm} setMuridForm={setMuridForm} jamPelajaranForm={jamPelajaranForm} setJamPelajaranForm={setJamPelajaranForm} hariBelajarForm={hariBelajarForm} setHariBelajarForm={setHariBelajarForm} fetchMasterData={fetchMasterData} />}
      {section === 'jadwal' && <JadwalSection jadwalTab={jadwalTab} setJadwalTab={setJadwalTab} showToast={showToast} profile={profile} />}
      {section === 'akademik' && <AkademikSection akademikTab={akademikTab} setAkademikTab={setAkademikTab} showToast={showToast} profile={profile} />}
      {section === 'presensi' && <PresensiSection presensiTab={presensiTab} setPresensiTab={setPresensiTab} presensiUstazSubTab={presensiUstazSubTab} setPresensiUstazSubTab={setPresensiUstazSubTab} showToast={showToast} />}
      {section === 'penilaian' && <PenilaianSection penilaianTab={penilaianTab} setPenilaianTab={setPenilaianTab} showToast={showToast} profile={profile} />}
      {section === 'pengumuman' && <PengumumanSection pengumumanTab={pengumumanTab} setPengumumanTab={setPengumumanTab} showToast={showToast} />}
      {section === 'laporan' && <LaporanSection laporanTab={laporanTab} setLaporanTab={setLaporanTab} showToast={showToast} />}
      {section === 'statistik' && <StatistikSection statistikTab={statistikTab} setStatistikTab={setStatistikTab} showToast={showToast} />}
      {section === 'pengaturan' && <PengaturanSection pengaturanTab={pengaturanTab} setPengaturanTab={setPengaturanTab} showToast={showToast} profile={profile} />}
      {section === 'audit' && <AuditSection auditTab={auditTab} setAuditTab={setAuditTab} showToast={showToast} />}
    </div>
  );
}

// ================== PRESENSI SECTION ==================
function PresensiSection({ presensiTab, setPresensiTab, presensiUstazSubTab, setPresensiUstazSubTab, showToast }: { presensiTab: PresensiTab; setPresensiTab: (tab: PresensiTab) => void; presensiUstazSubTab: PresensiUstazSubTab; setPresensiUstazSubTab: (tab: PresensiUstazSubTab) => void; showToast: ShowToast }) {
  const [muridByKelas, setMuridByKelas] = useState<PresensiMuridByKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLembagaId, setFilterLembagaId] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const { data: lembagaList } = useLembaga();

  useEffect(() => { if (presensiTab === 'murid') fetchMuridByKelas(); }, [presensiTab, filterLembagaId, filterKelas]);

  const fetchMuridByKelas = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let muridQuery = supabase.from('murid').select('id, nama, kelas, lembaga_id, status_aktif').eq('status_aktif', true);
      if (filterLembagaId) muridQuery = muridQuery.eq('lembaga_id', filterLembagaId);
      if (filterKelas) muridQuery = muridQuery.eq('kelas', filterKelas);
      const { data: muridData } = await muridQuery.order('kelas').order('nama');

      if (!muridData || muridData.length === 0) {
        setMuridByKelas([]);
        setKelasOptions([]);
        setLoading(false);
        return;
      }

      const kelasSet = [...new Set(muridData.map(m => m.kelas).filter(Boolean))].sort();
      setKelasOptions(kelasSet);

      const muridIds = muridData.map(m => m.id);
      const { data: absensiData } = await supabase.from('absensi').select('murid_id, status').eq('tanggal', today).in('murid_id', muridIds);
      const absensiMap = new Map((absensiData || []).map(a => [a.murid_id, a.status]));

      const byKelas: Record<string, { hadir: number; izin: number; sakit: number; alfa: number; total: number }> = {};
      muridData.forEach(m => {
        const k = m.kelas || 'Tanpa Kelas';
        if (!byKelas[k]) byKelas[k] = { hadir: 0, izin: 0, sakit: 0, alfa: 0, total: 0 };
        byKelas[k].total++;
        const status = absensiMap.get(m.id);
        if (status === 'Hadir') byKelas[k].hadir++;
        else if (status === 'Izin') byKelas[k].izin++;
        else if (status === 'Sakit') byKelas[k].sakit++;
        else if (status === 'Alpha' || status === 'Alfa') byKelas[k].alfa++;
      });

      const result: PresensiMuridByKelas[] = Object.entries(byKelas).map(([namaKelas, s]) => ({
        kelas_id: namaKelas,
        nama_kelas: namaKelas,
        hadir: s.hadir,
        izin: s.izin,
        sakit: s.sakit,
        alfa: s.alfa,
        total_murid: s.total,
        persentase: s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0,
      }));
      setMuridByKelas(result);
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const lembagaOptions = useMemo(() => (lembagaList || []).map((l: Lembaga) => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Presensi</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pantau kehadiran ustaz dan murid</p>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {([
          { id: 'ustaz', label: 'Presensi Ustaz', icon: Users },
          { id: 'murid', label: 'Presensi Murid', icon: GraduationCap },
          { id: 'guru-pengganti', label: 'Guru Pengganti', icon: UsersRound },
          { id: 'rekap-harian', label: 'Rekap Harian', icon: FileText },
          { id: 'rekap-bulanan', label: 'Rekap Bulanan', icon: Calendar },
          { id: 'rekap-semester', label: 'Rekap Semester', icon: BookOpen },
        ] as const).map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setPresensiTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${presensiTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {presensiTab === 'ustaz' && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setPresensiUstazSubTab('presensi-ustaz')} className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${presensiUstazSubTab === 'presensi-ustaz' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            <CheckCircle className="w-3.5 h-3.5" /> Presensi Ustaz
          </button>
          <button onClick={() => setPresensiUstazSubTab('jadwal-ustaz')} className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${presensiUstazSubTab === 'jadwal-ustaz' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            <Calendar className="w-3.5 h-3.5" /> Jadwal Hari Ini
          </button>
        </div>
      )}

      {presensiTab === 'murid' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Lembaga</label>
            <SearchableSelect
              value={filterLembagaId}
              onChange={v => { setFilterLembagaId(v); setFilterKelas(''); }}
              options={lembagaOptions}
              placeholder="Semua Lembaga"
              icon={<Building2 className="w-3.5 h-3.5" />}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">Kelas</label>
            <SearchableSelect
              value={filterKelas}
              onChange={v => setFilterKelas(v)}
              options={kelasOptions.map(k => ({ value: k, label: k }))}
              placeholder="Semua Kelas"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : presensiTab === 'ustaz' ? (
        presensiUstazSubTab === 'presensi-ustaz' ? (
          <PresensiUstazDetailSubTab showToast={showToast} />
        ) : (
          <JadwalUstazHariIniSubTab showToast={showToast} />
        )
      ) : presensiTab === 'guru-pengganti' ? (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <UsersRound className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Guru Pengganti</h3>
          </div>
          <EmptyState title="Belum ada data guru pengganti" icon={<UsersRound className="w-8 h-8 text-slate-300" />} />
        </div>
      ) : presensiTab === 'rekap-harian' || presensiTab === 'rekap-bulanan' || presensiTab === 'rekap-semester' ? (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {presensiTab === 'rekap-harian' ? 'Rekap Harian' : presensiTab === 'rekap-bulanan' ? 'Rekap Bulanan' : 'Rekap Semester'}
            </h3>
          </div>
          <div className="flex gap-2 mb-4">
            <button onClick={() => showToast('Ekspor PDF akan segera tersedia', 'info')} className="btn-secondary flex items-center gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Ekspor PDF</button>
            <button onClick={() => showToast('Ekspor Excel akan segera tersedia', 'info')} className="btn-secondary flex items-center gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Ekspor Excel</button>
          </div>
          <EmptyState title="Pilih periode untuk melihat rekap" icon={<FileText className="w-8 h-8 text-slate-300" />} />
        </div>
      ) : muridByKelas.length === 0 ? (
        <EmptyState title="Tidak ada data presensi" icon={<GraduationCap className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {muridByKelas.map(kelas => (
            <div key={kelas.kelas_id} className="card p-3 w-full text-left hover:shadow-sm transition-all flex items-center gap-3">
              <div className="w-9 h-9 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                <span className="text-[10px] font-bold text-sky-600">{kelas.nama_kelas}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{kelas.nama_kelas}</p>
                <div className="flex gap-2 text-[9px] text-slate-500">
                  <span className="text-emerald-600">{kelas.hadir} H</span>
                  <span className="text-amber-600">{kelas.sakit} S</span>
                  <span>{kelas.izin} I</span>
                  <span className="text-rose-600">{kelas.alfa} A</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{kelas.persentase}%</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ----- Presensi Ustaz Detail Sub-tab (4 expandable summary cards) -----
type UstazDetailRow = {
  guru_id: string;
  nama_lengkap: string;
  nama_panggilan: string;
  foto?: string;
  jam_presensi?: string;
  status: 'Hadir' | 'Terlambat' | 'Belum Presensi' | 'Izin';
  kelas?: string;
  lembaga?: string;
  lokasi?: string;
  foto_presensi?: string;
  telat_menit?: number;
};

function PresensiUstazDetailSubTab({ showToast }: { showToast: ShowToast }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UstazDetailRow[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      // 1. profiles (ustaz/operator)
      const { data: profiles } = await supabase
        .from('profiles').select('id, nama_lengkap, nama_panggilan, foto')
        .in('role', ['ustaz', 'operator']).eq('is_active', true).order('nama_lengkap');

      // 2. presensi_guru for today (joined with profiles via user_id)
      const { data: presensiGuru } = await supabase
        .from('presensi_guru')
        .select('id, user_id, tanggal, jam_masuk, lokasi, foto_url, telat_menit, lembaga_id')
        .eq('tanggal', today);

      // 3. jadwal_mengajar for today (who should have presensi)
      const { data: jadwalToday } = await supabase
        .from('jadwal_mengajar')
        .select('id, user_id, kelas, pelajaran, jam_mulai, jam_selesai, lembaga_id, guru_pengganti_id')
        .eq('hari', dayName);

      // 4. izin_mengajar for today
      const { data: izinToday } = await supabase
        .from('izin_mengajar')
        .select('id, user_id, nama_ustaz, jenis_izin, tanggal_mulai, tanggal_selesai, status, kelas, mata_pelajaran, guru_pengganti')
        .eq('status', 'disetujui')
        .lte('tanggal_mulai', today)
        .gte('tanggal_selesai', today);

      // 5. lembaga names
      const { data: lembagaData } = await supabase.from('lembaga').select('id, nama_lembaga');
      const lembagaMap = new Map((lembagaData || []).map((l: any) => [l.id, l.nama_lembaga]));

      // Build maps
      const presensiMap = new Map((presensiGuru || []).map(p => [p.user_id, p]));
      const izinMap = new Map((izinToday || []).map(i => [i.user_id, i]));
      const jadwalByUser = new Map<string, any[]>();
      (jadwalToday || []).forEach(j => {
        const arr = jadwalByUser.get(j.user_id) || [];
        arr.push(j);
        jadwalByUser.set(j.user_id, arr);
      });

      // For each profile, determine status
      const detailRows: UstazDetailRow[] = (profiles || []).map(p => {
        const pres = presensiMap.get(p.id);
        const izin = izinMap.get(p.id);
        const jadwalList = jadwalByUser.get(p.id) || [];
        const firstJadwal = jadwalList[0];

        let status: UstazDetailRow['status'] = 'Belum Presensi';
        let jam_presensi: string | undefined;
        let telat_menit: number | undefined;

        if (izin) {
          status = 'Izin';
        } else if (pres) {
          jam_presensi = pres.jam_masuk || undefined;
          // Determine Hadir vs Terlambat: compare presensi jam_masuk with jadwal jam_mulai (within 10 min = Hadir)
          if (firstJadwal?.jam_mulai && pres.jam_masuk) {
            const [jh, jm] = firstJadwal.jam_mulai.split(':').map(Number);
            const [ph, pm] = pres.jam_masuk.split(':').map(Number);
            const jadwalMin = jh * 60 + jm;
            const presensiMin = ph * 60 + pm;
            const diff = presensiMin - jadwalMin;
            telat_menit = diff > 0 ? diff : 0;
            status = diff > 10 ? 'Terlambat' : 'Hadir';
          } else {
            // No jadwal to compare; use telat_menit from DB if present
            if (pres.telat_menit && pres.telat_menit > 10) {
              status = 'Terlambat';
              telat_menit = pres.telat_menit;
            } else {
              status = 'Hadir';
            }
          }
        } else if (jadwalList.length > 0) {
          status = 'Belum Presensi';
        } else {
          // No jadwal, no presensi, no izin -> skip (not expected today)
          return null;
        }

        return {
          guru_id: p.id,
          nama_lengkap: p.nama_lengkap || '-',
          nama_panggilan: p.nama_panggilan || '',
          foto: p.foto || '',
          jam_presensi,
          status,
          kelas: firstJadwal?.kelas || (izin?.kelas) || '-',
          lembaga: firstJadwal?.lembaga_id ? (lembagaMap.get(firstJadwal.lembaga_id) || '-') : (pres?.lembaga_id ? (lembagaMap.get(pres.lembaga_id) || '-') : '-'),
          lokasi: pres?.lokasi || '',
          foto_presensi: pres?.foto_url || '',
          telat_menit,
        };
      }).filter(Boolean) as UstazDetailRow[];

      setRows(detailRows);
    } catch (err: any) {
      showToast('Gagal memuat detail presensi: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'Hadir', label: 'Hadir', color: 'emerald', icon: CheckCircle },
    { key: 'Terlambat', label: 'Terlambat', color: 'amber', icon: Clock },
    { key: 'Belum Presensi', label: 'Belum Presensi', color: 'rose', icon: UserX },
    { key: 'Izin', label: 'Izin', color: 'sky', icon: FileText },
  ] as const;

  const getCount = (key: string) => rows.filter(r => r.status === key).length;

  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {categories.map(cat => {
          const count = getCount(cat.key);
          const list = rows.filter(r => r.status === cat.key);
          const isOpen = !!expanded[cat.key];
          const Icon = cat.icon;
          const colorClasses: Record<string, string> = {
            emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
            amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
            rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
            sky: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
          };
          const iconClasses: Record<string, string> = {
            emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
            amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
            rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
            sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
          };
          return (
            <div key={cat.key} className={`card p-0 overflow-hidden border ${colorClasses[cat.color]}`}>
              <button onClick={() => toggle(cat.key)} className="w-full p-2.5 flex items-center gap-2 text-left">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconClasses[cat.color]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{cat.label}</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{count}</p>
                </div>
                {count > 0 && (
                  isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              {isOpen && count > 0 && (
                <div className="px-2 pb-2 space-y-1">
                  {list.map(r => <UstazDetailRowCard key={r.guru_id} row={r} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UstazDetailRowCard({ row }: { row: UstazDetailRow }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {row.foto_presensi ? (
            <img src={row.foto_presensi} alt={row.nama_lengkap} className="w-full h-full object-cover" />
          ) : row.foto ? (
            <img src={row.foto} alt={row.nama_lengkap} className="w-full h-full object-cover" />
          ) : (
            <User className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{row.nama_lengkap}</p>
          <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
            {row.jam_presensi && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{row.jam_presensi.slice(0, 5)}</span>}
            <span>•</span>
            <span>{row.kelas}</span>
            <span>•</span>
            <span className="truncate">{row.lembaga}</span>
          </div>
          {row.lokasi && (
            <div className="flex items-center gap-0.5 text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />
              <span className="truncate">{row.lokasi}</span>
            </div>
          )}
          {row.telat_menit && row.telat_menit > 0 && (
            <span className="text-[9px] text-amber-600 dark:text-amber-400">Terlambat {row.telat_menit} menit</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ----- Jadwal Ustaz Hari Ini Sub-tab -----
type JadwalUstazRow = {
  id: string;
  user_id: string;
  nama_ustaz: string;
  kelas: string;
  pelajaran: string;
  jam_mulai: string;
  jam_selesai?: string;
  ruangan?: string;
  lembaga?: string;
  guru_pengganti_id?: string;
  nama_pengganti?: string;
  is_izin: boolean;
  status: 'Mengajar' | 'Izin' | 'Belum Presensi';
};

function JadwalUstazHariIniSubTab({ showToast }: { showToast: ShowToast }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<JadwalUstazRow[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      const { data: jadwal } = await supabase
        .from('jadwal_mengajar')
        .select('id, user_id, kelas, pelajaran, jam_mulai, jam_selesai, ruangan, lembaga_id, guru_pengganti_id')
        .eq('hari', dayName)
        .order('jam_mulai');

      if (!jadwal || jadwal.length === 0) {
        setRows([]);
        setLoading(false);
        return;
      }

      const userIds = [...new Set(jadwal.map(j => j.user_id).filter(Boolean))];
      const penggantiIds = [...new Set(jadwal.map(j => j.guru_pengganti_id).filter(Boolean))];
      const lembagaIds = [...new Set(jadwal.map(j => j.lembaga_id).filter(Boolean))];

      const [profilesRes, penggantiRes, lembagaRes, presensiRes, izinRes] = await Promise.all([
        supabase.from('profiles').select('id, nama_lengkap').in('id', userIds),
        penggantiIds.length > 0
          ? supabase.from('profiles').select('id, nama_lengkap').in('id', penggantiIds)
          : Promise.resolve({ data: [], error: null }),
        lembagaIds.length > 0
          ? supabase.from('lembaga').select('id, nama_lembaga').in('id', lembagaIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from('presensi_guru').select('user_id, jam_masuk, telat_menit').eq('tanggal', today),
        supabase.from('izin_mengajar')
          .select('user_id, status, tanggal_mulai, tanggal_selesai')
          .eq('status', 'disetujui')
          .lte('tanggal_mulai', today)
          .gte('tanggal_selesai', today),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.nama_lengkap]));
      const penggantiMap = new Map((penggantiRes.data || []).map(p => [p.id, p.nama_lengkap]));
      const lembagaMap = new Map((lembagaRes.data || []).map((l: any) => [l.id, l.nama_lembaga]));
      const presensiSet = new Set((presensiRes.data || []).map(p => p.user_id));
      const izinSet = new Set((izinRes.data || []).map(i => i.user_id));

      const result: JadwalUstazRow[] = jadwal.map(j => {
        const isIzin = izinSet.has(j.user_id);
        const hasPresensi = presensiSet.has(j.user_id);
        let status: JadwalUstazRow['status'] = 'Belum Presensi';
        if (isIzin) status = 'Izin';
        else if (hasPresensi) status = 'Mengajar';
        return {
          id: j.id,
          user_id: j.user_id,
          nama_ustaz: profileMap.get(j.user_id) || '-',
          kelas: j.kelas || '-',
          pelajaran: j.pelajaran || '-',
          jam_mulai: j.jam_mulai || '-',
          jam_selesai: j.jam_selesai,
          ruangan: j.ruangan,
          lembaga: j.lembaga_id ? (lembagaMap.get(j.lembaga_id) || '-') : '-',
          guru_pengganti_id: j.guru_pengganti_id || undefined,
          nama_pengganti: j.guru_pengganti_id ? (penggantiMap.get(j.guru_pengganti_id) || '-') : undefined,
          is_izin: isIzin,
          status,
        };
      });

      setRows(result);
    } catch (err: any) {
      showToast('Gagal memuat jadwal ustaz: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (rows.length === 0) {
    return (
      <div className="card p-4 text-center">
        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-medium text-slate-800 dark:text-slate-100">Tidak ada jadwal mengajar hari ini</p>
      </div>
    );
  }

  const statusBadge = (status: JadwalUstazRow['status']) => {
    if (status === 'Mengajar') return 'badge-success';
    if (status === 'Izin') return 'badge-warning';
    return 'badge-info';
  };

  return (
    <div className="space-y-1">
      {rows.map(r => (
        <div key={r.id} className="card p-2.5">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{r.nama_ustaz}</p>
              <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">{r.pelajaran}</span>
                <span>•</span>
                <span>{r.kelas}</span>
                {r.lembaga && r.lembaga !== '-' && (<><span>•</span><span className="truncate">{r.lembaga}</span></>)}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                <Clock className="w-2.5 h-2.5" />
                <span>{r.jam_mulai.slice(0, 5)}{r.jam_selesai ? ` - ${r.jam_selesai.slice(0, 5)}` : ''}</span>
                {r.ruangan && (<><span>•</span><span>{r.ruangan}</span></>)}
              </div>
              {r.nama_pengganti && (
                <div className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 mt-0.5">
                  <User className="w-2.5 h-2.5" />
                  <span>Pengganti: {r.nama_pengganti}</span>
                </div>
              )}
            </div>
            <span className={`badge text-[9px] ${statusBadge(r.status)}`}>{r.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// (legacy UstazPresensiCard removed — detail view now uses UstazDetailRowCard)

// ================== KELOLA USER SECTION ==================
function KelolaUserSection({ kelolaUserTab, setKelolaUserTab, showToast, users, loading, showModal, setShowModal, editingId, setEditingId, search, setSearch, page, setPage, userForm, setUserForm, resetPassId, setResetPassId, newPassword, setNewPassword, isResetting, setIsResetting, fetchMasterData }: any) {
  const tabs = [
    { id: 'admin' as KelolaUserTab, label: 'Data Admin', icon: Shield, color: 'violet' },
    { id: 'ustaz' as KelolaUserTab, label: 'Data Ustaz', icon: Users, color: 'emerald' },
    { id: 'operator' as KelolaUserTab, label: 'Operator', icon: Settings, color: 'sky' },
    { id: 'reset-password' as KelolaUserTab, label: 'Reset Password', icon: KeyRound, color: 'amber' },
    { id: 'hak-akses' as KelolaUserTab, label: 'Hak Akses', icon: Lock, color: 'rose' },
    { id: 'riwayat-login' as KelolaUserTab, label: 'Riwayat Login', icon: History, color: 'slate' },
  ];

  const filteredUsers = useMemo(() => {
    let l = users || [];
    if (kelolaUserTab === 'admin') l = l.filter((u: any) => u.role === 'admin');
    else if (kelolaUserTab === 'ustaz') l = l.filter((u: any) => u.role === 'ustaz');
    else if (kelolaUserTab === 'operator') l = l.filter((u: any) => u.role === 'operator');
    else l = users || [];
    if (search) {
      const q = search.toLowerCase();
      l = l.filter((u: any) => [u.nama_lengkap, u.nama_panggilan, u.nomor_whatsapp].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return l;
  }, [users, kelolaUserTab, search]);

  const showUserList = ['admin', 'ustaz', 'operator'].includes(kelolaUserTab);

  return (
    <div className="space-y-3">
      <SectionHeader title="Kelola User" subtitle="Mengelola akun pengguna sistem" />

      <div className="grid grid-cols-3 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setKelolaUserTab(t.id)} className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all border ${kelolaUserTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {showUserList && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="input-field text-xs pl-8" />
            </div>
            <button onClick={() => { setEditingId(null); setUserForm({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', role: kelolaUserTab === 'admin' ? 'admin' : kelolaUserTab === 'operator' ? 'operator' : 'ustaz', is_active: true }); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
              <Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span>
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <EmptyState title="Tidak ada data" icon={<Users className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-1">
              {filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any) => (
                <div key={item.id} className="card p-2.5 flex items-center gap-2.5 group">
                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{item.nama_lengkap || item.nama_panggilan || '-'}</p>
                    <div className="flex items-center gap-1.5">
                      {item.nomor_whatsapp && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{item.nomor_whatsapp}</span>}
                      {item.is_active === false && <span className="badge badge-danger text-[9px]">Nonaktif</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => { setResetPassId(item.id); setNewPassword(''); }} className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600" title="Reset Password"><KeyRound className="w-3 h-3" /></button>
                    <button onClick={() => { setEditingId(item.id); setUserForm({ nama_lengkap: item.nama_lengkap || '', nama_panggilan: item.nama_panggilan || '', nomor_whatsapp: item.nomor_whatsapp || '', password: '', role: item.role || 'ustaz', is_active: item.is_active ?? true }); setShowModal(true); }} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                    <button onClick={async () => { if (!confirm('Yakin ingin menghapus?')) return; const { error } = await supabase.from('profiles').delete().eq('id', item.id); if (error) showToast('Gagal: ' + error.message, 'error'); else { showToast('Berhasil dihapus', 'success'); fetchMasterData(); } }} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
              <Pagination currentPage={page} totalPages={Math.ceil(filteredUsers.length / PAGE_SIZE)} onPageChange={setPage} />
            </div>
          )}

          {/* Add/Edit User Modal */}
          {showModal && (
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? 'Edit User' : 'Tambah User'}>
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (editingId) {
                  const { error } = await supabase.from('profiles').update({ nama_lengkap: userForm.nama_lengkap, nama_panggilan: userForm.nama_panggilan, nomor_whatsapp: userForm.nomor_whatsapp, role: userForm.role, is_active: userForm.is_active }).eq('id', editingId);
                  if (error) { showToast('Gagal: ' + error.message, 'error'); return; }
                  showToast('Berhasil diperbarui', 'success');
                } else {
                  if (userForm.password.length < 6) { showToast('Password min. 6 karakter', 'error'); return; }
                  try {
                    const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email: userForm.nomor_whatsapp ? `${userForm.nomor_whatsapp}@simkbm.id` : `user${Date.now()}@simkbm.id`, password: userForm.password, user_metadata: { nama_lengkap: userForm.nama_lengkap, role: userForm.role } });
                    if (authError) { showToast('Gagal: ' + authError.message, 'error'); return; }
                    if (authData.user) {
                      const { error: profileError } = await supabase.from('profiles').upsert({ id: authData.user.id, nama_lengkap: userForm.nama_lengkap, nama_panggilan: userForm.nama_panggilan, nomor_whatsapp: userForm.nomor_whatsapp, role: userForm.role, is_active: userForm.is_active });
                      if (profileError) showToast('Profile sync warning: ' + profileError.message, 'error');
                    }
                    showToast('User berhasil ditambahkan', 'success');
                  } catch (err: any) { showToast('Gagal: ' + (err.message || 'Unknown'), 'error'); return; }
                }
                setShowModal(false); setEditingId(null); fetchMasterData();
              }} className="space-y-3">
                <div>
                  <label className="input-label">Nama Lengkap</label>
                  <input className="input-field" value={userForm.nama_lengkap} onChange={e => setUserForm((p: any) => ({ ...p, nama_lengkap: e.target.value }))} required />
                </div>
                <div>
                  <label className="input-label">Nama Panggilan</label>
                  <input className="input-field" value={userForm.nama_panggilan} onChange={e => setUserForm((p: any) => ({ ...p, nama_panggilan: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">No. WhatsApp</label>
                  <input className="input-field" value={userForm.nomor_whatsapp} onChange={e => setUserForm((p: any) => ({ ...p, nomor_whatsapp: e.target.value }))} placeholder="628xxx" />
                </div>
                <div>
                  <label className="input-label">Role</label>
                  <select className="input-field" value={userForm.role} onChange={e => setUserForm((p: any) => ({ ...p, role: e.target.value }))}>
                    <option value="ustaz">Ustaz</option>
                    <option value="admin">Admin</option>
                    <option value="operator">Operator</option>
                  </select>
                </div>
                {!editingId && (
                  <div>
                    <label className="input-label">Password</label>
                    <input type="password" className="input-field" value={userForm.password} onChange={e => setUserForm((p: any) => ({ ...p, password: e.target.value }))} required={!editingId} placeholder="Min. 6 karakter" minLength={6} />
                  </div>
                )}
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={userForm.is_active} onChange={e => setUserForm((p: any) => ({ ...p, is_active: e.target.checked }))} />
                  Akun Aktif
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="btn-secondary">Batal</button>
                  <button type="submit" className="btn-primary">{editingId ? 'Simpan' : 'Tambah'}</button>
                </div>
              </form>
            </Modal>
          )}
        </>
      )}

      {kelolaUserTab === 'reset-password' && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Reset Password User</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">Pilih user dari daftar untuk reset password:</p>
          <div className="space-y-1">
            {(users || []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">{u.nama_lengkap || u.nama_panggilan}</span>
                <span className="badge badge-info text-[9px]">{u.role}</span>
                <button onClick={() => { setResetPassId(u.id); setNewPassword(''); }} className="btn-secondary text-[10px] py-1 px-2">Reset</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {kelolaUserTab === 'hak-akses' && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lock className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Hak Akses Pengguna</h3>
          </div>
          <div className="space-y-2">
            {[
              { role: 'admin', label: 'Admin', desc: 'Akses penuh ke semua menu' },
              { role: 'ustaz', label: 'Ustaz', desc: 'Akses dashboard, presensi, jurnal, nilai' },
              { role: 'operator', label: 'Operator', desc: 'Akses data master dan presensi' },
            ].map(r => (
              <div key={r.role} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.label}</p>
                  <p className="text-[11px] text-slate-500">{r.desc}</p>
                </div>
                <span className="badge badge-success text-[9px]">Aktif</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {kelolaUserTab === 'riwayat-login' && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Riwayat Login</h3>
          </div>
          <EmptyState title="Belum ada riwayat login" icon={<History className="w-8 h-8 text-slate-300" />} />
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPassId && (
        <Modal isOpen={!!resetPassId} onClose={() => { setResetPassId(null); setNewPassword(''); }} title="Reset Password">
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (newPassword.length < 6) { showToast('Password min. 6 karakter', 'error'); return; }
            setIsResetting(true);
            try {
              const { data, error } = await supabase.functions.invoke('reset-password', {
                body: { user_id: resetPassId, new_password: newPassword, setup_key: 'simkbm-setup-2024' },
              });
              if (error) { showToast('Gagal: ' + error.message, 'error'); return; }
              if (data?.error) { showToast('Gagal: ' + data.error, 'error'); return; }
              showToast('Password berhasil direset', 'success');
              setResetPassId(null); setNewPassword('');
            } catch (err: any) { showToast('Gagal: ' + (err.message || 'Unknown'), 'error'); }
            finally { setIsResetting(false); }
          }} className="space-y-3">
            <div>
              <label className="input-label">Password Baru</label>
              <input type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} required placeholder="Min. 6 karakter" minLength={6} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setResetPassId(null); setNewPassword(''); }} className="btn-secondary">Batal</button>
              <button type="submit" disabled={isResetting} className="btn-primary">{isResetting ? 'Memproses...' : 'Reset Password'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ================== DATA MASTER SECTION ==================
function DataMasterSection({ dataMasterTab, setDataMasterTab, showToast, profile, users, tahunList, semesterList, kelasList, mapelList, ruanganList, muridList, jamPelajaranList, hariBelajarList, loading, showModal, setShowModal, editingId, setEditingId, search, setSearch, page, setPage, tahunForm, setTahunForm, semesterForm, setSemesterForm, kelasForm, setKelasForm, mapelForm, setMapelForm, ruanganForm, setRuanganForm, lembagaForm, setLembagaForm, muridForm, setMuridForm, jamPelajaranForm, setJamPelajaranForm, hariBelajarForm, setHariBelajarForm, fetchMasterData }: any) {
  const lembaga = useLembaga();
  const lembagaItems = lembaga.data || [];
  const tabs = [
    { id: 'ustaz' as DataMasterTab, label: 'Ustaz', icon: Users, color: 'emerald' },
    { id: 'murid' as DataMasterTab, label: 'Murid', icon: GraduationCap, color: 'sky' },
    { id: 'kelas' as DataMasterTab, label: 'Kelas', icon: School, color: 'violet' },
    { id: 'lembaga' as DataMasterTab, label: 'Lembaga', icon: Building2, color: 'rose' },
    { id: 'ruang' as DataMasterTab, label: 'Ruang', icon: Building2, color: 'amber' },
    { id: 'mapel' as DataMasterTab, label: 'Mapel', icon: BookOpen, color: 'sky' },
    { id: 'tahun' as DataMasterTab, label: 'Tahun', icon: Calendar, color: 'emerald' },
    { id: 'semester' as DataMasterTab, label: 'Semester', icon: BookOpen, color: 'violet' },
    { id: 'jam-pelajaran' as DataMasterTab, label: 'Jam Pelajaran', icon: Clock, color: 'amber' },
    { id: 'hari-belajar' as DataMasterTab, label: 'Hari Belajar', icon: Calendar, color: 'rose' },
  ];

  const ustazList = (users || []).filter((u: any) => u.role === 'ustaz');

  return (
    <div className="space-y-3">
      <SectionHeader title="Data Master" subtitle="Pusat seluruh data dasar aplikasi" />

      <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setDataMasterTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${dataMasterTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {dataMasterTab === 'ustaz' && (
        <DataMasterUserList users={ustazList} search={search} setSearch={setSearch} page={page} setPage={setPage} showToast={showToast} fetchMasterData={fetchMasterData} />
      )}

      {dataMasterTab === 'murid' && (
        <SimpleCrudList
          title="Data Murid"
          items={muridList}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama"
          subFields={['nis', 'jenis_kelamin', 'nama_wali']}
          tableName="murid"
          form={muridForm}
          setForm={setMuridForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nis', label: 'NIS', placeholder: '12345' },
            { key: 'nama', label: 'Nama Murid', required: true, placeholder: 'Ahmad' },
            { key: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', options: ['L', 'P'] },
            { key: 'kelas_id', label: 'Kelas', type: 'select', options: kelasList.map((k: any) => ({ value: k.id, label: k.nama_kelas })) },
            { key: 'nama_wali', label: 'Nama Wali', placeholder: 'Bapak Ahmad' },
            { key: 'no_hp_wali', label: 'No HP Wali', placeholder: '0812...' },
            { key: 'status', label: 'Status', type: 'select', options: ['Aktif', 'Tidak Aktif'] },
          ]}
        />
      )}

      {dataMasterTab === 'kelas' && (
        <SimpleCrudList
          title="Data Kelas"
          items={kelasList}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama_kelas"
          subFields={['tingkat', 'kode']}
          tableName="kelas"
          form={kelasForm}
          setForm={setKelasForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nama_kelas', label: 'Nama Kelas', required: true, placeholder: 'VIII A' },
            { key: 'tingkat', label: 'Tingkat', placeholder: '1-6' },
            { key: 'kode', label: 'Kode', placeholder: 'VIIIA' },
          ]}
        />
      )}

      {dataMasterTab === 'lembaga' && (
        <SimpleCrudList
          title="Data Lembaga"
          items={lembagaItems}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama_lembaga"
          subFields={['alamat', 'telepon']}
          tableName="lembaga"
          form={lembagaForm}
          setForm={setLembagaForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nama_lembaga', label: 'Nama Lembaga', required: true, placeholder: 'MTS Al-Hidayah' },
            { key: 'alamat', label: 'Alamat', type: 'textarea' },
            { key: 'telepon', label: 'Telepon', placeholder: '021...' },
          ]}
        />
      )}

      {dataMasterTab === 'ruang' && (
        <SimpleCrudList
          title="Data Ruang"
          items={ruanganList}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama_ruangan"
          subFields={['kode', 'kapasitas']}
          tableName="ruangan"
          form={ruanganForm}
          setForm={setRuanganForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nama_ruangan', label: 'Nama Ruangan', required: true },
            { key: 'kode', label: 'Kode' },
            { key: 'kapasitas', label: 'Kapasitas', type: 'number' },
            { key: 'keterangan', label: 'Keterangan', type: 'textarea' },
          ]}
        />
      )}

      {dataMasterTab === 'mapel' && (
        <SimpleCrudList
          title="Mata Pelajaran"
          items={mapelList}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama_mapel"
          subFields={['kode', 'kelompok']}
          tableName="mata_pelajaran"
          form={mapelForm}
          setForm={setMapelForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nama_mapel', label: 'Nama Mata Pelajaran', required: true },
            { key: 'kelompok', label: 'Kelompok', type: 'select', options: ['Diniyah', 'Umum', 'Bahasa'] },
            { key: 'kode', label: 'Kode' },
          ]}
        />
      )}

      {dataMasterTab === 'tahun' && (
        <SimpleCrudList
          title="Tahun Ajaran"
          items={tahunList}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama"
          subFields={['aktif']}
          tableName="tahun_ajaran"
          form={tahunForm}
          setForm={setTahunForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nama', label: 'Nama Tahun Ajaran', required: true, placeholder: '2026/2027' },
            { key: 'aktif', label: 'Tahun Aktif', type: 'checkbox' },
          ]}
        />
      )}

      {dataMasterTab === 'semester' && (
        <SimpleCrudList
          title="Semester"
          items={semesterList}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama"
          subFields={['aktif']}
          tableName="semester"
          form={semesterForm}
          setForm={setSemesterForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nama', label: 'Nama Semester', required: true, placeholder: 'Ganjil / Genap' },
            { key: 'aktif', label: 'Semester Aktif', type: 'checkbox' },
          ]}
        />
      )}

      {dataMasterTab === 'jam-pelajaran' && (
        <SimpleCrudList
          title="Jam Pelajaran"
          items={jamPelajaranList}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama_jam"
          subFields={['jam_mulai', 'jam_selesai', 'urutan']}
          tableName="jam_pelajaran"
          form={jamPelajaranForm}
          setForm={setJamPelajaranForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nama_jam', label: 'Nama Jam', required: true, placeholder: 'Jam ke-1' },
            { key: 'jam_mulai', label: 'Jam Mulai', type: 'time' },
            { key: 'jam_selesai', label: 'Jam Selesai', type: 'time' },
            { key: 'urutan', label: 'Urutan', type: 'number', placeholder: '1' },
          ]}
        />
      )}

      {dataMasterTab === 'hari-belajar' && (
        <SimpleCrudList
          title="Hari Belajar"
          items={hariBelajarList}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          displayField="nama_hari"
          subFields={['urutan']}
          tableName="hari_belajar"
          form={hariBelajarForm}
          setForm={setHariBelajarForm}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          showToast={showToast}
          fetchMasterData={fetchMasterData}
          formFields={[
            { key: 'nama_hari', label: 'Nama Hari', required: true, placeholder: 'Senin' },
            { key: 'urutan', label: 'Urutan', type: 'number', placeholder: '1' },
          ]}
        />
      )}
    </div>
  );
}

// ================== HELPER: Section Header ==================
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{title}</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}

// ================== HELPER: Simple CRUD List ==================
function SimpleCrudList({ title, items, search, setSearch, page, setPage, displayField, subFields, tableName, form, setForm, showModal, setShowModal, editingId, setEditingId, showToast, fetchMasterData, formFields }: any) {
  const list = useMemo(() => {
    let l = items || [];
    if (search) {
      const q = search.toLowerCase();
      l = l.filter((item: any) => [item[displayField], ...subFields.map((f: string) => item[f])].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return l;
  }, [items, search, displayField, subFields]);

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={() => { setEditingId(null); const emptyForm: any = {}; formFields.forEach((f: any) => { emptyForm[f.key] = f.type === 'checkbox' ? false : ''; }); setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span>
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Tidak ada data" icon={<Database className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any) => (
            <div key={item.id} className="card p-2.5 flex items-center gap-2.5 group">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{item[displayField] || '-'}</p>
                <div className="flex items-center gap-1.5">
                  {subFields.map((f: string) => item[f] != null && item[f] !== '' && (
                    <span key={f} className="text-[10px] text-slate-400">{f === 'aktif' ? (item[f] ? 'Aktif' : 'Nonaktif') : item[f]}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => { setEditingId(item.id); const newForm: any = {}; formFields.forEach((f: any) => { newForm[f.key] = item[f.key] ?? (f.type === 'checkbox' ? false : ''); }); setForm(newForm); setShowModal(true); }} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                <button onClick={async () => { if (!confirm('Yakin ingin menghapus?')) return; const { error } = await supabase.from(tableName).delete().eq('id', item.id); if (error) showToast('Gagal: ' + error.message, 'error'); else { showToast('Berhasil dihapus', 'success'); fetchMasterData(); } }} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          <Pagination currentPage={page} totalPages={Math.ceil(list.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}

      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? `Edit ${title}` : `Tambah ${title}`}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const payload: any = { ...form };
            formFields.forEach((f: any) => { if (f.type === 'number' && payload[f.key]) payload[f.key] = parseInt(payload[f.key]); });
            if (editingId) {
              const { error } = await supabase.from(tableName).update(payload).eq('id', editingId);
              if (error) { showToast('Gagal: ' + error.message, 'error'); return; }
              showToast('Berhasil diperbarui', 'success');
            } else {
              const { error } = await supabase.from(tableName).insert(payload);
              if (error) { showToast('Gagal: ' + error.message, 'error'); return; }
              showToast('Berhasil ditambahkan', 'success');
            }
            setShowModal(false); setEditingId(null); fetchMasterData();
          }} className="space-y-3">
            {formFields.map((f: any) => (
              f.type === 'checkbox' ? (
                <label key={f.key} className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={form[f.key] || false} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.checked }))} />
                  {f.label}
                </label>
              ) : f.type === 'select' ? (
                <div key={f.key}>
                  <label className="input-label">{f.label}</label>
                  <select className="input-field" value={form[f.key] || ''} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))}>
                    <option value="">Pilih...</option>
                    {f.options.map((o: any) => {
                      const val = typeof o === 'string' ? o : o.value;
                      const label = typeof o === 'string' ? o : o.label;
                      return <option key={val} value={val}>{label}</option>;
                    })}
                  </select>
                </div>
              ) : f.type === 'textarea' ? (
                <div key={f.key}>
                  <label className="input-label">{f.label}</label>
                  <textarea className="input-field" value={form[f.key] || ''} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} rows={2} />
                </div>
              ) : (
                <div key={f.key}>
                  <label className="input-label">{f.label}</label>
                  <input type={f.type || 'text'} className="input-field" value={form[f.key] || ''} onChange={e => setForm((p: any) => ({ ...p, [f.key]: e.target.value }))} required={f.required} placeholder={f.placeholder} />
                </div>
              )
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }} className="btn-secondary">Batal</button>
              <button type="submit" className="btn-primary">{editingId ? 'Simpan' : 'Tambah'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ================== HELPER: Data Master User List ==================
function DataMasterUserList({ users, search, setSearch, page, setPage, showToast, fetchMasterData }: any) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', role: 'ustaz' as string, is_active: true });

  const list = useMemo(() => {
    let l = users || [];
    if (search) {
      const q = search.toLowerCase();
      l = l.filter((u: any) => [u.nama_lengkap, u.nama_panggilan, u.nomor_whatsapp].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return l;
  }, [users, search]);

  const resetForm = () => { setForm({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', role: 'ustaz', is_active: true }); setEditingId(null); };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ nama_lengkap: item.nama_lengkap || '', nama_panggilan: item.nama_panggilan || '', nomor_whatsapp: item.nomor_whatsapp || '', role: item.role || 'ustaz', is_active: item.is_active !== false });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_lengkap.trim()) { showToast('Nama lengkap wajib diisi', 'error'); return; }
    if (editingId) {
      const { error } = await supabase.from('profiles').update({ nama_lengkap: form.nama_lengkap, nama_panggilan: form.nama_panggilan, nomor_whatsapp: form.nomor_whatsapp, role: form.role, is_active: form.is_active }).eq('id', editingId);
      if (error) { showToast('Gagal: ' + error.message, 'error'); return; }
      showToast('Data ustaz berhasil diperbarui', 'success');
    } else {
      try {
        const email = form.nomor_whatsapp ? `${form.nomor_whatsapp}@simkbm.id` : `user${Date.now()}@simkbm.id`;
        const { data: funcData, error: funcError } = await supabase.functions.invoke('create-admin', {
          body: { email, password: 'password123', nama_lengkap: form.nama_lengkap, role: form.role, setup_key: 'simkbm-setup-2024' },
        });
        if (funcError) { showToast('Gagal: ' + funcError.message, 'error'); return; }
        if (funcData?.user?.id) {
          await supabase.from('profiles').update({ nama_panggilan: form.nama_panggilan, nomor_whatsapp: form.nomor_whatsapp, is_active: form.is_active }).eq('id', funcData.user.id);
        }
        showToast('Ustaz berhasil ditambahkan', 'success');
      } catch (err: any) { showToast('Gagal: ' + (err.message || 'Unknown'), 'error'); return; }
    }
    setShowModal(false); resetForm(); fetchMasterData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus ustaz ini?')) return;
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) { showToast('Gagal: ' + error.message, 'error'); return; }
    showToast('Ustaz berhasil dihapus', 'success'); fetchMasterData();
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ustaz..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary text-xs whitespace-nowrap flex items-center gap-1">
          <Plus className="w-3.5 h-3.5" />Tambah
        </button>
      </div>
      {list.length === 0 ? (
        <EmptyState title="Tidak ada data ustaz" icon={<Users className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any) => (
            <div key={item.id} className="card p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{item.nama_lengkap || item.nama_panggilan || '-'}</p>
                {item.nomor_whatsapp && <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" />{item.nomor_whatsapp}</span>}
              </div>
              {item.is_active === false && <span className="badge badge-danger text-[9px]">Nonaktif</span>}
              <div className="flex gap-1">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-500 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <Pagination currentPage={page} totalPages={Math.ceil(list.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Ustaz' : 'Tambah Ustaz'}>
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="input-label">Nama Lengkap</label>
              <input type="text" className="input-field" value={form.nama_lengkap} onChange={e => setForm((p: any) => ({ ...p, nama_lengkap: e.target.value }))} required placeholder="Ahmad Suryana" />
            </div>
            <div>
              <label className="input-label">Nama Panggilan</label>
              <input type="text" className="input-field" value={form.nama_panggilan} onChange={e => setForm((p: any) => ({ ...p, nama_panggilan: e.target.value }))} placeholder="Ahmad" />
            </div>
            <div>
              <label className="input-label">Nomor WhatsApp</label>
              <input type="text" className="input-field" value={form.nomor_whatsapp} onChange={e => setForm((p: any) => ({ ...p, nomor_whatsapp: e.target.value }))} placeholder="0812..." />
            </div>
            <div>
              <label className="input-label">Role</label>
              <select className="input-field" value={form.role} onChange={e => setForm((p: any) => ({ ...p, role: e.target.value }))}>
                <option value="ustaz">Ustaz</option>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm((p: any) => ({ ...p, is_active: e.target.checked }))} />
              <label htmlFor="is_active" className="text-xs text-slate-600 dark:text-slate-300">Aktif</label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">Batal</button>
              <button type="submit" className="btn-primary">{editingId ? 'Simpan' : 'Tambah'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

// ================== JADWAL SECTION ==================
function JadwalSection({ jadwalTab, setJadwalTab, showToast, profile }: any) {
  const tabs = [
    { id: 'mengajar' as JadwalTab, label: 'Jadwal Mengajar', icon: Calendar, color: 'emerald' },
    { id: 'ujian' as JadwalTab, label: 'Jadwal Ujian', icon: FileText, color: 'amber' },
    { id: 'kalender' as JadwalTab, label: 'Kalender Akademik', icon: BookOpen, color: 'sky' },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="Jadwal" subtitle="Mengelola seluruh jadwal sistem" />
      <div className="grid grid-cols-3 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setJadwalTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${jadwalTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      {jadwalTab === 'mengajar' && <JadwalMengajarTab showToast={showToast} profile={profile} />}
      {jadwalTab === 'ujian' && <JadwalUjianTab showToast={showToast} profile={profile} />}
      {jadwalTab === 'kalender' && <KalenderAkademikTab showToast={showToast} profile={profile} />}
    </div>
  );
}

// ================== JADWAL MENGAJAR TAB (full CRUD + Excel import/export) ==================
function JadwalMengajarTab({ showToast, profile }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const { data: lembagaList } = useLembaga();
  const [ustazOptions, setUstazOptions] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({
    user_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30',
    kelas: '', pelajaran: '', ruangan: '', lembaga_id: '', guru_pengganti_id: '', is_libur: false,
  });
  const isAdmin = profile?.role === 'admin';
  const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

  useEffect(() => { fetchList(); fetchUstaz(); }, []);

  const fetchUstaz = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, nama_lengkap').in('role', ['ustaz', 'operator']).eq('is_active', true).order('nama_lengkap');
      setUstazOptions((data || []).map((p: any) => ({ value: p.id, label: p.nama_lengkap || '-' })));
    } catch { /* silent */ }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      let q = supabase.from('jadwal_mengajar').select('*').order('jam_mulai', { ascending: true });
      if (!isAdmin) q = q.eq('user_id', profile?.id || '');
      const { data, error } = await q;
      if (error) throw error;
      setList(data || []);
    } catch (err: any) { showToast('Gagal memuat jadwal: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ user_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', kelas: '', pelajaran: '', ruangan: '', lembaga_id: '', guru_pengganti_id: '', is_libur: false });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); if (!isAdmin && profile) setForm(f => ({ ...f, user_id: profile.id })); setShowModal(true); };

  const openEdit = (j: any) => {
    setEditingId(j.id);
    setForm({ user_id: j.user_id || '', hari: j.hari || 'Senin', jam_mulai: j.jam_mulai || '07:00', jam_selesai: j.jam_selesai || '08:30', kelas: j.kelas || '', pelajaran: j.pelajaran || '', ruangan: j.ruangan || '', lembaga_id: j.lembaga_id || '', guru_pengganti_id: j.guru_pengganti_id || '', is_libur: j.is_libur ?? false });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.kelas || !form.pelajaran || !form.hari) { showToast('Ustaz, kelas, pelajaran, dan hari wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { user_id: form.user_id, hari: form.hari, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai || null, kelas: form.kelas, pelajaran: form.pelajaran, ruangan: form.ruangan || null, lembaga_id: form.lembaga_id || null, guru_pengganti_id: form.guru_pengganti_id || null, is_libur: form.is_libur };
      if (editingId) {
        const { error } = await supabase.from('jadwal_mengajar').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Jadwal diperbarui', 'success');
      } else {
        const { error } = await supabase.from('jadwal_mengajar').insert(payload);
        if (error) throw error;
        showToast('Jadwal ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (j: any) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      const { error } = await supabase.from('jadwal_mengajar').delete().eq('id', j.id);
      if (error) throw error;
      showToast('Jadwal dihapus', 'success'); fetchList();
    } catch (err: any) { showToast('Gagal menghapus: ' + (err?.message || ''), 'error'); }
  };

  const handleExportCSV = () => {
    if (list.length === 0) { showToast('Tidak ada data untuk diekspor', 'error'); return; }
    const headers = ['hari', 'jam_mulai', 'jam_selesai', 'kelas', 'pelajaran', 'ruangan', 'is_libur'];
    const rows = list.map(j => headers.map(h => j[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'jadwal_mengajar.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor', 'success');
  };

  const handleImportCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { showToast('File CSV kosong atau tidak valid', 'error'); return; }
    const headers = lines[0].split(',').map(h => h.trim());
    const required = ['hari', 'jam_mulai', 'kelas', 'pelajaran'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) { showToast(`Kolom wajib tidak ditemukan: ${missing.join(', ')}. Kolom yang dibutuhkan: hari, jam_mulai, jam_selesai, kelas, pelajaran, ruangan, is_libur`, 'error'); return; }
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = vals[i]?.trim() || null);
      obj.is_libur = obj.is_libur === 'true' || obj.is_libur === '1';
      if (profile) obj.user_id = profile.id;
      return obj;
    });
    setSaving(true);
    try {
      const { error } = await supabase.from('jadwal_mengajar').insert(rows);
      if (error) throw error;
      showToast(`${rows.length} jadwal berhasil diimpor`, 'success');
      setShowImport(false); fetchList();
    } catch (err: any) { showToast('Gagal mengimpor: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(j => [j.kelas, j.pelajaran, j.hari, j.ruangan].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [list, search]);

  const lembagaOptions = useMemo(() => (lembagaList || []).map((l: Lembaga) => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[120px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari jadwal..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span>
        </button>
        <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1.5 py-2.5 px-3">
          <Download className="w-3.5 h-3.5" /><span className="text-xs">Export</span>
        </button>
        <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-1.5 py-2.5 px-3">
          <Upload className="w-3.5 h-3.5" /><span className="text-xs">Import</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada jadwal" icon={<Calendar className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(j => {
            const ustazName = ustazOptions.find(o => o.value === j.user_id)?.label || '-';
            const lembagaName = (lembagaList || []).find((l: Lembaga) => l.id === j.lembaga_id)?.nama_lembaga;
            return (
              <div key={j.id} className="card p-2.5 flex items-center gap-2.5 group">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{j.pelajaran} - {j.kelas}</p>
                  <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                    <span className="badge badge-info text-[9px]">{j.hari}</span>
                    <span>{j.jam_mulai?.slice(0, 5)}{j.jam_selesai ? `-${j.jam_selesai.slice(0, 5)}` : ''}</span>
                    <span>•</span><span className="truncate">{ustazName}</span>
                    {lembagaName && (<><span>•</span><span className="truncate">{lembagaName}</span></>)}
                    {j.is_libur && <span className="text-rose-500">Libur</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(j)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(j)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
          <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}

      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar'}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ustaz *</label>
              <SearchableSelect value={form.user_id} onChange={v => setForm({ ...form, user_id: v })} options={ustazOptions} placeholder="Pilih ustaz" icon={<Users className="w-3.5 h-3.5" />} disabled={!isAdmin} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Hari *</label>
                <SearchableSelect value={form.hari} onChange={v => setForm({ ...form, hari: v })} options={hariOptions.map(h => ({ value: h, label: h }))} placeholder="Pilih hari" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
                <SearchableSelect value={form.lembaga_id} onChange={v => setForm({ ...form, lembaga_id: v })} options={lembagaOptions} placeholder="Pilih lembaga" icon={<Building2 className="w-3.5 h-3.5" />} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Mulai *</label><input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} className="input-field text-xs" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Selesai</label><input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} className="input-field text-xs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelas *</label><input type="text" value={form.kelas} onChange={e => setForm({ ...form, kelas: e.target.value })} className="input-field text-xs" placeholder="Kelas" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Pelajaran *</label><input type="text" value={form.pelajaran} onChange={e => setForm({ ...form, pelajaran: e.target.value })} className="input-field text-xs" placeholder="Mata pelajaran" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ruangan</label><input type="text" value={form.ruangan} onChange={e => setForm({ ...form, ruangan: e.target.value })} className="input-field text-xs" placeholder="Ruangan" /></div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Guru Pengganti</label>
              <SearchableSelect value={form.guru_pengganti_id} onChange={v => setForm({ ...form, guru_pengganti_id: v })} options={ustazOptions} placeholder="Pilih guru pengganti (opsional)" icon={<User className="w-3.5 h-3.5" />} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_libur} onChange={e => setForm({ ...form, is_libur: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">Libur</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Import Jadwal dari CSV">
          <div className="space-y-3">
            <div className="card p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Kolom yang dibutuhkan:</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400">hari, jam_mulai, jam_selesai, kelas, pelajaran, ruangan, is_libur</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Wajib: hari, jam_mulai, kelas, pelajaran. Format jam: HH:MM (contoh: 07:00)</p>
            </div>
            <input type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportCSV(f); }} className="input-field text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowImport(false)} className="btn-secondary py-2.5 px-4 text-xs">Tutup</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ================== JADWAL UJIAN TAB (CRUD for jadwal table) ==================
function JadwalUjianTab({ showToast, profile }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showImport, setShowImport] = useState(false);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [mapelList, setMapelList] = useState<any[]>([]);
  const [form, setForm] = useState({ kelas_id: '', mapel_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', ruangan: '', warna: '' });
  const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

  useEffect(() => { fetchList(); fetchOptions(); }, []);

  const fetchOptions = async () => {
    try {
      const [k, m] = await Promise.all([
        supabase.from('kelas').select('id, nama_kelas').eq('is_active', true).order('nama_kelas'),
        supabase.from('mata_pelajaran').select('id, nama_mapel').eq('is_active', true).order('nama_mapel'),
      ]);
      setKelasList(k.data || []); setMapelList(m.data || []);
    } catch { /* silent */ }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('jadwal').select('*').order('jam_mulai');
      if (error) throw error;
      setList(data || []);
    } catch (err: any) { showToast('Gagal memuat jadwal ujian: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ kelas_id: '', mapel_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', ruangan: '', warna: '' }); setEditingId(null); };

  const openEdit = (j: any) => {
    setEditingId(j.id);
    setForm({ kelas_id: j.kelas_id || '', mapel_id: j.mapel_id || '', hari: j.hari || 'Senin', jam_mulai: j.jam_mulai || '07:00', jam_selesai: j.jam_selesai || '08:30', ruangan: j.ruangan || '', warna: j.warna || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.kelas_id || !form.mapel_id || !form.hari) { showToast('Kelas, mapel, dan hari wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { kelas_id: form.kelas_id, mapel_id: form.mapel_id, hari: form.hari, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai || null, ruangan: form.ruangan || null, warna: form.warna || null, user_id: profile?.id };
      if (editingId) {
        const { error } = await supabase.from('jadwal').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Jadwal ujian diperbarui', 'success');
      } else {
        const { error } = await supabase.from('jadwal').insert(payload);
        if (error) throw error;
        showToast('Jadwal ujian ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (j: any) => {
    if (!confirm('Yakin ingin menghapus jadwal ujian ini?')) return;
    try {
      const { error } = await supabase.from('jadwal').delete().eq('id', j.id);
      if (error) throw error;
      showToast('Jadwal ujian dihapus', 'success'); fetchList();
    } catch (err: any) { showToast('Gagal menghapus: ' + (err?.message || ''), 'error'); }
  };

  const handleExportCSV = () => {
    if (list.length === 0) { showToast('Tidak ada data untuk diekspor', 'error'); return; }
    const headers = ['hari', 'jam_mulai', 'jam_selesai', 'ruangan', 'warna'];
    const rows = list.map(j => headers.map(h => j[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'jadwal_ujian.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Data berhasil diekspor', 'success');
  };

  const handleImportCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { showToast('File CSV kosong atau tidak valid', 'error'); return; }
    const headers = lines[0].split(',').map(h => h.trim());
    const required = ['hari', 'jam_mulai', 'kelas_id', 'mapel_id'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length > 0) { showToast(`Kolom wajib tidak ditemukan: ${missing.join(', ')}. Kolom yang dibutuhkan: hari, jam_mulai, jam_selesai, kelas_id, mapel_id, ruangan, warna`, 'error'); return; }
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => obj[h] = vals[i]?.trim() || null);
      if (profile) obj.user_id = profile.id;
      return obj;
    });
    setSaving(true);
    try {
      const { error } = await supabase.from('jadwal').insert(rows);
      if (error) throw error;
      showToast(`${rows.length} jadwal ujian berhasil diimpor`, 'success');
      setShowImport(false); fetchList();
    } catch (err: any) { showToast('Gagal mengimpor: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(j => {
      const kelas = kelasList.find(k => k.id === j.kelas_id)?.nama_kelas || '';
      const mapel = mapelList.find(m => m.id === j.mapel_id)?.nama_mapel || '';
      return [kelas, mapel, j.hari, j.ruangan].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [list, search, kelasList, mapelList]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[120px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari jadwal ujian..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span>
        </button>
        <button onClick={handleExportCSV} className="btn-secondary flex items-center gap-1.5 py-2.5 px-3">
          <Download className="w-3.5 h-3.5" /><span className="text-xs">Export</span>
        </button>
        <button onClick={() => setShowImport(true)} className="btn-secondary flex items-center gap-1.5 py-2.5 px-3">
          <Upload className="w-3.5 h-3.5" /><span className="text-xs">Import</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada jadwal ujian" icon={<FileText className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(j => {
            const kelas = kelasList.find(k => k.id === j.kelas_id)?.nama_kelas || '-';
            const mapel = mapelList.find(m => m.id === j.mapel_id)?.nama_mapel || '-';
            return (
              <div key={j.id} className="card p-2.5 flex items-center gap-2.5 group">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{mapel} - {kelas}</p>
                  <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                    <span className="badge badge-info text-[9px]">{j.hari}</span>
                    <span>{j.jam_mulai?.slice(0, 5)}{j.jam_selesai ? `-${j.jam_selesai.slice(0, 5)}` : ''}</span>
                    {j.ruangan && <><span>•</span><span>{j.ruangan}</span></>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(j)} className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(j)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
          <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}

      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Jadwal Ujian' : 'Tambah Jadwal Ujian'}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelas *</label>
                <select className="input-field text-xs" value={form.kelas_id} onChange={e => setForm({ ...form, kelas_id: e.target.value })}>
                  <option value="">Pilih kelas...</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Mata Pelajaran *</label>
                <select className="input-field text-xs" value={form.mapel_id} onChange={e => setForm({ ...form, mapel_id: e.target.value })}>
                  <option value="">Pilih mapel...</option>
                  {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Hari *</label>
              <select className="input-field text-xs" value={form.hari} onChange={e => setForm({ ...form, hari: e.target.value })}>
                {hariOptions.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Mulai *</label><input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} className="input-field text-xs" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Selesai</label><input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} className="input-field text-xs" /></div>
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ruangan</label><input type="text" value={form.ruangan} onChange={e => setForm({ ...form, ruangan: e.target.value })} className="input-field text-xs" placeholder="Ruangan" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Warna (opsional)</label><input type="text" value={form.warna} onChange={e => setForm({ ...form, warna: e.target.value })} className="input-field text-xs" placeholder="#3b82f6" /></div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showImport && (
        <Modal isOpen={showImport} onClose={() => setShowImport(false)} title="Import Jadwal Ujian dari CSV">
          <div className="space-y-3">
            <div className="card p-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Kolom yang dibutuhkan:</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400">hari, jam_mulai, jam_selesai, kelas_id, mapel_id, ruangan, warna</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">Wajib: hari, jam_mulai, kelas_id, mapel_id. Format jam: HH:MM</p>
            </div>
            <input type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportCSV(f); }} className="input-field text-xs" />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowImport(false)} className="btn-secondary py-2.5 px-4 text-xs">Tutup</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ================== KALENDER AKADEMIK TAB ==================
function KalenderAkademikTab({ showToast, profile }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ judul: '', tanggal: '', catatan: '', jenis: 'Libur' });
  const jenisOptions = ['Libur', 'Ujian', 'Acara', 'Rapat', 'Lainnya'];

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('agenda_penting').select('*').order('tanggal', { ascending: true });
      if (error) throw error;
      setList(data || []);
    } catch (err: any) { showToast('Gagal memuat kalender: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ judul: '', tanggal: '', catatan: '', jenis: 'Libur' }); setEditingId(null); };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ judul: item.judul || '', tanggal: item.tanggal || '', catatan: item.catatan || '', jenis: item.jenis || 'Libur' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.judul || !form.tanggal) { showToast('Judul dan tanggal wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { judul: form.judul, tanggal: form.tanggal, catatan: form.catatan || null, jenis: form.jenis, user_id: profile?.id };
      if (editingId) {
        const { error } = await supabase.from('agenda_penting').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Agenda diperbarui', 'success');
      } else {
        const { error } = await supabase.from('agenda_penting').insert(payload);
        if (error) throw error;
        showToast('Agenda ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Hapus agenda ini?')) return;
    try {
      const { error } = await supabase.from('agenda_penting').delete().eq('id', item.id);
      if (error) throw error;
      showToast('Agenda dihapus', 'success'); fetchList();
    } catch (err: any) { showToast('Gagal menghapus: ' + (err?.message || ''), 'error'); }
  };

  const jenisColor = (jenis: string) => {
    switch (jenis) {
      case 'Libur': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
      case 'Ujian': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'Acara': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'Rapat': return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">Kelola agenda penting dan hari libur akademik</p>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span>
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : list.length === 0 ? (
        <EmptyState title="Tidak ada agenda" icon={<BookOpen className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {list.map(item => (
            <div key={item.id} className="card p-2.5 flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{item.judul}</p>
                <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                  <span>{item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${jenisColor(item.jenis)}`}>{item.jenis}</span>
                  {item.catatan && <span className="truncate">• {item.catatan}</span>}
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-400 hover:text-sky-600"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Agenda' : 'Tambah Agenda'}>
          <div className="space-y-3">
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Judul *</label><input type="text" value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} className="input-field text-xs" placeholder="Ujian Tengah Semester" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal *</label><input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} className="input-field text-xs" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jenis</label><select className="input-field text-xs" value={form.jenis} onChange={e => setForm({ ...form, jenis: e.target.value })}>{jenisOptions.map(j => <option key={j} value={j}>{j}</option>)}</select></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Catatan</label><textarea value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} className="input-field text-xs" rows={2} placeholder="Catatan tambahan" /></div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ================== AKADEMIK SECTION ==================
function AkademikSection({ akademikTab, setAkademikTab, showToast, profile }: any) {
  const tabs = [
    { id: 'kbm-harian' as AkademikTab, label: 'KBM Harian', icon: BookOpen, color: 'emerald' },
    { id: 'jurnal' as AkademikTab, label: 'Jurnal Mengajar', icon: FileText, color: 'sky' },
    { id: 'target' as AkademikTab, label: 'Target Mengajar', icon: Target, color: 'amber' },
    { id: 'bank-soal' as AkademikTab, label: 'Bank Soal', icon: Database, color: 'violet' },
    { id: 'muhafadhoh' as AkademikTab, label: 'Muhafadhoh', icon: BookCopy, color: 'rose' },
    { id: 'buku-saku' as AkademikTab, label: 'Buku Saku', icon: BookOpen, color: 'sky' },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="Akademik" subtitle="Mengelola proses belajar mengajar" />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setAkademikTab(t.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all border ${akademikTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className="card p-4">
        <EmptyState title={`${tabs.find(t => t.id === akademikTab)?.label || ''} - akan segera tersedia`} icon={<BookOpen className="w-8 h-8 text-slate-300" />} />
      </div>
    </div>
  );
}

// ================== PENILAIAN SECTION ==================
function PenilaianSection({ penilaianTab, setPenilaianTab, showToast, profile }: any) {
  const tabs = [
    { id: 'harian' as PenilaianTab, label: 'Nilai Harian', icon: BarChart3, color: 'sky' },
    { id: 'ulangan' as PenilaianTab, label: 'Ulangan', icon: FileText, color: 'emerald' },
    { id: 'ujian-tulis' as PenilaianTab, label: 'Ujian Tulis', icon: FileText, color: 'amber' },
    { id: 'ujian-lisan' as PenilaianTab, label: 'Ujian Lisan', icon: Mic, color: 'rose' },
    { id: 'hafalan' as PenilaianTab, label: 'Hafalan', icon: BookCopy, color: 'violet' },
    { id: 'baca-kitab' as PenilaianTab, label: 'Baca Kitab', icon: BookOpen, color: 'sky' },
    { id: 'sikap' as PenilaianTab, label: 'Sikap', icon: CheckCircle, color: 'rose' },
    { id: 'rapor' as PenilaianTab, label: 'Rapor', icon: BookOpen, color: 'emerald' },
    { id: 'lainnya' as PenilaianTab, label: 'Lainnya', icon: Plus, color: 'slate' },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="Penilaian" subtitle="Mengelola nilai dan rapor" />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setPenilaianTab(t.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all border ${penilaianTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      {penilaianTab === 'harian' && <NilaiCrudTab showToast={showToast} profile={profile} jenisUjian="Harian" label="Nilai Harian" />}
      {penilaianTab === 'ulangan' && <NilaiCrudTab showToast={showToast} profile={profile} jenisUjian="Ulangan" label="Ulangan" />}
      {penilaianTab === 'ujian-tulis' && <NilaiCrudTab showToast={showToast} profile={profile} jenisUjian="Ujian Tulis" label="Ujian Tulis" />}
      {penilaianTab === 'ujian-lisan' && <NilaiCrudTab showToast={showToast} profile={profile} jenisUjian="Ujian Lisan" label="Ujian Lisan" />}
      {penilaianTab === 'baca-kitab' && <NilaiCrudTab showToast={showToast} profile={profile} jenisUjian="Baca Kitab" label="Baca Kitab" />}
      {penilaianTab === 'hafalan' && <HafalanTab showToast={showToast} profile={profile} />}
      {penilaianTab === 'sikap' && <SikapTab showToast={showToast} profile={profile} />}
      {penilaianTab === 'rapor' && <RaporTab showToast={showToast} profile={profile} />}
      {penilaianTab === 'lainnya' && <NilaiCrudTab showToast={showToast} profile={profile} jenisUjian="Lainnya" label="Penilaian Lainnya" />}
    </div>
  );
}

// ================== NILAI CRUD TAB (for harian, ulangan, ujian-tulis, ujian-lisan, baca-kitab, lainnya) ==================
function NilaiCrudTab({ showToast, profile, jenisUjian, label }: { showToast: any; profile: any; jenisUjian: string; label: string }) {
  const [list, setList] = useState<any[]>([]);
  const [muridList, setMuridList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ murid_id: '', pelajaran: '', skor: '', tanggal: '' });

  useEffect(() => { fetchList(); fetchMurid(); }, []);

  const fetchMurid = async () => {
    try {
      const { data } = await supabase.from('murid').select('id, nama, nis').order('nama');
      setMuridList(data || []);
    } catch { /* silent */ }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('nilai').select('*').eq('jenis_ujian', jenisUjian).order('tanggal', { ascending: false });
      if (error) throw error;
      setList(data || []);
    } catch (err: any) { showToast('Gagal memuat data: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ murid_id: '', pelajaran: '', skor: '', tanggal: '' }); setEditingId(null); };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ murid_id: item.murid_id || '', pelajaran: item.pelajaran || '', skor: String(item.skor ?? ''), tanggal: item.tanggal || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.murid_id || !form.pelajaran || !form.skor) { showToast('Murid, pelajaran, dan skor wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { murid_id: form.murid_id, pelajaran: form.pelajaran, jenis_ujian: jenisUjian, skor: parseFloat(form.skor), tanggal: form.tanggal || null, user_id: profile?.id };
      if (editingId) {
        const { error } = await supabase.from('nilai').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Nilai diperbarui', 'success');
      } else {
        const { error } = await supabase.from('nilai').insert(payload);
        if (error) throw error;
        showToast('Nilai ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal menyimpan: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Hapus nilai ini?')) return;
    try {
      const { error } = await supabase.from('nilai').delete().eq('id', item.id);
      if (error) throw error;
      showToast('Nilai dihapus', 'success'); fetchList();
    } catch (err: any) { showToast('Gagal menghapus: ' + (err?.message || ''), 'error'); }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(n => {
      const muridNama = muridList.find(m => m.id === n.murid_id)?.nama || '';
      return [muridNama, n.pelajaran, n.jenis_ujian].filter(Boolean).join(' ').toLowerCase().includes(q);
    });
  }, [list, search, muridList]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Cari ${label.toLowerCase()}...`} className="input-field text-xs pl-8" />
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span>
        </button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title={`Tidak ada ${label.toLowerCase()}`} icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(n => {
            const murid = muridList.find(m => m.id === n.murid_id);
            return (
              <div key={n.id} className="card p-2.5 flex items-center gap-2.5 group">
                <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{murid?.nama || '-'} - {n.pelajaran || '-'}</p>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">{n.skor}</span>
                    {n.tanggal && <span>• {new Date(n.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}
                    {murid?.nis && <span>• NIS: {murid.nis}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(n)} className="p-1.5 rounded hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-400 hover:text-sky-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(n)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
          <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? `Edit ${label}` : `Tambah ${label}`}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Murid *</label>
              <select className="input-field text-xs" value={form.murid_id} onChange={e => setForm({ ...form, murid_id: e.target.value })}>
                <option value="">Pilih murid...</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama} {m.nis ? `(${m.nis})` : ''}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Mata Pelajaran *</label><input type="text" value={form.pelajaran} onChange={e => setForm({ ...form, pelajaran: e.target.value })} className="input-field text-xs" placeholder="Fiqih" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Skor *</label><input type="number" step="0.1" value={form.skor} onChange={e => setForm({ ...form, skor: e.target.value })} className="input-field text-xs" placeholder="85" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} className="input-field text-xs" /></div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ================== HAFALAN TAB (capaian_hafalan table) ==================
function HafalanTab({ showToast, profile }: any) {
  const [list, setList] = useState<any[]>([]);
  const [muridList, setMuridList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ murid_id: '', capaian: '', tanggal: '' });

  useEffect(() => { fetchList(); fetchMurid(); }, []);

  const fetchMurid = async () => {
    try { const { data } = await supabase.from('murid').select('id, nama, nis').order('nama'); setMuridList(data || []); } catch { /* silent */ }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('capaian_hafalan').select('*').order('tanggal', { ascending: false });
      if (error) throw error;
      setList(data || []);
    } catch (err: any) { showToast('Gagal memuat data: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ murid_id: '', capaian: '', tanggal: '' }); setEditingId(null); };

  const openEdit = (item: any) => { setEditingId(item.id); setForm({ murid_id: item.murid_id || '', capaian: item.capaian || '', tanggal: item.tanggal || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.murid_id || !form.capaian) { showToast('Murid dan capaian wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { murid_id: form.murid_id, capaian: form.capaian, tanggal: form.tanggal || null, user_id: profile?.id };
      if (editingId) {
        const { error } = await supabase.from('capaian_hafalan').update(payload).eq('id', editingId);
        if (error) throw error; showToast('Hafalan diperbarui', 'success');
      } else {
        const { error } = await supabase.from('capaian_hafalan').insert(payload);
        if (error) throw error; showToast('Hafalan ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Hapus data hafalan ini?')) return;
    try { const { error } = await supabase.from('capaian_hafalan').delete().eq('id', item.id); if (error) throw error; showToast('Data dihapus', 'success'); fetchList(); }
    catch (err: any) { showToast('Gagal: ' + (err?.message || ''), 'error'); }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(n => { const m = muridList.find(x => x.id === n.murid_id)?.nama || ''; return [m, n.capaian].join(' ').toLowerCase().includes(q); });
  }, [list, search, muridList]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari hafalan..." className="input-field text-xs pl-8" /></div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3"><Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span></button>
      </div>
      {loading ? (<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (<EmptyState title="Tidak ada data hafalan" icon={<BookCopy className="w-8 h-8 text-slate-300" />} />
      ) : (<div className="space-y-1">
        {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(n => { const m = muridList.find(x => x.id === n.murid_id); return (
          <div key={n.id} className="card p-2.5 flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><BookCopy className="w-4 h-4 text-violet-600 dark:text-violet-400" /></div>
            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{m?.nama || '-'}</p><div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400"><span className="truncate">{n.capaian}</span>{n.tanggal && <span>• {new Date(n.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}</div></div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100"><button onClick={() => openEdit(n)} className="p-1.5 rounded hover:bg-violet-50 dark:hover:bg-violet-900/20 text-slate-400 hover:text-violet-600"><Pencil className="w-3 h-3" /></button><button onClick={() => handleDelete(n)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button></div>
          </div>); })}
        <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
      </div>)}
      {showModal && (<Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Hafalan' : 'Tambah Hafalan'}>
        <div className="space-y-3">
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Murid *</label><select className="input-field text-xs" value={form.murid_id} onChange={e => setForm({ ...form, murid_id: e.target.value })}><option value="">Pilih murid...</option>{muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Capaian *</label><input type="text" value={form.capaian} onChange={e => setForm({ ...form, capaian: e.target.value })} className="input-field text-xs" placeholder="Juz 30" /></div>
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} className="input-field text-xs" /></div>
          <div className="flex gap-2 pt-2"><button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button><button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan</button></div>
        </div>
      </Modal>)}
    </div>
  );
}

// ================== SIKAP TAB (sikap table) ==================
function SikapTab({ showToast, profile }: any) {
  const [list, setList] = useState<any[]>([]);
  const [muridList, setMuridList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ murid_id: '', tanggal: '', disiplin: '', adab: '', kerajinan: '', kejujuran: '', tanggung_jawab: '', catatan: '' });

  useEffect(() => { fetchList(); fetchMurid(); }, []);

  const fetchMurid = async () => { try { const { data } = await supabase.from('murid').select('id, nama').order('nama'); setMuridList(data || []); } catch {} };

  const fetchList = async () => {
    setLoading(true);
    try { const { data, error } = await supabase.from('sikap').select('*').order('tanggal', { ascending: false }); if (error) throw error; setList(data || []); }
    catch (err: any) { showToast('Gagal memuat data: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ murid_id: '', tanggal: '', disiplin: '', adab: '', kerajinan: '', kejujuran: '', tanggung_jawab: '', catatan: '' }); setEditingId(null); };

  const openEdit = (item: any) => { setEditingId(item.id); setForm({ murid_id: item.murid_id || '', tanggal: item.tanggal || '', disiplin: String(item.disiplin ?? ''), adab: String(item.adab ?? ''), kerajinan: String(item.kerajinan ?? ''), kejujuran: String(item.kejujuran ?? ''), tanggung_jawab: String(item.tanggung_jawab ?? ''), catatan: item.catatan || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.murid_id) { showToast('Murid wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { murid_id: form.murid_id, tanggal: form.tanggal || null, disiplin: form.disiplin ? parseFloat(form.disiplin) : null, adab: form.adab ? parseFloat(form.adab) : null, kerajinan: form.kerajinan ? parseFloat(form.kerajinan) : null, kejujuran: form.kejujuran ? parseFloat(form.kejujuran) : null, tanggung_jawab: form.tanggung_jawab ? parseFloat(form.tanggung_jawab) : null, catatan: form.catatan || null, user_id: profile?.id };
      if (editingId) { const { error } = await supabase.from('sikap').update(payload).eq('id', editingId); if (error) throw error; showToast('Sikap diperbarui', 'success'); }
      else { const { error } = await supabase.from('sikap').insert(payload); if (error) throw error; showToast('Sikap ditambahkan', 'success'); }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!confirm('Hapus data sikap ini?')) return; try { const { error } = await supabase.from('sikap').delete().eq('id', item.id); if (error) throw error; showToast('Data dihapus', 'success'); fetchList(); } catch (err: any) { showToast('Gagal: ' + (err?.message || ''), 'error'); } };

  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(n => { const m = muridList.find(x => x.id === n.murid_id)?.nama || ''; return m.toLowerCase().includes(q); }); }, [list, search, muridList]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari sikap..." className="input-field text-xs pl-8" /></div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3"><Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span></button>
      </div>
      {loading ? (<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (<EmptyState title="Tidak ada data sikap" icon={<CheckCircle className="w-8 h-8 text-slate-300" />} />
      ) : (<div className="space-y-1">
        {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(n => { const m = muridList.find(x => x.id === n.murid_id); return (
          <div key={n.id} className="card p-2.5 flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><CheckCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" /></div>
            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{m?.nama || '-'}</p><div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">{n.tanggal && <span>{new Date(n.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>}<span>D:{n.disiplin ?? '-'} A:{n.adab ?? '-'} K:{n.kerajinan ?? '-'}</span></div></div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100"><button onClick={() => openEdit(n)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Pencil className="w-3 h-3" /></button><button onClick={() => handleDelete(n)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button></div>
          </div>); })}
        <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
      </div>)}
      {showModal && (<Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Sikap' : 'Tambah Sikap'}>
        <div className="space-y-3">
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Murid *</label><select className="input-field text-xs" value={form.murid_id} onChange={e => setForm({ ...form, murid_id: e.target.value })}><option value="">Pilih murid...</option>{muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}</select></div>
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal</label><input type="date" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} className="input-field text-xs" /></div>
          <div className="grid grid-cols-3 gap-2">
            <div><label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Disiplin</label><input type="number" min="0" max="100" value={form.disiplin} onChange={e => setForm({ ...form, disiplin: e.target.value })} className="input-field text-xs" placeholder="80" /></div>
            <div><label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Adab</label><input type="number" min="0" max="100" value={form.adab} onChange={e => setForm({ ...form, adab: e.target.value })} className="input-field text-xs" placeholder="80" /></div>
            <div><label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Kerajinan</label><input type="number" min="0" max="100" value={form.kerajinan} onChange={e => setForm({ ...form, kerajinan: e.target.value })} className="input-field text-xs" placeholder="80" /></div>
            <div><label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Kejujuran</label><input type="number" min="0" max="100" value={form.kejujuran} onChange={e => setForm({ ...form, kejujuran: e.target.value })} className="input-field text-xs" placeholder="80" /></div>
            <div><label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">Tanggung Jawab</label><input type="number" min="0" max="100" value={form.tanggung_jawab} onChange={e => setForm({ ...form, tanggung_jawab: e.target.value })} className="input-field text-xs" placeholder="80" /></div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Catatan</label><textarea value={form.catatan} onChange={e => setForm({ ...form, catatan: e.target.value })} className="input-field text-xs" rows={2} placeholder="Catatan tambahan" /></div>
          <div className="flex gap-2 pt-2"><button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button><button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan</button></div>
        </div>
      </Modal>)}
    </div>
  );
}

// ================== RAPOR TAB (rapor_final table) ==================
function RaporTab({ showToast, profile }: any) {
  const [list, setList] = useState<any[]>([]);
  const [muridList, setMuridList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ murid_id: '', nilai_akhir: '', predikat: '', deskripsi: '' });

  useEffect(() => { fetchList(); fetchMurid(); }, []);

  const fetchMurid = async () => { try { const { data } = await supabase.from('murid').select('id, nama').order('nama'); setMuridList(data || []); } catch {} };

  const fetchList = async () => {
    setLoading(true);
    try { const { data, error } = await supabase.from('rapor_final').select('*').order('created_at', { ascending: false }); if (error) throw error; setList(data || []); }
    catch (err: any) { showToast('Gagal memuat data: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ murid_id: '', nilai_akhir: '', predikat: '', deskripsi: '' }); setEditingId(null); };

  const openEdit = (item: any) => { setEditingId(item.id); setForm({ murid_id: item.murid_id || '', nilai_akhir: String(item.nilai_akhir ?? ''), predikat: item.predikat || '', deskripsi: item.deskripsi || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.murid_id || !form.nilai_akhir) { showToast('Murid dan nilai akhir wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { murid_id: form.murid_id, nilai_akhir: parseFloat(form.nilai_akhir), predikat: form.predikat || null, deskripsi: form.deskripsi || null, user_id: profile?.id };
      if (editingId) { const { error } = await supabase.from('rapor_final').update(payload).eq('id', editingId); if (error) throw error; showToast('Rapor diperbarui', 'success'); }
      else { const { error } = await supabase.from('rapor_final').insert(payload); if (error) throw error; showToast('Rapor ditambahkan', 'success'); }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal: ' + (err?.message || ''), 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!confirm('Hapus rapor ini?')) return; try { const { error } = await supabase.from('rapor_final').delete().eq('id', item.id); if (error) throw error; showToast('Rapor dihapus', 'success'); fetchList(); } catch (err: any) { showToast('Gagal: ' + (err?.message || ''), 'error'); } };

  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(n => { const m = muridList.find(x => x.id === n.murid_id)?.nama || ''; return [m, n.predikat].join(' ').toLowerCase().includes(q); }); }, [list, search, muridList]);

  const predikatColor = (p: string) => {
    if (!p) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    if (p.startsWith('A')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    if (p.startsWith('B')) return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300';
    if (p.startsWith('C')) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    if (p.startsWith('D')) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1"><Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" /><input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari rapor..." className="input-field text-xs pl-8" /></div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3"><Plus className="w-3.5 h-3.5" /><span className="text-xs">Tambah</span></button>
      </div>
      {loading ? (<div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (<EmptyState title="Tidak ada rapor" icon={<BookOpen className="w-8 h-8 text-slate-300" />} />
      ) : (<div className="space-y-1">
        {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(n => { const m = muridList.find(x => x.id === n.murid_id); return (
          <div key={n.id} className="card p-2.5 flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
            <div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{m?.nama || '-'}</p><div className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400"><span className="font-semibold text-emerald-600 dark:text-emerald-400">{n.nilai_akhir}</span>{n.predikat && <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${predikatColor(n.predikat)}`}>{n.predikat}</span>}{n.deskripsi && <span className="truncate">• {n.deskripsi}</span>}</div></div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100"><button onClick={() => openEdit(n)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button><button onClick={() => handleDelete(n)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button></div>
          </div>); })}
        <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
      </div>)}
      {showModal && (<Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Rapor' : 'Tambah Rapor'}>
        <div className="space-y-3">
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Murid *</label><select className="input-field text-xs" value={form.murid_id} onChange={e => setForm({ ...form, murid_id: e.target.value })}><option value="">Pilih murid...</option>{muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nilai Akhir *</label><input type="number" step="0.1" value={form.nilai_akhir} onChange={e => setForm({ ...form, nilai_akhir: e.target.value })} className="input-field text-xs" placeholder="85" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Predikat</label><select className="input-field text-xs" value={form.predikat} onChange={e => setForm({ ...form, predikat: e.target.value })}><option value="">Pilih...</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
          </div>
          <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Deskripsi</label><textarea value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} className="input-field text-xs" rows={2} placeholder="Deskripsi rapor" /></div>
          <div className="flex gap-2 pt-2"><button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button><button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan</button></div>
        </div>
      </Modal>)}
    </div>
  );
}

// ================== PENGUMUMAN SECTION ==================
function PengumumanSection({ pengumumanTab, setPengumumanTab, showToast }: any) {
  const tabs = [
    { id: 'pengumuman' as PengumumanTab, label: 'Pengumuman', icon: Megaphone, color: 'amber' },
    { id: 'agenda' as PengumumanTab, label: 'Agenda', icon: Calendar, color: 'sky' },
    { id: 'event' as PengumumanTab, label: 'Event', icon: Bell, color: 'rose' },
    { id: 'notifikasi' as PengumumanTab, label: 'Notifikasi', icon: Bell, color: 'violet' },
  ];

  if (pengumumanTab === 'pengumuman') return <AdminPengumuman showToast={showToast} />;

  return (
    <div className="space-y-3">
      <SectionHeader title="Pengumuman" subtitle="Mengelola informasi dan komunikasi" />
      <div className="grid grid-cols-4 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setPengumumanTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${pengumumanTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className="card p-4">
        <EmptyState title={`${tabs.find(t => t.id === pengumumanTab)?.label || ''} - akan segera tersedia`} icon={<Megaphone className="w-8 h-8 text-slate-300" />} />
      </div>
    </div>
  );
}

// ================== LAPORAN SECTION ==================
function LaporanSection({ laporanTab, setLaporanTab, showToast }: any) {
  const tabs = [
    { id: 'presensi' as LaporanTab, label: 'Laporan Presensi', icon: CheckCircle, color: 'emerald' },
    { id: 'nilai' as LaporanTab, label: 'Laporan Nilai', icon: BarChart3, color: 'sky' },
    { id: 'kbm' as LaporanTab, label: 'Laporan KBM', icon: BookOpen, color: 'amber' },
    { id: 'jadwal' as LaporanTab, label: 'Laporan Jadwal', icon: Calendar, color: 'violet' },
    { id: 'guru-pengganti' as LaporanTab, label: 'Guru Pengganti', icon: Users, color: 'rose' },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="Laporan" subtitle="Laporan dan ekspor data" />
      <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setLaporanTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${laporanTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-4 h-4 text-slate-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{tabs.find(t => t.id === laporanTab)?.label || ''}</h3>
        </div>
        <div className="flex gap-2 mb-4">
          <button onClick={() => showToast('Ekspor PDF akan segera tersedia', 'info')} className="btn-secondary flex items-center gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Ekspor PDF</button>
          <button onClick={() => showToast('Ekspor Excel akan segera tersedia', 'info')} className="btn-secondary flex items-center gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Ekspor Excel</button>
        </div>
        <EmptyState title="Pilih laporan untuk melihat data" icon={<FileText className="w-8 h-8 text-slate-300" />} />
      </div>
    </div>
  );
}

// ================== STATISTIK SECTION ==================
function StatistikSection({ statistikTab, setStatistikTab, showToast }: any) {
  const tabs = [
    { id: 'kehadiran-ustaz' as StatistikTab, label: 'Kehadiran Ustaz', icon: Users, color: 'emerald' },
    { id: 'kehadiran-murid' as StatistikTab, label: 'Kehadiran Murid', icon: GraduationCap, color: 'sky' },
    { id: 'kbm' as StatistikTab, label: 'KBM', icon: BookOpen, color: 'amber' },
    { id: 'nilai' as StatistikTab, label: 'Nilai', icon: BarChart3, color: 'violet' },
    { id: 'top-guru' as StatistikTab, label: 'Top Guru', icon: CheckCircle, color: 'rose' },
    { id: 'top-kelas' as StatistikTab, label: 'Top Kelas', icon: School, color: 'emerald' },
    { id: 'top-murid' as StatistikTab, label: 'Top Murid', icon: GraduationCap, color: 'amber' },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="Statistik" subtitle="Grafik dan analitik data" />
      <div className="grid grid-cols-3 md:grid-cols-7 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setStatistikTab(t.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all border ${statistikTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      {statistikTab === 'top-murid' ? (
        <TopMuridContent showToast={showToast} />
      ) : (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{tabs.find(t => t.id === statistikTab)?.label || ''}</h3>
          </div>
          <div className="flex gap-2 mb-4">
            {['Hari', 'Minggu', 'Bulan', 'Semester', 'Tahun'].map(f => (
              <button key={f} className="btn-secondary text-[10px] py-1 px-2.5">{f}</button>
            ))}
          </div>
          <EmptyState title="Grafik akan segera tersedia" icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
        </div>
      )}
    </div>
  );
}

// ================== TOP MURID CONTENT ==================
function TopMuridContent({ showToast }: any) {
  const [topMurid, setTopMurid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTopMurid(); }, []);

  const fetchTopMurid = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nilai')
        .select('murid_id, skor, pelajaran, jenis_ujian');
      if (error) throw error;
      const muridIds = [...new Set((data || []).map(n => n.murid_id).filter(Boolean))];
      if (muridIds.length === 0) { setTopMurid([]); return; }
      const { data: muridData } = await supabase.from('murid').select('id, nama, nis, kelas_id').in('id', muridIds);
      const muridMap = new Map((muridData || []).map(m => [m.id, m]));
      const avgMap = new Map<string, { total: number; count: number }>();
      (data || []).forEach(n => {
        if (!n.murid_id || n.skor == null) return;
        const cur = avgMap.get(n.murid_id) || { total: 0, count: 0 };
        cur.total += parseFloat(n.skor); cur.count++;
        avgMap.set(n.murid_id, cur);
      });
      const ranked = Array.from(avgMap.entries()).map(([id, v]) => ({
        ...muridMap.get(id),
        rata_rata: v.count > 0 ? (v.total / v.count) : 0,
        jumlah_nilai: v.count,
      })).sort((a, b) => b.rata_rata - a.rata_rata).slice(0, 10);
      setTopMurid(ranked);
    } catch (err: any) { showToast('Gagal memuat data: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const medalColor = (i: number) => {
    if (i === 0) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    if (i === 1) return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600';
    if (i === 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300 dark:border-orange-700';
    return 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 border-sky-200 dark:border-sky-800';
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Top Murid - Peringkat Berdasarkan Rata-rata Nilai</h3>
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : topMurid.length === 0 ? (
        <EmptyState title="Belum ada data nilai" icon={<GraduationCap className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-2">
          {topMurid.map((m, i) => (
            <div key={m.id || i} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${medalColor(i)}`}>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-slate-800 font-bold text-sm flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{m.nama || '-'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{m.nis ? `NIS: ${m.nis}` : ''} • {m.jumlah_nilai} nilai</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{m.rata_rata.toFixed(1)}</p>
                <p className="text-[9px] text-slate-500 dark:text-slate-400">rata-rata</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================== PENGATURAN SECTION ==================
function PengaturanSection({ pengaturanTab, setPengaturanTab, showToast, profile }: any) {
  const tabs = [
    { id: 'identitas' as PengaturanTab, label: 'Identitas Lembaga', icon: Building2, color: 'emerald' },
    { id: 'tahun-semester' as PengaturanTab, label: 'Tahun & Semester', icon: Calendar, color: 'sky' },
    { id: 'jam' as PengaturanTab, label: 'Jam Masuk/Pulang', icon: Clock, color: 'amber' },
    { id: 'hari-libur' as PengaturanTab, label: 'Hari Libur', icon: Calendar, color: 'rose' },
    { id: 'tema' as PengaturanTab, label: 'Tema', icon: Settings, color: 'violet' },
    { id: 'backup' as PengaturanTab, label: 'Backup & Restore', icon: Database, color: 'slate' },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="Pengaturan Sistem" subtitle="Konfigurasi sistem dan aplikasi" />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setPengaturanTab(t.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all border ${pengaturanTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      {pengaturanTab === 'tema' && <TemaPengaturanContent showToast={showToast} />}
      {pengaturanTab === 'backup' && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-slate-500" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Backup & Restore Database</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => showToast('Backup akan segera tersedia', 'info')} className="btn-primary flex items-center gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Backup Database</button>
            <button onClick={() => showToast('Restore akan segera tersedia', 'info')} className="btn-secondary flex items-center gap-1.5 text-xs"><Upload className="w-3.5 h-3.5" />Restore Database</button>
          </div>
        </div>
      )}
      {pengaturanTab !== 'backup' && (
        <div className="card p-4">
          <EmptyState title={`${tabs.find(t => t.id === pengaturanTab)?.label || ''} - akan segera tersedia`} icon={<Settings className="w-8 h-8 text-slate-300" />} />
        </div>
      )}
    </div>
  );
}

// ================== AUDIT SECTION ==================
function AuditSection({ auditTab, setAuditTab, showToast }: any) {
  const tabs = [
    { id: 'riwayat-login' as AuditTab, label: 'Riwayat Login', icon: History, color: 'emerald' },
    { id: 'aktivitas' as AuditTab, label: 'Aktivitas User', icon: Activity, color: 'sky' },
    { id: 'perubahan' as AuditTab, label: 'Riwayat Perubahan', icon: FileText, color: 'amber' },
    { id: 'error' as AuditTab, label: 'Error Log', icon: AlertTriangle, color: 'rose' },
    { id: 'ekspor' as AuditTab, label: 'Riwayat Ekspor', icon: Download, color: 'violet' },
    { id: 'impor' as AuditTab, label: 'Riwayat Impor', icon: Upload, color: 'slate' },
  ];

  return (
    <div className="space-y-3">
      <SectionHeader title="Audit Sistem" subtitle="Mencatat seluruh aktivitas pengguna" />
      <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setAuditTab(t.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all border ${auditTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
      <AuditContent tab={auditTab} showToast={showToast} />
    </div>
  );
}

function AuditContent({ tab, showToast }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchList(); }, [tab]);

  const fetchList = async () => {
    setLoading(true);
    try {
      if (tab === 'riwayat-login') {
        const { data, error } = await supabase.from('profiles').select('id, nama_lengkap, email, role, created_at, updated_at, is_active, status').order('updated_at', { ascending: false });
        if (error) throw error;
        setList((data || []).map((p: any) => ({ ...p, timestamp: p.updated_at || p.created_at, aksi: p.is_active ? 'Login' : 'Nonaktif' })));
      } else if (tab === 'aktivitas') {
        const { data, error } = await supabase.from('jurnal_kbm').select('id, user_id, kelas, mata_pelajaran, tanggal, created_at, kegiatan').order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        setList((data || []).map((j: any) => ({ ...j, timestamp: j.created_at, aksi: 'Membuat jurnal', detail: `${j.kegiatan || j.mata_pelajaran || ''} - ${j.kelas || ''}` })));
      } else if (tab === 'perubahan') {
        const tables = ['kelas', 'mata_pelajaran', 'ruangan', 'tahun_ajaran', 'semester'];
        const results = await Promise.all(tables.map(t => supabase.from(t).select('*').order('updated_at', { ascending: false }).limit(10)));
        const all: any[] = [];
        results.forEach((r, i) => { if (r.data) r.data.forEach((row: any) => all.push({ ...row, table_name: tables[i], timestamp: row.updated_at || row.created_at, aksi: 'Perubahan data' })); });
        all.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
        setList(all.slice(0, 50));
      } else if (tab === 'error') {
        setList([]);
      } else if (tab === 'ekspor' || tab === 'impor') {
        setList([]);
      }
    } catch (err: any) { showToast('Gagal memuat data: ' + (err?.message || ''), 'error'); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((item: any) => [item.nama_lengkap, item.email, item.aksi, item.detail, item.table_name].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [list, search]);

  const formatDate = (ts: string) => ts ? new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Search className="w-3.5 h-3.5 text-slate-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari aktivitas berdasarkan nama, tanggal, atau menu..." className="input-field text-xs" />
      </div>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada data audit" icon={<History className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any, i: number) => (
            <div key={item.id || i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">
                  {item.nama_lengkap || item.email || item.table_name || 'Sistem'} - <span className="text-slate-500 dark:text-slate-400">{item.aksi || '-'}</span>
                </p>
                {item.detail && <p className="text-[10px] text-slate-400 truncate">{item.detail}</p>}
                <p className="text-[9px] text-slate-400">{formatDate(item.timestamp)}</p>
              </div>
            </div>
          ))}
          <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}

function DataList({ tab, data, search, page, setPage, onEdit, onDelete, onResetPass }: any) {
  const list = useMemo(() => {
    let l: any[] = data[tab === 'users' ? 'users' : `${tab}List`] || [];
    if (search) {
      const q = search.toLowerCase();
      l = l.filter((item: any) => [item.nama_lengkap, item.nama, item.nama_kelas, item.nama_mapel, item.nama_ruangan].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return l;
  }, [tab, data, search]);

  if (list.length === 0) return <EmptyState title="Tidak ada data" icon={<Database className="w-8 h-8 text-slate-300" />} />;

  return (
    <div className="space-y-1">
      {list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any) => (
        <div key={item.id} className="card p-2.5 flex items-center gap-2.5 group">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{item.nama_lengkap || item.nama || item.nama_kelas || item.nama_mapel || item.nama_ruangan}</p>
            {item.role && <span className="badge badge-info text-[9px]">{item.role}</span>}
            {item.is_active === false && <span className="badge badge-danger text-[9px]">Nonaktif</span>}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
            {tab === 'users' && onResetPass && (
              <button onClick={() => onResetPass(item)} className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600" title="Reset Password"><KeyRound className="w-3 h-3" /></button>
            )}
            <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
            <button onClick={() => onDelete(item)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
          </div>
        </div>
      ))}
      <Pagination currentPage={page} totalPages={Math.ceil(list.length / PAGE_SIZE)} onPageChange={setPage} />
    </div>
  );
}

// ================== DATA AKADEMIK SECTION ==================
function DataAkademikSection({ dataAkademikTab, setDataAkademikTab, showToast, profile }: { dataAkademikTab: DataAkademikTab; setDataAkademikTab: (tab: DataAkademikTab) => void; showToast: ShowToast; profile: Profile | null }) {
  const tabs = [
    { id: 'siswa' as DataAkademikTab, label: 'Siswa', icon: GraduationCap, color: 'sky' },
    { id: 'ustaz' as DataAkademikTab, label: 'Ustaz', icon: Users, color: 'emerald' },
    { id: 'data-santri' as DataAkademikTab, label: 'Data Santri', icon: UsersRound, color: 'violet' },
    { id: 'jadwal-asatiz' as DataAkademikTab, label: 'Jadwal Asatiz', icon: Calendar, color: 'amber' },
    { id: 'kelola-lembaga' as DataAkademikTab, label: 'Kelola Lembaga', icon: Building2, color: 'rose' },
  ];

  const colorActive: Record<string, string> = {
    sky: 'bg-sky-600 text-white border-sky-600',
    emerald: 'bg-emerald-600 text-white border-emerald-600',
    violet: 'bg-violet-600 text-white border-violet-600',
    amber: 'bg-amber-600 text-white border-amber-600',
    rose: 'bg-rose-600 text-white border-rose-600',
  };
  const colorIdle: Record<string, string> = {
    sky: 'text-sky-600 dark:text-sky-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  };

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Data Akademik</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Kelola siswa, ustaz, santri, jadwal, dan lembaga</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = dataAkademikTab === t.id;
          return (
            <button key={t.id} onClick={() => setDataAkademikTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${isActive ? colorActive[t.color] : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 ${colorIdle[t.color]}`}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {dataAkademikTab === 'siswa' && <DataSiswaPage showToast={showToast} />}
      {dataAkademikTab === 'ustaz' && <DataUstazPage showToast={showToast} />}
      {dataAkademikTab === 'data-santri' && <DataSantriSubSection showToast={showToast} profile={profile} />}
      {dataAkademikTab === 'jadwal-asatiz' && <JadwalAsatizSubSection showToast={showToast} profile={profile} />}
      {dataAkademikTab === 'kelola-lembaga' && <KelolaLembagaSubSection showToast={showToast} profile={profile} />}
    </div>
  );
}

// ================== TEMA PENGATURAN CONTENT ==================
function TemaPengaturanContent({ showToast }: any) {
  const { theme, setTheme, isDark } = useThemeContext();
  const [textSize, setTextSize] = useState<number>(() => {
    const stored = localStorage.getItem('app-text-size');
    return stored ? parseInt(stored) : 100;
  });

  useEffect(() => {
    localStorage.setItem('app-text-size', String(textSize));
    document.documentElement.style.fontSize = `${textSize}%`;
  }, [textSize]);

  const themeOptions = [
    { value: 'light' as const, label: 'Terang', icon: Sun, color: 'amber' },
    { value: 'dark' as const, label: 'Gelap', icon: Moon, color: 'slate' },
    { value: 'system' as const, label: 'Sistem', icon: Monitor, color: 'sky' },
  ];

  const sizeLabels: Record<number, string> = { 85: 'Kecil', 90: 'Kecil', 95: 'Sedang', 100: 'Normal', 105: 'Besar', 110: 'Besar', 115: 'Besar', 120: 'Besar' };

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Pengaturan Tema</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(opt => {
            const Icon = opt.icon;
            const isActive = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); showToast(`Tema diubah ke ${opt.label}`, 'success'); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isActive ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300'}`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400'}`} />
                <span className={`text-xs font-semibold ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</span>
                {isActive && <div className="w-2 h-2 rounded-full bg-violet-500" />}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
          <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-slate-600' : 'bg-amber-400'}`} />
          <span>Tema aktif: {isDark ? 'Gelap' : 'Terang'}</span>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Type className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Ukuran Teks</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Kecil</span>
            <span className="font-bold text-sky-600 dark:text-sky-400">{sizeLabels[textSize] || 'Normal'} ({textSize}%)</span>
            <span className="text-slate-500 dark:text-slate-400">Besar</span>
          </div>
          <input
            type="range"
            min={85}
            max={120}
            step={5}
            value={textSize}
            onChange={e => setTextSize(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between gap-2">
            {[
              { val: 85, label: 'Kecil' },
              { val: 95, label: 'Sedang' },
              { val: 100, label: 'Normal' },
              { val: 110, label: 'Besar' },
              { val: 120, label: 'XL' },
            ].map(s => (
              <button
                key={s.val}
                onClick={() => setTextSize(s.val)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${textSize === s.val ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-300">Pratinjau teks dengan ukuran saat ini</p>
            <p className="text-[10px] text-slate-400 mt-1">Ini adalah contoh teks yang akan ditampilkan dengan ukuran {textSize}% di seluruh aplikasi.</p>
          </div>
          <button
            onClick={() => { setTextSize(100); showToast('Ukuran teks direset ke normal', 'success'); }}
            className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 mx-auto"
          >
            <RotateCcw className="w-3 h-3" /> Reset ke Normal
          </button>
        </div>
      </div>
    </div>
  );
}

// ================== DATA SANTRI SUB-SECTION (CRUD for murid) ==================
function DataSantriSubSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [list, setList] = useState<Murid[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data: lembagaList } = useLembaga();

  const [form, setForm] = useState({ nama: '', kelas: '', domisili: '', alamat: '', nomor_whatsapp: '', status_aktif: true, lembaga_id: '' });

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      let q = supabase.from('murid').select('*').order('nama', { ascending: true });
      if (!isAdmin) {
        q = q.eq('user_id', profile?.id || '');
      }
      const { data, error } = await q;
      if (error) throw error;
      setList((data || []) as Murid[]);
    } catch (err: any) {
      showToast('Gagal memuat data santri: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ nama: '', kelas: '', domisili: '', alamat: '', nomor_whatsapp: '', status_aktif: true, lembaga_id: '' });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (m: Murid) => {
    setEditingId(m.id);
    setForm({
      nama: m.nama || '',
      kelas: m.kelas || '',
      domisili: m.domisili || '',
      alamat: m.alamat || '',
      nomor_whatsapp: m.nomor_whatsapp || '',
      status_aktif: m.status_aktif ?? true,
      lembaga_id: m.lembaga_id || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama || !form.kelas) {
      showToast('Nama dan kelas wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        nama: form.nama,
        kelas: form.kelas,
        domisili: form.domisili || null,
        alamat: form.alamat || null,
        nomor_whatsapp: form.nomor_whatsapp || null,
        status_aktif: form.status_aktif,
        lembaga_id: form.lembaga_id || null,
      };
      if (editingId) {
        // ustaz can only edit own
        if (!isAdmin) {
          const existing = list.find(m => m.id === editingId);
          if (existing && existing.user_id !== profile?.id) {
            showToast('Anda hanya dapat mengedit santri milik sendiri', 'error');
            setSaving(false);
            return;
          }
        }
        const { error } = await supabase.from('murid').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Santri diperbarui', 'success');
      } else {
        payload.user_id = profile?.id;
        const { error } = await supabase.from('murid').insert(payload);
        if (error) throw error;
        showToast('Santri ditambahkan', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchList();
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + (err?.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: Murid) => {
    if (!confirm(`Yakin ingin menghapus santri "${m.nama}"?`)) return;
    try {
      const { error } = await supabase.from('murid').delete().eq('id', m.id);
      if (error) throw error;
      showToast('Santri dihapus', 'success');
      fetchList();
    } catch (err: any) {
      showToast('Gagal menghapus: ' + (err?.message || ''), 'error');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(m => [m.nama, m.kelas, m.domisili, m.alamat, m.nomor_whatsapp].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [list, search]);

  const lembagaOptions = useMemo(() => (lembagaList || []).map((l: Lembaga) => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari santri..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs">Tambah</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada data santri" icon={<UsersRound className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(m => {
            const lembagaName = (lembagaList || []).find(l => l.id === m.lembaga_id)?.nama_lembaga;
            return (
              <div key={m.id} className="card p-2.5 flex items-center gap-2.5 group">
                <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{m.nama}</p>
                  <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                    <span className="badge badge-info text-[9px]">{m.kelas}</span>
                    {lembagaName && <span className="truncate">{lembagaName}</span>}
                    {m.status_aktif === false && <span className="text-rose-500">Non-aktif</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(m)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
          <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Santri' : 'Tambah Santri'}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Santri *</label>
              <input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="input-field text-xs" placeholder="Nama lengkap" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelas *</label>
              <input type="text" value={form.kelas} onChange={e => setForm({ ...form, kelas: e.target.value })} className="input-field text-xs" placeholder="Kelas" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
              <SearchableSelect
                value={form.lembaga_id}
                onChange={v => setForm({ ...form, lembaga_id: v })}
                options={lembagaOptions}
                placeholder="Pilih lembaga"
                icon={<Building2 className="w-3.5 h-3.5" />}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Domisili</label>
              <input type="text" value={form.domisili} onChange={e => setForm({ ...form, domisili: e.target.value })} className="input-field text-xs" placeholder="Domisili" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Alamat</label>
              <input type="text" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} className="input-field text-xs" placeholder="Alamat" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">No. WhatsApp</label>
              <input type="text" value={form.nomor_whatsapp} onChange={e => setForm({ ...form, nomor_whatsapp: e.target.value })} className="input-field text-xs" placeholder="08xx" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.status_aktif} onChange={e => setForm({ ...form, status_aktif: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">Status Aktif</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ================== JADWAL ASATIZ SUB-SECTION (CRUD for jadwal_mengajar) ==================
function JadwalAsatizSubSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [list, setList] = useState<JadwalMengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data: lembagaList } = useLembaga();

  const [ustazOptions, setUstazOptions] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({
    user_id: '',
    hari: 'Senin',
    jam_mulai: '07:00',
    jam_selesai: '08:30',
    kelas: '',
    pelajaran: '',
    ruangan: '',
    lembaga_id: '',
    guru_pengganti_id: '',
    is_libur: false,
  });

  const isAdmin = profile?.role === 'admin';
  const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

  useEffect(() => { fetchList(); fetchUstaz(); }, []);

  const fetchUstaz = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, nama_lengkap').in('role', ['ustaz', 'operator']).eq('is_active', true).order('nama_lengkap');
      setUstazOptions((data || []).map(p => ({ value: p.id, label: p.nama_lengkap || '-' })));
    } catch (err) {
      // silent
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      let q = supabase.from('jadwal_mengajar').select('*').order('jam_mulai', { ascending: true });
      if (!isAdmin) {
        q = q.eq('user_id', profile?.id || '');
      }
      const { data, error } = await q;
      if (error) throw error;
      setList((data || []) as JadwalMengajar[]);
    } catch (err: any) {
      showToast('Gagal memuat jadwal: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ user_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', kelas: '', pelajaran: '', ruangan: '', lembaga_id: '', guru_pengganti_id: '', is_libur: false });
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    if (!isAdmin && profile) setForm(f => ({ ...f, user_id: profile.id }));
    setShowModal(true);
  };

  const openEdit = (j: JadwalMengajar) => {
    setEditingId(j.id);
    setForm({
      user_id: j.user_id || '',
      hari: j.hari || 'Senin',
      jam_mulai: j.jam_mulai || '07:00',
      jam_selesai: j.jam_selesai || '08:30',
      kelas: j.kelas || '',
      pelajaran: j.pelajaran || '',
      ruangan: j.ruangan || '',
      lembaga_id: j.lembaga_id || '',
      guru_pengganti_id: j.guru_pengganti_id || '',
      is_libur: j.is_libur ?? false,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.kelas || !form.pelajaran || !form.hari) {
      showToast('Ustaz, kelas, pelajaran, dan hari wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        user_id: form.user_id,
        hari: form.hari,
        jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai || null,
        kelas: form.kelas,
        pelajaran: form.pelajaran,
        ruangan: form.ruangan || null,
        lembaga_id: form.lembaga_id || null,
        guru_pengganti_id: form.guru_pengganti_id || null,
        is_libur: form.is_libur,
      };
      if (editingId) {
        if (!isAdmin) {
          const existing = list.find(j => j.id === editingId);
          if (existing && existing.user_id !== profile?.id) {
            showToast('Anda hanya dapat mengedit jadwal milik sendiri', 'error');
            setSaving(false);
            return;
          }
        }
        const { error } = await supabase.from('jadwal_mengajar').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Jadwal diperbarui', 'success');
      } else {
        const { error } = await supabase.from('jadwal_mengajar').insert(payload);
        if (error) throw error;
        showToast('Jadwal ditambahkan', 'success');
      }
      setShowModal(false);
      resetForm();
      fetchList();
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + (err?.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (j: JadwalMengajar) => {
    if (!confirm('Yakin ingin menghapus jadwal ini?')) return;
    try {
      const { error } = await supabase.from('jadwal_mengajar').delete().eq('id', j.id);
      if (error) throw error;
      showToast('Jadwal dihapus', 'success');
      fetchList();
    } catch (err: any) {
      showToast('Gagal menghapus: ' + (err?.message || ''), 'error');
    }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(j => [j.kelas, j.pelajaran, j.hari, j.ruangan].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [list, search]);

  const lembagaOptions = useMemo(() => (lembagaList || []).map((l: Lembaga) => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari jadwal..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs">Tambah</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada jadwal" icon={<Calendar className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(j => {
            const ustazName = ustazOptions.find(o => o.value === j.user_id)?.label || '-';
            const penggantiName = j.guru_pengganti_id ? ustazOptions.find(o => o.value === j.guru_pengganti_id)?.label : undefined;
            const lembagaName = (lembagaList || []).find((l: Lembaga) => l.id === j.lembaga_id)?.nama_lembaga;
            return (
              <div key={j.id} className="card p-2.5 flex items-center gap-2.5 group">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{j.pelajaran} - {j.kelas}</p>
                  <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                    <span className="badge badge-info text-[9px]">{j.hari}</span>
                    <span>{j.jam_mulai?.slice(0, 5)}{j.jam_selesai ? `-${j.jam_selesai.slice(0, 5)}` : ''}</span>
                    <span>•</span>
                    <span className="truncate">{ustazName}</span>
                    {lembagaName && (<><span>•</span><span className="truncate">{lembagaName}</span></>)}
                    {j.is_libur && <span className="text-rose-500">Libur</span>}
                    {penggantiName && <span className="text-violet-500">Pengganti: {penggantiName}</span>}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(j)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(j)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            );
          })}
          <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar'}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ustaz *</label>
              <SearchableSelect
                value={form.user_id}
                onChange={v => setForm({ ...form, user_id: v })}
                options={ustazOptions}
                placeholder="Pilih ustaz"
                icon={<Users className="w-3.5 h-3.5" />}
                disabled={!isAdmin}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Hari *</label>
                <SearchableSelect
                  value={form.hari}
                  onChange={v => setForm({ ...form, hari: v })}
                  options={hariOptions.map(h => ({ value: h, label: h }))}
                  placeholder="Pilih hari"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
                <SearchableSelect
                  value={form.lembaga_id}
                  onChange={v => setForm({ ...form, lembaga_id: v })}
                  options={lembagaOptions}
                  placeholder="Pilih lembaga"
                  icon={<Building2 className="w-3.5 h-3.5" />}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Mulai *</label>
                <input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} className="input-field text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Selesai</label>
                <input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} className="input-field text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelas *</label>
                <input type="text" value={form.kelas} onChange={e => setForm({ ...form, kelas: e.target.value })} className="input-field text-xs" placeholder="Kelas" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Pelajaran *</label>
                <input type="text" value={form.pelajaran} onChange={e => setForm({ ...form, pelajaran: e.target.value })} className="input-field text-xs" placeholder="Mata pelajaran" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ruangan</label>
              <input type="text" value={form.ruangan} onChange={e => setForm({ ...form, ruangan: e.target.value })} className="input-field text-xs" placeholder="Ruangan" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Guru Pengganti</label>
              <SearchableSelect
                value={form.guru_pengganti_id}
                onChange={v => setForm({ ...form, guru_pengganti_id: v })}
                options={ustazOptions}
                placeholder="Pilih guru pengganti (opsional)"
                icon={<User className="w-3.5 h-3.5" />}
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_libur} onChange={e => setForm({ ...form, is_libur: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">Libur</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ================== KELOLA LEMBAGA SUB-SECTION (CRUD for lembaga, admin only) ==================
function KelolaLembagaSubSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const { data: lembagaList, isLoading, refetch } = useLembaga();
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nama_lembaga: '', alamat: '', telepon: '' });

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <div className="text-center">
          <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Kelola Lembaga hanya untuk admin</p>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setForm({ nama_lembaga: '', alamat: '', telepon: '' });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (l: Lembaga) => {
    setEditingId(l.id);
    setForm({ nama_lembaga: l.nama_lembaga || '', alamat: l.alamat || '', telepon: l.telepon || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama_lembaga) {
      showToast('Nama lembaga wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        nama_lembaga: form.nama_lembaga,
        alamat: form.alamat || null,
        telepon: form.telepon || null,
      };
      if (editingId) {
        const { error } = await supabase.from('lembaga').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Lembaga diperbarui', 'success');
      } else {
        payload.user_id = profile?.id;
        const { error } = await supabase.from('lembaga').insert(payload);
        if (error) throw error;
        showToast('Lembaga ditambahkan', 'success');
      }
      setShowModal(false);
      resetForm();
      refetch();
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + (err?.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (l: Lembaga) => {
    if (!confirm(`Yakin ingin menghapus lembaga "${l.nama_lembaga}"?`)) return;
    try {
      const { error } = await supabase.from('lembaga').delete().eq('id', l.id);
      if (error) throw error;
      showToast('Lembaga dihapus', 'success');
      refetch();
    } catch (err: any) {
      showToast('Gagal menghapus: ' + (err?.message || ''), 'error');
    }
  };

  const filtered = useMemo(() => {
    const base = lembagaList || [];
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter((l: Lembaga) => [l.nama_lembaga, l.alamat, l.telepon].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [lembagaList, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari lembaga..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs">Tambah</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada lembaga" icon={<Building2 className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map((l: Lembaga) => (
            <div key={l.id} className="card p-3 group">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{l.nama_lembaga}</p>
                  {l.alamat && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5" /> {l.alamat}
                    </p>
                  )}
                  {l.telepon && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <Phone className="w-2.5 h-2.5" /> {l.telepon}
                    </p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(l)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(l)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Lembaga' : 'Tambah Lembaga'}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Lembaga *</label>
              <input type="text" value={form.nama_lembaga} onChange={e => setForm({ ...form, nama_lembaga: e.target.value })} className="input-field text-xs" placeholder="Nama lembaga" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Alamat</label>
              <textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} className="input-field text-xs" rows={2} placeholder="Alamat lengkap" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Telepon</label>
              <input type="text" value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} className="input-field text-xs" placeholder="08xx" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ================== KENAKALAN SECTION ==================
function KenakalanSection({ kenakalanTab, setKenakalanTab, showToast }: { kenakalanTab: KenakalanTab; setKenakalanTab: (tab: KenakalanTab) => void; showToast: ShowToast }) {
  const [ustazKenakalan, setUstazKenakalan] = useState<KenakalanUstaz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchKenakalanData(); }, []);

  const fetchKenakalanData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      const { data: jadwalToday } = await supabase.from('jadwal').select('user_id').eq('is_active', true).eq('hari', dayName);
      const { data: presensiToday } = await supabase.from('presensi_ustaz').select('guru_id').eq('tanggal', today);
      const { data: izinData } = await supabase.from('izin_mengajar').select('user_id').eq('status', 'disetujui').lte('tanggal_mulai', today).gte('tanggal_selesai', today);

      const sudahPresensiIds = new Set((presensiToday || []).map(p => p.guru_id));
      const izinIds = new Set((izinData || []).map(i => i.user_id));

      const ustazIds = [...new Set((jadwalToday || []).map(j => j.user_id))];
      const ustazNotPresent = ustazIds.filter(id => !sudahPresensiIds.has(id) && !izinIds.has(id));

      if (ustazNotPresent.length > 0) {
        const { data: profilesData } = await supabase.from('profiles').select('id, nama_lengkap, nama_panggilan, foto, nomor_whatsapp').in('id', ustazNotPresent);
        setUstazKenakalan((profilesData || []).map(p => ({
          guru_id: p.id, nama_lengkap: p.nama_lengkap || '-', nama_panggilan: p.nama_panggilan || '-', foto: p.foto || '', nomor_whatsapp: p.nomor_whatsapp || '',
          jumlah_kelas_hari_ini: jadwalToday?.filter(j => j.user_id === p.id).length || 0, jumlah_tidak_hadir: 1
        })));
      } else {
        setUstazKenakalan([]);
      }
    } catch (err) {
      showToast('Gagal memuat data kenakalan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateWA = (phone: string, message: string) => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Kenakalan</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pantau pelanggaran kehadiran</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setKenakalanTab('ustaz')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${kenakalanTab === 'ustaz' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <Users className="w-4 h-4" /> Ustaz
        </button>
        <button onClick={() => setKenakalanTab('murid')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${kenakalanTab === 'murid' ? 'bg-rose-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <GraduationCap className="w-4 h-4" /> Murid
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : kenakalanTab === 'ustaz' ? (
        ustazKenakalan.length === 0 ? (
          <div className="card p-4 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-800 dark:text-slate-100">Tidak ada pelanggaran</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ustazKenakalan.map(ustaz => (
              <div key={ustaz.guru_id} className="card p-3 border-l-2 border-l-rose-500">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{ustaz.nama_lengkap}</p>
                    <p className="text-[9px] text-slate-500">{ustaz.jumlah_kelas_hari_ini} jadwal tidak terisi</p>
                  </div>
                </div>
                {ustaz.nomor_whatsapp && (
                  <a href={generateWA(ustaz.nomor_whatsapp, `Assalamu'alaikum.\n\nBapak/Ibu ${ustaz.nama_lengkap},\n\nBerdasarkan data presensi SIM KBM USTAZ, Bapak/Ibu tercatat tidak hadir mengajar tanpa izin hari ini.\n\nMohon konfirmasi.\n\nTerima kasih.`)} target="_blank" rel="noopener noreferrer" className="btn-primary flex items-center justify-center gap-1.5 text-[10px] py-2 w-full">
                    <MessageCircleWarning className="w-3.5 h-3.5" /> Kirim Peringatan WA
                  </a>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="card p-4 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-800 dark:text-slate-100">Tidak ada pelanggaran murid</p>
        </div>
      )}
    </div>
  );
}
