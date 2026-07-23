import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, Plus, Pencil, Trash2, Search, FileText,
  X, AlertCircle, Upload, Download, Share2, Filter, RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import SearchableSelect from '../../components/SearchableSelect';
import { useLembaga } from '../../hooks/useLembaga';
import { useConfirm } from '../../hooks/useConfirm';
import { useSettings } from '../../store/useSettings';
import { shareWA } from '../../lib/pdf';
import type { ShowToast, Profile, JadwalMengajar, GenderKelas } from '../../types';

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

    const grouped: Record<string, JadwalMengajar[]> = {};
    filtered.forEach(j => {
      if (!grouped[j.hari]) grouped[j.hari] = [];
      grouped[j.hari].push(j);
    });

    const filterDesc: string[] = [];
    if (filterHari) filterDesc.push(`Hari: ${filterHari}`);
    if (filterUstazId) filterDesc.push(`Ustaz: ${ustazOptions.find(o => o.value === filterUstazId)?.label || '-'}`);
    if (filterLembagaId) filterDesc.push(`Lembaga: ${lembagaList.find(l => l.id === filterLembagaId)?.nama_lembaga || '-'}`);

    let text = `*JADWAL MENGAJAR*\n`;
    if (filterDesc.length > 0) text += `Filter: ${filterDesc.join(' | ')}\n`;
    text += `\n`;

    hariOptions.forEach(hari => {
      const items = grouped[hari];
      if (!items || items.length === 0) return;
      text += `*${hari}*\n`;
      items.forEach(j => {
        const ustazNama = ustazOptions.find(o => o.value === j.user_id)?.label || '-';
        const waktu = `${j.jam_mulai?.slice(0, 5)}-${j.jam_selesai?.slice(0, 5)}`;
        text += `  • ${waktu} | ${j.pelajaran} | ${j.kelas}`;
        if (j.ruangan) text += ` | ${j.ruangan}`;
        text += ` | ${ustazNama}\n`;
      });
      text += '\n';
    });

    text += `Total: ${filtered.length} jadwal\nDibuat: ${new Date().toLocaleDateString('id-ID')}`;
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
            <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-200 hover:bg-sky-100 transition-colors"><Upload className="w-3.5 h-3.5" /> Import CSV</button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 hover:bg-emerald-100 transition-colors"><Download className="w-3.5 h-3.5" /> Export CSV</button>
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
        <div className="card p-6 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Jadwal Ujian</p>
          <p className="text-xs text-slate-400 mt-1">Fitur jadwal ujian akan tersedia segera</p>
        </div>
      )}

      {subTab === 'kalender' && (
        <div className="card p-6 text-center">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Kalender Akademik</p>
          <p className="text-xs text-slate-400 mt-1">Kalender akademik akan tersedia segera</p>
        </div>
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
