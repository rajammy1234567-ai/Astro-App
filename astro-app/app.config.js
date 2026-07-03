const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const isHttp = apiUrl.startsWith('http://');

export default {
  expo: {
    name: 'AstroTalk Partner',
    slug: 'astrotalk-astro',
    version: '1.0.0',
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    backgroundColor: '#FFFCF8',
    primaryColor: '#8b5cf6',
    icon: './assets/images/icon.png',
    scheme: 'astrotalkastro',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.astrotalk.astro',
      buildNumber: '1',
      supportsTablet: false,
      infoPlist: {
        NSAppTransportSecurity: isHttp
          ? { NSAllowsArbitraryLoads: true }
          : undefined,
      },
    },
    android: {
      package: 'com.astrotalk.astro',
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#8b5cf6',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
      },
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
      usesCleartextTraffic: isHttp,
      softwareKeyboardLayoutMode: 'pan',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#8b5cf6',
          android: { image: './assets/images/splash-icon.png', imageWidth: 76 },
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            minSdkVersion: 24,
          },
        },
      ],
    ],
    experiments: { typedRoutes: true },
    extra: {
      apiUrl,
      eas: { projectId: process.env.EAS_PROJECT_ID || undefined },
    },
  },
};