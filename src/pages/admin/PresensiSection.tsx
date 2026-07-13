import { useState, useEffect, useMemo } from 'react';
import {
  Users, GraduationCap, CheckCircle, Clock, UserX, FileText,
  ChevronUp, ChevronDown, User, MapPin, Calendar, Building2,
  Search, Plus, Repeat, History,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EmptyState from '../../components/EmptyState';
import SearchableSelect from '../../components/SearchableSelect';
import { useLembaga } from '../../hooks/useLembaga';
import type { ShowToast, PresensiMuridByKelas } from '../../types';

type PresensiTab = 'ustaz' | 'murid' | 'guru-pengganti';
type UstazSubTab = 'presensi-ustaz' | 'jadwal-ustaz';

type UstazDetailRow = {
  guru_id: string;
  nama_lengkap: string;
  nama_panggilan: string;
  foto?: string;
  jam_presensi?: string;
  status: 'Hadir' | 'Terlambat' | 'Belum Presensi' | 'Izin' | 'Sakit' | 'Alfa';
  kelas?: string;
  lembaga?: string;
  lokasi?: string;
  foto_presensi?: string;
  telat_menit?: number;
};

type JadwalUstazRow = {
  id: string;
  user_id: string;
  nama_ustaz: string;
  kelas: string;
  pelajaran: string;
  jam_mulai: string;
  jam_selesai?: string;
  ruangan?: string;
  lembaga?: string;
  nama_pengganti?: string;
  status: 'Mengajar' | 'Izin' | 'Belum Presensi';
};

export default function PresensiSection({ showToast }: { showToast: ShowToast }) {
  const [presensiTab, setPresensiTab] = useState<PresensiTab>('ustaz');
  const [ustazSubTab, setUstazSubTab] = useState<UstazSubTab>('presensi-ustaz');

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Presensi</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Pantau kehadiran ustaz, murid, dan guru pengganti</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setPresensiTab('ustaz')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${presensiTab === 'ustaz' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <Users className="w-4 h-4" /> Ustaz
        </button>
        <button onClick={() => setPresensiTab('murid')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${presensiTab === 'murid' ? 'bg-sky-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <GraduationCap className="w-4 h-4" /> Murid
        </button>
        <button onClick={() => setPresensiTab('guru-pengganti')} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${presensiTab === 'guru-pengganti' ? 'bg-violet-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
          <Repeat className="w-4 h-4" /> Pengganti
        </button>
      </div>

      {presensiTab === 'ustaz' && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setUstazSubTab('presensi-ustaz')} className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${ustazSubTab === 'presensi-ustaz' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
              <CheckCircle className="w-3.5 h-3.5" /> Presensi Ustaz
            </button>
            <button onClick={() => setUstazSubTab('jadwal-ustaz')} className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-[11px] font-semibold transition-all ${ustazSubTab === 'jadwal-ustaz' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
              <Calendar className="w-3.5 h-3.5" /> Jadwal Hari Ini
            </button>
          </div>
          {ustazSubTab === 'presensi-ustaz' ? (
            <PresensiUstazDetail showToast={showToast} />
          ) : (
            <JadwalUstazHariIni showToast={showToast} />
          )}
        </>
      )}

      {presensiTab === 'murid' && <PresensiMurid showToast={showToast} />}

      {presensiTab === 'guru-pengganti' && <GuruPengganti showToast={showToast} />}
    </div>
  );
}

// ====== Presensi Ustaz Detail (6 expandable categories) ======
function PresensiUstazDetail({ showToast }: { showToast: ShowToast }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<UstazDetailRow[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });

      const [profilesRes, presensiRes, jadwalRes, izinRes, lembagaRes] = await Promise.all([
        supabase.from('profiles').select('id, nama_lengkap, nama_panggilan, foto').in('role', ['ustaz', 'operator']).eq('is_active', true).order('nama_lengkap'),
        supabase.from('presensi_guru').select('id, user_id, tanggal, jam_masuk, lokasi, foto_url, telat_menit, lembaga_id').eq('tanggal', today),
        supabase.from('jadwal_mengajar').select('id, user_id, kelas, pelajaran, jam_mulai, jam_selesai, lembaga_id, guru_pengganti_id').eq('hari', dayName),
        supabase.from('izin_mengajar').select('id, user_id, nama_ustaz, jenis_izin, tanggal_mulai, tanggal_selesai, status, kelas, mata_pelajaran').eq('status', 'disetujui').lte('tanggal_mulai', today).gte('tanggal_selesai', today),
        supabase.from('lembaga').select('id, nama_lembaga'),
      ]);

      const lembagaMap = new Map((lembagaRes.data || []).map(l => [l.id, l.nama_lembaga]));
      const presensiMap = new Map((presensiRes.data || []).map(p => [p.user_id, p]));
      const izinMap = new Map((izinRes.data || []).map(i => [i.user_id, i]));
      const jadwalByUser = new Map<string, any[]>();
      (jadwalRes.data || []).forEach(j => {
        const arr = jadwalByUser.get(j.user_id) || [];
        arr.push(j);
        jadwalByUser.set(j.user_id, arr);
      });

      const detailRows: UstazDetailRow[] = (profilesRes.data || []).map(p => {
        const pres = presensiMap.get(p.id);
        const izin = izinMap.get(p.id);
        const jadwalList = jadwalByUser.get(p.id) || [];
        const firstJadwal = jadwalList[0];

        let status: UstazDetailRow['status'] = 'Belum Presensi';
        let jam_presensi: string | undefined;
        let telat_menit: number | undefined;

        if (izin) {
          const jenis = (izin.jenis_izin || '').toLowerCase();
          status = jenis.includes('sakit') ? 'Sakit' : 'Izin';
        } else if (pres) {
          jam_presensi = pres.jam_masuk || undefined;
          if (firstJadwal?.jam_mulai && pres.jam_masuk) {
            const [jh, jm] = firstJadwal.jam_mulai.split(':').map(Number);
            const [ph, pm] = pres.jam_masuk.split(':').map(Number);
            const diff = (ph * 60 + pm) - (jh * 60 + jm);
            telat_menit = diff > 0 ? diff : 0;
            status = diff > 10 ? 'Terlambat' : 'Hadir';
          } else {
            if (pres.telat_menit && pres.telat_menit > 10) { status = 'Terlambat'; telat_menit = pres.telat_menit; }
            else status = 'Hadir';
          }
        } else if (jadwalList.length > 0) {
          status = 'Belum Presensi';
        } else {
          return null;
        }

        return {
          guru_id: p.id, nama_lengkap: p.nama_lengkap || '-', nama_panggilan: p.nama_panggilan || '',
          foto: p.foto || '', jam_presensi, status,
          kelas: firstJadwal?.kelas || izin?.kelas || '-',
          lembaga: firstJadwal?.lembaga_id ? (lembagaMap.get(firstJadwal.lembaga_id) || '-') : (pres?.lembaga_id ? (lembagaMap.get(pres.lembaga_id) || '-') : '-'),
          lokasi: pres?.lokasi || '', foto_presensi: pres?.foto_url || '', telat_menit,
        };
      }).filter(Boolean) as UstazDetailRow[];

      setRows(detailRows);
    } catch (err: any) {
      showToast('Gagal memuat detail presensi: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { key: 'Hadir', label: 'Hadir', color: 'emerald', icon: CheckCircle },
    { key: 'Terlambat', label: 'Terlambat', color: 'amber', icon: Clock },
    { key: 'Belum Presensi', label: 'Belum Presensi', color: 'rose', icon: UserX },
    { key: 'Izin', label: 'Izin', color: 'sky', icon: FileText },
    { key: 'Sakit', label: 'Sakit', color: 'amber', icon: FileText },
    { key: 'Alfa', label: 'Alfa', color: 'rose', icon: UserX },
  ] as const;

  const getCount = (key: string) => rows.filter(r => r.status === key).length;
  const toggle = (key: string) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {categories.map(cat => {
          const count = getCount(cat.key);
          const list = rows.filter(r => r.status === cat.key);
          const isOpen = !!expanded[cat.key];
          const Icon = cat.icon;
          const colorClasses: Record<string, string> = {
            emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
            amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
            rose: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',
            sky: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800',
          };
          const iconClasses: Record<string, string> = {
            emerald: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
            amber: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
            rose: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
            sky: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
          };
          return (
            <div key={cat.key} className={`card p-0 overflow-hidden border ${colorClasses[cat.color]}`}>
              <button onClick={() => toggle(cat.key)} className="w-full p-2.5 flex items-center gap-2 text-left">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${iconClasses[cat.color]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{cat.label}</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{count}</p>
                </div>
                {count > 0 && (isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />)}
              </button>
              {isOpen && count > 0 && (
                <div className="px-2 pb-2 space-y-1">
                  {list.map(r => (
                    <div key={r.guru_id} className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {r.foto_presensi ? <img src={r.foto_presensi} alt={r.nama_lengkap} className="w-full h-full object-cover" /> : r.foto ? <img src={r.foto} alt={r.nama_lengkap} className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{r.nama_lengkap}</p>
                          <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                            {r.jam_presensi && <span className="text-emerald-600 dark:text-emerald-400 font-medium">{r.jam_presensi.slice(0, 5)}</span>}
                            <span>•</span><span>{r.kelas}</span><span>•</span><span className="truncate">{r.lembaga}</span>
                          </div>
                          {r.telat_menit && r.telat_menit > 0 && <span className="text-[9px] text-amber-600 dark:text-amber-400">Terlambat {r.telat_menit} menit</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ====== Jadwal Ustaz Hari Ini ======
function JadwalUstazHariIni({ showToast }: { showToast: ShowToast }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<JadwalUstazRow[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const dayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
      const { data: jadwal } = await supabase.from('jadwal_mengajar').select('id, user_id, kelas, pelajaran, jam_mulai, jam_selesai, ruangan, lembaga_id, guru_pengganti_id').eq('hari', dayName).order('jam_mulai');
      if (!jadwal || jadwal.length === 0) { setRows([]); setLoading(false); return; }

      const userIds = [...new Set(jadwal.map(j => j.user_id).filter(Boolean))];
      const penggantiIds = [...new Set(jadwal.map(j => j.guru_pengganti_id).filter(Boolean))];
      const lembagaIds = [...new Set(jadwal.map(j => j.lembaga_id).filter(Boolean))];

      const [profilesRes, penggantiRes, lembagaRes, presensiRes, izinRes] = await Promise.all([
        supabase.from('profiles').select('id, nama_lengkap').in('id', userIds),
        penggantiIds.length > 0 ? supabase.from('profiles').select('id, nama_lengkap').in('id', penggantiIds) : Promise.resolve({ data: [], error: null }),
        lembagaIds.length > 0 ? supabase.from('lembaga').select('id, nama_lembaga').in('id', lembagaIds) : Promise.resolve({ data: [], error: null }),
        supabase.from('presensi_guru').select('user_id, jam_masuk').eq('tanggal', today),
        supabase.from('izin_mengajar').select('user_id, status').eq('status', 'disetujui').lte('tanggal_mulai', today).gte('tanggal_selesai', today),
      ]);

      const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p.nama_lengkap]));
      const penggantiMap = new Map((penggantiRes.data || []).map(p => [p.id, p.nama_lengkap]));
      const lembagaMap = new Map((lembagaRes.data || []).map(l => [l.id, l.nama_lembaga]));
      const presensiSet = new Set((presensiRes.data || []).map(p => p.user_id));
      const izinSet = new Set((izinRes.data || []).map(i => i.user_id));

      setRows(jadwal.map(j => {
        const isIzin = izinSet.has(j.user_id);
        const hasPresensi = presensiSet.has(j.user_id);
        let status: JadwalUstazRow['status'] = 'Belum Presensi';
        if (isIzin) status = 'Izin'; else if (hasPresensi) status = 'Mengajar';
        return {
          id: j.id, user_id: j.user_id, nama_ustaz: profileMap.get(j.user_id) || '-',
          kelas: j.kelas || '-', pelajaran: j.pelajaran || '-', jam_mulai: j.jam_mulai || '-',
          jam_selesai: j.jam_selesai, ruangan: j.ruangan,
          lembaga: j.lembaga_id ? (lembagaMap.get(j.lembaga_id) || '-') : '-',
          nama_pengganti: j.guru_pengganti_id ? (penggantiMap.get(j.guru_pengganti_id) || '-') : undefined,
          status,
        };
      }));
    } catch (err: any) {
      showToast('Gagal memuat jadwal ustaz: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (rows.length === 0) return <div className="card p-4 text-center"><Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" /><p className="text-xs font-medium text-slate-800 dark:text-slate-100">Tidak ada jadwal mengajar hari ini</p></div>;

  const statusBadge = (status: JadwalUstazRow['status']) => status === 'Mengajar' ? 'badge-success' : status === 'Izin' ? 'badge-warning' : 'badge-info';

  return (
    <div className="space-y-1">
      {rows.map(r => (
        <div key={r.id} className="card p-2.5">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{r.nama_ustaz}</p>
              <div className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">{r.pelajaran}</span><span>•</span><span>{r.kelas}</span>
                {r.lembaga && r.lembaga !== '-' && (<><span>•</span><span className="truncate">{r.lembaga}</span></>)}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                <Clock className="w-2.5 h-2.5" /><span>{r.jam_mulai.slice(0, 5)}{r.jam_selesai ? ` - ${r.jam_selesai.slice(0, 5)}` : ''}</span>
                {r.ruangan && (<><span>•</span><span>{r.ruangan}</span></>)}
              </div>
              {r.nama_pengganti && <div className="flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 mt-0.5"><User className="w-2.5 h-2.5" /><span>Pengganti: {r.nama_pengganti}</span></div>}
            </div>
            <span className={`badge text-[9px] ${statusBadge(r.status)}`}>{r.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ====== Presensi Murid ======
function PresensiMurid({ showToast }: { showToast: ShowToast }) {
  const [muridByKelas, setMuridByKelas] = useState<PresensiMuridByKelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLembagaId, setFilterLembagaId] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [kelasOptions, setKelasOptions] = useState<string[]>([]);
  const { data: lembagaList } = useLembaga();

  useEffect(() => { fetchMuridByKelas(); }, [filterLembagaId, filterKelas]);

  const fetchMuridByKelas = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      let muridQuery = supabase.from('murid').select('id, nama, kelas, lembaga_id, status_aktif').eq('status_aktif', true);
      if (filterLembagaId) muridQuery = muridQuery.eq('lembaga_id', filterLembagaId);
      if (filterKelas) muridQuery = muridQuery.eq('kelas', filterKelas);
      const { data: muridData } = await muridQuery.order('kelas').order('nama');
      if (!muridData || muridData.length === 0) { setMuridByKelas([]); setKelasOptions([]); setLoading(false); return; }

      setKelasOptions([...new Set(muridData.map(m => m.kelas).filter(Boolean))].sort());
      const muridIds = muridData.map(m => m.id);
      const { data: absensiData } = await supabase.from('absensi').select('murid_id, status').eq('tanggal', today).in('murid_id', muridIds);
      const absensiMap = new Map((absensiData || []).map(a => [a.murid_id, a.status]));

      const byKelas: Record<string, { hadir: number; izin: number; sakit: number; alfa: number; total: number }> = {};
      muridData.forEach(m => {
        const k = m.kelas || 'Tanpa Kelas';
        if (!byKelas[k]) byKelas[k] = { hadir: 0, izin: 0, sakit: 0, alfa: 0, total: 0 };
        byKelas[k].total++;
        const status = absensiMap.get(m.id);
        if (status === 'Hadir') byKelas[k].hadir++;
        else if (status === 'Izin') byKelas[k].izin++;
        else if (status === 'Sakit') byKelas[k].sakit++;
        else if (status === 'Alpha' || status === 'Alfa') byKelas[k].alfa++;
      });

      setMuridByKelas(Object.entries(byKelas).map(([namaKelas, s]) => ({
        kelas_id: namaKelas, nama_kelas: namaKelas, hadir: s.hadir, izin: s.izin, sakit: s.sakit, alfa: s.alfa,
        total_murid: s.total, persentase: s.total > 0 ? Math.round((s.hadir / s.total) * 100) : 0,
      })));
    } catch { showToast('Gagal memuat data', 'error'); } finally { setLoading(false); }
  };

  const lembagaOptions = useMemo(() => (lembagaList || []).map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <SearchableSelect value={filterLembagaId} onChange={v => { setFilterLembagaId(v); setFilterKelas(''); }} options={lembagaOptions} placeholder="Semua Lembaga" icon={<Building2 className="w-3.5 h-3.5" />} />
        <SearchableSelect value={filterKelas} onChange={v => setFilterKelas(v)} options={kelasOptions.map(k => ({ value: k, label: k }))} placeholder="Semua Kelas" />
      </div>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div> : muridByKelas.length === 0 ? (
        <EmptyState title="Tidak ada data presensi" icon={<GraduationCap className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {muridByKelas.map(kelas => (
            <div key={kelas.kelas_id} className="card p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                <span className="text-[10px] font-bold text-sky-600">{kelas.nama_kelas}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{kelas.nama_kelas}</p>
                <div className="flex gap-2 text-[9px] text-slate-500">
                  <span className="text-emerald-600">{kelas.hadir} H</span><span className="text-amber-600">{kelas.sakit} S</span><span>{kelas.izin} I</span><span className="text-rose-600">{kelas.alfa} A</span>
                </div>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{kelas.persentase}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====== Guru Pengganti ======
function GuruPengganti({ showToast }: { showToast: ShowToast }) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRiwayat, setShowRiwayat] = useState(false);

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase.from('guru_pengganti').select('*').gte('tanggal', today).order('tanggal');
      setList(data || []);
    } catch { showToast('Gagal memuat data', 'error'); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 py-2.5 px-3 text-xs flex-1">
          <Plus className="w-3.5 h-3.5" /> Tambah Pengganti
        </button>
        <button onClick={() => setShowRiwayat(true)} className="btn-secondary flex items-center gap-1.5 py-2.5 px-3 text-xs">
          <History className="w-3.5 h-3.5" /> Riwayat
        </button>
      </div>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /></div> : list.length === 0 ? (
        <EmptyState title="Tidak ada guru pengganti" icon={<Repeat className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {list.map(g => (
            <div key={g.id} className="card p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <Repeat className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{g.kelas || '-'} • {g.mapel || '-'}</p>
                <p className="text-[9px] text-slate-500">{g.tanggal} • {g.keterangan || ''}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Tambah Guru Pengganti</p>
            <p className="text-xs text-slate-400">Fitur ini akan tersedia segera</p>
            <button onClick={() => setShowModal(false)} className="btn-secondary w-full mt-3 py-2.5 text-xs">Tutup</button>
          </div>
        </div>
      )}
      {showRiwayat && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4" onClick={() => setShowRiwayat(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Riwayat Guru Pengganti</p>
            {list.length === 0 ? <p className="text-xs text-slate-400">Belum ada riwayat</p> : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {list.map(g => <div key={g.id} className="text-xs p-2 bg-slate-50 dark:bg-slate-700/50 rounded">{g.tanggal} • {g.kelas} • {g.mapel}</div>)}
              </div>
            )}
            <button onClick={() => setShowRiwayat(false)} className="btn-secondary w-full mt-3 py-2.5 text-xs">Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
