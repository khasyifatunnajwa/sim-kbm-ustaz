import { useState, useEffect, useRef } from 'react';
import {
  Camera, MapPin, CheckCircle, AlertCircle, Clock, Loader2,
  CameraOff, Crosshair, X, Image as ImageIcon, Calendar, BookOpen,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import EmptyState from '../components/EmptyState';
import type { Profile, ShowToast, JadwalMengajar, PresensiUstaz } from '../types';

const SUPABASE_URL = 'https://intkcrhsinezswldmokr.supabase.co';
const HARI_LIST = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function getHariToday(): string {
  const day = new Date().getDay();
  return HARI_LIST[day];
}

function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0].substring(0, 5);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

async function getServerTime(): Promise<{ server_time: string; server_date: string; server_hour: string; timestamp: number }> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/server-time`, {
    headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || supabase.supabaseKey}` },
  });
  if (!res.ok) throw new Error('Gagal mengambil waktu server');
  return res.json();
}

async function getGPS(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS tidak tersedia di perangkat ini'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(new Error('Gagal mendapatkan lokasi GPS. Pastikan izin GPS aktif.')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

async function compressImage(file: File, maxSize: number = 1280, quality: number = 0.55): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) { height = Math.round((height / width) * maxSize); width = maxSize; }
        else { width = Math.round((width / height) * maxSize); height = maxSize; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas error');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject('Gagal kompres'), 'image/jpeg', quality);
    };
    img.src = URL.createObjectURL(file);
  });
}

async function addWatermark(file: File, info: any): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, img.height - 150, img.width, 150);
      ctx.font = 'bold 30px Arial'; ctx.fillStyle = '#ffffff';
      ctx.fillText(`${info.namaGuru} | ${info.mapel} | ${info.kelas}`, 20, img.height - 100);
      ctx.fillText(`${info.tanggal} | ${info.jamServer}`, 20, img.height - 60);
      canvas.toBlob((b) => b ? resolve(b) : reject(), 'image/jpeg', 0.6);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function PresensiPage({ showToast, profile }: { showToast: ShowToast; profile: Profile | null }) {
  const [jadwalList, setJadwalList] = useState<JadwalMengajar[]>([]);
  const [todayPresensi, setTodayPresensi] = useState<PresensiUstaz[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<JadwalMengajar | null>(null);
  const [gpsData, setGpsData] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    (async () => {
      if (!profile) return;
      const { data: jadwal } = await supabase.from('jadwal_mengajar').select('*').eq('user_id', profile.id);
      setJadwalList((jadwal ?? []) as JadwalMengajar[]);
      const today = new Date().toISOString().split('T')[0];
      const { data: presensi } = await supabase.from('presensi_ustaz').select('*').eq('guru_id', profile.id).eq('tanggal', today);
      setTodayPresensi((presensi ?? []) as PresensiUstaz[]);
      setLoading(false);
    })();
  }, [profile]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) { 
        videoRef.current.srcObject = stream; 
        await videoRef.current.play();
      }
      setCameraOpen(true);
    } catch (err) { setCameraError('Gagal akses kamera. Pastikan izin diizinkan.'); }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) { setCapturedPhoto(blob); setCapturedUrl(URL.createObjectURL(blob)); }
    }, 'image/jpeg', 0.8);
    stopCamera();
  };

  const handlePresensi = async (jadwal: JadwalMengajar) => {
    try {
      const gps = await getGPS();
      setGpsData(gps);
      setSelectedJadwal(jadwal);
      startCamera();
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const submitPresensi = async () => {
    if (!capturedPhoto || !selectedJadwal || !gpsData || !profile) return;
    setUploading(true);
    try {
      const timeData = await getServerTime();
      const watermarked = await addWatermark(capturedPhoto, {
        namaGuru: profile.nama_lengkap || 'Ustaz',
        mapel: selectedJadwal.pelajaran,
        kelas: selectedJadwal.kelas,
        tanggal: timeData.server_date,
        jamServer: timeData.server_hour
      });
      const compressed = await compressImage(new File([watermarked], 'img.jpg'));
      
      const path = `${profile.id}/${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage.from('presensi-ustaz').upload(path, compressed);
      if (uploadErr) throw uploadErr;

      const { error: insertErr } = await supabase.from('presensi_ustaz').insert({
        guru_id: profile.id, jadwal_id: selectedJadwal.id, tanggal: timeData.server_date,
        jam_server: timeData.server_time, latitude: gpsData.latitude, longitude: gpsData.longitude,
        photo_url: `${SUPABASE_URL}/storage/v1/object/public/presensi-ustaz/${path}`, status: 'Hadir'
      });
      
      if (insertErr) throw insertErr;
      showToast('Presensi berhasil!', 'success');
      window.location.reload();
    } catch (err: any) { showToast(err.message, 'error'); }
    setUploading(false);
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-bold text-slate-800">Presensi Mengajar</h2>
      {jadwalList.filter(j => j.hari === getHariToday()).map(j => (
        <div key={j.id} className="card p-4 flex justify-between items-center">
          <div><p className="font-bold text-sm">{j.pelajaran}</p><p className="text-xs text-slate-500">Kelas {j.kelas}</p></div>
          <button onClick={() => handlePresensi(j)} className="btn-primary text-xs">Presensi</button>
        </div>
      ))}

      {/* Modal Kamera - PERBAIKAN: playsInline & muted */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="flex-1 w-full object-cover"
          />
          <div className="p-6 flex justify-center bg-black gap-4">
            <button onClick={() => { stopCamera(); setCapturedPhoto(null); }} className="bg-rose-600 text-white px-4 py-2 rounded-lg">Batal</button>
            <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500" />
          </div>
        </div>
      )}

      {/* Preview */}
      {capturedUrl && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
          <img src={capturedUrl} className="max-h-[60vh] rounded-lg" alt="preview" />
          <div className="flex gap-4 mt-6">
            <button onClick={() => setCapturedUrl(null)} className="btn-secondary">Ulang</button>
            <button onClick={submitPresensi} disabled={uploading} className="btn-primary">{uploading ? 'Mengirim...' : 'Kirim'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
