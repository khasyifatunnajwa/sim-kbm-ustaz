import { useState, useEffect } from 'react';
import { User, Phone, Lock, Shield, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile, ShowToast } from '../types';

export default function ProfilPage({
  profile,
  showToast,
  onRefreshProfile,
}: {
  profile: Profile | null;
  showToast: ShowToast;
  onRefreshProfile: () => void;
}) {
  const [nama, setNama] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [saving, setSaving] = useState(false);

  // Set data awal saat halaman dimuat berdasarkan profile user yang sedang login
  useEffect(() => {
    if (profile) {
      setNama(profile.nama_lengkap || '');
      setNoTelp(profile.nomor_whatsapp || '');
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setSaving(true);
    try {
      // Melakukan update data langsung ke tabel profiles di Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          nama_lengkap: nama,
          nomor_whatsapp: noTelp,
        })
        .eq('id', profile.id);

      if (error) throw error;

      showToast('Profil Anda berhasil diperbarui!', 'success');
      
      // Memanggil fungsi refresh agar data nama di komponen induk (header dll) ikut terupdate
      onRefreshProfile(); 
    } catch (error: any) {
      showToast(error.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
          <User className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="section-title text-xl">Profil Saya</h2>
        <p className="section-subtitle">Kelola informasi data diri Anda</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* INPUT NAMA (BISA DIEDIT) */}
        <div className="card p-4 bg-white shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            Nama Lengkap
          </label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="input-field text-sm font-medium"
            placeholder="Masukkan nama lengkap"
            required
          />
        </div>

        {/* INPUT NO WHATSAPP / TELEPON (BISA DIEDIT) */}
        <div className="card p-4 bg-white shadow-sm border border-slate-100">
          <label className="block text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            No. WhatsApp / Telp
          </label>
          <input
            type="text"
            value={noTelp}
            onChange={(e) => setNoTelp(e.target.value)}
            className="input-field text-sm font-medium"
            placeholder="Contoh: 08123456789"
          />
        </div>

        {/* ID LOGIN (TIDAK BISA DIEDIT) */}
        <div className="card p-4 bg-slate-50/80 border border-slate-200 opacity-80">
          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            ID Login <span className="text-[10px] font-normal text-slate-400">(Tidak dapat diubah)</span>
          </label>
          <input
            type="text"
            value={profile.id_login || '-'}
            disabled
            className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none font-mono cursor-not-allowed"
          />
        </div>

        {/* STATUS / ROLE (TIDAK BISA DIEDIT) */}
        <div className="card p-4 bg-slate-50/80 border border-slate-200 opacity-80">
          <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            Status Hak Akses <span className="text-[10px] font-normal text-slate-400">(Tidak dapat diubah)</span>
          </label>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-semibold text-slate-700 capitalize">
              {profile.role || 'Ustaz'}
            </span>
            <span className={`badge text-[10px] ${profile.is_active ? 'badge-success' : 'badge-danger'}`}>
              {profile.is_active ? 'Akun Aktif' : 'Non-Aktif'}
            </span>
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2 rounded-2xl shadow-lg shadow-emerald-100 font-bold transition-all text-sm mt-6"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Menyimpan Perubahan...' : 'Simpan Profil'}
        </button>
      </form>
    </div>
  );
}
