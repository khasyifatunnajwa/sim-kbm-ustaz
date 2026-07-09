import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, BarChart3, FileText, Share2, Save, Calendar, TrendingUp, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { generatePDF, shareWA } from '../lib/pdf';
import type { Murid, Penilaian, DetailNilai, Profile, ShowToast } from '../types';

type Tab = 'input' | 'riwayat' | 'rapor';
type JenisUjian = 'Ulangan' | 'Ujian Tulis' | 'Ujian Lisan' | 'Baca Kitab' | 'Tugas' | 'Hafalan' | 'Praktik' | 'Lainnya';

const JENIS_UJIAN: JenisUjian[] = ['Ulangan', 'Ujian Tulis', 'Ujian Lisan', 'Baca Kitab', 'Tugas', 'Hafalan', 'Praktik', 'Lainnya'];

const NAMA_PENILAIAN_OPTIONS = [
  'Ulangan Harian', 'Ulangan Tengah Semester (UTS)', 'Ulangan Akhir Semester (UAS)',
  'Ujian Tulis', 'Ujian Lisan', 'Baca Kitab', 'Tugas Harian', 'Tugas Mingguan',
  'Hafalan Juz 1', 'Hafalan Juz 2', 'Hafalan Juz 3', 'Hafalan Juz 5',
  'Hafalan Juz 10', 'Hafalan Juz 30', 'Praktik', 'Lainnya',
];

// Score colour helpers
const getSkorColor = (s: number) =>
  s >= 80 ? 'text-emerald-600' : s >= 70 ? 'text-amber-600' : 'text-rose-600';
const getSkorBg = (s: number) =>
  s >= 80 ? 'bg-emerald-50 border-emerald-200' : s >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';
const getSkorBadge = (s: number) =>
  s >= 80 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : s >= 70 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-rose-100 text-rose-700 border border-rose-200';

// Jenis badge style
const JENIS_STYLE: Record<string, string> = {
  Ulangan: 'bg-sky-50 text-sky-700 border-sky-200',
  'Ujian Tulis': 'bg-violet-50 text-violet-700 border-violet-200',
  'Ujian Lisan': 'bg-purple-50 text-purple-700 border-purple-200',
  'Baca Kitab': 'bg-amber-50 text-amber-700 border-amber-200',
  Tugas: 'bg-teal-50 text-teal-700 border-teal-200',
  Hafalan: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Praktik: 'bg-rose-50 text-rose-700 border-rose-200',
  Lainnya: 'bg-slate-50 text-slate-600 border-slate-200',
};
const getJenisBadge = (jenis: string) => JENIS_STYLE[jenis] || JENIS_STYLE['Lainnya'];

export default function NilaiPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [tab, setTab] = useState<Tab>('input');
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [mapelOptions, setMapelOptions] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. MODIFIKASI: Baca status modal dari Hash URL saat awal muat
  const [showModal, setShowModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'nilai' && hashParts[1] === 'form';
  });

  const [penilaianList, setPenilaianList] = useState<Penilaian[]>([]);
  const [detailNilaiMap, setDetailNilaiMap] = useState<Record<string, DetailNilai[]>>({});
  const [selectedPenilaian, setSelectedPenilaian] = useState<string>('');

  const [inputMapel, setInputMapel] = useState('');
  const [inputJenis, setInputJenis] = useState<JenisUjian>('Ulangan');
  const [inputNama, setInputNama] = useState('');
  const [inputBobot, setInputBobot] = useState(100);
  const [inputTanggal, setInputTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [batchNilai, setBatchNilai] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  // 2. SINKRONISASI MODAL DENGAN TOMBOL BACK HP
  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'nilai') {
        if (hashParts[1] === 'form') {
          setShowModal(true);
        } else {
          setShowModal(false);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3. FUNGSI CERDAS MENUTUP MODAL (Membersihkan History URL)
  const handleCloseModal = () => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'form') {
      window.history.back(); // Memicu popstate untuk mundur secara native
    } else {
      setShowModal(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    const scope = await getUstazScope(profile);
    setKelasOptions(scope.kelasList);
    setMapelOptions(scope.mapelList);
    if (scope.kelasList.length) setSelectedKelas(scope.kelasList[0]);
    if (scope.mapelList.length) setInputMapel(scope.mapelList[0]);

    const { data: muridData } = await supabase.from('murid').select('*').eq('status_aktif', true).order('nama');
    let murid = (muridData ?? []) as Murid[];
    if (!scope.isAdmin && scope.kelasList.length > 0) {
      murid = murid.filter(m => scope.kelasList.includes(m.kelas || ''));
    }
    setMuridList(murid);
    setLoading(false);
  };

  const muridFiltered = useMemo(
    () => muridList.filter(m => m.kelas === selectedKelas),
    [muridList, selectedKelas]
  );

  useEffect(() => {
    if (selectedKelas) loadPenilaianKelas(selectedKelas);
  }, [selectedKelas]);

  const loadPenilaianKelas = async (kelas: string) => {
    let query = supabase.from('penilaian').select('*').eq('kelas', kelas).order('tanggal', { ascending: false });
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', profile?.id ?? '');
    }
    const { data } = await query;
    if (data) {
      setPenilaianList(data as Penilaian[]);
      const ids = (data || []).map(p => p.id);
      if (ids.length > 0) {
        const { data: detailData } = await supabase.from('detail_nilai').select('*').in('penilaian_id', ids);
        if (detailData) {
          const map: Record<string, DetailNilai[]> = {};
          (detailData as DetailNilai[]).forEach(d => {
            if (d.penilaian_id) {
              if (!map[d.penilaian_id]) map[d.penilaian_id] = [];
              map[d.penilaian_id].push(d);
            }
          });
          setDetailNilaiMap(map);
        }
      } else {
        setDetailNilaiMap({});
      }
    }
  };

  // 4. MENDORONG HASH SAAT BUKA MODAL
  const openInputModal = () => {
    setInputMapel(mapelOptions[0] || '');
    setInputJenis('Ulangan');
    setInputNama('');
    setInputBobot(100);
    setInputTanggal(today);
    const init: Record<string, string> = {};
    muridFiltered.forEach(m => { init[m.id] = ''; });
    setBatchNilai(init);
    setShowModal(true);
    window.history.pushState(null, '', '#nilai/form');
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMapel || !inputNama) {
      showToast('Lengkapi mata pelajaran dan nama penilaian', 'error');
      return;
    }
    const entries = Object.entries(batchNilai).filter(([, v]) => v !== '');
    if (!entries.length) {
      showToast('Isi minimal satu nilai', 'error');
      return;
    }

    setSaving(true);
    try {
      const { data: penilaianData, error: penilaianError } = await supabase
        .from('penilaian')
        .insert([{
          kelas: selectedKelas,
          mapel: inputMapel,
          nama_penilaian: inputNama,
          jenis: inputJenis,
          bobot: inputBobot,
          tanggal: inputTanggal,
        }])
        .select()
        .maybeSingle();

      if (penilaianError) throw penilaianError;
      if (!penilaianData) throw new Error('Gagal membuat penilaian');

      const detailRecords = entries.map(([muridId, skor]) => ({
        penilaian_id: penilaianData.id,
        murid_id: muridId,
        nilai: Number(skor),
      }));

      const { error: detailError } = await supabase.from('detail_nilai').insert(detailRecords);
      if (detailError) throw detailError;

      showToast('Nilai disimpan!', 'success');
      handleCloseModal(); // PERUBAHAN: Gunakan penutup modal khusus
      loadPenilaianKelas(selectedKelas);
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deletePenilaian = async (id: string) => {
    await supabase.from('detail_nilai').delete().eq('penilaian_id', id);
    await supabase.from('penilaian').delete().eq('id', id);
    setPenilaianList(prev => prev.filter(p => p.id !== id));
    showToast('Penilaian dihapus', 'info');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  const exportRekapPDF = () => {
    if (!selectedPenilaian) return;
    const penilaian = penilaianList.find(p => p.id === selectedPenilaian);
    if (!penilaian) return;
    const details = detailNilaiMap[selectedPenilaian] || [];
    const headers = ['No', 'Nama', 'Nilai'];
    const body = details.map((d, i) => {
      const murid = muridList.find(m => m.id === d.murid_id);
      return [i + 1, murid?.nama || '-', d.nilai || 0];
    });
    generatePDF(
      `${penilaian.nama_penilaian} - ${penilaian.mapel} (${penilaian.kelas})`,
      headers, body,
      [`Tanggal: ${formatDate(penilaian.tanggal)}`, `Jenis: ${penilaian.jenis}`, `Bobot: ${penilaian.bobot}%`]
    );
  };

  const shareRekapWA = () => {
    if (!selectedPenilaian) return;
    const penilaian = penilaianList.find(p => p.id === selectedPenilaian);
    if (!penilaian) return;
    const details = detailNilaiMap[selectedPenilaian] || [];
    let text = `*HASIL ${penilaian.nama_penilaian}*\n\n`;
    text += `Mata Pelajaran: ${penilaian.mapel}\n`;
    text += `Kelas: ${penilaian.kelas}\n`;
    text += `Tanggal: ${formatDate(penilaian.tanggal)}\n\n`;
    text += `*Daftar Nilai:*\n`;
    details.forEach((d, i) => {
      const murid = muridList.find(m => m.id === d.murid_id);
      text += `${i + 1}. ${murid?.nama || '-'}: ${d.nilai}\n`;
    });
    shareWA(text);
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Penilaian</h2>
          <p className="section-subtitle">Input dan kelola nilai santri</p>
        </div>
        {tab === 'input' && (
          <button onClick={openInputModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Input Nilai</span>
          </button>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="tab-switcher">
        <button
          onClick={() => setTab('input')}
          className={`tab-btn ${tab === 'input' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          Input Nilai
        </button>
        <button
          onClick={() => setTab('riwayat')}
          className={`tab-btn ${tab === 'riwayat' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          Riwayat
        </button>
      </div>

      {/* ── Kelas Dropdown ── */}
      <div className="relative">
        <select
          value={selectedKelas}
          onChange={(e) => setSelectedKelas(e.target.value)}
          className="input-field text-sm font-semibold appearance-none w-full bg-white cursor-pointer pr-10"
        >
          {kelasOptions.length === 0 && <option value="">Belum ada kelas</option>}
          {kelasOptions.map((k) => (
            <option key={k} value={k}>
              Pilihan Kelas: {k}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card overflow-hidden">
              <div className="flex">
                <div className="w-1 skeleton rounded-none flex-shrink-0" />
                <div className="flex-1 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="skeleton h-4 w-1/3 rounded-lg" />
                    <div className="skeleton h-5 w-14 rounded-full" />
                  </div>
                  <div className="skeleton h-3 w-1/2 rounded-lg" />
                  <div className="skeleton h-3 w-1/4 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'input' ? (
        penilaianList.length === 0 ? (
          <EmptyState
            title="Belum ada penilaian"
            description="Klik Input Nilai untuk menambahkan nilai santri."
            icon={<BarChart3 className="w-8 h-8 text-slate-300" />}
          />
        ) : (
          <div className="space-y-3">
            {penilaianList.map(p => {
              const details = detailNilaiMap[p.id] || [];
              const avg = details.length > 0
                ? details.reduce((s, d) => s + (d.nilai || 0), 0) / details.length
                : 0;
              const isExpanded = selectedPenilaian === p.id;

              return (
                <div key={p.id} className="card overflow-hidden group">
                  {/* Left accent strip based on avg score colour */}
                  <div className="flex">
                    <div className={`w-1 flex-shrink-0 ${details.length === 0 ? 'bg-slate-200' : avg >= 80 ? 'bg-emerald-400' : avg >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`} />

                    <div className="flex-1 p-4">
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {/* Title + jenis badge */}
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="font-bold text-slate-800 text-sm leading-tight">{p.nama_penilaian}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getJenisBadge(p.jenis)}`}>
                              {p.jenis}
                            </span>
                          </div>

                          {/* Mapel + date + bobot row */}
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400 mb-2">
                            <span className="font-medium text-slate-600">{p.mapel}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(p.tanggal)}
                            </span>
                            <span>Bobot: {p.bobot}%</span>
                          </div>

                          {/* Avg score pill */}
                          {details.length > 0 && (
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs text-slate-500">Rata-rata</span>
                              <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${getSkorBadge(avg)}`}>
                                {avg.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-400">{details.length} siswa</span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => setSelectedPenilaian(isExpanded ? '' : p.id)}
                            className="btn-icon w-7 h-7 hover:bg-sky-50 hover:text-sky-600"
                            title="Detail nilai"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deletePenilaian(p.id)}
                            className="btn-icon w-7 h-7 hover:bg-rose-50 hover:text-rose-500"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* ── Expanded detail panel ── */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          {/* Export / Share / Close */}
                          <div className="flex items-center gap-2 mb-3">
                            <button
                              onClick={exportRekapPDF}
                              className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border border-rose-200"
                            >
                              <FileText className="w-3 h-3" /> Export PDF
                            </button>
                            <button
                              onClick={shareRekapWA}
                              className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border border-emerald-200"
                            >
                              <Share2 className="w-3 h-3" /> Share WA
                            </button>
                            <button
                              onClick={() => setSelectedPenilaian('')}
                              className="ml-auto text-xs text-slate-400 hover:text-slate-600 transition-colors"
                            >
                              Tutup
                            </button>
                          </div>

                          {/* Student score rows */}
                          <div className="space-y-1.5">
                            {details.map((d, idx) => {
                              const murid = muridList.find(m => m.id === d.murid_id);
                              const skor = d.nilai || 0;
                              return (
                                <div key={d.id} className="flex items-center gap-3 rounded-xl p-2.5 bg-slate-50 hover:bg-slate-100 transition-colors">
                                  {/* Rank number */}
                                  <span className="text-xs text-slate-400 w-5 text-center flex-shrink-0">{idx + 1}</span>

                                  {/* Score badge */}
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${getSkorBg(skor)}`}>
                                    <span className={`font-bold text-xs ${getSkorColor(skor)}`}>{skor}</span>
                                  </div>

                                  {/* Name */}
                                  <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">
                                    {murid?.nama || '-'}
                                  </span>

                                  {/* Grade label */}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${getSkorBadge(skor)}`}>
                                    {skor >= 80 ? 'Baik' : skor >= 70 ? 'Cukup' : 'Kurang'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── Riwayat tab ── */
        <div className="card p-5">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            Riwayat Penilaian
          </h3>
          {penilaianList.length === 0 ? (
            <EmptyState title="Belum ada riwayat" />
          ) : (
            <div className="space-y-2">
              {penilaianList.map(p => {
                const details = detailNilaiMap[p.id] || [];
                const avg = details.length > 0
                  ? details.reduce((s, d) => s + (d.nilai || 0), 0) / details.length
                  : null;
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                    {/* Icon box */}
                    <div className="icon-box icon-box-sm icon-box-sky flex-shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">{p.nama_penilaian}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>{p.mapel}</span>
                        <span>•</span>
                        <span>{formatDate(p.tanggal)}</span>
                      </div>
                    </div>

                    {/* Right: jenis + avg */}
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getJenisBadge(p.jenis)}`}>
                        {p.jenis}
                      </span>
                      {avg !== null && (
                        <span className={`text-xs font-bold ${getSkorColor(avg)}`}>
                          {avg.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Input Modal ── */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title="Input Nilai Santri" size="lg">
        <form onSubmit={handleSaveBatch} className="space-y-4">
          {/* Row 1: Mapel + Jenis */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Mata Pelajaran <span className="text-rose-500">*</span>
              </label>
              <select
                value={inputMapel}
                onChange={e => setInputMapel(e.target.value)}
                className="input-field text-sm"
                required
              >
                <option value="">Pilih</option>
                {mapelOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jenis Penilaian</label>
              <select
                value={inputJenis}
                onChange={e => setInputJenis(e.target.value as JenisUjian)}
                className="input-field text-sm"
              >
                {JENIS_UJIAN.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Nama + Bobot */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nama Penilaian <span className="text-rose-500">*</span>
              </label>
              <select
                value={inputNama}
                onChange={e => setInputNama(e.target.value)}
                className="input-field text-sm"
                required
              >
                <option value="">Pilih Penilaian</option>
                {NAMA_PENILAIAN_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bobot (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={inputBobot}
                onChange={e => setInputBobot(Number(e.target.value))}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Row 3: Tanggal */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
            <input
              type="date"
              value={inputTanggal}
              onChange={e => setInputTanggal(e.target.value)}
              className="input-field text-sm"
              required
            />
          </div>

          {/* ── Batch score input ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">
                Nilai Santri
              </p>
              <p className="text-[10px] text-slate-400">0–100, kosongkan jika tidak ada</p>
            </div>

            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
              {muridFiltered.map((m, idx) => {
                const skor = batchNilai[m.id];
                const hasScore = skor !== '' && skor !== undefined;
                const scoreNum = hasScore ? Number(skor) : 0;
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 bg-white border border-slate-100 hover:border-slate-200 p-2.5 rounded-xl transition-colors"
                  >
                    {/* Rank */}
                    <span className="text-xs text-slate-400 w-5 text-center flex-shrink-0">{idx + 1}</span>

                    {/* Name */}
                    <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">{m.nama}</span>

                    {/* Score input with dynamic colour */}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={batchNilai[m.id] ?? ''}
                      onChange={e => setBatchNilai(prev => ({ ...prev, [m.id]: e.target.value }))}
                      className={`input-field text-sm w-20 text-center font-bold transition-colors ${
                        hasScore
                          ? scoreNum >= 80
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : scoreNum >= 70
                            ? 'border-amber-300 bg-amber-50 text-amber-700'
                            : 'border-rose-300 bg-rose-50 text-rose-700'
                          : ''
                      }`}
                      placeholder="–"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn-secondary flex-1 text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Menyimpan...' : 'Simpan Nilai'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
