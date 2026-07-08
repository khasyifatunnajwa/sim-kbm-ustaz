import { useState, useEffect, useMemo } from 'react';
import {
  User, Users, Shield, Plus, Trash2, Pencil, CheckCircle, XCircle,
  BookOpen, Calendar, Search, X, Database, GraduationCap, Megaphone,
  Building2, Key, BarChart3, TrendingUp, Clock, AlertCircle, FileText,
  ChevronRight, Settings, LayoutDashboard, Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import type {
  Profile, ShowToast, TahunAjaran, Semester, MataPelajaran, UserRole, KelompokMapel, Ruangan, ActiveTab,
} from '../types';
import DataSiswaPage from './DataSiswaPage';
import DataUstazPage from './DataUstazPage';

type AdminView = 'dashboard' | 'master' | 'akademik' | 'pengumuman';
type MasterTab = 'users' | 'tahun' | 'semester' | 'kelas' | 'mapel' | 'ruangan';
type AkademikTab = 'siswa' | 'ustaz' | 'presensi';

const PAGE_SIZE = 8;

// Dashboard Stats Component
function AdminDashboard({
  users,
  kelasList,
  mapelList,
  profile,
  setActiveTab,
  onViewChange
}: {
  users: Profile[];
  kelasList: any[];
  mapelList: MataPelajaran[];
  profile: Profile | null;
  setActiveTab?: (tab: ActiveTab) => void;
  onViewChange: (view: AdminView) => void;
}) {
  const [todayPresensi, setTodayPresensi] = useState(0);
  const [todayJurnal, setTodayJurnal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      const [presensiRes, jurnalRes] = await Promise.all([
        supabase.from('presensi_ustaz').select('id', { count: 'exact', head: true }).eq('tanggal', today),
        supabase.from('jurnal_kbm').select('id', { count: 'exact', head: true }).eq('tanggal', today),
      ]);
      setTodayPresensi(presensiRes.count || 0);
      setTodayJurnal(jurnalRes.count || 0);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const ustazCount = users.filter(u => u.role === 'ustaz').length;
  const operatorCount = users.filter(u => u.role === 'operator').length;

  const quickActions = [
    { icon: Users, label: 'Kelola User', desc: 'Tambah/edit pengguna', view: 'master' as AdminView, color: 'emerald' },
    { icon: BookOpen, label: 'Data Akademik', desc: 'Siswa & Ustaz', view: 'akademik' as AdminView, color: 'sky' },
    { icon: BarChart3, label: 'Presensi Ustaz', desc: 'Monitor kehadiran', view: 'akademik' as AdminView, tab: 'presensi', color: 'violet' },
    { icon: Megaphone, label: 'Pengumuman', desc: 'Broadcast info', view: 'pengumuman' as AdminView, color: 'amber' },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Dashboard Admin</h2>
            <p className="text-slate-300 text-sm">Selamat datang, {profile?.nama_lengkap || 'Admin'}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{ustazCount}</p>
              <p className="text-xs text-slate-500">Ustaz</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-l-sky-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{operatorCount}</p>
              <p className="text-xs text-slate-500">Operator</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-l-violet-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{kelasList.length}</p>
              <p className="text-xs text-slate-500">Kelas</p>
            </div>
          </div>
        </div>

        <div className="card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{mapelList.length}</p>
              <p className="text-xs text-slate-500">Mapel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Activity className="w-5 h-5 text-emerald-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{todayPresensi}</p>
              <p className="text-xs text-emerald-600">Presensi Hari Ini</p>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="w-5 h-5 text-violet-600" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-700">{todayJurnal}</p>
              <p className="text-xs text-violet-600">Jurnal Hari Ini</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          Menu Utama
        </h3>
        <div className="space-y-2">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            const colorClasses: Record<string, string> = {
              emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
              sky: 'bg-sky-50 text-sky-600 border-sky-100',
              violet: 'bg-violet-50 text-violet-600 border-violet-100',
              amber: 'bg-amber-50 text-amber-600 border-amber-100',
            };
            return (
              <button
                key={i}
                onClick={() => onViewChange(action.view)}
                className={`w-full card p-4 flex items-center gap-4 hover:shadow-md transition-all group text-left border ${colorClasses[action.color]}`}
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage({
  showToast,
  profile,
  setActiveTab,
}: {
  showToast: ShowToast;
  profile: Profile | null;
  setActiveTab?: (tab: ActiveTab) => void;
}) {
  // Initialize view from URL hash
  const [view, setView] = useState<AdminView>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'akademik') return 'akademik';
    if (hashParts[1] === 'master') return 'master';
    if (hashParts[1] === 'pengumuman') return 'pengumuman';
    return 'dashboard';
  });

  const [masterTab, setMasterTab] = useState<MasterTab>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'master' && ['users', 'tahun', 'semester', 'kelas', 'mapel', 'ruangan'].includes(hashParts[2])) {
      return hashParts[2] as MasterTab;
    }
    return 'users';
  });

  const [akademikTab, setAkademikTab] = useState<AkademikTab>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'akademik' && ['siswa', 'ustaz', 'presensi'].includes(hashParts[2])) {
      return hashParts[2] as AkademikTab;
    }
    return 'siswa';
  });

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

  const [userForm, setUserForm] = useState({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', role: 'ustaz' as UserRole, is_active: true });
  const [tahunForm, setTahunForm] = useState({ nama: '', aktif: false });
  const [semesterForm, setSemesterForm] = useState({ nama: '', aktif: false });
  const [kelasForm, setKelasForm] = useState({ nama_kelas: '', tingkat: '1', kode: '' });
  const [mapelForm, setMapelForm] = useState({ nama_mapel: '', kelompok: 'Diniyah' as KelompokMapel, kode: '' });
  const [ruanganForm, setRuanganForm] = useState({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '' });

  const isAdmin = profile?.role === 'admin';

  // Sync URL hash with view changes
  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'admin') {
        if (hashParts[1] === 'akademik') {
          setView('akademik');
          const aTab = ['siswa', 'ustaz', 'presensi'].includes(hashParts[2]) ? hashParts[2] as AkademikTab : 'siswa';
          setAkademikTab(aTab);
        } else if (hashParts[1] === 'master') {
          setView('master');
          const mTab = ['users', 'tahun', 'semester', 'kelas', 'mapel', 'ruangan'].includes(hashParts[2]) ? hashParts[2] as MasterTab : 'users';
          setMasterTab(mTab);
        } else if (hashParts[1] === 'pengumuman') {
          setView('pengumuman');
        } else {
          setView('dashboard');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleViewChange = (newView: AdminView) => {
    setView(newView);
    if (newView === 'dashboard') {
      window.history.pushState(null, '', '#admin');
    } else if (newView === 'master') {
      window.history.pushState(null, '', `#admin/master/${masterTab}`);
    } else if (newView === 'akademik') {
      window.history.pushState(null, '', `#admin/akademik/${akademikTab}`);
    } else if (newView === 'pengumuman' && setActiveTab) {
      setActiveTab('pengumuman');
    }
  };

  const handleMasterTabChange = (newTab: MasterTab) => {
    setMasterTab(newTab);
    window.history.pushState(null, '', `#admin/master/${newTab}`);
  };

  const handleAkademikTabChange = (newTab: AkademikTab) => {
    setAkademikTab(newTab);
    window.history.pushState(null, '', `#admin/akademik/${newTab}`);
  };

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
  }, [masterTab, view]);

  const openAdd = () => {
    setEditingId(null);
    if (masterTab === 'users') setUserForm({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', role: 'ustaz', is_active: true });
    if (masterTab === 'tahun') setTahunForm({ nama: '', aktif: false });
    if (masterTab === 'semester') setSemesterForm({ nama: '', aktif: false });
    if (masterTab === 'kelas') setKelasForm({ nama_kelas: '', tingkat: '1', kode: '' });
    if (masterTab === 'mapel') setMapelForm({ nama_mapel: '', kelompok: 'Diniyah', kode: '' });
    if (masterTab === 'ruangan') setRuanganForm({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (masterTab === 'users') {
        if (editingId) {
          const { error } = await supabase.from('profiles').update({
            nama_lengkap: userForm.nama_lengkap,
            nama_panggilan: userForm.nama_panggilan,
            nomor_whatsapp: userForm.nomor_whatsapp,
            role: userForm.role,
            is_active: userForm.is_active,
          }).eq('id', editingId);
          if (error) throw error;
          showToast('User diperbarui!', 'success');
        } else {
          if (!userForm.nama_panggilan || !userForm.password) {
            showToast('Nama panggilan dan password wajib diisi.', 'error');
            setSaving(false);
            return;
          }
          const usernameManual = userForm.nama_panggilan.toLowerCase().replace(/\s+/g, '');
          const generatedEmail = `${usernameManual}@madrasah.com`;
          const { data: existingData } = await supabase.from('profiles').select('id_login').eq('id_login', usernameManual).maybeSingle();
          if (existingData) {
            showToast(`ID Login "${usernameManual}" sudah digunakan.`, 'error');
            setSaving(false);
            return;
          }
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: generatedEmail,
            password: userForm.password,
            options: { data: { nama_panggilan: userForm.nama_panggilan, nama_lengkap: userForm.nama_lengkap, role: userForm.role } }
          });
          if (authError) throw authError;
          if (authData?.user) {
            await supabase.from('profiles').update({
              id_login: usernameManual,
              nama_panggilan: userForm.nama_panggilan,
              nama_lengkap: userForm.nama_lengkap,
              nomor_whatsapp: userForm.nomor_whatsapp,
              role: userForm.role,
              is_active: userForm.is_active,
            }).eq('id', authData.user.id);
            showToast('User baru berhasil ditambahkan!', 'success');
          }
        }
      } else if (masterTab === 'tahun') {
        const { error } = editingId
          ? await supabase.from('tahun_ajaran').update(tahunForm).eq('id', editingId)
          : await supabase.from('tahun_ajaran').insert(tahunForm);
        if (error) throw error;
        showToast(editingId ? 'Diperbarui!' : 'Ditambahkan!', 'success');
      } else if (masterTab === 'semester') {
        const { error } = editingId
          ? await supabase.from('semester').update(semesterForm).eq('id', editingId)
          : await supabase.from('semester').insert(semesterForm);
        if (error) throw error;
        showToast(editingId ? 'Diperbarui!' : 'Ditambahkan!', 'success');
      } else if (masterTab === 'kelas') {
        const payload = { nama_kelas: kelasForm.nama_kelas, tingkat: kelasForm.tingkat, kode: kelasForm.kode || null, user_id: profile?.id };
        const { error } = editingId
          ? await supabase.from('kelas').update(payload).eq('id', editingId)
          : await supabase.from('kelas').insert(payload);
        if (error) throw error;
        showToast(editingId ? 'Diperbarui!' : 'Ditambahkan!', 'success');
      } else if (masterTab === 'mapel') {
        const payload = { nama_mapel: mapelForm.nama_mapel, kelompok: mapelForm.kelompok, kode: mapelForm.kode || null, user_id: profile?.id };
        const { error } = editingId
          ? await supabase.from('mata_pelajaran').update(payload).eq('id', editingId)
          : await supabase.from('mata_pelajaran').insert(payload);
        if (error) throw error;
        showToast(editingId ? 'Diperbarui!' : 'Ditambahkan!', 'success');
      } else if (masterTab === 'ruangan') {
        const payload = {
          nama_ruangan: ruanganForm.nama_ruangan,
          kode: ruanganForm.kode || null,
          kapasitas: ruanganForm.kapasitas ? Number(ruanganForm.kapasitas) : null,
          keterangan: ruanganForm.keterangan || null,
        };
        const { error } = editingId
          ? await supabase.from('ruangan').update(payload).eq('id', editingId)
          : await supabase.from('ruangan').insert(payload);
        if (error) throw error;
        showToast(editingId ? 'Diperbarui!' : 'Ditambahkan!', 'success');
      }
      setShowModal(false);
      setEditingId(null);
      fetchMasterData();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
    setSaving(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password minimal 6 karakter', 'error');
      return;
    }
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { userId: resetPassId, newPassword: newPassword }
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      showToast('Password berhasil diganti!', 'success');
      setResetPassId(null);
      setNewPassword('');
    } catch (error: any) {
      showToast(error.message || 'Gagal mereset password', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async (id: string) => {
    let table = '';
    if (masterTab === 'mapel') table = 'mata_pelajaran';
    else if (masterTab === 'ruangan') table = 'ruangan';
    else if (masterTab === 'users') table = 'profiles';
    else if (masterTab === 'tahun') table = 'tahun_ajaran';
    else if (masterTab === 'semester') table = 'semester';
    else if (masterTab === 'kelas') table = 'kelas';
    if (!table) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Dihapus', 'info');
    fetchMasterData();
  };

  const openEdit = (item: any) => {
    setEditingId(item.id?.toString() || null);
    if (masterTab === 'users') {
      setUserForm({
        nama_lengkap: item.nama_lengkap || '',
        nama_panggilan: item.nama_panggilan || '',
        nomor_whatsapp: item.nomor_whatsapp || '',
        password: '',
        role: (item.role || 'ustaz') as UserRole,
        is_active: item.is_active ?? true,
      });
    } else if (masterTab === 'tahun') {
      setTahunForm({ nama: item.nama, aktif: item.aktif || false });
    } else if (masterTab === 'semester') {
      setSemesterForm({ nama: item.nama, aktif: item.aktif || false });
    } else if (masterTab === 'kelas') {
      setKelasForm({ nama_kelas: item.nama_kelas, tingkat: item.tingkat?.toString() || '1', kode: item.kode || '' });
    } else if (masterTab === 'mapel') {
      setMapelForm({ nama_mapel: item.nama_mapel, kelompok: item.kelompok || 'Diniyah', kode: item.kode || '' });
    } else if (masterTab === 'ruangan') {
      setRuanganForm({
        nama_ruangan: item.nama_ruangan,
        kode: item.kode || '',
        kapasitas: item.kapasitas?.toString() || '',
        keterangan: item.keterangan || '',
      });
    }
    setShowModal(true);
  };

  const toggleUserActive = async (u: Profile) => {
    const { error } = await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
    if (error) { showToast(error.message, 'error'); return; }
    setUsers(prev => prev.map(item => item.id === u.id ? { ...item, is_active: !u.is_active } : item));
    showToast(u.is_active ? 'User dinonaktifkan' : 'User diaktifkan', 'success');
  };

  const getFilteredList = (): any[] => {
    let list: any[] = [];
    if (masterTab === 'users') list = users;
    else if (masterTab === 'tahun') list = tahunList;
    else if (masterTab === 'semester') list = semesterList;
    else if (masterTab === 'kelas') list = kelasList;
    else if (masterTab === 'mapel') list = mapelList;
    else if (masterTab === 'ruangan') list = ruanganList;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((item: any) => {
        const text = [
          item.nama_lengkap, item.nama_panggilan, item.id_login, item.nama, item.nama_kelas,
          item.nama_mapel, item.nama_ruangan, item.kode, item.kelompok, item.role,
        ].filter(Boolean).join(' ').toLowerCase();
        return text.includes(q);
      });
    }
    return list;
  };

  const filteredList = getFilteredList();
  const totalPages = Math.ceil(filteredList.length / PAGE_SIZE);
  const pagedList = filteredList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Anda tidak memiliki akses ke halaman ini.</p>
        </div>
      </div>
    );
  }

  const masterTabs = [
    { id: 'users' as MasterTab, label: 'Pengguna', count: users.length, icon: Users },
    { id: 'tahun' as MasterTab, label: 'Tahun Ajaran', count: tahunList.length, icon: Calendar },
    { id: 'semester' as MasterTab, label: 'Semester', count: semesterList.length, icon: BookOpen },
    { id: 'kelas' as MasterTab, label: 'Kelas', count: kelasList.length, icon: BookOpen },
    { id: 'mapel' as MasterTab, label: 'Mapel', count: mapelList.length, icon: BookOpen },
    { id: 'ruangan' as MasterTab, label: 'Ruangan', count: ruanganList.length, icon: Building2 },
  ];

  const renderModalContent = () => {
    if (masterTab === 'users') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap</label>
            <input type="text" value={userForm.nama_lengkap} onChange={e => setUserForm(p => ({ ...p, nama_lengkap: e.target.value }))} className="input-field text-sm" placeholder="Nama lengkap" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Panggilan *</label>
              <input type="text" value={userForm.nama_panggilan} onChange={e => setUserForm(p => ({ ...p, nama_panggilan: e.target.value }))} className="input-field text-sm" placeholder="Panggilan" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">No. WA</label>
              <input type="text" value={userForm.nomor_whatsapp} onChange={e => setUserForm(p => ({ ...p, nomor_whatsapp: e.target.value }))} className="input-field text-sm" placeholder="08xxx" />
            </div>
          </div>
          {!editingId && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password *</label>
              <input type="password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} className="input-field text-sm" placeholder="Masukkan password login" required={!editingId} />
              <p className="text-[10px] text-slate-500 mt-1">*ID Login otomatis dibentuk dari nama panggilan</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
              <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value as any }))} className="input-field text-sm">
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
                <option value="ustaz">Ustaz</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select value={userForm.is_active ? 'true' : 'false'} onChange={e => setUserForm(p => ({ ...p, is_active: e.target.value === 'true' }))} className="input-field text-sm">
                <option value="true">Aktif</option>
                <option value="false">Non-aktif</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      );
    }
    if (masterTab === 'tahun') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Tahun Ajaran</label>
            <input type="text" value={tahunForm.nama} onChange={e => setTahunForm(p => ({ ...p, nama: e.target.value }))} className="input-field text-sm" placeholder="2024/2025" required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="aktif" checked={tahunForm.aktif} onChange={e => setTahunForm(p => ({ ...p, aktif: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
            <label htmlFor="aktif" className="text-sm text-slate-600">Tahun ajaran aktif</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      );
    }
    if (masterTab === 'semester') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Semester</label>
            <input type="text" value={semesterForm.nama} onChange={e => setSemesterForm(p => ({ ...p, nama: e.target.value }))} className="input-field text-sm" placeholder="Ganjil" required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="aktif" checked={semesterForm.aktif} onChange={e => setSemesterForm(p => ({ ...p, aktif: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
            <label htmlFor="aktif" className="text-sm text-slate-600">Semester aktif</label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      );
    }
    if (masterTab === 'kelas') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Kelas *</label>
              <input type="text" value={kelasForm.nama_kelas} onChange={e => setKelasForm(p => ({ ...p, nama_kelas: e.target.value }))} className="input-field text-sm" placeholder="1A" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tingkat</label>
              <select value={kelasForm.tingkat} onChange={e => setKelasForm(p => ({ ...p, tingkat: e.target.value }))} className="input-field text-sm">
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kode</label>
            <input type="text" value={kelasForm.kode} onChange={e => setKelasForm(p => ({ ...p, kode: e.target.value }))} className="input-field text-sm" placeholder="Opsional" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      );
    }
    if (masterTab === 'mapel') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Mapel *</label>
              <input type="text" value={mapelForm.nama_mapel} onChange={e => setMapelForm(p => ({ ...p, nama_mapel: e.target.value }))} className="input-field text-sm" placeholder="Fiqih" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelompok</label>
              <select value={mapelForm.kelompok} onChange={e => setMapelForm(p => ({ ...p, kelompok: e.target.value as any }))} className="input-field text-sm">
                <option value="Diniyah">Diniyah</option>
                <option value="Umum">Umum</option>
                <option value="Bahasa">Bahasa</option>
                <option value="Tahfidz">Tahfidz</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kode</label>
            <input type="text" value={mapelForm.kode} onChange={e => setMapelForm(p => ({ ...p, kode: e.target.value }))} className="input-field text-sm" placeholder="Opsional" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      );
    }
    if (masterTab === 'ruangan') {
      return (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Ruangan *</label>
            <input type="text" value={ruanganForm.nama_ruangan} onChange={e => setRuanganForm(p => ({ ...p, nama_ruangan: e.target.value }))} className="input-field text-sm" placeholder="Kelas A, Musholla..." required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kode</label>
              <input type="text" value={ruanganForm.kode} onChange={e => setRuanganForm(p => ({ ...p, kode: e.target.value }))} className="input-field text-sm" placeholder="Opsional" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kapasitas</label>
              <input type="number" value={ruanganForm.kapasitas} onChange={e => setRuanganForm(p => ({ ...p, kapasitas: e.target.value }))} className="input-field text-sm" placeholder="Jumlah siswa" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Keterangan</label>
            <input type="text" value={ruanganForm.keterangan} onChange={e => setRuanganForm(p => ({ ...p, keterangan: e.target.value }))} className="input-field text-sm" placeholder="Opsional" />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      );
    }
    return null;
  };

  const renderListItem = (item: any) => {
    if (masterTab === 'users') {
      const u = item as Profile;
      return (
        <div key={u.id} className="card p-3.5 flex items-center gap-3 group">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm truncate">{u.nama_lengkap || 'User'}</p>
            <div className="flex items-center gap-2">
              <span className={`badge text-[10px] ${u.role === 'admin' ? 'badge-danger' : u.role === 'operator' ? 'badge-warning' : 'badge-success'}`}>{u.role}</span>
              {u.nomor_whatsapp && <span className="text-xs text-slate-400">{u.nomor_whatsapp}</span>}
            </div>
            {u.id_login && <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {u.id_login}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => toggleUserActive(u)} className={`p-1.5 rounded-lg ${u.is_active ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:bg-slate-50'}`}>
              {u.is_active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            </button>
            <button onClick={() => { setResetPassId(u.id); setNewPassword(''); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" title="Ganti Sandi">
              <Key className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }
    if (masterTab === 'tahun') {
      const t = item as TahunAjaran;
      return (
        <div key={t.id} className="card p-3.5 flex items-center gap-3 group">
          <div className={`w-3 h-3 rounded-full ${t.aktif ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className="font-semibold text-slate-800 text-sm flex-1">{t.nama}</span>
          {t.aktif && <span className="badge badge-success text-[10px]">Aktif</span>}
          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
    if (masterTab === 'semester') {
      const s = item as Semester;
      return (
        <div key={s.id} className="card p-3.5 flex items-center gap-3 group">
          <div className={`w-3 h-3 rounded-full ${s.aktif ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          <span className="font-semibold text-slate-800 text-sm flex-1">{s.nama}</span>
          {s.aktif && <span className="badge badge-success text-[10px]">Aktif</span>}
          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }
    if (masterTab === 'kelas') {
      const k = item;
      return (
        <div key={k.id} className="card p-3.5 flex items-center gap-3 group">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm">{k.nama_kelas}</p>
            <span className="text-xs text-slate-400">Tingkat {k.tingkat}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button onClick={() => openEdit(k)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDelete(k.id?.toString() || '')} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }
    if (masterTab === 'mapel') {
      const m = item as MataPelajaran;
      return (
        <div key={m.id} className="card p-3.5 flex items-center gap-3 group">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm">{m.nama_mapel}</p>
            <span className={`badge text-[10px] ${m.kelompok === 'Diniyah' ? 'badge-success' : m.kelompok === 'Umum' ? 'badge-info' : 'badge-warning'}`}>{m.kelompok}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }
    if (masterTab === 'ruangan') {
      const r = item as Ruangan;
      return (
        <div key={r.id} className="card p-3.5 flex items-center gap-3 group">
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
            <Building2 className="w-5 h-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm">{r.nama_ruangan}</p>
            <div className="flex items-center gap-2">
              {r.kode && <span className="text-xs text-slate-400">Kode: {r.kode}</span>}
              {r.kapasitas && <span className="text-xs text-slate-400">Kapasitas: {r.kapasitas}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
            <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Back to Dashboard Button (shown when not on dashboard) */}
      {view !== 'dashboard' && (
        <button
          onClick={() => handleViewChange('dashboard')}
          className="mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Kembali ke Dashboard
        </button>
      )}

      {view === 'dashboard' ? (
        <AdminDashboard
          users={users}
          kelasList={kelasList}
          mapelList={mapelList}
          profile={profile}
          setActiveTab={setActiveTab}
          onViewChange={handleViewChange}
        />
      ) : view === 'master' ? (
        <>
          <div className="mb-5">
            <h2 className="section-title">Master Data</h2>
            <p className="section-subtitle">Kelola data master pengguna, kelas, mapel, dll</p>
          </div>

          {/* Vertical Menu for Master Data */}
          <div className="space-y-2 mb-5">
            {masterTabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleMasterTabChange(t.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all border ${masterTab === t.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${masterTab === t.id ? 'bg-white/20' : 'bg-slate-100'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 text-left">{t.label}</span>
                  <span className={`px-3 py-1 rounded-full text-xs ${masterTab === t.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative mb-4">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Cari..."
              className="input-field text-sm pl-9 pr-9"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button onClick={openAdd} className="btn-primary flex items-center gap-2 mb-4 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            <span>Tambah {masterTabs.find(t => t.id === masterTab)?.label}</span>
          </button>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-16 bg-slate-50 rounded-2xl" />)}</div>
          ) : pagedList.length === 0 ? (
            <EmptyState title="Belum ada data" description="Tambahkan data untuk mulai." />
          ) : (
            <>
              <div className="space-y-2">
                {pagedList.map(item => renderListItem(item))}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </>
      ) : view === 'akademik' ? (
        <>
          <div className="mb-5">
            <h2 className="section-title">Data Akademik</h2>
            <p className="section-subtitle">Kelola data siswa, ustaz, dan presensi</p>
          </div>

          {/* Vertical Menu for Akademik */}
          <div className="space-y-2 mb-5">
            <button
              onClick={() => handleAkademikTabChange('siswa')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all border ${akademikTab === 'siswa' ? 'bg-sky-600 text-white border-sky-600 shadow-lg' : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${akademikTab === 'siswa' ? 'bg-white/20' : 'bg-sky-50'}`}>
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left">Data Siswa</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => handleAkademikTabChange('ustaz')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all border ${akademikTab === 'ustaz' ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${akademikTab === 'ustaz' ? 'bg-white/20' : 'bg-emerald-50'}`}>
                <Users className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left">Data Ustaz</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>

            <button
              onClick={() => handleAkademikTabChange('presensi')}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-bold transition-all border ${akademikTab === 'presensi' ? 'bg-violet-600 text-white border-violet-600 shadow-lg' : 'bg-white text-slate-700 border-slate-100 hover:bg-slate-50'}`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${akademikTab === 'presensi' ? 'bg-white/20' : 'bg-violet-50'}`}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left">Presensi Ustaz</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          </div>

          {akademikTab === 'siswa' && <DataSiswaPage showToast={showToast} />}
          {akademikTab === 'ustaz' && <DataUstazPage showToast={showToast} />}
          {akademikTab === 'presensi' && <PresensiAdminContent showToast={showToast} profile={profile} />}
        </>
      ) : null}

      {/* Modal Utama (Tambah/Edit) */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? `Edit ${masterTabs.find(t => t.id === masterTab)?.label}` : `Tambah ${masterTabs.find(t => t.id === masterTab)?.label}`}
        size="sm"
      >
        {renderModalContent()}
      </Modal>

      {/* Modal Khusus Reset Password */}
      <Modal
        isOpen={!!resetPassId}
        onClose={() => { setResetPassId(null); setNewPassword(''); }}
        title="Ganti Sandi Pengguna"
        size="sm"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password Baru</label>
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input-field text-sm"
              placeholder="Masukkan password baru..."
              required
              minLength={6}
            />
            <p className="text-[10px] text-slate-500 mt-1">Minimal 6 karakter.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => { setResetPassId(null); setNewPassword(''); }} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={isResetting} className="btn-primary flex-1 text-sm">{isResetting ? 'Memproses...' : 'Simpan Sandi'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// Presensi Admin Content Component (embedded)
function PresensiAdminContent({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [loading, setLoading] = useState(true);
  const [allPresensi, setAllPresensi] = useState<any[]>([]);
  const [allGuru, setAllGuru] = useState<Profile[]>([]);
  const [todayStats, setTodayStats] = useState({ hadir: 0, terlambat: 0, belumPresensi: 0, totalGuru: 0, persentase: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const [presensiRes, guruRes] = await Promise.all([
          supabase.from('presensi_ustaz').select('*').order('jam_server', { ascending: false }).limit(100),
          supabase.from('profiles').select('*').eq('is_active', true),
        ]);

        const guruList = (guruRes.data || []).filter(g => g.role !== 'admin');
        setAllGuru(guruList);
        setAllPresensi(presensiRes.data || []);

        const todayPresensi = (presensiRes.data || []).filter((p: any) => p.tanggal === today);
        const hadir = todayPresensi.filter((p: any) => p.status === 'Hadir').length;
        const terlambat = todayPresensi.filter((p: any) => p.status === 'Terlambat').length;
        const totalGuru = guruList.length;
        const sudahPresensi = new Set(todayPresensi.map((p: any) => p.guru_id)).size;
        const belumPresensi = Math.max(0, totalGuru - sudahPresensi);
        const persentase = totalGuru > 0 ? Math.round((sudahPresensi / totalGuru) * 100) : 0;

        setTodayStats({ hadir, terlambat, belumPresensi, totalGuru, persentase });
      } catch (err) {
        console.error(err);
        showToast('Gagal memuat data presensi', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{todayStats.hadir + todayStats.terlambat}</p>
          <p className="text-xs text-slate-500">Presensi Hari Ini</p>
        </div>
        <div className="card p-3 text-center border-l-4 border-l-emerald-500">
          <p className="text-2xl font-bold text-emerald-600">{todayStats.hadir}</p>
          <p className="text-xs text-slate-500">Hadir</p>
        </div>
        <div className="card p-3 text-center border-l-4 border-l-amber-500">
          <p className="text-2xl font-bold text-amber-600">{todayStats.terlambat}</p>
          <p className="text-xs text-slate-500">Terlambat</p>
        </div>
        <div className="card p-3 text-center border-l-4 border-l-rose-500">
          <p className="text-2xl font-bold text-rose-600">{todayStats.belumPresensi}</p>
          <p className="text-xs text-slate-500">Belum</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">Persentase Kehadiran</span>
          <span className="text-lg font-bold text-emerald-600">{todayStats.persentase}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all"
            style={{ width: `${todayStats.persentase}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{todayStats.totalGuru - todayStats.belumPresensi} dari {todayStats.totalGuru} guru sudah presensi</p>
      </div>

      {/* Recent Presensi */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Presensi Terbaru</h3>
        {allPresensi.length === 0 ? (
          <EmptyState title="Belum ada data presensi" description="Presensi akan muncul di sini setelah ustaz melakukan absen" icon={<Clock className="w-8 h-8 text-slate-300" />} />
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allPresensi.slice(0, 20).map((p: any) => {
              const guru = allGuru.find(g => g.id === p.guru_id);
              return (
                <div key={p.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${p.status === 'Hadir' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {p.status === 'Hadir' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{guru?.nama_lengkap || guru?.nama_panggilan || 'Unknown'}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(p.jam_server).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`badge text-[10px] ${p.status === 'Hadir' ? 'badge-success' : 'badge-warning'}`}>{p.status}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
