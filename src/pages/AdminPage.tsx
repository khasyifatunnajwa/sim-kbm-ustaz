import { useState, useEffect, useMemo } from 'react';
import {
  User, Users, Shield, Plus, Trash2, Pencil, CheckCircle, XCircle,
  BookOpen, Calendar, Search, X, Database, GraduationCap, Megaphone,
  Building2, Key, BarChart3, TrendingUp, Clock, AlertCircle, FileText,
  ChevronRight, Settings, LayoutDashboard, Activity, AlertTriangle,
  Sun, Moon, UsersRound, UserX, School, MessageCircleWarning,
  RefreshCw, ArrowLeft, Eye, Phone, Send, Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import type {
  Profile, ShowToast, TahunAjaran, Semester, MataPelajaran, UserRole, KelompokMapel, Ruangan, ActiveTab,
  DashboardPresensiUstaz, DashboardPresensiMurid, KelasKosong, UstazPresensiList,
  KenakalanUstaz, KenakalanMurid, PresensiMuridByKelas, UstazDetailPresensi
} from '../types';
import DataSiswaPage from './DataSiswaPage';
import DataUstazPage from './DataUstazPage';
import { useThemeContext } from '../contexts/ThemeContext';

type AdminSection = 'dashboard' | 'presensi' | 'kelola-user' | 'data-akademik' | 'kenakalan';
type PresensiTab = 'ustaz' | 'murid';
type KelolaUserTab = 'users' | 'tahun' | 'semester' | 'kelas' | 'mapel' | 'ruangan';
type DataAkademikTab = 'siswa' | 'ustaz';
type KenakalanTab = 'ustaz' | 'murid';

const PAGE_SIZE = 8;

// ================== THEME TOGGLE COMPONENT ==================
function ThemeToggle() {
  const { resolvedTheme, toggleTheme, isDark } = useThemeContext();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-xl transition-all ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
      title={isDark ? 'Light Mode' : 'Dark Mode'}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

// ================== DASHBOARD CARDS ==================
function DashboardPresensiUstazCard({
  data,
  loading,
  onClick
}: {
  data: DashboardPresensiUstaz | null;
  loading: boolean;
  onClick: () => void;
}) {
  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    );
  }

  const sudahPresensi = (data?.hadir || 0) + (data?.terlambat || 0);
  const persentase = data?.total_guru ? Math.round((sudahPresensi / data.total_guru) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="card p-4 w-full text-left hover:shadow-lg transition-all group border-l-4 border-l-emerald-500"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Presensi Ustaz Hari Ini</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{data?.hadir || 0}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Hadir</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{data?.terlambat || 0}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Terlambat</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{(data?.total_guru || 0) - sudahPresensi}</p>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">Belum</p>
        </div>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all"
          style={{ width: `${persentase}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1 justify-between">
        <span>{persentase}% hadir</span>
        <span className="text-emerald-600 dark:text-emerald-400">{sudahPresensi}/{data?.total_guru || 0} ustaz</span>
      </p>
    </button>
  );
}

function DashboardKelasKosongCard({
  data,
  loading,
  onClick
}: {
  data: KelasKosong[];
  loading: boolean;
  onClick: () => void;
}) {
  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    );
  }

  const jumlahKosong = data?.length || 0;

  return (
    <button
      onClick={onClick}
      className={`card p-4 w-full text-left hover:shadow-lg transition-all group border-l-4 ${jumlahKosong > 0 ? 'border-l-rose-500' : 'border-l-emerald-500'}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${jumlahKosong > 0 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
            <AlertTriangle className={`w-4 h-4 ${jumlahKosong > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Kelas Kosong Hari Ini</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
      </div>

      <p className={`text-4xl font-bold mb-2 ${jumlahKosong > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {jumlahKosong}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {jumlahKosong > 0 ? 'Kelas tanpa presensi & izin' : 'Semua kelas terisi'}
      </p>
    </button>
  );
}

function DashboardPresensiMuridCard({
  data,
  loading,
  onClick
}: {
  data: PresensiMuridByKelas[];
  loading: boolean;
  onClick: () => void;
}) {
  if (loading) {
    return (
      <div className="card p-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    );
  }

  const totalHadir = data.reduce((sum, k) => sum + (k.hadir || 0), 0);
  const totalMurid = data.reduce((sum, k) => sum + (k.total_murid || 0), 0);
  const persentase = totalMurid > 0 ? Math.round((totalHadir / totalMurid) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="card p-4 w-full text-left hover:shadow-lg transition-all group border-l-4 border-l-sky-500"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Presensi Murid Hari Ini</span>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{persentase}%</p>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Kehadiran</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalHadir}/{totalMurid}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Murid</p>
        </div>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-sky-400 to-sky-600 h-full rounded-full transition-all"
          style={{ width: `${persentase}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{data.length} kelas aktif</p>
    </button>
  );
}

// ================== ADMIN DASHBOARD ==================
function AdminDashboard({
  onViewChange,
  profile,
  showToast
}: {
  onViewChange: (section: AdminSection) => void;
  profile: Profile | null;
  showToast: ShowToast;
}) {
  const [loading, setLoading] = useState(true);
  const [presensiUstaz, setPresensiUstaz] = useState<DashboardPresensiUstaz | null>(null);
  const [kelasKosong, setKelasKosong] = useState<KelasKosong[]>([]);
  const [presensiMurid, setPresensiMurid] = useState<PresensiMuridByKelas[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch presensi ustaz stats
      const { data: ustazData } = await supabase
        .from('v_dashboard_presensi_ustaz_hari_ini')
        .select('*')
        .maybeSingle();

      if (ustazData) setPresensiUstaz(ustazData as DashboardPresensiUstaz);

      // Fetch presensi murid by kelas
      const { data: muridData } = await supabase
        .from('v_presensi_murid_by_kelas_hari_ini')
        .select('*');

      if (muridData) setPresensiMurid(muridData as PresensiMuridByKelas[]);

      // Fetch kelas kosong - simplified query
      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      // Get jadwal for today
      const { data: jadwalData } = await supabase
        .from('jadwal')
        .select('id, kelas_id, mapel_id, user_id, jam_mulai, jam_selesai, hari')
        .eq('is_active', true)
        .eq('hari', dayName);

      if (jadwalData && jadwalData.length > 0) {
        // Get guru yang sudah presensi hari ini
        const { data: presensiData } = await supabase
          .from('presensi_ustaz')
          .select('guru_id')
          .eq('tanggal', today);

        const sudahPresensiIds = new Set((presensiData || []).map(p => p.guru_id));

        // Get guru yang izin
        const { data: izinData } = await supabase
          .from('izin_mengajar')
          .select('user_id')
          .eq('status', 'disetujui')
          .lte('tanggal_mulai', today)
          .gte('tanggal_selesai', today);

        const izinIds = new Set((izinData || []).map(i => i.user_id));

        // Get kelas and mapel details
        const { data: kelasData } = await supabase.from('kelas').select('id, nama_kelas').eq('is_active', true);
        const { data: mapelData } = await supabase.from('mata_pelajaran').select('id, nama_mapel').eq('is_active', true);
        const { data: profilesData } = await supabase.from('profiles').select('id, nama_lengkap');

        const kelasMap = new Map((kelasData || []).map(k => [k.id, k.nama_kelas]));
        const mapelMap = new Map((mapelData || []).map(m => [m.id, m.nama_mapel]));
        const profilesMap = new Map((profilesData || []).map(p => [p.id, p.nama_lengkap]));

        const kelasKosongList: KelasKosong[] = [];
        for (const j of jadwalData) {
          if (!sudahPresensiIds.has(j.user_id) && !izinIds.has(j.user_id)) {
            kelasKosongList.push({
              jadwal_id: j.id,
              nama_kelas: kelasMap.get(j.kelas_id) || '-',
              nama_mapel: mapelMap.get(j.mapel_id) || '-',
              nama_guru: profilesMap.get(j.user_id) || '-',
              jam_mulai: j.jam_mulai || '-',
              jam_selesai: j.jam_selesai || '-',
              guru_id: j.user_id,
              lama_belum_presensi: '-'
            });
          }
        }
        setKelasKosong(kelasKosongList);
      } else {
        setKelasKosong([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const quickMenuItems = [
    { icon: Users, label: 'Presensi', desc: 'Ustaz & Murid', section: 'presensi' as AdminSection, color: 'emerald' },
    { icon: Shield, label: 'Kelola User', desc: 'Pengguna & Master Data', section: 'kelola-user' as AdminSection, color: 'violet' },
    { icon: BookOpen, label: 'Data Akademik', desc: 'Siswa & Ustaz', section: 'data-akademik' as AdminSection, color: 'sky' },
    { icon: AlertTriangle, label: 'Kenakalan', desc: 'Pelanggaran & Peringatan', section: 'kenakalan' as AdminSection, color: 'rose' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Dashboard Admin</h2>
            <p className="text-slate-300 text-sm">Selamat datang, {profile?.nama_lengkap || 'Admin'}</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardPresensiUstazCard
          data={presensiUstaz}
          loading={loading}
          onClick={() => onViewChange('presensi')}
        />
        <DashboardKelasKosongCard
          data={kelasKosong}
          loading={loading}
          onClick={() => onViewChange('presensi')}
        />
        <DashboardPresensiMuridCard
          data={presensiMurid}
          loading={loading}
          onClick={() => onViewChange('presensi')}
        />
      </div>

      {/* Quick Menu */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          Menu Utama
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickMenuItems.map((item, i) => {
            const Icon = item.icon;
            const colorClasses: Record<string, string> = {
              emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
              violet: 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800',
              sky: 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
              rose: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
            };
            return (
              <button
                key={i}
                onClick={() => onViewChange(item.section)}
                className={`card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all group text-center border ${colorClasses[item.color]}`}
              >
                <div className="w-10 h-10 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center shadow-sm">
                  <Icon className="w-5 h-5 text-current" />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.label}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kelas Kosong Detail (if any) */}
      {kelasKosong.length > 0 && (
        <div className="card p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Perhatian: Kelas Kosong</h3>
          </div>
          <div className="space-y-2">
            {kelasKosong.slice(0, 3).map((k, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <div className="text-xs text-rose-600 dark:text-rose-400 font-bold">{k.jam_mulai}</div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{k.nama_kelas}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{k.nama_mapel} - {k.nama_guru}</p>
                </div>
              </div>
            ))}
            {kelasKosong.length > 3 && (
              <button
                onClick={() => onViewChange('presensi')}
                className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
              >
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
export default function AdminPage({
  showToast,
  profile,
  setActiveTab,
}: {
  showToast: ShowToast;
  profile: Profile | null;
  setActiveTab?: (tab: ActiveTab) => void;
}) {
  const [section, setSection] = useState<AdminSection>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'presensi') return 'presensi';
    if (hashParts[1] === 'kelola-user') return 'kelola-user';
    if (hashParts[1] === 'data-akademik') return 'data-akademik';
    if (hashParts[1] === 'kenakalan') return 'kenakalan';
    return 'dashboard';
  });

  // All state variables for various sections
  const [presensiTab, setPresensiTab] = useState<PresensiTab>('ustaz');
  const [kelolaUserTab, setKelolaUserTab] = useState<KelolaUserTab>('users');
  const [dataAkademikTab, setDataAkademikTab] = useState<DataAkademikTab>('siswa');
  const [kenakalanTab, setKenakalanTab] = useState<KenakalanTab>('ustaz');

  // Loading and data states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resetPassId, setResetPassId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Data states
  const [users, setUsers] = useState<Profile[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [semesterList, setSemesterList] = useState<Semester[]>([]);
  const [kelasList, setKelasList] = useState<any[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);

  // Form states
  const [userForm, setUserForm] = useState({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', role: 'ustaz' as UserRole, is_active: true });
  const [tahunForm, setTahunForm] = useState({ nama: '', aktif: false });
  const [semesterForm, setSemesterForm] = useState({ nama: '', aktif: false });
  const [kelasForm, setKelasForm] = useState({ nama_kelas: '', tingkat: '1', kode: '' });
  const [mapelForm, setMapelForm] = useState({ nama_mapel: '', kelompok: 'Diniyah' as KelompokMapel, kode: '' });
  const [ruanganForm, setRuanganForm] = useState({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '' });

  const isAdmin = profile?.role === 'admin';

  // Sync with URL
  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'admin') {
        const s = hashParts[1] as AdminSection;
        if (['dashboard', 'presensi', 'kelola-user', 'data-akademik', 'kenakalan'].includes(s)) {
          setSection(s);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSectionChange = (newSection: AdminSection) => {
    setSection(newSection);
    window.history.pushState(null, '', `#admin/${newSection}`);
  };

  // Fetch master data on mount
  useEffect(() => {
    if (isAdmin) fetchMasterData();
  }, [isAdmin]);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [usersRes, tahunRes, semesterRes, kelasRes, mapelRes, ruanganRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('tahun_ajaran').select('*').order('nama'),
        supabase.from('semester').select('*').order('nama'),
        supabase.from('kelas').select('*').eq('is_active', true).order('nama_kelas'),
        supabase.from('mata_pelajaran').select('*').eq('is_active', true).order('nama_mapel'),
        supabase.from('ruangan').select('*').eq('is_active', true).order('nama_ruangan'),
      ]);
      if (usersRes.data) setUsers(usersRes.data as Profile[]);
      if (tahunRes.data) setTahunList(tahunRes.data as TahunAjaran[]);
      if (semesterRes.data) setSemesterList(semesterRes.data as Semester[]);
      if (kelasRes.data) setKelasList(kelasRes.data);
      if (mapelRes.data) setMapelList(mapelRes.data as MataPelajaran[]);
      if (ruanganRes.data) setRuanganList(ruanganRes.data as Ruangan[]);
    } catch (error: any) {
      showToast(error.message, 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    setSearch('');
    setPage(1);
  }, [kelolaUserTab, section]);

  const isAdminSection = section !== 'dashboard';

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      {isAdminSection && (
        <button
          onClick={() => handleSectionChange('dashboard')}
          className="mb-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard
        </button>
      )}

      {/* Dashboard */}
      {section === 'dashboard' && (
        <AdminDashboard
          onViewChange={handleSectionChange}
          profile={profile}
          showToast={showToast}
        />
      )}

      {/* Presensi Section */}
      {section === 'presensi' && (
        <PresensiSection
          presensiTab={presensiTab}
          setPresensiTab={setPresensiTab}
          showToast={showToast}
          profile={profile}
          kelasList={kelasList}
        />
      )}

      {/* Kelola User Section */}
      {section === 'kelola-user' && (
        <KelolaUserSection
          kelolaUserTab={kelolaUserTab}
          setKelolaUserTab={setKelolaUserTab}
          showToast={showToast}
          profile={profile}
          users={users}
          tahunList={tahunList}
          semesterList={semesterList}
          kelasList={kelasList}
          mapelList={mapelList}
          ruanganList={ruanganList}
          loading={loading}
          saving={saving}
          showModal={showModal}
          setShowModal={setShowModal}
          editingId={editingId}
          setEditingId={setEditingId}
          search={search}
          setSearch={setSearch}
          page={page}
          setPage={setPage}
          userForm={userForm}
          setUserForm={setUserForm}
          tahunForm={tahunForm}
          setTahunForm={setTahunForm}
          semesterForm={semesterForm}
          setSemesterForm={setSemesterForm}
          kelasForm={kelasForm}
          setKelasForm={setKelasForm}
          mapelForm={mapelForm}
          setMapelForm={setMapelForm}
          ruanganForm={ruanganForm}
          setRuanganForm={setRuanganForm}
          resetPassId={resetPassId}
          setResetPassId={setResetPassId}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          isResetting={isResetting}
          setIsResetting={setIsResetting}
          fetchMasterData={fetchMasterData}
        />
      )}

      {/* Data Akademik Section */}
      {section === 'data-akademik' && (
        <DataAkademikSection
          dataAkademikTab={dataAkademikTab}
          setDataAkademikTab={setDataAkademikTab}
          showToast={showToast}
        />
      )}

      {/* Kenakalan Section */}
      {section === 'kenakalan' && (
        <KenakalanSection
          kenakalanTab={kenakalanTab}
          setKenakalanTab={setKenakalanTab}
          showToast={showToast}
          users={users}
          kelasList={kelasList}
        />
      )}
    </div>
  );
}

// ================== SUB-COMPONENTS ==================

// Presensi Section
function PresensiSection({
  presensiTab,
  setPresensiTab,
  showToast,
  profile,
  kelasList
}: {
  presensiTab: PresensiTab;
  setPresensiTab: (tab: PresensiTab) => void;
  showToast: ShowToast;
  profile: Profile | null;
  kelasList: any[];
}) {
  const [ustazList, setUstazList] = useState<UstazPresensiList[]>([]);
  const [muridByKelas, setMuridByKelas] = useState<PresensiMuridByKelas[]>([]);
  const [selectedUstazId, setSelectedUstazId] = useState<string | null>(null);
  const [selectedKelasId, setSelectedKelasId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'today' | 'week' | 'month' | 'semester'>('today');

  useEffect(() => {
    if (presensiTab === 'ustaz') {
      fetchUstazPresensi();
    } else {
      fetchMuridByKelas();
    }
  }, [presensiTab]);

  const fetchUstazPresensi = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all ustaz
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nama_lengkap, nama_panggilan, foto, nomor_whatsapp')
        .in('role', ['ustaz', 'operator'])
        .eq('is_active', true)
        .order('nama_lengkap');

      // Get today's presensi
      const { data: presensi } = await supabase
        .from('presensi_ustaz')
        .select('guru_id, status, jam_server')
        .eq('tanggal', today);

      const presensiMap = new Map((presensi || []).map(p => [p.guru_id, p]));

      const list: UstazPresensiList[] = (profiles || []).map(p => {
        const pres = presensiMap.get(p.id);
        return {
          guru_id: p.id,
          nama_lengkap: p.nama_lengkap || '-',
          nama_panggilan: p.nama_panggilan || '-',
          foto: p.foto || '',
          nomor_whatsapp: p.nomor_whatsapp || '',
          sudah_presensi: !!pres,
          status_presensi: pres?.status || 'Belum Presensi',
          jam_presensi: pres?.jam_server || '',
        };
      });

      setUstazList(list);
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMuridByKelas = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('v_presensi_murid_by_kelas_hari_ini')
        .select('*');
      setMuridByKelas((data || []) as PresensiMuridByKelas[]);
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="section-title">Presensi</h2>
        <p className="section-subtitle">Pantau kehadiran ustaz dan murid</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setPresensiTab('ustaz')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${presensiTab === 'ustaz' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          <Users className="w-4 h-4" />
          Presensi Ustaz
        </button>
        <button
          onClick={() => setPresensiTab('murid')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${presensiTab === 'murid' ? 'bg-sky-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          <GraduationCap className="w-4 h-4" />
          Presensi Murid
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : presensiTab === 'ustaz' ? (
        <div className="space-y-3">
          {/* Stats Summary */}
          <div className="card p-4 grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {ustazList.filter(u => u.sudah_presensi).length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sudah Presensi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {ustazList.filter(u => !u.sudah_presensi).length}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Belum Presensi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{ustazList.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Ustaz</p>
            </div>
          </div>

          {/* Ustaz List */}
          <div className="space-y-2">
            {ustazList.map((ustaz) => (
              <UstazPresensiCard
                key={ustaz.guru_id}
                ustaz={ustaz}
                onClick={() => setSelectedUstazId(ustaz.guru_id)}
                isSelected={selectedUstazId === ustaz.guru_id}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Kelas List */}
          <div className="space-y-2">
            {muridByKelas.map((kelas) => (
              <button
                key={kelas.kelas_id}
                onClick={() => setSelectedKelasId(kelas.kelas_id)}
                className="card p-4 w-full text-left hover:shadow-md transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center">
                  <span className="font-bold text-sky-600 dark:text-sky-400">{kelas.nama_kelas}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{kelas.nama_kelas}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    <span className="text-emerald-600 dark:text-emerald-400">{kelas.hadir} hadir</span>
                    <span className="text-amber-600 dark:text-amber-400">{kelas.sakit} sakit</span>
                    <span className="text-slate-600 dark:text-slate-400">{kelas.izin} izin</span>
                    <span className="text-rose-600 dark:text-rose-400">{kelas.alfa} alfa</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{kelas.persentase}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{kelas.hadir}/{kelas.total_murid}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Ustaz Presensi Card
function UstazPresensiCard({
  ustaz,
  onClick,
  isSelected
}: {
  ustaz: UstazPresensiList;
  onClick: () => void;
  isSelected: boolean;
}) {
  const isHadir = ustaz.status_presensi === 'Hadir';
  const isTerlambat = ustaz.status_presensi === 'Terlambat';

  return (
    <button
      onClick={onClick}
      className={`card p-3 w-full text-left flex items-center gap-3 transition-all ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHadir ? 'bg-emerald-100 dark:bg-emerald-900/30' : isTerlambat ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
        {isHadir ? (
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        ) : isTerlambat ? (
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        ) : (
          <User className="w-5 h-5 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{ustaz.nama_lengkap}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {ustaz.sudah_presensi ? new Date(ustaz.jam_presensi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Belum presensi'}
        </p>
      </div>
      <span className={`badge text-[10px] ${isHadir ? 'badge-success' : isTerlambat ? 'badge-warning' : 'badge-info'}`}>
        {ustaz.status_presensi}
      </span>
    </button>
  );
}

// Kelola User Section (continued in next part due to length)
function KelolaUserSection({
  kelolaUserTab, setKelolaUserTab, showToast, profile, users, tahunList, semesterList,
  kelasList, mapelList, ruanganList, loading, saving, showModal, setShowModal,
  editingId, setEditingId, search, setSearch, page, setPage, userForm, setUserForm,
  tahunForm, setTahunForm, semesterForm, setSemesterForm, kelasForm, setKelasForm,
  mapelForm, setMapelForm, ruanganForm, setRuanganForm, resetPassId, setResetPassId,
  newPassword, setNewPassword, isResetting, setIsResetting, fetchMasterData
}: any) {
  const masterTabs = [
    { id: 'users' as KelolaUserTab, label: 'Pengguna', count: users.length, icon: Users },
    { id: 'tahun' as KelolaUserTab, label: 'Tahun Ajaran', count: tahunList.length, icon: Calendar },
    { id: 'semester' as KelolaUserTab, label: 'Semester', count: semesterList.length, icon: BookOpen },
    { id: 'kelas' as KelolaUserTab, label: 'Kelas', count: kelasList.length, icon: School },
    { id: 'mapel' as KelolaUserTab, label: 'Mapel', count: mapelList.length, icon: BookOpen },
    { id: 'ruangan' as KelolaUserTab, label: 'Ruangan', count: ruanganList.length, icon: Building2 },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="section-title">Kelola User</h2>
        <p className="section-subtitle">Kelola pengguna dan data master</p>
      </div>

      {/* Vertical Menu */}
      <div className="space-y-2">
        {masterTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setKelolaUserTab(t.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all border ${kelolaUserTab === t.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${kelolaUserTab === t.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left">{t.label}</span>
              <span className={`px-3 py-1 rounded-full text-xs ${kelolaUserTab === t.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Search and Add */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari..."
            className="input-field text-sm pl-9"
          />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Data List */}
      <DataList
        tab={kelolaUserTab}
        data={{ users, tahunList, semesterList, kelasList, mapelList, ruanganList }}
        search={search}
        page={page}
        onEdit={(item: any) => {
          setEditingId(item.id);
          if (kelolaUserTab === 'users') setUserForm({ nama_lengkap: item.nama_lengkap || '', nama_panggilan: item.nama_panggilan || '', nomor_whatsapp: item.nomor_whatsapp || '', password: '', role: item.role || 'ustaz', is_active: item.is_active ?? true });
          if (kelolaUserTab === 'tahun') setTahunForm({ nama: item.nama, aktif: item.aktif || false });
          if (kelolaUserTab === 'semester') setSemesterForm({ nama: item.nama, aktif: item.aktif || false });
          if (kelolaUserTab === 'kelas') setKelasForm({ nama_kelas: item.nama_kelas, tingkat: item.tingkat?.toString() || '1', kode: item.kode || '' });
          if (kelolaUserTab === 'mapel') setMapelForm({ nama_mapel: item.nama_mapel, kelompok: item.kelompok || 'Diniyah', kode: item.kode || '' });
          if (kelolaUserTab === 'ruangan') setRuanganForm({ nama_ruangan: item.nama_ruangan, kode: item.kode || '', kapasitas: item.kapasitas?.toString() || '', keterangan: item.keterangan || '' });
          setShowModal(true);
        }}
        onDelete={async (id: string) => {
          const tables: Record<KelolaUserTab, string> = { users: 'profiles', tahun: 'tahun_ajaran', semester: 'semester', kelas: 'kelas', mapel: 'mata_pelajaran', ruangan: 'ruangan' };
          const { error } = await supabase.from(tables[kelolaUserTab]).delete().eq('id', id);
          if (error) { showToast(error.message, 'error'); return; }
          showToast('Dihapus', 'info');
          fetchMasterData();
        }}
      />
    </div>
  );
}

// Data List Component
function DataList({ tab, data, search, page, onEdit, onDelete }: any) {
  const list = useMemo(() => {
    let l: any[] = data[tab === 'users' ? 'users' : tab === 'tahun' ? 'tahunList' : tab === 'semester' ? 'semesterList' : tab === 'kelas' ? 'kelasList' : tab === 'mapel' ? 'mapelList' : 'ruanganList'] || [];
    if (search) {
      const q = search.toLowerCase();
      l = l.filter((item: any) => {
        const text = [item.nama_lengkap, item.nama_panggilan, item.nama, item.nama_kelas, item.nama_mapel, item.nama_ruangan, item.kode].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      });
    }
    return l;
  }, [tab, data, search]);

  if (list.length === 0) {
    return <EmptyState title="Tidak ada data" description="Belum ada data atau tidak ada yang cocok dengan pencarian" icon={<Database className="w-8 h-8 text-slate-300 dark:text-slate-600" />} />;
  }

  return (
    <div className="space-y-2">
      {list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any) => (
        <div key={item.id} className="card p-3 flex items-center gap-3 group">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
              {item.nama_lengkap || item.nama || item.nama_kelas || item.nama_mapel || item.nama_ruangan || '-'}
            </p>
            {item.role && <span className="badge badge-info text-[10px]">{item.role}</span>}
            {item.kelompok && <span className="badge badge-success text-[10px] ml-1">{item.kelompok}</span>}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-600">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
      <Pagination currentPage={page} totalPages={Math.ceil(list.length / PAGE_SIZE)} onPageChange={setPage} />
    </div>
  );
}

// Data Akademik Section
function DataAkademikSection({
  dataAkademikTab,
  setDataAkademikTab,
  showToast
}: {
  dataAkademikTab: DataAkademikTab;
  setDataAkademikTab: (tab: DataAkademikTab) => void;
  showToast: ShowToast;
}) {
  return (
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="section-title">Data Akademik</h2>
        <p className="section-subtitle">Kelola data siswa dan ustaz</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setDataAkademikTab('siswa')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${dataAkademikTab === 'siswa' ? 'bg-sky-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          <GraduationCap className="w-4 h-4" />
          Data Siswa
        </button>
        <button
          onClick={() => setDataAkademikTab('ustaz')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${dataAkademikTab === 'ustaz' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          <Users className="w-4 h-4" />
          Data Ustaz
        </button>
      </div>

      {dataAkademikTab === 'siswa' ? <DataSiswaPage showToast={showToast} /> : <DataUstazPage showToast={showToast} />}
    </div>
  );
}

// Kenakalan Section
function KenakalanSection({
  kenakalanTab,
  setKenakalanTab,
  showToast,
  users,
  kelasList
}: {
  kenakalanTab: KenakalanTab;
  setKenakalanTab: (tab: KenakalanTab) => void;
  showToast: ShowToast;
  users: Profile[];
  kelasList: any[];
}) {
  const [ustazKenakalan, setUstazKenakalan] = useState<KenakalanUstaz[]>([]);
  const [muridKenakalan, setMuridKenakalan] = useState<KenakalanMurid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKenakalanData();
  }, []);

  const fetchKenakalanData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      // Get ustaz who have not presenced today
      const { data: jadwalToday } = await supabase
        .from('jadwal')
        .select('user_id')
        .eq('is_active', true)
        .eq('hari', dayName);

      const { data: presensiToday } = await supabase
        .from('presensi_ustaz')
        .select('guru_id')
        .eq('tanggal', today);

      const { data: izinData } = await supabase
        .from('izin_mengajar')
        .select('user_id')
        .eq('status', 'disetujui')
        .lte('tanggal_mulai', today)
        .gte('tanggal_selesai', today);

      const sudahPresensiIds = new Set((presensiToday || []).map(p => p.guru_id));
      const izinIds = new Set((izinData || []).map(i => i.user_id));

      // Get profiles for ustaz who haven't presenced
      const ustazIds = [...new Set((jadwalToday || []).map(j => j.user_id))];
      const ustazNotPresent = ustazIds.filter(id => !sudahPresensiIds.has(id) && !izinIds.has(id));

      if (ustazNotPresent.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, nama_lengkap, nama_panggilan, foto, nomor_whatsapp')
          .in('id', ustazNotPresent);

        const kenakalanList: KenakalanUstaz[] = (profilesData || []).map(p => ({
          guru_id: p.id,
          nama_lengkap: p.nama_lengkap || '-',
          nama_panggilan: p.nama_panggilan || '-',
          foto: p.foto || '',
          nomor_whatsapp: p.nomor_whatsapp || '',
          jumlah_kelas_hari_ini: jadwalToday?.filter(j => j.user_id === p.id).length || 0,
          jumlah_tidak_hadir: 1,
        }));

        setUstazKenakalan(kenakalanList);
      } else {
        setUstazKenakalan([]);
      }

      // For murid, since presensi_murid might be empty, show empty for now
      setMuridKenakalan([]);
    } catch (err) {
      console.error('Error fetching kenakalan:', err);
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
    <div className="space-y-4">
      <div className="mb-5">
        <h2 className="section-title">Kenakalan</h2>
        <p className="section-subtitle">Pantau pelanggaran kehadiran ustaz dan murid</p>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setKenakalanTab('ustaz')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${kenakalanTab === 'ustaz' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          <Users className="w-4 h-4" />
          Kenakalan Ustaz
        </button>
        <button
          onClick={() => setKenakalanTab('murid')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${kenakalanTab === 'murid' ? 'bg-rose-600 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
        >
          <GraduationCap className="w-4 h-4" />
          Kenakalan Murid
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : kenakalanTab === 'ustaz' ? (
        <div className="space-y-4">
          {ustazKenakalan.length === 0 ? (
            <div className="card p-8 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="font_bold text-slate-800 dark:text-slate-100">Tidak ada pelanggaran ustaz</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Semua ustaz sudah melaksanakan tugas dengan baik</p>
            </div>
          ) : (
            ustazKenakalan.map((ustaz) => (
              <div key={ustaz.guru_id} className="card p-4 border-l-4 border-l-rose-500">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100">{ustaz.nama_lengkap}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{ustaz.jumlah_kelas_hari_ini} jadwal hari ini tidak terisi</p>
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold">{ustaz.jumlah_tidak_hadir} kali tidak hadir tanpa izin</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {ustaz.nomor_whatsapp && (
                    <a
                      href={generateWA(ustaz.nomor_whatsapp, `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\nBapak/Ibu ${ustaz.nama_lengkap},\n\nBerdasarkan data presensi SIM KBM USTAZ, Bapak/Ibu tercatat tidak hadir mengajar tanpa izin.\n\nMohon memberikan konfirmasi kepada bagian akademik.\n\nTerima kasih.\nWassalamu'alaikum Warahmatullahi Wabarakatuh.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary flex-1 flex items-center justify-center gap-2 text-xs py-2"
                    >
                      <MessageCircleWarning className="w-4 h-4" />
                      Kirim Peringatan
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="font_bold text-slate-800 dark:text-slate-100">Tidak ada pelanggaran murid</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada murid dengan 3+ alfa dalam seminggu</p>
        </div>
      )}
    </div>
  );
}