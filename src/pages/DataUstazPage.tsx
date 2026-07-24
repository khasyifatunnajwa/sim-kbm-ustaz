import { useState, useEffect, useMemo } from 'react';
import {
  Users, FileText, Calendar, BarChart3, Loader2, BookOpen, TrendingUp,
  CheckCircle, X, Clock, XCircle, Heart, MessageCircle, Mail, StickyNote,
  AlertTriangle, Award, Phone, Download, Share2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from '../components/EmptyState';
import { generatePDF, shareWA } from '../lib/pdf';
import type { Profile, JadwalMengajar, JurnalKBM, Penilaian, ShowToast, PresensiGuru, IzinMengajar } from '../types';

type DetailTab = 'biodata' | 'jadwal' | 'presensi' | 'riwayat' | 'catatan';

export default function DataUstazPage({ showToast }: { showToast: ShowToast }) {
  const [ustazList, setUstazList] = useState<Profile[]>([]);
  const [selectedUstazId, setSelectedUstazId] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('biodata');

  const [jadwalList, setJadwalList] = useState<JadwalMengajar[]>([]);
  const [jurnalList, setJurnalList] = useState<JurnalKBM[]>([]);
  const [penilaianList, setPenilaianList] = useState<Penilaian[]>([]);
  const [detailCount, setDetailCount] = useState(0);
  const [presensiList, setPresensiList] = useState<PresensiGuru[]>([]);
  const [izinList, setIzinList] = useState<IzinMengajar[]>([]);
  const [catatanList, setCatatanList] = useState<any[]>([]);

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[3] !== 'detail') setSelectedUstazId('');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectUstaz = (id: string) => {
    if (!selectedUstazId) window.history.pushState(null, '', '#admin/akademik/ustaz/detail');
    setSelectedUstazId(id);
    setActiveTab('biodata');
  };

  const handleCloseDetail = () => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[3] === 'detail') window.history.back();
    else setSelectedUstazId('');
  };

  useEffect(() => { fetchUstaz(); }, []);

  const fetchUstaz = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*').eq('is_active', true).order('nama_lengkap');
    if (error) { showToast(error.message, 'error'); }
    else if (data) { setUstazList((data as Profile[]).filter(p => p.role !== 'admin')); }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedUstazId) fetchUstazData(selectedUstazId);
    else clearData();
  }, [selectedUstazId]);

  const clearData = () => {
    setJadwalList([]); setJurnalList([]); setPenilaianList([]); setDetailCount(0);
    setPresensiList([]); setIzinList([]); setCatatanList([]);
  };

  const fetchUstazData = async (ustazId: string) => {
    const [j, jur, p, pres, iz, cat] = await Promise.all([
      supabase.from('jadwal_mengajar').select('*').eq('user_id', ustazId).order('hari'),
      supabase.from('jurnal_kbm').select('*').eq('user_id', ustazId).eq('is_active', true).order('tanggal', { ascending: false }).limit(50),
      supabase.from('penilaian').select('*').eq('user_id', ustazId).order('tanggal', { ascending: false }),
      supabase.from('presensi_guru').select('*').eq('user_id', ustazId).order('tanggal', { ascending: false }).limit(100),
      supabase.from('izin_mengajar').select('*').eq('user_id', ustazId).order('tanggal_mulai', { ascending: false }).limit(50),
      supabase.from('catatan_guru').select('*').eq('user_id', ustazId).order('created_at', { ascending: false }).limit(20),
    ]);
    if (j.data) setJadwalList(j.data as JadwalMengajar[]);
    if (jur.data) setJurnalList(jur.data as JurnalKBM[]);
    if (p.data) {
      setPenilaianList(p.data as Penilaian[]);
      const ids = (p.data || []).map(x => x.id);
      if (ids.length) {
        const { count } = await supabase.from('detail_nilai').select('*', { count: 'exact', head: true }).in('penilaian_id', ids);
        setDetailCount(count || 0);
      } else setDetailCount(0);
    }
    if (pres.data) setPresensiList(pres.data as PresensiGuru[]);
    if (iz.data) setIzinList(iz.data as IzinMengajar[]);
    if (cat.data) setCatatanList(cat.data);
  };

  const handleExportPDF = () => {
    const headers = ['No', 'Nama Lengkap', 'Nama Panggilan', 'Email', 'No. WA', 'Role', 'Status'];
    const body = ustazList.map((u, i) => [
      i + 1,
      u.nama_lengkap || '-',
      u.nama_panggilan || '-',
      u.email || '-',
      u.nomor_whatsapp || '-',
      u.role || '-',
      u.is_active ? 'Aktif' : 'Non-aktif',
    ]);
    generatePDF('Daftar Ustaz', headers, body, [`Total: ${ustazList.length} ustaz`, `Cetak: ${new Date().toLocaleDateString('id-ID')}`]);
    showToast('PDF berhasil diunduh', 'success');
  };

  const handleExportCSV = () => {
    const header = 'No,Nama Lengkap,Nama Panggilan,Email,No. WA,Role,Status';
    const rows = ustazList.map((u, i) =>
      `${i + 1},"${u.nama_lengkap || ''}","${u.nama_panggilan || ''}","${u.email || ''}","${u.nomor_whatsapp || ''}","${u.role || ''}","${u.is_active ? 'Aktif' : 'Non-aktif'}"`
    );
    const csv = '\uFEFF' + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'daftar_ustaz.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV berhasil diunduh', 'success');
  };

  const handleShareWAUstaz = () => {
    let text = `*DAFTAR USTAZ*\n\n`;
    ustazList.forEach((u, i) => {
      text += `${i + 1}. ${u.nama_lengkap || u.nama_panggilan || 'Ustaz'} (${u.role})`;
      if (u.nomor_whatsapp) text += ` - ${u.nomor_whatsapp}`;
      text += '\n';
    });
    text += `\nTotal: ${ustazList.length} ustaz\nTanggal: ${new Date().toLocaleDateString('id-ID')}`;
    shareWA(text);
  };

  const selectedUstaz = ustazList.find(u => u.id === selectedUstazId);

  const kelasAmpu = useMemo(() => [...new Set(jadwalList.map(j => j.kelas).filter(Boolean))], [jadwalList]);
  const mapelAmpu = useMemo(() => [...new Set(jadwalList.map(j => j.pelajaran).filter(Boolean))], [jadwalList]);

  const presensiStats = useMemo(() => {
    const s = { hadir: 0, terlambat: 0, izin: 0, sakit: 0, alfa: 0, belum: 0 };
    presensiList.forEach(p => {
      const st = p.status_presensi || 'Hadir';
      if (st === 'Hadir') s.hadir++;
      else if (st === 'Terlambat') s.terlambat++;
      else if (st === 'Izin') s.izin++;
      else if (st === 'Sakit') s.sakit++;
      else if (st === 'Alfa') s.alfa++;
      else s.belum++;
    });
    return s;
  }, [presensiList]);

  const riwayatTelat = useMemo(() => presensiList.filter(p => p.status_presensi === 'Terlambat'), [presensiList]);
  const riwayatIzin = useMemo(() => izinList.filter(i => i.jenis_izin === 'Izin'), [izinList]);
  const riwayatSakit = useMemo(() => izinList.filter(i => i.jenis_izin === 'Sakit'), [izinList]);

  const jurnalThisMonth = useMemo(() => {
    const now = new Date();
    return jurnalList.filter(j => { const d = new Date(j.tanggal); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  }, [jurnalList]);

  const penilaianThisMonth = useMemo(() => {
    const now = new Date();
    return penilaianList.filter(p => { const d = new Date(p.tanggal); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length;
  }, [penilaianList]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
        <p className="text-sm text-slate-500">Memuat data...</p>
      </div>
    );
  }

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'biodata', label: 'Biodata', icon: Users },
    { id: 'jadwal', label: 'Jadwal', icon: Calendar },
    { id: 'presensi', label: 'Presensi', icon: CheckCircle },
    { id: 'riwayat', label: 'Riwayat', icon: Clock },
    { id: 'catatan', label: 'Catatan', icon: StickyNote },
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="section-title">Data Ustaz</h2>
        <p className="section-subtitle">Pusat data ustaz: biodata, jadwal, presensi, riwayat, dan catatan</p>
      </div>

      {/* Export & Share Buttons */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button onClick={handleExportPDF} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
          <FileText className="w-3.5 h-3.5" /> Export PDF
        </button>
        <button onClick={handleExportCSV} className="flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 text-sky-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
        <button onClick={handleShareWAUstaz} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
          <Share2 className="w-3.5 h-3.5" /> Share WA
        </button>
      </div>

      {ustazList.length === 0 ? (
        <EmptyState title="Belum ada ustaz" description="Belum ada data ustaz terdaftar." icon={<Users className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Ustaz List */}
          <div className="card p-4">
            <label className="block text-xs font-semibold text-slate-600 mb-2">Pilih Ustaz</label>
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {ustazList.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleSelectUstaz(u.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all border ${selectedUstazId === u.id ? 'bg-emerald-600 text-white font-bold border-emerald-600' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-100'}`}
                >
                  <span className="block truncate">{u.nama_lengkap || u.nama_panggilan || 'Ustaz'}</span>
                  <span className={`text-[10px] ${selectedUstazId === u.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {u.role === 'operator' ? 'Operator' : 'Ustaz'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Detail */}
          <div className="lg:col-span-2 space-y-4">
            {selectedUstaz ? (
              <>
                {/* Header */}
                <div className="card overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg truncate">{selectedUstaz.nama_lengkap || selectedUstaz.nama_panggilan || 'Ustaz'}</p>
                          <p className="text-emerald-100 text-sm">{selectedUstaz.email || ''}</p>
                        </div>
                      </div>
                      <button onClick={handleCloseDetail} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors shrink-0" title="Tutup">
                        <X className="w-5 h-5 text-white" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{jadwalList.length}</p>
                        <p className="text-[10px] text-emerald-100 font-semibold uppercase">Total Jadwal</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{kelasAmpu.length}</p>
                        <p className="text-[10px] text-emerald-100 font-semibold uppercase">Kelas Diampu</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{mapelAmpu.length}</p>
                        <p className="text-[10px] text-emerald-100 font-semibold uppercase">Mapel Diampu</p>
                      </div>
                      <div className="bg-white/15 rounded-xl p-3 text-center backdrop-blur-sm">
                        <p className="text-2xl font-bold">{penilaianList.length}</p>
                        <p className="text-[10px] text-emerald-100 font-semibold uppercase">Total Penilaian</p>
                      </div>
                    </div>
                    {/* Contact buttons */}
                    <div className="flex gap-2 mt-4">
                      {selectedUstaz.telepon && (
                        <a href={`https://wa.me/${selectedUstaz.telepon.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}
                      {selectedUstaz.telepon && (
                        <a href={`tel:${selectedUstaz.telepon}`} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                          <Phone className="w-3.5 h-3.5" /> Telepon
                        </a>
                      )}
                      {selectedUstaz.email && (
                        <a href={`mailto:${selectedUstaz.email}`} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors">
                          <Mail className="w-3.5 h-3.5" /> Email
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tab Switcher */}
                <div className="tab-switcher">
                  {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                      <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-btn ${activeTab === t.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}>
                        <Icon className="w-3.5 h-3.5" /> {t.label}
                      </button>
                    );
                  })}
                </div>

                {/* BIODATA TAB */}
                {activeTab === 'biodata' && (
                  <div className="card p-4 space-y-3">
                    <h3 className="font-bold text-slate-700 text-sm mb-2">Biodata Ustaz</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { label: 'Nama Lengkap', val: selectedUstaz.nama_lengkap },
                        { label: 'Nama Panggilan', val: selectedUstaz.nama_panggilan },
                        { label: 'Email', val: selectedUstaz.email },
                        { label: 'Telepon', val: selectedUstaz.telepon },
                        { label: 'Role', val: selectedUstaz.role },
                        { label: 'Jenis Kelamin', val: selectedUstaz.jenis_kelamin === 'L' ? 'Laki-laki' : selectedUstaz.jenis_kelamin === 'P' ? 'Perempuan' : '-' },
                        { label: 'Boleh Mengajar', val: selectedUstaz.boleh_mengajar },
                        { label: 'Status', val: selectedUstaz.is_active ? 'Aktif' : 'Nonaktif' },
                      ].map(f => (
                        <div key={f.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 font-semibold uppercase">{f.label}</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{f.val || '-'}</p>
                        </div>
                      ))}
                    </div>
                    {/* Mata Pelajaran & Kelas */}
                    <div className="space-y-2 pt-2">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Mata Pelajaran</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mapelAmpu.length > 0 ? mapelAmpu.map(m => <span key={m} className="badge badge-info text-[10px]">{m}</span>) : <span className="text-xs text-slate-400">Belum ada</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">Kelas</p>
                        <div className="flex flex-wrap gap-1.5">
                          {kelasAmpu.length > 0 ? kelasAmpu.map(k => <span key={k} className="badge badge-success text-[10px]">{k}</span>) : <span className="text-xs text-slate-400">Belum ada</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* JADWAL TAB */}
                {activeTab === 'jadwal' && (
                  <div className="card p-4">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-emerald-600" /> Jadwal Mengajar
                      <span className="ml-auto badge badge-info text-[10px]">{jadwalList.length} jadwal</span>
                    </h3>
                    {jadwalList.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">Belum ada jadwal</p>
                    ) : (
                      <div className="space-y-2">
                        {jadwalList.map(j => (
                          <div key={j.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                            <div className="w-10 h-10 bg-white dark:bg-slate-600 rounded-xl flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                              {j.jam_mulai?.slice(0, 5)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{j.pelajaran}</p>
                              <p className="text-[10px] text-slate-400">{j.hari} • {j.kelas}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Statistik Bulan Ini */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 flex items-center gap-3">
                        <FileText className="w-5 h-5 text-violet-600" />
                        <div><p className="text-xl font-bold text-slate-800 dark:text-slate-100">{jurnalThisMonth}</p><p className="text-xs text-slate-500">Jurnal Bulan Ini</p></div>
                      </div>
                      <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 flex items-center gap-3">
                        <BarChart3 className="w-5 h-5 text-sky-600" />
                        <div><p className="text-xl font-bold text-slate-800 dark:text-slate-100">{penilaianThisMonth}</p><p className="text-xs text-slate-500">Penilaian Bulan Ini</p></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* PRESENSI TAB */}
                {activeTab === 'presensi' && (
                  <div className="space-y-4">
                    <div className="card p-4">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> Rekap Presensi
                      </h3>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { label: 'Hadir', val: presensiStats.hadir, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300', icon: CheckCircle },
                          { label: 'Terlambat', val: presensiStats.terlambat, color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300', icon: Clock },
                          { label: 'Izin', val: presensiStats.izin, color: 'bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300', icon: FileText },
                          { label: 'Sakit', val: presensiStats.sakit, color: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300', icon: Heart },
                          { label: 'Alfa', val: presensiStats.alfa, color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300', icon: XCircle },
                          { label: 'Belum', val: presensiStats.belum, color: 'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300', icon: AlertTriangle },
                        ].map(s => {
                          const Icon = s.icon;
                          return (
                            <div key={s.label} className={`rounded-xl p-2.5 text-center ${s.color}`}>
                              <Icon className="w-3.5 h-3.5 mx-auto mb-1" />
                              <p className="text-lg font-bold">{s.val}</p>
                              <p className="text-[9px] font-semibold">{s.label}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="card p-4">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-slate-500" /> Riwayat Presensi Terakhir
                      </h3>
                      {presensiList.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Belum ada riwayat presensi</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {presensiList.slice(0, 20).map(p => (
                            <div key={p.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status_presensi === 'Hadir' ? 'bg-emerald-500' : p.status_presensi === 'Terlambat' ? 'bg-amber-500' : p.status_presensi === 'Izin' ? 'bg-sky-500' : p.status_presensi === 'Sakit' ? 'bg-violet-500' : p.status_presensi === 'Alfa' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{p.status_presensi || 'Belum Presensi'}</p>
                                <p className="text-[10px] text-slate-400">{p.tanggal} {p.jam_presensi && `• ${p.jam_presensi.slice(0, 5)}`}</p>
                              </div>
                              {p.telat_menit != null && p.telat_menit > 0 && <span className="text-[10px] text-amber-600 font-bold">{p.telat_menit}m</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* RIWAYAT TAB */}
                {activeTab === 'riwayat' && (
                  <div className="space-y-4">
                    {/* Riwayat Telat */}
                    <div className="card p-4">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-amber-600" /> Riwayat Terlambat
                        <span className="ml-auto badge badge-warning text-[10px]">{riwayatTelat.length}</span>
                      </h3>
                      {riwayatTelat.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">Tidak ada riwayat terlambat</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {riwayatTelat.slice(0, 10).map(p => (
                            <div key={p.id} className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5">
                              <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{p.tanggal} • {p.jam_presensi?.slice(0, 5)}</p>
                                {p.telat_menit != null && <p className="text-[10px] text-amber-600">{p.telat_menit} menit terlambat</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Riwayat Izin */}
                    <div className="card p-4">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-sky-600" /> Riwayat Izin
                        <span className="ml-auto badge badge-info text-[10px]">{riwayatIzin.length}</span>
                      </h3>
                      {riwayatIzin.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">Tidak ada riwayat izin</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {riwayatIzin.slice(0, 10).map(i => (
                            <div key={i.id} className="flex items-center gap-3 bg-sky-50 dark:bg-sky-900/20 rounded-xl p-2.5">
                              <FileText className="w-4 h-4 text-sky-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{i.tanggal_mulai} → {i.tanggal_selesai || i.tanggal_mulai}</p>
                                {i.alasan && <p className="text-[10px] text-slate-500 truncate">{i.alasan}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Riwayat Sakit */}
                    <div className="card p-4">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <Heart className="w-4 h-4 text-violet-600" /> Riwayat Sakit
                        <span className="ml-auto badge badge-info text-[10px]">{riwayatSakit.length}</span>
                      </h3>
                      {riwayatSakit.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">Tidak ada riwayat sakit</p>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {riwayatSakit.slice(0, 10).map(i => (
                            <div key={i.id} className="flex items-center gap-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl p-2.5">
                              <Heart className="w-4 h-4 text-violet-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{i.tanggal_mulai} → {i.tanggal_selesai || i.tanggal_mulai}</p>
                                {i.alasan && <p className="text-[10px] text-slate-500 truncate">{i.alasan}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CATATAN TAB */}
                {activeTab === 'catatan' && (
                  <div className="space-y-4">
                    <div className="card p-4">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <StickyNote className="w-4 h-4 text-amber-600" /> Catatan Guru
                        <span className="ml-auto badge badge-info text-[10px]">{catatanList.length}</span>
                      </h3>
                      {catatanList.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Belum ada catatan</p>
                      ) : (
                        <div className="space-y-2">
                          {catatanList.map(c => (
                            <div key={c.id} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                              <p className="text-xs text-slate-700 dark:text-slate-200">{c.catatan || c.isi || '-'}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Jurnal Terakhir */}
                    <div className="card p-4">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <BookOpen className="w-4 h-4 text-violet-600" /> Jurnal Terakhir
                      </h3>
                      {jurnalList.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Belum ada jurnal</p>
                      ) : (
                        <div className="space-y-2">
                          {jurnalList.slice(0, 5).map(j => (
                            <div key={j.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                              <div className="w-9 h-9 bg-violet-50 dark:bg-violet-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-4 h-4 text-violet-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{j.materi || j.pelajaran || 'Jurnal'}</p>
                                <p className="text-[10px] text-slate-400">{new Date(j.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}{j.kelas && ` • ${j.kelas}`}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Penilaian */}
                    <div className="card p-4">
                      <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-sky-600" /> Penilaian Diinput
                        <span className="ml-auto badge badge-success text-[10px]">{detailCount} nilai</span>
                      </h3>
                      {penilaianList.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-4">Belum ada penilaian</p>
                      ) : (
                        <div className="space-y-2">
                          {penilaianList.slice(0, 5).map(p => (
                            <div key={p.id} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl p-2.5">
                              <div className="w-9 h-9 bg-sky-50 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-sky-500" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{p.nama_penilaian}</p>
                                <p className="text-[10px] text-slate-400">{p.mapel || p.kelas} • {new Date(p.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card border-dashed border-slate-200 p-12 text-center">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Pilih ustaz untuk melihat rekap data</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
