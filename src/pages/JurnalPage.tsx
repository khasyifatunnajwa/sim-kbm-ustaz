import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, BookOpen, Calendar, Target, Save, FileText, CheckSquare, AlignLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { JurnalKBM, Profile, ShowToast } from '../types';

type FilterTab = 'semua' | 'hari_ini' | 'minggu_ini';

// Rotating accent colors for subject cards
const ACCENT_COLORS = [
  'border-emerald-400 bg-emerald-400',
  'border-sky-400 bg-sky-400',
  'border-violet-400 bg-violet-400',
  'border-amber-400 bg-amber-400',
  'border-rose-400 bg-rose-400',
  'border-teal-400 bg-teal-400',
];

const SUBJECT_COLORS: Record<string, string> = {};
const getSubjectAccent = (subject: string) => {
  if (!SUBJECT_COLORS[subject]) {
    const keys = Object.keys(SUBJECT_COLORS);
    SUBJECT_COLORS[subject] = ACCENT_COLORS[keys.length % ACCENT_COLORS.length];
  }
  return SUBJECT_COLORS[subject];
};

export default function JurnalPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [jurnalList, setJurnalList] = useState<JurnalKBM[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [mapelList, setMapelList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. MODIFIKASI: Baca status modal dari Hash URL saat awal muat
  const [showModal, setShowModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'jurnal' && hashParts[1] === 'form';
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('semua');
  const [selectedKelas, setSelectedKelas] = useState<string>('');

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    kelas: '',
    pelajaran: '',
    tanggal: today,
    materi: '',
    target: '',
    realisasi: '',
    metode: '',
    catatan: '',
  });

  // 2. SINKRONISASI MODAL DENGAN TOMBOL BACK HP
  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'jurnal') {
        if (hashParts[1] === 'form') {
          setShowModal(true);
        } else {
          setShowModal(false);
          setEditingId(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3. FUNGSI CERDAS MENUTUP MODAL (Membersihkan History URL)
  const handleCloseModal = () => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'form') {
      window.history.back(); // Memicu popstate untuk mundur secara native
    } else {
      setShowModal(false);
      setEditingId(null);
    }
  };

  useEffect(() => {
    (async () => {
      const scope = await getUstazScope(profile);
      setKelasList(scope.kelasList);
      setMapelList(scope.mapelList);
      fetchJurnal(scope);
    })();
  }, [profile]);

  const fetchJurnal = async (scope?: { isAdmin: boolean; kelasList: string[] }) => {
    if (!profile?.id && profile?.role !== 'admin') {
      console.log('Profil belum siap, membatalkan fetch...');
      return;
    }
    setLoading(true);
    let query = supabase.from('jurnal_kbm').select('*').eq('is_active', true).order('tanggal', { ascending: false }).limit(100);
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', profile.id);
    }

    const { data, error } = await query;

    if (error) {
      showToast(error.message, 'error');
    } else {
      setJurnalList((data || []) as JurnalKBM[]);
    }
    setLoading(false);
  };

  const filteredJurnal = useMemo(() => {
    let filtered = jurnalList;
    if (filterTab === 'hari_ini') {
      filtered = filtered.filter(j => j.tanggal === today);
    } else if (filterTab === 'minggu_ini') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(j => new Date(j.tanggal) >= weekAgo);
    }
    if (selectedKelas) {
      filtered = filtered.filter(j => j.kelas === selectedKelas);
    }
    return filtered;
  }, [jurnalList, filterTab, selectedKelas, today]);

  // 4. MENDORONG HASH SAAT BUKA MODAL TAMBAH
  const openAdd = () => {
    setEditingId(null);
    setForm({
      kelas: kelasList[0] || '',
      pelajaran: mapelList[0] || '',
      tanggal: today,
      materi: '',
      target: '',
      realisasi: '',
      metode: '',
      catatan: '',
    });
    setShowModal(true);
    window.history.pushState(null, '', '#jurnal/form');
  };

  // 4. MENDORONG HASH SAAT BUKA MODAL EDIT
  const openEdit = (j: JurnalKBM) => {
    setEditingId(j.id);
    setForm({
      kelas: j.kelas || '',
      pelajaran: j.pelajaran || '',
      tanggal: j.tanggal,
      materi: j.materi || '',
      target: j.target || '',
      realisasi: j.realisasi || '',
      metode: j.metode || '',
      catatan: j.catatan || '',
    });
    setShowModal(true);
    window.history.pushState(null, '', '#jurnal/form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kelas || !form.pelajaran) {
      showToast('Kelas dan pelajaran wajib diisi', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      kelas: form.kelas,
      pelajaran: form.pelajaran,
      tanggal: form.tanggal,
      materi: form.materi || null,
      target: form.target || null,
      realisasi: form.realisasi || null,
      metode: form.metode || null,
      catatan: form.catatan || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('jurnal_kbm').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('jurnal_kbm').insert(payload));
    }

    setSaving(false);
    if (error) {
      showToast(error.message, 'error');
      return;
    }

    showToast(editingId ? 'Jurnal diperbarui!' : 'Jurnal disimpan!', 'success');

    // PERUBAHAN: Memanggil handleCloseModal agar kembali otomatis secara native
    handleCloseModal();
    fetchJurnal();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('jurnal_kbm').delete().eq('id', id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setJurnalList(prev => prev.filter(j => j.id !== id));
    showToast('Jurnal dihapus', 'info');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const tabs = [
    { id: 'semua' as FilterTab, label: 'Semua' },
    { id: 'hari_ini' as FilterTab, label: 'Hari Ini' },
    { id: 'minggu_ini' as FilterTab, label: 'Minggu Ini' },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Jurnal KBM</h2>
          <p className="section-subtitle">Catatan kegiatan belajar mengajar</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3">
        {/* Tab switcher */}
        <div className="tab-switcher flex-shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setFilterTab(t.id)}
              className={`tab-btn ${filterTab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Kelas filter */}
        <select
          value={selectedKelas}
          onChange={e => setSelectedKelas(e.target.value)}
          className="input-field text-xs py-1.5 ml-auto w-36"
        >
          <option value="">Semua Kelas</option>
          {kelasList.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card overflow-hidden">
              <div className="flex">
                <div className="w-1 skeleton rounded-none" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="skeleton h-4 w-1/3 rounded-lg" />
                  <div className="skeleton h-3 w-1/2 rounded-lg" />
                  <div className="grid grid-cols-3 gap-2">
                    <div className="skeleton h-14 rounded-xl" />
                    <div className="skeleton h-14 rounded-xl" />
                    <div className="skeleton h-14 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredJurnal.length === 0 ? (
        <EmptyState
          title="Belum ada jurnal"
          description="Tambahkan jurnal KBM untuk mencatat kegiatan mengajar."
          icon={<BookOpen className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-3">
          {filteredJurnal.map(j => {
            const accent = getSubjectAccent(j.pelajaran || '');
            const [borderClass, bgClass] = accent.split(' ');
            return (
              <div key={j.id} className="card overflow-hidden group hover:shadow-md transition-shadow">
                {/* Colored left accent strip */}
                <div className="flex">
                  <div className={`w-1 flex-shrink-0 ${bgClass}`} />

                  <div className="flex-1 p-4">
                    {/* Card header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="font-bold text-slate-800 text-sm">{j.pelajaran}</span>
                          <span className="badge-info text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                            {j.kelas}
                          </span>
                          {j.metode && (
                            <span className="badge-neutral text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-500">
                              {j.metode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(j.tanggal)}</span>
                        </div>
                      </div>

                      {/* Action buttons — visible on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={() => openEdit(j)}
                          className="btn-icon w-7 h-7 hover:bg-emerald-50 hover:text-emerald-600"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(j.id)}
                          className="btn-icon w-7 h-7 hover:bg-rose-50 hover:text-rose-500"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Info grid: Materi / Target / Realisasi */}
                    {(j.materi || j.target || j.realisasi) && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                        {j.materi && (
                          <div className="rounded-xl p-3 bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <AlignLeft className="w-3 h-3 text-slate-400" />
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Materi</p>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{j.materi}</p>
                          </div>
                        )}
                        {j.target && (
                          <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Target className="w-3 h-3 text-emerald-500" />
                              <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Target</p>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{j.target}</p>
                          </div>
                        )}
                        {j.realisasi && (
                          <div className="rounded-xl p-3 bg-sky-50 border border-sky-100">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <CheckSquare className="w-3 h-3 text-sky-500" />
                              <p className="text-[10px] text-sky-600 font-semibold uppercase tracking-wide">Realisasi</p>
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed">{j.realisasi}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Catatan */}
                    {j.catatan && (
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3 mt-2">
                        <FileText className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-800 italic leading-relaxed">{j.catatan}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Form ── */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingId ? 'Edit Jurnal KBM' : 'Tambah Jurnal KBM'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Kelas + Pelajaran */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.kelas}
                onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))}
                className="input-field text-sm"
                required
              >
                <option value="">Pilih Kelas</option>
                {kelasList.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.pelajaran}
                onChange={e => setForm(p => ({ ...p, pelajaran: e.target.value }))}
                className="input-field text-sm"
                required
              >
                <option value="">Pilih Pelajaran</option>
                {mapelList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Tanggal
            </label>
            <input
              type="date"
              value={form.tanggal}
              onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))}
              className="input-field text-sm"
              required
            />
          </div>

          {/* Row 3: Materi */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Materi</label>
            <textarea
              value={form.materi}
              onChange={e => setForm(p => ({ ...p, materi: e.target.value }))}
              className="input-field text-sm resize-none"
              rows={2}
              placeholder="Materi yang diajarkan..."
            />
          </div>

          {/* Row 4: Target + Realisasi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target</label>
              <textarea
                value={form.target}
                onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
                className="input-field text-sm resize-none"
                rows={2}
                placeholder="Target pembelajaran..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Realisasi</label>
              <textarea
                value={form.realisasi}
                onChange={e => setForm(p => ({ ...p, realisasi: e.target.value }))}
                className="input-field text-sm resize-none"
                rows={2}
                placeholder="Hasil yang tercapai..."
              />
            </div>
          </div>

          {/* Row 5: Metode */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Metode</label>
            <input
              type="text"
              value={form.metode}
              onChange={e => setForm(p => ({ ...p, metode: e.target.value }))}
              className="input-field text-sm"
              placeholder="Ceramah, diskusi, praktik, dll"
            />
          </div>

          {/* Row 6: Catatan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan</label>
            <textarea
              value={form.catatan}
              onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))}
              className="input-field text-sm resize-none"
              rows={2}
              placeholder="Catatan tambahan..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn-secondary flex-1 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Jurnal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
