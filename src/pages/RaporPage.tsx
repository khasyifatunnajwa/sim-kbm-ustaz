import { useState, useEffect, useMemo } from 'react';
import {
  FileText, Download, Share2, Users, GraduationCap, Award,
  Calendar, TrendingUp, BookOpen, Heart, Loader2, ArrowLeft, ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { generateRaporPDF, shareWA } from '../lib/pdf';
import type { Murid, Nilai, Absensi, CatatanPerilaku, CapaianHafalan, Sikap, ShowToast } from '../types';

export default function RaporPage({ showToast }: { showToast: ShowToast }) {
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMuridId, setSelectedMuridId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Rapor data
  const [nilaiList, setNilaiList] = useState<Nilai[]>([]);
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [perilakuList, setPerilakuList] = useState<CatatanPerilaku[]>([]);
  const [capaianList, setCapaianList] = useState<CapaianHafalan[]>([]);
  const [sikapList, setSikapList] = useState<Sikap[]>([]);

  useEffect(() => {
    fetchMurid();
  }, []);

  const fetchMurid = async () => {
    setLoading(true);
    const { data } = await supabase.from('murid').select('*').eq('status_aktif', true).order('nama');
    if (data) {
      const murid = data as Murid[];
      setMuridList(murid);
      const kelas = [...new Set(murid.map(m => m.kelas).filter((k): k is string => Boolean(k)))].sort();
      setKelasOptions(kelas);
      if (kelas.length) setSelectedKelas(kelas[0]);
    }
    setLoading(false);
  };

  const muridFiltered = useMemo(
    () => muridList.filter(m => !selectedKelas || m.kelas === selectedKelas),
    [muridList, selectedKelas]
  );

  const selectedMurid = muridList.find(m => m.id === selectedMuridId);

  useEffect(() => {
    if (selectedMuridId) fetchRaporData(selectedMuridId);
    else clearRaporData();
  }, [selectedMuridId]);

  const clearRaporData = () => {
    setNilaiList([]);
    setAbsensiList([]);
    setPerilakuList([]);
    setCapaianList([]);
    setSikapList([]);
  };

  const fetchRaporData = async (muridId: string) => {
    const [n, a, p, c, s] = await Promise.all([
      supabase.from('nilai').select('*').eq('murid_id', muridId).order('tanggal', { ascending: false }),
      supabase.from('absensi').select('*').eq('murid_id', muridId).order('tanggal', { ascending: false }),
      supabase.from('catatan_perilaku').select('*').eq('murid_id', muridId).order('created_at', { ascending: false }),
      supabase.from('capaian_hafalan').select('*').eq('murid_id', muridId).order('tanggal', { ascending: false }),
      supabase.from('sikap').select('*').eq('murid_id', muridId).order('tanggal', { ascending: false }),
    ]);
    if (n.data) setNilaiList(n.data as Nilai[]);
    if (a.data) setAbsensiList(a.data as Absensi[]);
    if (p.data) setPerilakuList(p.data as CatatanPerilaku[]);
    if (c.data) setCapaianList(c.data as CapaianHafalan[]);
    if (s.data) setSikapList(s.data as Sikap[]);
  };

  // Compute absensi summary
  const absenSummary = useMemo(() => {
    const sum = { hadir: 0, izin: 0, sakit: 0, alpha: 0, telat: 0, total: 0 };
    absensiList.forEach(a => {
      const st = (a.status || 'Hadir') as keyof typeof sum;
      if (st in sum && typeof sum[st as keyof typeof sum] === 'number') {
        sum[st as 'hadir' | 'izin' | 'sakit' | 'alpha' | 'telat']++;
      }
      sum.total++;
    });
    return sum;
  }, [absensiList]);

  // Compute nilai average
  const nilaiAvg = useMemo(() => {
    if (!nilaiList.length) return 0;
    return nilaiList.reduce((s, n) => s + (n.skor || 0), 0) / nilaiList.length;
  }, [nilaiList]);

  // Compute sikap average
  const sikapAvg = useMemo(() => {
    if (!sikapList.length) return 0;
    const totals = sikapList.map(s => {
      const scores = [s.disiplin, s.adab, s.kerajinan, s.kejujuran, s.tanggung_jawab].filter((v): v is number => v != null);
      return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }, [sikapList]);

  // Compute averages for ALL students in class
  const classAverages = useMemo(() => {
    const result: { muridId: string; nama: string; nilaiAvg: number; kehadiranPct: number }[] = [];

    // We need to fetch averages for all students - but we don't have individual data without fetching each
    // This is a simplified version that uses the selected murid only
    if (selectedMurid) {
      result.push({
        muridId: selectedMurid.id,
        nama: selectedMurid.nama,
        nilaiAvg,
        kehadiranPct: absenSummary.total > 0 ? Math.round((absenSummary.hadir / absenSummary.total) * 100) : 0
      });
    }

    return result;
  }, [selectedMurid, nilaiAvg, absenSummary]);

  const getPredikat = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'E';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };

  const handleDownloadPDF = () => {
    if (!selectedMurid) return;
    setGenerating(true);
    try {
      generateRaporPDF(
        {
          nama: selectedMurid.nama,
          kelas: selectedMurid.kelas || '-',
          domisili: selectedMurid.domisili,
          alamat: selectedMurid.alamat,
        },
        absenSummary,
        nilaiList.map(n => ({ pelajaran: n.pelajaran, jenis_ujian: n.jenis_ujian, skor: n.skor })),
        perilakuList.map(p => ({ catatan: p.catatan, jenis: p.jenis, created_at: p.created_at })),
        capaianList.map(c => ({ capaian: c.capaian, tanggal: c.tanggal })),
      );
      showToast('Rapor PDF berhasil diunduh', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal membuat PDF', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleShareWA = () => {
    if (!selectedMurid) return;
    const m = selectedMurid;
    let text = `*RAPOR SANTRI*\n\n`;
    text += `Nama: ${m.nama}\n`;
    text += `Kelas: ${m.kelas || '-'}\n`;
    if (m.domisili) text += `Domisili: ${m.domisili}\n`;
    text += `\n*Rekap Kehadiran:*\n`;
    text += `Hadir: ${absenSummary.hadir} | Izin: ${absenSummary.izin} | Sakit: ${absenSummary.sakit} | Alpha: ${absenSummary.alpha} | Telat: ${absenSummary.telat}\n`;
    text += `Total: ${absenSummary.total}\n`;
    if (nilaiList.length > 0) {
      text += `\n*Nilai Akademik (Rata-rata: ${nilaiAvg.toFixed(1)} - ${getPredikat(nilaiAvg)}):*\n`;
      nilaiList.forEach(n => {
        text += `${n.pelajaran} (${n.jenis_ujian}): ${n.skor}\n`;
      });
    }
    if (sikapList.length > 0) {
      text += `\n*Penilaian Sikap (Rata-rata: ${sikapAvg.toFixed(1)}):*\n`;
    }
    if (capaianList.length > 0) {
      text += `\n*Capaian Hafalan:*\n`;
      capaianList.forEach(c => {
        text += `${c.tanggal}: ${c.capaian}\n`;
      });
    }
    if (perilakuList.length > 0) {
      text += `\n*Catatan Perilaku:*\n`;
      perilakuList.forEach(p => {
        text += `${p.jenis === 'prestasi' ? 'Prestasi' : p.jenis === 'pelanggaran' ? 'Pelanggaran' : 'Catatan'}: ${p.catatan}\n`;
      });
    }
    shareWA(text);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      {!selectedMuridId ? (
        // KELAS VIEW - Pilih kelas dulu, baru lihat murid
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Rapor Santri</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pilih kelas untuk melihat daftar santri</p>
          </div>

          {/* Kelas Filter */}
          {kelasOptions.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {kelasOptions.map(k => (
                <button
                  key={k}
                  onClick={() => setSelectedKelas(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border flex-shrink-0 transition-all ${selectedKelas === k ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
            </div>
          ) : muridFiltered.length === 0 ? (
            <EmptyState title="Tidak ada santri" description="Belum ada data santri di kelas ini." icon={<Users className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-1.5">
              {muridFiltered.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMuridId(m.id)}
                  className="card p-2.5 w-full text-left hover:shadow-sm transition-all flex items-center gap-2.5 group"
                >
                  <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">{m.nama.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{m.nama}</p>
                    <p className="text-[10px] text-slate-500">Kelas {m.kelas || '-'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // DETAIL RAPOR VIEW
        <div className="space-y-4">
          <button onClick={() => setSelectedMuridId('')} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali
          </button>

          {/* Header Card */}
          <div className="card overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{selectedMurid?.nama}</p>
                  <p className="text-emerald-100 text-xs">
                    Kelas {selectedMurid?.kelas || '-'}
                    {selectedMurid?.domisili ? ` • ${selectedMurid.domisili}` : ''}
                  </p>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold">{nilaiAvg.toFixed(1)}</p>
                  <p className="text-[9px] text-emerald-100 font-semibold uppercase">Nilai</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20">
                    {getPredikat(nilaiAvg)}
                  </span>
                </div>
                <div className="bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold">
                    {absenSummary.total > 0 ? Math.round((absenSummary.hadir / absenSummary.total) * 100) : 0}%
                  </p>
                  <p className="text-[9px] text-emerald-100 font-semibold uppercase">Kehadiran</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20">
                    {absenSummary.hadir}/{absenSummary.total}
                  </span>
                </div>
                <div className="bg-white/15 rounded-xl p-2.5 text-center backdrop-blur-sm">
                  <p className="text-xl font-bold">{sikapAvg.toFixed(1)}</p>
                  <p className="text-[9px] text-emerald-100 font-semibold uppercase">Sikap</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/20">
                    {getPredikat(sikapAvg)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white text-emerald-700 hover:bg-emerald-50 px-3 py-2 rounded-xl font-bold text-xs transition-colors disabled:opacity-60"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {generating ? 'Membuat...' : 'PDF'}
                </button>
                <button
                  onClick={handleShareWA}
                  className="flex items-center justify-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl font-bold text-xs transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> WA
                </button>
              </div>
            </div>
          </div>

          {/* Nilai Akademik */}
          <div className="card p-3">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              Nilai Akademik
              <span className="ml-auto badge badge-info text-[9px]">{nilaiList.length}</span>
            </h3>
            {nilaiList.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-3">Belum ada nilai tercatat</p>
            ) : (
              <div className="space-y-1.5">
                {nilaiList.map(n => (
                  <div key={n.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getScoreColor(n.skor)}`}>
                      <span className="font-bold text-xs">{n.skor}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{n.pelajaran}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                        <span className="badge badge-info text-[8px]">{n.jenis_ujian}</span>
                        <span>{formatDate(n.tanggal)}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${getScoreColor(n.skor).split(' ')[0]}`}>{getPredikat(n.skor)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kehadiran */}
          <div className="card p-3">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5 text-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              Rekap Kehadiran
            </h3>
            {absenSummary.total === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-3">Belum ada data absensi</p>
            ) : (
              <>
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {[
                    { label: 'H', val: absenSummary.hadir, color: 'bg-emerald-50 text-emerald-700' },
                    { label: 'I', val: absenSummary.izin, color: 'bg-amber-50 text-amber-700' },
                    { label: 'S', val: absenSummary.sakit, color: 'bg-sky-50 text-sky-700' },
                    { label: 'A', val: absenSummary.alpha, color: 'bg-rose-50 text-rose-700' },
                    { label: 'T', val: absenSummary.telat, color: 'bg-orange-50 text-orange-700' },
                  ].map(s => (
                    <div key={s.label} className={`rounded-lg p-1.5 text-center ${s.color}`}>
                      <p className="text-sm font-bold">{s.val}</p>
                      <p className="text-[8px] font-semibold">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                  {absenSummary.total > 0 && [
                    { val: absenSummary.hadir, color: 'bg-emerald-500' },
                    { val: absenSummary.izin, color: 'bg-amber-500' },
                    { val: absenSummary.sakit, color: 'bg-sky-500' },
                    { val: absenSummary.alpha, color: 'bg-rose-500' },
                    { val: absenSummary.telat, color: 'bg-orange-500' },
                  ].map(s => s.val > 0 ? (
                    <div key={s.color} className={s.color} style={{ width: `${(s.val / absenSummary.total) * 100}%` }} />
                  ) : null)}
                </div>
              </>
            )}
          </div>

          {/* Sikap */}
          {sikapList.length > 0 && (
            <div className="card p-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5 text-xs">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Penilaian Sikap
                <span className="ml-auto badge badge-success text-[9px]">Rata-rata {sikapAvg.toFixed(1)}</span>
              </h3>
              <div className="space-y-1.5">
                {sikapList.slice(0, 3).map(s => {
                  const scores = [s.disiplin, s.adab, s.kerajinan, s.kejujuran, s.tanggung_jawab].filter((v): v is number => v != null);
                  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                  return (
                    <div key={s.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">{formatDate(s.tanggal)}</span>
                        <span className={`text-xs font-bold ${avg >= 80 ? 'text-emerald-600' : avg >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {avg.toFixed(1)}
                        </span>
                      </div>
                      {s.catatan && <p className="text-[10px] text-slate-500 italic mt-0.5">{s.catatan}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Capaian Hafalan */}
          {capaianList.length > 0 && (
            <div className="card p-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5 text-xs">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                Capaian Hafalan
                <span className="ml-auto badge badge-warning text-[9px]">{capaianList.length}</span>
              </h3>
              <div className="space-y-1.5">
                {capaianList.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{c.capaian}</p>
                      <p className="text-[9px] text-slate-400">{formatDate(c.tanggal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Catatan Perilaku */}
          {perilakuList.length > 0 && (
            <div className="card p-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-1.5 text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                Catatan Perilaku
                <span className="ml-auto badge badge-info text-[9px]">{perilakuList.length}</span>
              </h3>
              <div className="space-y-1.5">
                {perilakuList.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-start gap-2 bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <span className={`badge text-[8px] flex-shrink-0 ${p.jenis === 'prestasi' ? 'badge-success' : p.jenis === 'pelanggaran' ? 'badge-danger' : 'badge-info'}`}>
                      {p.jenis === 'prestasi' ? 'Prestasi' : p.jenis === 'pelanggaran' ? 'Pelanggaran' : 'Catatan'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-slate-700 dark:text-slate-200">{p.catatan}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{formatDate(p.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
