#!/bin/bash

# Script untuk restore repo ke state tanggal 8 Oktober 2026 (Opsi 3 - DESTRUCTIVE)
# Author: GitHub Copilot
# WARNING: Ini akan menghapus semua perubahan setelah commit 96b25a218c1c7b894d6a64350e9248617c8a0d0f

set -e  # Exit jika ada error

echo "=========================================="
echo "RESTORE REPO KE TANGGAL 8 OKTOBER 2026"
echo "=========================================="
echo ""
echo "⚠️  PERINGATAN: Operasi ini DESTRUCTIVE dan TIDAK BISA DIBATALKAN"
echo "Semua perubahan setelah 8 Oktober akan HILANG PERMANEN"
echo ""
read -p "Ketik 'YES' jika Anda yakin ingin melanjutkan: " confirm

if [ "$confirm" != "YES" ]; then
  echo "❌ Operasi dibatalkan."
  exit 1
fi

echo ""
echo "✓ Memulai restore..."
echo ""

# 1) Backup branch main sekarang
echo "1️⃣  Membuat backup branch dari main sekarang (backup-2026-10-09)..."
git branch backup-2026-10-09
echo "   ✓ Backup branch dibuat: git branch -D backup-2026-10-09 untuk hapus"
echo ""

# 2) Stash perubahan lokal yang belum commit (jika ada)
echo "2️⃣  Menyimpan perubahan lokal yang belum di-commit (jika ada)..."
git stash push -u -m "before restore to 2026-10-08" || echo "   ℹ️  Tidak ada perubahan lokal"
echo ""

# 3) Pastikan berada di main
echo "3️⃣  Memastikan Anda berada di branch main..."
git checkout main
echo "   ✓ Sudah di branch main"
echo ""

# 4) Fetch latest dari remote
echo "4️⃣  Mengambil update terbaru dari remote..."
git fetch origin --prune
echo "   ✓ Remote sudah di-update"
echo ""

# 5) Reset ke commit 8 Oktober 2026
echo "5️⃣  Reset seluruh repo ke commit 96b25a218c1c7b894d6a64350e9248617c8a0d0f"
echo "   (Ini adalah state tanggal 8 Oktober 2026)"
git reset --hard 96b25a218c1c7b894d6a64350e9248617c8a0d0f
echo "   ✓ Reset selesai"
echo ""

# 6) Cek status
echo "6️⃣  Status repo sekarang:"
echo ""
git status
echo ""
git log --oneline -5
echo ""

# 7) Konfirmasi push
echo "7️⃣  PUSH ke GitHub"
echo "   Commit sekarang: $(git rev-parse --short HEAD)"
echo "   Branch: main"
echo ""
read -p "Ketik 'PUSH' untuk mengirim ke GitHub (akan menimpa history): " pushconfirm

if [ "$pushconfirm" != "PUSH" ]; then
  echo "❌ Push dibatalkan. Repo lokal sudah di-reset, tapi GitHub belum berubah."
  echo "   Jalankan: git push origin main --force-with-lease"
  exit 1
fi

echo ""
echo "🚀 Pushing ke GitHub dengan --force-with-lease..."
git push origin main --force-with-lease

echo ""
echo "=========================================="
echo "✅ RESTORE SELESAI!"
echo "=========================================="
echo ""
echo "📋 Info:"
echo "   - Repo sekarang: State 8 Oktober 2026"
echo "   - Backup: branch 'backup-2026-10-09' (hapus jika tidak perlu)"
echo "   - GitHub: Sudah di-update dengan force push"
echo ""
echo "🔧 Untuk membatalkan (JIKA PERLU):"
echo "   git reset --hard backup-2026-10-09"
echo "   git push origin main --force-with-lease"
echo ""
