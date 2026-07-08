import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export function generatePDF(
  title: string,
  headers: string[],
  body: (string | number)[][],
  extraInfo: string[] = []
) {
  const doc = new jsPDF();

  // Header dengan logo dan nama sekolah
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(5, 150, 105);
  doc.text('SIM KBM USTAZ', 105, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Sistem Informasi Manajemen Kegiatan Belajar Mengajar', 105, 20, { align: 'center' });

  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.5);
  doc.line(14, 25, 196, 25);

  // Title
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(5, 150, 105);
  doc.text(title, 14, 33);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  let startY = 39;
  extraInfo.forEach(info => {
    doc.text(info, 14, startY);
    startY += 5;
  });

  (doc as any).autoTable({
    startY: startY + 4,
    head: [headers],
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [5, 150, 105],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
      textColor: [255, 255, 255],
    },
    styles: {
      fontSize: 8,
      font: 'Helvetica',
      textColor: [51, 65, 85],
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Dokumen ini dicetak dari SIM KBM Ustaz pada ' + new Date().toLocaleDateString('id-ID'), 105, pageHeight - 10, { align: 'center' });

  doc.save(`${title.replace(/ /g, '_')}.pdf`);
}

export function generateRaporPDF(
  murid: { nama: string; kelas: string; domisili?: string; alamat?: string },
  absenData: { hadir: number; izin: number; sakit: number; alpha: number; telat?: number; total: number },
  nilaiList: { pelajaran: string; jenis_ujian: string; skor: number }[],
  perilakuList: { catatan: string; jenis: string; created_at?: string }[],
  capaianList: { capaian: string; tanggal: string }[],
  ustadzEmail?: string
) {
  const doc = new jsPDF();

  // KOP SURAT
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(5, 150, 105);
  doc.text('RAPOR AKADEMIK SANTRI', 105, 18, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Sistem Informasi Manajemen KBM Ustaz', 105, 25, { align: 'center' });

  doc.setFontSize(8);
  doc.text('Lembaga Pendidikan Islam Terpadu', 105, 30, { align: 'center' });

  doc.setDrawColor(5, 150, 105);
  doc.setLineWidth(0.8);
  doc.line(14, 35, 196, 35);

  doc.setLineWidth(0.3);
  doc.line(14, 36.5, 196, 36.5);

  // DATA SANTRI
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(51, 65, 85);
  doc.text('DATA SANTRI', 14, 45);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  const dataDiri = [
    ['Nama Lengkap', murid.nama],
    ['Kelas', murid.kelas],
    ['Domisili', murid.domisili || '-'],
    ['Alamat Lengkap', murid.alamat || '-'],
    ['Wali Kelas/Pengajar', ustadzEmail?.split('@')[0] || 'Ustaz'],
    ['Tanggal Cetak', new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
  ];

  let y = 51;
  dataDiri.forEach(([label, value]) => {
    doc.setFont('Helvetica', 'bold');
    doc.text(`${label}`, 14, y);
    doc.setFont('Helvetica', 'normal');
    doc.text(`: ${value}`, 55, y);
    y += 6;
  });

  // REKAP KEHADIRAN
  y += 6;
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('REKAPITULASI KEHADIRAN', 14, y);
  y += 6;

  const totalHadir = absenData.hadir;
  const totalAll = absenData.total;
  const kehadiranPct = totalAll > 0 ? ((totalHadir / totalAll) * 100).toFixed(1) : '0';

  const absenHeaders = ['Status', 'Jumlah', 'Persentase'];
  const absenBody = [
    ['Hadir', absenData.hadir.toString(), `${totalAll > 0 ? ((absenData.hadir / totalAll) * 100).toFixed(1) : 0}%`],
    ['Izin', absenData.izin.toString(), `${totalAll > 0 ? ((absenData.izin / totalAll) * 100).toFixed(1) : 0}%`],
    ['Sakit', absenData.sakit.toString(), `${totalAll > 0 ? ((absenData.sakit / totalAll) * 100).toFixed(1) : 0}%`],
    ['Alpha', absenData.alpha.toString(), `${totalAll > 0 ? ((absenData.alpha / totalAll) * 100).toFixed(1) : 0}%`],
    ['Telat', (absenData.telat || 0).toString(), `${totalAll > 0 ? (((absenData.telat || 0) / totalAll) * 100).toFixed(1) : 0}%`],
    ['Total', absenData.total.toString(), '100%'],
  ];

  (doc as any).autoTable({
    startY: y,
    head: [absenHeaders],
    body: absenBody,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], fontSize: 9, textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // NILAI AKADEMIK
  if (nilaiList.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('NILAI AKADEMIK', 14, y);
    y += 6;

    const avgNilai = nilaiList.reduce((s, n) => s + n.skor, 0) / nilaiList.length;
    const predikat = avgNilai >= 90 ? 'A' : avgNilai >= 80 ? 'B' : avgNilai >= 70 ? 'C' : avgNilai >= 60 ? 'D' : 'E';

    (doc as any).autoTable({
      startY: y,
      head: [['No', 'Mata Pelajaran', 'Jenis Ujian', 'Skor', 'Predikat']],
      body: nilaiList.map((n, i) => {
        const pred = n.skor >= 90 ? 'A' : n.skor >= 80 ? 'B' : n.skor >= 70 ? 'C' : n.skor >= 60 ? 'D' : 'E';
        return [i + 1, n.pelajaran, n.jenis_ujian, n.skor.toString(), pred];
      }),
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], fontSize: 9, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 4;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Rata-rata Nilai: ${avgNilai.toFixed(1)} (${predikat})`, 14, y);
    y += 8;
  }

  // CAPAIAN HAFALAN
  if (capaianList.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CAPAIAN HAFALAN', 14, y);
    y += 6;

    (doc as any).autoTable({
      startY: y,
      head: [['No', 'Tanggal', 'Capaian']],
      body: capaianList.map((c, i) => [i + 1, new Date(c.tanggal).toLocaleDateString('id-ID'), c.capaian]),
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], fontSize: 9, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // CATATAN PERILAKU
  if (perilakuList.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('CATATAN PERILAKU', 14, y);
    y += 6;

    (doc as any).autoTable({
      startY: y,
      head: [['No', 'Jenis', 'Tanggal', 'Catatan']],
      body: perilakuList.map((p, i) => [
        i + 1,
        p.jenis === 'prestasi' ? 'Prestasi' : p.jenis === 'pelanggaran' ? 'Pelanggaran' : 'Catatan',
        new Date(p.created_at || new Date()).toLocaleDateString('id-ID'),
        p.catatan,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], fontSize: 9, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 14, right: 14 },
    });
  }

  // TANDA TANGAN
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setFont('Helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }), 150, pageHeight - 35);
  doc.text('Wali Kelas', 150, pageHeight - 28);
  doc.text('________________________', 150, pageHeight - 15);
  doc.text('________________________', 40, pageHeight - 15);
  doc.text('Orang Tua/Wali', 40, pageHeight - 28);

  // FOOTER
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Dokumen ini dihasilkan oleh SIM KBM Ustaz - Sistem Informasi Manajemen Kegiatan Belajar Mengajar', 105, pageHeight - 5, { align: 'center' });

  doc.save(`Rapor_${murid.nama.replace(/ /g, '_')}.pdf`);
}

export function shareWA(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}
