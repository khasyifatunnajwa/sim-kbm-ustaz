import { useState, useEffect } from 'react';
import {
  Users, GraduationCap, AlertTriangle, UserCheck, BookOpen, Calendar,
  Megaphone, CalendarDays, Building2, FileText, Shield,
  ChevronRight, LayoutDashboard, CheckCircle,
  School, Layers, Award, ArrowRight,
  Clock, XCircle, Heart, Activity,
  BookUser, TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { namaHari } from '../../lib/utils';
import type { Profile, DashboardPresensiUstaz, PresensiMuridByKelas, KelasKosong } from '../../types';

export type AdminSectionId =
  | 'dashboard' | 'kelola-user' | 'data-master' | 'jadwal' | 'akademik'
  | 'presensi' | 'penilaian' | 'data-murid' | 'pengumuman' | 'laporan'
  | 'rapor-ustaz' | 'rapor-murid' | 'pengaturan-sistem' | 'statistik';

interface Props {
  onViewChange: (section: AdminSectionId) => void;
  profile: Profile | null;
}

interface MonitoringData {
  ustazHadir: number;
  ustazTerlambat: number;
  ustazBelumPresensi: number;
  ustazIzin: number;
  ustazSakit: number;
  ustazAlfa: number;
  kelasKosong: number;
  guruPengganti: number;
  kbmSelesai: number;
  kbmBelumDimulai: number;
  muridHadir: number;
  muridTotal: number;
}

interface SummaryData {
  jumlahUstaz: number;
  jumlahMurid: number;
  jumlahKelas: number;
  jumlahRuang: number;
  jumlahLembaga: number;
  jumlahMapel: number;
  tahunAjaranAktif: string;
  semesterAktif: string;
}

export default function AdminDashboard({ onViewChange, profile }: Props) {
  const [loading, setLoading] = useState(true);
  const [presensiUstaz, setPresensiUstaz] = useState<DashboardPresensiUstaz | null>(null);
  const [kelasKosong, setKelasKosong] = useState<KelasKosong[]>([]);
  const [presensiMurid, setPresensiMurid] = useState<PresensiMuridByKelas[]>([]);
  const [summary, setSummary] = useState<SummaryData>({ jumlahUstaz: 0, jumlahMurid: 0, jumlahKelas: 0, jumlahRuang: 0, jumlahLembaga: 0, jumlahMapel: 0, tahunAjaranAktif: '-', semesterAktif: '-' });
  const [monitoring, setMonitoring] = useState<MonitoringData>({ ustazHadir: 0, ustazTerlambat: 0, ustazBelumPresensi: 0, ustazIzin: 0, ustazSakit: 0, ustazAlfa: 0, kelasKosong: 0, guruPengganti: 0, kbmSelesai: 0, kbmBelumDimulai: 0, muridHadir: 0, muridTotal: 0 });
  const [guruPenggantiCount, setGuruPenggantiCount] = useState(0);
  const [kbmSelesai, setKbmSelesai] = useState(0);
  const [kbmBelum, setKbmBelum] = useState(0);
  const [pengumumanCount, setPengumumanCount] = useState(0);
  const [agendaCount, setAgendaCount] = useState(0);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayName = namaHari[new Date().getDay()];

      const [ustazRes, muridRes, profilesRes, muridRes2, kelasRes, ruangRes, lembagaRes, mapelRes, tahunRes, semesterRes, pengumumanRes, agendaRes] = await Promise.all([
        supabase.from('v_dashboard_presensi_ustaz_hari_ini').select('*').maybeSingle(),
        supabase.from('v_presensi_murid_by_kelas_hari_ini').select('*'),
        supabase.from('profiles').select('id').eq('is_active', true).in('role', ['ustaz', 'operator']),
        supabase.from('murid').select('id').eq('status_aktif', true),
        supabase.from('kelas').select('id').eq('is_active', true),
        supabase.from('ruangan').select('id').eq('is_active', true),
        supabase.from('lembaga').select('id'),
        supabase.from('mata_pelajaran').select('id').eq('is_active', true),
        supabase.from('tahun_ajaran').select('nama').eq('aktif', true).maybeSingle(),
        supabase.from('semester').select('nama').eq('aktif', true).maybeSingle(),
        supabase.from('pengumuman').select('id').gte('tanggal', today).limit(10),
        supabase.from('agenda_penting').select('id').gte('tanggal', today).limit(10),
      ]);

      if (ustazRes.data) setPresensiUstaz(ustazRes.data as DashboardPresensiUstaz);
      if (muridRes.data) setPresensiMurid(muridRes.data as PresensiMuridByKelas[]);

      setSummary({
        jumlahUstaz: profilesRes.data?.length || 0,
        jumlahMurid: muridRes2.data?.length || 0,
        jumlahKelas: kelasRes.data?.length || 0,
        jumlahRuang: ruangRes.data?.length || 0,
        jumlahLembaga: lembagaRes.data?.length || 0,
        jumlahMapel: mapelRes.data?.length || 0,
        tahunAjaranAktif: tahunRes.data?.nama || '-',
        semesterAktif: semesterRes.data?.nama || '-',
      });

      setPengumumanCount(pengumumanRes.data?.length || 0);
      setAgendaCount(agendaRes.data?.length || 0);

      // Fetch jadwal today for kelas kosong & kbm stats
      const { data: jadwalData } = await supabase.from('jadwal_mengajar').select('id, user_id, kelas, pelajaran, jam_mulai').eq('hari', dayName);

      if (jadwalData && jadwalData.length > 0) {
        const { data: presensiData } = await supabase.from('presensi_ustaz').select('guru_id').eq('tanggal', today);
        const sudahPresensiIds = new Set((presensiData || []).map(p => p.guru_id));

        const { data: izinData } = await supabase.from('izin_mengajar').select('user_id, jenis_izin').eq('status', 'disetujui').lte('tanggal_mulai', today).gte('tanggal_selesai', today);
        const izinIds = new Set((izinData || []).map(i => i.user_id));
        const izinSakitIds = new Set((izinData || []).filter(i => i.jenis_izin?.toLowerCase().includes('sakit')).map(i => i.user_id));

        const { data: profilesData } = await supabase.from('profiles').select('id, nama_lengkap');

        const profilesMap = new Map((profilesData || []).map(p => [p.id, p.nama_lengkap]));

        const kelasKosongList: KelasKosong[] = jadwalData
          .filter(j => !sudahPresensiIds.has(j.user_id) && !izinIds.has(j.user_id))
          .map(j => ({
            jadwal_id: j.id, nama_kelas: j.kelas || '-', nama_mapel: j.pelajaran || '-',
            nama_guru: profilesMap.get(j.user_id) || '-', jam_mulai: j.jam_mulai || '-', jam_selesai: '-', guru_id: j.user_id, lama_belum_presensi: '-'
          }));
        setKelasKosong(kelasKosongList);

        // Guru pengganti count
        const { data: penggantiData } = await supabase.from('guru_pengganti').select('id').gte('tanggal', today);
        setGuruPenggantiCount(penggantiData?.length || 0);

        // KBM stats
        const { data: kbmData } = await supabase.from('jurnal_kbm').select('id, selesai').eq('tanggal', today);
        setKbmSelesai(kbmData?.filter(k => k.selesai).length || 0);
        setKbmBelum(kbmData?.filter(k => !k.selesai).length || 0);

        setMonitoring({
          ustazHadir: ustazRes.data?.hadir || 0,
          ustazTerlambat: ustazRes.data?.terlambat || 0,
          ustazBelumPresensi: (ustazRes.data?.total_guru || 0) - (ustazRes.data?.hadir || 0) - (ustazRes.data?.terlambat || 0),
          ustazIzin: izinIds.size - izinSakitIds.size,
          ustazSakit: izinSakitIds.size,
          ustazAlfa: kelasKosongList.length,
          kelasKosong: kelasKosongList.length,
          guruPengganti: penggantiData?.length || 0,
          kbmSelesai: kbmData?.filter(k => k.selesai).length || 0,
          kbmBelumDimulai: (jadwalData.length) - (kbmData?.filter(k => k.selesai).length || 0),
          muridHadir: presensiMurid.reduce((s, k) => s + (k.hadir || 0), 0),
          muridTotal: presensiMurid.reduce((s, k) => s + (k.total_murid || 0), 0),
        });
      } else {
        setKelasKosong([]);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // ===== Row 1: Monitoring cards (4 cards) =====
  const row1Cards = [
    { label: 'Presensi Ustaz', value: presensiUstaz ? `${(presensiUstaz.hadir || 0) + (presensiUstaz.terlambat || 0)}/${presensiUstaz.total_guru || 0}` : '0/0', sub: `${presensiUstaz?.terlambat || 0} terlambat`, icon: Users, color: 'emerald', section: 'presensi' as AdminSectionId },
    { label: 'Presensi Murid', value: `${monitoring.muridHadir}/${monitoring.muridTotal}`, sub: monitoring.muridTotal > 0 ? `${Math.round((monitoring.muridHadir / monitoring.muridTotal) * 100)}% hadir` : '0%', icon: GraduationCap, color: 'sky', section: 'presensi' as AdminSectionId },
    { label: 'Kelas Kosong', value: kelasKosong.length, sub: kelasKosong.length > 0 ? 'perlu perhatian' : 'aman', icon: AlertTriangle, color: kelasKosong.length > 0 ? 'rose' : 'emerald', section: 'presensi' as AdminSectionId },
    { label: 'Guru Pengganti', value: guruPenggantiCount, sub: guruPenggantiCount > 0 ? 'aktif hari ini' : 'tidak ada', icon: UserCheck, color: 'violet', section: 'presensi' as AdminSectionId },
  ];

  // ===== Row 2: Activity cards (4 cards) =====
  const row2Cards = [
    { label: 'KBM Hari Ini', value: `${kbmSelesai}/${kbmSelesai + kbmBelum}`, sub: `${kbmSelesai} selesai`, icon: BookOpen, color: 'amber', section: 'akademik' as AdminSectionId },
    { label: 'Jadwal Hari Ini', value: monitoring.ustazHadir + monitoring.ustazTerlambat + monitoring.ustazBelumPresensi, sub: 'sesi mengajar', icon: Calendar, color: 'emerald', section: 'jadwal' as AdminSectionId },
    { label: 'Pengumuman', value: pengumumanCount, sub: 'hari ini', icon: Megaphone, color: 'rose', section: 'pengumuman' as AdminSectionId },
    { label: 'Agenda', value: agendaCount, sub: 'mendatang', icon: CalendarDays, color: 'sky', section: 'pengumuman' as AdminSectionId },
  ];

  // ===== Row 3: Summary stats (4 cards) =====
  const row3Cards = [
    { label: 'Jumlah Ustaz', value: summary.jumlahUstaz, icon: Users, color: 'emerald' },
    { label: 'Jumlah Murid', value: summary.jumlahMurid, icon: GraduationCap, color: 'sky' },
    { label: 'Jumlah Kelas', value: summary.jumlahKelas, icon: School, color: 'amber' },
    { label: 'Jumlah Mapel', value: summary.jumlahMapel, icon: BookOpen, color: 'violet' },
  ];

  // ===== Row 4: Shortcut cards (8 cards) =====
  const shortcutCards = [
    { label: 'Kelola User', icon: Users, color: 'emerald', section: 'kelola-user' as AdminSectionId },
    { label: 'Data Master', icon: Building2, color: 'sky', section: 'data-master' as AdminSectionId },
    { label: 'Jadwal', icon: Calendar, color: 'amber', section: 'jadwal' as AdminSectionId },
    { label: 'Presensi', icon: CheckCircle, color: 'emerald', section: 'presensi' as AdminSectionId },
    { label: 'Nilai', icon: Award, color: 'violet', section: 'penilaian' as AdminSectionId },
    { label: 'Laporan', icon: FileText, color: 'rose', section: 'laporan' as AdminSectionId },
    { label: 'Rapor Ustaz', icon: BookUser, color: 'emerald', section: 'rapor-ustaz' as AdminSectionId },
    { label: 'Rapor Murid', icon: GraduationCap, color: 'sky', section: 'rapor-murid' as AdminSectionId },
    { label: 'Statistik', icon: TrendingUp, color: 'violet', section: 'statistik' as AdminSectionId },
    { label: 'Pengaturan', icon: Shield, color: 'slate', section: 'pengaturan-sistem' as AdminSectionId },
    { label: 'Pengumuman', icon: Megaphone, color: 'amber', section: 'pengumuman' as AdminSectionId },
  ];

  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' },
    sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400', iconBg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400' },
    rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400' },
    violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400' },
    slate: { bg: 'bg-slate-100 dark:bg-slate-700/40', text: 'text-slate-600 dark:text-slate-300', iconBg: 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300' },
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 md:p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base md:text-lg font-bold truncate">Dashboard Admin</h2>
            <p className="text-slate-300 text-xs truncate">Halo, {profile?.nama_panggilan || profile?.nama_lengkap?.split(' ')[0] || 'Admin'} • {summary.tahunAjaranAktif} • {summary.semesterAktif}</p>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
              <p className="text-[9px] text-slate-300 uppercase">Ustaz</p>
              <p className="text-sm font-bold">{summary.jumlahUstaz}</p>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-1.5 text-center">
              <p className="text-[9px] text-slate-300 uppercase">Murid</p>
              <p className="text-sm font-bold">{summary.jumlahMurid}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Row 1: Monitoring */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Monitoring Hari Ini</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {row1Cards.map((card, i) => {
                const Icon = card.icon;
                const c = colorMap[card.color];
                return (
                  <button key={i} onClick={() => onViewChange(card.section)} className={`card p-3 text-left hover:shadow-md transition-all group ${c.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{card.value}</p>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{card.label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{card.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 2: Activity */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Aktivitas Hari Ini</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {row2Cards.map((card, i) => {
                const Icon = card.icon;
                const c = colorMap[card.color];
                return (
                  <button key={i} onClick={() => onViewChange(card.section)} className={`card p-3 text-left hover:shadow-md transition-all group ${c.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{card.value}</p>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{card.label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{card.sub}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Summary Stats */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Ringkasan Data</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {row3Cards.map((card, i) => {
                const Icon = card.icon;
                const c = colorMap[card.color];
                return (
                  <div key={i} className={`card p-3 ${c.bg}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{card.label}</span>
                    </div>
                    <p className={`text-2xl font-bold ${c.text}`}>{card.value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra summary: Ruang, Lembaga, Tahun, Semester */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {[
              { label: 'Jumlah Ruang', value: summary.jumlahRuang, icon: Building2, color: 'slate' },
              { label: 'Jumlah Lembaga', value: summary.jumlahLembaga, icon: Layers, color: 'emerald' },
              { label: 'Tahun Ajaran', value: summary.tahunAjaranAktif, icon: Calendar, color: 'amber', isText: true },
              { label: 'Semester', value: summary.semesterAktif, icon: BookOpen, color: 'violet', isText: true },
            ].map((item, i) => {
              const Icon = item.icon;
              const c = colorMap[item.color];
              return (
                <div key={i} className={`card p-3 ${c.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${c.iconBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{item.label}</span>
                  </div>
                  <p className={`font-bold ${c.text} ${item.isText ? 'text-sm' : 'text-2xl'}`}>{item.value}</p>
                </div>
              );
            })}
          </div>

          {/* Row 4: Shortcuts */}
          <div>
            <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Menu Cepat</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {shortcutCards.map((card, i) => {
                const Icon = card.icon;
                const c = colorMap[card.color];
                return (
                  <button key={i} onClick={() => onViewChange(card.section)} className={`card p-3 flex items-center gap-3 hover:shadow-md transition-all group ${c.bg}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{card.label}</p>
                      <p className="text-[9px] text-slate-400">Klik untuk buka</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presensi Ustaz Detail Breakdown */}
          {presensiUstaz && (presensiUstaz.hadir > 0 || presensiUstaz.terlambat > 0 || monitoring.ustazBelumPresensi > 0 || monitoring.ustazIzin > 0 || monitoring.ustazSakit > 0 || monitoring.ustazAlfa > 0) && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Presensi Ustaz Hari Ini</span>
                </div>
                <button onClick={() => onViewChange('presensi')} className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5 hover:gap-1 transition-all">
                  Detail <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { label: 'Hadir', val: presensiUstaz.hadir || 0, color: 'emerald', icon: CheckCircle },
                  { label: 'Terlambat', val: presensiUstaz.terlambat || 0, color: 'amber', icon: Clock },
                  { label: 'Belum Presensi', val: monitoring.ustazBelumPresensi, color: 'slate', icon: AlertTriangle },
                  { label: 'Izin', val: monitoring.ustazIzin, color: 'sky', icon: FileText },
                  { label: 'Sakit', val: monitoring.ustazSakit, color: 'violet', icon: Heart },
                  { label: 'Alfa', val: monitoring.ustazAlfa, color: 'rose', icon: XCircle },
                ].map((s, i) => {
                  const Icon = s.icon;
                  const c = colorMap[s.color] || colorMap.slate;
                  return (
                    <button key={i} onClick={() => onViewChange('presensi')} className={`rounded-xl p-2.5 text-center transition-all hover:shadow-sm ${c.bg}`}>
                      <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${c.text}`} />
                      <p className={`text-lg font-bold ${c.text}`}>{s.val}</p>
                      <p className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">{s.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Presensi Murid Detail Breakdown */}
          {presensiMurid.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Presensi Murid Hari Ini</span>
                </div>
                <button onClick={() => onViewChange('presensi')} className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-0.5 hover:gap-1 transition-all">
                  Detail <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {(() => {
                const totals = presensiMurid.reduce((acc, k) => ({
                  total: acc.total + (k.total_murid || 0),
                  hadir: acc.hadir + (k.hadir || 0),
                  telat: acc.telat + ((k as any).telat || 0),
                  izin: acc.izin + (k.izin || 0),
                  sakit: acc.sakit + (k.sakit || 0),
                  alfa: acc.alfa + (k.alfa || 0),
                  belum: acc.belum + ((k as any).belum_hadir || 0),
                }), { total: 0, hadir: 0, telat: 0, izin: 0, sakit: 0, alfa: 0, belum: 0 });
                return (
                  <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                    {[
                      { label: 'Total', val: totals.total, color: 'slate', icon: Users },
                      { label: 'Hadir', val: totals.hadir, color: 'emerald', icon: CheckCircle },
                      { label: 'Telat', val: totals.telat, color: 'amber', icon: Clock },
                      { label: 'Belum', val: totals.belum, color: 'slate', icon: AlertTriangle },
                      { label: 'Izin', val: totals.izin, color: 'sky', icon: FileText },
                      { label: 'Sakit', val: totals.sakit, color: 'violet', icon: Heart },
                      { label: 'Alfa', val: totals.alfa, color: 'rose', icon: XCircle },
                    ].map((s, i) => {
                      const Icon = s.icon;
                      const c = colorMap[s.color] || colorMap.slate;
                      return (
                        <button key={i} onClick={() => onViewChange('presensi')} className={`rounded-xl p-2.5 text-center transition-all hover:shadow-sm ${c.bg}`}>
                          <Icon className={`w-3.5 h-3.5 mx-auto mb-1 ${c.text}`} />
                          <p className={`text-lg font-bold ${c.text}`}>{s.val}</p>
                          <p className="text-[9px] font-semibold text-slate-600 dark:text-slate-300">{s.label}</p>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {/* Per-class breakdown */}
              <div className="mt-3 space-y-1.5">
                {presensiMurid.slice(0, 5).map((k, i) => (
                  <button key={i} onClick={() => onViewChange('presensi')} className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1 text-left truncate">{k.nama_kelas}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{k.hadir || 0}</span>
                    <span className="text-[10px] text-slate-400">/</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{k.total_murid || 0}</span>
                    <Activity className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
                {presensiMurid.length > 5 && (
                  <button onClick={() => onViewChange('presensi')} className="text-[10px] text-sky-600 dark:text-sky-400 font-medium hover:underline">
                    +{presensiMurid.length - 5} kelas lainnya
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Kelas Kosong Alert */}
          {kelasKosong.length > 0 && (
            <div className="card p-3 border-l-2 border-l-rose-500">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Perhatian: Kelas Kosong ({kelasKosong.length})</span>
              </div>
              <div className="space-y-1">
                {kelasKosong.slice(0, 4).map((k, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded">
                    <span className="text-rose-600 dark:text-rose-400 font-medium w-12">{k.jam_mulai?.slice(0, 5) || '-'}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{k.nama_kelas}</span>
                    <span className="text-slate-500 dark:text-slate-400 truncate">{k.nama_guru}</span>
                  </div>
                ))}
                {kelasKosong.length > 4 && (
                  <button onClick={() => onViewChange('presensi')} className="text-[10px] text-rose-600 dark:text-rose-400 font-medium hover:underline">
                    +{kelasKosong.length - 4} kelas lainnya
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
