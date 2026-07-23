import { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileQuestion, Plus, Trash2, Pencil, FileText, Share2, Search, X,
  Type, Hash, ListOrdered,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { BankSoal, Kelas, MataPelajaran, ShowToast, Profile } from '../types';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SearchableSelect from '../components/SearchableSelect';
import { useLembaga } from '../hooks/useLembaga';
import { jsPDF } from 'jspdf';
import { shareWA } from '../lib/pdf';

export default function SoalPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const { data: lembagaList = [] } = useLembaga();
  const [soalList, setSoalList] = useState<BankSoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 1. MODIFIKASI: Baca status modal dari Hash URL saat awal muat
  const [showModal, setShowModal] = useState(() => {
    const hashParts = window.location.hash.replace('#', '').split('/');
    return hashParts[0] === 'soal' && hashParts[1] === 'form';
  });
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form state now includes lembaga_id
  const [form, setForm] = useState({ lembaga_id: '', pelajaran: '', kelas: '', batasan: '', isi_soal: '' });
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [mapelList, setMapelList] = useState<MataPelajaran[]>([]);

  // Word-like soal editor state
  const [autoNumber, setAutoNumber] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const [textDir, setTextDir] = useState<'ltr' | 'rtl'>('ltr');
  const soalTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 2. SINKRONISASI MODAL DENGAN TOMBOL BACK HP
  useEffect(() => {
    const handlePopState = () => {
      const hashParts = window.location.hash.replace('#', '').split('/');
      if (hashParts[0] === 'soal' && hashParts[1] === 'form') {
        setShowModal(true);
      } else {
        setShowModal(false);
        setEditingId(null);
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

  const fetchSoal = async () => {
    setLoading(true);
    const isAdmin = profile?.role === 'admin';
    const soalQuery = supabase.from('bank_soal').select('*').order('created_at', { ascending: false });
    if (!isAdmin) soalQuery.eq('user_id', profile?.id ?? '');
    const [soalRes, kelasRes, mapelRes] = await Promise.all([
      soalQuery,
      supabase.from('kelas').select('*').eq('is_active', true).order('nama_kelas'),
      supabase.from('mata_pelajaran').select('*').eq('is_active', true).order('nama_mapel'),
    ]);
    if (soalRes.data) setSoalList(soalRes.data as BankSoal[]);
    if (kelasRes.data) setKelasList(kelasRes.data as Kelas[]);
    if (mapelRes.data) setMapelList(mapelRes.data as MataPelajaran[]);
    setLoading(false);
  };

  useEffect(() => { fetchSoal(); }, []);

  // Sort by kelas ascending (lowest first)
  const sortedSoal = useMemo(() => {
    const filtered = search
      ? soalList.filter(s =>
          s.pelajaran.toLowerCase().includes(search.toLowerCase()) ||
          s.kelas.toLowerCase().includes(search.toLowerCase()) ||
          s.isi_soal.toLowerCase().includes(search.toLowerCase()))
      : soalList;
    return [...filtered].sort((a, b) => a.kelas.localeCompare(b.kelas, 'id', { numeric: true }));
  }, [soalList, search]);

  // Lembaga options for SearchableSelect
  const lembagaOptions = useMemo(
    () => lembagaList.map(l => ({ value: l.id, label: l.nama_lembaga })),
    [lembagaList]
  );

  // Kelas dropdown filtered by selected lembaga
  const kelasFiltered = useMemo(() => {
    if (!form.lembaga_id) return kelasList;
    return kelasList.filter(k => (k as any).lembaga_id === form.lembaga_id);
  }, [kelasList, form.lembaga_id]);

  // 4. MENDORONG HASH SAAT BUKA MODAL TAMBAH
  const openAdd = () => {
    setEditingId(null);
    setForm({ lembaga_id: lembagaList[0]?.id ?? '', pelajaran: '', kelas: '', batasan: '', isi_soal: '' });
    setAutoNumber(true);
    setShowModal(true);
    window.history.pushState(null, '', '#soal/form');
  };

  // 4. MENDORONG HASH SAAT BUKA MODAL EDIT
  const openEdit = (s: BankSoal) => {
    setEditingId(s.id);
    setForm({ lembaga_id: (s as any).lembaga_id || '', pelajaran: s.pelajaran, kelas: s.kelas, batasan: s.batasan ?? '', isi_soal: s.isi_soal });
    setShowModal(true);
    window.history.pushState(null, '', '#soal/form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pelajaran || !form.kelas || !form.isi_soal) { showToast('Lengkapi field wajib', 'error'); return; }
    setSaving(true);
    // Include lembaga_id in the payload
    const payload = {
      lembaga_id: form.lembaga_id || null,
      pelajaran: form.pelajaran, kelas: form.kelas,
      batasan: form.batasan || null, isi_soal: form.isi_soal,
    };
    const { error } = editingId
      ? await supabase.from('bank_soal').update(payload).eq('id', editingId)
      : await supabase.from('bank_soal').insert(payload);
    setSaving(false);
    if (error) { showToast(error.message, 'error'); return; }
    showToast(editingId ? 'Soal diperbarui!' : 'Soal ditambahkan!', 'success');
    
    // PERUBAHAN: Memanggil handleCloseModal
    handleCloseModal();
    fetchSoal();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('bank_soal').delete().eq('id', id);
    setSoalList(prev => prev.filter(s => s.id !== id));
    showToast('Soal dihapus', 'info');
  };

  const exportSoalPDF = (soal: BankSoal) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text(`Soal: ${soal.pelajaran}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Kelas: ${soal.kelas}`, 14, 28);
    doc.text(`Batasan: ${soal.batasan || '-'}`, 14, 34);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 40);
    doc.setDrawColor(5, 150, 105);
    doc.setLineWidth(0.5);
    doc.line(14, 44, 196, 44);
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const splitText = doc.splitTextToSize(soal.isi_soal, 180);
    doc.text(splitText, 14, 54);
    doc.save(`Soal_${soal.pelajaran}_Kelas_${soal.kelas}.pdf`);
  };

  const shareSoalWA = (soal: BankSoal) => {
    const text = `*SOAL UJIAN*\n\nMata Pelajaran: ${soal.pelajaran}\nKelas: ${soal.kelas}\nBatasan: ${soal.batasan || '-'}\n\n*Soal:*\n${soal.isi_soal}`;
    shareWA(text);
  };

  // ===== WORD-LIKE SOAL EDITOR =====
  // Count existing numbered questions in the content
  const countNumbers = (text: string): number => {
    const matches = text.match(/^\s*\d+\.\s/gm);
    return matches ? matches.length : 0;
  };

  // Handle key down in the soal textarea for auto-numbering
  const handleSoalKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!autoNumber) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const content = form.isi_soal;
      const nextNumber = countNumbers(content) + 1;
      const insert = `\n${nextNumber}. \n`;
      const newContent = content.slice(0, start) + insert + content.slice(end);
      setForm(p => ({ ...p, isi_soal: newContent }));
      requestAnimationFrame(() => {
        if (soalTextareaRef.current) {
          const pos = start + insert.length;
          soalTextareaRef.current.selectionStart = pos;
          soalTextareaRef.current.selectionEnd = pos;
        }
      });
    }
  };

  // "Tambah Soal" button: append a new numbered question with dotted lines
  const handleTambahSoal = () => {
    const nextNumber = countNumbers(form.isi_soal) + 1;
    const prefix = form.isi_soal && !form.isi_soal.endsWith('\n') ? '\n' : '';
    const newBlock = `${prefix}${nextNumber}. \n`;
    setForm(p => ({ ...p, isi_soal: p.isi_soal + newBlock }));
    requestAnimationFrame(() => {
      if (soalTextareaRef.current) {
        const ta = soalTextareaRef.current;
        ta.focus();
        const pos = ta.value.length;
        ta.selectionStart = pos;
        ta.selectionEnd = pos;
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="section-title">Arsip & Bank Soal</h2>
          <p className="section-subtitle">{soalList.length} soal tersimpan</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Buat Soal</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari soal, pelajaran, atau kelas..."
          className="input-field text-sm pl-9"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="card p-4 animate-pulse h-20 bg-slate-50 rounded-2xl" />)}</div>
      ) : sortedSoal.length === 0 ? (
        <EmptyState title={search ? "Tidak ada hasil" : "Belum ada soal"} description={search ? "Coba ubah kata kunci." : "Tambahkan soal ujian ke arsip."} icon={<FileQuestion className="w-8 h-8 text-slate-300" />} />
      ) : (
        <div className="space-y-3">
          {sortedSoal.map((soal, idx) => (
            <div key={soal.id} className="card card-hover overflow-hidden group">
              <div
                className="p-4 flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedId(expandedId === soal.id ? null : soal.id)}
              >
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="badge badge-success text-[10px]">{soal.pelajaran}</span>
                    <span className="badge badge-info text-[10px]">Kelas {soal.kelas}</span>
                    {soal.batasan && <span className="text-[10px] text-slate-400">{soal.batasan}</span>}
                  </div>
                  <p className={`text-sm text-slate-700 font-medium ${expandedId !== soal.id ? 'line-clamp-2' : ''}`}>
                    {soal.isi_soal}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={e => { e.stopPropagation(); openEdit(soal); }} className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(soal.id); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {expandedId === soal.id && (
                <div className="px-4 pb-4 border-t border-slate-50">
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => exportSoalPDF(soal)} className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                      <FileText className="w-3 h-3" /> Export PDF
                    </button>
                    <button onClick={() => shareSoalWA(soal)} className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                      <Share2 className="w-3 h-3" /> Share WhatsApp
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat/Edit Soal */}
      <Modal isOpen={showModal} onClose={handleCloseModal} title={editingId ? 'Edit Soal' : 'Buat Soal Baru'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Lembaga (SearchableSelect) */}
          <div className="relative">
            <SearchableSelect
              value={form.lembaga_id}
              onChange={(v) => setForm(p => ({ ...p, lembaga_id: v, kelas: '' }))}
              options={lembagaOptions}
              placeholder="Pilih Lembaga"
              label="Lembaga"
            />
          </div>

          {/* 2. Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Kelas *</label>
            <select className="input-field text-sm" value={form.kelas} onChange={e => setForm(p => ({ ...p, kelas: e.target.value }))} required>
              <option value="">Pilih Kelas</option>
              {kelasFiltered.map(k => <option key={k.id} value={k.nama_kelas}>{k.nama_kelas}</option>)}
            </select>
          </div>

          {/* 3. Mata Pelajaran */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mata Pelajaran *</label>
            <select className="input-field text-sm" value={form.pelajaran} onChange={e => setForm(p => ({ ...p, pelajaran: e.target.value }))} required>
              <option value="">Pilih Pelajaran</option>
              {mapelList.map(m => <option key={m.id} value={m.nama_mapel}>{m.nama_mapel}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Batasan Materi (opsional)</label>
            <input type="text" className="input-field text-sm" placeholder="Bab 1-3" value={form.batasan} onChange={e => setForm(p => ({ ...p, batasan: e.target.value }))} />
          </div>

          {/* ===== WORD-LIKE SOAL EDITOR ===== */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Isi Soal *</label>

            {/* Toolbar */}
            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-100 rounded-t-xl border-2 border-b-0 border-slate-200 border-dashed">
              {/* Font size indicator */}
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                <Type className="w-3.5 h-3.5" />
                <span>{fontSize}px</span>
                <div className="flex flex-col ml-1">
                  <button type="button" onClick={() => setFontSize(s => Math.min(24, s + 1))} className="text-slate-400 hover:text-emerald-600 leading-none text-[10px]">▲</button>
                  <button type="button" onClick={() => setFontSize(s => Math.max(12, s - 1))} className="text-slate-400 hover:text-emerald-600 leading-none text-[10px]">▼</button>
                </div>
              </div>

              {/* Auto-number toggle */}
              <button
                type="button"
                onClick={() => setAutoNumber(a => !a)}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${autoNumber ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}
                title="Auto-numbering: tekan Enter untuk menambah nomor otomatis"
              >
                <Hash className="w-3.5 h-3.5" />
                <span>Auto-No</span>
              </button>

              {/* RTL/LTR toggle */}
              <button
                type="button"
                onClick={() => setTextDir(d => d === 'ltr' ? 'rtl' : 'ltr')}
                className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${textDir === 'rtl' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-slate-500 border-slate-200'}`}
                title={textDir === 'rtl' ? 'Mode Arab (RTL). Klik untuk Latin (LTR)' : 'Mode Latin (LTR). Klik untuk Arab (RTL)'}
              >
                {textDir === 'rtl' ? <span className="text-xs font-bold">RTL</span> : <span className="text-xs font-bold">LTR</span>}
              </button>

              {/* Tambah Soal button */}
              <button
                type="button"
                onClick={handleTambahSoal}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-sky-600 text-white border border-sky-600 hover:bg-sky-700 transition-colors ml-auto"
                title="Tambah soal bernomor baru"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Tambah Soal</span>
              </button>
            </div>

            {/* Large document-like textarea */}
            <textarea
              ref={soalTextareaRef}
              rows={14}
              className="w-full min-h-[400px] p-6 text-base leading-loose font-serif bg-slate-50 border-2 border-dashed border-slate-200 rounded-b-xl resize-y outline-none focus:border-emerald-400 transition-colors text-slate-800"
              style={{ fontSize: `${fontSize}px`, direction: textDir, textAlign: textDir === 'rtl' ? 'right' : 'left' }}
              placeholder="(Ketik di sini...)"
              value={form.isi_soal}
              onChange={e => setForm(p => ({ ...p, isi_soal: e.target.value }))}
              onKeyDown={handleSoalKeyDown}
              required
            />
            <p className="text-[10px] text-slate-400 mt-1.5 italic">
              {autoNumber
                ? 'Mode auto-numbering aktif. Tekan Enter untuk menambah nomor soal otomatis.'
                : 'Mode auto-numbering nonaktif. Aktifkan untuk penomoran otomatis saat menekan Enter.'}
              {textDir === 'rtl' && ' • Mode Arab (RTL).'}
            </p>
          </div>

          <div className="flex gap-2 pt-1 border-t border-slate-100 mt-2">
            {/* PERUBAHAN: Gunakan fungsi handleCloseModal */}
            <button type="button" onClick={handleCloseModal} className="btn-secondary flex-1 text-sm py-2.5">Batal</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm py-2.5">{saving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
