import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, Users, Phone, MapPin, Search, X, Filter,
  CheckCircle, XCircle, School,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { Murid, Kelas, ShowToast } from '../types';

const emptyForm = {
  nama: '',
  kelas_id: '' as string,
  domisili: '',
  alamat: '',
  nomor_whatsapp: '',
  status_aktif: true,
};

export default function MuridPage({ showToast }: { showToast: ShowToast }) {
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterKelasId, setFilterKelasId] = useState<string>('all');
  const [form, setForm] = useState(emptyForm);

  const fetchKelas = async () => {
    const { data } = await supabase
      .from('kelas')
      .select('*')
      .eq('aktif', true)
      .order('tingkat')
      .order('nama_kelas');
    setKelasList((data ?? []) as Kelas[]);
  };

  const fetchMurid = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('murid')
        .select('*, kelas_data:kelas(id, nama_kelas, lembaga, tingkat)')
        .order('nama');
      if (error) throw error;
      setMuridList((data ?? []) as Murid[]);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengambil data santri', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelas();
    fetchMurid();
  }, []);

  // Nama kelas: dari join atau fallback kolom kelas text lama
  const getNamaKelas = (m: Murid) =>
    (m as any).kelas_data?.nama_kelas ?? m.kelas ?? '-';

  const filteredList = useMemo(() => {
    return muridList.filter(m => {
      const matchSearch =
        m.nama.toLowerCase().includes(search.toLowerCase()) ||
        (m.domisili ?? '').toLowerCase().includes(search.toLowerCase());
      const matchKelas =
        filterKelasId === 'all' ||
        String(m.kelas_id) === filterKelasId;
      return matchSearch && matchKelas;
    });
  }, [muridList, search, filterKelasId]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const openEdit = (m: Murid) => {
    setEditingId(String(m.id));
    setForm({
      nama: m.nama,
      kelas_id: m.kelas_id ? String(m.kelas_id) : '',
      domisili: m.domisili ?? '',
      alamat: m.alamat ?? '',
      nomor_whatsapp: m.nomor_whatsapp ?? '',
      status_aktif: m.status_aktif,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) {
      showToast('Nama santri wajib diisi', 'error');
      return;
    }
    if (!form.kelas_id) {
      showToast('Pilih kelas terlebih dahulu', 'error');
      return;
    }
    setSaving(true);
    try {
      const kelasObj = kelasList.find(k => k.id === Number(form.kelas_id));
      const payload: any = {
        nama: form.nama.trim(),
        kelas_id: Number(form.kelas_id),
        // Simpan juga ke kolom kelas (text) agar kompatibel dengan kode lama
        kelas: kelasObj?.nama_kelas ?? '',
        domisili: form.domisili.trim() || null,
        alamat: form.alamat.trim() || null,
        nomor_whatsapp: form.nomor_whatsapp.trim() || null,
        status_aktif: form.status_aktif,
      };
      const { error } = editingId
        ? await supabase.from('murid').update(payload).eq('id', editingId)
        : await supabase.from('murid').insert(payload);
      if (error) throw error;
      showToast(
        editingId ? 'Data santri berhasil diperbarui' : 'Santri baru berhasil ditambahkan',
        'success',
      );
      setShowModal(false);
      resetForm();
      fetchMurid();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan data', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const { error } = await supabase.from('murid').delete().eq('id', deletingId);
      if (error) throw error;
      showToast('Data santri berhasil dihapus', 'success');
      setShowDeleteModal(false);
      setDeletingId(null);
      fetchMurid();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus data', 'error');
    }
  };

  const selectedKelasInfo = kelasList.find(k => k.id === Number(form.kelas_id));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Manajemen Santri</h1>
            <p className="text-xs text-slate-500 mt-0.5">Total: {filteredList.length} santri</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Tambah Santri
        </button>
      </div>

      {/* Peringatan jika belum ada kelas */}
      {!loading && kelasList.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <School className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Belum ada kelas terdaftar</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Tambahkan kelas terlebih dahulu melalui menu <strong>Kelas</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama santri atau domisili..."
            className="w-full pl-9 pr-9 py-2.5 bg-white rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-3.5 text-slate-400">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <select
            value={filterKelasId}
            onChange={e => setFilterKelasId(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">Semua Kelas</option>
            {kelasList.map(k => (
              <option key={k.id} value={String(k.id)}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Konten */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Memuat data santri...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="Tidak ada data santri"
          description={
            search || filterKelasId !== 'all'
              ? 'Tidak ada hasil yang cocok dengan filter.'
              : 'Belum ada santri. Tambahkan santri baru.'
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-base truncate">{m.nama}</h3>
                    {m.status_aktif ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                        <CheckCircle className="w-3 h-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600">
                        <XCircle className="w-3 h-3" /> Non-aktif
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                    {getNamaKelas(m)}
                  </p>
                  {(m as any).kelas_data?.lembaga && (
                    <p className="text-[11px] text-slate-400">{(m as any).kelas_data.lembaga}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setDeletingId(String(m.id)); setShowDeleteModal(true); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 space-y-1.5 text-xs text-slate-600">
                {m.nomor_whatsapp && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{m.nomor_whatsapp}</span>
                  </div>
                )}
                {m.domisili && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{m.domisili}</span>
                  </div>
                )}
                {m.alamat && (
                  <p className="text-slate-400 italic line-clamp-2 pl-5">{m.alamat}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? 'Ubah Data Santri' : 'Tambah Santri Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
              className="input-field text-sm"
              placeholder="Masukkan nama lengkap santri..."
            />
          </div>

          {/* Dropdown Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas *</label>
            {kelasList.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                Belum ada kelas. Tambahkan kelas terlebih dahulu melalui menu <strong>Kelas</strong>.
              </div>
            ) : (
              <select
                required
                value={form.kelas_id}
                onChange={e => setForm(p => ({ ...p, kelas_id: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => (
                  <option key={k.id} value={String(k.id)}>
                    {k.nama_kelas}{k.lembaga ? ` (${k.lembaga})` : ''}
                  </option>
                ))}
              </select>
            )}
            {selectedKelasInfo && (
              <p className="text-[11px] text-emerald-600 mt-1 pl-1">
                Lembaga: <strong>{selectedKelasInfo.lembaga ?? '-'}</strong>
                {selectedKelasInfo.tahun_ajaran && ` · TA ${selectedKelasInfo.tahun_ajaran}`}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status Aktif</label>
              <select
                value={form.status_aktif ? 'true' : 'false'}
                onChange={e => setForm(p => ({ ...p, status_aktif: e.target.value === 'true' }))}
                className="input-field text-sm"
              >
                <option value="true">Aktif</option>
                <option value="false">Non-aktif</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">No. WhatsApp</label>
              <input
                type="tel"
                value={form.nomor_whatsapp}
                onChange={e => setForm(p => ({ ...p, nomor_whatsapp: e.target.value }))}
                className="input-field text-sm"
                placeholder="08xx..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Domisili</label>
            <input
              type="text"
              value={form.domisili}
              onChange={e => setForm(p => ({ ...p, domisili: e.target.value }))}
              className="input-field text-sm"
              placeholder="Kota/Kecamatan asal..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alamat Lengkap</label>
            <textarea
              value={form.alamat}
              onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))}
              className="input-field text-sm resize-none"
              rows={2}
              placeholder="Alamat lengkap rumah..."
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="btn-secondary flex-1 text-sm py-2.5"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving || kelasList.length === 0}
              className="btn-primary flex-1 text-sm py-2.5"
            >
              {saving ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingId(null); }}
        title="Hapus Data Santri"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus data santri ini?
            Riwayat absensi dan nilai yang terikat juga akan terpengaruh.
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
