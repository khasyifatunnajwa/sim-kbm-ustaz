import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bustanululum.simkbm',
  appName: 'SIM KBM Ustaz',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
    backgroundColor: '#ffffff',
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#059669',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#059669',
      overlaysWebView: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon',
      iconColor: '#059669',
      sound: 'notification.wav',
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
