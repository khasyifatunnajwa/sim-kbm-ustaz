import { useState, useMemo } from 'react';
import {
  CalendarDays, CheckCircle, Clock, AlertCircle, XCircle,
  FileText, Share2, Search
} from 'lucide-react';
import type { Murid, Absensi } from '../types';
import EmptyState from '../components/EmptyState';
import { generatePDF, shareWA } from '../lib/pdf';
import { getTanggalHariIni, namaHari, namaBulan, cn } from '../lib/utils';

interface AbsensiPageProps {
  muridList: Murid[];
  absensiList: Absensi[];
  onSaveAbsen: (muridId: string, status: Absensi['status']) => void;
  onSaveBatch: (records: { murid_id: string; status: Absensi['status'] }[]) => void;
}

export default function AbsensiPage({ muridList, absensiList, onSaveBatch }: AbsensiPageProps) {
  const [activeTab, setActiveTab] = useState<'harian' | 'rekap'>('harian');
  const [filterKelas, setFilterKelas] = useState('');
  const [draftAbsen, setDraftAbsen] = useState<Record<string, Absensi['status']>>({});
  const [rekapKelas, setRekapKelas] = useState('');
  const [rekapType, setRekapType] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [rekapBulan, setRekapBulan] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState('');
  // Detail view state removed for simplicity

  const tanggalHariIni = getTanggalHariIni();
  const hariIni = namaHari[new Date().getDay()];

  const kelasList = useMemo(() => [...new Set(muridList.map(m => m.kelas))].sort(), [muridList]);

  const muridDiKelas = useMemo(() => {
    return muridList
      .filter(m => m.kelas === filterKelas)
      .filter(m => m.nama.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [muridList, filterKelas, searchQuery]);

  // Get existing absen for today
  const getExistingStatus = (muridId: string): Absensi['status'] | undefined => {
    if (draftAbsen[muridId]) return draftAbsen[muridId];
    const found = absensiList.find(a => a.murid_id === muridId && a.tanggal === tanggalHariIni);
    return found?.status;
  };

  const setStatus = (muridId: string, status: Absensi['status']) => {
    setDraftAbsen(prev => ({ ...prev, [muridId]: status }));
  };

  const simpanAbsenMasal = () => {
    if (!filterKelas) return;
    const records = muridDiKelas.map(m => {
      const status = draftAbsen[m.id] || getExistingStatus(m.id);
      return status ? { murid_id: m.id, status } : null;
    }).filter(Boolean) as { murid_id: string; status: Absensi['status'] }[];

    if (records.length === 0) {
      alert('Isi absensi minimal satu santri!');
      return;
    }

    onSaveBatch(records);
    setDraftAbsen({});
    alert('Absensi berhasil disimpan!');
  };

  // Rekap logic
  const rekapData = useMemo(() => {
    if (!rekapKelas) return [];
    const muridRekap = muridList.filter(m => m.kelas === rekapKelas);
    return muridRekap.map(m => {
      const absenMurid = absensiList.filter(a => {
        const matchMurid = a.murid_id === m.id;
        const matchWaktu = rekapType === 'bulanan'
          ? a.tanggal.startsWith(rekapBulan)
          : a.tanggal.startsWith(rekapTahun);
        return matchMurid && matchWaktu;
      });
      const hadir = absenMurid.filter(a => a.status === 'Hadir').length;
      const izin = absenMurid.filter(a => a.status === 'Izin').length;
      const sakit = absenMurid.filter(a => a.status === 'Sakit').length;
      const alpha = absenMurid.filter(a => a.status === 'Alpha').length;
      const total = absenMurid.length;
      return {
        murid: m,
        hadir, izin, sakit, alpha, total,
        persen: total > 0 ? ((hadir / total) * 100).toFixed(1) : '0',
      };
    });
  }, [muridList, absensiList, rekapKelas, rekapType, rekapBulan, rekapTahun]);

  const exportRekapPDF = () => {
    const headers = ['Nama Santri', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Persentase'];
    const body = rekapData.map(d => [
      d.murid.nama, d.hadir, d.izin, d.sakit, d.alpha, `${d.persen}%`
    ]);
    const info = [
      `Kelas: ${rekapKelas}`,
      `Periode: ${rekapType === 'bulanan' ? rekapBulan : 'Tahun ' + rekapTahun}`,
      `Dicetak: ${new Date().toLocaleDateString('id-ID')}`,
    ];
    generatePDF('Rekapitulasi Absensi', headers, body, info);
  };

  const shareRekapWA = () => {
    const periode = rekapType === 'bulanan' ? rekapBulan : 'Tahun ' + rekapTahun;
    let text = `Assalamu'alaikum Warahmatullahi Wabarakatuh.\n\n`;
    text += `Yang terhormat Bapak/Ibu Wali Santri,\n`;
    text += `Berikut kami sampaikan laporan rekapitulasi kehadiran santri *Kelas ${rekapKelas}* untuk periode *${periode}*.\n\n`;
    rekapData.forEach(d => {
      text += `*${d.murid.nama}*: H=${d.hadir}, I=${d.izin}, S=${d.sakit}, A=${d.alpha} (${d.persen}%)\n`;
    });
    text += `\nMohon periksa dokumen PDF yang dilampirkan untuk melihat rincian kehadiran putra/putri Anda.\n\n`;
    text += `Terima kasih atas perhatian dan kerjasamanya.\n`;
    text += `Semoga para santri senantiasa diberikan kemudahan dalam menuntut ilmu.\n\n`;
    text += `Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;
    shareWA(text);
  };

  const statusConfig = {
    Hadir: { icon: CheckCircle, color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500' },
    Izin: { icon: Clock, color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-500' },
    Sakit: { icon: AlertCircle, color: 'sky', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', ring: 'ring-sky-500' },
    Alpha: { icon: XCircle, color: 'rose', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', ring: 'ring-rose-500' },
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="section-title">Absensi Santri</h2>
        <p className="section-subtitle">Catat dan kelola kehadiran harian santri</p>
      </div>

      {/* Tab Switcher */}
      <div className="tab-switcher">
        <button
          onClick={() => setActiveTab('harian')}
          className={cn('tab-btn', activeTab === 'harian' ? 'tab-btn-active' : 'tab-btn-inactive')}
        >
          Absen Harian
        </button>
        <button
          onClick={() => setActiveTab('rekap')}
          className={cn('tab-btn', activeTab === 'rekap' ? 'tab-btn-active' : 'tab-btn-inactive')}
        >
          Rekapitulasi
        </button>
      </div>

      {/* === ABSEN HARIAN === */}
      {activeTab === 'harian' && (
        <div className="space-y-4">
          {/* Info Card */}
          <div className="card bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mb-0.5">Jurnal Kehadiran</p>
                <h3 className="text-base font-black">{hariIni}</h3>
                <p className="text-xs font-medium text-emerald-100">
                  {new Date().getDate()} {namaBulan[new Date().getMonth()]} {new Date().getFullYear()}
                </p>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
                <CalendarDays className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Kelas Selector */}
          <div className="card p-4">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Kelas</label>
            <select
              className="input-field"
              value={filterKelas}
              onChange={e => { setFilterKelas(e.target.value); setDraftAbsen({}); }}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
            </select>
          </div>

          {filterKelas && (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="Cari nama santri..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Progress */}
              {muridDiKelas.length > 0 && (
                <div className="card p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500">Progres Pengisian</span>
                    <span className="text-xs font-bold text-emerald-600">
                      {muridDiKelas.filter(m => getExistingStatus(m.id) || draftAbsen[m.id]).length} / {muridDiKelas.length}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${(muridDiKelas.filter(m => getExistingStatus(m.id) || draftAbsen[m.id]).length / muridDiKelas.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* List */}
              <div className="space-y-2">
                {muridDiKelas.map((m, idx) => {
                  const status = getExistingStatus(m.id);
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'card p-3 flex items-center justify-between transition-all',
                        status && 'ring-1 ring-emerald-200'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{m.nama}</h4>
                          {status ? (
                            <span className={cn('text-[10px] font-bold', statusConfig[status].text)}>
                              {status}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500">Belum diisi</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {(Object.keys(statusConfig) as Absensi['status'][]).map(s => {
                          const config = statusConfig[s];
                          const Icon = config.icon;
                          const isActive = status === s || draftAbsen[m.id] === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setStatus(m.id, s)}
                              className={cn(
                                'w-9 h-9 rounded-lg flex items-center justify-center transition-all',
                                isActive
                                  ? `${config.bg} ${config.text} ring-2 ${config.ring}`
                                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              )}
                              title={s}
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={simpanAbsenMasal}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Simpan Absensi
              </button>
            </>
          )}
        </div>
      )}

      {/* === REKAPITULASI === */}
      {activeTab === 'rekap' && (
        <div className="space-y-4">
          <div className="card p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pilih Kelas</label>
              <select
                className="input-field"
                value={rekapKelas}
                onChange={e => setRekapKelas(e.target.value)}
              >
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map(k => <option key={k} value={k}>Kelas {k}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Jenis Rekap</label>
                <select
                  className="input-field"
                  value={rekapType}
                  onChange={e => setRekapType(e.target.value as 'bulanan' | 'tahunan')}
                >
                  <option value="bulanan">Bulanan</option>
                  <option value="tahunan">Tahunan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Periode</label>
                {rekapType === 'bulanan' ? (
                  <input
                    type="month"
                    className="input-field"
                    value={rekapBulan}
                    onChange={e => setRekapBulan(e.target.value)}
                  />
                ) : (
                  <input
                    type="number"
                    className="input-field"
                    placeholder="2024"
                    value={rekapTahun}
                    onChange={e => setRekapTahun(e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          {rekapKelas && rekapData.length > 0 && (
            <>
              {/* Chart Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="card p-3 text-center">
                  <div className="text-2xl font-black text-emerald-600">
                    {rekapData.reduce((s, d) => s + d.hadir, 0)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Hadir</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-2xl font-black text-amber-500">
                    {rekapData.reduce((s, d) => s + d.izin, 0)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Izin</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-2xl font-black text-sky-500">
                    {rekapData.reduce((s, d) => s + d.sakit, 0)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Sakit</div>
                </div>
                <div className="card p-3 text-center">
                  <div className="text-2xl font-black text-rose-500">
                    {rekapData.reduce((s, d) => s + d.alpha, 0)}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Total Alpha</div>
                </div>
              </div>

              {/* Table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase">Nama</th>
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase text-center">H</th>
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase text-center">I</th>
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase text-center">S</th>
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase text-center">A</th>
                        <th className="p-3 text-[10px] font-black text-slate-500 uppercase text-center">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rekapData.map(d => (
                        <tr key={d.murid.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3 text-xs font-bold text-slate-700">{d.murid.nama}</td>
                          <td className="p-3 text-center text-xs font-bold text-emerald-600">{d.hadir}</td>
                          <td className="p-3 text-center text-xs font-bold text-amber-500">{d.izin}</td>
                          <td className="p-3 text-center text-xs font-bold text-sky-500">{d.sakit}</td>
                          <td className="p-3 text-center text-xs font-bold text-rose-500">{d.alpha}</td>
                          <td className="p-3 text-center">
                            <span className={cn(
                              'text-xs font-black px-2 py-0.5 rounded-full',
                              parseFloat(d.persen) >= 80 ? 'bg-emerald-50 text-emerald-700' :
                              parseFloat(d.persen) >= 60 ? 'bg-amber-50 text-amber-700' :
                              'bg-rose-50 text-rose-700'
                            )}>
                              {d.persen}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={exportRekapPDF}
                  className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                >
                  <FileText className="w-4 h-4" />
                  Export PDF
                </button>
                <button
                  onClick={shareRekapWA}
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  Share WA
                </button>
              </div>
            </>
          )}

          {rekapKelas && rekapData.length === 0 && (
            <EmptyState
              title="Tidak ada data"
              description="Belum ada data absensi untuk periode ini"
            />
          )}
        </div>
      )}
    </div>
  );
}
