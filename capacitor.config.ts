import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stockflow.app',
  appName: 'StockFlow',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allows HTTP communication with local development / LAN backend IP
  },
};

export default config;
