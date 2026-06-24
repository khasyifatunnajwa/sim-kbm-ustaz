import { useState } from 'react';
import {
  FileQuestion, Plus, Trash2, Pencil, FileText, Share2
} from 'lucide-react';
import type { BankSoal } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { shareWA } from '../lib/pdf';
import { jsPDF } from 'jspdf';
import { cn } from '../lib/utils';

interface SoalPageProps {
  soalList: BankSoal[];
  onAddSoal: (soal: Omit<BankSoal, 'id' | 'user_id' | 'created_at'>) => void;
  onUpdateSoal: (id: string, soal: Partial<BankSoal>) => void;
  onDeleteSoal: (id: string) => void;
}

export default function SoalPage({ soalList, onAddSoal, onUpdateSoal, onDeleteSoal }: SoalPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedSoal, setExpandedSoal] = useState<string | null>(null);
  const [form, setForm] = useState({
    pelajaran: '',
    kelas: '',
    batasan: '',
    isi_soal: '',
  });

  const sortedSoal = [...soalList].sort((a, b) => a.kelas.localeCompare(b.kelas));

  const openAdd = () => {
    setEditingId(null);
    setForm({ pelajaran: '', kelas: '', batasan: '', isi_soal: '' });
    setShowModal(true);
  };

  const openEdit = (soal: BankSoal) => {
    setEditingId(soal.id);
    setForm({
      pelajaran: soal.pelajaran,
      kelas: soal.kelas,
      batasan: soal.batasan || '',
      isi_soal: soal.isi_soal,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pelajaran || !form.kelas || !form.isi_soal) return;

    if (editingId) {
      onUpdateSoal(editingId, form);
    } else {
      onAddSoal(form);
    }
    setShowModal(false);
    setEditingId(null);
  };

  const exportSoalPDF = (soal: BankSoal) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Soal: ${soal.pelajaran}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Kelas: ${soal.kelas}`, 14, 28);
    doc.text(`Batasan: ${soal.batasan || '-'}`, 14, 34);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 40);
    doc.line(14, 44, 196, 44);
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(soal.isi_soal, 180);
    doc.text(splitText, 14, 54);
    doc.save(`Soal_${soal.pelajaran}_Kelas_${soal.kelas}.pdf`);
  };

  const shareSoalWA = (soal: BankSoal) => {
    const text = `*SOAL UJIAN*\n📚 ${soal.pelajaran}\n🏫 Kelas: ${soal.kelas}\n📑 Batasan: ${soal.batasan || '-'}\n\n*Soal:*\n${soal.isi_soal}`;
    shareWA(text);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="section-title">Arsip & Bank Soal</h2>
          <p className="section-subtitle">Simpan draf pertanyaan imtihan madrasah</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm w-fit">
          <Plus className="w-4 h-4" />
          Tambah Soal
        </button>
      </div>

      {soalList.length === 0 ? (
        <EmptyState
          title="Belum ada soal"
          description="Tambahkan soal ujian ke arsip"
          icon={<FileQuestion className="w-8 h-8 text-slate-300" />}
        />
      ) : (
        <div className="space-y-3">
          {sortedSoal.map((soal, idx) => (
            <div key={soal.id} className="card card-hover overflow-hidden">
              <div
                className="p-4 flex items-start gap-3 cursor-pointer"
                onClick={() => setExpandedSoal(expandedSoal === soal.id ? null : soal.id)}
              >
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-success text-[10px]">{soal.pelajaran}</span>
                    <span className="badge badge-info text-[10px]">Kelas {soal.kelas}</span>
                    {soal.batasan && <span className="text-[10px] text-slate-400">{soal.batasan}</span>}
                  </div>
                  <p className={cn(
                    'text-sm text-slate-700 font-medium',
                    expandedSoal !== soal.id && 'line-clamp-2'
                  )}>
                    {soal.isi_soal}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={e => { e.stopPropagation(); openEdit(soal); }}
                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDelete(soal.id); }}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {expandedSoal === soal.id && (
                <div className="px-4 pb-4 pt-0 border-t border-slate-50">
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => exportSoalPDF(soal)}
                      className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <FileText className="w-3 h-3" /> PDF
                    </button>
                    <button
                      onClick={() => shareSoalWA(soal)}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Share2 className="w-3 h-3" /> WA
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Soal' : 'Tambah Soal Baru'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mata Pelajaran *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Fiqih"
                value={form.pelajaran}
                onChange={e => setForm({ ...form, pelajaran: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Kelas *</label>
              <input
                type="text"
                className="input-field"
                placeholder="3A"
                value={form.kelas}
                onChange={e => setForm({ ...form, kelas: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Batasan Materi</label>
            <input
              type="text"
              className="input-field"
              placeholder="Bab 1-3"
              value={form.batasan}
              onChange={e => setForm({ ...form, batasan: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Isi Soal *</label>
            <textarea
              rows={6}
              className="input-field resize-none"
              placeholder="Tulis soal di sini..."
              value={form.isi_soal}
              onChange={e => setForm({ ...form, isi_soal: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            {editingId ? 'Simpan Perubahan' : 'Tambah Soal'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { confirmDelete && onDeleteSoal(confirmDelete); setConfirmDelete(null); }}
        title="Hapus Soal"
        message="Apakah Anda yakin ingin menghapus soal ini?"
      />
    </div>
  );
}
