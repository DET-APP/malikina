import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.almoutahabbina.app',
  appName: 'Al Moutahabbina',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: false,
  },
  ios: {
    backgroundColor: '#ffffff',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#28655c',
      splashFullScreen: true,
      splashImmersive: true,
      androidSplashResourceName: 'splash',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#28655c',
      overlaysWebView: false,
    },
  },
};

export default config;
