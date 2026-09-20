import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gta6.companion',
  appName: 'GTA 6 Companion',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
