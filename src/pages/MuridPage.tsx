import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, Users, Phone, MapPin, Search, X, Filter, CheckCircle, XCircle, Upload, ChevronRight, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import ExcelImportModal from '../components/ExcelImportModal';
import type { Murid, Profile, ShowToast } from '../types';

export default function MuridPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('all');

  // Detail view state
  const [selectedMurid, setSelectedMurid] = useState<Murid | null>(null);

  const [form, setForm] = useState({
    nama: '',
    kelas: '',
    domisili: '',
    alamat: '',
    nomor_whatsapp: '',
    status_aktif: true,
  });

  const [kelasList, setKelasList] = useState<string[]>([]);
  const isAdmin = profile?.role === 'admin';

  // Fetch data murid dari Supabase
  const fetchMurid = async () => {
    setLoading(true);
    try {
      const scope = await getUstazScope(profile);
      setKelasList(scope.kelasList);

      const { data, error } = await supabase
        .from('murid')
        .select('*')
        .order('nama');

      if (error) throw error;
      if (data) {
        let muridData = data as Murid[];
        if (!scope.isAdmin && scope.kelasList.length > 0) {
          muridData = muridData.filter(m => scope.kelasList.includes(m.kelas || ''));
        }
        setMuridList(muridData);
      }
    } catch (error: any) {
      showToast(error.message || 'Gagal mengambil data murid', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMurid();
  }, []);

  const kelasOptions = useMemo(
    () => kelasList.length > 0 ? kelasList : [...new Set(muridList.map(m => m.kelas).filter(Boolean))].sort(),
    [kelasList, muridList]
  );

  // Filter & Pencarian Data Murid
  const filteredMuridList = useMemo(() => {
    return muridList.filter(m => {
      const matchesSearch =
        m.nama.toLowerCase().includes(search.toLowerCase()) ||
        (m.kelas && m.kelas.toLowerCase().includes(search.toLowerCase()));
      const matchesKelas = filterKelas === 'all' || m.kelas === filterKelas;
      return matchesSearch && matchesKelas;
    });
  }, [muridList, search, filterKelas]);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      nama: '',
      kelas: '',
      domisili: '',
      alamat: '',
      nomor_whatsapp: '',
      status_aktif: true,
    });
  };

  const openEdit = (murid: Murid) => {
    setEditingId(murid.id);
    setForm({
      nama: murid.nama || '',
      kelas: murid.kelas || '',
      domisili: murid.domisili || '',
      alamat: murid.alamat || '',
      nomor_whatsapp: murid.nomor_whatsapp || '',
      status_aktif: murid.status_aktif !== undefined ? murid.status_aktif : true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.kelas) {
      showToast('Nama dan Kelas wajib diisi!', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('murid')
          .update({
            nama: form.nama,
            kelas: form.kelas,
            domisili: form.domisili,
            alamat: form.alamat,
            nomor_whatsapp: form.nomor_whatsapp,
            status_aktif: form.status_aktif,
          })
          .eq('id', editingId);

        if (error) throw error;
        showToast('Data santri berhasil diperbarui', 'success');
      } else {
        const { error } = await supabase
          .from('murid')
          .insert([form]);

        if (error) throw error;
        showToast('Santri baru berhasil ditambahkan', 'success');
      }

      setShowModal(false);
      resetForm();
      fetchMurid();
    } catch (error: any) {
      showToast(error.message || 'Gagal menyimpan data', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    supabase.from('murid').delete().eq('id', deletingId).then(({ error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Data santri berhasil dihapus', 'success');
        setMuridList(prev => prev.filter(m => m.id !== deletingId));
        setSelectedMurid(null);
      }
      setShowDeleteDialog(false);
      setDeletingId(null);
    });
  };

  // Excel Import
  const santriColumns = [
    { key: 'nama', label: 'Nama Lengkap', required: true, example: 'Ahmad Fauzi' },
    { key: 'kelas', label: 'Kelas', required: true, example: '7A' },
    { key: 'domisili', label: 'Domisili', required: false, example: 'Jakarta' },
    { key: 'alamat', label: 'Alamat Lengkap', required: false },
    { key: 'nomor_whatsapp', label: 'No. WhatsApp', required: false, example: '081234567890' },
    { key: 'status_aktif', label: 'Status Aktif (true/false)', required: false, example: 'true' },
  ];

  const handleImportSantri = async (data: Record<string, any>[]) => {
    const records = data.map(row => ({
      nama: row.nama || row.Nama || row['Nama Lengkap'],
      kelas: row.kelas || row.Kelas,
      domisili: row.domisili || row.Domisili || null,
      alamat: row.alamat || row.Alamat || row['Alamat Lengkap'] || null,
      nomor_whatsapp: row.nomor_whatsapp || row['No. WhatsApp'] || row.WhatsApp || null,
      status_aktif: row.status_aktif !== 'false' && row.status_aktif !== false,
    })).filter(r => r.nama && r.kelas);

    if (records.length === 0) throw new Error('Tidak ada data valid untuk diimpor');

    const { error } = await supabase.from('murid').insert(records);
    if (error) throw error;
    showToast(`${records.length} santri berhasil diimpor!`, 'success');
    fetchMurid();
  };

  // ── Helper: avatar color based on name ──
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-emerald-100 text-emerald-700',
      'bg-sky-100 text-sky-700',
      'bg-violet-100 text-violet-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-teal-100 text-teal-700',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  // ── DETAIL VIEW ──
  if (selectedMurid) {
    const avatarColor = getAvatarColor(selectedMurid.nama);
    return (
      <div className="space-y-4">
        {/* Back button */}
        <button
          onClick={() => setSelectedMurid(null)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar
        </button>

        {/* Gradient header card */}
        <div className="card overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30">
                <span className="text-xl font-bold text-white">
                  {selectedMurid.nama.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Name + class */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-white truncate leading-tight">
                  {selectedMurid.nama}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-emerald-100 bg-white/15 px-2.5 py-0.5 rounded-full font-medium">
                    Kelas {selectedMurid.kelas || '-'}
                  </span>
                  {selectedMurid.status_aktif === false ? (
                    <span className="text-xs text-rose-200 bg-rose-500/30 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Non-aktif
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-100 bg-white/15 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Aktif
                    </span>
                  )}
                </div>
              </div>

              {/* Edit + Delete */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => openEdit(selectedMurid)}
                  className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => { setDeletingId(selectedMurid.id); setShowDeleteDialog(true); }}
                  className="w-9 h-9 rounded-xl bg-white/20 hover:bg-rose-500/50 transition-colors flex items-center justify-center"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info rows */}
        <div className="card divide-y divide-slate-100">
          {/* Domisili */}
          {selectedMurid.domisili ? (
            <div className="flex items-start gap-3 p-4">
              <div className="icon-box icon-box-sm icon-box-emerald flex-shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Domisili</p>
                <p className="text-sm text-slate-700">{selectedMurid.domisili}</p>
              </div>
            </div>
          ) : null}

          {/* Alamat */}
          {selectedMurid.alamat ? (
            <div className="flex items-start gap-3 p-4">
              <div className="icon-box icon-box-sm icon-box-sky flex-shrink-0 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Alamat Lengkap</p>
                <p className="text-sm text-slate-700 leading-relaxed">{selectedMurid.alamat}</p>
              </div>
            </div>
          ) : null}

          {/* WhatsApp */}
          {selectedMurid.nomor_whatsapp ? (
            <div className="flex items-start gap-3 p-4">
              <div className="icon-box icon-box-sm icon-box-amber flex-shrink-0 mt-0.5">
                <Phone className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">No. WhatsApp</p>
                <p className="text-sm text-slate-700">{selectedMurid.nomor_whatsapp}</p>
              </div>
            </div>
          ) : null}

          {/* Fallback if no extra info */}
          {!selectedMurid.domisili && !selectedMurid.alamat && !selectedMurid.nomor_whatsapp && (
            <div className="p-4 text-center text-xs text-slate-400 py-6">
              Belum ada informasi tambahan
            </div>
          )}
        </div>

        {/* Modal Form (opened from detail view edit button) */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Edit Santri" size="sm">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nama}
                onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
                className="input-field text-sm"
                placeholder="Nama lengkap..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.kelas}
                  onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))}
                  className="input-field text-sm"
                >
                  <option value="">Pilih</option>
                  {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
                <select
                  value={form.status_aktif ? 'true' : 'false'}
                  onChange={e => setForm(p => ({ ...p, status_aktif: e.target.value === 'true' }))}
                  className="input-field text-sm"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Non-aktif</option>
                </select>
              </div>
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
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Domisili</label>
              <input
                type="text"
                value={form.domisili}
                onChange={e => setForm(p => ({ ...p, domisili: e.target.value }))}
                className="input-field text-sm"
                placeholder="Kota/Kecamatan..."
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alamat</label>
              <textarea
                value={form.alamat}
                onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))}
                className="input-field text-sm resize-none"
                rows={2}
                placeholder="Alamat lengkap..."
              />
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Confirm Delete */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => { setShowDeleteDialog(false); setDeletingId(null); }}
          onConfirm={confirmDelete}
          title="Hapus Santri"
          message="Yakin ingin menghapus data santri ini? Data yang dihapus tidak dapat dikembalikan."
          confirmText="Hapus"
          variant="danger"
        />
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Santri</h2>
          <p className="section-subtitle">
            {loading ? 'Memuat...' : `${filteredMuridList.length} santri ditemukan`}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-secondary flex items-center gap-1.5 text-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Impor</span>
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau kelas..."
          className="input-field text-sm pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Kelas filter — horizontal scroll chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        <button
          onClick={() => setFilterKelas('all')}
          className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
            filterKelas === 'all'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Semua
        </button>
        {kelasOptions.map(k => (
          <button
            key={k}
            onClick={() => setFilterKelas(k)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterKelas === k
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      {/* Student list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="card p-3 flex items-center gap-3">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3.5 w-1/3 rounded-lg" />
                <div className="skeleton h-3 w-1/4 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredMuridList.length === 0 ? (
        <EmptyState
          title="Tidak ada santri"
          description={search || filterKelas !== 'all' ? 'Tidak ada hasil yang cocok dengan filter' : 'Belum ada data santri. Klik Tambah untuk menambahkan.'}
          icon={<Users className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-2">
          {filteredMuridList.map(murid => {
            const avatarColor = getAvatarColor(murid.nama);
            const isInactive = murid.status_aktif === false;
            return (
              <button
                key={murid.id}
                onClick={() => setSelectedMurid(murid)}
                className="card-hover p-3 w-full text-left flex items-center gap-3 group"
              >
                {/* Avatar circle */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                  isInactive ? 'bg-slate-100 text-slate-400' : avatarColor
                }`}>
                  {isInactive
                    ? <XCircle className="w-5 h-5 text-slate-300" />
                    : murid.nama.charAt(0).toUpperCase()
                  }
                </div>

                {/* Name + class */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isInactive ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                    {murid.nama}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelas {murid.kelas || '-'}
                    {isInactive && <span className="ml-2 text-rose-400 font-medium no-underline">(Non-aktif)</span>}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* ── Modal Form ── */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Santri' : 'Tambah Santri'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
              className="input-field text-sm"
              placeholder="Nama lengkap santri..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={form.kelas}
                onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">Pilih Kelas</option>
                {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status</label>
              <select
                value={form.status_aktif ? 'true' : 'false'}
                onChange={e => setForm(p => ({ ...p, status_aktif: e.target.value === 'true' }))}
                className="input-field text-sm"
              >
                <option value="true">Aktif</option>
                <option value="false">Non-aktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">No. WhatsApp</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="tel"
                value={form.nomor_whatsapp}
                onChange={e => setForm(p => ({ ...p, nomor_whatsapp: e.target.value }))}
                className="input-field text-sm pl-8"
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
              placeholder="Kota / Kecamatan..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alamat Lengkap</label>
            <textarea
              value={form.alamat}
              onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))}
              className="input-field text-sm resize-none"
              rows={2}
              placeholder="Alamat lengkap..."
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="btn-secondary flex-1 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {saving && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Excel Import */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Impor Santri dari Excel"
        columns={santriColumns}
        onImport={handleImportSantri}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeletingId(null); }}
        onConfirm={confirmDelete}
        title="Hapus Santri"
        message="Yakin ingin menghapus data santri ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}
