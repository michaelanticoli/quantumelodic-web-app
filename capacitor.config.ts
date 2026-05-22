import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.michaelanticoli.quantumelodic',
  appName: 'MoonTuner',
  webDir: 'dist',
  server: {
    url: 'https://106c9ae0-5906-4f00-b98d-7e0ab06af0d7.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
  backgroundColor: '#0A0A0B',
};

export default config;
