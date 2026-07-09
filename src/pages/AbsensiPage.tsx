import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck, Save, CheckCircle, AlertCircle, XCircle, Clock,
  FileText, Share2, Calendar, Pencil, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { generatePDF, shareWA } from '../lib/pdf';
import type { Murid, Absensi, Profile, ShowToast } from '../types';

type Status = 'Hadir' | 'Izin' | 'Sakit' | 'Alpha' | 'Telat';
type Tab = 'input' | 'rekap';

const STATUS_CONFIG: Record<Status, { active: string; icon: React.ElementType }> = {
  Hadir:  { active: 'bg-emerald-500 border-emerald-500 text-white', icon: CheckCircle },
  Izin:   { active: 'bg-amber-500 border-amber-500 text-white',   icon: Clock },
  Sakit:  { active: 'bg-sky-500 border-sky-500 text-white',       icon: AlertCircle },
  Alpha:  { active: 'bg-rose-500 border-rose-500 text-white',     icon: XCircle },
  Telat:  { active: 'bg-orange-500 border-orange-500 text-white', icon: AlertTriangle },
};

const STATUS_LIST: Status[] = ['Hadir', 'Izin', 'Sakit', 'Alpha', 'Telat'];
const STATUS_COLOR: Record<Status, string> = {
  Hadir: 'bg-emerald-500', Izin: 'bg-amber-500', Sakit: 'bg-sky-500', Alpha: 'bg-rose-500', Telat: 'bg-orange-500'
};
const STATUS_BADGE: Record<Status, string> = {
  Hadir: 'badge-success', Izin: 'badge-warning', Sakit: 'badge-info', Alpha: 'badge-danger', Telat: 'badge-warning'
};
void STATUS_BADGE;

export default function AbsensiPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [tab, setTab] = useState<Tab>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'absensi' && hashParts[1] === 'rekap') {
      return 'rekap';
    }
    return 'input';
  });

  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const [mapelOptions, setMapelOptions] = useState<string[]>([]);
  const [selectedKelas, setSelectedKelas] = useState<string>('');
  const [selectedMapel, setSelectedMapel] = useState<string>('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Rekap state
  const [rekapType, setRekapType] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [rekapBulan, setRekapBulan] = useState(new Date().getMonth() + 1);
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear());
  const [rekapData, setRekapData] = useState<Record<string, Record<Status, number>>>({});
  const [rekapLoading, setRekapLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayInfo = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'absensi') {
        if (hashParts[1] === 'rekap') {
          setTab('rekap');
        } else {
          setTab('input');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    if (newTab === 'rekap') {
      window.history.pushState(null, '', '#absensi/rekap');
    } else {
      window.history.pushState(null, '', '#absensi');
    }
  };

  useEffect(() => {
    (async () => {
      const scope = await getUstazScope(profile);
      setKelasOptions(scope.kelasList);
      setMapelOptions(scope.mapelList);
      if (scope.kelasList.length) setSelectedKelas(scope.kelasList[0]);
      if (scope.mapelList.length) setSelectedMapel(scope.mapelList[0]);

      const { data } = await supabase.from('murid').select('*').eq('status_aktif', true).order('nama');
      let murid = (data ?? []) as Murid[];
      if (!scope.isAdmin && scope.kelasList.length > 0) {
        murid = murid.filter(m => scope.kelasList.includes(m.kelas || ''));
      }
      setMuridList(murid);
    })();
  }, [profile]);

  const muridFiltered = useMemo(
    () => muridList.filter(m => m.kelas === selectedKelas),
    [muridList, selectedKelas]
  );

  useEffect(() => {
    if (selectedKelas && tab === 'input') loadData(selectedKelas, tanggal);
  }, [selectedKelas, tanggal, tab]);

  const loadData = async (kelas: string, tgl: string) => {
    setLoading(true);
    const muridKelas = muridList.filter(m => m.kelas === kelas);
    const muridIds = muridKelas.map(m => m.id);
    const map: Record<string, Status> = {};
    muridKelas.forEach(m => { map[m.id] = 'Hadir'; });
    if (muridIds.length) {
      const { data } = await supabase.from('absensi').select('*').eq('tanggal', tgl).in('murid_id', muridIds);
      (data ?? []).forEach((a: Absensi) => { if (a.murid_id) map[a.murid_id] = a.status as Status; });
    }
    setAttendance(map);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedKelas || !muridFiltered.length) return;
    setSaving(true);
    const muridIds = muridFiltered.map(m => m.id);
    await supabase.from('absensi').delete().eq('tanggal', tanggal).in('murid_id', muridIds);
    const records = muridFiltered.map(m => ({ murid_id: m.id, tanggal, status: attendance[m.id] ?? 'Hadir' }));
    const { error } = await supabase.from('absensi').insert(records);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Absensi berhasil disimpan!', 'success');
  };

  const confirmSave = () => {
    setShowConfirmDialog(true);
  };

  const loadRekap = async () => {
    if (!selectedKelas) return;
    setRekapLoading(true);
    const muridKelas = muridList.filter(m => m.kelas === selectedKelas);
    const muridIds = muridKelas.map(m => m.id);
    if (!muridIds.length) { setRekapData({}); setRekapLoading(false); return; }

    let query = supabase.from('absensi').select('*').in('murid_id', muridIds);
    if (rekapType === 'bulanan') {
      const start = `${rekapTahun}-${String(rekapBulan).padStart(2, '0')}-01`;
      const end = `${rekapTahun}-${String(rekapBulan).padStart(2, '0')}-31`;
      query = query.gte('tanggal', start).lte('tanggal', end);
    } else {
      const start = `${rekapTahun}-01-01`;
      const end = `${rekapTahun}-12-31`;
      query = query.gte('tanggal', start).lte('tanggal', end);
    }
    const { data } = await query.order('tanggal', { ascending: true });

    const grouped: Record<string, Record<Status, number>> = {};
    muridKelas.forEach(m => {
      grouped[m.id] = { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Telat: 0 };
    });
    (data ?? []).forEach((a: Absensi) => {
      if (a.murid_id && grouped[a.murid_id]) {
        grouped[a.murid_id][a.status as Status] = (grouped[a.murid_id][a.status as Status] ?? 0) + 1;
      }
    });
    setRekapData(grouped);
    setRekapLoading(false);
  };

  useEffect(() => {
    if (tab === 'rekap' && selectedKelas) loadRekap();
  }, [tab, selectedKelas, rekapType, rekapBulan, rekapTahun]);

  const stats = {
    hadir: Object.values(attendance).filter(s => s === 'Hadir').length,
    izin:  Object.values(attendance).filter(s => s === 'Izin').length,
    sakit: Object.values(attendance).filter(s => s === 'Sakit').length,
    alpha: Object.values(attendance).filter(s => s === 'Alpha').length,
    telat: Object.values(attendance).filter(s => s === 'Telat').length,
  };

  const exportRekapPDF = () => {
    const periode = rekapType === 'bulanan'
      ? new Date(rekapTahun, rekapBulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : `Tahun ${rekapTahun}`;
    const headers = ['No', 'Nama', 'Hadir', 'Izin', 'Sakit', 'Alpha', 'Telat', '% Hadir'];
    const body = muridFiltered.map((m, i) => {
      const d = rekapData[m.id] ?? { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Telat: 0 };
      const total = d.Hadir + d.Izin + d.Sakit + d.Alpha + d.Telat;
      const pct = total > 0 ? ((d.Hadir / total) * 100).toFixed(1) : '0';
      return [i + 1, m.nama, d.Hadir, d.Izin, d.Sakit, d.Alpha, d.Telat, `${pct}%`];
    });
    generatePDF(`Rekap Absensi ${selectedKelas}`, headers, body, [`Periode: ${periode}`, `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`]);
  };

  const shareRekapWA = () => {
    const periode = rekapType === 'bulanan'
      ? new Date(rekapTahun, rekapBulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : `Tahun ${rekapTahun}`;
    let text = `Assalamu'alaikum warahmatullahi wabarakatuh.\n\nBerikut kami sampaikan laporan absensi santri Kelas ${selectedKelas} untuk periode ${periode}:\n\n`;
    muridFiltered.forEach((m, i) => {
      const d = rekapData[m.id] ?? { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Telat: 0 };
      const total = d.Hadir + d.Izin + d.Sakit + d.Alpha + d.Telat;
      const pct = total > 0 ? ((d.Hadir / total) * 100).toFixed(0) : '0';
      text += `${i + 1}. ${m.nama} - H:${d.Hadir} I:${d.Izin} S:${d.Sakit} A:${d.Alpha} T:${d.Telat} (${pct}%)\n`;
    });
    text += `\nTerima kasih.\nWassalamu'alaikum warahmatullahi wabarakatuh.`;
    shareWA(text);
  };

  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];

  /* ─── helpers ─── */
  const classAttendancePct = (() => {
    let totalHadir = 0, totalAll = 0;
    muridFiltered.forEach(m => {
      const d = rekapData[m.id] ?? { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Telat: 0 };
      const t = d.Hadir + d.Izin + d.Sakit + d.Alpha + d.Telat;
      totalHadir += d.Hadir;
      totalAll += t;
    });
    return totalAll > 0 ? (totalHadir / totalAll) * 100 : 0;
  })();

  return (
    <div className="animate-fadeIn">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="icon-box icon-box-md icon-box-emerald">
          <ClipboardCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="section-title">Absensi</h2>
          <p className="section-subtitle">Input dan rekapitulasi kehadiran santri</p>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="tab-switcher mb-5">
        <button
          onClick={() => handleTabChange('input')}
          className={`tab-btn ${tab === 'input' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          Input Harian
        </button>
        <button
          onClick={() => handleTabChange('rekap')}
          className={`tab-btn ${tab === 'rekap' ? 'tab-btn-active' : 'tab-btn-inactive'}`}
        >
          Rekapitulasi
        </button>
      </div>

      {/* ════════════════════════════════
          TAB: INPUT HARIAN
      ════════════════════════════════ */}
      {tab === 'input' && (
        <div className="animate-slideUp space-y-4">

          {/* ── Filter Card ── */}
          <div className="card p-4">
            {/* Date banner */}
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50">
              <div className="icon-box icon-box-sm icon-box-emerald">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{todayInfo}</p>
                {tanggal !== today && (
                  <span className="badge badge-warning mt-0.5">Bukan hari ini</span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Kelas</label>
                <select
                  value={selectedKelas}
                  onChange={e => setSelectedKelas(e.target.value)}
                  className="input-field"
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Mata Pelajaran</label>
                <select
                  value={selectedMapel}
                  onChange={e => setSelectedMapel(e.target.value)}
                  className="input-field"
                >
                  <option value="">Pilih Mapel</option>
                  {mapelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* ── Stat Strip ── */}
          {muridFiltered.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: 'Hadir', val: stats.hadir,  cls: 'border-emerald-200 dark:border-emerald-700/50', num: 'text-emerald-600 dark:text-emerald-400', lbl: 'text-emerald-500 dark:text-emerald-500' },
                { label: 'Izin',  val: stats.izin,   cls: 'border-amber-200 dark:border-amber-700/50',   num: 'text-amber-600 dark:text-amber-400',   lbl: 'text-amber-500 dark:text-amber-500' },
                { label: 'Sakit', val: stats.sakit,  cls: 'border-sky-200 dark:border-sky-700/50',       num: 'text-sky-600 dark:text-sky-400',       lbl: 'text-sky-500 dark:text-sky-500' },
                { label: 'Alpha', val: stats.alpha,  cls: 'border-rose-200 dark:border-rose-700/50',     num: 'text-rose-600 dark:text-rose-400',     lbl: 'text-rose-500 dark:text-rose-500' },
                { label: 'Telat', val: stats.telat,  cls: 'border-orange-200 dark:border-orange-700/50', num: 'text-orange-600 dark:text-orange-400', lbl: 'text-orange-500 dark:text-orange-500' },
              ].map(s => (
                <div key={s.label} className={`card p-2.5 text-center border ${s.cls}`}>
                  <p className={`text-xl font-bold leading-none ${s.num}`}>{s.val}</p>
                  <p className={`text-[10px] font-semibold mt-1 ${s.lbl}`}>{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Student List ── */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="skeleton w-7 h-7 rounded-lg" />
                    <div className="skeleton h-3.5 w-40 rounded-md" />
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[1,2,3,4,5].map(j => <div key={j} className="skeleton h-8 rounded-lg" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : !selectedKelas ? (
            <EmptyState
              title="Pilih kelas terlebih dahulu"
              description="Silakan pilih kelas untuk mulai menginput absensi santri."
              icon={<ClipboardCheck className="w-10 h-10 text-slate-300" />}
            />
          ) : muridFiltered.length === 0 ? (
            <EmptyState
              title="Belum ada santri"
              description="Tidak ada santri aktif yang terdaftar di kelas ini."
              icon={<ClipboardCheck className="w-10 h-10 text-slate-300" />}
            />
          ) : (
            <>
              {/* Student rows */}
              <div className="space-y-2">
                {muridFiltered.map((m, i) => {
                  const status = attendance[m.id] ?? 'Hadir';
                  const Icon = STATUS_CONFIG[status].icon;
                  return (
                    <div key={m.id} className="card p-3">
                      {/* Name row */}
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">{i + 1}</span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex-1 min-w-0 truncate">
                          {m.nama}
                        </p>
                        <span className={`badge badge-${status === 'Hadir' ? 'success' : status === 'Izin' || status === 'Telat' ? 'warning' : status === 'Sakit' ? 'info' : 'danger'} text-[10px] flex-shrink-0 flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />
                          {status}
                        </span>
                      </div>

                      {/* Status buttons */}
                      <div className="grid grid-cols-5 gap-1.5">
                        {STATUS_LIST.map(s => {
                          const Ico = STATUS_CONFIG[s].icon;
                          const isActive = status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setAttendance(prev => ({ ...prev, [m.id]: s }))}
                              className={`
                                py-1.5 rounded-xl text-[10px] font-bold border transition-all duration-150
                                flex flex-col items-center justify-center gap-0.5
                                ${isActive
                                  ? `${STATUS_CONFIG[s].active} shadow-sm`
                                  : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }
                              `}
                            >
                              <Ico className="w-3.5 h-3.5" />
                              <span>{s}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => loadData(selectedKelas, tanggal)}
                  className="btn-secondary flex-1 gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={confirmSave}
                  disabled={saving}
                  className="btn-primary flex-1 gap-2"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Menyimpan…' : 'Simpan Absensi'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════
          TAB: REKAPITULASI
      ════════════════════════════════ */}
      {tab === 'rekap' && (
        <div className="animate-slideUp space-y-4">

          {/* ── Filter Card ── */}
          <div className="card p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Kelas</label>
                <select
                  value={selectedKelas}
                  onChange={e => setSelectedKelas(e.target.value)}
                  className="input-field"
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Jenis</label>
                <select
                  value={rekapType}
                  onChange={e => setRekapType(e.target.value as 'bulanan' | 'tahunan')}
                  className="input-field"
                >
                  <option value="bulanan">Bulanan</option>
                  <option value="tahunan">Tahunan</option>
                </select>
              </div>
              {rekapType === 'bulanan' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Bulan</label>
                  <select
                    value={rekapBulan}
                    onChange={e => setRekapBulan(Number(e.target.value))}
                    className="input-field"
                  >
                    {BULAN.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Tahun</label>
                <select
                  value={rekapTahun}
                  onChange={e => setRekapTahun(Number(e.target.value))}
                  className="input-field"
                >
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Export Actions ── */}
          {selectedKelas && muridFiltered.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={exportRekapPDF}
                className="btn-danger flex items-center gap-2 text-sm"
              >
                <FileText className="w-4 h-4" />
                Ekspor PDF
              </button>
              <button
                onClick={shareRekapWA}
                className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 font-semibold text-sm px-4 py-2 rounded-xl transition-all duration-150 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 dark:text-emerald-400"
              >
                <Share2 className="w-4 h-4" />
                Bagikan WA
              </button>
            </div>
          )}

          {/* ── Rekap Content ── */}
          {rekapLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="skeleton w-7 h-7 rounded-lg" />
                    <div className="skeleton h-3.5 w-36 rounded-md" />
                    <div className="skeleton h-5 w-12 rounded-full ml-auto" />
                  </div>
                  <div className="skeleton h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : !selectedKelas ? (
            <EmptyState
              title="Pilih kelas & periode"
              description="Pilih kelas dan periode untuk melihat rekapitulasi kehadiran."
              icon={<Calendar className="w-10 h-10 text-slate-300" />}
            />
          ) : muridFiltered.length === 0 ? (
            <EmptyState
              title="Belum ada santri"
              description="Tidak ada santri yang terdaftar di kelas ini."
              icon={<Calendar className="w-10 h-10 text-slate-300" />}
            />
          ) : (
            <div className="space-y-3">

              {/* ── Class-wide summary card ── */}
              <div className="card p-4 border-emerald-200 dark:border-emerald-700/40"
                   style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="icon-box icon-box-sm icon-box-emerald">
                      <ClipboardCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Kehadiran Kelas</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedKelas} · {muridFiltered.length} santri
                      </p>
                    </div>
                  </div>
                  <span className={`text-3xl font-black ${classAttendancePct >= 80 ? 'text-emerald-600' : classAttendancePct >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {classAttendancePct.toFixed(0)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${classAttendancePct >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : classAttendancePct >= 60 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`}
                    style={{ width: `${classAttendancePct}%` }}
                  />
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  {STATUS_LIST.map(s => {
                    let total = 0;
                    muridFiltered.forEach(m => {
                      const d = rekapData[m.id] ?? { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Telat: 0 };
                      total += d[s];
                    });
                    return (
                      <span key={s} className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[s]}`} />
                        {s}: <strong className="text-slate-700 dark:text-slate-200">{total}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* ── Per-student rows ── */}
              <div className="space-y-2">
                {muridFiltered.map((m, i) => {
                  const d = rekapData[m.id] ?? { Hadir: 0, Izin: 0, Sakit: 0, Alpha: 0, Telat: 0 };
                  const total = d.Hadir + d.Izin + d.Sakit + d.Alpha + d.Telat;
                  const pct = total > 0 ? (d.Hadir / total) * 100 : 0;
                  const pctLabel = pct.toFixed(0);
                  const badgeCls = pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger';

                  return (
                    <div key={m.id} className="card p-3">
                      {/* Header row */}
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px]">{i + 1}</span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex-1 min-w-0 truncate">
                          {m.nama}
                        </p>
                        <span className={`badge ${badgeCls} text-[10px]`}>{pctLabel}%</span>
                      </div>

                      {/* Multi-color progress bar */}
                      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 mb-2">
                        {total > 0 && STATUS_LIST.map(s => {
                          const val = d[s];
                          if (val === 0) return null;
                          return (
                            <div
                              key={s}
                              className={`${STATUS_COLOR[s]} transition-all`}
                              style={{ width: `${(val / total) * 100}%` }}
                              title={`${s}: ${val}`}
                            />
                          );
                        })}
                      </div>

                      {/* Mini stats */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {STATUS_LIST.map(s => (
                          <span key={s} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLOR[s]}`} />
                            {s.charAt(0)}:<strong className="text-slate-700 dark:text-slate-200 font-semibold">{d[s]}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ── Confirm Dialog ── */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleSave}
        title="Simpan Absensi"
        message={`Yakin ingin menyimpan absensi untuk ${muridFiltered.length} santri pada tanggal ${new Date(tanggal).toLocaleDateString('id-ID')}?`}
        confirmText="Ya, Simpan"
        cancelText="Batal"
        variant="warning"
      />
    </div>
  );
}
