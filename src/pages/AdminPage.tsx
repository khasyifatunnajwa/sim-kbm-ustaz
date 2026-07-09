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

const PAGE_SIZE = 10;

// ================== THEME TOGGLE ==================
function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeContext();
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all ${isDark ? 'bg-slate-700 text-amber-400 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
      title={isDark ? 'Mode Terang' : 'Mode Gelap'}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}

// ================== DASHBOARD CARDS ==================
function DashboardPresensiUstazCard({ data, loading, onClick }: { data: DashboardPresensiUstaz | null; loading: boolean; onClick: () => void }) {
  if (loading) {
    return <div className="card p-3 animate-pulse"><div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" /></div>;
  }

  const sudahPresensi = (data?.hadir || 0) + (data?.terlambat || 0);
  const persentase = data?.total_guru ? Math.round((sudahPresensi / data.total_guru) * 100) : 0;

  return (
    <button onClick={onClick} className="card p-3 w-full text-left hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Presensi Ustaz</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className="flex items-end gap-3 mb-2">
        <div className="flex-1 grid grid-cols-3 gap-1">
          <div className="text-center py-1">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data?.hadir || 0}</p>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400">Hadir</p>
          </div>
          <div className="text-center py-1">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{data?.terlambat || 0}</p>
            <p className="text-[9px] text-amber-600 dark:text-amber-400">Lambat</p>
          </div>
          <div className="text-center py-1">
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{(data?.total_guru || 0) - sudahPresensi}</p>
            <p className="text-[9px] text-rose-600 dark:text-rose-400">Belum</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{persentase}%</p>
        </div>
      </div>
      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all" style={{ width: `${persentase}%` }} />
      </div>
    </button>
  );
}

function DashboardKelasKosongCard({ data, loading, onClick }: { data: KelasKosong[]; loading: boolean; onClick: () => void }) {
  if (loading) {
    return <div className="card p-3 animate-pulse"><div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" /></div>;
  }

  const jumlahKosong = data?.length || 0;

  return (
    <button onClick={onClick} className={`card p-3 w-full text-left hover:shadow-md transition-all group ${jumlahKosong > 0 ? 'border-l-2 border-l-rose-500' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${jumlahKosong > 0 ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
            <AlertTriangle className={`w-3.5 h-3.5 ${jumlahKosong > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Kelas Kosong</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className="flex items-center gap-3">
        <p className={`text-2xl font-bold ${jumlahKosong > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{jumlahKosong}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{jumlahKosong > 0 ? 'kelas tidak ada ustaz' : 'semua terisi'}</p>
      </div>
    </button>
  );
}

function DashboardPresensiMuridCard({ data, loading, onClick }: { data: PresensiMuridByKelas[]; loading: boolean; onClick: () => void }) {
  if (loading) {
    return <div className="card p-3 animate-pulse"><div className="h-12 bg-slate-200 dark:bg-slate-700 rounded" /></div>;
  }

  const totalHadir = data.reduce((sum, k) => sum + (k.hadir || 0), 0);
  const totalMurid = data.reduce((sum, k) => sum + (k.total_murid || 0), 0);
  const persentase = totalMurid > 0 ? Math.round((totalHadir / totalMurid) * 100) : 0;

  return (
    <button onClick={onClick} className="card p-3 w-full text-left hover:shadow-md transition-all group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Presensi Murid</span>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{persentase}%</p>
          <div className="flex gap-2 text-[9px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600">{totalHadir} hadir</span>
            <span>•</span>
            <span>{totalMurid} total</span>
          </div>
        </div>
        <div className="w-16 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-sky-400 to-sky-600 h-full rounded-full" style={{ width: `${persentase}%` }} />
        </div>
      </div>
    </button>
  );
}

// ================== ADMIN DASHBOARD ==================
function AdminDashboard({ onViewChange, profile, showToast }: { onViewChange: (section: AdminSection) => void; profile: Profile | null; showToast: ShowToast }) {
  const [loading, setLoading] = useState(true);
  const [presensiUstaz, setPresensiUstaz] = useState<DashboardPresensiUstaz | null>(null);
  const [kelasKosong, setKelasKosong] = useState<KelasKosong[]>([]);
  const [presensiMurid, setPresensiMurid] = useState<PresensiMuridByKelas[]>([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: ustazData } = await supabase.from('v_dashboard_presensi_ustaz_hari_ini').select('*').maybeSingle();
      if (ustazData) setPresensiUstaz(ustazData as DashboardPresensiUstaz);

      const { data: muridData } = await supabase.from('v_presensi_murid_by_kelas_hari_ini').select('*');
      if (muridData) setPresensiMurid(muridData as PresensiMuridByKelas[]);

      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      const { data: jadwalData } = await supabase.from('jadwal').select('id, kelas_id, mapel_id, user_id, jam_mulai').eq('is_active', true).eq('hari', dayName);

      if (jadwalData && jadwalData.length > 0) {
        const { data: presensiData } = await supabase.from('presensi_ustaz').select('guru_id').eq('tanggal', today);
        const sudahPresensiIds = new Set((presensiData || []).map(p => p.guru_id));

        const { data: izinData } = await supabase.from('izin_mengajar').select('user_id').eq('status', 'disetujui').lte('tanggal_mulai', today).gte('tanggal_selesai', today);
        const izinIds = new Set((izinData || []).map(i => i.user_id));

        const { data: kelasData } = await supabase.from('kelas').select('id, nama_kelas').eq('is_active', true);
        const { data: mapelData } = await supabase.from('mata_pelajaran').select('id, nama_mapel').eq('is_active', true);
        const { data: profilesData } = await supabase.from('profiles').select('id, nama_lengkap');

        const kelasMap = new Map((kelasData || []).map(k => [k.id, k.nama_kelas]));
        const mapelMap = new Map((mapelData || []).map(m => [m.id, m.nama_mapel]));
        const profilesMap = new Map((profilesData || []).map(p => [p.id, p.nama_lengkap]));

        const kelasKosongList: KelasKosong[] = jadwalData
          .filter(j => !sudahPresensiIds.has(j.user_id) && !izinIds.has(j.user_id))
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
    { icon: Users, label: 'Presensi', section: 'presensi' as AdminSection, color: 'emerald' },
    { icon: Shield, label: 'Kelola User', section: 'kelola-user' as AdminSection, color: 'violet' },
    { icon: BookOpen, label: 'Data Akademik', section: 'data-akademik' as AdminSection, color: 'sky' },
    { icon: AlertTriangle, label: 'Kenakalan', section: 'kenakalan' as AdminSection, color: 'rose' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold truncate">Dashboard Admin</h2>
            <p className="text-slate-300 text-xs truncate">Halo, {profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || 'Admin'}</p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Dashboard Cards - 1 col di HP, 3 col di Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-2">
        <DashboardPresensiUstazCard data={presensiUstaz} loading={loading} onClick={() => onViewChange('presensi')} />
        <DashboardKelasKosongCard data={kelasKosong} loading={loading} onClick={() => onViewChange('presensi')} />
        <DashboardPresensiMuridCard data={presensiMurid} loading={loading} onClick={() => onViewChange('presensi')} />
      </div>

      {/* Quick Menu */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Menu Utama</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {quickMenuItems.map((item, i) => {
            const Icon = item.icon;
            const colors: Record<string, string> = {
              emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
              violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800',
              sky: 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800',
              rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800',
            };
            return (
              <button key={i} onClick={() => onViewChange(item.section)} className={`card p-2.5 flex flex-col items-center gap-1.5 hover:shadow-md transition-all group border ${colors[item.color]}`}>
                <Icon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kelas Kosong Alert */}
      {kelasKosong.length > 0 && (
        <div className="card p-3 border-l-2 border-l-rose-500">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Perhatian: Kelas Kosong</span>
          </div>
          <div className="space-y-1">
            {kelasKosong.slice(0, 3).map((k, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded">
                <span className="text-rose-600 dark:text-rose-400 font-medium w-12">{k.jam_mulai}</span>
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
export default function AdminPage({ showToast, profile, setActiveTab }: { showToast: ShowToast; profile: Profile | null; setActiveTab?: (tab: ActiveTab) => void }) {
  const [section, setSection] = useState<AdminSection>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (['presensi', 'kelola-user', 'data-akademik', 'kenakalan'].includes(hashParts[1])) return hashParts[1] as AdminSection;
    return 'dashboard';
  });

  const [presensiTab, setPresensiTab] = useState<PresensiTab>('ustaz');
  const [kelolaUserTab, setKelolaUserTab] = useState<KelolaUserTab>('users');
  const [dataAkademikTab, setDataAkademikTab] = useState<DataAkademikTab>('siswa');
  const [kenakalanTab, setKenakalanTab] = useState<KenakalanTab>('ustaz');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const [userForm, setUserForm] = useState({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', role: 'ustaz' as UserRole, is_active: true });
  const [tahunForm, setTahunForm] = useState({ nama: '', aktif: false });
  const [semesterForm, setSemesterForm] = useState({ nama: '', aktif: false });
  const [kelasForm, setKelasForm] = useState({ nama_kelas: '', tingkat: '1', kode: '' });
  const [mapelForm, setMapelForm] = useState({ nama_mapel: '', kelompok: 'Diniyah' as KelompokMapel, kode: '' });
  const [ruanganForm, setRuanganForm] = useState({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '' });

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (['dashboard', 'presensi', 'kelola-user', 'data-akademik', 'kenakalan'].includes(hashParts[1])) {
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

      {section === 'dashboard' && <AdminDashboard onViewChange={handleSectionChange} profile={profile} showToast={showToast} />}

      {section === 'presensi' && (
        <PresensiSection presensiTab={presensiTab} setPresensiTab={setPresensiTab} showToast={showToast} profile={profile} kelasList={kelasList} />
      )}

      {section === 'kelola-user' && (
        <KelolaUserSection kelolaUserTab={kelolaUserTab} setKelolaUserTab={setKelolaUserTab} showToast={showToast} profile={profile} users={users} tahunList={tahunList} semesterList={semesterList} kelasList={kelasList} mapelList={mapelList} ruanganList={ruanganList} loading={loading} saving={saving} showModal={showModal} setShowModal={setShowModal} editingId={editingId} setEditingId={setEditingId} search={search} setSearch={setSearch} page={page} setPage={setPage} userForm={userForm} setUserForm={setUserForm} tahunForm={tahunForm} setTahunForm={setTahunForm} semesterForm={semesterForm} setSemesterForm={setSemesterForm} kelasForm={kelasForm} setKelasForm={setKelasForm} mapelForm={mapelForm} setMapelForm={setMapelForm} ruanganForm={ruanganForm} setRuanganForm={setRuanganForm} resetPassId={resetPassId} setResetPassId={setResetPassId} newPassword={newPassword} setNewPassword={setNewPassword} isResetting={isResetting} setIsResetting={setIsResetting} fetchMasterData={fetchMasterData} />
      )}

      {section === 'data-akademik' && (
        <DataAkademikSection dataAkademikTab={dataAkademikTab} setDataAkademikTab={setDataAkademikTab} showToast={showToast} />
      )}

      {section === 'kenakalan' && (
        <KenakalanSection kenakalanTab={kenakalanTab} setKenakalanTab={setKenakalanTab} showToast={showToast} users={users} kelasList={kelasList} />
      )}
    </div>
  );
}

// ================== PRESENSI SECTION ==================
function PresensiSection({ presensiTab, setPresensiTab, showToast, profile, kelasList }: { presensiTab: PresensiTab; setPresensiTab: (tab: PresensiTab) => void; showToast: ShowToast; profile: Profile | null; kelasList: any[] }) {
  const [ustazList, setUstazList] = useState<UstazPresensiList[]>([]);
  const [muridByKelas, setMuridByKelas] = useState<PresensiMuridByKelas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (presensiTab === 'ustaz') fetchUstazPresensi(); else fetchMuridByKelas(); }, [presensiTab]);

  const fetchUstazPresensi = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data: profiles } = await supabase.from('profiles').select('id, nama_lengkap, nama_panggilan, foto, nomor_whatsapp').in('role', ['ustaz', 'operator']).eq('is_active', true).order('nama_lengkap');
      const { data: presensi } = await supabase.from('presensi_ustaz').select('guru_id, status, jam_server').eq('tanggal', today);
      const presensiMap = new Map((presensi || []).map(p => [p.guru_id, p]));

      setUstazList((profiles || []).map(p => {
        const pres = presensiMap.get(p.id);
        return { guru_id: p.id, nama_lengkap: p.nama_lengkap || '-', nama_panggilan: p.nama_panggilan || '-', foto: p.foto || '', nomor_whatsapp: p.nomor_whatsapp || '', sudah_presensi: !!pres, status_presensi: pres?.status || 'Belum Presensi', jam_presensi: pres?.jam_server || '' };
      }));
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMuridByKelas = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('v_presensi_murid_by_kelas_hari_ini').select('*');
      setMuridByKelas((data || []) as PresensiMuridByKelas[]);
    } catch (err) {
      showToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const hadirCount = ustazList.filter(u => u.sudah_presensi).length;
  const belumCount = ustazList.filter(u => !u.sudah_presensi).length;

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Presensi</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pantau kehadiran ustaz dan murid</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setPresensiTab('ustaz')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${presensiTab === 'ustaz' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <Users className="w-4 h-4" /> Ustaz
        </button>
        <button onClick={() => setPresensiTab('murid')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${presensiTab === 'murid' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <GraduationCap className="w-4 h-4" /> Murid
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : presensiTab === 'ustaz' ? (
        <div className="space-y-2">
          <div className="card p-3 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-lg font-bold text-emerald-600">{hadirCount}</p><p className="text-[9px] text-slate-500">Hadir</p></div>
            <div><p className="text-lg font-bold text-rose-600">{belumCount}</p><p className="text-[9px] text-slate-500">Belum</p></div>
            <div><p className="text-lg font-bold text-slate-800 dark:text-slate-100">{ustazList.length}</p><p className="text-[9px] text-slate-500">Total</p></div>
          </div>
          <div className="space-y-1">
            {ustazList.map(ustaz => (
              <UstazPresensiCard key={ustaz.guru_id} ustaz={ustaz} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {muridByKelas.map(kelas => (
            <button key={kelas.kelas_id} className="card p-3 w-full text-left hover:shadow-sm transition-all flex items-center gap-3">
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
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UstazPresensiCard({ ustaz }: { ustaz: UstazPresensiList }) {
  const isHadir = ustaz.status_presensi === 'Hadir';
  const isTerlambat = ustaz.status_presensi === 'Terlambat';

  return (
    <div className="card p-2.5 flex items-center gap-2.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isHadir ? 'bg-emerald-100 dark:bg-emerald-900/30' : isTerlambat ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
        {isHadir ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : isTerlambat ? <Clock className="w-4 h-4 text-amber-600" /> : <User className="w-4 h-4 text-slate-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{ustaz.nama_lengkap}</p>
        <p className="text-[9px] text-slate-500">
          {ustaz.sudah_presensi ? new Date(ustaz.jam_presensi).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Belum presensi'}
        </p>
      </div>
      <span className={`badge text-[9px] ${isHadir ? 'badge-success' : isTerlambat ? 'badge-warning' : 'badge-info'}`}>{ustaz.status_presensi}</span>
    </div>
  );
}

// ================== KELOLA USER SECTION ==================
function KelolaUserSection({ kelolaUserTab, setKelolaUserTab, showToast, profile, users, tahunList, semesterList, kelasList, mapelList, ruanganList, loading, saving, showModal, setShowModal, editingId, setEditingId, search, setSearch, page, setPage, userForm, setUserForm, tahunForm, setTahunForm, semesterForm, setSemesterForm, kelasForm, setKelasForm, mapelForm, setMapelForm, ruanganForm, setRuanganForm, resetPassId, setResetPassId, newPassword, setNewPassword, isResetting, setIsResetting, fetchMasterData }: any) {
  const masterTabs = [
    { id: 'users' as KelolaUserTab, label: 'User', count: users.length, icon: Users },
    { id: 'tahun' as KelolaUserTab, label: 'Tahun', count: tahunList.length, icon: Calendar },
    { id: 'semester' as KelolaUserTab, label: 'Semester', count: semesterList.length, icon: BookOpen },
    { id: 'kelas' as KelolaUserTab, label: 'Kelas', count: kelasList.length, icon: School },
    { id: 'mapel' as KelolaUserTab, label: 'Mapel', count: mapelList.length, icon: BookOpen },
    { id: 'ruangan' as KelolaUserTab, label: 'Ruangan', count: ruanganList.length, icon: Building2 },
  ];

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Kelola User</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pengguna dan data master</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {masterTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setKelolaUserTab(t.id)} className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all border ${kelolaUserTab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-4 h-4" />
              <span className="truncate">{t.label}</span>
              <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] ${kelolaUserTab === t.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 py-2.5 px-3">
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs">Tambah</span>
        </button>
      </div>

      <DataList
        tab={kelolaUserTab}
        data={{ users, tahunList, semesterList, kelasList, mapelList, ruanganList }}
        search={search}
        page={page}
        setPage={setPage}
        onEdit={(item: any) => {
          setEditingId(item.id);
          if (kelolaUserTab === 'users') {
            setUserForm({
              nama_lengkap: item.nama_lengkap || '',
              nama_panggilan: item.nama_panggilan || '',
              nomor_whatsapp: item.nomor_whatsapp || '',
              password: '',
              role: item.role || 'ustaz',
              is_active: item.is_active ?? true
            });
          } else if (kelolaUserTab === 'tahun') {
            setTahunForm({ nama: item.nama || '', aktif: item.aktif ?? false });
          } else if (kelolaUserTab === 'semester') {
            setSemesterForm({ nama: item.nama || '', aktif: item.aktif ?? false });
          } else if (kelolaUserTab === 'kelas') {
            setKelasForm({ nama_kelas: item.nama_kelas || '', tingkat: item.tingkat || '1', kode: item.kode || '' });
          } else if (kelolaUserTab === 'mapel') {
            setMapelForm({ nama_mapel: item.nama_mapel || '', kelompok: item.kelompok || 'Diniyah', kode: item.kode || '' });
          } else if (kelolaUserTab === 'ruangan') {
            setRuanganForm({ nama_ruangan: item.nama_ruangan || '', kode: item.kode || '', kapasitas: item.kapasitas?.toString() || '', keterangan: item.keterangan || '' });
          }
          setShowModal(true);
        }}
        onDelete={async (item: any) => {
          if (!confirm('Yakin ingin menghapus data ini?')) return;
          const tableMap: Record<KelolaUserTab, string> = {
            users: 'profiles', tahun: 'tahun_ajaran', semester: 'semester',
            kelas: 'kelas', mapel: 'mata_pelajaran', ruangan: 'ruangan'
          };
          const { error } = await supabase.from(tableMap[kelolaUserTab]).delete().eq('id', item.id);
          if (error) {
            showToast('Gagal menghapus: ' + error.message, 'error');
          } else {
            showToast('Berhasil dihapus', 'success');
            fetchMasterData();
          }
        }}
      />
    </div>
  );
}

function DataList({ tab, data, search, page, setPage, onEdit, onDelete }: any) {
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
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100">
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
function DataAkademikSection({ dataAkademikTab, setDataAkademikTab, showToast }: { dataAkademikTab: DataAkademikTab; setDataAkademikTab: (tab: DataAkademikTab) => void; showToast: ShowToast }) {
  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Data Akademik</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Kelola siswa dan ustaz</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setDataAkademikTab('siswa')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${dataAkademikTab === 'siswa' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <GraduationCap className="w-4 h-4" /> Siswa
        </button>
        <button onClick={() => setDataAkademikTab('ustaz')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${dataAkademikTab === 'ustaz' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <Users className="w-4 h-4" /> Ustaz
        </button>
      </div>

      {dataAkademikTab === 'siswa' ? <DataSiswaPage showToast={showToast} /> : <DataUstazPage showToast={showToast} />}
    </div>
  );
}

// ================== KENAKALAN SECTION ==================
function KenakalanSection({ kenakalanTab, setKenakalanTab, showToast, users, kelasList }: { kenakalanTab: KenakalanTab; setKenakalanTab: (tab: KenakalanTab) => void; showToast: ShowToast; users: Profile[]; kelasList: any[] }) {
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
