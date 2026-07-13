import { useState, useEffect, useMemo } from 'react';
import { Calendar, Plus, Pencil, Trash2, Search, Copy, CalendarDays, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import SearchableSelect from '../../components/SearchableSelect';
import { useLembaga } from '../../hooks/useLembaga';
import type { ShowToast, Profile, JadwalMengajar } from '../../types';

const PAGE_SIZE = 10;
const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

type SubTab = 'jadwal-mengajar' | 'jadwal-ujian' | 'kalender';

export default function JadwalSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [subTab, setSubTab] = useState<SubTab>('jadwal-mengajar');
  const [list, setList] = useState<JadwalMengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [ustazOptions, setUstazOptions] = useState<{ value: string; label: string }[]>([]);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const { data: lembagaList } = useLembaga();

  const [form, setForm] = useState({
    user_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30',
    kelas: '', pelajaran: '', ruangan: '', lembaga_id: '', guru_pengganti_id: '', is_libur: false,
  });

  const isAdmin = profile?.role === 'admin';

  const subTabs = [
    { id: 'jadwal-mengajar' as SubTab, label: 'Jadwal Mengajar', icon: Calendar },
    { id: 'jadwal-ujian' as SubTab, label: 'Jadwal Ujian', icon: FileText },
    { id: 'kalender' as SubTab, label: 'Kalender Akademik', icon: CalendarDays },
  ];

  useEffect(() => { fetchList(); fetchUstaz(); }, []);

  const fetchUstaz = async () => {
    const { data } = await supabase.from('profiles').select('id, nama_lengkap').in('role', ['ustaz', 'operator']).eq('is_active', true).order('nama_lengkap');
    setUstazOptions((data || []).map(p => ({ value: p.id, label: p.nama_lengkap || '-' })));
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      let q = supabase.from('jadwal_mengajar').select('*').order('jam_mulai', { ascending: true });
      if (!isAdmin) q = q.eq('user_id', profile?.id || '');
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
      user_id: j.user_id || '', hari: j.hari || 'Senin', jam_mulai: j.jam_mulai || '07:00',
      jam_selesai: j.jam_selesai || '08:30', kelas: j.kelas || '', pelajaran: j.pelajaran || '',
      ruangan: j.ruangan || '', lembaga_id: j.lembaga_id || '', guru_pengganti_id: j.guru_pengganti_id || '',
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
        user_id: form.user_id, hari: form.hari, jam_mulai: form.jam_mulai,
        jam_selesai: form.jam_selesai || null, kelas: form.kelas, pelajaran: form.pelajaran,
        ruangan: form.ruangan || null, lembaga_id: form.lembaga_id || null,
        guru_pengganti_id: form.guru_pengganti_id || null, is_libur: form.is_libur,
      };
      if (editingId) {
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

  const handleCopySemester = async () => {
    showToast('Fitur copy semester akan tersedia segera', 'info');
    setShowCopyModal(false);
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(j => [j.kelas, j.pelajaran, j.hari, j.ruangan].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [list, search]);

  const lembagaOptions = useMemo(() => (lembagaList || []).map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Jadwal</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Kelola jadwal mengajar, ujian, dan kalender akademik</p>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {subTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id)} className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${subTab === t.id ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {subTab === 'jadwal-mengajar' && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari jadwal..." className="input-field text-xs pl-8" />
            </div>
            {isAdmin && (
              <button onClick={() => setShowCopyModal(true)} className="btn-secondary flex items-center gap-1.5 py-2.5 px-3 text-xs">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            )}
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
        </>
      )}

      {subTab === 'jadwal-ujian' && (
        <div className="card p-6 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Jadwal Ujian</p>
          <p className="text-xs text-slate-400 mt-1">Fitur jadwal ujian akan tersedia segera</p>
        </div>
      )}

      {subTab === 'kalender' && (
        <div className="card p-6 text-center">
          <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kalender Akademik</p>
          <p className="text-xs text-slate-400 mt-1">Kalender akademik akan tersedia segera</p>
        </div>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Jadwal Mengajar' : 'Tambah Jadwal Mengajar'}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ustaz *</label>
              <SearchableSelect value={form.user_id} onChange={v => setForm({ ...form, user_id: v })} options={ustazOptions} placeholder="Pilih ustaz" icon={<Calendar className="w-3.5 h-3.5" />} disabled={!isAdmin} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Hari *</label>
                <SearchableSelect value={form.hari} onChange={v => setForm({ ...form, hari: v })} options={hariOptions.map(h => ({ value: h, label: h }))} placeholder="Pilih hari" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
                <SearchableSelect value={form.lembaga_id} onChange={v => setForm({ ...form, lembaga_id: v })} options={lembagaOptions} placeholder="Pilih lembaga" icon={<Calendar className="w-3.5 h-3.5" />} />
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
              <SearchableSelect value={form.guru_pengganti_id} onChange={v => setForm({ ...form, guru_pengganti_id: v })} options={ustazOptions} placeholder="Pilih guru pengganti (opsional)" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_libur} onChange={e => setForm({ ...form, is_libur: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300">Libur</span>
            </label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                Simpan
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCopyModal && (
        <Modal isOpen={true} onClose={() => setShowCopyModal(false)} title="Copy Jadwal Semester Lalu" size="sm">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Salin seluruh jadwal dari semester sebelumnya ke semester aktif saat ini.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowCopyModal(false)} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleCopySemester} className="btn-primary flex-1 py-2.5 text-xs">Copy Jadwal</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
