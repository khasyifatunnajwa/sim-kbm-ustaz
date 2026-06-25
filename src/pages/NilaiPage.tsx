import { useState, useEffect } from 'react';
import { Plus, Trash2, BarChart3, FileQuestion } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { Kelas, Murid, Nilai, BankSoal, ShowToast } from '../types';

type Tab = 'nilai' | 'soal';
type NilaiWithMurid = Nilai & { murid?: { nama: string } };
type SoalWithKelas = BankSoal & { kelas?: { nama_kelas: string } };

const JENIS_PENILAIAN = ['UTS', 'UAS', 'Ulangan Harian', 'Tugas', 'Praktek', 'Qiro\'ah', 'Hafalan'];

export default function NilaiPage({ showToast }: { showToast: ShowToast }) {
  const [tab, setTab] = useState<Tab>('nilai');
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [nilaiList, setNilaiList] = useState<NilaiWithMurid[]>([]);
  const [soalList, setSoalList] = useState<SoalWithKelas[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [nilaiForm, setNilaiForm] = useState({
    murid_id: '', pelajaran: '', jenis_penilaian: 'UTS', skor: '', tanggal: today,
  });
  const [soalForm, setSoalForm] = useState({
    kelas_id: '', pelajaran: '', batasan_materi: '', isi_soal: '',
  });

  useEffect(() => {
    supabase.from('kelas').select('*').eq('aktif', true).order('tingkat').then(({ data }) => {
      if (data) { setKelasList(data); if (data.length) setSelectedKelas(data[0].id); }
    });
    fetchSoal();
  }, []);

  useEffect(() => {
    if (selectedKelas) { fetchMurid(selectedKelas); fetchNilai(selectedKelas); }
  }, [selectedKelas]);

  const fetchMurid = async (kelas_id: number) => {
    const { data } = await supabase.from('murid').select('*').eq('kelas_id', kelas_id).eq('status_aktif', true).order('nama');
    if (data) setMuridList(data);
    setLoading(false);
  };

  const fetchNilai = async (kelas_id: number) => {
    const muridIds = await supabase.from('murid').select('id').eq('kelas_id', kelas_id).eq('status_aktif', true).then(r => (r.data ?? []).map(m => m.id));
    if (!muridIds.length) { setNilaiList([]); return; }
    const { data } = await supabase.from('nilai').select('*, murid(nama)').in('murid_id', muridIds).order('tanggal', { ascending: false });
    if (data) setNilaiList(data as any);
  };

  const fetchSoal = async () => {
    const { data } = await supabase.from('bank_soal').select('*, kelas(nama_kelas)').order('created_at', { ascending: false });
    if (data) setSoalList(data as any);
    setLoading(false);
  };

  const handleAddNilai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nilaiForm.murid_id) { showToast('Pilih santri', 'error'); return; }
    const skor = Number(nilaiForm.skor);
    if (isNaN(skor) || skor < 0 || skor > 100) { showToast('Skor harus antara 0-100', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('nilai').insert({
      murid_id: Number(nilaiForm.murid_id), pelajaran: nilaiForm.pelajaran,
      jenis_penilaian: nilaiForm.jenis_penilaian, skor,
      tanggal: nilaiForm.tanggal,
    });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Nilai disimpan!', 'success');
    setShowModal(false);
    setNilaiForm({ murid_id: '', pelajaran: '', jenis_penilaian: 'UTS', skor: '', tanggal: today });
    if (selectedKelas) fetchNilai(selectedKelas);
  };

  const handleAddSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!soalForm.kelas_id) { showToast('Pilih kelas', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('bank_soal').insert({
      kelas_id: Number(soalForm.kelas_id), pelajaran: soalForm.pelajaran,
      batasan_materi: soalForm.batasan_materi || null, isi_soal: soalForm.isi_soal,
    });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Soal ditambahkan!', 'success');
    setShowModal(false);
    setSoalForm({ kelas_id: '', pelajaran: '', batasan_materi: '', isi_soal: '' });
    fetchSoal();
  };

  const deleteNilai = async (id: number) => {
    await supabase.from('nilai').delete().eq('id', id);
    setNilaiList(prev => prev.filter(n => n.id !== id));
    showToast('Dihapus', 'info');
  };

  const deleteSoal = async (id: number) => {
    await supabase.from('bank_soal').delete().eq('id', id);
    setSoalList(prev => prev.filter(s => s.id !== id));
    showToast('Dihapus', 'info');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

  const getSkorColor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 65 ? 'text-amber-600' : 'text-rose-600';
  const getSkorBg = (s: number) => s >= 80 ? 'bg-emerald-50' : s >= 65 ? 'bg-amber-50' : 'bg-rose-50';

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">Nilai & Bank Soal</h2>
          <p className="section-subtitle">Penilaian santri dan arsip soal</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </button>
      </div>

      <div className="tab-switcher mb-5">
        <button onClick={() => setTab('nilai')} className={`tab-btn ${tab === 'nilai' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>Input Nilai</button>
        <button onClick={() => setTab('soal')} className={`tab-btn ${tab === 'soal' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>Bank Soal</button>
      </div>

      {tab === 'nilai' && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
            {kelasList.map(k => (
              <button key={k.id} onClick={() => setSelectedKelas(k.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex-shrink-0 transition-all ${selectedKelas === k.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                {k.nama_kelas}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-16 bg-slate-50 rounded-2xl" />)}</div>
          ) : nilaiList.length === 0 ? (
            <EmptyState title="Belum ada nilai" description="Tambahkan nilai santri untuk kelas yang dipilih." icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-2">
              {nilaiList.map(n => (
                <div key={n.id} className="card p-3.5 flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${getSkorBg(n.skor)}`}>
                    <span className={`font-bold text-base ${getSkorColor(n.skor)}`}>{n.skor}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{(n as any).murid?.nama}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-500">{n.pelajaran}</span>
                      <span className="badge bg-slate-100 text-slate-600 text-[10px]">{n.jenis_penilaian}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(n.tanggal)}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteNilai(n.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'soal' && (
        soalList.length === 0 ? (
          <EmptyState title="Bank soal kosong" description="Tambahkan soal ujian untuk diarsipkan." icon={<FileQuestion className="w-8 h-8 text-slate-300" />} />
        ) : (
          <div className="space-y-3">
            {soalList.map(s => (
              <div key={s.id} className="card p-4">
                <div className="flex items-start gap-2 justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-slate-800 text-sm">{s.pelajaran}</span>
                      {s.kelas && <span className="badge badge-success text-[10px]">{s.kelas.nama_kelas}</span>}
                      {s.batasan_materi && <span className="badge badge-info text-[10px]">{s.batasan_materi}</span>}
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{s.isi_soal}</p>
                  </div>
                  <button onClick={() => deleteSoal(s.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={tab === 'nilai' ? 'Input Nilai' : 'Tambah Soal'} size="sm">
        {tab === 'nilai' ? (
          <form onSubmit={handleAddNilai} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Santri</label>
              <select value={nilaiForm.murid_id} onChange={e => setNilaiForm(p => ({ ...p, murid_id: e.target.value }))} className="input-field text-sm" required>
                <option value="">Pilih Santri</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pelajaran</label>
                <input type="text" value={nilaiForm.pelajaran} onChange={e => setNilaiForm(p => ({ ...p, pelajaran: e.target.value }))} className="input-field text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Skor (0-100)</label>
                <input type="number" value={nilaiForm.skor} onChange={e => setNilaiForm(p => ({ ...p, skor: e.target.value }))} className="input-field text-sm" min="0" max="100" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jenis Penilaian</label>
                <select value={nilaiForm.jenis_penilaian} onChange={e => setNilaiForm(p => ({ ...p, jenis_penilaian: e.target.value }))} className="input-field text-sm">
                  {JENIS_PENILAIAN.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
                <input type="date" value={nilaiForm.tanggal} onChange={e => setNilaiForm(p => ({ ...p, tanggal: e.target.value }))} className="input-field text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddSoal} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
                <select value={soalForm.kelas_id} onChange={e => setSoalForm(p => ({ ...p, kelas_id: e.target.value }))} className="input-field text-sm" required>
                  <option value="">Pilih</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pelajaran</label>
                <input type="text" value={soalForm.pelajaran} onChange={e => setSoalForm(p => ({ ...p, pelajaran: e.target.value }))} className="input-field text-sm" required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Batasan Materi (opsional)</label>
              <input type="text" value={soalForm.batasan_materi} onChange={e => setSoalForm(p => ({ ...p, batasan_materi: e.target.value }))} className="input-field text-sm" placeholder="cth. Bab 1-3..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Isi Soal</label>
              <textarea value={soalForm.isi_soal} onChange={e => setSoalForm(p => ({ ...p, isi_soal: e.target.value }))} className="input-field text-sm resize-none" rows={4} required />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
