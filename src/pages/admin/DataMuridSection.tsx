import { useState, useEffect, useMemo } from 'react';
import { GraduationCap, Search, Users, UserCheck, TrendingUp, ArrowUpCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import SearchableSelect from '../../components/SearchableSelect';
import { useLembaga } from '../../hooks/useLembaga';
import type { ShowToast, Profile, Murid } from '../../types';

const PAGE_SIZE = 10;

type SubTab = 'biodata' | 'riwayat-kelas' | 'mutasi' | 'alumni' | 'naik-kelas';

export default function DataMuridSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [subTab, setSubTab] = useState<SubTab>('biodata');
  const [list, setList] = useState<Murid[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterLembaga, setFilterLembaga] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [kelasOptions, setKelasOptions] = useState<{id: string; nama_kelas: string}[]>([]);
  const { data: lembagaList } = useLembaga();

  const subTabs = [
    { id: 'biodata' as SubTab, label: 'Biodata', icon: GraduationCap },
    { id: 'riwayat-kelas' as SubTab, label: 'Riwayat Kelas', icon: Users },
    { id: 'mutasi' as SubTab, label: 'Mutasi', icon: TrendingUp },
    { id: 'alumni' as SubTab, label: 'Alumni', icon: UserCheck },
    { id: 'naik-kelas' as SubTab, label: 'Naik Kelas', icon: ArrowUpCircle },
  ];

  const isAdmin = profile?.role === 'admin';

  useEffect(() => { fetchList(); }, [filterLembaga, filterKelas]);

  const fetchList = async () => {
    setLoading(true);
    try {
      let q = supabase.from('murid').select('*').order('nama', { ascending: true });
      if (subTab === 'alumni') {
        q = q.eq('status_aktif', false);
      } else {
        q = q.eq('status_aktif', true);
      }
      if (filterLembaga) q = q.eq('lembaga_id', filterLembaga);
      if (filterKelas) q = q.eq('kelas_id', filterKelas);
      if (!isAdmin) q = q.eq('user_id', profile?.id || '');
      const { data, error } = await q;
      if (error) throw error;
      setList((data || []) as Murid[]);
      // Fetch kelas options from kelas table (single source of truth)
      const { data: kelasData } = await supabase.from('kelas').select('id, nama_kelas').eq('is_active', true).order('nama_kelas');
      if (kelasData) setKelasOptions(kelasData.map((k: any) => ({ id: k.id, nama_kelas: k.nama_kelas })));
    } catch (err: any) {
      showToast('Gagal memuat data murid: ' + (err?.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter(m => [m.nama, m.kelas, m.domisili, m.alamat].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [list, search]);

  const lembagaOptions = useMemo(() => (lembagaList || []).map(l => ({ value: l.id, label: l.nama_lembaga })), [lembagaList]);

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Data Murid</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Biodata, riwayat kelas, mutasi, alumni, dan kenaikan kelas</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-1.5">
        {subTabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setSubTab(t.id); setPage(1); }} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all border ${subTab === t.id ? 'bg-sky-600 text-white border-sky-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}>
              <Icon className="w-4 h-4" />
              <span className="truncate text-[10px]">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <SearchableSelect value={filterLembaga} onChange={v => { setFilterLembaga(v); setFilterKelas(''); }} options={lembagaOptions} placeholder="Semua Lembaga" />
        <SearchableSelect value={filterKelas} onChange={v => setFilterKelas(v)} options={kelasOptions.map(k => ({ value: k.id, label: k.nama_kelas }))} placeholder="Semua Kelas" />
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama..." className="input-field text-xs pl-8" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Tidak ada data murid" icon={<GraduationCap className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-1">
          {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(m => {
            const lembagaName = (lembagaList || []).find(l => l.id === m.lembaga_id)?.nama_lembaga;
            return (
              <div key={m.id} className="card p-2.5 flex items-center gap-2.5">
                <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate">{m.nama}</p>
                  <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400">
                    <span className="badge badge-info text-[9px]">{kelasOptions.find(k => k.id === m.kelas_id)?.nama_kelas ?? m.kelas ?? '-'}</span>
                    {lembagaName && <span className="truncate">{lembagaName}</span>}
                    {m.status_aktif === false && <span className="text-rose-500">Non-aktif</span>}
                  </div>
                </div>
              </div>
            );
          })}
          <Pagination currentPage={page} totalPages={Math.ceil(filtered.length / PAGE_SIZE)} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
