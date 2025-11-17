import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.i9.frotachecklist',
  appName: 'Frota I9',
  webDir: 'www',
  server: {
    cleartext: true,
    // Permite acesso a servidores externos no mobile
    androidScheme: 'https'
  },
  plugins: {
    // Permite requisições HTTP em Android
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
