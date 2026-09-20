import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.classconnect.app',
  appName: 'ClassConnect',
  webDir: 'dist',
  server: {
    url: 'http://192.168.29.216:5000',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
