import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bprara.app',
  appName: 'BPR ARA',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
