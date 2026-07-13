import { useState, useEffect, useMemo } from 'react';
import {
  Users, Shield, Plus, Pencil, Trash2, Search, KeyRound, Lock, UserCog, CheckCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import type { ShowToast, Profile, UserRole } from '../../types';

const PAGE_SIZE = 10;

type UserTab = 'ustaz' | 'admin' | 'operator' | 'hak-akses';

export default function KelolaUserSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [tab, setTab] = useState<UserTab>('ustaz');
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

  const [form, setForm] = useState({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', role: 'ustaz' as UserRole, is_active: true });

  const tabs = [
    { id: 'ustaz' as UserTab, label: 'Data Ustaz', icon: Users },
    { id: 'admin' as UserTab, label: 'Data Admin', icon: Shield },
    { id: 'operator' as UserTab, label: 'Data Operator', icon: UserCog },
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
      else { setLoading(false); return; }
      const { data, error } = await q;
      if (error) throw error;
      setList((data || []) as Profile[]);
    } catch (err: any) {
      showToast('Gagal memuat data: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => { setForm({ nama_lengkap: '', nama_panggilan: '', nomor_whatsapp: '', password: '', role: tab === 'admin' ? 'admin' : tab === 'operator' ? 'operator' : 'ustaz', is_active: true }); setEditingId(null); };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (u: Profile) => {
    setEditingId(u.id);
    setForm({ nama_lengkap: u.nama_lengkap || '', nama_panggilan: u.nama_panggilan || '', nomor_whatsapp: u.nomor_whatsapp || '', password: '', role: u.role || 'ustaz', is_active: u.is_active ?? true });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nama_lengkap) { showToast('Nama lengkap wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      if (editingId) {
        const payload: any = { nama_lengkap: form.nama_lengkap, nama_panggilan: form.nama_panggilan, nomor_whatsapp: form.nomor_whatsapp, role: form.role, is_active: form.is_active };
        const { error } = await supabase.from('profiles').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('User diperbarui', 'success');
      } else {
        if (!form.password) { showToast('Password wajib diisi untuk user baru', 'error'); setSaving(false); return; }
        const email = form.nomor_whatsapp ? `${form.nomor_whatsapp.replace(/[^0-9]/g, '')}@simkbm.id` : `${Date.now()}@simkbm.id`;
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({ email, password: form.password, email_confirm: true });
        if (authError) throw authError;
        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: authData.user.id, nama_lengkap: form.nama_lengkap, nama_panggilan: form.nama_panggilan,
            nomor_whatsapp: form.nomor_whatsapp, role: form.role, is_active: form.is_active, email,
          });
          if (profileError) throw profileError;
        }
        showToast('User ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + (err?.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: Profile) => {
    if (!confirm(`Yakin ingin menghapus user "${u.nama_lengkap}"?`)) return;
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
      const { error } = await supabase.auth.admin.updateUserById(resetPassId, { password: newPassword });
      if (error) throw error;
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
    return list.filter(u => [u.nama_lengkap, u.nama_panggilan, u.nomor_whatsapp, u.role].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [list, search]);

  const roles: { label: string; value: string; desc: string; color: string }[] = [
    { label: 'Super Admin', value: 'admin', desc: 'Akses penuh ke seluruh sistem', color: 'rose' },
    { label: 'Admin', value: 'admin', desc: 'Kelola user, data master, dan laporan', color: 'emerald' },
    { label: 'Operator', value: 'operator', desc: 'Input data dan bantu administrasi', color: 'sky' },
    { label: 'Ustaz', value: 'ustaz', desc: 'Akses fitur mengajar dan input nilai', color: 'amber' },
    { label: 'Wali Kelas', value: 'ustaz', desc: 'Akses kelas tertentu + data murid', color: 'violet' },
  ];

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Kelola User</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Data ustaz, admin, operator, dan hak akses</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setPage(1); }} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${tab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'hak-akses' ? (
        <div className="space-y-2">
          {roles.map((r, i) => (
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
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari user..." className="input-field text-xs pl-8" />
            </div>
            <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Tambah</button>
          </div>

          {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div> : filtered.length === 0 ? (
            <EmptyState title="Tidak ada data user" icon={<Users className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-1">
              {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(u => (
                <div key={u.id} className="card p-2.5 flex items-center gap-2.5 group">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    {u.foto ? <img src={u.foto} alt={u.nama_lengkap} className="w-full h-full object-cover rounded-lg" /> : <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{u.nama_lengkap}</p>
                    <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                      <span className="badge badge-info text-[9px]">{u.role}</span>
                      {u.nomor_whatsapp && <span className="truncate">{u.nomor_whatsapp}</span>}
                      {u.is_active === false && <span className="text-rose-500">Non-aktif</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => { setResetPassId(u.id); setShowResetModal(true); }} className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 text-slate-400 hover:text-amber-600" title="Reset Password"><KeyRound className="w-3 h-3" /></button>
                    <button onClick={() => handleToggleActive(u)} className="p-1.5 rounded hover:bg-sky-50 dark:hover:bg-sky-900/20 text-slate-400 hover:text-sky-600" title="Aktif/Nonaktif"><Lock className="w-3 h-3" /></button>
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(u)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
              <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit User' : 'Tambah User'}>
          <div className="space-y-3">
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Lengkap *</label><input type="text" value={form.nama_lengkap} onChange={e => setForm({ ...form, nama_lengkap: e.target.value })} className="input-field text-xs" placeholder="Nama lengkap" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Panggilan</label><input type="text" value={form.nama_panggilan} onChange={e => setForm({ ...form, nama_panggilan: e.target.value })} className="input-field text-xs" placeholder="Nama panggilan" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">No. WhatsApp</label><input type="text" value={form.nomor_whatsapp} onChange={e => setForm({ ...form, nomor_whatsapp: e.target.value })} className="input-field text-xs" placeholder="08xx" /></div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Role</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['admin', 'operator', 'ustaz'] as UserRole[]).map(r => (
                  <button key={r} onClick={() => setForm({ ...form, role: r })} className={`py-2 rounded-lg text-xs font-semibold transition-all ${form.role === r ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{r}</button>
                ))}
              </div>
            </div>
            {!editingId && <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Password *</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input-field text-xs" placeholder="Min. 6 karakter" minLength={6} /></div>}
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" /><span className="text-xs text-slate-600 dark:text-slate-300">Status Aktif</span></label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan</button>
            </div>
          </div>
        </Modal>
      )}

      {showResetModal && (
        <Modal isOpen={true} onClose={() => { setShowResetModal(false); setResetPassId(null); setNewPassword(''); }} title="Reset Password" size="sm">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Masukkan password baru untuk user ini:</p>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field text-xs" placeholder="Min. 6 karakter" minLength={6} autoFocus />
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowResetModal(false); setResetPassId(null); setNewPassword(''); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleResetPassword} disabled={isResetting} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{isResetting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />} Reset</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
