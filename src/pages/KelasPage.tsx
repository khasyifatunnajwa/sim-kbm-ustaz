import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Pencil, School, CheckCircle, XCircle, Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { Kelas, ShowToast } from '../types';

const currentYear = new Date().getFullYear();
const TAHUN_AJARAN_OPTIONS = [
  `${currentYear - 1}/${currentYear}`,
  `${currentYear}/${currentYear + 1}`,
  `${currentYear + 1}/${currentYear + 2}`,
];
const TINGKAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const emptyForm = {
  nama_kelas: '',
  tingkat: 1,
  lembaga: '',
  wali_kelas: '',
  tahun_ajaran: TAHUN_AJARAN_OPTIONS[1],
  aktif: true,
};

export default function KelasPage({ showToast }: { showToast: ShowToast }) {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [muridCount, setMuridCount] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchKelas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('*')
        .order('tingkat')
        .order('nama_kelas');
      if (error) throw error;
      const list = (data ?? []) as Kelas[];
      setKelasList(list);

      // Hitung jumlah murid aktif per kelas
      if (list.length > 0) {
        const ids = list.map(k => k.id);
        const { data: muridData } = await supabase
          .from('murid')
          .select('kelas_id')
          .in('kelas_id', ids)
          .eq('status_aktif', true);
        const counts: Record<number, number> = {};
        (muridData ?? []).forEach((m: any) => {
          if (m.kelas_id) counts[m.kelas_id] = (counts[m.kelas_id] ?? 0) + 1;
        });
        setMuridCount(counts);
      }
    } catch (err: any) {
      showToast(err.message || 'Gagal memuat data kelas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKelas(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (k: Kelas) => {
    setEditingId(k.id);
    setForm({
      nama_kelas: k.nama_kelas,
      tingkat: k.tingkat,
      lembaga: k.lembaga ?? '',
      wali_kelas: k.wali_kelas ?? '',
      tahun_ajaran: k.tahun_ajaran ?? TAHUN_AJARAN_OPTIONS[1],
      aktif: k.aktif,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama_kelas.trim()) {
      showToast('Nama kelas wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        nama_kelas: form.nama_kelas.trim(),
        tingkat: form.tingkat,
        aktif: form.aktif,
      };
      // Kolom opsional — hanya kirim jika ada nilainya
      if (form.lembaga.trim()) payload.lembaga = form.lembaga.trim();
      if (form.wali_kelas.trim()) payload.wali_kelas = form.wali_kelas.trim();
      if (form.tahun_ajaran) payload.tahun_ajaran = form.tahun_ajaran;

      const { error } = editingId
        ? await supabase.from('kelas').update(payload).eq('id', editingId)
        : await supabase.from('kelas').insert(payload);
      if (error) throw error;
      showToast(
        editingId ? 'Kelas berhasil diperbarui' : 'Kelas berhasil ditambahkan',
        'success',
      );
      setShowModal(false);
      fetchKelas();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan kelas', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase.from('kelas').delete().eq('id', deletingId);
      if (error) throw error;
      showToast('Kelas berhasil dihapus', 'info');
      setShowDeleteModal(false);
      setDeletingId(null);
      fetchKelas();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus kelas', 'error');
    }
  };

  const toggleAktif = async (k: Kelas) => {
    const { error } = await supabase
      .from('kelas')
      .update({ aktif: !k.aktif })
      .eq('id', k.id);
    if (error) { showToast(error.message, 'error'); return; }
    setKelasList(prev => prev.map(x => x.id === k.id ? { ...x, aktif: !x.aktif } : x));
    showToast(
      `Kelas ${k.nama_kelas} ${!k.aktif ? 'diaktifkan' : 'dinonaktifkan'}`,
      'info',
    );
  };

  const aktifCount = kelasList.filter(k => k.aktif).length;
  const totalMurid = Object.values(muridCount).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="section-title">Manajemen Kelas</h2>
          <p className="section-subtitle">
            {kelasList.length} kelas terdaftar &bull; {aktifCount} aktif
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tambah Kelas
        </button>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{kelasList.length}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total Kelas</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{aktifCount}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Aktif</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-slate-600">{totalMurid}</p>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Total Santri</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse h-20 bg-slate-50" />
          ))}
        </div>
      ) : kelasList.length === 0 ? (
        <EmptyState
          title="Belum ada kelas"
          description="Tambahkan kelas terlebih dahulu sebelum menambahkan santri atau jadwal."
          icon={<School className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-3">
          {kelasList.map(k => (
            <div
              key={k.id}
              className={`card p-4 flex items-center gap-4 group transition-all ${
                k.aktif ? '' : 'opacity-60'
              }`}
            >
              {/* Badge tingkat */}
              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center flex-shrink-0 ${
                k.aktif ? 'bg-emerald-50' : 'bg-slate-100'
              }`}>
                <span className={`text-lg font-bold leading-none ${
                  k.aktif ? 'text-emerald-700' : 'text-slate-400'
                }`}>{k.tingkat}</span>
                <span className="text-[9px] font-semibold text-slate-400">Tingkat</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 text-sm">{k.nama_kelas}</span>
                  {k.aktif ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <CheckCircle className="w-3 h-3" /> Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                      <XCircle className="w-3 h-3" /> Non-aktif
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-slate-400">
                  {k.lembaga && <span>{k.lembaga}</span>}
                  {k.wali_kelas && <span>Wali: {k.wali_kelas}</span>}
                  {k.tahun_ajaran && <span>TA {k.tahun_ajaran}</span>}
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {muridCount[k.id] ?? 0} santri
                  </span>
                </div>
              </div>

              {/* Aksi */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => toggleAktif(k)}
                  className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                  title={k.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                >
                  {k.aktif
                    ? <XCircle className="w-4 h-4" />
                    : <CheckCircle className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEdit(k)}
                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setDeletingId(k.id); setShowDeleteModal(true); }}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Kelas' : 'Tambah Kelas Baru'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nama Kelas *
            </label>
            <input
              type="text"
              required
              value={form.nama_kelas}
              onChange={e => setForm(p => ({ ...p, nama_kelas: e.target.value }))}
              className="input-field text-sm"
              placeholder="cth. VII A, Kelas 3 Ibtida..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tingkat</label>
              <select
                value={form.tingkat}
                onChange={e => setForm(p => ({ ...p, tingkat: Number(e.target.value) }))}
                className="input-field text-sm"
              >
                {TINGKAT_OPTIONS.map(t => (
                  <option key={t} value={t}>Tingkat {t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahun Ajaran</label>
              <select
                value={form.tahun_ajaran}
                onChange={e => setForm(p => ({ ...p, tahun_ajaran: e.target.value }))}
                className="input-field text-sm"
              >
                {TAHUN_AJARAN_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lembaga</label>
            <input
              type="text"
              value={form.lembaga}
              onChange={e => setForm(p => ({ ...p, lembaga: e.target.value }))}
              className="input-field text-sm"
              placeholder="cth. Madrasah Diniyah, Pesantren..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Wali Kelas (opsional)
            </label>
            <input
              type="text"
              value={form.wali_kelas}
              onChange={e => setForm(p => ({ ...p, wali_kelas: e.target.value }))}
              className="input-field text-sm"
              placeholder="Nama wali kelas..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, aktif: true }))}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  form.aktif
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, aktif: false }))}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  !form.aktif
                    ? 'bg-slate-600 text-white border-slate-600'
                    : 'bg-white text-slate-500 border-slate-200'
                }`}
              >
                Non-aktif
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary flex-1 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 text-sm"
            >
              {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingId(null); }}
        title="Hapus Kelas"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Menghapus kelas akan memutus relasi dengan seluruh santri di kelas ini.
            Apakah Anda yakin?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowDeleteModal(false); setDeletingId(null); }}
              className="btn-secondary flex-1 text-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all flex-1 text-sm"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
