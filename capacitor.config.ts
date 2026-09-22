import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gta6.companion',
  appName: 'GTA 6 Companion',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1024907134135-vujihlafhnfgdv0i1hp8cvfhd8gcg32f.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
