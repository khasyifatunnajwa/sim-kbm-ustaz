import { useState, useEffect } from 'react';
import { Plus, Trash2, BookOpen, CheckCircle, Clock, BookMarked } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import type { Kelas, KbmHarian, BukuSaku, Muhafadhoh, ShowToast } from '../types';

type Tab = 'kbm' | 'bukusaku' | 'hafalan';

type KbmWithKelas = KbmHarian & { kelas?: { nama_kelas: string } };
type BukuWithKelas = BukuSaku & { kelas?: { nama_kelas: string } };
type HafalWithKelas = Muhafadhoh & { kelas?: { nama_kelas: string } };

export default function KbmPage({ showToast }: { showToast: ShowToast }) {
  const [tab, setTab] = useState<Tab>('kbm');
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [kbmList, setKbmList] = useState<KbmWithKelas[]>([]);
  const [bukuList, setBukuList] = useState<BukuWithKelas[]>([]);
  const [hafalList, setHafalList] = useState<HafalWithKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const [kbmForm, setKbmForm] = useState({ tanggal: today, kelas_id: '', pelajaran: '', materi: '', catatan: '', durasi: '60', selesai: false });
  const [bukuForm, setBukuForm] = useState({ kelas_id: '', pelajaran: '', bab_terakhir: '', halaman_terakhir: '', catatan: '' });
  const [hafalForm, setHafalForm] = useState({ tanggal: today, kelas_id: '', materi: '', target_hafalan: '', catatan: '' });

  const fetchAll = async () => {
    setLoading(true);
    const [kr, kbmR, bukuR, hafalR] = await Promise.all([
      supabase.from('kelas').select('*').eq('aktif', true).order('tingkat'),
      supabase.from('kbm_harian').select('*, kelas(nama_kelas)').order('tanggal', { ascending: false }).limit(50),
      supabase.from('buku_saku').select('*, kelas(nama_kelas)').order('created_at', { ascending: false }),
      supabase.from('muhafadhoh').select('*, kelas(nama_kelas)').order('tanggal', { ascending: false }).limit(50),
    ]);
    if (kr.data) setKelasList(kr.data);
    if (kbmR.data) setKbmList(kbmR.data);
    if (bukuR.data) setBukuList(bukuR.data);
    if (hafalR.data) setHafalList(hafalR.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleAddKbm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbmForm.kelas_id) { showToast('Pilih kelas', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('kbm_harian').insert({
      tanggal: kbmForm.tanggal, kelas_id: Number(kbmForm.kelas_id),
      pelajaran: kbmForm.pelajaran, materi: kbmForm.materi || null,
      catatan: kbmForm.catatan || null, durasi: Number(kbmForm.durasi) || null,
      selesai: kbmForm.selesai,
    });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('KBM dicatat!', 'success');
    setShowModal(false);
    setKbmForm({ tanggal: today, kelas_id: '', pelajaran: '', materi: '', catatan: '', durasi: '60', selesai: false });
    fetchAll();
  };

  const handleAddBuku = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bukuForm.kelas_id) { showToast('Pilih kelas', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('buku_saku').insert({
      kelas_id: Number(bukuForm.kelas_id), pelajaran: bukuForm.pelajaran,
      bab_terakhir: bukuForm.bab_terakhir || null,
      halaman_terakhir: bukuForm.halaman_terakhir || null,
      catatan: bukuForm.catatan || null,
    });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Buku saku diperbarui!', 'success');
    setShowModal(false);
    setBukuForm({ kelas_id: '', pelajaran: '', bab_terakhir: '', halaman_terakhir: '', catatan: '' });
    fetchAll();
  };

  const handleAddHafal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hafalForm.kelas_id) { showToast('Pilih kelas', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('muhafadhoh').insert({
      tanggal: hafalForm.tanggal, kelas_id: Number(hafalForm.kelas_id),
      materi: hafalForm.materi || null, target_hafalan: hafalForm.target_hafalan || null,
      catatan: hafalForm.catatan || null,
    });
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Hafalan dicatat!', 'success');
    setShowModal(false);
    setHafalForm({ tanggal: today, kelas_id: '', materi: '', target_hafalan: '', catatan: '' });
    fetchAll();
  };

  const deleteKbm = async (id: number) => {
    await supabase.from('kbm_harian').delete().eq('id', id);
    setKbmList(prev => prev.filter(k => k.id !== id));
    showToast('Dihapus', 'info');
  };

  const deleteBuku = async (id: number) => {
    await supabase.from('buku_saku').delete().eq('id', id);
    setBukuList(prev => prev.filter(b => b.id !== id));
    showToast('Dihapus', 'info');
  };

  const deleteHafal = async (id: number) => {
    await supabase.from('muhafadhoh').delete().eq('id', id);
    setHafalList(prev => prev.filter(h => h.id !== id));
    showToast('Dihapus', 'info');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">KBM & Hafalan</h2>
          <p className="section-subtitle">Log harian, buku saku, dan muhafadhoh</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Catat</span>
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[
          { id: 'kbm' as Tab, label: 'KBM Harian', count: kbmList.length },
          { id: 'bukusaku' as Tab, label: 'Buku Saku', count: bukuList.length },
          { id: 'hafalan' as Tab, label: 'Muhafadhoh', count: hafalList.length },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all ${tab === t.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
          >
            {t.label}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${tab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-20 bg-slate-50 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {tab === 'kbm' && (
            kbmList.length === 0 ? <EmptyState title="Belum ada catatan KBM" description="Tap Catat untuk mencatat kegiatan belajar mengajar." icon={<BookOpen className="w-8 h-8 text-slate-300" />} /> :
            <div className="space-y-3">
              {kbmList.map(k => (
                <div key={k.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-800 text-sm">{k.pelajaran}</span>
                        {k.kelas && <span className="badge badge-success text-[10px]">{k.kelas.nama_kelas}</span>}
                        <span className={`badge text-[10px] ${k.selesai ? 'badge-success' : 'badge-warning'}`}>
                          {k.selesai ? '✓ Selesai' : 'Berlangsung'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mb-1.5">
                        <span>{formatDate(k.tanggal)}</span>
                        {k.durasi && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{k.durasi} menit</span>}
                      </div>
                      {k.materi && <p className="text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2 mb-1">📚 {k.materi}</p>}
                      {k.catatan && <p className="text-xs text-slate-500 italic">{k.catatan}</p>}
                    </div>
                    <button onClick={() => deleteKbm(k.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'bukusaku' && (
            bukuList.length === 0 ? <EmptyState title="Buku saku kosong" description="Catat perkembangan materi per kelas di sini." icon={<BookOpen className="w-8 h-8 text-slate-300" />} /> :
            <div className="space-y-3">
              {bukuList.map(b => (
                <div key={b.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-800 text-sm">{b.pelajaran}</span>
                        {b.kelas && <span className="badge badge-success text-[10px]">{b.kelas.nama_kelas}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {b.bab_terakhir && (
                          <div className="bg-slate-50 rounded-xl px-3 py-2">
                            <p className="text-[9px] text-slate-400 font-semibold uppercase mb-0.5">Bab Terakhir</p>
                            <p className="text-xs font-semibold text-slate-700">{b.bab_terakhir}</p>
                          </div>
                        )}
                        {b.halaman_terakhir && (
                          <div className="bg-slate-50 rounded-xl px-3 py-2">
                            <p className="text-[9px] text-slate-400 font-semibold uppercase mb-0.5">Halaman</p>
                            <p className="text-xs font-semibold text-slate-700">{b.halaman_terakhir}</p>
                          </div>
                        )}
                      </div>
                      {b.catatan && <p className="text-xs text-slate-500 italic mt-2">{b.catatan}</p>}
                    </div>
                    <button onClick={() => deleteBuku(b.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'hafalan' && (
            hafalList.length === 0 ? <EmptyState title="Belum ada catatan hafalan" description="Catat target dan perkembangan hafalan santri." icon={<BookMarked className="w-8 h-8 text-slate-300" />} /> :
            <div className="space-y-3">
              {hafalList.map(h => (
                <div key={h.id} className="card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {h.materi && <span className="font-bold text-slate-800 text-sm">{h.materi}</span>}
                        {h.kelas && <span className="badge badge-success text-[10px]">{h.kelas.nama_kelas}</span>}
                      </div>
                      <p className="text-xs text-slate-400 mb-1.5">{formatDate(h.tanggal)}</p>
                      {h.target_hafalan && <p className="text-xs text-slate-600 bg-amber-50 rounded-xl px-3 py-2 mb-1">🎯 Target: {h.target_hafalan}</p>}
                      {h.catatan && <p className="text-xs text-slate-500 italic">{h.catatan}</p>}
                    </div>
                    <button onClick={() => deleteHafal(h.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal - different form per tab */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={tab === 'kbm' ? 'Catat KBM Harian' : tab === 'bukusaku' ? 'Update Buku Saku' : 'Catat Muhafadhoh'} size="sm">
        {tab === 'kbm' && (
          <form onSubmit={handleAddKbm} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
                <input type="date" value={kbmForm.tanggal} onChange={e => setKbmForm(p => ({ ...p, tanggal: e.target.value }))} className="input-field text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
                <select value={kbmForm.kelas_id} onChange={e => setKbmForm(p => ({ ...p, kelas_id: e.target.value }))} className="input-field text-sm" required>
                  <option value="">Pilih</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pelajaran</label>
              <input type="text" value={kbmForm.pelajaran} onChange={e => setKbmForm(p => ({ ...p, pelajaran: e.target.value }))} className="input-field text-sm" placeholder="Nama pelajaran/kitab..." required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Materi / Bab (opsional)</label>
              <input type="text" value={kbmForm.materi} onChange={e => setKbmForm(p => ({ ...p, materi: e.target.value }))} className="input-field text-sm" placeholder="cth. Bab Thaharah hal. 12..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Durasi (menit)</label>
                <input type="number" value={kbmForm.durasi} onChange={e => setKbmForm(p => ({ ...p, durasi: e.target.value }))} className="input-field text-sm" min="1" />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer mt-6">
                  <input type="checkbox" checked={kbmForm.selesai} onChange={e => setKbmForm(p => ({ ...p, selesai: e.target.checked }))} className="w-4 h-4 accent-emerald-600" />
                  <span className="text-xs font-semibold text-slate-600">KBM Selesai</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan (opsional)</label>
              <textarea value={kbmForm.catatan} onChange={e => setKbmForm(p => ({ ...p, catatan: e.target.value }))} className="input-field text-sm resize-none" rows={2} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        )}

        {tab === 'bukusaku' && (
          <form onSubmit={handleAddBuku} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
              <select value={bukuForm.kelas_id} onChange={e => setBukuForm(p => ({ ...p, kelas_id: e.target.value }))} className="input-field text-sm" required>
                <option value="">Pilih Kelas</option>
                {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pelajaran / Kitab</label>
              <input type="text" value={bukuForm.pelajaran} onChange={e => setBukuForm(p => ({ ...p, pelajaran: e.target.value }))} className="input-field text-sm" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bab Terakhir</label>
                <input type="text" value={bukuForm.bab_terakhir} onChange={e => setBukuForm(p => ({ ...p, bab_terakhir: e.target.value }))} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Halaman</label>
                <input type="text" value={bukuForm.halaman_terakhir} onChange={e => setBukuForm(p => ({ ...p, halaman_terakhir: e.target.value }))} className="input-field text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan (opsional)</label>
              <textarea value={bukuForm.catatan} onChange={e => setBukuForm(p => ({ ...p, catatan: e.target.value }))} className="input-field text-sm resize-none" rows={2} />
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </form>
        )}

        {tab === 'hafalan' && (
          <form onSubmit={handleAddHafal} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
                <input type="date" value={hafalForm.tanggal} onChange={e => setHafalForm(p => ({ ...p, tanggal: e.target.value }))} className="input-field text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
                <select value={hafalForm.kelas_id} onChange={e => setHafalForm(p => ({ ...p, kelas_id: e.target.value }))} className="input-field text-sm" required>
                  <option value="">Pilih</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Materi Hafalan</label>
              <input type="text" value={hafalForm.materi} onChange={e => setHafalForm(p => ({ ...p, materi: e.target.value }))} className="input-field text-sm" placeholder="cth. Surah Al-Mulk..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target Hafalan</label>
              <input type="text" value={hafalForm.target_hafalan} onChange={e => setHafalForm(p => ({ ...p, target_hafalan: e.target.value }))} className="input-field text-sm" placeholder="cth. Ayat 1-10..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Catatan (opsional)</label>
              <textarea value={hafalForm.catatan} onChange={e => setHafalForm(p => ({ ...p, catatan: e.target.value }))} className="input-field text-sm resize-none" rows={2} />
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
