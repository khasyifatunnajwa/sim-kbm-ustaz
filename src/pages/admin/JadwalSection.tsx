import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, Plus, Pencil, Trash2, Search, FileText,
  X, AlertCircle, Upload, Share2, Filter, RefreshCw,
  ChevronLeft, ChevronRight, Clock, MapPin, CheckCircle, Download,
} from 'lucide-react';
import { ImportButton, ExportButton } from '../../components/DataButtons';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import SearchableSelect from '../../components/SearchableSelect';
import { useLembaga } from '../../hooks/useLembaga';
import { useConfirm } from '../../hooks/useConfirm';
import { useSettings } from '../../store/useSettings';
import { shareWA, generatePDF } from '../../lib/pdf';
import type { ShowToast, Profile, JadwalMengajar, GenderKelas, KalenderPendidikan, JadwalUjian, Kelas, MataPelajaran } from '../../types';

const hariOptions = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];

const HARI_COLOR: Record<string, string> = {
  Senin:  'bg-sky-600',
  Selasa: 'bg-violet-600',
  Rabu:   'bg-emerald-600',
  Kamis:  'bg-amber-600',
  Jumat:  'bg-rose-600',
  Sabtu:  'bg-slate-600',
  Ahad:   'bg-pink-600',
};

type SubTab = 'jadwal-mengajar' | 'jadwal-ujian' | 'kalender';

// ====== Import Modal ======
interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: string[][]) => Promise<void>;
}
function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const columns = ['User ID Ustaz', 'Hari', 'Jam Mulai', 'Jam Selesai', 'Kelas', 'Mata Pelajaran', 'Ruangan'];

  const handleFile = (f: File) => {
    setFile(f); setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string).replace(/^\uFEFF/, '');
        const rows = text.split('\n').map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        setPreview(rows.filter((r, i) => i > 0 && r.some(c => c)).slice(0, 3));
      } catch { setError('Format file tidak valid'); }
    };
    reader.readAsText(f);
  };

  const downloadTemplate = () => {
    const header = columns.join(',');
    const example = `${'\uFEFF'}${header}\nuser-id-ustaz-disini,Senin,07:00,08:30,Kelas 1A,Fiqih,Ruang A`;
    const blob = new Blob([example], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template_jadwal_mengajar.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Pilih file CSV'); return; }
    setLoading(true);
    try {
      const reader = new FileReader();
      await new Promise<void>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const text = (e.target?.result as string).replace(/^\uFEFF/, '');
            const rows = text.split('\n').map(r => r.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
            const data = rows.filter((r, i) => i > 0 && r.some(c => c));
            await onImport(data);
            resolve();
          } catch (err: any) { reject(err); }
        };
        reader.onerror = reject;
        reader.readAsText(file);
      });
      onClose(); setFile(null); setPreview([]);
    } catch (err: any) { setError(err.message || 'Gagal mengimpor');
    } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={e => { if (e.currentTarget === e.target) { onClose(); setFile(null); setPreview([]); }}}>
      <div className="modal-content max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Import Jadwal Mengajar</h3>
          <button onClick={() => { onClose(); setFile(null); setPreview([]); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 mb-4">
          <div className="flex items-start gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-sky-700 dark:text-sky-400 mb-1">Kolom yang diperlukan:</p>
              <div className="flex flex-wrap gap-1">
                {columns.map((c, i) => <span key={i} className="text-[10px] bg-sky-100 dark:bg-sky-800/40 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded font-mono">{c}</span>)}
              </div>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 mt-1.5">
                User ID Ustaz dapat disalin dari menu Kelola User. Hari: Senin/Selasa/Rabu/Kamis/Jumat/Sabtu/Ahad. Ruangan boleh kosong.
              </p>
            </div>
          </div>
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-xs font-semibold text-sky-700 dark:text-sky-400 hover:underline">
            <Download className="w-3.5 h-3.5" /> Download Template CSV
          </button>
        </div>
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 transition-colors" onClick={() => fileRef.current?.click()}>
          <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          {file ? <p className="text-sm font-semibold text-emerald-600">{file.name}</p> : <p className="text-sm text-slate-400">Klik untuk pilih file CSV</p>}
          <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        </div>
        {preview.length > 0 && (
          <div className="mt-3 overflow-x-auto">
            <p className="text-[10px] font-semibold text-slate-500 mb-1.5">Preview:</p>
            <table className="w-full text-[10px] border-collapse">
              <thead><tr className="bg-slate-50 dark:bg-slate-700/50">{columns.map(c => <th key={c} className="border border-slate-200 px-2 py-1 text-left">{c}</th>)}</tr></thead>
              <tbody>{preview.map((row, i) => <tr key={i}>{columns.map((_, ci) => <td key={ci} className="border border-slate-200 px-2 py-1 truncate max-w-[80px]">{row[ci] || '-'}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        {error && <p className="text-xs text-rose-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={() => { onClose(); setFile(null); setPreview([]); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
          <button onClick={handleSubmit} disabled={loading || !file} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50">
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {loading ? 'Mengimpor...' : 'Import Jadwal'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== Main ======
export default function JadwalSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const { confirm, dialog } = useConfirm();
  const { settings } = useSettings();
  const [subTab, setSubTab] = useState<SubTab>('jadwal-mengajar');
  const [list, setList] = useState<JadwalMengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Filters
  const [filterHari, setFilterHari] = useState('');
  const [filterUstazId, setFilterUstazId] = useState('');
  const [filterLembagaId, setFilterLembagaId] = useState('');
  const [filterGender, setFilterGender] = useState('');

  // Reference data
  const [ustazOptions, setUstazOptions] = useState<{ value: string; label: string }[]>([]);
  const { data: lembagaList = [] } = useLembaga();

  const isAdmin = profile?.role === 'admin';

  const [form, setForm] = useState({
    user_id: '', hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30',
    kelas: '', kelas_id: '', pelajaran: '', mapel_id: '', ruangan: '', lembaga_id: '', guru_pengganti_id: '', is_libur: false,
    gender: '' as GenderKelas | '',
  });

  const subTabs = [
    { id: 'jadwal-mengajar' as SubTab, label: 'Jadwal Mengajar', icon: Calendar },
    { id: 'jadwal-ujian' as SubTab, label: 'Jadwal Ujian', icon: FileText },
    { id: 'kalender' as SubTab, label: 'Kalender', icon: Calendar },
  ];

  const lembagaOptions = useMemo(() => lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  const [dbKelasOptions, setDbKelasOptions] = useState<{value: string; label: string}[]>([]);
  const [dbMapelOptions, setDbMapelOptions] = useState<{value: string; label: string}[]>([]);

  // Menggabungkan list standar dengan data unik yang sudah ada di database
  const kelasOptions = useMemo(() => {
    return dbKelasOptions.length > 0 ? dbKelasOptions : [{ value: '', label: 'Pilih kelas' }];
  }, [dbKelasOptions]);

  const pelajaranOptions = useMemo(() => {
    return dbMapelOptions.length > 0 ? dbMapelOptions : [{ value: '', label: 'Pilih pelajaran' }];
  }, [dbMapelOptions]);

  useEffect(() => { fetchList(); fetchUstaz(); fetchKelasMapel(); }, []);

  const fetchKelasMapel = async () => {
    const { data: kelasData } = await supabase.from('kelas').select('id, nama_kelas').eq('is_active', true).order('nama_kelas');
    if (kelasData) setDbKelasOptions(kelasData.map((k: any) => ({ value: k.id, label: k.nama_kelas })));
    const { data: mapelData } = await supabase.from('mata_pelajaran').select('id, nama_mapel').eq('is_active', true).order('nama_mapel');
    if (mapelData) setDbMapelOptions(mapelData.map((m: any) => ({ value: m.id, label: m.nama_mapel })));
  };

  const fetchUstaz = async () => {
    const { data } = await supabase.from('profiles').select('id, nama_lengkap').in('role', ['ustaz', 'operator']).eq('is_active', true).order('nama_lengkap');
    setUstazOptions((data || []).map((p: any) => ({ value: p.id, label: p.nama_lengkap || '-' })));
  };

  const fetchList = async () => {
    setLoading(true);
    try {
      let q = supabase.from('jadwal_mengajar').select('*').order('hari').order('jam_mulai');
      if (!isAdmin) q = q.eq('user_id', profile?.id || '');
      const { data, error } = await q;
      if (error) throw error;
      setList((data || []) as JadwalMengajar[]);
    } catch (err: any) { showToast('Gagal memuat jadwal: ' + err.message, 'error');
    } finally { setLoading(false); }
  };

  const resetForm = () => {
    setForm({ user_id: isAdmin ? '' : (profile?.id || ''), hari: 'Senin', jam_mulai: '07:00', jam_selesai: '08:30', kelas: '', kelas_id: '', pelajaran: '', mapel_id: '', ruangan: '', lembaga_id: '', guru_pengganti_id: '', is_libur: false, gender: '' });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setShowModal(true); };
  const openEdit = (j: JadwalMengajar) => {
    setEditingId(j.id);
    setForm({ user_id: j.user_id || '', hari: j.hari || 'Senin', jam_mulai: j.jam_mulai?.slice(0, 5) || '07:00', jam_selesai: j.jam_selesai?.slice(0, 5) || '08:30', kelas: j.kelas || '', kelas_id: (j as any).kelas_id ?? '', pelajaran: j.pelajaran || '', mapel_id: (j as any).mapel_id ?? '', ruangan: j.ruangan || '', lembaga_id: (j as any).lembaga_id || '', guru_pengganti_id: (j as any).guru_pengganti_id || '', is_libur: (j as any).is_libur ?? false, gender: (j as any).gender || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.kelas_id || !form.mapel_id || !form.hari) { showToast('Ustaz, kelas, pelajaran, dan hari wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { user_id: form.user_id, hari: form.hari, jam_mulai: form.jam_mulai, jam_selesai: form.jam_selesai || null, kelas: form.kelas, kelas_id: form.kelas_id, pelajaran: form.pelajaran, mapel_id: form.mapel_id, ruangan: form.ruangan || null, lembaga_id: form.lembaga_id || null, guru_pengganti_id: form.guru_pengganti_id || null, is_libur: form.is_libur, gender: form.gender || null };
      if (editingId) {
        const { error } = await supabase.from('jadwal_mengajar').update(payload).eq('id', editingId);
        if (error) throw error;
        showToast('Jadwal diperbarui', 'success');
      } else {
        const { error } = await supabase.from('jadwal_mengajar').insert(payload);
        if (error) throw error;
        showToast('Jadwal ditambahkan', 'success');
      }
      setShowModal(false); resetForm(); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (j: JadwalMengajar) => {
    if (!(await confirm({ title: 'Hapus Data', message: 'Apakah Anda yakin ingin menghapus data berikut?', itemName: `${j.hari} - ${j.pelajaran} (${j.kelas})`, warning: 'Data yang telah dihapus tidak dapat dikembalikan.', variant: 'danger', confirmText: 'Ya, Hapus' }))) return;
    try {
      await supabase.from('jadwal_mengajar').delete().eq('id', j.id);
      showToast('Jadwal dihapus', 'success'); fetchList();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); }
  };

  const handleImport = async (rows: string[][]) => {
    let count = 0;
    for (const row of rows) {
      const [user_id, hari, jam_mulai, jam_selesai, kelas, pelajaran, ruangan] = row;
      if (!user_id || !hari || !kelas || !pelajaran) continue;
      // Look up kelas_id and mapel_id by name
      const kelasMatch = dbKelasOptions.find(k => k.label.toLowerCase() === kelas.trim().toLowerCase());
      const mapelMatch = dbMapelOptions.find(m => m.label.toLowerCase() === pelajaran.trim().toLowerCase());
      await supabase.from('jadwal_mengajar').insert({ user_id: user_id.trim(), hari: hari.trim(), jam_mulai: jam_mulai?.trim() || '07:00', jam_selesai: jam_selesai?.trim() || null, kelas: kelas.trim(), kelas_id: kelasMatch?.value || null, pelajaran: pelajaran.trim(), mapel_id: mapelMatch?.value || null, ruangan: ruangan?.trim() || null });
      count++;
    }
    showToast(`${count} jadwal berhasil diimpor`, 'success');
    fetchList();
  };

  const handleExportCSV = () => {
    const header = 'Hari,Jam Mulai,Jam Selesai,Kelas,Mata Pelajaran,Ruangan,Ustaz';
    const rows = filtered.map(j => {
      const ustazNama = ustazOptions.find(o => o.value === j.user_id)?.label || '-';
      return `"${j.hari}","${j.jam_mulai?.slice(0, 5)}","${j.jam_selesai?.slice(0, 5)}","${j.kelas}","${j.pelajaran}","${j.ruangan || ''}","${ustazNama}"`;
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'jadwal_mengajar.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Jadwal diekspor', 'success');
  };

  const handleShareWA = () => {
    if (filtered.length === 0) { showToast('Tidak ada jadwal untuk dibagikan', 'error'); return; }

    const lembagaNamaHeader = filterLembagaId
      ? (lembagaList.find(l => l.id === filterLembagaId)?.nama_lembaga || 'Madrasah')
      : 'Madrasah';

    const now = new Date();
    const namaHariIndonesia = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const namaBulanIndonesia = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const tanggalHeader = `${namaHariIndonesia[now.getDay()]}, ${now.getDate()} ${namaBulanIndonesia[now.getMonth()]} ${now.getFullYear()}`;

    let text = `*Jadwal Mengajar ${lembagaNamaHeader}*\n`;
    text += `_${tanggalHeader}_\n\n`;

    const grouped: Record<string, JadwalMengajar[]> = {};
    filtered.forEach(j => {
      if (!grouped[j.hari]) grouped[j.hari] = [];
      grouped[j.hari].push(j);
    });

    hariOptions.forEach(hari => {
      const items = grouped[hari];
      if (!items || items.length === 0) return;
      // Sort each hari's items by jam_mulai ascending
      const sorted = [...items].sort((a, b) => (a.jam_mulai || '').localeCompare(b.jam_mulai || ''));
      text += `*${hari}*\n`;
      sorted.forEach(j => {
        const ustazNama = ustazOptions.find(o => o.value === j.user_id)?.label || '-';
        const jamMulai = j.jam_mulai?.slice(0, 5) || '-';
        text += `${jamMulai} | ${ustazNama} | ${j.pelajaran}\n`;
      });
      text += '\n';
    });

    shareWA(text);
  };

  const filtered = useMemo(() => {
    let result = list;
    if (filterHari) result = result.filter(j => j.hari === filterHari);
    if (filterUstazId) result = result.filter(j => j.user_id === filterUstazId);
    if (filterLembagaId) result = result.filter(j => (j as any).lembaga_id === filterLembagaId);
    if (filterGender) result = result.filter(j => (j as any).gender === filterGender);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(j => [j.kelas, j.pelajaran, j.hari, j.ruangan].filter(Boolean).join(' ').toLowerCase().includes(q));
    }
    return result;
  }, [list, filterHari, filterUstazId, filterLembagaId, search, filterGender]);

  const grouped = useMemo(() => {
    const g: Record<string, JadwalMengajar[]> = {};
    filtered.forEach(j => {
      if (!g[j.hari]) g[j.hari] = [];
      g[j.hari].push(j);
    });
    return g;
  }, [filtered]);

  const hasFilters = !!(filterHari || filterUstazId || filterLembagaId || filterGender);

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
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari jadwal..." className="input-field text-xs pl-8" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl border transition-colors ${hasFilters ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400'}`}>
              <Filter className="w-3.5 h-3.5" />
              Filter {hasFilters ? `(${[filterHari, filterUstazId, filterLembagaId].filter(Boolean).length})` : ''}
            </button>
          </div>

          {showFilters && (
            <div className="card p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Hari</label>
                <select value={filterHari} onChange={e => setFilterHari(e.target.value)} className="input-field text-xs py-2">
                  <option value="">Semua Hari</option>
                  {hariOptions.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Ustaz</label>
                <SearchableSelect value={filterUstazId} onChange={v => setFilterUstazId(v)} options={ustazOptions} placeholder="Semua Ustaz" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">Lembaga</label>
                <SearchableSelect value={filterLembagaId} onChange={v => setFilterLembagaId(v)} options={lembagaOptions} placeholder="Semua Lembaga" />
              </div>
              {settings.genderEnabled && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">Gender</label>
                  <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="input-field text-xs py-2">
                    <option value="">Semua Gender</option>
                    {settings.genderOptions.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              )}
              {hasFilters && (
                <button onClick={() => { setFilterHari(''); setFilterUstazId(''); setFilterLembagaId(''); setFilterGender(''); }} className="text-[10px] text-rose-600 hover:underline col-span-full text-left">
                  Hapus semua filter
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs"><Plus className="w-3.5 h-3.5" /> Tambah</button>
            <ImportButton onClick={() => setShowImport(true)} />
            <ExportButton onClick={handleExportCSV} format="csv" />
            <button onClick={handleShareWA} className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 hover:bg-green-100 transition-colors"><Share2 className="w-3.5 h-3.5" /> Share WA</button>
          </div>

          {filtered.length > 0 && (
            <p className="text-[10px] text-slate-400">{filtered.length} jadwal ditampilkan</p>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Tidak ada jadwal" description="Tambah jadwal atau ubah filter." icon={<Calendar className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-3">
              {hariOptions.map(hari => {
                const items = grouped[hari];
                if (!items || items.length === 0) return null;
                const colorClass = HARI_COLOR[hari] || 'bg-slate-600';
                return (
                  <div key={hari} className="card overflow-hidden">
                    <div className={`px-4 py-2.5 flex items-center justify-between ${colorClass}`}>
                      <span className="font-bold text-sm text-white">{hari}</span>
                      <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{items.length} jadwal</span>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                      {items.map(j => {
                        const ustazNama = ustazOptions.find(o => o.value === j.user_id)?.label || '-';
                        const lembagaNama = (j as any).lembaga_id ? lembagaList.find(l => l.id === (j as any).lembaga_id)?.nama_lembaga : undefined;
                        const penggantiNama = (j as any).guru_pengganti_id ? ustazOptions.find(o => o.value === (j as any).guru_pengganti_id)?.label : undefined;
                        return (
                          <div key={j.id} className="px-4 py-3 flex items-center gap-3 group">
                            <div className="w-14 text-center flex-shrink-0">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{j.jam_mulai?.slice(0, 5)}</span>
                              <span className="block text-[9px] text-slate-400">- {j.jam_selesai?.slice(0, 5)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">{j.pelajaran}</span>
                                <span className="badge badge-success text-[10px]">{j.kelas}</span>
                                {lembagaNama && <span className="badge bg-sky-50 text-sky-700 border border-sky-100 text-[10px]">{lembagaNama}</span>}
                                {(j as any).gender && <span className="badge bg-purple-50 text-purple-700 border border-purple-100 text-[10px]">{(j as any).gender}</span>}
                                {(j as any).is_libur && <span className="badge badge-danger text-[10px]">Libur</span>}
                                {penggantiNama && <span className="badge badge-warning text-[10px]">Pengganti: {penggantiNama}</span>}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                                <span>{ustazNama}</span>
                                {j.ruangan && <><span>•</span><span>{j.ruangan}</span></>}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(j)} className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-400 hover:text-emerald-600"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDelete(j)} className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {subTab === 'jadwal-ujian' && (
        <JadwalUjianPanel showToast={showToast} />
      )}

      {subTab === 'kalender' && (
        <KalenderPendidikanPanel showToast={showToast} />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Jadwal' : 'Tambah Jadwal Mengajar'}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ustaz *</label>
              <SearchableSelect value={form.user_id} onChange={v => setForm({ ...form, user_id: v })} options={ustazOptions} placeholder="Pilih ustaz" disabled={!isAdmin} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Hari *</label>
                <SearchableSelect value={form.hari} onChange={v => setForm({ ...form, hari: v })} options={hariOptions.map(h => ({ value: h, label: h }))} placeholder="Pilih hari" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
                <SearchableSelect value={form.lembaga_id} onChange={v => setForm({ ...form, lembaga_id: v })} options={lembagaOptions} placeholder="Pilih lembaga" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Mulai</label><input type="time" value={form.jam_mulai} onChange={e => setForm({ ...form, jam_mulai: e.target.value })} className="input-field text-xs" /></div>
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Selesai</label><input type="time" value={form.jam_selesai} onChange={e => setForm({ ...form, jam_selesai: e.target.value })} className="input-field text-xs" /></div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelas *</label>
                <SearchableSelect
                  value={form.kelas_id}
                  onChange={v => { const k = dbKelasOptions.find(o => o.value === v); setForm({ ...form, kelas_id: v, kelas: k?.label ?? '' }); }}
                  options={kelasOptions}
                  placeholder="Pilih kelas"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Mata Pelajaran *</label>
                <SearchableSelect
                  value={form.mapel_id}
                  onChange={v => { const m = dbMapelOptions.find(o => o.value === v); setForm({ ...form, mapel_id: v, pelajaran: m?.label ?? '' }); }}
                  options={pelajaranOptions}
                  placeholder="Pilih pelajaran"
                />
              </div>
            </div>

            {settings.genderEnabled && (
              <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Gender</label>
                <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as GenderKelas })} className="input-field text-xs">
                  <option value="">Pilih gender</option>
                  {settings.genderOptions.map(g => <option key={g} value={g}>{g === 'Banin' ? settings.genderLabelBanin : g === 'Banat' ? settings.genderLabelBanat : settings.genderLabelCampuran}</option>)}
                </select>
              </div>
            )}
            <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ruangan</label><input type="text" value={form.ruangan} onChange={e => setForm({ ...form, ruangan: e.target.value })} className="input-field text-xs" /></div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Guru Pengganti</label>
              <SearchableSelect value={form.guru_pengganti_id} onChange={v => setForm({ ...form, guru_pengganti_id: v })} options={[{ value: '', label: 'Tidak ada' }, ...ustazOptions]} placeholder="Pilih guru pengganti" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_libur} onChange={e => setForm({ ...form, is_libur: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-emerald-600" /><span className="text-xs text-slate-600 dark:text-slate-300">Libur</span></label>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">{saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null} {saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </Modal>
      )}

      <ImportModal isOpen={showImport} onClose={() => setShowImport(false)} onImport={handleImport} />
      {dialog}
    </div>
  );
}

// ====== KALENDER PENDIDIKAN PANEL ======
const JENIS_KALENDER = ['Libur', 'Ujian', 'Rapat', 'Kegiatan', 'Penting', 'Lainnya'] as const;
const JENIS_KALENDER_COLOR: Record<string, string> = {
  Libur: 'bg-rose-500', Ujian: 'bg-amber-500', Rapat: 'bg-sky-500',
  Kegiatan: 'bg-emerald-500', Penting: 'bg-violet-500', Lainnya: 'bg-slate-400',
};
const JENIS_KALENDER_BADGE: Record<string, string> = {
  Libur: 'badge-danger', Ujian: 'badge-warning', Rapat: 'badge-info',
  Kegiatan: 'badge-success', Penting: 'bg-violet-100 text-violet-700', Lainnya: 'bg-slate-100 text-slate-600',
};
const NAMA_BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const NAMA_HARI_SINGKAT = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

function KalenderPendidikanPanel({ showToast }: { showToast: ShowToast }) {
  const { data: lembagaList = [] } = useLembaga();
  const [events, setEvents] = useState<KalenderPendidikan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    jenis: 'Kegiatan' as typeof JENIS_KALENDER[number],
    tanggal_mulai: new Date().toISOString().split('T')[0],
    tanggal_selesai: '',
    lembaga_id: '',
  });

  const lembagaOptions = useMemo(() => lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);
  const lembagaNameById = useMemo(() => { const m: Record<string, string> = {}; lembagaList.forEach(l => { m[l.id] = l.nama_lembaga; }); return m; }, [lembagaList]);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('kalender_pendidikan').select('*').eq('is_active', true).order('tanggal_mulai', { ascending: true });
      if (error) throw error;
      setEvents((data || []) as KalenderPendidikan[]);
    } catch { showToast('Gagal memuat kalender', 'error'); } finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ judul: '', deskripsi: '', jenis: 'Kegiatan', tanggal_mulai: new Date().toISOString().split('T')[0], tanggal_selesai: '', lembaga_id: '' }); setEditingId(null); };

  const openAdd = (date?: string) => {
    resetForm();
    if (date) setForm(f => ({ ...f, tanggal_mulai: date }));
    setShowModal(true);
  };

  const openEdit = (e: KalenderPendidikan) => {
    setEditingId(e.id);
    setForm({ judul: e.judul, deskripsi: e.deskripsi || '', jenis: (e.jenis as typeof JENIS_KALENDER[number]) || 'Kegiatan', tanggal_mulai: e.tanggal_mulai, tanggal_selesai: e.tanggal_selesai || '', lembaga_id: e.lembaga_id || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.judul || !form.tanggal_mulai) { showToast('Judul dan tanggal mulai wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload = { judul: form.judul, deskripsi: form.deskripsi || null, jenis: form.jenis, tanggal_mulai: form.tanggal_mulai, tanggal_selesai: form.tanggal_selesai || null, lembaga_id: form.lembaga_id || null };
      const { error } = editingId
        ? await supabase.from('kalender_pendidikan').update(payload).eq('id', editingId)
        : await supabase.from('kalender_pendidikan').insert(payload);
      if (error) throw error;
      showToast(editingId ? 'Event diperbarui' : 'Event ditambahkan', 'success');
      setShowModal(false); resetForm(); fetchEvents();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('kalender_pendidikan').delete().eq('id', id);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    setEvents(prev => prev.filter(e => e.id !== id));
    showToast('Event dihapus', 'info');
  };

  const handleExportCSV = () => {
    if (events.length === 0) { showToast('Tidak ada data', 'error'); return; }
    const header = 'Judul,Jenis,Tanggal Mulai,Tanggal Selesai,Deskripsi,Lembaga';
    const rows = events.map(e => `"${e.judul}","${e.jenis}","${e.tanggal_mulai}","${e.tanggal_selesai || ''}","${e.deskripsi || ''}","${e.lembaga_id ? lembagaNameById[e.lembaga_id] || '' : ''}"`);
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kalender_pendidikan.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV berhasil diunduh', 'success');
  };

  const handleShareWA = () => {
    if (events.length === 0) { showToast('Tidak ada data', 'error'); return; }
    let text = `*KALENDER PENDIDIKAN*\n\n`;
    events.forEach((e, i) => {
      text += `${i + 1}. ${e.judul} [${e.jenis}]\n   ${e.tanggal_mulai}${e.tanggal_selesai ? ` s/d ${e.tanggal_selesai}` : ''}\n`;
      if (e.deskripsi) text += `   ${e.deskripsi}\n`;
    });
    shareWA(text);
  };

  // Calendar grid logic
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();

  const getEventsForDate = (dateStr: string) => events.filter(e => {
    const start = e.tanggal_mulai;
    const end = e.tanggal_selesai || e.tanggal_mulai;
    return dateStr >= start && dateStr <= end;
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => { setViewDate(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]); };

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => (e.tanggal_selesai || e.tanggal_mulai) >= today).sort((a, b) => a.tanggal_mulai.localeCompare(b.tanggal_mulai));
  }, [events]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <ExportButton onClick={handleExportCSV} format="csv" label="Export CSV" />
        <button onClick={handleShareWA} className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors">
          <Share2 className="w-3.5 h-3.5" /> Share WA
        </button>
        <button onClick={() => openAdd()} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs">
          <Plus className="w-3.5 h-3.5" /> Tambah Event
        </button>
      </div>

      {/* Calendar View */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{NAMA_BULAN[month]} {year}</p>
            <button onClick={goToday} className="text-[10px] text-emerald-600 hover:underline">Hari Ini</button>
          </div>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {NAMA_HARI_SINGKAT.map(d => <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDate(dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isSelected = dateStr === selectedDate;
            return (
              <button
                key={day}
                onClick={() => setSelectedDate(dateStr)}
                className={`min-h-[44px] p-1 rounded-lg text-left transition-all border ${
                  isSelected ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                  isToday ? 'border-emerald-300 bg-emerald-50/50' :
                  'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                <span className={`text-[10px] font-bold ${isToday ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>{day}</span>
                {dayEvents.length > 0 && (
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className={`h-1 rounded-full ${JENIS_KALENDER_COLOR[e.jenis] || 'bg-slate-400'}`} />
                    ))}
                    {dayEvents.length > 2 && <span className="text-[8px] text-slate-400">+{dayEvents.length - 2}</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date events */}
      {selectedDate && (
        <div className="card p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <button onClick={() => openAdd(selectedDate)} className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 hover:underline">
              <Plus className="w-3 h-3" /> Tambah
            </button>
          </div>
          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">Tidak ada event</p>
          ) : (
            <div className="space-y-1.5">
              {getEventsForDate(selectedDate).map(e => (
                <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 group">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${JENIS_KALENDER_COLOR[e.jenis] || 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{e.judul}</span>
                      <span className={`badge text-[8px] ${JENIS_KALENDER_BADGE[e.jenis] || 'bg-slate-100'}`}>{e.jenis}</span>
                    </div>
                    {e.deskripsi && <p className="text-[10px] text-slate-500 mt-0.5">{e.deskripsi}</p>}
                    {e.tanggal_selesai && e.tanggal_selesai !== e.tanggal_mulai && <p className="text-[9px] text-slate-400">s/d {new Date(e.tanggal_selesai).toLocaleDateString('id-ID')}</p>}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(e)} className="p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming events list */}
      <div className="card p-3">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">Agenda Mendatang</p>
        {loading ? (
          <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
        ) : upcomingEvents.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-2">Belum ada agenda</p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {upcomingEvents.slice(0, 20).map(e => (
              <div key={e.id} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 group">
                <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${JENIS_KALENDER_COLOR[e.jenis] || 'bg-slate-400'} text-white`}>
                  <span className="text-[10px] font-bold leading-none">{new Date(e.tanggal_mulai).getDate()}</span>
                  <span className="text-[7px] leading-none">{NAMA_BULAN[new Date(e.tanggal_mulai).getMonth()].slice(0, 3)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">{e.judul}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className={`badge text-[8px] ${JENIS_KALENDER_BADGE[e.jenis] || 'bg-slate-100'}`}>{e.jenis}</span>
                    {e.lembaga_id && lembagaNameById[e.lembaga_id] && <span className="text-[8px] text-slate-400">{lembagaNameById[e.lembaga_id]}</span>}
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(e)} className="p-1 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Event' : 'Tambah Event Kalender'} size="md">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Judul *</label>
              <input type="text" value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} className="input-field text-xs" placeholder="cth. Libur Idul Adha" required autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jenis</label>
              <div className="grid grid-cols-3 gap-1.5">
                {JENIS_KALENDER.map(j => (
                  <button key={j} type="button" onClick={() => setForm(f => ({ ...f, jenis: j }))} className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${form.jenis === j ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200'}`}>{j}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal Mulai *</label>
                <input type="date" value={form.tanggal_mulai} onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))} className="input-field text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal Selesai</label>
                <input type="date" value={form.tanggal_selesai} onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))} className="input-field text-xs" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
              <SearchableSelect value={form.lembaga_id} onChange={v => setForm(f => ({ ...f, lembaga_id: v }))} options={lembagaOptions} placeholder="Semua Lembaga" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Deskripsi</label>
              <textarea value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} className="input-field text-xs resize-none" rows={2} placeholder="Keterangan event..." />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ====== JADWAL UJIAN PANEL ======
const JENIS_UJIAN_OPT = ['UTS', 'UAS', 'Ulangan', 'Lisan', 'Lainnya'] as const;

function JadwalUjianPanel({ showToast }: { showToast: ShowToast }) {
  const { data: lembagaList = [] } = useLembaga();
  const [list, setList] = useState<JadwalUjian[]>([]);
  const [kalenderList, setKalenderList] = useState<KalenderPendidikan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);

  const [form, setForm] = useState({
    judul: '',
    jenis_ujian: 'Ulangan' as typeof JENIS_UJIAN_OPT[number],
    kelas_id: '',
    mapel_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '',
    jam_selesai: '',
    ruangan: '',
    kalender_id: '',
    lembaga_id: '',
  });

  const lembagaOptions = useMemo(() => lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);
  const lembagaNameById = useMemo(() => { const m: Record<string, string> = {}; lembagaList.forEach(l => { m[l.id] = l.nama_lembaga; }); return m; }, [lembagaList]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uRes, kRes, , mRes, kalRes] = await Promise.all([
        supabase.from('jadwal_ujian').select('*').eq('is_active', true).order('tanggal', { ascending: false }),
        supabase.from('kelas').select('id, nama_kelas, lembaga_id').eq('aktif', true).order('nama_kelas'),
        supabase.from('kelas').select('id, nama_kelas').eq('aktif', true).order('nama_kelas'),
        supabase.from('mata_pelajaran').select('id, nama_mapel').eq('is_active', true).order('nama_mapel'),
        supabase.from('kalender_pendidikan').select('id, judul, tanggal_mulai, tanggal_selesai, jenis').eq('is_active', true).order('tanggal_mulai'),
      ]);
      if (uRes.data) setList(uRes.data as JadwalUjian[]);
      if (kRes.data) setKelasList(kRes.data as Kelas[]);
      if (mRes.data) setMapelList(mRes.data as MataPelajaran[]);
      if (kalRes.data) setKalenderList(kalRes.data as KalenderPendidikan[]);
    } catch { showToast('Gagal memuat data', 'error'); } finally { setLoading(false); }
  };

  const kelasFiltered = useMemo(() => {
    if (!form.lembaga_id) return kelasList;
    return kelasList.filter(k => !k.lembaga_id || k.lembaga_id === form.lembaga_id);
  }, [kelasList, form.lembaga_id]);

  const filtered = useMemo(() => {
    let result = list;
    if (filterJenis) result = result.filter(u => u.jenis_ujian === filterJenis);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u => {
        const kelasNama = kelasList.find(k => k.id === u.kelas_id)?.nama_kelas ?? '';
        const mapelNama = mapelList.find(m => m.id === u.mapel_id)?.nama_mapel ?? '';
        return [u.judul, kelasNama, mapelNama, u.jenis_ujian].filter(Boolean).join(' ').toLowerCase().includes(q);
      });
    }
    return result;
  }, [list, search, filterJenis, kelasList, mapelList]);

  const resetForm = () => { setForm({ judul: '', jenis_ujian: 'Ulangan', kelas_id: '', mapel_id: '', tanggal: new Date().toISOString().split('T')[0], jam_mulai: '', jam_selesai: '', ruangan: '', kalender_id: '', lembaga_id: '' }); setEditingId(null); };

  const openAdd = () => { resetForm(); setShowModal(true); };

  const openEdit = (u: JadwalUjian) => {
    setEditingId(u.id);
    setForm({ judul: u.judul, jenis_ujian: (u.jenis_ujian as typeof JENIS_UJIAN_OPT[number]) || 'Ulangan', kelas_id: u.kelas_id || '', mapel_id: u.mapel_id || '', tanggal: u.tanggal, jam_mulai: u.jam_mulai || '', jam_selesai: u.jam_selesai || '', ruangan: u.ruangan || '', kalender_id: u.kalender_id || '', lembaga_id: u.lembaga_id || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.judul || !form.tanggal) { showToast('Judul dan tanggal wajib diisi', 'error'); return; }
    setSaving(true);
    try {
      const payload = {
        judul: form.judul, jenis_ujian: form.jenis_ujian, kelas_id: form.kelas_id || null, mapel_id: form.mapel_id || null,
        tanggal: form.tanggal, jam_mulai: form.jam_mulai || null, jam_selesai: form.jam_selesai || null,
        ruangan: form.ruangan || null, kalender_id: form.kalender_id || null, lembaga_id: form.lembaga_id || null,
      };
      const { error } = editingId
        ? await supabase.from('jadwal_ujian').update(payload).eq('id', editingId)
        : await supabase.from('jadwal_ujian').insert(payload);
      if (error) throw error;
      showToast(editingId ? 'Jadwal ujian diperbarui' : 'Jadwal ujian ditambahkan', 'success');
      setShowModal(false); resetForm(); fetchAll();
    } catch (err: any) { showToast('Gagal: ' + err.message, 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('jadwal_ujian').delete().eq('id', id);
    if (error) { showToast('Gagal menghapus', 'error'); return; }
    setList(prev => prev.filter(u => u.id !== id));
    showToast('Jadwal ujian dihapus', 'info');
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) { showToast('Tidak ada data', 'error'); return; }
    const header = 'Judul,Jenis,Kelas,Mapel,Tanggal,Jam Mulai,Jam Selesai,Ruangan,Lembaga';
    const rows = filtered.map(u => {
      const kelas = kelasList.find(k => k.id === u.kelas_id)?.nama_kelas || '';
      const mapel = mapelList.find(m => m.id === u.mapel_id)?.nama_mapel || '';
      const lembaga = u.lembaga_id ? lembagaNameById[u.lembaga_id] || '' : '';
      return `"${u.judul}","${u.jenis_ujian}","${kelas}","${mapel}","${u.tanggal}","${u.jam_mulai || ''}","${u.jam_selesai || ''}","${u.ruangan || ''}","${lembaga}"`;
    });
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'jadwal_ujian.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV berhasil diunduh', 'success');
  };

  const handleShareWA = () => {
    if (filtered.length === 0) { showToast('Tidak ada data', 'error'); return; }
    let text = `*JADWAL UJIAN*\n\n`;
    filtered.forEach((u, i) => {
      const kelas = kelasList.find(k => k.id === u.kelas_id)?.nama_kelas || '-';
      const mapel = mapelList.find(m => m.id === u.mapel_id)?.nama_mapel || '-';
      text += `${i + 1}. ${u.judul} [${u.jenis_ujian}]\n   ${mapel} - Kelas ${kelas}\n   ${new Date(u.tanggal).toLocaleDateString('id-ID')}${u.jam_mulai ? ` ${u.jam_mulai}${u.jam_selesai ? `-${u.jam_selesai}` : ''}` : ''}\n`;
    });
    shareWA(text);
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) { showToast('Tidak ada data', 'error'); return; }
    const headers = ['No', 'Judul', 'Jenis', 'Kelas', 'Mapel', 'Tanggal', 'Jam', 'Ruangan'];
    const body = filtered.map((u, i) => [
      i + 1, u.judul, u.jenis_ujian,
      kelasList.find(k => k.id === u.kelas_id)?.nama_kelas || '-',
      mapelList.find(m => m.id === u.mapel_id)?.nama_mapel || '-',
      new Date(u.tanggal).toLocaleDateString('id-ID'),
      u.jam_mulai ? `${u.jam_mulai}${u.jam_selesai ? `-${u.jam_selesai}` : ''}` : '-',
      u.ruangan || '-',
    ]);
    generatePDF('Jadwal Ujian', headers, body, [`Cetak: ${new Date().toLocaleDateString('id-ID')}`]);
    showToast('PDF berhasil diunduh', 'success');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[120px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari ujian..." className="input-field text-xs pl-8" />
        </div>
        <select value={filterJenis} onChange={e => setFilterJenis(e.target.value)} className="input-field text-xs py-2.5 w-28">
          <option value="">Semua</option>
          {JENIS_UJIAN_OPT.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <ExportButton onClick={handleExportPDF} format="pdf" label="PDF" />
        <ExportButton onClick={handleExportCSV} format="csv" label="CSV" />
        <button onClick={handleShareWA} className="flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors">
          <Share2 className="w-3.5 h-3.5" /> WA
        </button>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs">
          <Plus className="w-3.5 h-3.5" /> Tambah
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Belum ada jadwal ujian" description="Tambahkan jadwal ujian atau hubungkan dengan kalender pendidikan." icon={<FileText className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-2">
          {filtered.map(u => {
            const kelasNama = kelasList.find(k => k.id === u.kelas_id)?.nama_kelas || '-';
            const mapelNama = mapelList.find(m => m.id === u.mapel_id)?.nama_mapel || '-';
            const lembagaNama = u.lembaga_id ? lembagaNameById[u.lembaga_id] : undefined;
            const kalenderEvent = kalenderList.find(k => k.id === u.kalender_id);
            return (
              <div key={u.id} className="card p-3 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">{u.judul}</span>
                      <span className="badge badge-warning text-[9px]">{u.jenis_ujian}</span>
                      {lembagaNama && <span className="badge bg-sky-50 text-sky-700 border border-sky-100 text-[9px]">{lembagaNama}</span>}
                      {kalenderEvent && <span className="badge badge-info text-[9px]">Dari Kalender</span>}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                      <span className="font-medium">{mapelNama}</span><span>•</span><span>{kelasNama}</span>
                      <span>•</span><span>{new Date(u.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {u.jam_mulai && <><span>•</span><span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{u.jam_mulai}{u.jam_selesai ? `-${u.jam_selesai}` : ''}</span></>}
                      {u.ruangan && <><span>•</span><span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{u.ruangan}</span></>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(u)} className="p-1.5 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <Modal isOpen={true} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Jadwal Ujian' : 'Tambah Jadwal Ujian'} size="lg">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Judul *</label>
                <input type="text" value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} className="input-field text-xs" placeholder="cth. UTS Ganjil" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jenis Ujian</label>
                <select value={form.jenis_ujian} onChange={e => setForm(f => ({ ...f, jenis_ujian: e.target.value as typeof JENIS_UJIAN_OPT[number] }))} className="input-field text-xs">
                  {JENIS_UJIAN_OPT.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Lembaga</label>
              <SearchableSelect value={form.lembaga_id} onChange={v => setForm(f => ({ ...f, lembaga_id: v, kelas_id: '' }))} options={lembagaOptions} placeholder="Pilih Lembaga" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelas</label>
                <select value={form.kelas_id} onChange={e => setForm(f => ({ ...f, kelas_id: e.target.value }))} className="input-field text-xs">
                  <option value="">Semua Kelas</option>
                  {kelasFiltered.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Mata Pelajaran</label>
                <select value={form.mapel_id} onChange={e => setForm(f => ({ ...f, mapel_id: e.target.value }))} className="input-field text-xs">
                  <option value="">Semua Mapel</option>
                  {mapelList.map(m => <option key={m.id} value={m.id}>{m.nama_mapel}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal *</label>
                <input type="date" value={form.tanggal} onChange={e => setForm(f => ({ ...f, tanggal: e.target.value }))} className="input-field text-xs" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Mulai</label>
                <input type="time" value={form.jam_mulai} onChange={e => setForm(f => ({ ...f, jam_mulai: e.target.value }))} className="input-field text-xs" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Selesai</label>
                <input type="time" value={form.jam_selesai} onChange={e => setForm(f => ({ ...f, jam_selesai: e.target.value }))} className="input-field text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ruangan</label>
                <input type="text" value={form.ruangan} onChange={e => setForm(f => ({ ...f, ruangan: e.target.value }))} className="input-field text-xs" placeholder="cth. Ruang A" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Link ke Kalender</label>
                <select value={form.kalender_id} onChange={e => setForm(f => ({ ...f, kalender_id: e.target.value }))} className="input-field text-xs">
                  <option value="">Tidak terhubung</option>
                  {kalenderList.map(k => <option key={k.id} value={k.id}>{k.judul} ({k.tanggal_mulai})</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
