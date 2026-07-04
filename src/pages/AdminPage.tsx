import { useState, useEffect } from 'react';
import {
  User, Users, Shield, Plus, Trash2, Pencil, CheckCircle, XCircle,
  BookOpen, Calendar, Search, X, Database, GraduationCap, Megaphone,
  Building2, BarChart3,
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

type AdminSection = 'master' | 'akademik';
type MasterTab = 'users' | 'tahun' | 'semester' | 'kelas' | 'mapel' | 'ruangan';
type AkademikTab = 'siswa' | 'ustaz';

const PAGE_SIZE = 8;
const SUPABASE_URL = 'https://intkcrhsinezswldmokr.supabase.co';

export default function AdminPage({
  showToast,
  profile,
  setActiveTab,
}: {
  showToast: ShowToast;
  profile: Profile | null;
  setActiveTab?: (tab: ActiveTab) => void;
}) {
  const [section, setSection] = useState<AdminSection>('master');
  const [masterTab, setMasterTab] = useState<MasterTab>('users');
  const [akademikTab, setAkademikTab] = useState<AkademikTab>('siswa');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Data States
  const [users, setUsers] = useState<Profile[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>([]);
  const [semester, setSemester] = useState<Semester[]>([]);
  const [kelas, setKelas] = useState<any[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [ruangan, setRuangan] = useState<Ruangan[]>([]);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  // Fetch all tahun ajaran for dropdowns
  const [allTahunAjaran, setAllTahunAjaran] = useState<TahunAjaran[]>([]);

  useEffect(() => {
    if (showModal && masterTab === 'semester') {
      supabase.from('tahun_ajaran').select('*').order('tahun', { ascending: false })
        .then(({ data }) => setAllTahunAjaran(data || []));
    }
  }, [showModal, masterTab]);

  useEffect(() => {
    setPage(1);
    fetchData();
  }, [section, masterTab, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      switch (masterTab) {
        case 'users': {
          let queryBuilder = supabase
            .from('profiles')
            .select('*', { count: 'exact' });

          if (searchQuery) {
            queryBuilder = queryBuilder.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
          }

          const { data, error, count } = await queryBuilder
            .order('created_at', { ascending: false })
            .range(start, end);

          if (error) throw error;
          setUsers(data || []);
          setTotalCount(count || 0);
          break;
        }
        case 'tahun': {
          let queryBuilder = supabase
            .from('tahun_ajaran')
            .select('*', { count: 'exact' });

          if (searchQuery) {
            queryBuilder = queryBuilder.ilike('tahun', `%${searchQuery}%`);
          }

          const { data, error, count } = await queryBuilder
            .order('tahun', { ascending: false })
            .range(start, end);

          if (error) throw error;
          setTahunAjaran(data || []);
          setTotalCount(count || 0);
          break;
        }
        case 'semester': {
          let queryBuilder = supabase
            .from('semester')
            .select('*, tahun_ajaran(tahun)', { count: 'exact' });

          if (searchQuery) {
            queryBuilder = queryBuilder.ilike('semester', `%${searchQuery}%`);
          }

          const { data, error, count } = await queryBuilder
            .order('created_at', { ascending: false })
            .range(start, end);

          if (error) throw error;
          setSemester(data || []);
          setTotalCount(count || 0);
          break;
        }
        case 'kelas': {
          let queryBuilder = supabase
            .from('kelas')
            .select('*', { count: 'exact' });

          if (searchQuery) {
            queryBuilder = queryBuilder.ilike('nama', `%${searchQuery}%`);
          }

          const { data, error, count } = await queryBuilder
            .order('tingkat', { ascending: true })
            .order('nama', { ascending: true })
            .range(start, end);

          if (error) throw error;
          setKelas(data || []);
          setTotalCount(count || 0);
          break;
        }
        case 'mapel': {
          let queryBuilder = supabase
            .from('mata_pelajaran')
            .select('*', { count: 'exact' });

          if (searchQuery) {
            queryBuilder = queryBuilder.or(`nama.ilike.%${searchQuery}%,kode.ilike.%${searchQuery}%`);
          }

          const { data, error, count } = await queryBuilder
            .order('kode', { ascending: true })
            .range(start, end);

          if (error) throw error;
          setMataPelajaran(data || []);
          setTotalCount(count || 0);
          break;
        }
        case 'ruangan': {
          let queryBuilder = supabase
            .from('ruangan')
            .select('*', { count: 'exact' });

          if (searchQuery) {
            queryBuilder = queryBuilder.or(`nama.ilike.%${searchQuery}%,kode.ilike.%${searchQuery}%`);
          }

          const { data, error, count } = await queryBuilder
            .order('nama', { ascending: true })
            .range(start, end);

          if (error) throw error;
          setRuangan(data || []);
          setTotalCount(count || 0);
          break;
        }
      }
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      switch (masterTab) {
        case 'users': {
          if (!formData.role || !formData.full_name || !formData.email || (!editingId && !formData.password)) {
            showToast('Semua field harus diisi', 'error');
            return;
          }

          if (editingId) {
            const { error } = await supabase
              .from('profiles')
              .update({
                full_name: formData.full_name,
                role: formData.role,
              })
              .eq('id', editingId);

            if (error) throw error;
            showToast('User berhasil diperbarui', 'success');
          } else {
            const response = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
              body: JSON.stringify({
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
                role: formData.role,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Gagal membuat user');
            }

            showToast('User berhasil dibuat', 'success');
          }
          break;
        }
        case 'tahun': {
          if (!formData.tahun || !formData.status) {
            showToast('Semua field harus diisi', 'error');
            return;
          }
          if (formData.status === 'aktif') {
            await supabase.from('tahun_ajaran').update({ status: 'non-aktif' }).neq('id', editingId || '');
          }
          if (editingId) {
            const { error } = await supabase.from('tahun_ajaran').update({ tahun: formData.tahun, status: formData.status }).eq('id', editingId);
            if (error) throw error;
            showToast('Tahun ajaran berhasil diperbarui', 'success');
          } else {
            const { error } = await supabase.from('tahun_ajaran').insert([{ tahun: formData.tahun, status: formData.status }]);
            if (error) throw error;
            showToast('Tahun ajaran berhasil dibuat', 'success');
          }
          break;
        }
        case 'semester': {
          if (!formData.semester || !formData.status || !formData.tahun_ajaran_id) {
            showToast('Semua field harus diisi', 'error');
            return;
          }
          if (formData.status === 'aktif') {
            await supabase.from('semester').update({ status: 'non-aktif' }).eq('tahun_ajaran_id', formData.tahun_ajaran_id).neq('id', editingId || '');
          }
          if (editingId) {
            const { error } = await supabase.from('semester').update({ semester: formData.semester, status: formData.status, tahun_ajaran_id: formData.tahun_ajaran_id }).eq('id', editingId);
            if (error) throw error;
            showToast('Semester berhasil diperbarui', 'success');
          } else {
            const { error } = await supabase.from('semester').insert([{ semester: formData.semester, status: formData.status, tahun_ajaran_id: formData.tahun_ajaran_id }]);
            if (error) throw error;
            showToast('Semester berhasil dibuat', 'success');
          }
          break;
        }
        case 'kelas': {
          if (!formData.nama || !formData.tingkat || !formData.tipe) {
            showToast('Semua field harus diisi', 'error');
            return;
          }
          if (editingId) {
            const { error } = await supabase.from('kelas').update({ nama: formData.nama, tingkat: parseInt(formData.tingkat), tipe: formData.tipe }).eq('id', editingId);
            if (error) throw error;
            showToast('Kelas berhasil diperbarui', 'success');
          } else {
            const { error } = await supabase.from('kelas').insert([{ nama: formData.nama, tingkat: parseInt(formData.tingkat), tipe: formData.tipe }]);
            if (error) throw error;
            showToast('Kelas berhasil dibuat', 'success');
          }
          break;
        }
        case 'mapel': {
          if (!formData.kode || !formData.nama || !formData.kelompok) {
            showToast('Semua field harus diisi', 'error');
            return;
          }
          if (editingId) {
            const { error } = await supabase.from('mata_pelajaran').update({ kode: formData.kode, nama: formData.nama, kelompok: formData.kelompok }).eq('id', editingId);
            if (error) throw error;
            showToast('Mata pelajaran berhasil diperbarui', 'success');
          } else {
            const { error } = await supabase.from('mata_pelajaran').insert([{ kode: formData.kode, nama: formData.nama, kelompok: formData.kelompok }]);
            if (error) throw error;
            showToast('Mata pelajaran berhasil dibuat', 'success');
          }
          break;
        }
        case 'ruangan': {
          if (!formData.nama || !formData.kode || !formData.kapasitas) {
            showToast('Semua field harus diisi', 'error');
            return;
          }
          if (editingId) {
            const { error } = await supabase.from('ruangan').update({ nama: formData.nama, kode: formData.kode, kapasitas: parseInt(formData.kapasitas) }).eq('id', editingId);
            if (error) throw error;
            showToast('Ruangan berhasil diperbarui', 'success');
          } else {
            const { error } = await supabase.from('ruangan').insert([{ nama: formData.nama, kode: formData.kode, kapasitas: parseInt(formData.kapasitas) }]);
            if (error) throw error;
            showToast('Ruangan berhasil dibuat', 'success');
          }
          break;
        }
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({});
      fetchData();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return;
    setLoading(true);

    try {
      let table = '';
      switch (masterTab) {
        case 'users': table = 'profiles'; break;
        case 'tahun': table = 'tahun_ajaran'; break;
        case 'semester': table = 'semester'; break;
        case 'kelas': table = 'kelas'; break;
        case 'mapel': table = 'mata_pelajaran'; break;
        case 'ruangan': table = 'ruangan'; break;
      }

      if (masterTab === 'users') {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Gagal menghapus user');
        }
        showToast('User berhasil dihapus', 'success');
      } else {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        showToast('Data berhasil dihapus', 'success');
      }

      fetchData();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: any) => {
    if (item) {
      setEditingId(item.id);
      if (masterTab === 'users') {
        setFormData({ role: item.role, full_name: item.full_name, email: item.email });
      } else {
        setFormData({ ...item });
      }
    } else {
      setEditingId(null);
      setFormData({});
    }
    setShowModal(true);
  };

  const renderModalContent = () => {
    switch (masterTab) {
      case 'users':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Peran</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                value={formData.role || ''}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                disabled={!!editingId}
              >
                <option value="">Pilih Peran</option>
                <option value="admin">Admin</option>
                <option value="ustaz">Ustaz</option>
                <option value="siswa">Siswa</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Nama Lengkap"
                value={formData.full_name || ''}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="email@example.com"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingId}
              />
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                  placeholder="••••••••"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            )}
          </div>
        );
      case 'tahun':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Contoh: 2024/2025"
                value={formData.tahun || ''}
                onChange={(e) => setFormData({ ...formData, tahun: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                value={formData.status || ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="">Pilih Status</option>
                <option value="aktif">Aktif</option>
                <option value="non-aktif">Non-Aktif</option>
              </select>
            </div>
          </div>
        );
      case 'semester':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tahun Ajaran</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                value={formData.tahun_ajaran_id || ''}
                onChange={(e) => setFormData({ ...formData, tahun_ajaran_id: e.target.value })}
              >
                <option value="">Pilih Tahun Ajaran</option>
                {allTahunAjaran.map((t) => (
                  <option key={t.id} value={t.id}>{t.tahun}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                value={formData.semester || ''}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value="">Pilih Semester</option>
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                value={formData.status || ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="">Pilih Status</option>
                <option value="aktif">Aktif</option>
                <option value="non-aktif">Non-Aktif</option>
              </select>
            </div>
          </div>
        );
      case 'kelas':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                value={formData.tingkat || ''}
                onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
              >
                <option value="">Pilih Tingkat</option>
                {[7, 8, 9, 10, 11, 12].map((lvl) => (
                  <option key={lvl} value={lvl}>Kelas {lvl}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Kelas</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Contoh: A, B, Unggulan"
                value={formData.nama || ''}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipe Kelas</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                value={formData.tipe || ''}
                onChange={(e) => setFormData({ ...formData, tipe: e.target.value })}
              >
                <option value="">Pilih Tipe</option>
                <option value="Reguler">Reguler</option>
                <option value="Tahfiz">Tahfiz</option>
              </select>
            </div>
          </div>
        );
      case 'mapel':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kode Mapel</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Contoh: MTK-01"
                value={formData.kode || ''}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Mata Pelajaran</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Nama Mapel"
                value={formData.nama || ''}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kelompok</label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                value={formData.kelompok || ''}
                onChange={(e) => setFormData({ ...formData, kelompok: e.target.value })}
              >
                <option value="">Pilih Kelompok</option>
                <option value="Nasional">Nasional</option>
                <option value="Diniyah">Diniyah</option>
                <option value="Muatan Lokal">Muatan Lokal</option>
              </select>
            </div>
          </div>
        );
      case 'ruangan':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kode Ruangan</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Contoh: LAB-01"
                value={formData.kode || ''}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ruangan</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Nama Ruangan"
                value={formData.nama || ''}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kapasitas</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Contoh: 30"
                value={formData.kapasitas || ''}
                onChange={(e) => setFormData({ ...formData, kapasitas: e.target.value })}
              />
            </div>
          </div>
        );
    }
  };

  const renderTableHeader = () => {
    switch (masterTab) {
      case 'users':
        return (
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Peran</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal Dibuat</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
          </tr>
        );
      case 'tahun':
        return (
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
          </tr>
        );
      case 'semester':
        return (
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Semester</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
          </tr>
        );
      case 'kelas':
        return (
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tingkat</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Kelas</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
          </tr>
        );
      case 'mapel':
        return (
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kode</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kelompok</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
          </tr>
        );
      case 'ruangan':
        return (
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kode</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Ruangan</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kapasitas</th>
            <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
          </tr>
        );
    }
  };

  const renderTableRows = () => {
    if (loading && totalCount === 0) {
      return (
        <tr>
          <td colSpan={5} className="text-center py-8">
            <div className="flex justify-center items-center gap-2 text-slate-500">
              <Database className="w-5 h-5 animate-pulse text-emerald-500" />
              <span>Memuat data...</span>
            </div>
          </td>
        </tr>
      );
    }

    if (totalCount === 0) {
      return (
        <tr>
          <td colSpan={5}>
            <EmptyState
              title={`Belum ada data ${masterTab === 'users' ? 'user' : masterTab}`}
              description="Klik tombol Tambah Baru untuk menambahkan data pertama Anda."
              icon={Database}
            />
          </td>
        </tr>
      );
    }

    switch (masterTab) {
      case 'users':
        return users.map((user) => (
          <tr key={user.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                  {user.full_name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-800">{user.full_name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                user.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                user.role === 'ustaz' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}>
                <Shield className="w-3 h-3" />
                {user.role}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end gap-1">
                <button onClick={() => openModal(user)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                {profile?.id !== user.id && (
                  <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ));
      case 'tahun':
        return tahunAjaran.map((t) => (
          <tr key={t.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{t.tahun}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                t.status === 'aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {t.status === 'aktif' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {t.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end gap-1">
                <button onClick={() => openModal(t)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ));
      case 'semester':
        return semester.map((s) => (
          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-600">{(s as any).tahun_ajaran?.tahun}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">Semester {s.semester}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                s.status === 'aktif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'
              }`}>
                {s.status === 'aktif' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {s.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end gap-1">
                <button onClick={() => openModal(s)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ));
      case 'kelas':
        return kelas.map((k) => (
          <tr key={k.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">Tingkat {k.tingkat}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">Kelas {k.tingkat} {k.nama}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                k.tipe === 'Tahfiz' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
              }`}>
                {k.tipe}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end gap-1">
                <button onClick={() => openModal(k)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(k.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ));
      case 'mapel':
        return mataPelajaran.map((m) => (
          <tr key={m.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{m.kode}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{m.nama}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-800">
                {m.kelompok}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end gap-1">
                <button onClick={() => openModal(m)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ));
      case 'ruangan':
        return ruangan.map((r) => (
          <tr key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-500">{r.kode}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">{r.nama}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{r.kapasitas} Kursi</td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end gap-1">
                <button onClick={() => openModal(r)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        ));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm shadow-slate-100/50">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Shield className="w-7 h-7 text-emerald-600" />
            Panel Administrasi
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data master dan konfigurasi akademik sistem.</p>
        </div>

        {/* Section Switcher */}
        <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => setSection('master')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              section === 'master' ? 'bg-white text-emerald-700 shadow-md shadow-slate-200/50' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Data Master
          </button>
          <button
            onClick={() => setSection('akademik')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              section === 'akademik' ? 'bg-white text-emerald-700 shadow-md shadow-slate-200/50' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Akademik
          </button>
        </div>
      </div>

      {section === 'master' ? (
        <>
          {/* Master Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {[
              { id: 'users', label: 'Pengguna', icon: User },
              { id: 'tahun', label: 'Tahun Ajaran', icon: Calendar },
              { id: 'semester', label: 'Semester', icon: Calendar },
              { id: 'kelas', label: 'Kelas', icon: Building2 },
              { id: 'mapel', label: 'Mata Pelajaran', icon: BookOpen },
              { id: 'ruangan', label: 'Ruangan', icon: Building2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = masterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMasterTab(tab.id as MasterTab)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100'
                      : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Control Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Cari ${masterTab}...`}
                className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Add Button */}
            <button
              onClick={() => openModal()}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-100"
            >
              <Plus className="w-4 h-4" />
              Tambah Baru
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm shadow-slate-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/70">
                  {renderTableHeader()}
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {renderTableRows()}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalCount > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-50 bg-slate-50/30">
                <Pagination
                  currentPage={page}
                  totalCount={totalCount}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Data Academic Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setAkademikTab('siswa')}
              className={`flex items-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${akademikTab === 'siswa' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              <GraduationCap className="w-4 h-4" />
              Data Siswa
            </button>
            <button
              onClick={() => setAkademikTab('ustaz')}
              className={`flex items-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all ${akademikTab === 'ustaz' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
              <Users className="w-4 h-4" />
              Data Ustaz
            </button>
          </div>

          {/* Data Akademik Content */}
          {akademikTab === 'siswa' ? <DataSiswaPage showToast={showToast} /> : <DataUstazPage showToast={showToast} />}
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingId(null); }}
        title={editingId ? `Edit Data ${masterTab}` : `Tambah ${masterTab} Baru`}
      >
        <form onSubmit={handleSave} className="space-y-6">
          {renderModalContent()}
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-50">
            <button
              type="button"
              onClick={() => { setShowModal(false); setEditingId(null); }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white text-sm font-bold transition-all shadow-md shadow-emerald-100 flex items-center gap-2"
            >
              {loading ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
