import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, BarChart3, FileText, Share2, Save, BookOpen, Heart, Calendar,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { generateRaporPDF, shareWA } from '../lib/pdf';
import type { Murid, Nilai, Absensi, CatatanPerilaku, CapaianHafalan, ShowToast } from '../types';

type Tab = 'input' | 'rapor';
type JenisUjian = 'Ulangan' | 'Ujian Tulis' | 'Ujian Lisan';

const JENIS_UJIAN: JenisUjian[] = ['Ulangan', 'Ujian Tulis', 'Ujian Lisan'];

export default function NilaiPage({ showToast }: { showToast: ShowToast }) {
  const [tab, setTab] = useState<Tab>('input');
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMurid, setSelectedMurid] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Input state: batch entry
  const [inputPelajaran, setInputPelajaran] = useState('');
  const [inputJenis, setInputJenis] = useState<JenisUjian>('Ulangan');
  const [inputTanggal, setInputTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [batchNilai, setBatchNilai] = useState<Record<string, string>>({});
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);

  // Rapor state
  const [raporData, setRaporData] = useState<{
    murid: Murid;
    absen: { hadir: number; izin: number; sakit: number; alpha: number; total: number };
    nilai: Nilai[];
    perilaku: CatatanPerilaku[];
    capaian: CapaianHafalan[];
  } | null>(null);
  const [raporLoading, setRaporLoading] = useState(false);

  useEffect(() => {
    supabase.from('murid').select('*').eq('status_aktif', true).order('nama').then(({ data }) => {
      const murid = (data ?? []) as Murid[];
      setMuridList(murid);
      const kelas = [...new Set(murid.map(m => m.kelas).filter(Boolean))].sort();
      setKelasOptions(kelas);
      if (kelas.length) setSelectedKelas(kelas[0]);
      setLoading(false);
    });
  }, []);

  const muridFiltered = useMemo(
    () => muridList.filter(m => m.kelas === selectedKelas),
    [muridList, selectedKelas]
  );

  useEffect(() => {
    if (selectedKelas && tab === 'input') loadNilaiKelas(selectedKelas);
  }, [selectedKelas, tab]);

  const loadNilaiKelas = async (kelas: string) => {
    const muridIds = muridList.filter(m => m.kelas === kelas).map(m => m.id);
    if (!muridIds.length) { setNilaiList([]); return; }
    const { data } = await supabase.from('nilai').select('*').in('murid_id', muridIds).order('tanggal', { ascending: false });
    if (data) setNilaiList(data as Nilai[]);
  };

  // ===== INPUT NILAI =====
  const openInputModal = () => {
    setInputPelajaran('');
    setInputJenis('Ulangan');
    setInputTanggal(new Date().toISOString().split('T')[0]);
    const init: Record<string, string> = {};
    muridFiltered.forEach(m => { init[m.id] = ''; });
    setBatchNilai(init);
    setShowModal(true);
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPelajaran) { showToast('Isi mata pelajaran', 'error'); return; }
    const entries = Object.entries(batchNilai).filter(([, v]) => v !== '');
    if (!entries.length) { showToast('Isi minimal satu nilai', 'error'); return; }
    setSaving(true);
    const records = entries.map(([muridId, skor]) => ({
      murid_id: muridId, pelajaran: inputPelajaran, jenis_ujian: inputJenis,
      skor: Number(skor), tanggal: inputTanggal,
    }));
    const { error } = await supabase.from('nilai').insert(records);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Nilai disimpan!', 'success');
    setShowModal(false);
    loadNilaiKelas(selectedKelas);
  };

  const deleteNilai = async (id: string) => {
    await supabase.from('nilai').delete().eq('id', id);
    setNilaiList(prev => prev.filter(n => n.id !== id));
    showToast('Dihapus', 'info');
  };

  // ===== RAPOR =====
  const loadRapor = async (muridId: string) => {
    setRaporLoading(true);
    const murid = muridList.find(m => m.id === muridId);
    if (!murid) { setRaporLoading(false); return; }

    const [absenR, nilaiR, perilakuR, capaianR] = await Promise.all([
      supabase.from('absensi').select('*').eq('murid_id', muridId),
      supabase.from('nilai').select('*').eq('murid_id', muridId).order('tanggal', { ascending: false }),
      supabase.from('catatan_perilaku').select('*').eq('murid_id', muridId).order('created_at', { ascending: false }),
      supabase.from('capaian_hafalan').select('*').eq('murid_id', muridId).order('tanggal', { ascending: false }),
    ]);

    const absen = (absenR.data ?? []) as Absensi[];
    const absenSummary = {
      hadir: absen.filter(a => a.status === 'Hadir').length,
      izin: absen.filter(a => a.status === 'Izin').length,
      sakit: absen.filter(a => a.status === 'Sakit').length,
      alpha: absen.filter(a => a.status === 'Alpha').length,
      total: absen.length,
    };

    setRaporData({
      murid,
      absen: absenSummary,
      nilai: (nilaiR.data ?? []) as Nilai[],
      perilaku: (perilakuR.data ?? []) as CatatanPerilaku[],
      capaian: (capaianR.data ?? []) as CapaianHafalan[],
    });
    setRaporLoading(false);
  };

  useEffect(() => {
    if (tab === 'rapor' && selectedMurid) loadRapor(selectedMurid);
    else if (tab === 'rapor' && !selectedMurid) setRaporData(null);
  }, [tab, selectedMurid]);

  // Class statistics for rapor (no murid selected)
  const classStats = useMemo(() => {
    if (selectedMurid || !selectedKelas) return null;
    const muridKelas = muridList.filter(m => m.kelas === selectedKelas);
    const muridIds = muridKelas.map(m => m.id);
    const kelasNilai = nilaiList.filter(n => muridIds.includes(n.murid_id));
    if (!kelasNilai.length) return { count: muridKelas.length, avg: 0, lulus: 0, lulusPct: 0 };
    const avg = kelasNilai.reduce((s, n) => s + n.skor, 0) / kelasNilai.length;
    const lulus = kelasNilai.filter(n => n.skor >= 70).length;
    return {
      count: muridKelas.length,
      avg: avg.toFixed(1),
      lulus,
      lulusPct: ((lulus / kelasNilai.length) * 100).toFixed(0),
    };
  }, [selectedMurid, selectedKelas, muridList, nilaiList]);

  const exportRaporPDF = () => {
    if (!raporData) return;
    generateRaporPDF(
      { nama: raporData.murid.nama, kelas: raporData.murid.kelas, domisili: raporData.murid.domisili, alamat: raporData.murid.alamat },
      raporData.absen,
      raporData.nilai.map(n => ({ pelajaran: n.pelajaran, jenis_ujian: n.jenis_ujian, skor: n.skor })),
      raporData.perilaku.map(p => ({ catatan: p.catatan, jenis: p.jenis, created_at: p.created_at })),
      raporData.capaian.map(c => ({ capaian: c.capaian, tanggal: c.tanggal })),
    );
  };

  const shareRaporWA = () => {
    if (!raporData) return;
    const m = raporData.murid;
    let text = `Assalamu'alaikum warahmatullahi wabarakatuh.\n\nBerikut laporan rapor santri:\n\nNama: ${m.nama}\nKelas: ${m.kelas}\n\n`;
    text += `*Kehadiran:*\nHadir: ${raporData.absen.hadir} | Izin: ${raporData.absen.izin} | Sakit: ${raporData.absen.sakit} | Alpha: ${raporData.absen.alpha}\n\n`;
    if (raporData.nilai.length) {
      text += `*Nilai:*\n`;
      raporData.nilai.forEach(n => { text += `${n.pelajaran} (${n.jenis_ujian}): ${n.skor}\n`; });
      text += '\n';
    }
    if (raporData.capaian.length) {
      text += `*Capaian Hafalan:*\n`;
      raporData.capaian.forEach(c => { text += `${c.capaian} (${c.tanggal})\n`; });
      text += '\n';
    }
    if (raporData.perilaku.length) {
      text += `*Catatan Sikap:*\n`;
      raporData.perilaku.forEach(p => { text += `${p.jenis}: ${p.catatan}\n`; });
      text += '\n';
    }
    text += `Terima kasih.\nWassalamu'alaikum warahmatullahi wabarakatuh.`;
    shareWA(text);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const getSkorColor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 70 ? 'text-amber-600' : 'text-rose-600';
  const getSkorBg = (s: number) => s >= 80 ? 'bg-emerald-50' : s >= 70 ? 'bg-amber-50' : 'bg-rose-50';

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">Nilai & Rapor</h2>
          <p className="section-subtitle">Input nilai dan cetak rapor santri</p>
        </div>
        {tab === 'input' && (
          <button onClick={openInputModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Input Nilai</span>
          </button>
        )}
      </div>

      <div className="tab-switcher mb-5">
        <button onClick={() => setTab('input')} className={`tab-btn ${tab === 'input' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>Input Nilai</button>
        <button onClick={() => setTab('rapor')} className={`tab-btn ${tab === 'rapor' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>Rapor</button>
      </div>

      {/* ===== INPUT NILAI ===== */}
      {tab === 'input' && (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4">
            {kelasOptions.map(k => (
              <button key={k} onClick={() => setSelectedKelas(k)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex-shrink-0 transition-all ${selectedKelas === k ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                {k}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-16 bg-slate-50 rounded-2xl" />)}</div>
          ) : nilaiList.length === 0 ? (
            <EmptyState title="Belum ada nilai" description="Klik Input Nilai untuk menambahkan nilai santri." icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-2">
              {nilaiList.map(n => {
                const murid = muridList.find(m => m.id === n.murid_id);
                return (
                  <div key={n.id} className="card p-3.5 flex items-center gap-3 group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${getSkorBg(n.skor)}`}>
                      <span className={`font-bold text-base ${getSkorColor(n.skor)}`}>{n.skor}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{murid?.nama ?? 'Santri'}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-slate-500">{n.pelajaran}</span>
                        <span className="badge bg-slate-100 text-slate-600 text-[10px]">{n.jenis_ujian}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(n.tanggal)}</span>
                      </div>
                    </div>
                    <button onClick={() => deleteNilai(n.id)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== RAPOR ===== */}
      {tab === 'rapor' && (
        <>
          <div className="card p-4 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Kelas</label>
                <select value={selectedKelas} onChange={e => { setSelectedKelas(e.target.value); setSelectedMurid(''); }} className="input-field text-sm">
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pilih Santri (opsional)</label>
                <select value={selectedMurid} onChange={e => setSelectedMurid(e.target.value)} className="input-field text-sm">
                  <option value="">Semua Santri (Statistik Kelas)</option>
                  {muridFiltered.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                </select>
              </div>
            </div>
          </div>

          {raporLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-20 bg-slate-50 rounded-2xl" />)}</div>
          ) : !selectedKelas ? (
            <EmptyState title="Pilih kelas" description="Pilih kelas untuk melihat rapor." icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
          ) : selectedMurid && raporData ? (
            /* Individual Rapor */
            <div className="space-y-4">
              {/* Action buttons */}
              <div className="flex gap-2">
                <button onClick={exportRaporPDF} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
                  <FileText className="w-4 h-4" /> Export PDF
                </button>
                <button onClick={shareRaporWA} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
                  <Share2 className="w-4 h-4" /> Share WhatsApp
                </button>
              </div>

              {/* Data Diri */}
              <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Data Santri
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] text-slate-400 font-semibold">Nama</p><p className="text-sm font-bold text-slate-800">{raporData.murid.nama}</p></div>
                  <div><p className="text-[10px] text-slate-400 font-semibold">Kelas</p><p className="text-sm font-bold text-slate-800">{raporData.murid.kelas}</p></div>
                  {raporData.murid.domisili && <div><p className="text-[10px] text-slate-400 font-semibold">Domisili</p><p className="text-sm text-slate-700">{raporData.murid.domisili}</p></div>}
                  {raporData.murid.alamat && <div><p className="text-[10px] text-slate-400 font-semibold">Alamat</p><p className="text-sm text-slate-700">{raporData.murid.alamat}</p></div>}
                </div>
              </div>

              {/* Kehadiran */}
              <div className="card p-5">
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-emerald-600" /> Kehadiran
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Hadir', val: raporData.absen.hadir, color: 'bg-emerald-50 text-emerald-700' },
                    { label: 'Izin', val: raporData.absen.izin, color: 'bg-amber-50 text-amber-700' },
                    { label: 'Sakit', val: raporData.absen.sakit, color: 'bg-sky-50 text-sky-700' },
                    { label: 'Alpha', val: raporData.absen.alpha, color: 'bg-rose-50 text-rose-700' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                      <p className="text-2xl font-bold">{s.val}</p>
                      <p className="text-[10px] font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>
                {raporData.absen.total > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Persentase Kehadiran</span>
                      <span className="font-bold text-emerald-600">{((raporData.absen.hadir / raporData.absen.total) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(raporData.absen.hadir / raporData.absen.total) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Nilai */}
              <div className="card p-5">
                <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                  <BarChart3 className="w-4 h-4 text-emerald-600" /> Nilai
                </h3>
                {raporData.nilai.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada nilai</p>
                ) : (
                  <div className="space-y-2">
                    {raporData.nilai.map(n => (
                      <div key={n.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getSkorBg(n.skor)}`}>
                          <span className={`font-bold text-sm ${getSkorColor(n.skor)}`}>{n.skor}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{n.pelajaran}</p>
                          <span className="badge bg-white text-slate-600 text-[10px]">{n.jenis_ujian}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{formatDate(n.tanggal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Capaian Hafalan */}
              {raporData.capaian.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-emerald-600" /> Capaian Hafalan
                  </h3>
                  <div className="space-y-2">
                    {raporData.capaian.map(c => (
                      <div key={c.id} className="flex items-center gap-2 bg-amber-50 rounded-xl p-3">
                        <span className="text-xs text-amber-600 font-semibold">{formatDate(c.tanggal)}</span>
                        <span className="text-sm text-slate-700">{c.capaian}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Catatan Sikap */}
              {raporData.perilaku.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-emerald-600" /> Catatan Sikap
                  </h3>
                  <div className="space-y-2">
                    {raporData.perilaku.map(p => (
                      <div key={p.id} className={`rounded-xl p-3 ${p.jenis === 'prestasi' ? 'bg-emerald-50' : p.jenis === 'pelanggaran' ? 'bg-rose-50' : 'bg-sky-50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`badge text-[10px] ${p.jenis === 'prestasi' ? 'badge-success' : p.jenis === 'pelanggaran' ? 'badge-danger' : 'badge-info'}`}>
                            {p.jenis === 'prestasi' ? 'Prestasi' : p.jenis === 'pelanggaran' ? 'Pelanggaran' : 'Catatan'}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatDate(p.created_at)}</span>
                        </div>
                        <p className="text-sm text-slate-700">{p.catatan}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : classStats ? (
            /* Class Statistics */
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="card p-4 text-center bg-emerald-50 border-emerald-100">
                  <p className="text-3xl font-bold text-emerald-700">{classStats.count}</p>
                  <p className="text-[10px] font-semibold text-emerald-600">Total Santri</p>
                </div>
                <div className="card p-4 text-center bg-sky-50 border-sky-100">
                  <p className="text-3xl font-bold text-sky-700">{classStats.avg || '-'}</p>
                  <p className="text-[10px] font-semibold text-sky-600">Rata-rata Nilai</p>
                </div>
                <div className="card p-4 text-center bg-amber-50 border-amber-100">
                  <p className="text-3xl font-bold text-amber-700">{classStats.lulusPct || '0'}%</p>
                  <p className="text-[10px] font-semibold text-amber-600">Tuntas (≥70)</p>
                </div>
              </div>

              {/* Per-student summary */}
              <div className="card p-5">
                <h3 className="font-bold text-slate-700 mb-3 text-sm">Rapor Seluruh Santri</h3>
                <div className="space-y-2">
                  {muridFiltered.map(m => {
                    const mNilai = nilaiList.filter(n => n.murid_id === m.id);
                    const avg = mNilai.length ? (mNilai.reduce((s, n) => s + n.skor, 0) / mNilai.length) : 0;
                    return (
                      <div key={m.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${avg >= 80 ? 'bg-emerald-50' : avg >= 70 ? 'bg-amber-50' : 'bg-rose-50'}`}>
                          <span className={`font-bold text-sm ${avg >= 80 ? 'text-emerald-600' : avg >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {mNilai.length ? avg.toFixed(0) : '-'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{m.nama}</p>
                          <span className="text-[10px] text-slate-400">{mNilai.length} nilai</span>
                        </div>
                        <button onClick={() => setSelectedMurid(m.id)} className="text-xs text-emerald-600 font-semibold hover:underline">
                          Lihat Rapor
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState title="Tidak ada data" description="Belum ada nilai untuk kelas ini." icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
          )}
        </>
      )}

      {/* Modal Input Nilai */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Input Nilai Santri" size="md">
        <form onSubmit={handleSaveBatch} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Pelajaran</label>
              <input type="text" value={inputPelajaran} onChange={e => setInputPelajaran(e.target.value)} className="input-field text-sm" placeholder="Fiqih" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jenis Ujian</label>
              <select value={inputJenis} onChange={e => setInputJenis(e.target.value as JenisUjian)} className="input-field text-sm">
                {JENIS_UJIAN.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
              <input type="date" value={inputTanggal} onChange={e => setInputTanggal(e.target.value)} className="input-field text-sm" required />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Nilai Santri (0-100, kosongkan jika tidak ada)</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {muridFiltered.map(m => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{m.nama}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={batchNilai[m.id] ?? ''}
                    onChange={e => setBatchNilai(prev => ({ ...prev, [m.id]: e.target.value }))}
                    className="input-field text-sm w-20 text-center"
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
