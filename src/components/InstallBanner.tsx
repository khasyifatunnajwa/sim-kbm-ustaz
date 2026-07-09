import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function InstallBanner() {
  const { isInstallable, isInstalled, promptInstall, dismissInstall } = usePWAInstall();

  if (isInstalled || !isInstallable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 right-0 z-[60] px-3 pt-2"
      >
        <div className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl shadow-emerald-200 p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">Pasang Aplikasi</p>
            <p className="text-xs text-emerald-50 leading-tight mt-0.5">
              Akses lebih cepat dari layar utama
            </p>
          </div>
          <button
            onClick={promptInstall}
            className="flex items-center gap-1.5 bg-white text-emerald-700 font-bold text-sm px-4 py-2 rounded-xl shadow-sm active:scale-95 transition-transform flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Pasang</span>
          </button>
          <button
            onClick={dismissInstall}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
