import { useState, useEffect, useMemo } from 'react';
import {
  Camera, CheckCircle, Clock, AlertCircle, MapPin, X, Loader2,
  Calendar, Users, BarChart3, TrendingUp, Search, Filter, Image as ImageIcon,
  Navigation, User, BookOpen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import type { Profile, ShowToast, PresensiUstaz, JadwalMengajar } from '../types';

const BULAN_LIST = [
  { val: 1, label: 'Januari' }, { val: 2, label: 'Februari' }, { val: 3, label: 'Maret' },
  { val: 4, label: 'April' }, { val: 5, label: 'Mei' }, { val: 6, label: 'Juni' },
  { val: 7, label: 'Juli' }, { val: 8, label: 'Agustus' }, { val: 9, label: 'September' },
  { val: 10, label: 'Oktober' }, { val: 11, label: 'November' }, { val: 12, label: 'Desember' },
];

const HARI_LIST = ['Semua', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Ahad'];
const STATUS_LIST = ['Semua', 'Hadir', 'Terlambat', 'Belum Presensi'];

type PresensiWithGuru = PresensiUstaz & {
  guru?: Profile;
  jadwal?: JadwalMengajar;
};

export default function PresensiAdminPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [allPresensi, setAllPresensi] = useState<PresensiWithGuru[]>([]);
  const [allGuru, setAllGuru] = useState<Profile[]>([]);
  const [allJadwal, setAllJadwal] = useState<JadwalMengajar[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailItem, setDetailItem] = useState<PresensiWithGuru | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const now = new Date();
  const [filterHari, setFilterHari] = useState('Semua');
  const [filterBulan, setFilterBulan] = useState(now.getMonth() + 1);
  const [filterTahun, setFilterTahun] = useState(now.getFullYear());
  const [filterGuru, setFilterGuru] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [filterKelas, setFilterKelas] = useState('Semua');

  const kelasOptions = useMemo(() => {
    const set = new Set<string>();
    allJadwal.forEach(j => { if (j.kelas) set.add(j.kelas); });
    return ['Semua', ...[...set].sort()];
  }, [allJadwal]);

  useEffect(() => {
    (async () => {
      if (!profile || profile.role !== 'admin') return;
      setLoading(true);
      try {
        const [presensiRes, guruRes, jadwalRes] = await Promise.all([
          supabase.from('presensi_ustaz').select('*').order('jam_server', { ascending: false }),
          supabase.from('profiles').select('*').eq('is_active', true).order('nama_lengkap'),
          supabase.from('jadwal_mengajar').select('*'),
        ]);

        const guruMap = new Map<string, Profile>();
        (guruRes.data ?? []).forEach((g: Profile) => guruMap.set(g.id, g));
        setAllGuru((guruRes.data ?? []) as Profile[]);

        const jadwalMap = new Map<string, JadwalMengajar>();
        (jadwalRes.data ?? []).forEach((j: JadwalMengajar) => jadwalMap.set(j.id, j));
        setAllJadwal((jadwalRes.data ?? []) as JadwalMengajar[]);

        const enriched = (presensiRes.data ?? []).map((p: PresensiUstaz) => ({
          ...p,
          guru: p.guru_id ? guruMap.get(p.guru_id) : undefined,
          jadwal: p.jadwal_id ? jadwalMap.get(p.jadwal_id) : undefined,
        })) as PresensiWithGuru[];

        setAllPresensi(enriched);
      } catch (err) {
        console.error('Error loading admin presensi:', err);
        showToast('Gagal memuat data presensi', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const filteredPresensi = useMemo(() => {
    return allPresensi.filter((p) => {
      const date = new Date(p.jam_server);
      if (date.getMonth() + 1 !== filterBulan) return false;
      if (date.getFullYear() !== filterTahun) return false;

      if (filterHari !== 'Semua') {
        const hari = date.toLocaleDateString('id-ID', { weekday: 'long' });
        if (hari !== filterHari) return false;
      }
   
      if (filterGuru !== 'Semua' && p.guru_id !== filterGuru) return false;
      if (filterStatus !== 'Semua' && p.status !== filterStatus) return false;
      if (filterKelas !== 'Semua' && p.jadwal?.kelas !== filterKelas) return false;
      return true;
    });
  }, [allPresensi, filterHari, filterBulan, filterTahun, filterGuru, filterStatus, filterKelas]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayPresensi = allPresensi.filter(p => p.tanggal === today);
    const hadir = todayPresensi.filter(p => p.status === 'Hadir').length;
    const terlambat = todayPresensi.filter(p => p.status === 'Terlambat').length;
    const totalGuru = allGuru.length;
    const sudahPresensi = new Set(todayPresensi.map(p => p.guru_id)).size;
    const belumPresensi = totalGuru - sudahPresensi;
    const persentase = totalGuru > 0 ? Math.round((sudahPresensi / totalGuru) * 100) : 0;

    return { hadir, terlambat, belumPresensi, totalGuru, sudahPresensi, persentase, totalToday: todayPresensi.length };
  }, [allPresensi, allGuru]);

  const weeklyData = useMemo(() => {
    const days: { label: string; hadir: number; terlambat: number }[] = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayPresensi = allPresensi.filter(p => p.tanggal === dateStr);
      
      days.push({
        label: dayNames[d.getDay()],
        hadir: dayPresensi.filter(p => p.status === 'Hadir').length,
        terlambat: dayPresensi.filter(p => p.status === 'Terlambat').length,
      });
    }
    return days;
  }, [allPresensi]);

  const monthlyData = useMemo(() => {
    const months: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthPresensi = allPresensi.filter(p => {
        const pd = new Date(p.jam_server);
        return pd.getMonth() + 1 === m && pd.getFullYear() === y;
      });
      months.push({
        label: BULAN_LIST[m - 1].label.substring(0, 3),
        total: monthPresensi.length,
      });
    }
    return months;
  }, [allPresensi]);

  const maxWeekly = Math.max(...weeklyData.map(d => d.hadir + d.terlambat), 1);
  const maxMonthly = Math.max(...monthlyData.map(d => d.total), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <EmptyState
        title="Akses Ditolak"
        description="Halaman ini hanya untuk admin"
        icon={<AlertCircle className="w-8 h-8 text-rose-300" />}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-5 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Dashboard Presensi Ustaz</h2>
            <p className="text-slate-300 text-xs">Pantau kehadiran guru mengajar</p>
          </div>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] md:text-xs text-slate-400 font-medium truncate">Hari Ini</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-slate-800">{stats.totalToday}</p>
          <p className="text-[10px] md:text-xs text-slate-400 truncate">Total presensi</p>
        </div>

        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600" />
            </div>
            <span className="text-[10px] md:text-xs text-slate-400 font-medium truncate">Hadir</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-emerald-600">{stats.hadir}</p>
          <p className="text-[10px] md:text-xs text-slate-400 truncate">Tepat waktu</p>
        </div>

        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-600" />
            </div>
            <span className="text-[10px] md:text-xs text-slate-400 font-medium truncate">Terlambat</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-amber-600">{stats.terlambat}</p>
          <p className="text-[10px] md:text-xs text-slate-400 truncate">Terlambat hadir</p>
        </div>

        <div className="card p-3 md:p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-rose-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-rose-600" />
            </div>
            <span className="text-[10px] md:text-xs text-slate-400 font-medium truncate">Belum</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-rose-600">{stats.belumPresensi}</p>
          <p className="text-[10px] md:text-xs text-slate-400 truncate">Belum presensi</p>
        </div>
      </div>

      {/* Percentage Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-xs md:text-sm font-bold text-slate-700 truncate">Persentase Kehadiran</span>
          </div>
          <span className="text-base md:text-lg font-bold text-emerald-600 flex-shrink-0">{stats.persentase}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${stats.persentase}%` }}
          />
        </div>
        <p className="text-[10px] md:text-xs text-slate-400 mt-2">
           {stats.sudahPresensi} dari {stats.totalGuru} guru sudah presensi
        </p>
      </div>

      {/* Weekly Chart */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-600" />
          Grafik Kehadiran Mingguan
        </h3>
        <div className="flex items-end justify-between gap-1 md:gap-2 h-32">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end h-24 gap-0.5">
                <div
                  className="w-full max-w-[24px] bg-amber-400 rounded-t-md transition-all duration-500"
                  style={{ height: `${(d.terlambat / maxWeekly) * 100}%`, minHeight: d.terlambat > 0 ? '4px' : '0' }}
                  title={`Terlambat: ${d.terlambat}`}
                />
                <div
                  className="w-full max-w-[24px] bg-emerald-500 rounded-t-md transition-all duration-500"
                  style={{ height: `${(d.hadir / maxWeekly) * 100}%`, minHeight: d.hadir > 0 ? '4px' : '0' }}
                  title={`Hadir: ${d.hadir}`}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-[10px] md:text-xs text-slate-500">Hadir</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-400 rounded" />
            <span className="text-[10px] md:text-xs text-slate-500">Terlambat</span>
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="card p-4">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Grafik Bulanan
        </h3>
        <div className="flex items-end justify-between gap-1 md:gap-2 h-32">
          {monthlyData.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col items-center justify-end h-24">
                <span className="text-[10px] font-bold text-slate-600 mb-0.5">{d.total}</span>
                <div
                  className="w-full max-w-[28px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-500"
                  style={{ height: `${(d.total / maxMonthly) * 100}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            Riwayat Presensi
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="text-xs text-emerald-600 font-semibold"
          >
            {showFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Hari</label>
              <select
                value={filterHari}
                onChange={e => setFilterHari(e.target.value)}
                className="input-field text-xs py-2"
              >
                {HARI_LIST.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Bulan</label>
              <select
                value={filterBulan}
                onChange={e => setFilterBulan(Number(e.target.value))}
                className="input-field text-xs py-2"
              >
                {BULAN_LIST.map(b => <option key={b.val} value={b.val}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tahun</label>
              <select
                value={filterTahun}
                onChange={e => setFilterTahun(Number(e.target.value))}
                className="input-field text-xs py-2"
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Guru</label>
              <select
                value={filterGuru}
                onChange={e => setFilterGuru(e.target.value)}
                className="input-field text-xs py-2"
              >
                <option value="Semua">Semua Guru</option>
                {allGuru.map(g => (
                  <option key={g.id} value={g.id}>{g.nama_lengkap || g.nama_panggilan || 'Unknown'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="input-field text-xs py-2"
              >
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Kelas</label>
              <select
                value={filterKelas}
                onChange={e => setFilterKelas(e.target.value)}
                className="input-field text-xs py-2"
              >
                {kelasOptions.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Presensi List */}
        {filteredPresensi.length === 0 ? (
          <EmptyState
            title="Tidak ada data presensi"
            description="Tidak ada data yang sesuai dengan filter"
            icon={<Search className="w-8 h-8 text-slate-300" />}
          />
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredPresensi.map((p) => (
              <button
                key={p.id}
                onClick={() => setDetailItem(p)}
                className="card card-hover p-3 w-full text-left flex items-center gap-3"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  p.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600' :
                  p.status === 'Terlambat' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-50 text-slate-400'
                }`}>
                 {p.status === 'Hadir' ? <CheckCircle className="w-5 h-5" /> :
                   p.status === 'Terlambat' ? <Clock className="w-5 h-5" /> :
                   <AlertCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {p.guru?.nama_lengkap || p.guru?.nama_panggilan || 'Unknown Guru'}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {p.jadwal?.pelajaran || '-'} - Kelas {p.jadwal?.kelas || '-'}
                  </p>
                  <p className="text-[10px] md:text-xs text-slate-400">
                    {new Date(p.jam_server).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(p.jam_server).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {p.photo_url && !p.photo_expired && (
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center hidden sm:flex">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <span className={`badge ${
                    p.status === 'Hadir' ? 'badge-success' :
                    p.status === 'Terlambat' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        title="Detail Presensi"
        size="lg"
      >
        {detailItem && (
          <div className="space-y-4">
            {/* Photo */}
            {detailItem.photo_url && !detailItem.photo_expired ? (
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <img src={detailItem.photo_url} alt="Presensi" className="w-full" />
              </div>
            ) : detailItem.photo_expired ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Foto telah kedaluwarsa (dihapus otomatis setelah 24 jam)</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Tidak ada foto</p>
              </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-400">Guru</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {detailItem.guru?.nama_lengkap || detailItem.guru?.nama_panggilan || 'Unknown'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-400">Mata Pelajaran</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {detailItem.jadwal?.pelajaran || '-'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-400">Kelas</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {detailItem.jadwal?.kelas || '-'}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-slate-400">Jam Presensi</span>
                </div>
                <p className="text-sm font-semibold text-slate-800">
                  {new Date(detailItem.jam_server).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <span className={`badge ${
                detailItem.status === 'Hadir' ? 'badge-success' :
                detailItem.status === 'Terlambat' ? 'badge-warning' :
                'badge-danger'
              }`}>
                {detailItem.status}
              </span>
            </div>

            {/* GPS Info */}
            {detailItem.latitude != null && detailItem.longitude != null && (
              <div className="bg-emerald-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-700">Lokasi GPS</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Latitude: </span>
                    <span className="font-semibold text-slate-700">{detailItem.latitude.toFixed(6)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Longitude: </span>
                    <span className="font-semibold text-slate-700">{detailItem.longitude.toFixed(6)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Akurasi GPS: </span>
                    <span className="font-semibold text-slate-700">{detailItem.akurasi_gps?.toFixed(1) || '-'} meter</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${detailItem.latitude},${detailItem.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary text-xs px-4 py-2 flex items-center justify-center gap-2 w-full mt-2"
                >
                  <Navigation className="w-4 h-4" />
                  Lihat Lokasi di Google Maps
                </a>
              </div>
            )}

            {/* Date Info */}
            <div className="text-xs text-slate-400 text-center">
              Tanggal: {new Date(detailItem.jam_server).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
