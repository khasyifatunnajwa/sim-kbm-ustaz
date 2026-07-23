import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ClipboardCheck, Save, CheckCircle, AlertCircle, XCircle, Clock,
  FileText, Share2, Calendar, BarChart3, Pencil, AlertTriangle,
  History, Lock, Info, ChevronRight, User,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useMasterData } from '../hooks/useMasterData';
import { getActivityContext, clearActivityContext } from '../lib/activityContext';
import EmptyState from '../components/EmptyState';
import SearchableSelect from '../components/SearchableSelect';
import Modal from '../components/Modal';
import { useLembaga } from '../hooks/useLembaga';
import { useSettings } from '../store/useSettings';
import { generatePDF, shareWA } from '../lib/pdf';
import type { Murid, Absensi, AuditTrailAbsensi, Profile, ShowToast, GenderKelas, JamPelajaran } from '../types';

type Status = 'Hadir' | 'Izin' | 'Sakit' | 'Alfa' | 'Belum Hadir' | 'Telat';
type Tab = 'input' | 'rekap' | 'audit';

const STATUS_CONFIG: Record<Status, { active: string; inactive: string; icon: React.ElementType; label: string }> = {
  Hadir:       { active: 'bg-emerald-500 border-emerald-500 text-white', inactive: 'border-slate-200 text-slate-400 hover:bg-emerald-50', icon: CheckCircle, label: 'Hadir' },
  Izin:        { active: 'bg-amber-500 border-amber-500 text-white',    inactive: 'border-slate-200 text-slate-400 hover:bg-amber-50',    icon: Clock,        label: 'Izin' },
  Sakit:       { active: 'bg-sky-500 border-sky-500 text-white',        inactive: 'border-slate-200 text-slate-400 hover:bg-sky-50',      icon: AlertCircle,  label: 'Sakit' },
  Alfa:        { active: 'bg-rose-500 border-rose-500 text-white',      inactive: 'border-slate-200 text-slate-400 hover:bg-rose-50',     icon: XCircle,      label: 'Alfa' },
  'Belum Hadir': { active: 'bg-slate-400 border-slate-400 text-white',  inactive: 'border-slate-200 text-slate-400 hover:bg-slate-50',    icon: Clock,        label: 'Belum Hadir' },
  Telat:       { active: 'bg-orange-500 border-orange-500 text-white',  inactive: 'border-slate-200 text-slate-400 hover:bg-orange-50',   icon: AlertTriangle, label: 'Telat' },
};

const STATUS_LIST_INPUT: Status[] = ['Hadir', 'Izin', 'Sakit', 'Alfa', 'Belum Hadir'];
const STATUS_LIST_REKAP: Status[] = ['Hadir', 'Telat', 'Izin', 'Sakit', 'Alfa', 'Belum Hadir'];

const STATUS_COLOR: Record<Status, string> = {
  Hadir: 'bg-emerald-500', Izin: 'bg-amber-500', Sakit: 'bg-sky-500',
  Alfa: 'bg-rose-500', 'Belum Hadir': 'bg-slate-400', Telat: 'bg-orange-500',
};

const STATUS_BADGE: Record<Status, string> = {
  Hadir: 'badge-success', Izin: 'badge-warning', Sakit: 'badge-info',
  Alfa: 'badge-danger', 'Belum Hadir': 'badge-secondary', Telat: 'badge-warning',
};

function getServerMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function calcTelatMenit(jamMasuk: string, jamDatang: string): number {
  return Math.max(0, getServerMinutes(jamDatang) - getServerMinutes(jamMasuk));
}

export default function AbsensiPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [tab, setTab] = useState<Tab>(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[0] === 'absensi' && hashParts[1] === 'rekap') return 'rekap';
    if (hashParts[0] === 'absensi' && hashParts[1] === 'audit') return 'audit';
    return 'input';
  });

  const [selectedLembagaId, setSelectedLembagaId] = useState<string>('');
  const [selectedKelas, setSelectedKelas] = useState<string>(''); // stores kelas ID
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);

  // Late arrival modal
  const [showTelatModal, setShowTelatModal] = useState(false);
  const [telatMurid, setTelatMurid] = useState<Murid | null>(null);
  const [telatJamDatang, setTelatJamDatang] = useState('');
  const [telatAlasan, setTelatAlasan] = useState('');
  const [telatSaving, setTelatSaving] = useState(false);

  // Rekap state
  const [rekapType, setRekapType] = useState<'bulanan' | 'tahunan'>('bulanan');
  const [rekapBulan, setRekapBulan] = useState(new Date().getMonth() + 1);
  const [rekapTahun, setRekapTahun] = useState(new Date().getFullYear());

  // Audit state
  const [auditMuridId, setAuditMuridId] = useState<string>('');

  const queryClient = useQueryClient();
  const { data: lembagaList = [] } = useLembaga();
  const { settings } = useSettings();
  const [filterGender, setFilterGender] = useState<string>('');

  const { kelasList, muridList, scope, isAdmin } = useMasterData(profile);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = tanggal === todayStr;
  const nowTime = new Date().toTimeString().slice(0, 5);

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'absensi') {
        if (hashParts[1] === 'rekap') setTab('rekap');
        else if (hashParts[1] === 'audit') setTab('audit');
        else setTab('input');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Auto-read activity context from Dashboard
  useEffect(() => {
    const ctx = getActivityContext();
    if (ctx) {
      if (ctx.kelas_id) setSelectedKelas(ctx.kelas_id);
      if (ctx.lembaga_id) setSelectedLembagaId(ctx.lembaga_id);
      setTab('input');
      clearActivityContext();
    }
  }, []);

  const handleTabChange = (newTab: Tab) => {
    setTab(newTab);
    const hash = newTab === 'input' ? '#absensi' : `#absensi/${newTab}`;
    window.history.pushState(null, '', hash);
  };

  // Fetch jam pelajaran for edit lock
  const { data: jamPelajaranList = [] } = useQuery<JamPelajaran[]>({
    queryKey: ['jam-pelajaran'],
    queryFn: async () => {
      const { data } = await supabase.from('jam_pelajaran').select('*').order('jam_mulai');
      return (data ?? []) as JamPelajaran[];
    },
    staleTime: 10 * 60 * 1000,
  });

  // Filter kelas by lembaga and scope (ID-based)
  const kelasOptionsFiltered = useMemo(() => {
    let result = kelasList as Array<{ id: string; nama_kelas: string; lembaga_id?: string }>;
    if (selectedLembagaId) {
      result = result.filter(k => k.lembaga_id === selectedLembagaId);
    }
    if (!isAdmin && scope && scope.kelasIds.length > 0) {
      result = result.filter(k => scope.kelasIds.includes(k.id));
    }
    return result;
  }, [kelasList, selectedLembagaId, isAdmin, scope]);

  // Auto-select first kelas
  useEffect(() => {
    if (kelasOptionsFiltered.length > 0 && !kelasOptionsFiltered.some(k => k.id === selectedKelas)) {
      setSelectedKelas(kelasOptionsFiltered[0].id);
    }
    if (selectedLembagaId && kelasOptionsFiltered.length === 0) setSelectedKelas('');
  }, [selectedLembagaId, kelasOptionsFiltered, selectedKelas]);

  // Derive display name for selected kelas
  const selectedKelasNama = useMemo(() => {
    const k = (kelasList as Array<{ id: string; nama_kelas: string }>).find(k => k.id === selectedKelas);
    return k?.nama_kelas ?? '';
  }, [kelasList, selectedKelas]);

  // Filter murid by kelas_id (ID-based, not name-based)
  const muridFiltered = useMemo(() =>
    muridList.filter(m =>
      m.kelas_id === selectedKelas &&
      (!selectedLembagaId || m.lembaga_id === selectedLembagaId) &&
      (!filterGender || m.gender_kelas === filterGender)
    ),
    [muridList, selectedKelas, selectedLembagaId, filterGender]
  );

  // Determine if absensi is locked based on jam_pelajaran batas_edit_absensi
  const isEditLocked = useMemo(() => {
    if (isAdmin) return false;
    if (!isToday) return true;
    if (!nowTime) return false;
    const nowMin = getServerMinutes(nowTime);
    for (const jam of jamPelajaranList) {
      const mulaiMin = getServerMinutes(jam.jam_mulai);
      const batasEdit = jam.batas_edit_absensi ?? 40;
      const deadlineMin = mulaiMin + batasEdit;
      if (nowMin >= mulaiMin && nowMin <= deadlineMin) return false;
    }
    const savedJam = localStorage.getItem('simkbm-jam-settings');
    if (savedJam) {
      try {
        const jam = JSON.parse(savedJam);
        const masukMin = getServerMinutes(jam.jam_masuk || '07:00');
        const batas = masukMin + 40;
        if (nowMin <= batas) return false;
      } catch { /* ignore */ }
    }
    return false;
  }, [isAdmin, isToday, nowTime, jamPelajaranList]);

  const { data: fetchedAttendance, isLoading: loadingAbsensi, refetch: refetchAbsensi } = useQuery({
    queryKey: ['absensi-harian', tanggal, selectedKelas, selectedLembagaId, filterGender],
    queryFn: async () => {
      const muridIds = muridFiltered.map(m => m.id);
      const map: Record<string, Status> = {};
      muridFiltered.forEach(m => { map[m.id] = 'Hadir'; });
      if (muridIds.length) {
        let query = supabase.from('absensi').select('*').eq('tanggal', tanggal).in('murid_id', muridIds);
        if (selectedLembagaId) query = query.eq('lembaga_id', selectedLembagaId);
        const { data } = await query;
        (data ?? []).forEach((a: Absensi) => {
          if (a.murid_id) map[a.murid_id] = (a.status as Status) ?? 'Hadir';
        });
      }
      return map;
    },
    enabled: tab === 'input' && !!selectedKelas && muridFiltered.length > 0,
  });

  useEffect(() => {
    if (fetchedAttendance) {
      setAttendance(fetchedAttendance);
    } else if (muridFiltered.length > 0) {
      const map: Record<string, Status> = {};
      muridFiltered.forEach(m => { map[m.id] = 'Hadir'; });
      setAttendance(map);
    }
  }, [fetchedAttendance, muridFiltered]);

  const saveAuditTrail = useCallback(async (
    absensiId: string | undefined,
    muridId: string,
    statusLama: string | undefined,
    statusBaru: string,
    opts?: { jamDatang?: string; telatMenit?: number; alasan?: string; tipe?: 'guru' | 'admin' | 'sistem' }
  ) => {
    await supabase.from('audit_trail_absensi').insert({
      absensi_id: absensiId,
      murid_id: muridId,
      tanggal,
      status_lama: statusLama,
      status_baru: statusBaru,
      jam_datang: opts?.jamDatang,
      telat_menit: opts?.telatMenit,
      diubah_oleh: profile?.id,
      diubah_oleh_nama: profile?.nama_lengkap ?? profile?.email,
      alasan: opts?.alasan,
      tipe_perubahan: opts?.tipe ?? (isAdmin ? 'admin' : 'guru'),
    });
  }, [tanggal, profile, isAdmin]);

  const handleSave = async () => {
    if (!selectedKelas || !muridFiltered.length) return;
    setSaving(true);
    try {
      const muridIds = muridFiltered.map(m => m.id);
      let currentMap: Record<string, { id: string; status: string }> = {};
      {
        let q = supabase.from('absensi').select('id, murid_id, status').eq('tanggal', tanggal).in('murid_id', muridIds);
        if (selectedLembagaId) q = q.eq('lembaga_id', selectedLembagaId);
        const { data } = await q;
        (data ?? []).forEach((a: any) => { if (a.murid_id) currentMap[a.murid_id] = { id: a.id, status: a.status }; });
      }

      let deleteQuery = supabase.from('absensi').delete().eq('tanggal', tanggal).in('murid_id', muridIds);
      if (selectedLembagaId) deleteQuery = deleteQuery.eq('lembaga_id', selectedLembagaId);
      await deleteQuery;

      const records = muridFiltered.map(m => ({
        murid_id: m.id,
        kelas_id: selectedKelas,
        tanggal,
        status: attendance[m.id] ?? 'Hadir',
        ...(selectedLembagaId ? { lembaga_id: selectedLembagaId } : {}),
      }));
      const { data: inserted, error } = await supabase.from('absensi').insert(records).select('id, murid_id, status');
      if (error) { showToast(error.message, 'error'); return; }

      const auditRows = (inserted ?? [])
        .filter((a: any) => {
          const prev = currentMap[a.murid_id];
          return !prev || prev.status !== a.status;
        })
        .map((a: any) => ({
          absensi_id: a.id,
          murid_id: a.murid_id,
          tanggal,
          status_lama: currentMap[a.murid_id]?.status,
          status_baru: a.status,
          diubah_oleh: profile?.id,
          diubah_oleh_nama: profile?.nama_lengkap ?? profile?.email,
          tipe_perubahan: isAdmin ? 'admin' : 'guru',
        }));

      if (auditRows.length > 0) await supabase.from('audit_trail_absensi').insert(auditRows);

      showToast('Absensi berhasil disimpan!', 'success');
      refetchAbsensi();
      queryClient.invalidateQueries({ queryKey: ['absensi-audit'] });
    } finally {
      setSaving(false);
    }
  };

  const openTelatModal = (murid: Murid) => {
    setTelatMurid(murid);
    setTelatJamDatang(nowTime);
    setTelatAlasan('');
    setShowTelatModal(true);
  };

  const handleSaveTelat = async () => {
    if (!telatMurid) return;
    setTelatSaving(true);
    try {
      const { data: existing } = await supabase.from('absensi')
        .select('id, status')
        .eq('tanggal', tanggal)
        .eq('murid_id', telatMurid.id)
        .maybeSingle();

      let jamMasuk = '07:00';
      if (jamPelajaranList.length > 0) jamMasuk = jamPelajaranList[0].jam_mulai;
      else {
        const savedJam = localStorage.getItem('simkbm-jam-settings');
        if (savedJam) { try { jamMasuk = JSON.parse(savedJam).jam_masuk || '07:00'; } catch { /* ignore */ } }
      }
      const telat = calcTelatMenit(jamMasuk, telatJamDatang);

      const payload: any = {
        murid_id: telatMurid.id,
        kelas_id: selectedKelas || null,
        tanggal,
        status: 'Telat',
        jam_datang: telatJamDatang,
        telat_menit: telat,
        diubah_oleh: profile?.id,
        alasan_ubah: telatAlasan || null,
        ...(selectedLembagaId ? { lembaga_id: selectedLembagaId } : {}),
      };

      let absensiId: string | undefined;
      if (existing) {
        await supabase.from('absensi').update(payload).eq('id', existing.id);
        absensiId = existing.id;
        await saveAuditTrail(existing.id, telatMurid.id, existing.status, 'Telat', {
          jamDatang: telatJamDatang, telatMenit: telat, alasan: telatAlasan,
        });
      } else {
        const { data: newRec } = await supabase.from('absensi').insert(payload).select('id').maybeSingle();
        absensiId = newRec?.id;
        await saveAuditTrail(absensiId, telatMurid.id, undefined, 'Telat', {
          jamDatang: telatJamDatang, telatMenit: telat, alasan: telatAlasan,
        });
      }

      setAttendance(prev => ({ ...prev, [telatMurid.id]: 'Telat' }));
      setShowTelatModal(false);
      showToast(`${telatMurid.nama} - Telat ${telat} menit`, 'success');
      refetchAbsensi();
      queryClient.invalidateQueries({ queryKey: ['absensi-audit'] });
    } finally {
      setTelatSaving(false);
    }
  };

  // Audit trail query
  const { data: auditList = [], isLoading: loadingAudit } = useQuery<AuditTrailAbsensi[]>({
    queryKey: ['absensi-audit', tanggal, selectedKelas, auditMuridId],
    queryFn: async () => {
      const muridIds = auditMuridId
        ? [auditMuridId]
        : muridFiltered.map(m => m.id);
      if (!muridIds.length) return [];
      const { data } = await supabase.from('audit_trail_absensi')
        .select('*')
        .eq('tanggal', tanggal)
        .in('murid_id', muridIds)
        .order('created_at', { ascending: false });
      return (data ?? []) as AuditTrailAbsensi[];
    },
    enabled: tab === 'audit' && !!selectedKelas,
  });

  // Rekap query
  const { data: fetchedRekapData, isLoading: loadingRekapData } = useQuery({
    queryKey: ['absensi-rekap', selectedKelas, selectedLembagaId, rekapType, rekapBulan, rekapTahun],
    queryFn: async () => {
      const muridKelas = muridList.filter(m =>
        m.kelas_id === selectedKelas &&
        (!selectedLembagaId || m.lembaga_id === selectedLembagaId)
      );
      const muridIds = muridKelas.map(m => m.id);
      const grouped: Record<string, Record<Status, number>> = {};
      muridKelas.forEach(m => { grouped[m.id] = { Hadir: 0, Izin: 0, Sakit: 0, Alfa: 0, 'Belum Hadir': 0, Telat: 0 }; });
      if (!muridIds.length) return grouped;

      let query = supabase.from('absensi').select('*').in('murid_id', muridIds);
      if (selectedLembagaId) query = query.eq('lembaga_id', selectedLembagaId);
      if (rekapType === 'bulanan') {
        const start = `${rekapTahun}-${String(rekapBulan).padStart(2, '0')}-01`;
        const end = `${rekapTahun}-${String(rekapBulan).padStart(2, '0')}-31`;
        query = query.gte('tanggal', start).lte('tanggal', end);
      } else {
        query = query.gte('tanggal', `${rekapTahun}-01-01`).lte('tanggal', `${rekapTahun}-12-31`);
      }
      const { data } = await query.order('tanggal', { ascending: true });
      (data ?? []).forEach((a: Absensi) => {
        if (a.murid_id && grouped[a.murid_id]) {
          const s = (a.status as Status) ?? 'Hadir';
          grouped[a.murid_id][s] = (grouped[a.murid_id][s] ?? 0) + 1;
        }
      });
      return grouped;
    },
    enabled: tab === 'rekap' && !!selectedKelas,
  });

  const rekapData = fetchedRekapData ?? {};

  const stats = {
    hadir: Object.values(attendance).filter(s => s === 'Hadir').length,
    telat: Object.values(attendance).filter(s => s === 'Telat').length,
    izin:  Object.values(attendance).filter(s => s === 'Izin').length,
    sakit: Object.values(attendance).filter(s => s === 'Sakit').length,
    alfa:  Object.values(attendance).filter(s => s === 'Alfa').length,
    belumHadir: Object.values(attendance).filter(s => s === 'Belum Hadir').length,
  };

  const exportRekapPDF = () => {
    const periode = rekapType === 'bulanan'
      ? new Date(rekapTahun, rekapBulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : `Tahun ${rekapTahun}`;
    const headers = ['No', 'Nama', 'Hadir', 'Telat', 'Izin', 'Sakit', 'Alfa', '% Hadir'];
    const body = muridFiltered.map((m, i) => {
      const d = rekapData[m.id] ?? { Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alfa: 0, 'Belum Hadir': 0 };
      const total = d.Hadir + d.Telat + d.Izin + d.Sakit + d.Alfa;
      const pct = total > 0 ? (((d.Hadir + d.Telat) / total) * 100).toFixed(1) : '0';
      return [i + 1, m.nama, d.Hadir, d.Telat, d.Izin, d.Sakit, d.Alfa, `${pct}%`];
    });
    generatePDF(`Rekap Absensi ${selectedKelasNama}`, headers, body, [`Periode: ${periode}`, `Cetak: ${new Date().toLocaleDateString('id-ID')}`]);
  };

  const shareRekapWA = () => {
    const periode = rekapType === 'bulanan'
      ? new Date(rekapTahun, rekapBulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
      : `Tahun ${rekapTahun}`;
    let text = `Rekap Absensi Kelas ${selectedKelasNama} - ${periode}\n\n`;
    muridFiltered.forEach((m, i) => {
      const d = rekapData[m.id] ?? { Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alfa: 0, 'Belum Hadir': 0 };
      const total = d.Hadir + d.Telat + d.Izin + d.Sakit + d.Alfa;
      const pct = total > 0 ? (((d.Hadir + d.Telat) / total) * 100).toFixed(0) : '0';
      text += `${i + 1}. ${m.nama} - H:${d.Hadir} T:${d.Telat} I:${d.Izin} S:${d.Sakit} A:${d.Alfa} (${pct}%)\n`;
    });
    shareWA(text);
  };

  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  const isLoadingInput = loadingAbsensi;
  const isLoadingRekap = loadingRekapData;

  const kelasSelectEl = (cls: string) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kelas</label>
      <select value={selectedKelas} onChange={e => setSelectedKelas(e.target.value)} className="input-field text-sm">
        <option value="">Pilih Kelas</option>
        {kelasOptionsFiltered.map(k => <option key={k.id} value={k.id}>{k.nama_kelas}</option>)}
      </select>
    </div>
  );

  const filterSection = (
    <div className="card p-4 mb-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchableSelect
          label="Lembaga"
          value={selectedLembagaId}
          onChange={setSelectedLembagaId}
          options={lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga }))}
          placeholder="Semua Lembaga"
        />
        {kelasSelectEl('input')}
        {settings.genderEnabled && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Gender</label>
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)} className="input-field text-sm">
              <option value="">Semua</option>
              {settings.genderOptions.map(g => <option key={g} value={g}>{g === 'Banin' ? settings.genderLabelBanin : g === 'Banat' ? settings.genderLabelBanat : settings.genderLabelCampuran}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal</label>
          <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="input-field text-sm" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-5">
        <h2 className="section-title">Absensi Santri</h2>
        <p className="section-subtitle">Input dan rekapitulasi kehadiran santri</p>
      </div>

      <div className="tab-switcher mb-5">
        {(['input', 'rekap', 'audit'] as Tab[]).map(t => (
          <button key={t} onClick={() => handleTabChange(t)} className={`tab-btn ${tab === t ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
            {t === 'input' ? 'Input Harian' : t === 'rekap' ? 'Rekapitulasi' : 'Audit Trail'}
          </button>
        ))}
      </div>

      {/* ===== INPUT TAB ===== */}
      {tab === 'input' && (
        <>
          {filterSection}

          {isEditLocked && (
            <div className="mb-4 flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
                Batas waktu edit telah terlewat. Hanya Admin yang dapat mengubah data.
              </p>
            </div>
          )}

          {muridFiltered.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
              {[
                { label: 'Hadir', val: stats.hadir, color: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300' },
                { label: 'Telat',  val: stats.telat,  color: 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:text-orange-300' },
                { label: 'Izin',  val: stats.izin,  color: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300' },
                { label: 'Sakit', val: stats.sakit, color: 'bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-900/20 dark:text-sky-300' },
                { label: 'Alfa',  val: stats.alfa,  color: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-900/20 dark:text-rose-300' },
                { label: 'Belum', val: stats.belumHadir, color: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300' },
              ].map(s => (
                <div key={s.label} className={`card p-2.5 text-center border ${s.color}`}>
                  <p className="text-xl font-bold">{s.val}</p>
                  <p className="text-[10px] font-semibold">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {isLoadingInput ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="card p-4 animate-pulse h-20 bg-slate-50 rounded-2xl" />)}</div>
          ) : !selectedKelas ? (
            <EmptyState title="Pilih kelas" description="Pilih kelas untuk mulai absensi." icon={<ClipboardCheck className="w-8 h-8 text-slate-300" />} />
          ) : muridFiltered.length === 0 ? (
            <EmptyState title="Tidak ada santri" description="Belum ada santri aktif di kelas ini." icon={<ClipboardCheck className="w-8 h-8 text-slate-300" />} />
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {muridFiltered.map((m, i) => {
                  const status = attendance[m.id] ?? 'Hadir';
                  const isLate = status === 'Telat';
                  const isBelum = status === 'Belum Hadir';
                  return (
                    <div key={m.id} className={`card p-3 ${isLate ? 'border-l-4 border-l-orange-400' : isBelum ? 'border-l-4 border-l-slate-400' : ''}`}>
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-600 dark:text-slate-300 font-bold text-xs">{i + 1}</span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex-1 min-w-0 truncate">{m.nama}</p>
                        <span className={`badge text-[9px] flex-shrink-0 ${STATUS_BADGE[status]}`}>{status}</span>
                      </div>
                      {!isEditLocked && (
                        <div className="grid grid-cols-5 gap-1.5 mb-1.5">
                          {STATUS_LIST_INPUT.map(s => {
                            const Icon = STATUS_CONFIG[s].icon;
                            return (
                              <button
                                key={s}
                                onClick={() => setAttendance(prev => ({ ...prev, [m.id]: s }))}
                                className={`py-1.5 rounded-lg text-[9px] font-bold border transition-all flex items-center justify-center gap-0.5 ${status === s ? STATUS_CONFIG[s].active : STATUS_CONFIG[s].inactive}`}
                              >
                                <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="hidden sm:inline">{s === 'Belum Hadir' ? 'Belum' : s}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {!isEditLocked && (isBelum || isLate) && (
                        <button
                          onClick={() => openTelatModal(m)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-semibold bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition-colors mt-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {isLate ? 'Perbarui Jam Datang' : 'Tandai Telat'}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {!isEditLocked && (
                <div className="flex gap-2">
                  <button onClick={() => refetchAbsensi()} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm">
                    <Pencil className="w-4 h-4" /> Reset
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                    <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              )}
              {isEditLocked && !isAdmin && (
                <div className="text-center py-4">
                  <Lock className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-500">Hubungi admin untuk mengubah data</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== REKAP TAB ===== */}
      {tab === 'rekap' && (
        <>
          <div className="card p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <SearchableSelect
                label="Lembaga"
                value={selectedLembagaId}
                onChange={setSelectedLembagaId}
                options={lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga }))}
                placeholder="Semua Lembaga"
              />
              {kelasSelectEl('rekap')}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jenis</label>
                <select value={rekapType} onChange={e => setRekapType(e.target.value as any)} className="input-field text-sm">
                  <option value="bulanan">Bulanan</option>
                  <option value="tahunan">Tahunan</option>
                </select>
              </div>
              {rekapType === 'bulanan' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Bulan</label>
                  <select value={rekapBulan} onChange={e => setRekapBulan(Number(e.target.value))} className="input-field text-sm">
                    {BULAN.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tahun</label>
                <select value={rekapTahun} onChange={e => setRekapTahun(Number(e.target.value))} className="input-field text-sm">
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          {selectedKelas && muridFiltered.length > 0 && (
            <div className="flex gap-2 mb-4">
              <button onClick={exportRekapPDF} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
                <FileText className="w-4 h-4" /> PDF
              </button>
              <button onClick={shareRekapWA} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
                <Share2 className="w-4 h-4" /> WhatsApp
              </button>
            </div>
          )}

          {isLoadingRekap ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-16 bg-slate-50 rounded-2xl" />)}</div>
          ) : !selectedKelas ? (
            <EmptyState title="Pilih kelas" description="Pilih kelas dan periode." icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
          ) : muridFiltered.length === 0 ? (
            <EmptyState title="Tidak ada santri" description="Belum ada santri di kelas ini." icon={<BarChart3 className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-3">
              <div className="card p-4 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-800 border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Kehadiran Kelas {selectedKelasNama}</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {(() => {
                      let h = 0, t = 0;
                      muridFiltered.forEach(m => {
                        const d = rekapData[m.id] ?? { Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alfa: 0, 'Belum Hadir': 0 };
                        const tot = d.Hadir + d.Telat + d.Izin + d.Sakit + d.Alfa;
                        h += d.Hadir + d.Telat; t += tot;
                      });
                      return t > 0 ? ((h / t) * 100).toFixed(1) : '0';
                    })()}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(() => {
                      let h = 0, t = 0;
                      muridFiltered.forEach(m => {
                        const d = rekapData[m.id] ?? { Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alfa: 0, 'Belum Hadir': 0 };
                        const tot = d.Hadir + d.Telat + d.Izin + d.Sakit + d.Alfa;
                        h += d.Hadir + d.Telat; t += tot;
                      });
                      return t > 0 ? (h / t) * 100 : 0;
                    })()}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {muridFiltered.map((m, i) => {
                  const d = rekapData[m.id] ?? { Hadir: 0, Telat: 0, Izin: 0, Sakit: 0, Alfa: 0, 'Belum Hadir': 0 };
                  const total = d.Hadir + d.Telat + d.Izin + d.Sakit + d.Alfa;
                  const pct = total > 0 ? ((d.Hadir + d.Telat) / total) * 100 : 0;
                  return (
                    <div key={m.id} className="card p-3.5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-600 dark:text-slate-300 font-bold text-xs">{i + 1}</span>
                        </div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex-1 min-w-0 truncate">{m.nama}</p>
                        <span className={`badge text-[10px] ${pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-danger'}`}>
                          {pct.toFixed(0)}% Hadir
                        </span>
                      </div>
                      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                        {total > 0 && STATUS_LIST_REKAP.map(s => {
                          const val = d[s] ?? 0;
                          if (val === 0) return null;
                          return <div key={s} className={STATUS_COLOR[s]} style={{ width: `${(val / total) * 100}%` }} title={`${s}: ${val}`} />;
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {STATUS_LIST_REKAP.filter(s => (d[s] ?? 0) > 0).map(s => (
                          <span key={s} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                            <span className={`w-2 h-2 rounded-full ${STATUS_COLOR[s]}`} />
                            {s}: <strong className="text-slate-700 dark:text-slate-200">{d[s]}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== AUDIT TRAIL TAB ===== */}
      {tab === 'audit' && (
        <>
          <div className="card p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {kelasSelectEl('audit')}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tanggal</label>
                <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="input-field text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Filter Murid</label>
                <select value={auditMuridId} onChange={e => setAuditMuridId(e.target.value)} className="input-field text-sm">
                  <option value="">Semua Murid</option>
                  {muridFiltered.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                </select>
              </div>
            </div>
          </div>

          {loadingAudit ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="card p-4 animate-pulse h-16 bg-slate-50 rounded-2xl" />)}</div>
          ) : auditList.length === 0 ? (
            <EmptyState title="Belum ada riwayat" description="Belum ada perubahan status absensi untuk filter ini." icon={<History className="w-8 h-8 text-slate-300" />} />
          ) : (
            <div className="space-y-2">
              {auditList.map(a => {
                const tipeBadge = a.tipe_perubahan === 'sistem' ? 'badge-secondary' : a.tipe_perubahan === 'admin' ? 'badge-warning' : 'badge-info';
                return (
                  <div key={a.id} className="card p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <History className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`badge text-[9px] ${STATUS_BADGE[(a.status_baru as Status) ?? 'Hadir']}`}>{a.status_baru}</span>
                          {a.status_lama && (
                            <>
                              <span className="text-[9px] text-slate-400">dari</span>
                              <span className={`badge text-[9px] ${STATUS_BADGE[(a.status_lama as Status) ?? 'Hadir']}`}>{a.status_lama}</span>
                            </>
                          )}
                          <span className={`badge text-[9px] ${tipeBadge}`}>{a.tipe_perubahan ?? 'guru'}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {muridFiltered.find(m => m.id === a.murid_id)?.nama ?? 'Murid'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>Diubah: <strong>{a.diubah_oleh_nama ?? 'Sistem'}</strong></span>
                          {a.jam_datang && <span>Jam Datang: <strong>{a.jam_datang.slice(0,5)}</strong></span>}
                          {a.telat_menit != null && <span>Telat: <strong>{a.telat_menit} menit</strong></span>}
                          <span>{new Date(a.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {a.alasan && <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 italic">Alasan: {a.alasan}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ===== TELAT MODAL ===== */}
      <Modal isOpen={showTelatModal} onClose={() => setShowTelatModal(false)} title="Tandai Murid Terlambat" size="sm">
        {telatMurid && (
          <div className="space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange-700 dark:text-orange-300">
                <p className="font-semibold">{telatMurid.nama}</p>
                <p>Status akan diubah menjadi <strong>Telat</strong> dengan waktu server.</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Jam Datang (Server Time)</label>
              <input type="time" value={telatJamDatang} onChange={e => setTelatJamDatang(e.target.value)} className="input-field text-sm" />
              {telatJamDatang && jamPelajaranList.length > 0 && (
                <p className="text-[10px] text-orange-600 mt-1">
                  Keterlambatan: {calcTelatMenit(jamPelajaranList[0].jam_mulai, telatJamDatang)} menit dari jam masuk {jamPelajaranList[0].jam_mulai}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Alasan (Opsional)</label>
              <input type="text" value={telatAlasan} onChange={e => setTelatAlasan(e.target.value)} placeholder="Keterangan keterlambatan..." className="input-field text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowTelatModal(false)} className="btn-secondary flex-1 py-2.5 text-xs">Batal</button>
              <button onClick={handleSaveTelat} disabled={telatSaving} className="btn-primary flex-1 py-2.5 text-xs flex items-center justify-center gap-1.5">
                <Save className="w-3.5 h-3.5" />
                {telatSaving ? 'Menyimpan...' : 'Simpan Telat'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
