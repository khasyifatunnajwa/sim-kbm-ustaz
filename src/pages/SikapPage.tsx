import { useState, useEffect, useMemo } from 'react';
import {
  Heart, Award, AlertTriangle, StickyNote, Plus, Trash2, Pencil, Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from '../components/EmptyState';
import type { Murid, CatatanPerilaku, ShowToast } from '../types';

type Jenis = 'prestasi' | 'pelanggaran' | 'catatan';

const JENIS_CONFIG: Record<Jenis, { icon: React.ElementType; bg: string; text: string; border: string; label: string }> = {
  prestasi:    { icon: Award,          bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Prestasi' },
  pelanggaran: { icon: AlertTriangle,  bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    label: 'Pelanggaran' },
  catatan:     { icon: StickyNote,     bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     label: 'Catatan' },
};

export default function SikapPage({ showToast }: { showToast: ShowToast }) {
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [perilakuList, setPerilakuList] = useState<CatatanPerilaku[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterKelas, setFilterKelas] = useState('');
  const [selectedMurid, setSelectedMurid] = useState<string>('');
  const [jenis, setJenis] = useState<Jenis>('catatan');
  const [catatan, setCatatan] = useState('');

  const kelasOptions = useMemo(
    () => [...new Set(muridList.map(m => m.kelas).filter(Boolean))].sort(),
    [muridList]
  );

  const muridFiltered = useMemo(
    () => muridList.filter(m => !filterKelas || m.kelas === filterKelas),
    [muridList, filterKelas]
  );

  const fetchData = async () => {
    setLoading(true);
    const { data: muridData } = await supabase.from('murid').select('*').order('nama');
    if (muridData) setMuridList(muridData as Murid[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (selectedMurid) loadPerilaku(selectedMurid);
    else setPerilakuList([]);
  }, [selectedMurid]);

  const loadPerilaku = async (muridId: string) => {
    const { data } = await supabase.from('catatan_perilaku')
      .select('*').eq('murid_id', muridId)
      .order('created_at', { ascending: false });
    if (data) setPerilakuList(data as CatatanPerilaku[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMurid || !catatan.trim()) { showToast('Pilih santri dan isi catatan', 'error'); return; }
    setSaving(true);
    const payload = { murid_id: selectedMurid, jenis, catatan: catatan.trim() };
    const { error } = editingId
      ? await supabase.from('catatan_perilaku').update({ jenis, catatan: catatan.trim() }).eq('id', editingId)
      : await supabase.from('catatan_perilaku').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(editingId ? 'Catatan diperbarui!' : 'Catatan perilaku disimpan!', 'success');
    setCatatan(''); setEditingId(null);
    loadPerilaku(selectedMurid);
  };

  const openEdit = (p: CatatanPerilaku) => {
    setEditingId(p.id);
    setJenis(p.jenis);
    setCatatan(p.catatan);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('catatan_perilaku').delete().eq('id', id);
    setPerilakuList(prev => prev.filter(p => p.id !== id));
    showToast('Dihapus', 'info');
  };

  const selectedMuridData = muridList.find(m => m.id === selectedMurid);

  return (
    <div>
      <div className="mb-5">
        <h2 className="section-title">Catatan Sikap & Akhlak</h2>
        <p className="section-subtitle">Pantau perkembangan karakter santri</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Filter & Select */}
        <div className="space-y-4">
          <div className="card p-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Kelas</label>
            <select
              className="input-field text-sm"
              value={filterKelas}
              onChange={e => { setFilterKelas(e.target.value); setSelectedMurid(''); }}
            >
              <option value="">Semua Kelas</option>
              {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          <div className="card p-4">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Pilih Santri</label>
            {loading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse" />)}</div>
            ) : muridFiltered.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Tidak ada santri</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {muridFiltered.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMurid(m.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all border ${selectedMurid === m.id ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-100'}`}
                  >
                    {m.nama}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Form & History */}
        <div className="lg:col-span-2 space-y-4">
          {selectedMurid ? (
            <>
              {/* Form */}
              <div className="card p-5">
                <h3 className="font-bold text-slate-800 mb-4 text-sm">
                  Catatan untuk: <span className="text-emerald-600">{selectedMuridData?.nama}</span>
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">Jenis Catatan</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(JENIS_CONFIG) as Jenis[]).map(j => {
                        const config = JENIS_CONFIG[j];
                        const Icon = config.icon;
                        return (
                          <button
                            key={j}
                            type="button"
                            onClick={() => setJenis(j)}
                            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${jenis === j ? `${config.bg} ${config.text} ${config.border} ring-2 ring-offset-1` : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan</label>
                    <textarea
                      rows={3}
                      className="input-field text-sm resize-none"
                      placeholder="Tulis catatan perilaku, prestasi, atau pelanggaran..."
                      value={catatan}
                      onChange={e => setCatatan(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    {editingId && (
                      <button type="button" onClick={() => { setEditingId(null); setCatatan(''); }} className="btn-secondary text-sm">
                        Batal Edit
                      </button>
                    )}
                    <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 text-sm">
                      <Plus className="w-4 h-4" />
                      {saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>

              {/* History */}
              <div className="card p-5">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
                  <Heart className="w-4 h-4 text-slate-400" />
                  Histori Sikap Santri
                </h3>
                <div className="space-y-3">
                  {perilakuList.map(p => {
                    const config = JENIS_CONFIG[p.jenis];
                    const Icon = config.icon;
                    return (
                      <div key={p.id} className={`p-3.5 rounded-xl border group transition-all hover:shadow-sm ${config.bg} ${config.border}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Icon className={`w-4 h-4 ${config.text}`} />
                          <span className={`text-xs font-bold uppercase ${config.text}`}>{config.label}</span>
                          <span className="text-[10px] text-slate-400 ml-auto">
                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-slate-700 font-medium text-sm leading-relaxed pr-8">{p.catatan}</p>
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/50 text-slate-400 hover:text-emerald-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-white/50 text-slate-400 hover:text-rose-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {perilakuList.length === 0 && (
                    <EmptyState title="Belum ada catatan" description="Belum ada rekam jejak sikap tercatat." />
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card border-dashed border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">
                Pilih kelas dan santri di sebelah kiri untuk mengelola catatan sikap
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
