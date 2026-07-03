const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const isHttp = apiUrl.startsWith('http://');

export default {
  expo: {
    name: 'AstroTalk',
    slug: 'astrotalk-user',
    version: '1.0.0',
    platforms: ['ios', 'android', 'web'],
    orientation: 'portrait',
    backgroundColor: '#FFFCF8',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astrotalkuser',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.astrotalk.user',
      buildNumber: '1',
      supportsTablet: false,
      icon: './assets/expo.icon',
      infoPlist: {
        NSAppTransportSecurity: isHttp
          ? { NSAllowsArbitraryLoads: true }
          : undefined,
      },
    },
    android: {
      package: 'com.astrotalk.user',
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE'],
      usesCleartextTraffic: isHttp,
      softwareKeyboardLayoutMode: 'pan',
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
      themeColor: '#FDB913',
      backgroundColor: '#FFFCF8',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#FDB913',
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