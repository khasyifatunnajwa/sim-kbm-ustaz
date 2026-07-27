import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Shield, Plus, Pencil, Trash2, Search, KeyRound, Lock, UserCog, CheckCircle, AtSign, Hash,
  Upload, Download, X, AlertCircle, FileText, RefreshCw, CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { useConfirm } from '../../hooks/useConfirm';
import { useSettings } from '../../store/useSettings';
import type { ShowToast, Profile, UserRole, BolehMengajar } from '../../types';

type DataScope = 'nama' | 'nama-id' | 'nama-id-password' | 'lengkap';

const SCOPE_OPTIONS: { value: DataScope; label: string; desc: string }[] = [
  { value: 'nama', label: 'Nama', desc: 'Hanya nama lengkap & panggilan' },
  { value: 'nama-id', label: 'Nama + ID', desc: 'Nama beserta ID Login' },
  { value: 'nama-id-password', label: 'Nama + ID + Password', desc: 'Nama, ID Login, dan kata sandi' },
  { value: 'lengkap', label: 'Data Lengkap', desc: 'Semua field termasuk role, WA, gender' },
];

const EXPORT_COLUMNS: Record<DataScope, string[]> = {
  'nama': ['nama_lengkap', 'nama_panggilan'],
  'nama-id': ['nama_lengkap', 'nama_panggilan', 'id_login'],
  'nama-id-password': ['nama_lengkap', 'nama_panggilan', 'id_login', 'password'],
  'lengkap': ['nama_lengkap', 'nama_panggilan', 'id_login', 'password', 'nomor_whatsapp', 'role', 'roles', 'jenis_kelamin', 'boleh_mengajar', 'is_active'],
};

const PAGE_SIZE = 10;

type UserTab = 'semua' | 'ustaz' | 'admin' | 'operator' | 'hak-akses';

const ALL_ROLES: UserRole[] = ['admin', 'operator', 'ustaz'];

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  operator: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  ustaz: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

function generateIdLoginPreview(namaPanggilan: string, namaLengkap: string): string {
  const source = namaPanggilan.trim() || namaLengkap.split(' ')[0];
  return source
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20) || '';
}

export default function KelolaUserSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const { confirm, dialog } = useConfirm();
  const { settings } = useSettings();
  const [tab, setTab] = useState<UserTab>('semua');
  const [list, setList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [resetPassId, setResetPassId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  // Import / Export state
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportScope, setExportScope] = useState<DataScope>('nama-id');
  const [importScope, setImportScope] = useState<DataScope>('nama-id-password');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importResult, setImportResult] = useState<{ success: number; failed: number; results: any[] } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nama_lengkap: '',
    nama_panggilan: '',
    nomor_whatsapp: '',
    password: '',
    roles: ['ustaz'] as UserRole[],
    is_active: true,
    jenis_kelamin: '' as 'L' | 'P' | '',
    boleh_mengajar: '' as BolehMengajar | '',
  });

  // Derived: preview of auto-generated id_login & email
  const idLoginPreview = generateIdLoginPreview(form.nama_panggilan, form.nama_lengkap);
  const emailPreview = idLoginPreview ? `${idLoginPreview}@simkbm.local` : '';

  const tabs = [
    { id: 'semua' as UserTab, label: 'Semua', icon: Users },
    { id: 'ustaz' as UserTab, label: 'Ustaz', icon: Users },
    { id: 'admin' as UserTab, label: 'Admin', icon: Shield },
    { id: 'operator' as UserTab, label: 'Operator', icon: UserCog },
    { id: 'hak-akses' as UserTab, label: 'Hak Akses', icon: Lock },
  ];

  useEffect(() => { fetchList(); }, [tab]);

  const fetchList = async () => {
    setLoading(true);
    try {
      let q = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (tab === 'ustaz') q = q.eq('role', 'ustaz');
      else if (tab === 'admin') q = q.eq('role', 'admin');
      else if (tab === 'operator') q = q.eq('role', 'operator');
      else if (tab === 'hak-akses') { setLoading(false); return; }
      const { data, error } = await q;
      if (error) throw error;
      setList((data || []) as Profile[]);
    } catch (err: any) {
      showToast('Gagal memuat data: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const defaultRoles: UserRole[] = tab === 'admin' ? ['admin'] : tab === 'operator' ? ['operator'] : ['ustaz'];
    setForm({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', roles: defaultRoles, is_active: true, jenis_kelamin: '', boleh_mengajar: '' });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (u: Profile) => {
    setEditingId(u.id);
    const existingRoles: UserRole[] = Array.isArray((u as any).roles) && (u as any).roles.length > 0
      ? (u as any).roles
      : [u.role || 'ustaz'];
    setForm({
      nama_lengkap: u.nama_lengkap || '',
      nama_panggilan: u.nama_panggilan || '',
      nomor_whatsapp: u.nomor_whatsapp || '',
      password: '',
      roles: existingRoles,
      is_active: u.is_active ?? true,
      jenis_kelamin: u.jenis_kelamin || '',
      boleh_mengajar: u.boleh_mengajar || '',
    });
    setShowModal(true);
  };

  const toggleRole = (r: UserRole) => {
    setForm(prev => {
      const has = prev.roles.includes(r);
      const next = has ? prev.roles.filter(x => x !== r) : [...prev.roles, r];
      return { ...prev, roles: next.length > 0 ? next : [r] };
    });
  };

  const primaryRole = (roles: UserRole[]): UserRole => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('operator')) return 'operator';
    return 'ustaz';
  };

  const handleSave = async () => {
    if (!form.nama_lengkap) { showToast('Nama lengkap wajib diisi', 'error'); return; }
    if (form.roles.length === 0) { showToast('Pilih minimal satu jabatan', 'error'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const primRole = primaryRole(form.roles);
        const payload: any = {
          nama_lengkap: form.nama_lengkap,
          nama_panggilan: form.nama_panggilan || form.nama_lengkap.split(' ')[0],
          nomor_whatsapp: form.nomor_whatsapp || null,
          role: primRole,
          roles: form.roles,
          is_active: form.is_active,
          jenis_kelamin: form.jenis_kelamin || null,
          boleh_mengajar: form.boleh_mengajar || null,
        };
        const { error } = await supabase.from('profiles').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('User diperbarui', 'success');
      } else {
        // Create via edge function (needs service role – cannot use client-side auth admin API)
        if (!form.password) { showToast('Password wajib diisi untuk user baru', 'error'); setSaving(false); return; }
        if (form.password.length < 6) { showToast('Password minimal 6 karakter', 'error'); setSaving(false); return; }

        const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
          body: {
            action: 'create',
            nama_lengkap: form.nama_lengkap,
            nama_panggilan: form.nama_panggilan,
            nomor_whatsapp: form.nomor_whatsapp || null,
            password: form.password,
            roles: form.roles,
            is_active: form.is_active,
            jenis_kelamin: form.jenis_kelamin || null,
            boleh_mengajar: form.boleh_mengajar || null,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (fnData?.error) throw new Error(fnData.error);

        const preview = fnData?.user?.id_login || idLoginPreview;
        showToast(`User ditambahkan — Login: ${preview}`, 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + (err?.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: Profile) => {
    if (!(await confirm({ title: 'Hapus User', message: 'Apakah Anda yakin ingin menghapus user ini?', itemName: u.nama_lengkap, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', u.id);
      if (error) throw error;
      showToast('User dihapus', 'success');
      fetchList();
    } catch (err: any) {
      showToast('Gagal menghapus: ' + (err?.message || ''), 'error');
    }
  };

  const handleToggleActive = async (u: Profile) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
      if (error) throw error;
      showToast(u.is_active ? 'User dinonaktifkan' : 'User diaktifkan', 'success');
      fetchList();
    } catch (err: any) {
      showToast('Gagal mengubah status: ' + (err?.message || ''), 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassId || !newPassword) { showToast('Password baru wajib diisi', 'error'); return; }
    if (newPassword.length < 6) { showToast('Password minimal 6 karakter', 'error'); return; }
    setIsResetting(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
        body: { action: 'reset-password', user_id: resetPassId, new_password: newPassword },
      });
      if (fnError) throw new Error(fnError.message);
      if (fnData?.error) throw new Error(fnData.error);
      showToast('Password berhasil direset', 'success');
      setShowResetModal(false); setResetPassId(null); setNewPassword('');
    } catch (err: any) {
      showToast('Gagal reset password: ' + (err?.message || ''), 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(u => [u.nama_lengkap, u.nama_panggilan, u.nomor_whatsapp, u.role, (u as any).id_login].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [list, search]);

  // ===== EXPORT HANDLER =====
  const handleExportCSV = () => {
    if (filtered.length === 0) { showToast('Tidak ada data untuk diekspor', 'error'); return; }
    const columns = EXPORT_COLUMNS[exportScope];
    const header = columns.join(',');
    const rows = filtered.map(u => {
      return columns.map(col => {
        let val: any;
        if (col === 'password') {
          val = '********';
        } else if (col === 'roles') {
          const r = Array.isArray((u as any).roles) && (u as any).roles.length > 0 ? (u as any).roles : [u.role];
          val = r.join(';');
        } else if (col === 'is_active') {
          val = u.is_active ? 'Aktif' : 'Non-aktif';
        } else {
          val = (u as any)[col] ?? '';
        }
        return `"${String(val ?? '').replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_user_${exportScope}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`CSV berhasil diunduh (${filtered.length} user)`, 'success');
    setShowExportModal(false);
  };

  const downloadImportTemplate = () => {
    const columns = EXPORT_COLUMNS[importScope];
    const header = columns.join(',');
    let example = '';
    if (importScope === 'nama') {
      example = 'Ahmad Fauzi,Fauzi';
    } else if (importScope === 'nama-id') {
      example = 'Ahmad Fauzi,Fauzi,fauzi';
    } else if (importScope === 'nama-id-password') {
      example = 'Ahmad Fauzi,Fauzi,fauzi,rahasia123';
    } else {
      example = 'Ahmad Fauzi,Fauzi,fauzi,rahasia123,0812345678,ustaz,ustaz,L,Banin,Aktif';
    }
    const csv = '\uFEFF' + header + '\n' + example;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_import_user_${importScope}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template CSV berhasil diunduh', 'success');
  };

  // ===== IMPORT HANDLER =====
  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.replace(/^\uFEFF/, '').split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Simple CSV parser supporting quoted fields
      const vals: string[] = [];
      let cur = '';
      let inQuote = false;
      const line = lines[i];
      for (let j = 0; j < line.length; j++) {
        const ch = line[j];
        if (ch === '"') {
          if (inQuote && line[j + 1] === '"') { cur += '"'; j++; }
          else { inQuote = !inQuote; }
        } else if (ch === ',' && !inQuote) {
          vals.push(cur.trim());
          cur = '';
        } else {
          cur += ch;
        }
      }
      vals.push(cur.trim());
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });
      rows.push(obj);
    }
    return rows;
  };

  const handleImportFile = (file: File) => {
    setImportFile(file);
    setImportError('');
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || '';
        const rows = parseCSV(text);
        if (rows.length === 0) { setImportError('File CSV kosong atau tidak memiliki data'); setImportPreview([]); return; }
        const columns = EXPORT_COLUMNS[importScope];
        const missing = columns.filter(c => !rows[0][c] && rows[0][c] !== '');
        // Validate header presence
        const firstRowKeys = Object.keys(rows[0]);
        const hasAllCols = columns.every(c => firstRowKeys.includes(c));
        if (!hasAllCols) {
          setImportError(`Kolom tidak sesuai. Diperlukan: ${columns.join(', ')}. Ditemukan: ${firstRowKeys.join(', ')}`);
          setImportPreview([]);
          return;
        }
        setImportPreview(rows.slice(0, 5));
      } catch {
        setImportError('Gagal membaca file CSV');
        setImportPreview([]);
      }
    };
    reader.onerror = () => setImportError('Gagal membaca file');
    reader.readAsText(file);
  };

  const handleImportSubmit = async () => {
    if (!importFile || importPreview.length === 0) { showToast('Pilih file CSV terlebih dahulu', 'error'); return; }
    setImporting(true);
    setImportError('');
    setImportResult(null);
    try {
      const reader = new FileReader();
      await new Promise<void>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const text = (e.target?.result as string) || '';
            const rows = parseCSV(text);
            const columns = EXPORT_COLUMNS[importScope];
            // Normalize rows: ensure all expected keys exist
            const users = rows.map(r => {
              const obj: Record<string, string> = {};
              columns.forEach(c => { obj[c] = (r[c] ?? '').trim(); });
              return obj;
            });
            const { data: fnData, error: fnError } = await supabase.functions.invoke('create-user', {
              body: { action: 'bulk-create', users },
            });
            if (fnError) throw new Error(fnError.message);
            if (fnData?.error) throw new Error(fnData.error);
            setImportResult({
              success: fnData.success_count ?? 0,
              failed: fnData.failed_count ?? 0,
              results: fnData.results ?? [],
            });
            showToast(fnData.message || 'Import selesai', 'success');
            fetchList();
            resolve();
          } catch (err: any) { reject(err); }
        };
        reader.onerror = () => reject(new Error('Gagal membaca file'));
        reader.readAsText(importFile);
      });
    } catch (err: any) {
      setImportError(err?.message || 'Gagal mengimpor data');
      showToast('Gagal mengimpor: ' + (err?.message || ''), 'error');
    } finally {
      setImporting(false);
    }
  };

  const resetImportState = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportError('');
    setImportResult(null);
  };

  const hakAksesInfo = [
    { label: 'Admin', value: 'admin', desc: 'Akses penuh: kelola user, data master, laporan, pengumuman', color: 'rose' },
    { label: 'Operator', value: 'operator', desc: 'Input data dan bantu administrasi harian', color: 'sky' },
    { label: 'Ustaz', value: 'ustaz', desc: 'Akses fitur KBM: jadwal, absensi, jurnal, nilai, presensi', color: 'amber' },
  ];

  const showGenderFields = settings.genderEnabled && form.roles.includes('ustaz');

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Kelola User</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Data ustaz, admin, operator, dan hak akses</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setPage(1); }}
              className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border flex-shrink-0 ${tab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'hak-akses' ? (
        <div className="space-y-2">
          {hakAksesInfo.map((r, i) => (
            <div key={i} className="card p-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-${r.color}-100 dark:bg-${r.color}-900/30`}>
                <Shield className={`w-4 h-4 text-${r.color}-600 dark:text-${r.color}-400`} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{r.label}</p>
                <p className="text-[10px] text-slate-400">{r.desc}</p>
              </div>
              <span className="badge badge-info text-[9px]">{r.value}</span>
            </div>
          ))}
          <div className="card p-3 bg-slate-50 dark:bg-slate-700/50">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Satu orang dapat memiliki lebih dari satu jabatan (contoh: Admin + Ustaz). Jabatan utama ditentukan berdasarkan prioritas tertinggi: Admin &gt; Operator &gt; Ustaz.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, login ID..." className="input-field text-xs pl-8" />
            </div>
            <button onClick={() => setShowImportModal(true)} className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-200 hover:bg-sky-100 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Import CSV
            </button>
            <button onClick={() => setShowExportModal(true)} className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs">
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Tidak ada data user" icon={<Users className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-1">
              {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(u => {
                const uRoles: UserRole[] = Array.isArray((u as any).roles) && (u as any).roles.length > 0
                  ? (u as any).roles
                  : [u.role];
                return (
                  <div key={u.id} className="card p-2.5 flex items-center gap-2.5 group">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {u.foto ? <img src={u.foto} alt={u.nama_lengkap} className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{u.nama_lengkap}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {uRoles.map(r => (
                          <span key={r} className={`badge text-[9px] ${ROLE_COLORS[r] || 'badge-info'}`}>{r}</span>
                        ))}
                        {(u as any).id_login && (
                          <span className="text-[9px] text-slate-400 font-mono">@{(u as any).id_login}</span>
                        )}
                        {u.nomor_whatsapp && <span className="text-[9px] text-slate-400 truncate">{u.nomor_whatsapp}</span>}
                        {u.is_active === false && <span className="text-[9px] text-rose-500 font-semibold">Non-aktif</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setResetPassId(u.id); setShowResetModal(true); }} className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600" title="Reset Password"><KeyRound className="w-3 h-3" /></button>
                      <button onClick={() => handleToggleActive(u)} className="p-1.5 rounded hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-400 hover:text-sky-600" title="Aktif/Nonaktif"><Lock className="w-3 h-3" /></button>
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(u)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })}
              <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit User' : 'Tambah User Baru'}>
          <div className="space-y-3">

            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Lengkap *</label>
              <input type="text" value={form.nama_lengkap} onChange={e => setForm({ ...form, nama_lengkap: e.target.value })} className="input-field text-xs" placeholder="Nama lengkap" autoFocus />
            </div>

            {/* Nama Panggilan */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Panggilan</label>
              <input type="text" value={form.nama_panggilan} onChange={e => setForm({ ...form, nama_panggilan: e.target.value })} className="input-field text-xs" placeholder="Nama panggilan (dipakai untuk ID & email login)" />
            </div>

            {/* Auto-generated ID & Email preview (only for new users) */}
            {!editingId && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> ID Login (otomatis)
                  </label>
                  <div className="input-field text-xs bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 font-mono cursor-default select-all">
                    {idLoginPreview || <span className="italic">isi nama panggilan...</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <AtSign className="w-3 h-3" /> Email (otomatis)
                  </label>
                  <div className="input-field text-xs bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 font-mono cursor-default select-all truncate">
                    {emailPreview || <span className="italic">isi nama panggilan...</span>}
                  </div>
                </div>
              </div>
            )}

            {/* No. WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">No. WhatsApp</label>
              <input type="text" value={form.nomor_whatsapp} onChange={e => setForm({ ...form, nomor_whatsapp: e.target.value })} className="input-field text-xs" placeholder="08xx" />
            </div>

            {/* Multi-role checkboxes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Jabatan <span className="text-[10px] font-normal text-slate-400">(bisa pilih lebih dari satu)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {ALL_ROLES.map(r => {
                  const isSelected = form.roles.includes(r);
                  return (
                    <button key={r} type="button" onClick={() => toggleRole(r)}
                      className={`py-2.5 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center gap-0.5 ${isSelected ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}>
                      <span className="capitalize">{r}</span>
                      {isSelected && <CheckCircle className="w-3 h-3 opacity-80" />}
                    </button>
                  );
                })}
              </div>
              {form.roles.length > 1 && (
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                  Jabatan utama: <strong>{primaryRole(form.roles)}</strong> (prioritas tertinggi)
                </p>
              )}
            </div>

            {/* Password (new user only) */}
            {!editingId && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field text-xs" placeholder="Min. 6 karakter" minLength={6} />
              </div>
            )}

            {/* Gender fields */}
            {showGenderFields && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jenis Kelamin</label>
                  <select value={form.jenis_kelamin} onChange={e => setForm({ ...form, jenis_kelamin: e.target.value as 'L' | 'P' })} className="input-field text-xs">
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Boleh Mengajar</label>
                  <select value={form.boleh_mengajar} onChange={e => setForm({ ...form, boleh_mengajar: e.target.value as BolehMengajar })} className="input-field text-xs">
                    <option value="">Pilih</option>
                    <option value="Banin">Banin</option>
                    <option value="Banat">Banat</option>
                    <option value="Keduanya">Keduanya</option>
                  </select>
                </div>
              </div>
            )}

            {/* Status Aktif */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">Status Aktif</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Tambah User'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <Modal isOpen={true} onClose={() => { setShowResetModal(false); setResetPassId(null); setNewPassword(''); }} title="Reset Password" size="sm">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Masukkan password baru untuk user ini:</p>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field text-xs" placeholder="Min. 6 karakter" minLength={6} autoFocus />
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowResetModal(false); setResetPassId(null); setNewPassword(''); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleResetPassword} disabled={isResetting} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {isResetting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                Reset
              </button>
            </div>
          </div>
        </Modal>
      )}
      {/* ===== EXPORT MODAL ===== */}
      {showExportModal && (
        <Modal isOpen={true} onClose={() => setShowExportModal(false)} title="Export Data User (CSV)" size="md">
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Pilih jenis data yang ingin diekspor. File CSV akan berisi data {filtered.length} user yang sedang ditampilkan (sesuai tab & pencarian).
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Pilih Jenis Data</label>
              <div className="space-y-2">
                {SCOPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setExportScope(opt.value)}
                    className={`w-full flex items-start gap-2.5 p-3 rounded-xl text-left transition-all border ${exportScope === opt.value ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${exportScope === opt.value ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
                      {exportScope === opt.value && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{opt.label}</p>
                      <p className="text-[10px] text-slate-400">{opt.desc}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-mono">Kolom: {EXPORT_COLUMNS[opt.value].join(', ')}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowExportModal(false)} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleExportCSV} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ===== IMPORT MODAL ===== */}
      {showImportModal && (
        <Modal isOpen={true} onClose={() => { setShowImportModal(false); resetImportState(); }} title="Import Data User (CSV)" size="lg">
          <div className="space-y-4">
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-sky-700 dark:text-sky-300">
                <p className="font-semibold mb-1">Cara Import:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px]">
                  <li>Pilih jenis data sesuai format file CSV Anda</li>
                  <li>Unduh template CSV untuk melihat format yang benar</li>
                  <li>Isi data, lalu unggah file CSV</li>
                  <li>Klik "Import" untuk memproses</li>
                </ol>
                <p className="text-[10px] mt-1.5">Catatan: Password kosong akan dibuat otomatis (format: simkbmXXXX). ID Login kosong akan dibuat dari nama panggilan.</p>
              </div>
            </div>

            {/* Scope selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Pilih Jenis Data</label>
              <div className="grid grid-cols-2 gap-2">
                {SCOPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setImportScope(opt.value); resetImportState(); }}
                    className={`flex flex-col items-start gap-0.5 p-2.5 rounded-xl text-left transition-all border ${importScope === opt.value ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-300'}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${importScope === opt.value ? 'border-sky-600 bg-sky-600' : 'border-slate-300'}`}>
                        {importScope === opt.value && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{opt.label}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 ml-5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Template download */}
            <button onClick={downloadImportTemplate} className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline">
              <FileText className="w-3.5 h-3.5" /> Download Template CSV ({importScope})
            </button>

            {/* File upload */}
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 transition-colors" onClick={() => importFileRef.current?.click()}>
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              {importFile ? <p className="text-sm font-semibold text-sky-600">{importFile.name}</p> : <p className="text-sm text-slate-400">Klik untuk pilih file CSV</p>}
              <input ref={importFileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); }} />
            </div>

            {/* Error */}
            {importError && (
              <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-300">{importError}</p>
              </div>
            )}

            {/* Preview */}
            {importPreview.length > 0 && !importResult && (
              <div className="overflow-x-auto">
                <p className="text-[10px] font-semibold text-slate-500 mb-1.5">Preview ({importPreview.length} baris pertama):</p>
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      {Object.keys(importPreview[0]).map(k => <th key={k} className="border border-slate-200 px-2 py-1 text-left">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, ci) => <td key={ci} className="border border-slate-200 px-2 py-1 truncate max-w-[100px]">{v || '-'}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Result */}
            {importResult && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600">{importResult.success}</p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold">Berhasil</p>
                  </div>
                  <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3 text-center">
                    <p className="text-2xl font-bold text-rose-600">{importResult.failed}</p>
                    <p className="text-[10px] text-rose-700 dark:text-rose-300 font-semibold">Gagal</p>
                  </div>
                </div>
                {importResult.results.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResult.results.map((r, i) => (
                      <div key={i} className={`flex items-center gap-2 p-2 rounded-lg text-[10px] ${r.status === 'sukses' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
                        {r.status === 'sukses' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-rose-600" />}
                        <span className="font-medium text-slate-700 dark:text-slate-200">{r.nama_lengkap || '-'}</span>
                        {r.id_login && <span className="text-slate-400 font-mono">@{r.id_login}</span>}
                        {r.password && r.status === 'sukses' && <span className="text-slate-400">pwd: {r.password}</span>}
                        {r.error && <span className="text-rose-600">{r.error}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
              {importResult ? (
                <button onClick={() => { setShowImportModal(false); resetImportState(); }} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> Selesai
                </button>
              ) : (
                <>
                  <button onClick={() => { setShowImportModal(false); resetImportState(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
                  <button onClick={handleImportSubmit} disabled={importing || !importFile || importPreview.length === 0} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {importing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {importing ? 'Mengimpor...' : 'Import Data'}
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {dialog}
    </div>
  );
}
