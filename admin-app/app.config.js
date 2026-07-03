const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const isHttp = apiUrl.startsWith('http://');

export default {
  expo: {
    name: 'AstroTalk Admin',
    slug: 'astrotalk-admin',
    version: '1.0.0',
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    backgroundColor: '#0f172a',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astrotalkadmin',
    userInterfaceStyle: 'dark',
    ios: {
      bundleIdentifier: 'com.astrotalk.admin',
      buildNumber: '1',
      supportsTablet: true,
      infoPlist: {
        NSAppTransportSecurity: isHttp
          ? { NSAllowsArbitraryLoads: true }
          : undefined,
      },
    },
    android: {
      package: 'com.astrotalk.admin',
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#0f172a',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
      },
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
      usesCleartextTraffic: isHttp,
      softwareKeyboardLayoutMode: 'pan',
    },
    plugins: [
      [
        'expo-image-picker',
        {
          photosPermission: 'AstroTalk Admin ko photos access chahiye image upload ke liye.',
        },
      ],
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0f172a',
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