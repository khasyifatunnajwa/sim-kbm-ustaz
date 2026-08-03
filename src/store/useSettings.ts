import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'hijau' | 'biru' | 'ungu' | 'merah' | 'orange' | 'abu';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type FontWeight = 'normal' | 'semibold';
export type LineSpacing = 'rapat' | 'sedang' | 'lebar';
export type TableSize = 'compact' | 'normal' | 'lebar';
export type IconSize = 'kecil' | 'sedang' | 'besar';
export type RefreshInterval = '1' | '5' | '10' | 'manual';
export type AnimationSpeed = 'fast' | 'normal' | 'slow' | 'off';
export type GenderMode = 'Banin' | 'Banat' | 'Campuran';

export type DashboardWidgetId =
  | 'ringkasanData'
  | 'jadwalHariIni'
  | 'pengumuman'
  | 'agenda'
  | 'statistik'
  | 'aktivitasTerbaru'
  | 'presensiHariIni';

export interface AppSettings {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  compactMode: boolean;

  fontSize: FontSize;
  fontWeight: FontWeight;
  lineSpacing: LineSpacing;

  dashboardWidgets: DashboardWidgetId[];
  dashboardWidgetOrder: DashboardWidgetId[];

  tablePageSize: number;
  tableSize: TableSize;
  tableStickyHeader: boolean;
  tableAutoNumber: boolean;

  notifPengumuman: boolean;
  notifJadwal: boolean;
  notifKbm: boolean;
  notifPresensi: boolean;
  notifNilai: boolean;
  notifSound: boolean;
  notifVibrate: boolean;

  mobileBottomNav: boolean;
  mobileLandscape: boolean;
  mobileAutoHideSidebar: boolean;
  mobileIconSize: IconSize;

  dataSaver: boolean;
  offlineMode: boolean;
  refreshInterval: RefreshInterval;

  a11yLargeButtons: boolean;
  a11yHighContrast: boolean;
  a11yReduceMotion: boolean;
  a11ySeniorMode: boolean;

  animationSpeed: AnimationSpeed;

  genderEnabled: boolean;
  genderOptions: GenderMode[];
  genderDashboardSplit: boolean;
  genderReportSplit: boolean;
  genderLabelBanin: string;
  genderLabelBanat: string;
  genderLabelCampuran: string;

  selectedLembaga: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  themeColor: 'hijau',
  compactMode: false,

  fontSize: 'md',
  fontWeight: 'normal',
  lineSpacing: 'sedang',

  dashboardWidgets: ['ringkasanData', 'jadwalHariIni', 'pengumuman', 'agenda', 'statistik', 'aktivitasTerbaru', 'presensiHariIni'],
  dashboardWidgetOrder: ['ringkasanData', 'jadwalHariIni', 'pengumuman', 'agenda', 'statistik', 'aktivitasTerbaru', 'presensiHariIni'],

  tablePageSize: 10,
  tableSize: 'normal',
  tableStickyHeader: true,
  tableAutoNumber: true,

  notifPengumuman: true,
  notifJadwal: true,
  notifKbm: true,
  notifPresensi: true,
  notifNilai: true,
  notifSound: true,
  notifVibrate: true,

  mobileBottomNav: true,
  mobileLandscape: true,
  mobileAutoHideSidebar: true,
  mobileIconSize: 'sedang',

  dataSaver: false,
  offlineMode: true,
  refreshInterval: '5',

  a11yLargeButtons: false,
  a11yHighContrast: false,
  a11yReduceMotion: false,
  a11ySeniorMode: false,

  animationSpeed: 'normal',

  genderEnabled: false,
  genderOptions: ['Banin', 'Banat'],
  genderDashboardSplit: false,
  genderReportSplit: false,
  genderLabelBanin: 'Banin',
  genderLabelBanat: 'Banat',
  genderLabelCampuran: 'Campuran',

  selectedLembaga: 'all',
};

interface SettingsState {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
  resetPersonalData: () => void;
}

const STORAGE_KEY = 'simkbm-settings';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: { ...DEFAULT_SETTINGS },
      updateSetting: (key, value) =>
        set((state) => ({
          settings: { ...state.settings, [key]: value },
        })),
      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),
      resetSettings: () =>
        set({
          settings: { ...DEFAULT_SETTINGS, dashboardWidgets: [...DEFAULT_SETTINGS.dashboardWidgets], dashboardWidgetOrder: [...DEFAULT_SETTINGS.dashboardWidgetOrder] },
        }),
      resetPersonalData: () =>
        set({
          settings: { ...DEFAULT_SETTINGS, dashboardWidgets: [...DEFAULT_SETTINGS.dashboardWidgets], dashboardWidgetOrder: [...DEFAULT_SETTINGS.dashboardWidgetOrder] },
        }),
    }),
    { name: STORAGE_KEY },
  ),
);
