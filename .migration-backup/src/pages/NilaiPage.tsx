import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, BarChart3, FileText, Share2, Save, Calendar, TrendingUp, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SearchableSelect from '../components/SearchableSelect';
import { useLembaga } from '../hooks/useLembaga';
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

export default function NilaiPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const { data: lembagaList = [] } = useLembaga();
  const [tab, setTab] = useState<Tab>('input');
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [mapelOptions, setMapelOptions] = useState<string[]>([]);
  const [selectedLembaga, setSelectedLembaga] = useState('');
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

  const [inputLembagaId, setInputLembagaId] = useState('');
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
    setMapelOptions(scope.mapelList);
    if (scope.mapelList.length) setInputMapel(scope.mapelList[0]);

    const { data: muridData } = await supabase.from('murid').select('*').eq('status_aktif', true).order('nama');
    let murid = (muridData ?? []) as Murid[];
    if (!scope.isAdmin && scope.kelasList.length > 0) {
      murid = murid.filter(m => scope.kelasList.includes(m.kelas || ''));
    }
    setMuridList(murid);
    setLoading(false);
  };

  // Kelas options filtered by selected lembaga (query murid by lembaga_id to get classes)
  const kelasOptionsFiltered: string[] = useMemo(() => {
    const source = selectedLembaga
      ? muridList.filter(m => m.lembaga_id === selectedLembaga)
      : muridList;
    return Array.from(new Set(source.map(m => m.kelas).filter((k): k is string => Boolean(k)))).sort();
  }, [muridList, selectedLembaga]);

  // Reset selectedKelas when lembaga changes, pick first available
  useEffect(() => {
    if (kelasOptionsFiltered.length > 0 && !kelasOptionsFiltered.includes(selectedKelas)) {
      setSelectedKelas(kelasOptionsFiltered[0] ?? '');
    } else if (kelasOptionsFiltered.length === 0) {
      setSelectedKelas('');
    }
  }, [kelasOptionsFiltered]);

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
    setInputLembagaId(selectedLembaga || (lembagaList[0]?.id ?? ''));
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
          lembaga_id: inputLembagaId || null,
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
  const getSkorColor = (s: number) => s >= 80 ? 'text-emerald-600' : s >= 70 ? 'text-amber-600' : 'text-rose-600';
  const getSkorBg = (s: number) => s >= 80 ? 'bg-emerald-50' : s >= 70 ? 'bg-amber-50' : 'bg-rose-50';

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

  // Lembaga options for SearchableSelect
  const lembagaOptions = useMemo(
    () => lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga })),
    [lembagaList]
  );

  // Kelas options for SearchableSelect inside modal (filtered by inputLembagaId)
  const modalKelasOptions = useMemo(() => {
    if (!inputLembagaId) {
      return [...new Set(muridList.map(m => m.kelas).filter(Boolean))].sort().map(k => ({ value: k, label: k }));
    }
    return [...new Set(muridList.filter(m => m.lembaga_id === inputLembagaId).map(m => m.kelas).filter(Boolean))].sort().map(k => ({ value: k, label: k }));
  }, [muridList, inputLembagaId]);


  return (
    <div>
      <div className="flex items-center justify-between mb-5">
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

      <div className="tab-switcher mb-5">
        <button onClick={() => setTab('input')} className={`tab-btn ${tab === 'input' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
          Input Nilai
        </button>
        <button onClick={() => setTab('riwayat')} className={`tab-btn ${tab === 'riwayat' ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
          Riwayat
        </button>
      </div>

      {/* 1. Lembaga (SearchableSelect) */}
      <div className="mb-4">
        <SearchableSelect
          value={selectedLembaga}
          onChange={setSelectedLembaga}
          options={lembagaOptions}
          placeholder="Pilih Lembaga"
          label="Lembaga"
        />
      </div>

      {/* 2. Kelas (select filtered by lembaga) */}
      <div className="mb-4 relative">
        <select
          value={selectedKelas}
          onChange={(e) => setSelectedKelas(e.target.value)}
          className="input-field text-sm font-semibold appearance-none w-full bg-white cursor-pointer pr-10"
        >
          {kelasOptionsFiltered.length === 0 && <option value="">Belum ada kelas</option>}
          {kelasOptionsFiltered.map((k) => (
            <option key={k} value={k}>
              Pilihan Kelas: {k}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-20 bg-slate-50 rounded-2xl" />)}</div>
      ) : tab === 'input' ? (
        penilaianList.length === 0 ? (
          <EmptyState title="Belum ada penilaian" description="Klik Input Nilai untuk menambahkan nilai santri." icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
        ) : (
          <div className="space-y-3">
            {penilaianList.map(p => {
              const details = detailNilaiMap[p.id] || [];
              const avg = details.length > 0 ? details.reduce((s, d) => s + (d.nilai || 0), 0) / details.length : 0;
              return (
                <div key={p.id} className="card p-4 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-800 text-sm">{p.nama_penilaian}</span>
                        <span className="badge badge-info text-[10px]">{p.jenis}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{p.mapel}</span>
                        <span>{formatDate(p.tanggal)}</span>
                        <span>Bobot: {p.bobot}%</span>
                      </div>
                      {details.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-500">Rata-rata:</span>
                          <span className={`text-sm font-bold ${avg >= 80 ? 'text-emerald-600' : avg >= 70 ? 'text-amber-600' : 'text-rose-600'}`}>
                            {avg.toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-400">({details.length} siswa)</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setSelectedPenilaian(p.id)} className="p-1.5 rounded-lg hover:bg-sky-50 text-slate-400 hover:text-sky-600 transition-colors">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deletePenilaian(p.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {selectedPenilaian === p.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex gap-2 mb-3">
                        <button onClick={exportRekapPDF} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          <FileText className="w-3 h-3" /> Export PDF
                        </button>
                        <button onClick={shareRekapWA} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                          <Share2 className="w-3 h-3" /> Share WA
                        </button>
                        <button onClick={() => setSelectedPenilaian('')} className="ml-auto text-xs text-slate-400 hover:text-slate-600">
                          Tutup
                        </button>
                      </div>
                      <div className="space-y-2">
                        {details.map(d => {
                          const murid = muridList.find(m => m.id === d.murid_id);
                          return (
                            <div key={d.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-2">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getSkorBg(d.nilai || 0)}`}>
                                <span className={`font-bold text-sm ${getSkorColor(d.nilai || 0)}`}>{d.nilai}</span>
                              </div>
                              <span className="text-sm font-medium text-slate-700">{murid?.nama || '-'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="card p-5">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4" />
            Riwayat Penilaian
          </h3>
          {penilaianList.length === 0 ? (
            <EmptyState title="Belum ada riwayat" />
          ) : (
            <div className="space-y-2">
              {penilaianList.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{p.nama_penilaian}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{p.mapel}</span>
                      <span>{formatDate(p.tanggal)}</span>
                    </div>
                  </div>
                  <span className="badge badge-info text-[10px]">{p.jenis}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Input Nilai Santri" size="lg">
        <form onSubmit={handleSaveBatch} className="space-y-4">
          {/* 1. Lembaga (SearchableSelect) */}
          <div className="relative">
            <SearchableSelect
              value={inputLembagaId}
              onChange={setInputLembagaId}
              options={lembagaOptions}
              placeholder="Pilih Lembaga"
              label="Lembaga"
            />
          </div>

          {/* 2. Kelas (select filtered by lembaga) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas</label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="input-field text-sm"
              required
            >
              <option value="">Pilih Kelas</option>
              {modalKelasOptions.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>

          {/* 3. Mata Pelajaran */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mata Pelajaran</label>
              <select value={inputMapel} onChange={e => setInputMapel(e.target.value)} className="input-field text-sm" required>
                <option value="">Pilih</option>
                {mapelOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jenis Penilaian</label>
              <select value={inputJenis} onChange={e => setInputJenis(e.target.value as JenisUjian)} className="input-field text-sm">
                {JENIS_UJIAN.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Penilaian</label>
              <select value={inputNama} onChange={e => setInputNama(e.target.value)} className="input-field text-sm" required>
                <option value="">Pilih Penilaian</option>
                {NAMA_PENILAIAN_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bobot (%)</label>
              <input type="number" min="0" max="100" value={inputBobot} onChange={e => setInputBobot(Number(e.target.value))} className="input-field text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
            <input type="date" value={inputTanggal} onChange={e => setInputTanggal(e.target.value)} className="input-field text-sm" required />
          </div>

          {/* 4. Santri */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Nilai Santri (0-100, kosongkan jika tidak ada)</p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {muridFiltered.map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-white border border-slate-100 p-2 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">{m.nama}</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={batchNilai[m.id] ?? ''}
                    onChange={e => setBatchNilai(prev => ({ ...prev, [m.id]: e.target.value }))}
                    className="input-field text-sm w-20 text-center font-bold"
                    placeholder="-"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-1 border-t border-slate-100 mt-2">
            <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1 text-sm py-2.5">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 py-2.5">
              <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Nilai'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
