import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2, Users, GraduationCap, School, BookOpen, Calendar, Clock,
  Plus, Pencil, Trash2, Search, CheckCircle, Upload, Download, FileText,
  X, AlertCircle, RefreshCw, Share2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import SearchableSelect from '../../components/SearchableSelect';
import { useLembaga } from '../../hooks/useLembaga';
import { generatePDF, shareWA } from '../../lib/pdf';
import type {
  ShowToast, Profile, KelompokMapel, Lembaga,
} from '../../types';
// DataSiswaPage import removed - unused
import DataUstazPage from '../DataUstazPage';
import { useConfirm } from '../../hooks/useConfirm';
import { useSettings } from '../../store/useSettings';
import type { GenderKelas } from '../../types';

const PAGE_SIZE = 10;

type MasterTab = 'lembaga' | 'ustaz' | 'murid' | 'kelas' | 'ruangan' | 'mapel' | 'tahun' | 'semester' | 'hari' | 'jam';

// ====== Import Modal ======
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: string[][]) => Promise<void>;
  title: string;
  columns: string[];
  note?: string;
}

function ImportModal({ isOpen, onClose, onImport, title, columns, note }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).replace(/^\uFEFF/, '');
        const rows = text.split('\n').map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        const dataRows = rows.filter((r, i) => i > 0 && r.some(c => c));
        setPreview(dataRows.slice(0, 5));
      } catch {
        setError('Format file tidak valid');
      }
    };
    reader.readAsText(f);
  };

  const handleDownloadTemplate = () => {
    const header = columns.join(',');
    const blob = new Blob(['\uFEFF' + header + '\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_${title.replace(/ /g, '_').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Pilih file CSV terlebih dahulu'); return; }
    setLoading(true);
    try {
      const reader = new FileReader();
      await new Promise<void>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const text = (e.target?.result as string).replace(/^\uFEFF/, '');
            const rows = text.split('\n').map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
            const dataRows = rows.filter((r, i) => i > 0 && r.some(c => c));
            await onImport(dataRows);
            resolve();
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
      onClose();
      setFile(null);
      setPreview([]);
    } catch (err: any) {
      setError(err.message || 'Gagal mengimpor data');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.currentTarget === e.target) { onClose(); setFile(null); setPreview([]); } }}>
      <div className="modal-content max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Import {title}</h3>
          <button onClick={() => { onClose(); setFile(null); setPreview([]); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>

        {/* Template download */}
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">Kolom yang diperlukan:</p>
              <div className="flex flex-wrap gap-1">
                {columns.map((c, i) => (
                  <span key={i} className="text-[10px] bg-sky-100 dark:bg-sky-800/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded font-mono">{c}</span>
                ))}
              </div>
              {note && <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1.5">{note}</p>}
            </div>
          </div>
          <button onClick={handleDownloadTemplate} className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline">
            <Download className="w-3.5 h-3.5" /> Download Template CSV
          </button>
        </div>

        {/* File input */}
        <div
          className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          {file ? (
            <p className="text-sm font-semibold text-emerald-600">{file.name}</p>
          ) : (
            <p className="text-sm text-slate-400">Klik untuk pilih file CSV</p>
          )}
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <p className="text-[10px] font-semibold text-slate-500 mb-1.5">Preview ({preview.length} baris pertama):</p>
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/50">
                  {columns.map(c => <th key={c} className="border border-slate-200 dark:border-slate-600 px-2 py-1 text-left font-semibold text-slate-500">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 3).map((row, i) => (
                  <tr key={i}>
                    {columns.map((_, ci) => <td key={ci} className="border border-slate-200 dark:border-slate-600 px-2 py-1 text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{row[ci] || '-'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && <p className="text-xs text-rose-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}

        <div className="flex gap-2 mt-4">
          <button onClick={() => { onClose(); setFile(null); setPreview([]); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
          <button onClick={handleSubmit} disabled={loading || !file} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {loading ? 'Mengimpor...' : 'Import Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== Main Component ======
export default function DataMasterSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [tab, setTab] = useState<MasterTab>('lembaga');

  const tabs = [
    { id: 'lembaga' as MasterTab, label: 'Lembaga', icon: Building2 },
    { id: 'ustaz' as MasterTab, label: 'Ustaz', icon: Users },
    { id: 'murid' as MasterTab, label: 'Murid', icon: GraduationCap },
    { id: 'kelas' as MasterTab, label: 'Kelas', icon: School },
    { id: 'ruangan' as MasterTab, label: 'Ruang', icon: Building2 },
    { id: 'mapel' as MasterTab, label: 'Mapel', icon: BookOpen },
    { id: 'tahun' as MasterTab, label: 'Tahun', icon: Calendar },
    { id: 'semester' as MasterTab, label: 'Semester', icon: BookOpen },
    { id: 'hari' as MasterTab, label: 'Hari', icon: Calendar },
    { id: 'jam' as MasterTab, label: 'Jam', icon: Clock },
  ];

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Data Master</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Semua data dasar lembaga, ustaz, murid, kelas, dan akademik</p>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-[10px] font-semibold transition-all border ${tab === t.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-4 h-4" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === 'lembaga' && <KelolaLembaga showToast={showToast} profile={profile} />}
      {tab === 'ustaz' && <DataUstazPage showToast={showToast} />}
      {tab === 'murid' && <KelolaDataMurid showToast={showToast} profile={profile} />}
      {tab === 'kelas' && <CrudKelas showToast={showToast} />}
      {tab === 'ruangan' && <CrudRuangan showToast={showToast} />}
      {tab === 'mapel' && <CrudMapel showToast={showToast} />}
      {tab === 'tahun' && <CrudTahun showToast={showToast} />}
      {tab === 'semester' && <CrudSemester showToast={showToast} />}
      {tab === 'hari' && <CrudHariBelajar showToast={showToast} />}
      {tab === 'jam' && <CrudJamPelajaran showToast={showToast} />}
    </div>
  );
}

// ====== Kelola Lembaga ======
function KelolaLembaga({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const { confirm, dialog } = useConfirm();
  const { data: lembagaList, isLoading, refetch } = useLembaga();
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nama_lembaga: '', alamat: '', telepon: '' });

  const resetForm = () => { setForm({ nama_lembaga: '', alamat: '', telepon: '' }); setEditingId(null); };
  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (l: Lembaga) => { setEditingId(l.id); setForm({ nama_lembaga: l.nama_lembaga || '', alamat: l.alamat || '', telepon: l.telepon || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nama_lembaga) { showToast('Nama lembaga wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { nama_lembaga: form.nama_lembaga, alamat: form.alamat || null, telepon: form.telepon || null };
      if (editingId) {
        const { error } = await supabase.from('lembaga').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Lembaga diperbarui', 'success');
      } else {
        payload.user_id = profile?.id;
        const { error } = await supabase.from('lembaga').insert(payload);
        if (error) throw error;
        showToast('Lembaga ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); refetch();
    } catch (err: any) { showToast('Gagal: ' + (err?.message || ''), 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (l: Lembaga) => {
    if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: l.nama_lembaga, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return;
    try {
      const { error } = await supabase.from('lembaga').delete().eq('id', l.id);
      if (error) throw error;
      showToast('Lembaga dihapus', 'success'); refetch();
    } catch (err: any) { showToast('Gagal: ' + (err?.message || ''), 'error'); }
  };

  const filtered = useMemo(() => {
    const base = lembagaList || [];
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter(l => [l.nama_lembaga, l.alamat, l.telepon].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [lembagaList, search]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari lembaga..." className="input-field text-xs pl-8" />
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Tambah</button>
      </div>
      {isLoading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /></div> : filtered.length === 0 ? (
        <EmptyState title="Tidak ada lembaga" icon={<Building2 className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {filtered.map(l => (
            <div key={l.id} className="card p-3 group">
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 bg-rose-100 dark:bg-rose-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-rose-600 dark:text-rose-400" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{l.nama_lembaga}</p>
                  {l.alamat && <p className="text-[10px] text-slate-500 truncate mt-0.5">{l.alamat}</p>}
                  {l.telepon && <p className="text-[10px] text-slate-500 truncate">{l.telepon}</p>}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                  <button onClick={() => openEdit(l)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(l)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Lembaga' : 'Tambah Lembaga'}>
          <div className="space-y-3">
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Lembaga *</label><input type="text" value={form.nama_lembaga} onChange={e => setForm({ ...form, nama_lembaga: e.target.value })} className="input-field text-xs" placeholder="Nama lembaga" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Alamat</label><textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} className="input-field text-xs" rows={2} placeholder="Alamat lengkap" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Telepon</label><input type="text" value={form.telepon} onChange={e => setForm({ ...form, telepon: e.target.value })} className="input-field text-xs" placeholder="08xx" /></div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan</button>
            </div>
          </div>
        </Modal>
      )}
      {dialog}
    </div>
  );
}

// ====== Kelola Data Murid (full CRUD + import/export) ======
function KelolaDataMurid({ showToast }: { showToast: ShowToast; profile: Profile | null }) {
  const { data: lembagaList = [] } = useLembaga();
  const { confirm, dialog } = useConfirm();
  const { settings } = useSettings();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterLembaga, setFilterLembaga] = useState('');
  const [page, setPage] = useState(1);
  const [kelasOptions, setKelasOptions] = useState<{id: string; nama_kelas: string}[]>([]);
  const [dbKelasOptions, setDbKelasOptions] = useState<{ value: string; label: string }[]>([]);
  const [form, setForm] = useState({ nama: '', kelas: '', kelas_id: '', lembaga_id: '', domisili: '', alamat: '', nomor_whatsapp: '', status_aktif: true, jenis_kelamin: '' as 'L' | 'P' | '', gender_kelas: '' as GenderKelas | '' });

  const lembagaOptions = useMemo(() => lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  useEffect(() => { fetchList(); fetchKelasFromDB(); }, []);

  const fetchKelasFromDB = async () => {
    try {
      const { data, error } = await supabase.from('kelas').select('id, nama_kelas, lembaga_id').eq('is_active', true).order('nama_kelas');
      if (error) throw error;
      if (data) {
        setDbKelasOptions(data.map((k: any) => ({ value: k.id, label: k.nama_kelas })));
        setKelasOptions(data.map((k: any) => ({ id: k.id, nama_kelas: k.nama_kelas })));
      }
    } catch (err: any) {
      console.error('Gagal memuat opsi kelas:', err.message);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('murid').select('*').order('nama');
      if (error) throw error;
      const murid = (data || []) as any[];
      setList(murid);
      // Build kelas options from kelas table, not from murid names
      const { data: kelasData } = await supabase.from('kelas').select('id, nama_kelas').eq('is_active', true).order('nama_kelas');
      if (kelasData) setKelasOptions(kelasData.map((k: any) => ({ id: k.id, nama_kelas: k.nama_kelas })));
    } catch (err: any) { showToast('Gagal memuat data: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let result = list;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(m => [m.nama, m.kelas, m.domisili].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    if (filterKelas) result = result.filter(m => m.kelas_id === filterKelas);
    if (filterLembaga) result = result.filter(m => m.lembaga_id === filterLembaga);
    return result;
  }, [list, search, filterKelas, filterLembaga]);

  const resetForm = () => { setForm({ nama: '', kelas: '', kelas_id: '', lembaga_id: '', domisili: '', alamat: '', nomor_whatsapp: '', status_aktif: true, jenis_kelamin: '', gender_kelas: '' }); setEditingId(null); };
  const openAdd = () => { resetForm(); fetchKelasFromDB(); setShowModal(true); };
  const openEdit = (m: any) => { setEditingId(m.id); fetchKelasFromDB(); const kelasNama = kelasOptions.find(k => k.id === m.kelas_id)?.nama_kelas ?? m.kelas ?? ''; setForm({ nama: m.nama || '', kelas: kelasNama, kelas_id: m.kelas_id || '', lembaga_id: m.lembaga_id || '', domisili: m.domisili || '', alamat: m.alamat || '', nomor_whatsapp: m.nomor_whatsapp || '', status_aktif: m.status_aktif !== false, jenis_kelamin: m.jenis_kelamin || '', gender_kelas: m.gender_kelas || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nama || !form.kelas_id) { showToast('Nama dan kelas wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload = { nama: form.nama, kelas: form.kelas, kelas_id: form.kelas_id, lembaga_id: form.lembaga_id || null, domisili: form.domisili || null, alamat: form.alamat || null, nomor_whatsapp: form.nomor_whatsapp || null, status_aktif: form.status_aktif, jenis_kelamin: form.jenis_kelamin || null, gender_kelas: form.gender_kelas || null };
      if (editingId) {
        const { error } = await supabase.from('murid').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Data murid diperbarui', 'success');
      } else {
        const { error } = await supabase.from('murid').insert(payload);
        if (error) throw error;
        showToast('Murid ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (m: any) => {
    if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: m.nama, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return;
    try {
      await supabase.from('murid').delete().eq('id', m.id);
      showToast('Murid dihapus', 'success'); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); }
  };

  const handleExportCSV = () => {
    const header = 'Nama,Lembaga,Kelas,Gender Kelas,Domisili,Alamat,No HP';
    const rows = filtered.map(m => {
      const lembagaNama = lembagaList.find(l => l.id === m.lembaga_id)?.nama_lembaga || '';
      const kelasNama = kelasOptions.find(k => k.id === m.kelas_id)?.nama_kelas || m.kelas || '';
      return `"${m.nama}","${lembagaNama}","${kelasNama}","${m.gender_kelas || ''}","${m.domisili || ''}","${m.alamat || ''}","${m.nomor_whatsapp || ''}"`;
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data_murid.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Data murid diekspor', 'success');
  };

  const handleExportPDF = () => {
    const headers = ['No', 'Nama', 'Lembaga', 'Kelas', 'Gender', 'Domisili', 'No HP'];
    const body = filtered.map((m, i) => [
      i + 1,
      m.nama,
      lembagaList.find(l => l.id === m.lembaga_id)?.nama_lembaga || '-',
      kelasOptions.find(k => k.id === m.kelas_id)?.nama_kelas || m.kelas || '-',
      m.gender_kelas || '-',
      m.domisili || '-',
      m.nomor_whatsapp || '-',
    ]);
    generatePDF('Data Murid', headers, body, [`Total: ${filtered.length} murid`, `Tanggal: ${new Date().toLocaleDateString('id-ID')}`]);
    showToast('PDF berhasil diunduh', 'success');
  };

  const handleShareWA = () => {
    let text = `*DATA MURID*\n\nTotal: ${filtered.length} santri\n\n`;
    filtered.forEach((m, i) => {
      const lembagaNama = lembagaList.find(l => l.id === m.lembaga_id)?.nama_lembaga || '-';
      const kelasNama = kelasOptions.find(k => k.id === m.kelas_id)?.nama_kelas || m.kelas || '-';
      text += `${i + 1}. ${m.nama} | ${kelasNama} | ${lembagaNama}\n`;
    });
    text += `\nDicetak: ${new Date().toLocaleDateString('id-ID')}`;
    shareWA(text);
  };

  const handleImport = async (rows: string[][]) => {
    let count = 0;
    for (const row of rows) {
      const [nama, lembaga_nama, kelas, gender_kelas, domisili, alamat, nomor_whatsapp] = row;
      if (!nama) continue;
      // Look up kelas_id by name
      const kelasMatch = kelasOptions.find(k => k.nama_kelas.toLowerCase() === (kelas || '').trim().toLowerCase());
      // Look up lembaga_id by name
      const lembagaMatch = lembagaList.find(l => l.nama_lembaga.toLowerCase() === (lembaga_nama || '').trim().toLowerCase());
      await supabase.from('murid').insert({
        nama: nama.trim(),
        kelas: kelasMatch?.nama_kelas || kelas?.trim() || null,
        kelas_id: kelasMatch?.id || null,
        lembaga_id: lembagaMatch?.id || null,
        gender_kelas: gender_kelas?.trim() || null,
        domisili: domisili?.trim() || null,
        alamat: alamat?.trim() || null,
        nomor_whatsapp: nomor_whatsapp?.trim() || null,
        status_aktif: true,
      });
      count++;
    }
    showToast(`${count} murid berhasil diimpor`, 'success');
    fetchList();
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama murid..." className="input-field text-xs pl-8" />
        </div>
        <select value={filterKelas} onChange={e => setFilterKelas(e.target.value)} className="input-field text-xs py-2 w-28">
          <option value="">Semua Kelas</option>
          {kelasOptions.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
        </select>
        <select value={filterLembaga} onChange={e => setFilterLembaga(e.target.value)} className="input-field text-xs py-2 w-32">
          <option value="">Semua Lembaga</option>
          {lembagaList.map(l => <option key={l.id} value={l.id}>{l.nama_lembaga}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Tambah</button>
        <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors"><Upload className="w-3.5 h-3.5" /> Import CSV</button>
        <button onClick={handleExportCSV} className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"><Download className="w-3.5 h-3.5" /> Export CSV</button>
        <button onClick={handleExportPDF} className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors"><FileText className="w-3.5 h-3.5" /> Export PDF</button>
        <button onClick={handleShareWA} className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors"><Share2 className="w-3.5 h-3.5" /> Share WA</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada data murid" icon={<GraduationCap className="w-8 h-8 text-slate-300" />} />
      ) : (
        <>
          <div className="space-y-1">
            {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((m: any) => {
              const lembagaNama = lembagaList.find(l => l.id === m.lembaga_id)?.nama_lembaga;
              return (
                <div key={m.id} className="card p-2.5 flex items-center gap-2.5 group">
                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{m.nama}</p>
                    <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500">
                      <span className="badge badge-success text-[9px]">{kelasOptions.find(k => k.id === m.kelas_id)?.nama_kelas ?? m.kelas ?? '-'}</span>
                      {lembagaNama && <span className="truncate">{lembagaNama}</span>}
                      {m.status_aktif === false && <span className="text-rose-500">Non-aktif</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(m)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
        </>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Murid' : 'Tambah Murid'}>
          <div className="space-y-3">
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Lengkap *</label><input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="input-field text-xs" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelas *</label>
                <SearchableSelect value={form.kelas_id} onChange={v => { const k = kelasOptions.find(k => k.id === v); setForm({ ...form, kelas_id: v, kelas: k?.nama_kelas ?? '' }); }} options={dbKelasOptions} placeholder="Pilih kelas" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
                <SearchableSelect value={form.lembaga_id} onChange={v => setForm({ ...form, lembaga_id: v })} options={lembagaOptions} placeholder="Pilih lembaga" />
              </div>
            </div>
            {settings.genderEnabled && (
              <div className="grid grid-cols-2 gap-2">
                <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jenis Kelamin</label>
                  <select value={form.jenis_kelamin} onChange={e => setForm({ ...form, jenis_kelamin: e.target.value as 'L' | 'P' })} className="input-field text-xs">
                    <option value="">Pilih</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Gender Kelas</label>
                  <select value={form.gender_kelas} onChange={e => setForm({ ...form, gender_kelas: e.target.value as GenderKelas })} className="input-field text-xs">
                    <option value="">Pilih</option>
                    {settings.genderOptions.map(g => <option key={g} value={g}>{g === 'Banin' ? settings.genderLabelBanin : g === 'Banat' ? settings.genderLabelBanat : settings.genderLabelCampuran}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Domisili</label><input type="text" value={form.domisili} onChange={e => setForm({ ...form, domisili: e.target.value })} className="input-field text-xs" /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Alamat</label><textarea value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} className="input-field text-xs" rows={2} /></div>
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">No. WhatsApp</label><input type="text" value={form.nomor_whatsapp} onChange={e => setForm({ ...form, nomor_whatsapp: e.target.value })} className="input-field text-xs" placeholder="08xx" /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.status_aktif} onChange={e => setForm({ ...form, status_aktif: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600" /><span className="text-xs text-slate-600 dark:text-slate-300">Status Aktif</span></label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        title="Data Murid"
        columns={['Nama', 'Lembaga', 'Kelas', 'Gender Kelas', 'Domisili', 'Alamat', 'No HP']}
        note="Kolom Nama wajib. Lembaga & Kelas diisi sesuai nama yang terdaftar. Gender Kelas: Banin/Banat/Campuran."
      />
      {dialog}
    </div>
  );
}

// ====== CRUD Kelas ======
function CrudKelas({ showToast }: { showToast: ShowToast }) {
  const { data: lembagaList = [] } = useLembaga();
  const { confirm, dialog } = useConfirm();
  const { settings } = useSettings();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama_kelas: '', tingkat: '1', kode: '', lembaga_id: '', gender: '' as GenderKelas | '' });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('kelas').select('*').eq('is_active', true).order('nama_kelas');
      if (error) throw error;
      setList(data || []);
    } catch { showToast('Gagal memuat kelas', 'error'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.nama_kelas) { showToast('Nama kelas wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { nama_kelas: form.nama_kelas, tingkat: Number(form.tingkat) || 1, kode: form.kode || null, is_active: true, lembaga_id: form.lembaga_id || null, gender: form.gender || null };
      if (editingId) {
        const { error } = await supabase.from('kelas').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Kelas diperbarui', 'success');
      } else {
        const { error } = await supabase.from('kelas').insert(payload);
        if (error) throw error;
        showToast('Kelas ditambahkan', 'success');
      }
      setShowModal(false); setForm({ nama_kelas: '', tingkat: '1', kode: '', lembaga_id: '', gender: '' }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: item.nama_kelas, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return;
    try { await supabase.from('kelas').delete().eq('id', item.id); showToast('Kelas dihapus', 'success'); fetchList(); } catch { showToast('Gagal menghapus', 'error'); }
  };

  const handleImport = async (rows: string[][]) => {
    let count = 0;
    for (const row of rows) {
      const [nama_kelas, lembaga_nama, tingkat, kode, gender] = row;
      if (!nama_kelas) continue;
      const lembagaMatch = lembagaList.find(l => l.nama_lembaga.toLowerCase() === lembaga_nama?.trim().toLowerCase());
      const validGender = ['Banin', 'Banat', 'Campuran'].includes(gender?.trim() ?? '') ? gender.trim() : null;
      await supabase.from('kelas').insert({ nama_kelas: nama_kelas.trim(), tingkat: Number(tingkat) || 1, kode: kode?.trim() || null, is_active: true, lembaga_id: lembagaMatch?.id || null, gender: validGender });
      count++;
    }
    showToast(`${count} kelas diimpor`, 'success');
    fetchList();
  };

  const handleExportCSV = () => {
    const header = 'No,Nama Kelas,Lembaga,Tingkat,Kode,Gender';
    const rows = filtered.map((k, i) => {
      const lembagaNama = lembagaList.find(l => l.id === k.lembaga_id)?.nama_lembaga || '';
      return `${i + 1},"${k.nama_kelas}","${lembagaNama}",${k.tingkat || ''},"${k.kode || ''}","${k.gender || ''}"`;
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data_kelas.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Data kelas diekspor', 'success');
  };

  const handleExportPDF = () => {
    const headers = ['No', 'Nama Kelas', 'Lembaga', 'Tingkat', 'Kode', 'Gender'];
    const body = filtered.map((k, i) => {
      const lembagaNama = lembagaList.find(l => l.id === k.lembaga_id)?.nama_lembaga || '-';
      return [i + 1, k.nama_kelas, lembagaNama, k.tingkat || '-', k.kode || '-', k.gender || '-'];
    });
    generatePDF('Data Kelas', headers, body, [`Total: ${filtered.length} kelas`, `Cetak: ${new Date().toLocaleDateString('id-ID')}`]);
  };

  const handleShareWA = () => {
    let text = `*DATA KELAS*\n\n`;
    filtered.forEach((k, i) => {
      const lembagaNama = lembagaList.find(l => l.id === k.lembaga_id)?.nama_lembaga || '-';
      text += `${i + 1}. ${k.nama_kelas} | Lembaga: ${lembagaNama} | Tingkat: ${k.tingkat || '-'}${k.gender ? ` | ${k.gender}` : ''}\n`;
    });
    text += `\nTotal: ${filtered.length} kelas`;
    shareWA(text);
  };

  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama_kelas?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <>
    <div className="flex flex-wrap gap-1.5 mb-2">
      <button onClick={handleExportPDF} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"><FileText className="w-3.5 h-3.5" /> PDF</button>
      <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"><Download className="w-3.5 h-3.5" /> CSV</button>
      <button onClick={handleShareWA} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"><Share2 className="w-3.5 h-3.5" /> WhatsApp</button>
    </div>
    <CrudList title="Kelas" icon={School} search={search} setSearch={setSearch}
      onAdd={() => { setForm({ nama_kelas: '', tingkat: '1', kode: '', lembaga_id: '', gender: '' }); setEditingId(null); setShowModal(true); }}
      onImport={() => setShowImport(true)} importLabel="Import"
      loading={loading} list={filtered} page={page} setPage={setPage}
      onEdit={(item) => { setEditingId(item.id); setForm({ nama_kelas: item.nama_kelas || '', tingkat: String(item.tingkat || '1'), kode: item.kode || '', lembaga_id: item.lembaga_id || '', gender: item.gender || '' }); setShowModal(true); }}
      onDelete={handleDelete} displayName={(item) => item.nama_kelas} subInfo={(item) => `Tingkat ${item.tingkat || '-'}`}
      showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave}
      modalTitle={editingId ? 'Edit Kelas' : 'Tambah Kelas'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Kelas *</label><input type="text" value={form.nama_kelas} onChange={e => setForm({ ...form, nama_kelas: e.target.value })} className="input-field text-xs" /></div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
        <SearchableSelect value={form.lembaga_id} onChange={v => setForm({ ...form, lembaga_id: v })} options={lembagaList.map((l: any) => ({ value: l.id, label: l.nama_lembaga }))} placeholder="Pilih lembaga" />
      </div>
      {settings.genderEnabled && (
        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Gender</label>
          <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as GenderKelas })} className="input-field text-xs">
            <option value="">Pilih gender</option>
            {settings.genderOptions.map(g => <option key={g} value={g}>{g === 'Banin' ? settings.genderLabelBanin : g === 'Banat' ? settings.genderLabelBanat : settings.genderLabelCampuran}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tingkat</label><input type="number" value={form.tingkat} onChange={e => setForm({ ...form, tingkat: e.target.value })} className="input-field text-xs" min={1} max={12} /></div><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kode</label><input type="text" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} className="input-field text-xs" /></div></div>
    </CrudList>
    <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={handleImport} title="Kelas" columns={['Nama Kelas', 'Lembaga', 'Tingkat', 'Kode', 'Gender']} note="Nama Kelas wajib. Lembaga: nama lembaga sesuai data. Tingkat: angka. Gender: Banin/Banat/Campuran." />
    {dialog}
    </>
  );
}

// ====== CRUD Ruangan ======
function CrudRuangan({ showToast }: { showToast: ShowToast }) {
  const { data: lembagaList = [] } = useLembaga();
  const { confirm, dialog } = useConfirm();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '', lembaga_id: '' });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => {
    setLoading(true);
    try { const { data, error } = await supabase.from('ruangan').select('*').eq('is_active', true).order('nama_ruangan'); if (error) throw error; setList(data || []); } catch { showToast('Gagal memuat ruangan', 'error'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.nama_ruangan) { showToast('Nama ruangan wajib', 'error'); return; }
    setSaving(true);
    try {
      const payload = { nama_ruangan: form.nama_ruangan, kode: form.kode || null, kapasitas: form.kapasitas ? Number(form.kapasitas) : null, keterangan: form.keterangan || null, is_active: true, lembaga_id: form.lembaga_id || null };
      if (editingId) { const { error } = await supabase.from('ruangan').update(payload).eq('id', editingId); if (error) throw error; showToast('Ruangan diperbarui', 'success'); }
      else { const { error } = await supabase.from('ruangan').insert(payload); if (error) throw error; showToast('Ruangan ditambahkan', 'success'); }
      setShowModal(false); setForm({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '', lembaga_id: '' }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: item.nama_ruangan, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return; try { await supabase.from('ruangan').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal', 'error'); } };
  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama_ruangan?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <>
    <CrudList title="Ruangan" icon={Building2} search={search} setSearch={setSearch}
      onAdd={() => { setForm({ nama_ruangan: '', kode: '', kapasitas: '', keterangan: '', lembaga_id: '' }); setEditingId(null); setShowModal(true); }}
      loading={loading} list={filtered} page={page} setPage={setPage}
      onEdit={(item) => { setEditingId(item.id); setForm({ nama_ruangan: item.nama_ruangan || '', kode: item.kode || '', kapasitas: item.kapasitas?.toString() || '', keterangan: item.keterangan || '', lembaga_id: item.lembaga_id || '' }); setShowModal(true); }}
      onDelete={handleDelete} displayName={(item) => item.nama_ruangan} subInfo={(item) => item.kapasitas ? `Kapasitas ${item.kapasitas}` : ''}
      showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave}
      modalTitle={editingId ? 'Edit Ruangan' : 'Tambah Ruangan'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Ruangan *</label><input type="text" value={form.nama_ruangan} onChange={e => setForm({ ...form, nama_ruangan: e.target.value })} className="input-field text-xs" /></div>
      <div>
        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
        <SearchableSelect value={form.lembaga_id} onChange={v => setForm({ ...form, lembaga_id: v })} options={lembagaList.map((l: any) => ({ value: l.id, label: l.nama_lembaga }))} placeholder="Pilih lembaga" />
      </div>
      <div className="grid grid-cols-2 gap-2"><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kode</label><input type="text" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} className="input-field text-xs" /></div><div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kapasitas</label><input type="number" value={form.kapasitas} onChange={e => setForm({ ...form, kapasitas: e.target.value })} className="input-field text-xs" /></div></div>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Keterangan</label><input type="text" value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} className="input-field text-xs" /></div>
    </CrudList>
    {dialog}
    </>
  );
}

// ====== CRUD Mapel ======
function CrudMapel({ showToast }: { showToast: ShowToast }) {
  const { confirm, dialog } = useConfirm();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama_mapel: '', kelompok: 'Diniyah' as KelompokMapel, kode: '' });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => { setLoading(true); try { const { data, error } = await supabase.from('mata_pelajaran').select('*').eq('is_active', true).order('nama_mapel'); if (error) throw error; setList(data || []); } catch { showToast('Gagal memuat mapel', 'error'); } finally { setLoading(false); } };

  const handleSave = async () => {
    if (!form.nama_mapel) { showToast('Nama mapel wajib', 'error'); return; }
    setSaving(true);
    try {
      const payload = { nama_mapel: form.nama_mapel, kelompok: form.kelompok, kode: form.kode || null, is_active: true };
      if (editingId) { const { error } = await supabase.from('mata_pelajaran').update(payload).eq('id', editingId); if (error) throw error; showToast('Mapel diperbarui', 'success'); }
      else { const { error } = await supabase.from('mata_pelajaran').insert(payload); if (error) throw error; showToast('Mapel ditambahkan', 'success'); }
      setShowModal(false); setForm({ nama_mapel: '', kelompok: 'Diniyah', kode: '' }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleImport = async (rows: string[][]) => {
    let count = 0;
    const valid: KelompokMapel[] = ['Diniyah', 'Umum', 'Bahasa', 'Tahfidz', 'Lainnya'];
    for (const row of rows) {
      const [nama_mapel, kelompok, kode] = row;
      if (!nama_mapel) continue;
      const kel = valid.includes(kelompok as KelompokMapel) ? kelompok as KelompokMapel : 'Diniyah';
      await supabase.from('mata_pelajaran').insert({ nama_mapel: nama_mapel.trim(), kelompok: kel, kode: kode?.trim() || null, is_active: true });
      count++;
    }
    showToast(`${count} mapel diimpor`, 'success');
    fetchList();
  };

  const handleDelete = async (item: any) => { if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: item.nama_mapel, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return; try { await supabase.from('mata_pelajaran').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal', 'error'); } };
  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama_mapel?.toLowerCase().includes(q)); }, [list, search]);

  const handleExportMapelPDF = () => {
    const headers = ['No', 'Nama Mapel', 'Kelompok', 'Kode'];
    const body = filtered.map((m, i) => [i + 1, m.nama_mapel, m.kelompok || '-', m.kode || '-']);
    generatePDF('Data Mata Pelajaran', headers, body, [`Total: ${filtered.length} mapel`, `Cetak: ${new Date().toLocaleDateString('id-ID')}`]);
  };

  const handleExportMapelCSV = () => {
    const header = 'No,Nama Mapel,Kelompok,Kode';
    const rows = filtered.map((m, i) => `${i + 1},"${m.nama_mapel}","${m.kelompok || ''}","${m.kode || ''}"`);
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'data_mapel.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Data mapel diekspor', 'success');
  };

  const handleShareMapelWA = () => {
    let text = `*DATA MATA PELAJARAN*\n\n`;
    filtered.forEach((m, i) => { text += `${i + 1}. ${m.nama_mapel} (${m.kelompok || '-'})${m.kode ? ` [${m.kode}]` : ''}\n`; });
    text += `\nTotal: ${filtered.length} mapel`;
    shareWA(text);
  };

  return (
    <>
    <div className="flex flex-wrap gap-1.5 mb-2">
      <button onClick={handleExportMapelPDF} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"><FileText className="w-3.5 h-3.5" /> PDF</button>
      <button onClick={handleExportMapelCSV} className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"><Download className="w-3.5 h-3.5" /> CSV</button>
      <button onClick={handleShareMapelWA} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"><Share2 className="w-3.5 h-3.5" /> WhatsApp</button>
    </div>
    <CrudList title="Mata Pelajaran" icon={BookOpen} search={search} setSearch={setSearch}
      onAdd={() => { setForm({ nama_mapel: '', kelompok: 'Diniyah', kode: '' }); setEditingId(null); setShowModal(true); }}
      onImport={() => setShowImport(true)} importLabel="Import"
      loading={loading} list={filtered} page={page} setPage={setPage}
      onEdit={(item) => { setEditingId(item.id); setForm({ nama_mapel: item.nama_mapel || '', kelompok: item.kelompok || 'Diniyah', kode: item.kode || '' }); setShowModal(true); }}
      onDelete={handleDelete} displayName={(item) => item.nama_mapel} subInfo={(item) => item.kelompok}
      showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave}
      modalTitle={editingId ? 'Edit Mapel' : 'Tambah Mapel'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Mapel *</label><input type="text" value={form.nama_mapel} onChange={e => setForm({ ...form, nama_mapel: e.target.value })} className="input-field text-xs" /></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kode</label><input type="text" value={form.kode} onChange={e => setForm({ ...form, kode: e.target.value })} className="input-field text-xs" /></div>
        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelompok</label>
          <SearchableSelect value={form.kelompok} onChange={v => setForm({ ...form, kelompok: v as KelompokMapel })} options={['Diniyah', 'Umum', 'Bahasa', 'Tahfidz', 'Lainnya'].map(k => ({ value: k, label: k }))} placeholder="Pilih kelompok" />
        </div>
      </div>
    </CrudList>
    <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={handleImport} title="Mata Pelajaran" columns={['Nama Mapel', 'Kelompok', 'Kode']} note="Kelompok: Diniyah / Umum / Bahasa / Tahfidz / Lainnya. Kode boleh kosong." />
    {dialog}
    </>
  );
}

// ====== CRUD Tahun ======
function CrudTahun({ showToast }: { showToast: ShowToast }) {
  const { confirm, dialog } = useConfirm();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama: '', aktif: false });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => { setLoading(true); try { const { data, error } = await supabase.from('tahun_ajaran').select('*').order('nama'); if (error) throw error; setList(data || []); } catch { showToast('Gagal memuat tahun ajaran', 'error'); } finally { setLoading(false); } };

  const handleSave = async () => {
    if (!form.nama) { showToast('Nama tahun wajib', 'error'); return; }
    setSaving(true);
    try {
      if (form.aktif) { await supabase.from('tahun_ajaran').update({ aktif: false }).neq('id', editingId || 'x'); }
      if (editingId) { const { error } = await supabase.from('tahun_ajaran').update({ nama: form.nama, aktif: form.aktif }).eq('id', editingId); if (error) throw error; showToast('Diperbarui', 'success'); }
      else { const { error } = await supabase.from('tahun_ajaran').insert({ nama: form.nama, aktif: form.aktif }); if (error) throw error; showToast('Ditambahkan', 'success'); }
      setShowModal(false); setForm({ nama: '', aktif: false }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: item.nama, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return; try { await supabase.from('tahun_ajaran').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal', 'error'); } };
  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <>
    <CrudList title="Tahun Ajaran" icon={Calendar} search={search} setSearch={setSearch}
      onAdd={() => { setForm({ nama: '', aktif: false }); setEditingId(null); setShowModal(true); }}
      loading={loading} list={filtered} page={page} setPage={setPage}
      onEdit={(item) => { setEditingId(item.id); setForm({ nama: item.nama || '', aktif: item.aktif ?? false }); setShowModal(true); }}
      onDelete={handleDelete} displayName={(item) => item.nama} subInfo={(item) => item.aktif ? '✓ Aktif' : ''}
      showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave}
      modalTitle={editingId ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Tahun Ajaran *</label><input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="input-field text-xs" placeholder="Contoh: 2026/2027" /></div>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.aktif} onChange={e => setForm({ ...form, aktif: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600" /><span className="text-xs text-slate-600 dark:text-slate-300">Set sebagai aktif</span></label>
    </CrudList>
    {dialog}
    </>
  );
}

// ====== CRUD Semester ======
function CrudSemester({ showToast }: { showToast: ShowToast }) {
  const { confirm, dialog } = useConfirm();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({ nama: '', aktif: false });

  useEffect(() => { fetchList(); }, []);
  const fetchList = async () => { setLoading(true); try { const { data, error } = await supabase.from('semester').select('*').order('nama'); if (error) throw error; setList(data || []); } catch { showToast('Gagal memuat semester', 'error'); } finally { setLoading(false); } };

  const handleSave = async () => {
    if (!form.nama) { showToast('Nama semester wajib', 'error'); return; }
    setSaving(true);
    try {
      if (form.aktif) { await supabase.from('semester').update({ aktif: false }).neq('id', editingId || 'x'); }
      if (editingId) { const { error } = await supabase.from('semester').update({ nama: form.nama, aktif: form.aktif }).eq('id', editingId); if (error) throw error; showToast('Diperbarui', 'success'); }
      else { const { error } = await supabase.from('semester').insert({ nama: form.nama, aktif: form.aktif }); if (error) throw error; showToast('Ditambahkan', 'success'); }
      setShowModal(false); setForm({ nama: '', aktif: false }); setEditingId(null); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => { if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: item.nama, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return; try { await supabase.from('semester').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal', 'error'); } };
  const filtered = useMemo(() => { if (!search) return list; const q = search.toLowerCase(); return list.filter(i => i.nama?.toLowerCase().includes(q)); }, [list, search]);

  return (
    <>
    <CrudList title="Semester" icon={BookOpen} search={search} setSearch={setSearch}
      onAdd={() => { setForm({ nama: '', aktif: false }); setEditingId(null); setShowModal(true); }}
      loading={loading} list={filtered} page={page} setPage={setPage}
      onEdit={(item) => { setEditingId(item.id); setForm({ nama: item.nama || '', aktif: item.aktif ?? false }); setShowModal(true); }}
      onDelete={handleDelete} displayName={(item) => item.nama} subInfo={(item) => item.aktif ? '✓ Aktif' : ''}
      showModal={showModal} onClose={() => setShowModal(false)} saving={saving} onSave={handleSave}
      modalTitle={editingId ? 'Edit Semester' : 'Tambah Semester'}>
      <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama Semester *</label><input type="text" value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} className="input-field text-xs" placeholder="Contoh: Ganjil / Genap" /></div>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.aktif} onChange={e => setForm({ ...form, aktif: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600" /><span className="text-xs text-slate-600 dark:text-slate-300">Set sebagai aktif</span></label>
    </CrudList>
    {dialog}
    </>
  );
}

// ====== Hari Belajar ======
const HARI_LIST = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

function CrudHariBelajar({ showToast }: { showToast: ShowToast }) {
  const [activeHari, setActiveHari] = useState<string[]>(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Sabtu', 'Ahad']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchHari(); }, []);

  const fetchHari = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('hari_belajar').select('nama_hari').eq('is_active', true);
      if (data && data.length > 0) {
        setActiveHari(data.map((h: any) => h.nama_hari));
      }
    } catch {
      // use default if table doesn't exist
    } finally {
      setLoading(false);
    }
  };

  const toggleHari = (hari: string) => {
    if (hari === 'Jumat') { showToast('Jumat adalah hari libur — tidak dapat diaktifkan', 'error'); return; }
    setActiveHari(prev => prev.includes(hari) ? prev.filter(h => h !== hari) : [...prev, hari]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('hari_belajar').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (activeHari.length > 0) {
        await supabase.from('hari_belajar').insert(activeHari.map(h => ({ nama_hari: h, is_active: true })));
      }
      showToast('Hari belajar disimpan', 'success');
    } catch {
      showToast('Pengaturan disimpan', 'success');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Hari Belajar Aktif</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Pilih hari-hari yang aktif untuk kegiatan belajar mengajar. Jumat adalah hari libur.</p>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {HARI_LIST.map(hari => {
            const isJumat = hari === 'Jumat';
            const isActive = activeHari.includes(hari);
            return (
              <button
                key={hari}
                onClick={() => toggleHari(hari)}
                disabled={isJumat}
                className={`py-3 px-2 rounded-xl text-xs font-bold text-center transition-all border ${
                  isJumat
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-400 border-rose-200 dark:border-rose-800 cursor-not-allowed'
                    : isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="block">{hari.slice(0, 3)}</span>
                {isJumat && <span className="text-[9px] mt-0.5 block">Libur</span>}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-slate-400 mt-3">{activeHari.length} dari {HARI_LIST.length - 1} hari aktif</p>
      </div>
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
        {saving ? 'Menyimpan...' : 'Simpan Hari Belajar'}
      </button>
    </div>
  );
}

// ====== Jam Pelajaran ======
const DEFAULT_BATAS = { batas_terlambat: 15, batas_edit_absensi: 40, batas_terlambat_presensi: 15, batas_edit_presensi: 40 };

function CrudJamPelajaran({ showToast }: { showToast: ShowToast }) {
  const { confirm, dialog } = useConfirm();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    nama_jam: '', jam_mulai: '', jam_selesai: '', urutan: 1,
    ...DEFAULT_BATAS,
  });

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('jam_pelajaran').select('*').order('urutan');
      if (error) throw error;
      setList(data || []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = (nextUrutan?: number) => setForm({
    nama_jam: '', jam_mulai: '', jam_selesai: '', urutan: nextUrutan ?? (list.length || 0) + 1,
    ...DEFAULT_BATAS,
  });

  const handleSave = async () => {
    if (!form.jam_mulai || !form.jam_selesai) { showToast('Jam mulai dan selesai wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const nama_jam = form.nama_jam || `Jam ke-${form.urutan}`;
      const payload = {
        nama_jam, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai, urutan: form.urutan, is_active: true,
        batas_terlambat: form.batas_terlambat,
        batas_edit_absensi: form.batas_edit_absensi,
        batas_terlambat_presensi: form.batas_terlambat_presensi,
        batas_edit_presensi: form.batas_edit_presensi,
      };
      if (editingId) {
        const { error } = await supabase.from('jam_pelajaran').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Jam pelajaran diperbarui', 'success');
      } else {
        const { error } = await supabase.from('jam_pelajaran').insert(payload);
        if (error) throw error;
        showToast('Jam pelajaran ditambahkan', 'success');
      }
      setShowModal(false); setEditingId(null); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (item: any) => {
    if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: item.nama_jam, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return;
    try { await supabase.from('jam_pelajaran').delete().eq('id', item.id); showToast('Dihapus', 'success'); fetchList(); } catch { showToast('Gagal', 'error'); }
  };

  const generateDefault = async () => {
    setSaving(true);
    const b = DEFAULT_BATAS;
    const defaults = [
      { nama_jam: 'Jam ke-1', jam_mulai: '07:00', jam_selesai: '07:45', urutan: 1, is_active: true, ...b },
      { nama_jam: 'Jam ke-2', jam_mulai: '07:45', jam_selesai: '08:30', urutan: 2, is_active: true, ...b },
      { nama_jam: 'Jam ke-3', jam_mulai: '08:30', jam_selesai: '09:15', urutan: 3, is_active: true, ...b },
      { nama_jam: 'Istirahat', jam_mulai: '09:15', jam_selesai: '09:45', urutan: 4, is_active: true, batas_terlambat: 0, batas_edit_absensi: 0, batas_terlambat_presensi: 0, batas_edit_presensi: 0 },
      { nama_jam: 'Jam ke-4', jam_mulai: '09:45', jam_selesai: '10:30', urutan: 5, is_active: true, ...b },
      { nama_jam: 'Jam ke-5', jam_mulai: '10:30', jam_selesai: '11:15', urutan: 6, is_active: true, ...b },
      { nama_jam: 'Jam ke-6', jam_mulai: '11:15', jam_selesai: '12:00', urutan: 7, is_active: true, ...b },
      { nama_jam: 'Jam ke-7', jam_mulai: '13:00', jam_selesai: '13:45', urutan: 8, is_active: true, ...b },
    ];
    try {
      await supabase.from('jam_pelajaran').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      const { error } = await supabase.from('jam_pelajaran').insert(defaults);
      if (error) throw error;
      showToast('8 jam pelajaran default dibuat', 'success');
      fetchList();
    } catch (err: any) {
      showToast('Gagal: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => { resetForm(); setEditingId(null); setShowModal(true); }} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Tambah</button>
        <button onClick={generateDefault} disabled={saving} className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 hover:bg-amber-100 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} /> Generate Default (8 jam)
        </button>
      </div>

      {list.length === 0 ? (
        <EmptyState title="Belum ada jam pelajaran" description="Klik Generate Default untuk membuat 8 jam pelajaran standar." icon={<Clock className="w-8 h-8 text-slate-300" />} />
      ) : (
        <>
          <div className="space-y-1">
            {list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(item => (
              <div key={item.id} className="card p-2.5 group">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-sky-600">{item.urutan}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{item.nama_jam}</p>
                    <p className="text-[9px] text-slate-500">{item.jam_mulai} - {item.jam_selesai}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => {
                        setEditingId(item.id);
                        setForm({
                          nama_jam: item.nama_jam || '',
                          jam_mulai: item.jam_mulai || '',
                          jam_selesai: item.jam_selesai || '',
                          urutan: item.urutan || 1,
                          batas_terlambat: item.batas_terlambat ?? DEFAULT_BATAS.batas_terlambat,
                          batas_edit_absensi: item.batas_edit_absensi ?? DEFAULT_BATAS.batas_edit_absensi,
                          batas_terlambat_presensi: item.batas_terlambat_presensi ?? DEFAULT_BATAS.batas_terlambat_presensi,
                          batas_edit_presensi: item.batas_edit_presensi ?? DEFAULT_BATAS.batas_edit_presensi,
                        });
                        setShowModal(true);
                      }}
                      className="p-1.5 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"
                    ><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                {/* Batas kehadiran badges */}
                <div className="flex flex-wrap gap-1.5 mt-1.5 ml-10">
                  <span className="text-[9px] bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                    Terlambat: {item.batas_terlambat ?? 15} mnt
                  </span>
                  <span className="text-[9px] bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 px-1.5 py-0.5 rounded font-medium">
                    Edit absensi: {item.batas_edit_absensi ?? 40} mnt
                  </span>
                  <span className="text-[9px] bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded font-medium">
                    Presensi terlambat: {item.batas_terlambat_presensi ?? 15} mnt
                  </span>
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-medium">
                    Edit presensi: {item.batas_edit_presensi ?? 40} mnt
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={Math.ceil(list.length / PAGE_SIZE)} onPageChange={setPage} />
        </>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); setEditingId(null); }} title={editingId ? 'Edit Jam Pelajaran' : 'Tambah Jam Pelajaran'}>
          <div className="space-y-3">
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Nama (opsional)</label><input type="text" value={form.nama_jam} onChange={e => setForm({ ...form, nama_jam: e.target.value })} className="input-field text-xs" placeholder="Contoh: Jam ke-1" /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Urutan</label><input type="number" value={form.urutan} onChange={e => setForm({ ...form, urutan: Number(e.target.value) })} className="input-field text-xs" min={1} /></div>
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Mulai *</label><input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} className="input-field text-xs" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Selesai *</label><input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} className="input-field text-xs" /></div>
            </div>

            {/* Batas kehadiran */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide mb-2">Batas Kehadiran (menit dari jam mulai)</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-amber-600 dark:text-amber-400 mb-1">Batas Terlambat Absensi</label>
                  <input type="number" value={form.batas_terlambat} onChange={e => setForm({ ...form, batas_terlambat: Number(e.target.value) })} className="input-field text-xs" min={0} max={120} />
                  <p className="text-[9px] text-slate-400 mt-0.5">Menit toleransi sebelum dihitung terlambat</p>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-sky-600 dark:text-sky-400 mb-1">Batas Edit Absensi</label>
                  <input type="number" value={form.batas_edit_absensi} onChange={e => setForm({ ...form, batas_edit_absensi: Number(e.target.value) })} className="input-field text-xs" min={0} max={999} />
                  <p className="text-[9px] text-slate-400 mt-0.5">Menit setelah jam mulai, edit masih diizinkan</p>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-violet-600 dark:text-violet-400 mb-1">Batas Terlambat Presensi Ustaz</label>
                  <input type="number" value={form.batas_terlambat_presensi} onChange={e => setForm({ ...form, batas_terlambat_presensi: Number(e.target.value) })} className="input-field text-xs" min={0} max={120} />
                  <p className="text-[9px] text-slate-400 mt-0.5">Menit toleransi presensi ustaz</p>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Batas Edit Presensi Ustaz</label>
                  <input type="number" value={form.batas_edit_presensi} onChange={e => setForm({ ...form, batas_edit_presensi: Number(e.target.value) })} className="input-field text-xs" min={0} max={999} />
                  <p className="text-[9px] text-slate-400 mt-0.5">Menit setelah jam mulai, edit presensi diizinkan</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}
      {dialog}
    </div>
  );
}

// ====== Reusable CRUD List ======
interface CrudListProps {
  title: string;
  icon: React.ElementType;
  search: string;
  setSearch: (v: string) => void;
  onAdd: () => void;
  onImport?: () => void;
  importLabel?: string;
  loading: boolean;
  list: any[];
  page: number;
  setPage: (p: number) => void;
  onEdit: (item: any) => void;
  onDelete: (item: any) => void;
  displayName: (item: any) => string;
  subInfo?: (item: any) => string;
  showModal: boolean;
  onClose: () => void;
  saving: boolean;
  onSave: () => void;
  modalTitle: string;
  children: React.ReactNode;
}

function CrudList({ title, icon: Icon, search, setSearch, onAdd, onImport, importLabel, loading, list, page, setPage, onEdit, onDelete, displayName, subInfo, showModal, onClose, saving, onSave, modalTitle, children }: CrudListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={`Cari ${title.toLowerCase()}...`} className="input-field text-xs pl-8" />
        </div>
        {onImport && (
          <button onClick={onImport} className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors">
            <Upload className="w-3.5 h-3.5" /> {importLabel || 'Import'}
          </button>
        )}
        <button onClick={onAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Tambah</button>
      </div>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div> : list.length === 0 ? (
        <EmptyState title={`Tidak ada ${title.toLowerCase()}`} icon={<Icon className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((item: any) => (
            <div key={item.id} className="card p-2.5 flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-sky-600 dark:text-sky-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{displayName(item)}</p>
                {subInfo?.(item) && <p className="text-[9px] text-slate-500 dark:text-slate-400">{subInfo(item)}</p>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => onEdit(item)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => onDelete(item)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
          <Pagination currentPage={page} totalPages={Math.ceil(list.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}
      {showModal && (
        <Modal isOpen={true} onClose={onClose} title={modalTitle}>
          <div className="space-y-3">{children}<div className="flex gap-2 pt-2"><button onClick={onClose} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button><button onClick={onSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Simpan</button></div></div>
        </Modal>
      )}
    </div>
  );
}
