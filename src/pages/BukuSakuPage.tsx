import { useState } from 'react';
import {
  BookOpen, BookMarked, Target, StickyNote, Plus, Trash2,
  Calendar
} from 'lucide-react';
import type { Murid, BukuSakuBatas, BukuSakuTagihan } from '../types';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { cn } from '../lib/utils';

interface BukuSakuPageProps {
  muridList: Murid[];
  batasList: BukuSakuBatas[];
  tagihanList: BukuSakuTagihan[];
  onAddBatas: (batas: Omit<BukuSakuBatas, 'id' | 'user_id' | 'created_at'>) => void;
  onDeleteBatas: (id: string) => void;
  onAddTagihan: (tagihan: Omit<BukuSakuTagihan, 'id' | 'user_id' | 'created_at'>) => void;
  onDeleteTagihan: (id: string) => void;
}

export default function BukuSakuPage({
  muridList, batasList, tagihanList,
  onAddBatas, onDeleteBatas, onAddTagihan, onDeleteTagihan
}: BukuSakuPageProps) {
  const [activeTab, setActiveTab] = useState<'batas' | 'tagihan' | 'catatan'>('batas');
  const [showBatasModal, setShowBatasModal] = useState(false);
  const [showTagihanModal, setShowTagihanModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'batas' | 'tagihan'; id: string } | null>(null);

  const [batasForm, setBatasForm] = useState({
    kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: ''
  });
  const [tagihanForm, setTagihanForm] = useState({
    tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '', catatan: ''
  });

  const handleBatasSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!batasForm.kelas || !batasForm.fan || !batasForm.materi) return;
    onAddBatas(batasForm);
    setBatasForm({ kelas: '', fan: '', materi: '', halaman: '', target: '', catatan: '' });
    setShowBatasModal(false);
  };

  const handleTagihanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagihanForm.tanggal || !tagihanForm.kelas || !tagihanForm.kitab) return;
    onAddTagihan(tagihanForm);
    setTagihanForm({ tanggal: '', kelas: '', kitab: '', target_dari: '', target_sampai: '', murid_id: '', catatan: '' });
    setShowTagihanModal(false);
  };

  const tabs = [
    { id: 'batas' as const, label: 'Batas Mengajar', icon: BookOpen },
    { id: 'tagihan' as const, label: 'Muhafadhoh', icon: Target },
    { id: 'catatan' as const, label: 'Catatan Lain', icon: StickyNote },
  ];

  return (
    <div className="space-y-5 animate-fadeIn">
      <div>
        <h2 className="section-title">Buku Saku Pengajar</h2>
        <p className="section-subtitle">Pantau batasan mengajar dan target hafalan santri</p>
      </div>

      {/* Tab Switcher */}
      <div className="tab-switcher">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn('tab-btn', activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive')}
            >
              <Icon className="w-4 h-4 inline mr-1" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* === BATAS MENGAJAR === */}
      {activeTab === 'batas' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowBatasModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Tambah Batas
            </button>
          </div>

          {batasList.length === 0 ? (
            <EmptyState
              title="Belum ada batasan"
              description="Tambahkan batas mengajar kitab untuk setiap kelas"
              icon={<BookOpen className="w-8 h-8 text-slate-300" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batasList.map(b => (
                <div key={b.id} className="card card-hover p-4 relative group">
                  <button
                    onClick={() => setConfirmDelete({ type: 'batas', id: b.id })}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <BookMarked className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-success text-[10px]">Kelas {b.kelas}</span>
                        <span className="badge badge-info text-[10px]">{b.fan}</span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-sm">{b.materi}</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2 bg-slate-50 rounded-lg p-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Halaman</p>
                          <p className="text-xs font-bold text-slate-700">{b.halaman || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-medium">Target</p>
                          <p className="text-xs font-bold text-slate-700">{b.target || '-'}</p>
                        </div>
                      </div>
                      {b.catatan && (
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg border border-dashed border-slate-200">
                          {b.catatan}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === MUHAFDHOH / TAGIHAN === */}
      {activeTab === 'tagihan' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowTagihanModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Tambah Tagihan
            </button>
          </div>

          {tagihanList.length === 0 ? (
            <EmptyState
              title="Belum ada tagihan"
              description="Tambahkan target hafalan untuk santri"
              icon={<Target className="w-8 h-8 text-slate-300" />}
            />
          ) : (
            <div className="space-y-3">
              {tagihanList.map(t => {
                const murid = muridList.find(m => m.id === t.murid_id);
                return (
                  <div key={t.id} className="card card-hover p-4 relative group">
                    <button
                      onClick={() => setConfirmDelete({ type: 'tagihan', id: t.id })}
                      className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                        <Target className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="badge badge-warning text-[10px]">Kelas {t.kelas}</span>
                          {murid && <span className="text-xs font-medium text-slate-600">{murid.nama}</span>}
                        </div>
                        <h3 className="font-bold text-slate-800 text-sm">{t.kitab}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">{t.target_dari} s/d {t.target_sampai}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-medium">
                            Deadline: {new Date(t.tanggal).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* === CATATAN LAIN === */}
      {activeTab === 'catatan' && (
        <div className="card p-6">
          <div className="text-center py-8">
            <StickyNote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">Catatan Bebas</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">Tulis catatan pribadi atau pengingat di sini</p>
            <textarea
              rows={6}
              className="input-field resize-none w-full text-sm"
              placeholder="Tulis catatan Anda..."
            />
            <button className="btn-primary mt-3 w-full">Simpan Catatan</button>
          </div>
        </div>
      )}

      {/* Modal Batas */}
      <Modal isOpen={showBatasModal} onClose={() => setShowBatasModal(false)} title="Tambah Batas Mengajar">
        <form onSubmit={handleBatasSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Kelas *</label>
              <input
                type="text"
                className="input-field"
                placeholder="3A"
                value={batasForm.kelas}
                onChange={e => setBatasForm({ ...batasForm, kelas: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Fan/Pelajaran *</label>
              <input
                type="text"
                className="input-field"
                placeholder="Fiqih"
                value={batasForm.fan}
                onChange={e => setBatasForm({ ...batasForm, fan: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Materi/Kitab *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Safinatun Najah"
              value={batasForm.materi}
              onChange={e => setBatasForm({ ...batasForm, materi: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Halaman Terakhir</label>
              <input
                type="text"
                className="input-field"
                placeholder="Hal. 45"
                value={batasForm.halaman}
                onChange={e => setBatasForm({ ...batasForm, halaman: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Target</label>
              <input
                type="text"
                className="input-field"
                placeholder="Khatam Bab 3"
                value={batasForm.target}
                onChange={e => setBatasForm({ ...batasForm, target: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Catatan</label>
            <textarea
              rows={2}
              className="input-field resize-none"
              placeholder="Catatan tambahan..."
              value={batasForm.catatan}
              onChange={e => setBatasForm({ ...batasForm, catatan: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full">Simpan Batasan</button>
        </form>
      </Modal>

      {/* Modal Tagihan */}
      <Modal isOpen={showTagihanModal} onClose={() => setShowTagihanModal(false)} title="Tambah Tagihan Hafalan">
        <form onSubmit={handleTagihanSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tanggal Janji *</label>
            <input
              type="date"
              className="input-field"
              value={tagihanForm.tanggal}
              onChange={e => setTagihanForm({ ...tagihanForm, tanggal: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Kelas *</label>
              <input
                type="text"
                className="input-field"
                placeholder="3A"
                value={tagihanForm.kelas}
                onChange={e => setTagihanForm({ ...tagihanForm, kelas: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Santri (Opsional)</label>
              <select
                className="input-field"
                value={tagihanForm.murid_id}
                onChange={e => setTagihanForm({ ...tagihanForm, murid_id: e.target.value })}
              >
                <option value="">Semua Santri</option>
                {muridList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Kitab/Materi *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Aqidatul Awam / Juz 30"
              value={tagihanForm.kitab}
              onChange={e => setTagihanForm({ ...tagihanForm, kitab: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Dari</label>
              <input
                type="text"
                className="input-field"
                placeholder="Bait 1"
                value={tagihanForm.target_dari}
                onChange={e => setTagihanForm({ ...tagihanForm, target_dari: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sampai</label>
              <input
                type="text"
                className="input-field"
                placeholder="Bait 10"
                value={tagihanForm.target_sampai}
                onChange={e => setTagihanForm({ ...tagihanForm, target_sampai: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">Simpan Tagihan</button>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete?.type === 'batas') onDeleteBatas(confirmDelete.id);
          else onDeleteTagihan(confirmDelete!.id);
          setConfirmDelete(null);
        }}
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus data ini?"
      />
    </div>
  );
}
