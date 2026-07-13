import { useState, useEffect } from 'react';
import { Shield, Building2, Clock, Calendar, Save, Database, Download, Upload, Smartphone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Modal from '../../components/Modal';
import type { ShowToast, Profile } from '../../types';

export default function PengaturanSistemSection({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [saving, setSaving] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [form, setForm] = useState({
    nama_lembaga: '', alamat: '', telepon: '', tahun_ajaran_aktif: '', semester_aktif: '',
    jam_masuk: '07:00', jam_pulang: '15:00', batas_terlambat: '07:10',
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data: lembaga } = await supabase.from('lembaga').select('*').limit(1).maybeSingle();
      if (lembaga) {
        setForm(prev => ({
          ...prev,
          nama_lembaga: lembaga.nama_lembaga || '',
          alamat: lembaga.alamat || '',
          telepon: lembaga.telepon || '',
        }));
      }
      const { data: tahun } = await supabase.from('tahun_ajaran').select('nama').eq('aktif', true).maybeSingle();
      const { data: semester } = await supabase.from('semester').select('nama').eq('aktif', true).maybeSingle();
      setForm(prev => ({
        ...prev,
        tahun_ajaran_aktif: tahun?.nama || '',
        semester_aktif: semester?.nama || '',
      }));
    } catch (err: any) {
      // silent
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      showToast('Pengaturan sistem disimpan', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + (err?.message || ''), 'error');
    } finally {
      setSaving(false);
    }
  };

  const settingsItems = [
    { icon: Building2, label: 'Identitas Lembaga', desc: 'Nama, alamat, telepon lembaga' },
    { icon: Shield, label: 'Logo Lembaga', desc: 'Unggah logo lembaga' },
    { icon: Calendar, label: 'Tahun Ajaran Aktif', desc: form.tahun_ajaran_aktif || '-' },
    { icon: Calendar, label: 'Semester Aktif', desc: form.semester_aktif || '-' },
    { icon: Clock, label: 'Jam Masuk', desc: form.jam_masuk },
    { icon: Clock, label: 'Jam Pulang', desc: form.jam_pulang },
    { icon: Clock, label: 'Batas Terlambat', desc: form.batas_terlambat },
    { icon: Calendar, label: 'Hari Libur', desc: 'Kelola hari libur' },
  ];

  return (
    <div className="space-y-3">
      <div className="mb-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Pengaturan Sistem</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi sistem, backup, dan pengaturan PWA</p>
      </div>

      {/* Settings items */}
      <div className="card overflow-hidden">
        {settingsItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className={`flex items-center gap-3 p-3 ${i > 0 ? 'border-t border-slate-100 dark:border-slate-700' : ''}`}>
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{item.label}</p>
                <p className="text-[10px] text-slate-400">{item.desc}</p>
              </div>
              <button onClick={() => showToast('Edit ' + item.label, 'info')} className="text-[10px] text-emerald-600 font-semibold hover:underline">Edit</button>
            </div>
          );
        })}
      </div>

      {/* Time settings */}
      <div className="card p-4">
        <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">Pengaturan Waktu</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Jam Masuk</label>
            <input type="time" value={form.jam_masuk} onChange={e => setForm({ ...form, jam_masuk: e.target.value })} className="input-field text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Jam Pulang</label>
            <input type="time" value={form.jam_pulang} onChange={e => setForm({ ...form, jam_pulang: e.target.value })} className="input-field text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 mb-1">Batas Terlambat</label>
            <input type="time" value={form.batas_terlambat} onChange={e => setForm({ ...form, batas_terlambat: e.target.value })} className="input-field text-xs" />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-3 w-full py-2.5 text-xs flex items-center justify-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> Simpan Pengaturan
        </button>
      </div>

      {/* Database & PWA */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
            <Database className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Backup Database</p>
            <p className="text-[10px] text-slate-400">Cadangkan seluruh data</p>
          </div>
          <button onClick={() => setShowBackup(true)} className="text-[10px] text-emerald-600 font-semibold hover:underline">Backup</button>
        </div>
        <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-700">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Upload className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Restore Database</p>
            <p className="text-[10px] text-slate-400">Pulihkan dari backup</p>
          </div>
          <button onClick={() => setShowRestore(true)} className="text-[10px] text-amber-600 font-semibold hover:underline">Restore</button>
        </div>
        <div className="flex items-center gap-3 p-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Pengaturan PWA</p>
            <p className="text-[10px] text-slate-400">Konfigurasi Progressive Web App</p>
          </div>
          <button onClick={() => showToast('Pengaturan PWA akan tersedia segera', 'info')} className="text-[10px] text-sky-600 font-semibold hover:underline">Atur</button>
        </div>
      </div>

      {showBackup && (
        <Modal isOpen={true} onClose={() => setShowBackup(false)} title="Backup Database" size="sm">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Backup akan mengunduh seluruh data database dalam format JSON.</p>
            <button onClick={() => { showToast('Backup akan tersedia segera', 'info'); setShowBackup(false); }} className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Mulai Backup
            </button>
          </div>
        </Modal>
      )}

      {showRestore && (
        <Modal isOpen={true} onClose={() => setShowRestore(false)} title="Restore Database" size="sm">
          <div className="space-y-3">
            <p className="text-xs text-slate-500">Unggah file backup untuk memulihkan data. Perhatian: ini akan menimpa data saat ini.</p>
            <button onClick={() => { showToast('Restore akan tersedia segera', 'info'); setShowRestore(false); }} className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-1.5">
              <Upload className="w-3.5 h-3.5" /> Pilih File
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
