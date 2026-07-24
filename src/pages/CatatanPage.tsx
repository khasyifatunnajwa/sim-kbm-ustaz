import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Pencil, FileText, Calendar, MapPin, CheckCircle,
  Circle, Search, X, Bell, Share2, Download
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { namaHari } from '../lib/utils';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchableSelect from '../components/SearchableSelect';
import { useLembaga } from '../hooks/useLembaga';
import { generatePDF, shareWA } from '../lib/pdf';
import type { CatatanGuru, ShowToast, KategoriCatatan, StatusCatatan, Profile } from '../types';

const KATEGORI_CONFIG: Record<KategoriCatatan, { color: string; bg: string; border: string }> = {
  Umum:     { color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
  Acara:    { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Undangan: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Agenda:   { color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200' },
};

const KATEGORI_LIST: KategoriCatatan[] = ['Umum', 'Acara', 'Undangan', 'Agenda'];
const STATUS_LIST: StatusCatatan[] = ['Belum Selesai', 'Selesai'];

// Opsi untuk SearchableSelect pada field kategori
const KATEGORI_OPTIONS = KATEGORI_LIST.map(k => ({ value: k, label: k }));

export default function CatatanPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  // useLembaga diimpor sesuai permintaan; tabel catatan_guru tidak memiliki
  // kolom lembaga_id, sehingga hook ini tidak digunakan untuk menyaring data,
  // tetapi tetap dipanggil agar konsisten dengan halaman lain.
  useLembaga();

  const [catatanList, setCatatanList] = useState<CatatanGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. MODIFIKASI: Baca status modal dari Hash URL saat awal muat
  const [showModal, setShowModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'catatan' && hashParts[1] === 'form';
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState<KategoriCatatan | ''>('');
  const [filterStatus, setFilterStatus] = useState<StatusCatatan | ''>('');

  // State untuk ConfirmDialog hapus (soft delete)
  const [deleteTarget, setDeleteTarget] = useState<CatatanGuru | null>(null);

  const now = new Date();
  const defaultDateTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    kategori: 'Umum' as KategoriCatatan,
    judul: '',
    isi: '',
    tanggal_waktu: defaultDateTime,
    lokasi: '',
    status: 'Belum Selesai' as StatusCatatan,
  });

  // 2. SINKRONISASI MODAL DENGAN TOMBOL BACK HP
  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'catatan') {
        if (hashParts[1] === 'form') {
          setShowModal(true);
        } else {
          setShowModal(false);
          setEditingId(null);
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
      setEditingId(null);
    }
  };

  useEffect(() => {
    fetchCatatan();
  }, []);

  // 7. REALTIME: subscribe ke perubahan catatan_guru agar data baru muncul tanpa refresh
  useEffect(() => {
    const channel = supabase
      .channel('catatan_guru_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catatan_guru' },
        (payload) => {
          const row = payload.new as CatatanGuru;
          // Abaikan baris yang sudah di-soft-delete / non-aktif
          if (row && !row.is_active && row.deleted_at) {
            setCatatanList(prev => prev.filter(c => c.id !== row.id));
            return;
          }
          if (payload.eventType === 'INSERT' && row) {
            // Admin melihat semua; non-admin hanya miliknya sendiri
            const isAdmin = profile?.role === 'admin';
            if (isAdmin || row.user_id === profile?.id) {
              setCatatanList(prev => prev.some(c => c.id === row.id) ? prev : [row, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE' && row) {
            const isAdmin = profile?.role === 'admin';
            if (!row.is_active) {
              setCatatanList(prev => prev.filter(c => c.id !== row.id));
            } else if (isAdmin || row.user_id === profile?.id) {
              setCatatanList(prev => prev.map(c => (c.id === row.id ? row : c)));
            } else {
              // Jika sebelumnya terlihat (admin) tapi sekarang bukan milik & non-admin, buang
              setCatatanList(prev => prev.filter(c => c.id !== row.id));
            }
          } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as { id?: string } | undefined;
            if (oldRow?.id) {
              setCatatanList(prev => prev.filter(c => c.id !== oldRow.id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, profile?.role]);

  const fetchCatatan = async () => {
    setLoading(true);
    const isAdmin = profile?.role === 'admin';
    let q = supabase
      .from('catatan_guru')
      .select('*')
      .eq('is_active', true)
      .is('deleted_at', null);
    if (!isAdmin) q = q.eq('user_id', profile?.id ?? '');
    const { data, error } = await q.order('created_at', { ascending: false });

    if (error) {
      showToast(error.message, 'error');
    } else {
      setCatatanList((data || []) as CatatanGuru[]);
    }
    setLoading(false);
  };

  const filteredCatatan = useMemo(() => {
    return catatanList.filter(c => {
      const matchesSearch = search
        ? c.judul.toLowerCase().includes(search.toLowerCase()) ||
          (c.isi && c.isi.toLowerCase().includes(search.toLowerCase()))
        : true;
      const matchesKategori = filterKategori ? c.kategori === filterKategori : true;
      const matchesStatus = filterStatus ? c.status === filterStatus : true;
      return matchesSearch && matchesKategori && matchesStatus;
    });
  }, [catatanList, search, filterKategori, filterStatus]);

  // 4. MENDORONG HASH SAAT BUKA MODAL
  const openAdd = () => {
    setEditingId(null);
    setForm({
      kategori: 'Umum',
      judul: '',
      isi: '',
      tanggal_waktu: defaultDateTime,
      lokasi: '',
      status: 'Belum Selesai',
    });
    setShowModal(true);
    window.history.pushState(null, '', '#catatan/form');
  };

  // 4. MENDORONG HASH SAAT BUKA MODAL EDIT
  const openEdit = (c: CatatanGuru) => {
    // Hanya pemilik yang boleh mengedit
    if (c.user_id !== profile?.id) {
      showToast('Anda hanya dapat mengedit catatan milik sendiri', 'error');
      return;
    }
    setEditingId(c.id);
    setForm({
      kategori: c.kategori,
      judul: c.judul,
      isi: c.isi || '',
      tanggal_waktu: c.tanggal_waktu ? c.tanggal_waktu.slice(0, 16) : defaultDateTime,
      lokasi: c.lokasi || '',
      status: c.status,
    });
    setShowModal(true);
    window.history.pushState(null, '', '#catatan/form');
  };

  // 6. BUAT NOTIFIKASI untuk setiap ustaz (role != admin, is_active=true) saat catatan baru dibuat
  const createNotifications = async (catatanGuruId: string) => {
    try {
      const { data: ustazList, error: ustazError } = await supabase
        .from('profiles')
        .select('id')
        .neq('role', 'admin')
        .eq('is_active', true);

      if (ustazError) {
        console.error('Gagal mengambil daftar ustaz untuk notifikasi:', ustazError.message);
        return;
      }
      if (!ustazList || ustazList.length === 0) return;

      const rows = ustazList.map(u => ({
        catatan_guru_id: catatanGuruId,
        user_id: u.id,
        dibaca: false,
      }));

      const { error: notifError } = await supabase
        .from('catatan_guru_notifikasi')
        .insert(rows);

      if (notifError) {
        console.error('Gagal membuat notifikasi catatan_guru:', notifError.message);
      }
    } catch (err) {
      console.error('createNotifications error:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul) {
      showToast('Judul wajib diisi', 'error');
      return;
    }

    setSaving(true);
    const payload = {
      kategori: form.kategori,
      judul: form.judul,
      isi: form.isi || null,
      tanggal_waktu: form.tanggal_waktu ? new Date(form.tanggal_waktu).toISOString() : null,
      lokasi: form.lokasi || null,
      status: form.status,
    };

    let error;
    let insertedId: string | null = null;
    if (editingId) {
      ({ error } = await supabase.from('catatan_guru').update(payload).eq('id', editingId));
    } else {
      const { data: insData, error: insError } = await supabase
        .from('catatan_guru')
        .insert(payload)
        .select('id')
        .single();
      error = insError;
      insertedId = insData?.id ?? null;
    }

    setSaving(false);
    if (error) {
      showToast(error.message, 'error');
      return;
    }

    // Buat notifikasi hanya untuk catatan baru
    if (!editingId && insertedId) {
      createNotifications(insertedId);
    }

    showToast(editingId ? 'Catatan diperbarui!' : 'Catatan disimpan!', 'success');

    // PERUBAHAN: Memanggil handleCloseModal agar kembali otomatis secara native
    handleCloseModal();
    fetchCatatan();
  };

  const toggleStatus = async (c: CatatanGuru) => {
    // Hanya pemilik yang boleh mengubah status catatannya
    if (c.user_id !== profile?.id) {
      showToast('Anda hanya dapat mengubah catatan milik sendiri', 'error');
      return;
    }
    const newStatus = c.status === 'Belum Selesai' ? 'Selesai' : 'Belum Selesai';
    const { error } = await supabase.from('catatan_guru').update({ status: newStatus }).eq('id', c.id);
    if (error) {
      showToast(error.message, 'error');
      return;
    }
    setCatatanList(prev => prev.map(item => item.id === c.id ? { ...item, status: newStatus } : item));
    showToast(newStatus === 'Selesai' ? 'Catatan selesai!' : 'Catatan dibuka kembali', 'success');
  };

  // 5. SOFT DELETE: set is_active=false & deleted_at=now() (hanya pemilik)
  const requestDelete = (c: CatatanGuru) => {
    if (c.user_id !== profile?.id) {
      showToast('Anda hanya dapat menghapus catatan milik sendiri', 'error');
      return;
    }
    setDeleteTarget(c);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('catatan_guru')
      .update({ is_active: false, deleted_at: new Date().toISOString() })
      .eq('id', deleteTarget.id);
    if (error) {
      showToast(error.message, 'error');
      setDeleteTarget(null);
      return;
    }
    setCatatanList(prev => prev.filter(c => c.id !== deleteTarget.id));
    showToast('Catatan dihapus', 'info');
    setDeleteTarget(null);
  };

  const exportCatatanPDF = () => {
    if (filteredCatatan.length === 0) return;
    const headers = ['No', 'Judul', 'Kategori', 'Status', 'Tanggal/Waktu', 'Lokasi'];
    const body = filteredCatatan.map((c, i) => [
      i + 1,
      c.judul,
      c.kategori,
      c.status,
      c.tanggal_waktu ? new Date(c.tanggal_waktu).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-',
      c.lokasi || '-',
    ]);
    generatePDF(
      'Catatan Guru',
      headers, body,
      [
        filterKategori ? `Kategori: ${filterKategori}` : 'Semua Kategori',
        `Cetak: ${new Date().toLocaleDateString('id-ID')}`,
      ]
    );
    showToast('PDF berhasil diunduh', 'success');
  };

  const shareCatatanWA = () => {
    if (filteredCatatan.length === 0) return;
    let text = `*CATATAN GURU*\n`;
    if (filterKategori) text += `Kategori: ${filterKategori}\n`;
    text += `\n`;
    filteredCatatan.forEach((c, i) => {
      const statusIcon = c.status === 'Selesai' ? '✓' : '○';
      text += `${i + 1}. ${statusIcon} *${c.judul}* [${c.kategori}]\n`;
      if (c.isi) text += `   ${c.isi}\n`;
      if (c.tanggal_waktu) text += `   ${formatDateTime(c.tanggal_waktu)}\n`;
      if (c.lokasi) text += `   Lokasi: ${c.lokasi}\n`;
    });
    text += `\nTotal: ${filteredCatatan.length} catatan`;
    shareWA(text);
  };

  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return `${namaHari[date.getDay()]}, ${date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const isUpcoming = (d: string) => new Date(d) >= new Date();

  const stats = useMemo(() => ({
    total: catatanList.length,
    belumSelesai: catatanList.filter(c => c.status === 'Belum Selesai').length,
    selesai: catatanList.filter(c => c.status === 'Selesai').length,
  }), [catatanList]);

  // Apakah catatan ini milik user saat ini?
  const isOwner = (c: CatatanGuru) => c.user_id === profile?.id;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">Catatan Guru</h2>
          <p className="section-subtitle">{stats.belumSelesai} belum selesai, {stats.selesai} selesai</p>
        </div>
        <div className="flex items-center gap-1.5">
          {filteredCatatan.length > 0 && (
            <>
              <button onClick={exportCatatanPDF} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
                <FileText className="w-3.5 h-3.5" /> PDF
              </button>
              <button onClick={shareCatatanWA} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors">
                <Share2 className="w-3.5 h-3.5" /> WA
              </button>
            </>
          )}
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari catatan..."
            className="input-field text-sm pl-9 pr-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={filterKategori}
            onChange={e => setFilterKategori(e.target.value as KategoriCatatan | '')}
            className="input-field text-xs py-2"
          >
            <option value="">Semua Kategori</option>
            {KATEGORI_LIST.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as StatusCatatan | '')}
            className="input-field text-xs py-2"
          >
            <option value="">Semua Status</option>
            {STATUS_LIST.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-4 animate-pulse h-24 bg-slate-50 rounded-2xl" />
          ))}
        </div>
      ) : filteredCatatan.length === 0 ? (
        <EmptyState
          title="Belum ada catatan"
          description="Tambahkan catatan untuk mengorganisir kegiatan Anda."
          icon={<FileText className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-3">
          {filteredCatatan.map(c => {
            const config = KATEGORI_CONFIG[c.kategori];
            const isDone = c.status === 'Selesai';
            const upcoming = c.tanggal_waktu && isUpcoming(c.tanggal_waktu);
            const canModify = isOwner(c);

            return (
              <div
                key={c.id}
                className={`card p-4 group ${isDone ? 'opacity-60' : ''} ${upcoming ? 'border-l-4 border-l-emerald-400' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleStatus(c)}
                    disabled={!canModify}
                    className={`mt-0.5 ${isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'} transition-colors ${!canModify ? 'cursor-not-allowed opacity-50' : ''}`}
                    title={canModify ? 'Ubah status' : 'Hanya pemilik yang dapat mengubah'}
                  >
                    {isDone ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`font-bold text-sm ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {c.judul}
                      </span>
                      <span className={`badge text-[10px] ${config.bg} ${config.color} border ${config.border}`}>
                        {c.kategori}
                      </span>
                      {/* Badge pemilik: tandai catatan milik sendiri vs milik ustaz lain (admin view) */}
                      {canModify ? (
                        <span className="badge text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Bell className="w-2.5 h-2.5 mr-0.5" />Milik Anda
                        </span>
                      ) : (
                        <span className="badge text-[10px] bg-slate-50 text-slate-500 border border-slate-200">
                          Ustaz lain
                        </span>
                      )}
                    </div>

                    {c.isi && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{c.isi}</p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      {c.tanggal_waktu && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(c.tanggal_waktu)}
                        </span>
                      )}
                      {c.lokasi && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {c.lokasi}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-1 transition-opacity ${canModify ? 'opacity-0 group-hover:opacity-100' : 'opacity-40'}`}>
                    <button
                      onClick={() => openEdit(c)}
                      disabled={!canModify}
                      className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title={canModify ? 'Edit' : 'Hanya pemilik yang dapat mengedit'}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => requestDelete(c)}
                      disabled={!canModify}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title={canModify ? 'Hapus' : 'Hanya pemilik yang dapat menghapus'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah/Edit Catatan Guru */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal} // PERUBAHAN
        title={editingId ? 'Edit Catatan' : 'Tambah Catatan'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Kategori</label>
            {/* SearchableSelect untuk field kategori */}
            <SearchableSelect
              value={form.kategori}
              onChange={(v) => setForm(p => ({ ...p, kategori: v as KategoriCatatan }))}
              options={KATEGORI_OPTIONS}
              placeholder="Pilih kategori..."
            />
            {/* Tampilan visual badge kategori (opsional, selaras desain sebelumnya) */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {KATEGORI_LIST.map(k => {
                const config = KATEGORI_CONFIG[k];
                return (
                  <span
                    key={k}
                    className={`badge text-[10px] ${form.kategori === k ? `${config.bg} ${config.color} ${config.border}` : 'bg-white text-slate-400 border-slate-200'}`}
                  >
                    {k}
                  </span>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Judul *</label>
            <input
              type="text"
              value={form.judul}
              onChange={e => setForm(p => ({ ...p, judul: e.target.value }))}
              className="input-field text-sm"
              placeholder="Judul catatan..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Isi Catatan</label>
            <textarea
              value={form.isi}
              onChange={e => setForm(p => ({ ...p, isi: e.target.value }))}
              className="input-field text-sm resize-none"
              rows={3}
              placeholder="Detail catatan..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal & Waktu</label>
              <input
                type="datetime-local"
                value={form.tanggal_waktu}
                onChange={e => setForm(p => ({ ...p, tanggal_waktu: e.target.value }))}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Lokasi</label>
              <input
                type="text"
                value={form.lokasi}
                onChange={e => setForm(p => ({ ...p, lokasi: e.target.value }))}
                className="input-field text-sm"
                placeholder="Tempat..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_LIST.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, status: s }))}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${form.status === s ? (s === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200') : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {/* PERUBAHAN: Gunakan handleCloseModal */}
            <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1 text-sm">
              Batal
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ConfirmDialog untuk soft delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Hapus Catatan"
        message={`Yakin ingin menghapus catatan "${deleteTarget?.judul ?? ''}"? Catatan akan dipindahkan ke sampah (soft delete).`}
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}
