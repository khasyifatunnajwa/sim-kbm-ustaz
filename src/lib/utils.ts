export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hari = namaHari[d.getDay()];
  const tgl = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  return `${hari}, ${tgl}`;
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const namaHari = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

export function getHariIni(): string {
  return namaHari[new Date().getDay()];
}

export function getTanggalHariIni(): string {
  return new Date().toISOString().split('T')[0];
}
