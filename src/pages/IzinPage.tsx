import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Send, FileText, Calendar, Clock, User, BookOpen, Users
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import { shareWA } from '../lib/pdf';
import type { IzinMengajar, Profile, ShowToast } from '../types';

const JENIS_IZIN = ['Sakit', 'Bepergian', 'Tugas Pesantren', 'Lainnya'] as const;
const STATUS_STYLE: Record<string, string> = {
  diajukan: 'bg-amber-100 text-amber-700',
  disetujui: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-rose-100 text-rose-700',
};

export default function IzinPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [list, setList] = useState<IzinMengajar[]>([]);
  const [kelasList, setKelasList] = useState<string[]>([]);
  const [mapelList, setMapelList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'izin' && hashParts[1] === 'form';
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    jenis_izin: 'Sakit' as string,
    jenis_lainnya: '',
    lama_izin: 'hari_ini' as 'hari_ini' | 'beberapa_hari',
    tanggal_mulai: today,
    tanggal_selesai: '',
    mata_pelajaran: '',
    kelas: '',
    guru_pengganti: '',
    catatan: '',
  });

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

  const handleCloseModal = () => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    if (hashParts[1] === 'form') {
      window.history.back();
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
      setKelasList(scope.kelasList);
      setMapelList(scope.mapelList);
      fetchList();
    })();
  }, [profile]);

  const openAdd = () => {
    setForm({
      jenis_izin: 'Sakit',
      jenis_lainnya: '',
      lama_izin: 'hari_ini',
      tanggal_mulai: today,
      tanggal_selesai: '',
      mata_pelajaran: mapelList[0] || '',
      kelas: kelasList[0] || '',
      guru_pengganti: '',
      catatan: '',
    });
    setShowModal(true);
    window.history.pushState(null, '', '#izin/form');
  };

  const getJenisLabel = () => form.jenis_izin === 'Lainnya' ? (form.jenis_lainnya || 'Lainnya') : form.jenis_izin;

  // Use nama_lengkap instead of nama_panggilan
  const namaUstaz = profile?.nama_lengkap || profile?.nama_panggilan || 'Ustaz';

  const saveToDatabase = async () => {
    const payload = {
      user_id: profile?.id,
      nama_ustaz: namaUstaz,
      jenis_izin: getJenisLabel(),
      lama_izin: form.lama_izin,
      tanggal_mulai: form.tanggal_mulai,
      tanggal_selesai: form.lama_izin === 'hari_ini' ? form.tanggal_mulai : (form.tanggal_selesai || null),
      mata_pelajaran: form.mata_pelajaran,
      kelas: form.kelas,
      guru_pengganti: form.guru_pengganti || null,
      catatan: form.catatan || null,
      status: 'diajukan',
    };
    const { error } = await supabase.from('izin_mengajar').insert(payload);
    if (error) throw error;
  };

  const formatDateLong = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const buildWAMessage = () => {
    const jenisLabel = getJenisLabel();
    const tanggalText = form.lama_izin === 'hari_ini'
      ? formatDateLong(form.tanggal_mulai)
      : `${formatDateLong(form.tanggal_mulai)} s/d ${formatDateLong(form.tanggal_selesai)}`;
    const alasan = form.catatan || jenisLabel;
    const pengganti = form.guru_pengganti || '-';

    return `Assalamu'alaikum warahmatullahi wabarakatuh.

Dengan hormat, saya yang bertanda tangan di bawah ini:
*Nama* : *${namaUstaz}*
*Mata Pelajaran* : *${form.mata_pelajaran}*
*Kelas* : *${form.kelas}*
*Tanggal Izin* : _${tanggalText}_

Dengan ini mengajukan permohonan izin untuk tidak dapat melaksanakan tugas mengajar pada jadwal tersebut karena _${alasan}_.

Sebagai bentuk tanggung jawab terhadap amanah pembelajaran, saya telah menyerahkan amanah mengajar kepada _Ustaz ${pengganti}_ sebagai guru pengganti, sehingga insyaAllah kegiatan belajar mengajar tetap dapat berlangsung sebagaimana mestinya.

Demikian permohonan izin ini saya sampaikan. Besar harapan saya kiranya Bapak/Ibu Koordinator berkenan memberikan izin.

Atas perhatian, kebijaksanaan, dan pengertiannya saya ucapkan _Jazākumullāhu Khairan Katsīrā_.

Wassalamu'alaikum warahmatullahi wabarakatuh.`;
  };

  // Auto-save when sharing via WA
  const handleShareWA = async () => {
    if (!form.mata_pelajaran || !form.kelas) {
      showToast('Lengkapi mata pelajaran dan kelas sebelum share', 'error');
      return;
    }
    if (form.jenis_izin === 'Lainnya' && !form.jenis_lainnya.trim()) {
      showToast('Jelaskan jenis izin pada kolom Lainnya', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveToDatabase();
      shareWA(buildWAMessage());
      showToast('Izin berhasil disimpan dan dibagikan!', 'success');
      handleCloseModal();
      fetchList();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan izin', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    supabase.from('izin_mengajar').delete().eq('id', deletingId).then(({ error }) => {
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Izin dihapus', 'info');
        setList(prev => prev.filter(i => i.id !== deletingId));
      }
      setShowDeleteDialog(false);
      setDeletingId(null);
    });
  };

  const handleShareExisting = (izin: IzinMengajar) => {
    const tanggalText = izin.lama_izin === 'hari_ini'
      ? formatDateLong(izin.tanggal_mulai)
      : `${formatDateLong(izin.tanggal_mulai)} s/d ${formatDateLong(izin.tanggal_selesai || izin.tanggal_mulai)}`;

    const text = `Assalamu'alaikum warahmatullahi wabarakatuh.

Dengan hormat, saya yang bertanda tangan di bawah ini:
*Nama* : *${izin.nama_ustaz}*
*Mata Pelajaran* : *${izin.mata_pelajaran || '-'}*
*Kelas* : *${izin.kelas || '-'}*
*Tanggal Izin* : _${tanggalText}_
*Jenis Izin* : ${izin.jenis_izin}

${izin.catatan ? `Alasan: ${izin.catatan}\n` : ''}${izin.guru_pengganti ? `Guru Pengganti: ${izin.guru_pengganti}\n` : ''}

Demikian permohonan izin ini kami sampaikan.

Wassalamu'alaikum warahmatullahi wabarakatuh.`;

    shareWA(text);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Izin Mengajar</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Ajukan izin via WhatsApp</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" />
          <span>Ajukan Izin</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="card p-3 animate-pulse h-20 bg-slate-50 rounded-xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Belum ada pengajuan izin"
          description="Ajukan izin mengajar dan bagikan ke koordinator via WhatsApp."
          icon={<FileText className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-2">
          {list.map(i => (
            <div key={i.id} className="card p-3 group">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-slate-800 text-xs">{i.jenis_izin}</span>
                    <span className={`badge text-[9px] ${STATUS_STYLE[i.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {i.status === 'diajukan' ? 'Diajukan' : i.status === 'disetujui' ? 'Disetujui' : 'Ditolak'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" />{i.mata_pelajaran || '-'}</span>
                    <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{i.kelas || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />{formatDate(i.tanggal_mulai)}</span>
                    {i.lama_izin === 'beberapa_hari' && i.tanggal_selesai && (
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />s/d {formatDate(i.tanggal_selesai)}</span>
                    )}
                  </div>
                  {i.guru_pengganti && (
                    <p className="text-[10px] text-slate-500 mt-1">Pengganti: <strong>{i.guru_pengganti}</strong></p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button onClick={() => handleShareExisting(i)} title="Share WA" className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { setDeletingId(i.id); setShowDeleteDialog(true); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
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
        onClose={handleCloseModal}
        title="Ajukan Izin Mengajar"
        size="md"
      >
        <div className="max-h-[70vh] overflow-y-auto pr-1 -mr-1">
          <div className="space-y-3">
            {/* Nama otomatis - NAMA LENGKAP */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Nama Ustaz</label>
              <div className="input-field text-xs bg-slate-100 flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-700 font-medium">{namaUstaz}</span>
              </div>
            </div>

            {/* Lama Izin */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1.5">Lama Izin</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setForm(p => ({ ...p, lama_izin: 'hari_ini', tanggal_mulai: today, tanggal_selesai: '' }));
                  }}
                  className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${form.lama_izin === 'hari_ini' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  Hari Ini Saja
                </button>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, lama_izin: 'beberapa_hari' }))}
                  className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${form.lama_izin === 'beberapa_hari' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200'}`}
                >
                  Beberapa Hari
                </button>
              </div>
            </div>

            {/* Tanggal */}
            {form.lama_izin === 'hari_ini' ? (
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Tanggal</label>
                <input type="date" value={form.tanggal_mulai} onChange={e => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))} className="input-field text-xs" required />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Mulai</label>
                  <input type="date" value={form.tanggal_mulai} onChange={e => setForm(p => ({ ...p, tanggal_mulai: e.target.value }))} className="input-field text-xs" required />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-600 mb-1">Sampai</label>
                  <input type="date" value={form.tanggal_selesai} onChange={e => setForm(p => ({ ...p, tanggal_selesai: e.target.value }))} className="input-field text-xs" required />
                </div>
              </div>
            )}

            {/* Jenis Izin */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1.5">Jenis Izin</label>
              <div className="grid grid-cols-2 gap-1">
                {JENIS_IZIN.map(j => (
                  <button
                    key={j}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, jenis_izin: j }))}
                    className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${form.jenis_izin === j ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
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
                  className="input-field text-xs mt-2"
                  placeholder="Tulis jenis izin..."
                  required
                />
              )}
            </div>

            {/* Mapel & Kelas */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Mata Pelajaran *</label>
                <select value={form.mata_pelajaran} onChange={e => setForm(p => ({ ...p, mata_pelajaran: e.target.value }))} className="input-field text-xs" required>
                  <option value="">Pilih</option>
                  {mapelList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">Kelas *</label>
                <select value={form.kelas} onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))} className="input-field text-xs" required>
                  <option value="">Pilih</option>
                  {kelasList.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            {/* Guru Pengganti */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Guru Pengganti</label>
              <input type="text" value={form.guru_pengganti} onChange={e => setForm(p => ({ ...p, guru_pengganti: e.target.value }))} className="input-field text-xs" placeholder="Nama guru pengganti..." />
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-600 mb-1">Alasan / Catatan</label>
              <textarea value={form.catatan} onChange={e => setForm(p => ({ ...p, catatan: e.target.value }))} className="input-field text-xs resize-none" rows={2} placeholder="Tulis alasan izin..." />
            </div>

            {/* Tombol - HANYA SHARE WA (auto-save) */}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1 text-xs">Batal</button>
              <button
                type="button"
                onClick={handleShareWA}
                disabled={saving}
                className="btn-primary flex-1 text-xs flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {saving ? 'Menyimpan...' : 'Share WA (Auto-save)'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => { setShowDeleteDialog(false); setDeletingId(null); }}
        onConfirm={confirmDelete}
        title="Hapus Izin"
        message="Yakin ingin menghapus data izin ini?"
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  );
}
