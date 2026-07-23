import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, Users, Phone, MapPin, Search, X, Filter, CheckCircle, XCircle, ChevronDown, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SearchableSelect from '../components/SearchableSelect';
import { useLembaga } from '../hooks/useLembaga';
import { useSettings } from '../store/useSettings';
import type { Murid, Profile, ShowToast, Kelas } from '../types';

export default function MuridPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const fuzzyMatch = (query: string, text: string): boolean => {
    const q = query.toLowerCase().trim();
    const t = (text || '').toLowerCase();
    if (t.includes(q)) return true;
    let qi = 0;
    for (let ti = 0; ti < t.length && qi < q.length; ti++) {
      if (t[ti] === q[qi]) qi++;
    }
    return qi === q.length;
  };
  const [muridList, setMuridList] = useState<Murid[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: lembagaList = [] } = useLembaga();
  const { settings } = useSettings();
  const lembagaOptions = useMemo(
    () => lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga })),
    [lembagaList]
  );
  const lembagaNameById = useMemo(() => {
    const m: Record<string, string> = {};
    lembagaList.forEach(l => { m[l.id] = l.nama_lembaga; });
    return m;
  }, [lembagaList]);
  
  const [showModal, setShowModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'murid' && hashParts[1] === 'form';
  });
  const [showDeleteModal, setShowDeleteModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'murid' && hashParts[1] === 'delete';
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterKelas, setFilterKelas] = useState<string>('all');
  const [filterLembaga, setFilterLembaga] = useState<string>(settings.selectedLembaga || 'all');
  const [filterGender, setFilterGender] = useState<string>('');

  // State Baru untuk kontrol Dropdown Modern Kelas
  const [kelasSearchInput, setKelasSearchInput] = useState('');
  const [isKelasDropdownOpen, setIsKelasDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    nama: '',
    kelas: '',
    kelas_id: '',
    domisili: '',
    alamat: '',
    nomor_whatsapp: '',
    status_aktif: true,
    lembaga_id: '',
  });

  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'murid') {
        if (hashParts[1] === 'form') {
          setShowModal(true);
          setShowDeleteModal(false);
        } else if (hashParts[1] === 'delete') {
          setShowModal(false);
          setShowDeleteModal(true);
        } else {
          setShowModal(false);
          setShowDeleteModal(false);
          setEditingId(null);
          setDeletingId(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleCloseFormModal = () => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'form') {
      window.history.back();
    } else {
      setShowModal(false);
      resetForm();
    }
  };

  const handleCloseDeleteModal = () => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'delete') {
      window.history.back();
    } else {
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  const fetchMurid = async () => {
    setLoading(true);
    try {
      const scope = await getUstazScope(profile);

      // Fetch kelas objects with IDs
      const { data: kelasData } = await supabase
        .from('kelas')
        .select('id, nama_kelas, lembaga_id, aktif, gender')
        .eq('aktif', true)
        .order('nama_kelas');
      const kelasObjList = (kelasData ?? []) as Kelas[];
      setKelasList(kelasObjList);

      const { data, error } = await supabase
        .from('murid')
        .select('*')
        .order('nama');

      if (error) throw error;
      if (data) {
        let muridData = data as Murid[];
        if (!scope.isAdmin) {
          // Show murid in ustaz's classes OR murid they personally added
          muridData = muridData.filter(m =>
            (m.kelas_id != null && scope.kelasIds.includes(m.kelas_id)) ||
            m.user_id === profile?.id
          );
        }
        setMuridList(muridData);
      }
    } catch (error: any) {
      showToast(error.message || 'Gagal mengambil data murid', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMurid();
  }, []);

  const kelasOptions = useMemo(() => {
    let result = kelasList as Kelas[];
    if (form.lembaga_id) {
      result = result.filter(k => !k.lembaga_id || k.lembaga_id === form.lembaga_id);
    }
    return result;
  }, [kelasList, form.lembaga_id]);

  const formKelasOptions = useMemo(() => {
    const result = kelasList as Kelas[];
    if (form.lembaga_id) {
      return result.filter(k => !k.lembaga_id || k.lembaga_id === form.lembaga_id);
    }
    return result;
  }, [kelasList, form.lembaga_id]);

  // Memfilter pilihan kelas di form input berdasarkan ketikan user
  const filteredFormKelasOptions = useMemo(() => {
    return formKelasOptions.filter(k =>
      (k.nama_kelas ?? '').toLowerCase().includes(kelasSearchInput.toLowerCase())
    );
  }, [formKelasOptions, kelasSearchInput]);

  // Cek apakah ada kecocokan teks yang persis sama antara input ketikan dengan kelas yang sudah ada
  const hasExactKelasMatch = useMemo(() => {
    return formKelasOptions.some(k => (k.nama_kelas ?? '').toLowerCase() === kelasSearchInput.toLowerCase().trim());
  }, [formKelasOptions, kelasSearchInput]);

  const filteredMuridList = useMemo(() => {
    return muridList.filter(m => {
      const matchesSearch = search.trim() === '' || fuzzyMatch(search, m.nama) || (m.domisili && fuzzyMatch(search, m.domisili));
      const matchesKelas = filterKelas === 'all' || m.kelas_id === filterKelas;
      const matchesLembaga = filterLembaga === 'all' || m.lembaga_id === filterLembaga;
      const kelasObj = kelasList.find(k => k.id === m.kelas_id);
      const matchesGender = !filterGender || (kelasObj && kelasObj.gender === filterGender);
      return matchesSearch && matchesKelas && matchesLembaga && matchesGender;
    });
  }, [muridList, search, filterKelas, filterLembaga, filterGender, kelasList]);

  const resetForm = () => {
    setEditingId(null);
    setKelasSearchInput('');
    setIsKelasDropdownOpen(false);
    setForm({
      nama: '',
      kelas: '',
      kelas_id: '',
      domisili: '',
      alamat: '',
      nomor_whatsapp: '',
      status_aktif: true,
      lembaga_id: '',
    });
  };

  const openEdit = (murid: any) => {
    setEditingId(murid.id);
    const kelasNama = (kelasList as Kelas[]).find(k => k.id === murid.kelas_id)?.nama_kelas ?? murid.kelas ?? '';
    setKelasSearchInput(kelasNama);
    setForm({
      nama: murid.nama || '',
      kelas: kelasNama,
      kelas_id: murid.kelas_id || '',
      domisili: murid.domisili || '',
      alamat: murid.alamat || '',
      nomor_whatsapp: murid.nomor_whatsapp || '',
      status_aktif: murid.status_aktif !== undefined ? murid.status_aktif : true,
      lembaga_id: murid.lembaga_id || murid.lembaga || '',
    });
    setShowModal(true);
    window.history.pushState(null, '', '#murid/form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.kelas_id) {
      showToast('Nama dan Kelas wajib diisi!', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nama: form.nama,
        kelas: form.kelas,
        kelas_id: form.kelas_id || null,
        domisili: form.domisili,
        alamat: form.alamat,
        nomor_whatsapp: form.nomor_whatsapp,
        status_aktif: form.status_aktif,
        lembaga_id: form.lembaga_id || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('murid')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;
        showToast('Data santri berhasil diperbarui', 'success');
      } else {
        const { data: inserted, error } = await supabase
          .from('murid')
          .insert([payload])
          .select('id')
          .maybeSingle();

        if (error) throw error;

        // Send admin notification when non-admin ustaz adds a new murid
        if (profile?.role !== 'admin') {
          await supabase.from('admin_notifications').insert({
            type: 'new_murid',
            title: 'Santri Baru Ditambahkan',
            message: `Ustaz ${profile?.nama_lengkap || profile?.nama_panggilan || 'Unknown'} menambahkan santri baru: ${form.nama} (Kelas: ${form.kelas || '-'})`,
            data: { murid_id: inserted?.id, nama: form.nama, kelas: form.kelas, lembaga_id: form.lembaga_id },
            created_by: profile?.id,
            created_by_name: profile?.nama_lengkap || profile?.nama_panggilan,
          });
        }
        showToast('Santri baru berhasil ditambahkan', 'success');
      }

      handleCloseFormModal();
      fetchMurid();
    } catch (error: any) {
      showToast(error.message || 'Gagal menyimpan data', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const targetMurid = muridList.find(m => m.id === deletingId);
    if (targetMurid && profile?.role !== 'admin' && targetMurid.user_id !== profile?.id) {
      showToast('Anda hanya bisa menghapus santri yang Anda tambahkan sendiri', 'error');
      handleCloseDeleteModal();
      return;
    }
    try {
      const { error } = await supabase
        .from('murid')
        .delete()
        .eq('id', deletingId);

      if (error) throw error;
      showToast('Data santri berhasil dihapus', 'success');
      
      handleCloseDeleteModal();
      fetchMurid();
    } catch (error: any) {
      showToast(error.message || 'Gagal menghapus data', 'error');
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Manajemen Santri</h1>
            <p className="text-[11px] text-slate-500">Total: {filteredMuridList.length} Santri</p>
          </div>
        </div>
        <button
          onClick={() => { 
            resetForm(); 
            setShowModal(true); 
            window.history.pushState(null, '', '#murid/form');
          }}
          className="btn-primary flex items-center justify-center gap-2 text-xs font-semibold py-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Santri
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <select
            value={filterLembaga}
            onChange={(e) => { setFilterLembaga(e.target.value); setFilterKelas('all'); setFilterGender(''); }}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs md:text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="all">Semua Lembaga</option>
            {lembagaList.map((l: any) => (
              <option key={l.id} value={l.id}>{l.nama_lembaga}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <select
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs md:text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="">Semua Gender</option>
            {settings.genderOptions.map(g => (
              <option key={g} value={g}>
                {g === 'Banin' ? settings.genderLabelBanin : g === 'Banat' ? settings.genderLabelBanat : settings.genderLabelCampuran}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs md:text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="all">Semua Kelas</option>
            {kelasOptions
              .filter(k => filterLembaga === 'all' || !k.lembaga_id || k.lembaga_id === filterLembaga)
              .filter(k => !filterGender || !k.gender || k.gender === filterGender)
              .map(k => (
                <option key={k.id} value={k.id}>Kelas {k.nama_kelas}</option>
              ))}
          </select>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={filterLembaga !== 'all' && filterKelas !== 'all' ? "Cari nama santri..." : "Pilih lembaga & kelas dulu"}
            disabled={filterLembaga === 'all' || filterKelas === 'all'}
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Memuat data santri...</p>
        </div>
      ) : filteredMuridList.length === 0 ? (
        <EmptyState
          title="Tidak ada data santri"
          description={search || filterKelas !== 'all' || filterLembaga !== 'all' || filterGender ? "Tidak ada hasil yang cocok dengan filter pencarian Anda." : "Belum ada data santri yang ditambahkan."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMuridList.map((murid: any) => {
            const lembagaNama = (murid.lembaga_id || murid.lembaga) ? lembagaNameById[murid.lembaga_id || murid.lembaga] : undefined;
            const isOwner = profile?.role === 'admin' || murid.user_id === profile?.id;
            return (
            <div key={murid.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all group relative">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-1">{murid.nama}</h3>
                    {murid.status_aktif === false ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-rose-50 text-rose-600 border border-rose-100">
                        <XCircle className="w-2.5 h-2.5" /> Non-aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <CheckCircle className="w-2.5 h-2.5" /> Aktif
                      </span>
                    )}
                    {!isOwner && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                        Hanya lihat
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-emerald-600 mt-1">Kelas {(kelasList as Kelas[]).find(k => k.id === murid.kelas_id)?.nama_kelas ?? murid.kelas ?? '-'}</p>
                  {lembagaNama && (
                    <span className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-sky-50 text-sky-700 border border-sky-100">
                      {lembagaNama}
                    </span>
                  )}
                </div>

                {isOwner && (
                <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(murid)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Ubah Data"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { 
                      setDeletingId(murid.id); 
                      setShowDeleteModal(true); 
                      window.history.pushState(null, '', '#murid/delete');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Hapus Data"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                )}
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                {murid.nomor_whatsapp && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{murid.nomor_whatsapp}</span>
                  </div>
                )}
                {murid.domisili && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span className="line-clamp-1">{murid.domisili}</span>
                  </div>
                )}
                {murid.alamat && (
                  <p className="text-slate-400 italic line-clamp-2 mt-1 pl-5">"{murid.alamat}"</p>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Modal Form Tambah / Edit */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseFormModal}
        title={editingId ? 'Ubah Data Santri' : 'Tambah Santri Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={form.nama}
              onChange={e => setForm(p => ({ ...p, nama: e.target.value }))}
              className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Masukkan nama lengkap..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lembaga (Modern Search)</label>
            <SearchableSelect
              value={form.lembaga_id}
              onChange={v => setForm(p => ({ ...p, lembaga_id: v }))}
              options={lembagaOptions}
              placeholder="Ketik nama lembaga..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* INPUT KELAS BERMODEL COMBOBOX MODERN */}
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ketik & cari kelas..."
                  value={kelasSearchInput}
                  onChange={(e) => {
                    setKelasSearchInput(e.target.value);
                    setForm(p => ({ ...p, kelas: e.target.value, kelas_id: '' }));
                    setIsKelasDropdownOpen(true);
                  }}
                  onFocus={() => setIsKelasDropdownOpen(true)}
                  className="w-full p-2 pr-8 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>

              {/* Dropdown List untuk Kelas */}
              {isKelasDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsKelasDropdownOpen(false)} />
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    {filteredFormKelasOptions.map(k => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => {
                          setForm(p => ({ ...p, kelas: k.nama_kelas, kelas_id: k.id }));
                          setKelasSearchInput(k.nama_kelas);
                          setIsKelasDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors flex items-center justify-between ${form.kelas_id === k.id ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                      >
                        <span>Kelas {k.nama_kelas}</span>
                        {form.kelas_id === k.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}

                    {/* Fitur Utama: Muncul tombol Tambah Kelas Baru jika tidak ada karakter serupa/kembar */}
                    {kelasSearchInput.trim() !== '' && !hasExactKelasMatch && (
                      <button
                        type="button"
                        onClick={async () => {
                          const newKelas = kelasSearchInput.trim();
                          try {
                            const { data: newKelasRec, error: kelasError } = await supabase
                              .from('kelas')
                              .insert({
                                nama_kelas: newKelas,
                                is_active: true,
                                aktif: true,
                                lembaga_id: form.lembaga_id || null,
                              })
                              .select('id, nama_kelas')
                              .maybeSingle();

                            if (kelasError) throw kelasError;

                            setForm(p => ({ ...p, kelas: newKelas, kelas_id: newKelasRec?.id ?? '' }));
                            setKelasSearchInput(newKelas);
                            setIsKelasDropdownOpen(false);

                            await fetchMurid();

                            if (profile?.role !== 'admin') {
                              await supabase.from('admin_notifications').insert({
                                type: 'new_kelas',
                                title: 'Kelas Baru Ditambahkan',
                                message: `Ustaz ${profile?.nama_lengkap || profile?.nama_panggilan || 'Unknown'} menambahkan kelas baru: ${newKelas}`,
                                data: { kelas_id: newKelasRec?.id, nama_kelas: newKelas, lembaga_id: form.lembaga_id },
                                created_by: profile?.id,
                                created_by_name: profile?.nama_lengkap || profile?.nama_panggilan,
                              });
                            }

                            showToast(`Kelas "${newKelas}" berhasil dibuat`, 'success');
                          } catch (err: any) {
                            showToast(err.message || 'Gagal membuat kelas baru', 'error');
                          }
                        }}
                        className="w-full text-left px-3 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 transition-colors sticky bottom-0 shadow-md"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah kelas baru: "{kelasSearchInput}"
                      </button>
                    )}

                    {filteredFormKelasOptions.length === 0 && kelasSearchInput.trim() === '' && (
                      <p className="text-center py-3 text-xs text-slate-400">Belum ada kelas tersedia</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status Aktif</label>
              <select
                value={form.status_aktif ? 'true' : 'false'}
                onChange={e => setForm(p => ({ ...p, status_aktif: e.target.value === 'true' }))}
                className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="true">Aktif</option>
                <option value="false">Non-aktif</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">No. WhatsApp (Opsional)</label>
            <input
              type="tel"
              value={form.nomor_whatsapp}
              onChange={e => setForm(p => ({ ...p, nomor_whatsapp: e.target.value }))}
              className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="08xx..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Domisili (Opsional)</label>
            <input
              type="text"
              value={form.domisili}
              onChange={e => setForm(p => ({ ...p, domisili: e.target.value }))}
              className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Kota/Kecamatan asal..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alamat Lengkap (Opsional)</label>
            <textarea
              value={form.alamat}
              onChange={e => setForm(p => ({ ...p, alamat: e.target.value }))}
              className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              rows={2}
              placeholder="Alamat lengkap rumah..."
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseFormModal}
              className="btn-secondary flex-1 text-sm py-2"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 text-sm py-2"
            >
              {saving ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Konfirmasi Hapus */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        title="Hapus Data Santri"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus data santri ini? Tindakan ini bersifat permanen dan data riwayat absensi atau nilai yang terikat mungkin akan ikut terpengaruh.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCloseDeleteModal}
              className="btn-secondary flex-1 text-sm"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl transition-all flex-1 text-sm"
            >
              Ya, Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
