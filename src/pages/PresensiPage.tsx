import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, MapPin, CheckCircle, AlertCircle, Clock, Loader2,
  CameraOff, Crosshair, X, Image as ImageIcon, Calendar, BookOpen,
  ClipboardCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getUstazScope } from '../lib/ustazData';
import EmptyState from '../components/EmptyState';
import type { Profile, ShowToast, JadwalMengajar, PresensiUstaz, ActiveTab } from '../types';

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
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => {
        if (err.code === 1) reject(new Error('Izin GPS ditolak. Aktifkan GPS di pengaturan browser.'));
        else if (err.code === 2) reject(new Error('Posisi GPS tidak tersedia. Pastikan GPS aktif.'));
        else if (err.code === 3) reject(new Error('GPS timeout. Coba lagi.'));
        else reject(new Error('Gagal mendapatkan lokasi GPS'));
      },
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
        if (width > height) {
          height = Math.round((height / width) * maxSize);
          width = maxSize;
        } else {
          width = Math.round((width / height) * maxSize);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas tidak didukung')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Gagal mengompres gambar'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar'));
    img.src = URL.createObjectURL(file);
  });
}

async function addWatermark(
  file: File,
  info: { namaGuru: string; mapel: string; kelas: string; hari: string; tanggal: string; jamServer: string; latitude: number; longitude: number; akurasi: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxSize = 1280;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height / width) * maxSize);
          width = maxSize;
        } else {
          width = Math.round((width / height) * maxSize);
          height = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas tidak didukung')); return; }

      ctx.drawImage(img, 0, 0, width, height);

      const watermarkHeight = Math.min(180, Math.max(100, height * 0.18));
      const gradient = ctx.createLinearGradient(0, height - watermarkHeight, 0, height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(0.3, 'rgba(0,0,0,0.7)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, height - watermarkHeight, width, watermarkHeight);

      const fontSize = Math.max(11, Math.min(16, width / 80));
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';

      const lines = [
        `${info.namaGuru}`,
        `${info.mapel} - ${info.kelas}`,
        `${info.hari}, ${info.tanggal}`,
        `Jam: ${info.jamServer}`,
        `GPS: ${info.latitude.toFixed(6)}, ${info.longitude.toFixed(6)}`,
        `Akurasi: ${info.akurasi.toFixed(1)}m`,
      ];

      const lineHeight = fontSize * 1.4;
      const startY = height - watermarkHeight + 12;
      lines.forEach((line, i) => {
        ctx.fillText(line, 12, startY + i * lineHeight);
      });

      const stampSize = fontSize * 1.2;
      ctx.font = `bold ${stampSize}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'right';
      ctx.fillText('SIM KBM Ustaz', width - 12, height - 12);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Gagal membuat watermark'));
        },
        'image/jpeg',
        0.55
      );
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar untuk watermark'));
    img.src = URL.createObjectURL(file);
  });
}

export default function PresensiPage({ showToast, profile, setActiveTab }: { showToast: ShowToast; profile: Profile | null; setActiveTab: (tab: ActiveTab) => void }) {
  const [jadwalList, setJadwalList] = useState<JadwalMengajar[]>([]);
  const [todayPresensi, setTodayPresensi] = useState<PresensiUstaz[]>([]);
  const [loading, setLoading] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [gpsData, setGpsData] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [selectedJadwal, setSelectedJadwal] = useState<JadwalMengajar | null>(null);
  const [serverTime, setServerTime] = useState<string>('');
  const [serverDate, setServerDate] = useState('');

  // State untuk notifikasi & tombol Absen Kelas setelah presensi berhasil
  const [successJadwal, setSuccessJadwal] = useState<JadwalMengajar | null>(null);
  const [lateMinutes, setLateMinutes] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const hariToday = getHariToday();
  const now = new Date();
  const currentMinutes = timeToMinutes(formatTime(now));

  // --- KODE SAKTI KUNCI PERBAIKAN KAMERA ---
  // Pastikan stream ditempel saat kotak (modal) video terbuka.
  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("AutoPlay tertunda: ", e));
    }
  }, [cameraOpen]);
  // ----------------------------------------

  useEffect(() => {
    (async () => {
      if (!profile) return;
      setLoading(true);
      try {
        const { data: jadwalData } = await supabase
          .from('jadwal_mengajar')
          .select('*')
          .eq('user_id', profile.id)
          .order('jam_mulai');

        setJadwalList((jadwalData ?? []) as JadwalMengajar[]);

        const today = new Date().toISOString().split('T')[0];
        const { data: presensiData } = await supabase
          .from('presensi_ustaz')
          .select('*')
          .eq('guru_id', profile.id)
          .eq('tanggal', today)
          .order('jam_server', { ascending: false });

        setTodayPresensi((presensiData ?? []) as PresensiUstaz[]);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const todayJadwal = jadwalList.filter(j => j.hari === hariToday);

  const isWithinSchedule = (jadwal: JadwalMengajar): boolean => {
    const start = timeToMinutes(jadwal.jam_mulai);
    const end = jadwal.jam_selesai ? timeToMinutes(jadwal.jam_selesai) : start + 90;
    return currentMinutes >= start - 15 && currentMinutes <= end + 30;
  };

  const hasAlreadyPresensi = (jadwalId: string): boolean => {
    return todayPresensi.some(p => p.jadwal_id === jadwalId);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Izin kamera ditolak. Aktifkan kamera di pengaturan browser.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('Kamera tidak ditemukan di perangkat ini.');
      } else {
        setCameraError('Gagal mengakses kamera: ' + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedPhoto(blob);
        setCapturedUrl(URL.createObjectURL(blob));
      }
    }, 'image/jpeg', 0.7);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedUrl(null);
    startCamera();
  };

  const handlePresensi = async (jadwal: JadwalMengajar) => {
    if (!profile) return;

    if (hasAlreadyPresensi(jadwal.id)) {
      showToast('Anda sudah melakukan presensi untuk jadwal ini hari ini.', 'error');
      return;
    }

    if (!isWithinSchedule(jadwal)) {
      showToast('Presensi hanya bisa dilakukan 15 menit sebelum hingga 30 menit setelah jadwal.', 'error');
      return;
    }

    setSelectedJadwal(jadwal);

    setGpsLoading(true);
    try {
      const gps = await getGPS();
      setGpsData(gps);
    } catch (err: any) {
      showToast(err.message || 'Gagal mendapatkan GPS', 'error');
      setGpsLoading(false);
      return;
    }
    setGpsLoading(false);

    await startCamera();
  };

  const submitPresensi = async () => {
    if (!profile || !selectedJadwal || !capturedPhoto || !gpsData) {
      showToast('Data presensi tidak lengkap', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const serverTimeData = await getServerTime();
      setServerTime(serverTimeData.server_hour);
      setServerDate(serverTimeData.server_date);

      const serverDateObj = new Date(serverTimeData.server_time);
      const tanggalStr = serverTimeData.server_date;
      const jamServerStr = serverTimeData.server_time;

      const namaGuru = profile.nama_lengkap || profile.nama_panggilan || 'Ustaz';
      const watermarkInfo = {
        namaGuru,
        mapel: selectedJadwal.pelajaran,
        kelas: selectedJadwal.kelas,
        hari: selectedJadwal.hari,
        tanggal: serverDateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        jamServer: serverTimeData.server_hour,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        akurasi: gpsData.accuracy,
      };

      const watermarkedBlob = await addWatermark(capturedPhoto, watermarkInfo);

      const compressedBlob = await compressImage(
        new File([watermarkedBlob], 'presensi.jpg', { type: 'image/jpeg' }),
        1280,
        0.55
      );

      const now = new Date();
      const tahun = now.getFullYear();
      const bulan = String(now.getMonth() + 1).padStart(2, '0');
      const tanggal = String(now.getDate()).padStart(2, '0');
      const timestamp = now.getTime();
      const filePath = `${profile.id}/${tahun}/${bulan}/${tanggal}/${timestamp}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('presensi-ustaz')
        .upload(filePath, compressedBlob, {
          contentType: 'image/jpeg',
          upsert: false,
          onUploadProgress: (ev) => {
            if (ev.total > 0) {
              setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
            }
          },
        });

      if (uploadError) throw uploadError;

      const photoUrl = `${SUPABASE_URL}/storage/v1/object/public/presensi-ustaz/${uploadData.path}`;

      const jadwalStart = timeToMinutes(selectedJadwal.jam_mulai);
      const serverMinutes = timeToMinutes(serverTimeData.server_hour);
      const isLate = serverMinutes > jadwalStart + 15;
      const status = isLate ? 'Terlambat' : 'Hadir';

      const { error: insertError } = await supabase.from('presensi_ustaz').insert({
        guru_id: profile.id,
        jadwal_id: selectedJadwal.id,
        tanggal: tanggalStr,
        jam_server: jamServerStr,
        latitude: gpsData.latitude,
        longitude: gpsData.longitude,
        akurasi_gps: gpsData.accuracy,
        status,
        photo_url: photoUrl,
      });

      if (insertError) throw insertError;

      const today = new Date().toISOString().split('T')[0];
      const { data: newPresensi } = await supabase
        .from('presensi_ustaz')
        .select('*')
        .eq('guru_id', profile.id)
        .eq('tanggal', today)
        .order('jam_server', { ascending: false });

      setTodayPresensi((newPresensi ?? []) as PresensiUstaz[]);

      // --- Hitung keterlambatan berdasarkan jam_masuk (jam_mulai jadwal) ---
      // Bandingkan waktu server saat presensi dikirim dengan jam_mulai jadwal.
      // Toleransi tepat waktu: 10 menit dari jam masuk.
      const jamMasukMinutes = timeToMinutes(selectedJadwal.jam_mulai);
      const submitMinutes = timeToMinutes(serverTimeData.server_hour);
      const lateThreshold = 10; // menit toleransi
      const diffMinutes = submitMinutes - jamMasukMinutes;

      if (diffMinutes > lateThreshold) {
        setLateMinutes(diffMinutes);
        showToast(`Anda terlambat ${diffMinutes} menit dari jam masuk.`, 'info');
      } else {
        setLateMinutes(0);
        showToast('Terima kasih telah melakukan presensi dan datang tepat waktu.', 'success');
      }

      // Simpan jadwal yang baru dipresensi untuk menampilkan tombol "Absen Kelas"
      setSuccessJadwal(selectedJadwal);

      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
      setCapturedPhoto(null);
      setCapturedUrl(null);
      setSelectedJadwal(null);
      setGpsData(null);
      setServerTime('');
      setServerDate('');
    } catch (err: any) {
      console.error('Presensi error:', err);
      showToast(err.message || 'Gagal melakukan presensi', 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const cancelPresensi = () => {
    stopCamera();
    if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    setCapturedPhoto(null);
    setCapturedUrl(null);
    setSelectedJadwal(null);
    setGpsData(null);
    setCameraError(null);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (capturedUrl) URL.revokeObjectURL(capturedUrl);
    };
  }, [capturedUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-emerald-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Presensi Mengajar</h2>
            <p className="text-emerald-100 text-xs">{hariToday}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <p className="text-emerald-100 text-xs leading-relaxed">
          Lakukan presensi dengan foto kelas dan GPS. Foto akan otomatis dihapus setelah 24 jam.
        </p>
      </div>

      {/* Notifikasi & Tombol Absen Kelas setelah presensi berhasil */}
      {successJadwal && (
        <div className="card p-4 bg-emerald-50 border border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-emerald-800">Presensi Berhasil</p>
              <p className="text-xs text-emerald-700 mt-1">
                {lateMinutes !== null && lateMinutes > 0
                  ? `Anda terlambat ${lateMinutes} menit dari jam masuk.`
                  : 'Terima kasih telah melakukan presensi dan datang tepat waktu.'}
              </p>
              <button
                onClick={() => {
                  setActiveTab('absensi');
                  setSuccessJadwal(null);
                  setLateMinutes(null);
                }}
                className="btn-primary text-xs px-4 py-2 mt-3 flex items-center gap-1.5"
              >
                <ClipboardCheck className="w-4 h-4" />
                Absen Kelas {successJadwal.kelas}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          Jadwal Hari Ini
        </h3>
        {todayJadwal.length === 0 ? (
          <EmptyState
            title="Tidak ada jadwal hari ini"
            description="Anda tidak memiliki jadwal mengajar untuk hari ini"
            icon={<Calendar className="w-8 h-8 text-slate-300" />}
          />
        ) : (
          <div className="space-y-3">
            {todayJadwal.map((jadwal) => {
              const alreadyDone = hasAlreadyPresensi(jadwal.id);
              const withinTime = isWithinSchedule(jadwal);
              const isUpcoming = timeToMinutes(jadwal.jam_mulai) > currentMinutes;

              return (
                <div
                  key={jadwal.id}
                  className={`card p-4 ${alreadyDone ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge badge-success">
                          <Clock className="w-3 h-3 mr-1" />
                          {jadwal.jam_mulai}{jadwal.jam_selesai ? ` - ${jadwal.jam_selesai}` : ''}
                        </span>
                      </div>
                      <p className="font-bold text-slate-800 text-sm">{jadwal.pelajaran}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kelas {jadwal.kelas}{jadwal.ruangan ? ` - ${jadwal.ruangan}` : ''}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {alreadyDone ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-xs font-bold">Selesai</span>
                        </div>
                      ) : withinTime ? (
                        <button
                          onClick={() => handlePresensi(jadwal)}
                          disabled={uploading || gpsLoading}
                          className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                        >
                          <Camera className="w-4 h-4" />
                          Presensi
                        </button>
                      ) : isUpcoming ? (
                        <span className="text-xs text-slate-400 font-medium px-3 py-1.5 bg-slate-50 rounded-lg">
                          Belum waktunya
                        </span>
                      ) : (
                        <span className="text-xs text-rose-400 font-medium px-3 py-1.5 bg-rose-50 rounded-lg">
                          Terlewat
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Today's Presensi History */}
      {todayPresensi.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Riwayat Presensi Hari Ini
          </h3>
          <div className="space-y-2">
            {todayPresensi.map((p) => (
              <div key={p.id} className="card p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  p.status === 'Hadir' ? 'bg-emerald-50 text-emerald-600' :
                  p.status === 'Terlambat' ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-50 text-slate-400'
                }`}>
                  {p.status === 'Hadir' ? <CheckCircle className="w-5 h-5" /> :
                   p.status === 'Terlambat' ? <Clock className="w-5 h-5" /> :
                   <AlertCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{p.status}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(p.jam_server).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    {p.photo_expired ? ' - Foto kedaluwarsa' : ''}
                  </p>
                </div>
                {p.photo_url && !p.photo_expired && (
                  <a
                    href={p.photo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GPS Loading */}
      {gpsLoading && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 max-w-xs w-full">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
              <Crosshair className="w-6 h-6 text-emerald-600 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Mengambil lokasi GPS...</p>
            <p className="text-xs text-slate-400">Pastikan GPS aktif</p>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-slate-900">
            <div className="flex items-center gap-2 text-white">
              <Camera className="w-5 h-5" />
              <span className="font-bold text-sm">Ambil Foto Kelas</span>
            </div>
            <button onClick={cancelPresensi} className="p-2 rounded-lg hover:bg-slate-800 text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 relative overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-48 border-2 border-white/50 rounded-2xl border-dashed" />
            </div>
            <div className="absolute bottom-4 left-0 right-0 text-center">
              <p className="text-white/80 text-xs bg-slate-900/60 inline-block px-3 py-1 rounded-full">
                Posisikan kelas dalam bingkai
              </p>
            </div>
          </div>
          <div className="p-6 bg-slate-900 flex justify-center">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-emerald-400 active:scale-90 transition-transform flex items-center justify-center"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500" />
            </button>
          </div>
        </div>
      )}

      {/* Camera Error */}
      {cameraError && !cameraOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 max-w-sm w-full">
            <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center">
              <CameraOff className="w-6 h-6 text-rose-500" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Kamera Tidak Tersedia</p>
            <p className="text-xs text-slate-400 text-center">{cameraError}</p>
            <button onClick={() => setCameraError(null)} className="btn-secondary text-sm">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Photo Preview & Submit */}
      {capturedUrl && selectedJadwal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Konfirmasi Presensi</h3>
              <button onClick={cancelPresensi} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <img src={capturedUrl} alt="Presensi" className="w-full rounded-xl" />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>{selectedJadwal.pelajaran} - Kelas {selectedJadwal.kelas}</span>
                </div>
                {gpsData && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>GPS: {gpsData.latitude.toFixed(6)}, {gpsData.longitude.toFixed(6)} ({gpsData.accuracy.toFixed(0)}m)</span>
                  </div>
                )}
              </div>
              {uploading ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    <span>Mengunggah presensi... {uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={retakePhoto} className="btn-secondary flex-1 text-sm">
                    Ambil Ulang
                  </button>
                  <button onClick={submitPresensi} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Kirim Presensi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
