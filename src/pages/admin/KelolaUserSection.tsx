import { useState, useEffect, useMemo } from 'react';
import {
  Users, Shield, Plus, Pencil, Trash2, Search, KeyRound, Lock, UserCog, CheckCircle, AtSign, Hash,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { useConfirm } from '../../hooks/useConfirm';
import { useSettings } from '../../store/useSettings';
import type { ShowToast, Profile, UserRole, BolehMengajar } from '../../types';

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
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, login ID..." className="input-field text-xs pl-8" />
            </div>
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
      {dialog}
    </div>
  );
}
