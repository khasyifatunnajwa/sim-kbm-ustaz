import { useState, useEffect, useMemo } from 'react';
import {
  User, Users, Shield, Plus, Trash2, Pencil, CheckCircle,
  BookOpen, Calendar, Search, Database, GraduationCap, Megaphone,
  Building2, Clock, FileText,
  ChevronRight, LayoutDashboard, AlertTriangle,
  UsersRound, UserX, School, MessageCircleWarning,
  ArrowLeft, Phone, MapPin,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';
import { useLembaga } from '../hooks/useLembaga';
import type {
  Profile, ShowToast, TahunAjaran, Semester, MataPelajaran, UserRole, KelompokMapel, Ruangan, ActiveTab,
  DashboardPresensiUstaz, KelasKosong,
  KenakalanUstaz,
  PresensiMuridByKelas,
  Lembaga, Murid, JadwalMengajar
} from '../types';
import DataSiswaPage from './DataSiswaPage';
import DataUstazPage from './DataUstazPage';
import AdminPengumuman from './AdminPengumumanPage';

type AdminSection = 'dashboard' | 'presensi' | 'kelola-user' | 'data-akademik' | 'kenakalan' | 'pengumuman'; 
type PresensiTab = 'ustaz' | 'murid';
type PresensiUstazSubTab = 'presensi-ustaz' | 'jadwal-ustaz';
type KelolaUserTab = 'users' | 'tahun' | 'semester' | 'kelas' | 'mapel' | 'ruangan';
type DataAkademikTab = 'siswa' | 'ustaz' | 'data-santri' | 'jadwal-asatiz' | 'kelola-lembaga';
type KenakalanTab = 'ustaz' | 'murid';

const PAGE_SIZE = 10;

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
function AdminDashboard({ onViewChange, profile }: { onViewChange: (section: AdminSection) => void; profile: Profile | null }) {
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
    { icon: Megaphone, label: 'Pengumuman', section: 'pengumuman' as AdminSection, color: 'amber' }, 
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
          <LayoutDashboard className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold truncate">Dashboard Admin</h2>
          <p className="text-slate-300 text-xs truncate">Halo, {profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || 'Admin'}</p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-2">
        <DashboardPresensiUstazCard data={presensiUstaz} loading={loading} onClick={() => onViewChange('presensi')} />
        <DashboardKelasKosongCard data={kelasKosong} loading={loading} onClick={() => onViewChange('presensi')} />
        <DashboardPresensiMuridCard data={presensiMurid} loading={loading} onClick={() => onViewChange('presensi')} />
      </div>

      {/* Quick Menu */}
      <div>
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Menu Utama</p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
          {quickMenuItems.map((item, i) => {
            const Icon = item.icon;
            const colors: Record<string, string> = {
              emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800',
              violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800',
              sky: 'bg-sky-50 dark:bg-sky-900/20 border-sky-100 dark:border-sky-800',
              rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800',
              amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800',
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
export default function AdminPage({ showToast, profile, initialSection, initialSubTab }: { showToast: ShowToast; profile: Profile | null; setActiveTab?: (tab: ActiveTab) => void; initialSection?: string; initialSubTab?: string }) {
  const [section, setSection] = useState<AdminSection>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (initialSection && ['presensi', 'kelola-user', 'data-akademik', 'kenakalan', 'pengumuman'].includes(initialSection)) return initialSection as AdminSection;
    if (['presensi', 'kelola-user', 'data-akademik', 'kenakalan', 'pengumuman'].includes(hashParts[1])) return hashParts[1] as AdminSection;
    return 'dashboard';
  });

  const [presensiTab, setPresensiTab] = useState<PresensiTab>('ustaz');
  const [presensiUstazSubTab, setPresensiUstazSubTab] = useState<PresensiUstazSubTab>(() => {
    if (initialSubTab === 'jadwal-ustaz') return 'jadwal-ustaz';
    return 'presensi-ustaz';
  });
  const [kelolaUserTab, setKelolaUserTab] = useState<KelolaUserTab>('users');
  const [dataAkademikTab, setDataAkademikTab] = useState<DataAkademikTab>(() => {
    if (initialSubTab === 'data-santri') return 'data-santri';
    if (initialSubTab === 'jadwal-asatiz') return 'jadwal-asatiz';
    if (initialSubTab === 'kelola-lembaga') return 'kelola-lembaga';
    return 'siswa';
  });
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
      if (['dashboard', 'presensi', 'kelola-user', 'data-akademik', 'kenakalan', 'pengumuman'].includes(hashParts[1])) {
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

      {section === 'dashboard' && <AdminDashboard onViewChange={handleSectionChange} profile={profile} />}
      {section === 'presensi' && <PresensiSection presensiTab={presensiTab} setPresensiTab={setPresensiTab} presensiUstazSubTab={presensiUstazSubTab} setPresensiUstazSubTab={setPresensiUstazSubTab} showToast={showToast} />}
      {section === 'kelola-user' && <KelolaUserSection kelolaUserTab={kelolaUserTab} setKelolaUserTab={setKelolaUserTab} showToast={showToast} profile={profile} users={users} tahunList={tahunList} semesterList={semesterList} kelasList={kelasList} mapelList={mapelList} ruanganList={ruanganList} loading={loading} saving={saving} showModal={showModal} setShowModal={setShowModal} editingId={editingId} setEditingId={setEditingId} search={search} setSearch={setSearch} page={page} setPage={setPage} userForm={userForm} setUserForm={setUserForm} tahunForm={tahunForm} setTahunForm={setTahunForm} semesterForm={semesterForm} setSemesterForm={setSemesterForm} kelasForm={kelasForm} setKelasForm={setKelasForm} mapelForm={mapelForm} setMapelForm={setMapelForm} ruanganForm={ruanganForm} setRuanganForm={setRuanganForm} resetPassId={resetPassId} setResetPassId={setResetPassId} newPassword={newPassword} setNewPassword={setNewPassword} isResetting={isResetting} setIsResetting={setIsResetting} fetchMasterData={fetchMasterData} />}
      {section === 'data-akademik' && <DataAkademikSection dataAkademikTab={dataAkademikTab} setDataAkademikTab={setDataAkademikTab} showToast={showToast} profile={profile} />}
      {section === 'kenakalan' && <KenakalanSection kenakalanTab={kenakalanTab} setKenakalanTab={setKenakalanTab} showToast={showToast} />}
      {section === 'pengumuman' && <AdminPengumuman showToast={showToast} />}
    </div>
  );
}

// ================== PRESENSI SECTION ==================
function PresensiSection({ presensiTab, setPresensiTab, presensiUstazSubTab, setPresensiUstazSubTab, showToast }: { presensiTab: PresensiTab; setPresensiTab: (tab: PresensiTab) => void; presensiUstazSubTab: PresensiUstazSubTab; setPresensiUstazSubTab: (tab: PresensiUstazSubTab) => void; showToast: ShowToast }) {
  const [muridByKelas, setMuridByKelas] = useState<PresensiMuridByKelas[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (presensiTab === 'murid') fetchMuridByKelas(); }, [presensiTab]);

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

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : presensiTab === 'ustaz' ? (
        presensiUstazSubTab === 'presensi-ustaz' ? (
          <PresensiUstazDetailSubTab showToast={showToast} />
        ) : (
          <JadwalUstazHariIniSubTab showToast={showToast} />
        )
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
      const lembagaMap = new Map((lembagaData || []).map(l => [l.id, l.nama_lembaga]));

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
      const lembagaMap = new Map((lembagaRes.data || []).map(l => [l.id, l.nama_lembaga]));
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
function KelolaUserSection({ kelolaUserTab, setKelolaUserTab, showToast, users, tahunList, semesterList, kelasList, mapelList, ruanganList, search, setSearch, page, setPage, setShowModal, setEditingId, setUserForm, setTahunForm, setSemesterForm, setKelasForm, setMapelForm, setRuanganForm, fetchMasterData }: any) {
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
          const { error } = await supabase.from(tableMap[kelolaUserTab as KelolaUserTab]).delete().eq('id', item.id);
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

  const lembagaOptions = useMemo(() => (lembagaList || []).map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

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

  const lembagaOptions = useMemo(() => (lembagaList || []).map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

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
            const lembagaName = (lembagaList || []).find(l => l.id === j.lembaga_id)?.nama_lembaga;
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
    return base.filter(l => [l.nama_lembaga, l.alamat, l.telepon].filter(Boolean).join(' ').toLowerCase().includes(q));
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
          {filtered.map(l => (
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
