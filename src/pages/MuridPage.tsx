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

  // Detail View
  if (selectedMurid) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedMurid(null)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali
        </button>

        {/* Header */}
        <div className="card p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold truncate">{selectedMurid.nama}</h2>
              <p className="text-xs text-emerald-100">Kelas {selectedMurid.kelas || '-'}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(selectedMurid)} className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => { setDeletingId(selectedMurid.id); setShowDeleteDialog(true); }} className="p-2 rounded-lg bg-white/20 hover:bg-rose-500/50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Detail Info */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Status</span>
            {selectedMurid.status_aktif === false ? (
              <span className="flex items-center gap-1 text-xs text-rose-600 font-medium">
                <XCircle className="w-3.5 h-3.5" /> Non-aktif
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle className="w-3.5 h-3.5" /> Aktif
              </span>
            )}
          </div>

          {selectedMurid.domisili && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400">Domisili</p>
                <p className="text-xs text-slate-700">{selectedMurid.domisili}</p>
              </div>
            </div>
          )}

          {selectedMurid.alamat && (
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400">Alamat Lengkap</p>
                <p className="text-xs text-slate-700">{selectedMurid.alamat}</p>
              </div>
            </div>
          )}

          {selectedMurid.nomor_whatsapp && (
            <div className="flex items-start gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400">No. WhatsApp</p>
                <p className="text-xs text-slate-700">{selectedMurid.nomor_whatsapp}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Santri</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{filteredMuridList.length} santri</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center gap-1.5 text-xs">
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Impor</span>
            </button>
          )}
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama atau kelas..."
            className="input-field text-xs pl-7"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-slate-400">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <select
          value={filterKelas}
          onChange={e => setFilterKelas(e.target.value)}
          className="input-field text-xs w-28"
        >
          <option value="all">Semua</option>
          {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredMuridList.length === 0 ? (
        <EmptyState title="Tidak ada santri" description={search || filterKelas !== 'all' ? 'Tidak ada hasil yang cocok' : 'Belum ada data santri'} icon={<Users className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {filteredMuridList.map(murid => (
            <button
              key={murid.id}
              onClick={() => setSelectedMurid(murid)}
              className="card p-2.5 w-full text-left hover:shadow-sm transition-all flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  {murid.status_aktif === false ? <XCircle className="w-4 h-4 text-rose-400" /> : murid.nama.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{murid.nama}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Kelas {murid.kelas || '-'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
            </button>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Santri' : 'Tambah Santri'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
            <input type="text" required value={form.nama} onChange={e => setForm(p => ({ ...p, nama: e.target.value }))} className="input-field text-xs" placeholder="Nama lengkap..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kelas *</label>
              <select required value={form.kelas} onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))} className="input-field text-xs">
                <option value="">Pilih</option>
                {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
              <select value={form.status_aktif ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, status_aktif: e.target.value === 'true' }))} className="input-field text-xs">
                <option value="true">Aktif</option>
                <option value="false">Non-aktif</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">No. WhatsApp</label>
            <input type="tel" value={form.nomor_whatsapp} onChange={e => setForm(p => ({ ...p, nomor_whatsapp: e.target.value }))} className="input-field text-xs" placeholder="08xx..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Domisili</label>
            <input type="text" value={form.domisili} onChange={e => setForm(p => ({ ...p, domisili: e.target.value }))} className="input-field text-xs" placeholder="Kota/Kecamatan..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat</label>
            <textarea value={form.alamat} onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))} className="input-field text-xs resize-none" rows={2} placeholder="Alamat lengkap..." />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-xs">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-xs">{saving ? 'Menyimpan...' : 'Simpan'}</button>
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
