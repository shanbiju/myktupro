import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.shanbiju.scoresneak',
    appName: 'MY KTU PRO',
    webDir: 'dist',
    server: {
        url: 'https://myktu.vercel.app',
        cleartext: true
    }
};

export default config;
