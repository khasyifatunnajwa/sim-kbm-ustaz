import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Send, FileText, Calendar, Clock, User, BookOpen, Users, Share2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SearchableSelect from '../components/SearchableSelect';
import { useLembaga } from '../hooks/useLembaga';
import { shareWA } from '../lib/pdf';
import type { IzinMengajar, Profile, ShowToast } from '../types';

const JENIS_IZIN = ['Sakit', 'Bepergian', 'Tugas Pesantren', 'Lainnya'] as const;
const STATUS_STYLE: Record<string, string> = {
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-rose-100 text-rose-700',
};

export default function IzinPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const { data: lembagaList = [] } = useLembaga();
  const [list, setList] = useState<IzinMengajar[]>([]);
  const [kelasList, setKelasList] = useState<{id: string; nama_kelas: string}[]>([]);
  const [mapelList, setMapelList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. MODIFIKASI: Baca status modal dari Hash URL saat awal muat
  const [showModal, setShowModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'izin' && hashParts[1] === 'form';
  });

  const today = new Date().toISOString().split('T')[0];
  // Form state now includes lembaga_id
  const [form, setForm] = useState({
    lembaga_id: '',
    jenis_izin: 'Sakit' as string,
    jenis_lainnya: '',
    lama_izin: 'hari_ini' as 'hari_ini' | 'beberapa_hari',
    tanggal_mulai: today,
    tanggal_selesai: '',
    mata_pelajaran: '',
    kelas: '',
    kelas_id: '',
    guru_pengganti: '',
    catatan: '',
  });

  // Lembaga options for SearchableSelect
  const lembagaOptions = useMemo(
    () => lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga })),
    [lembagaList]
  );

  // Kelas dropdown filters by selected lembaga - from kelas table
  const kelasFiltered = useMemo(() => {
    let result = kelasList;
    if (form.lembaga_id) result = result.filter(k => !('lembaga_id' in k) || !k.lembaga_id || k.lembaga_id === form.lembaga_id);
    return result;
  }, [kelasList, form.lembaga_id]);

  // Refetch kelas options when lembaga changes - from kelas table
  useEffect(() => {
    if (!form.lembaga_id) return;
    (async () => {
      const { data } = await supabase
        .from('kelas')
        .select('id, nama_kelas, lembaga_id')
        .eq('aktif', true)
        .eq('lembaga_id', form.lembaga_id)
        .order('nama_kelas');
      if (data) setKelasList(data as {id: string; nama_kelas: string}[]);
    })();
  }, [form.lembaga_id]);

  // 2. SINKRONISASI MODAL DENGAN TOMBOL BACK HP
  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'izin' && hashParts[1] === 'form') {
        setShowModal(true);
      } else {
        setShowModal(false);
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
    }
  };

  const fetchList = async () => {
    setLoading(true);
    const isAdmin = profile?.role === 'admin';
    let q = supabase.from('izin_mengajar').select('*').order('created_at', { ascending: false });
    if (!isAdmin) q = q.eq('user_id', profile?.id ?? '');
    const { data, error } = await q;
    if (error) {
      showToast(error.message, 'error');
    } else {
      setList((data || []) as IzinMengajar[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const scope = await getUstazScope(profile);
      const { data: kelasData } = await supabase.from('kelas').select('id, nama_kelas').eq('aktif', true).order('nama_kelas');
      if (kelasData) setKelasList(kelasData as {id: string; nama_kelas: string}[]);
      setMapelList(scope.mapelList);
      fetchList();
    })();
  }, [profile]);

  // 4. MENDORONG HASH SAAT BUKA MODAL
  const openAdd = () => {
    setForm({
      lembaga_id: lembagaList[0]?.id ?? '',
      jenis_izin: 'Sakit',
      jenis_lainnya: '',
      lama_izin: 'hari_ini',
      tanggal_mulai: today,
      tanggal_selesai: '',
      mata_pelajaran: mapelList[0] || '',
      kelas: '',
      kelas_id: '',
      guru_pengganti: '',
      catatan: '',
    });
    setShowModal(true);
    window.history.pushState(null, '', '#izin/form');
  };

  const getJenisLabel = () => form.jenis_izin === 'Lainnya' ? (form.jenis_lainnya || 'Lainnya') : form.jenis_izin;

  // ===== SHARE BUTTON: Save + Share WA + Update presensi =====
  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mata_pelajaran || !form.kelas) {
      showToast('Mata pelajaran dan kelas wajib diisi', 'error');
      return;
    }
    if (form.jenis_izin === 'Lainnya' && !form.jenis_lainnya.trim()) {
      showToast('Jelaskan jenis izin pada kolom Lainnya', 'error');
      return;
    }

    const namaUstaz = profile?.nama_panggilan || profile?.nama_lengkap || 'Ustaz';
    setSaving(true);

    // a. Save the izin data to izin_mengajar table
    const payload = {
      nama_ustaz: namaUstaz,
      jenis_izin: getJenisLabel(),
      lama_izin: form.lama_izin,
      tanggal_mulai: form.tanggal_mulai,
      tanggal_selesai: form.lama_izin === 'hari_ini' ? form.tanggal_mulai : (form.tanggal_selesai || null),
      mata_pelajaran: form.mata_pelajaran,
      kelas: form.kelas,
      kelas_id: form.kelas_id || null,
      guru_pengganti: form.guru_pengganti || null,
      catatan: form.catatan || null,
      status: 'diajukan',
      user_id: profile?.id ?? null,
    };
    const { error: izinError } = await supabase.from('izin_mengajar').insert(payload);
    if (izinError) {
      setSaving(false);
      showToast(izinError.message, 'error');
      return;
    }

    // c. Update the presensi status to "Izin" (insert into presensi_guru with keterangan = izin reason)
    try {
      const keterangan = form.catatan || getJenisLabel();
      await supabase.from('presensi_guru').insert({
        user_id: profile?.id ?? null,
        tanggal: form.tanggal_mulai,
        status: 'Izin',
        keterangan,
        mata_pelajaran: form.mata_pelajaran,
        kelas: form.kelas,
        kelas_id: form.kelas_id || null,
      });
    } catch (err) {
      // presensi update is best-effort; don't block the flow
    }

    // b. Call the existing shareWA function with the izin details
    shareWA(buildWAMessage(form));

    setSaving(false);
    // d. Show a success toast
    showToast('Izin disimpan, presensi diperbarui, dan dibagikan via WhatsApp!', 'success');

    // PERUBAHAN: Gunakan penutup modal yang membersihkan URL
    handleCloseModal();
    fetchList();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('izin_mengajar').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); return; }
    setList(prev => prev.filter(i => i.id !== id));
    showToast('Izin dihapus', 'info');
  };

  const formatDateLong = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const buildWAMessage = (data: {
    jenis_izin: string; jenis_lainnya: string;
    lama_izin: 'hari_ini' | 'beberapa_hari'; tanggal_mulai: string; tanggal_selesai: string;
    mata_pelajaran: string; kelas: string; guru_pengganti: string; catatan: string;
  }) => {
    const nama = profile?.nama_panggilan || profile?.nama_lengkap || 'Ustaz';
    const jenisLabel = data.jenis_izin === 'Lainnya' ? (data.jenis_lainnya || 'Lainnya') : data.jenis_izin;
    const tanggalText = data.lama_izin === 'hari_ini'
      ? formatDateLong(data.tanggal_mulai)
      : `${formatDateLong(data.tanggal_mulai)} s/d ${formatDateLong(data.tanggal_selesai)}`;
    const alasan = data.catatan || jenisLabel;
    const pengganti = data.guru_pengganti || '-';

    return `Assalamu'alaikum warahmatullahi wabarakatuh.

Dengan hormat, saya yang bertanda tangan di bawah ini:
*Nama* : *${nama}*
*Mata Pelajaran* : *${data.mata_pelajaran}*
*Kelas* : *${data.kelas}*
*Tanggal Izin* : _${tanggalText}_

Dengan ini mengajukan permohonan izin untuk tidak dapat melaksanakan tugas mengajar pada jadwal tersebut karena _${alasan}_.

Sebagai bentuk tanggung jawab terhadap amanah pembelajaran, saya telah menyerahkan amanah mengajar kepada _Ustaz ${pengganti}_ sebagai guru pengganti, sehingga insyaAllah kegiatan belajar mengajar tetap dapat berlangsung sebagaimana mestinya.

Demikian permohonan izin ini saya sampaikan. Besar harapan saya kiranya Bapak/Ibu Koordinator berkenan memberikan izin.

Atas perhatian, kebijaksanaan, dan pengertiannya saya ucapkan _Jazākumullāhu Khairan Katsīrā_.

Wassalamu'alaikum warahmatullahi wabarakatuh.`;
  };

  const handleShareExisting = (izin: IzinMengajar) => {
    const data = {
      jenis_izin: izin.jenis_izin,
      jenis_lainnya: '',
      lama_izin: izin.lama_izin as 'hari_ini' | 'beberapa_hari',
      tanggal_mulai: izin.tanggal_mulai,
      tanggal_selesai: izin.tanggal_selesai || '',
      mata_pelajaran: izin.mata_pelajaran || '',
      kelas: izin.kelas || '',
      guru_pengganti: izin.guru_pengganti || '',
      catatan: izin.catatan || '',
    };
    shareWA(buildWAMessage(data));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">Izin Mengajar</h2>
          <p className="section-subtitle">Ajukan izin dan bagikan via WhatsApp</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Ajukan Izin</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-24 bg-slate-50 rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Belum ada pengajuan izin"
          description="Ajukan izin mengajar dan bagikan ke koordinator via WhatsApp."
          icon={<FileText className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-3">
          {list.map(i => (
            <div key={i.id} className="card p-4 group">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-slate-800 text-sm">{i.jenis_izin}</span>
                    <span className={`badge text-[10px] ${STATUS_STYLE[i.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {i.status === 'diajukan' ? 'Diajukan' : i.status === 'disetujui' ? 'Disetujui' : 'Ditolak'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{i.mata_pelajaran || '-'}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{i.kelas || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(i.tanggal_mulai)}</span>
                    {i.lama_izin === 'beberapa_hari' && i.tanggal_selesai && (
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />s/d {formatDate(i.tanggal_selesai)}</span>
                    )}
                  </div>
                  {i.guru_pengganti && (
                    <p className="text-[11px] text-slate-500 mt-1">Pengganti: <strong>{i.guru_pengganti}</strong></p>
                  )}
                  {i.catatan && <p className="text-[11px] text-slate-400 italic mt-1">{i.catatan}</p>}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => handleShareExisting(i)} title="Share WhatsApp" className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal} // PERUBAHAN
        title="Ajukan Izin Mengajar"
        size="md"
      >
        <form onSubmit={handleShare} className="space-y-4">
          {/* Lembaga select (SearchableSelect) at the top of the form */}
          <div className="relative">
            <SearchableSelect
              value={form.lembaga_id}
              onChange={(v) => setForm(p => ({ ...p, lembaga_id: v, kelas: '' }))}
              options={lembagaOptions}
              placeholder="Pilih Lembaga"
              label="Lembaga"
            />
          </div>

          {/* Nama otomatis */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Nama Ustaz</label>
            <div className="input-field text-sm bg-slate-100 flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-700 font-medium">
                {profile?.nama_panggilan || profile?.nama_lengkap || 'Ustaz'}
              </span>
            </div>
          </div>

          {/* Lama Izin */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Lama Izin</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(p => ({ ...p, lama_izin: 'hari_ini', tanggal_mulai: today, tanggal_selesai: '' }));
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${form.lama_izin === 'hari_ini' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-200' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                Hari Ini Saja
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, lama_izin: 'beberapa_hari' }))}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${form.lama_izin === 'beberapa_hari' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-200' : 'bg-white text-slate-500 border-slate-200'}`}
              >
                Beberapa Hari
              </button>
            </div>
          </div>

          {/* Tanggal */}
          {form.lama_izin === 'hari_ini' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tanggal</label>
              <input type="date" value={form.tanggal_mulai} onChange={e => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))} className="input-field text-sm" required />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mulai Tanggal</label>
                <input type="date" value={form.tanggal_mulai} onChange={e => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))} className="input-field text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Sampai Tanggal</label>
                <input type="date" value={form.tanggal_selesai} onChange={e => setForm(p => ({ ...p, tanggal_selesai: e.target.value }))} className="input-field text-sm" required />
              </div>
            </div>
          )}

          {/* Jenis Izin */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jenis Izin</label>
            <div className="grid grid-cols-2 gap-1.5">
              {JENIS_IZIN.map(j => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, jenis_izin: j }))}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all border ${form.jenis_izin === j ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  {j}
                </button>
              ))}
            </div>
            {form.jenis_izin === 'Lainnya' && (
              <input
                type="text"
                value={form.jenis_lainnya}
                onChange={e => setForm(p => ({ ...p, jenis_lainnya: e.target.value }))}
                className="input-field text-sm mt-2"
                placeholder="Tulis jenis izin secara manual..."
                required
              />
            )}
          </div>

          {/* Mapel & Kelas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mata Pelajaran *</label>
              <select value={form.mata_pelajaran} onChange={e => setForm(p => ({ ...p, mata_pelajaran: e.target.value }))} className="input-field text-sm" required>
                <option value="">Pilih</option>
                {mapelList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas *</label>
              <select value={form.kelas} onChange={e => { const k = kelasFiltered.find(k => k.nama_kelas === e.target.value); setForm(p => ({ ...p, kelas: e.target.value, kelas_id: k?.id ?? '' })); }} className="input-field text-sm" required>
                <option value="">Pilih</option>
                {kelasFiltered.map(k => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
              </select>
            </div>
          </div>

          {/* Guru Pengganti */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Guru Pengganti (opsional)</label>
            <input type="text" value={form.guru_pengganti} onChange={e => setForm(p => ({ ...p, guru_pengganti: e.target.value }))} className="input-field text-sm" placeholder="Nama guru pengganti..." />
          </div>

          {/* Catatan / Alasan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Alasan / Catatan (opsional)</label>
            <textarea value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} className="input-field text-sm resize-none" rows={2} placeholder="Tulis alasan izin..." />
          </div>

          {/* Tombol: Simpan removed, replaced with Share button */}
          <div className="flex gap-2 pt-2">
            {/* PERUBAHAN: Gunakan fungsi penutup modal khusus */}
            <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1 text-sm">Batal</button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-sm flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4" /> {saving ? 'Memproses...' : 'Share'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
