const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const isHttp = apiUrl.startsWith('http://');

export default {
  expo: {
    name: 'AstroTalk',
    slug: 'astrotalk-user',
    version: '1.0.0',
    platforms: ['ios', 'android', 'web'],
    orientation: 'portrait',
    backgroundColor: '#1E1033',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astrotalkuser',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.astrotalk.user',
      buildNumber: '1',
      supportsTablet: false,
      icon: './assets/images/icon.png',
      infoPlist: {
        NSAppTransportSecurity: isHttp
          ? { NSAllowsArbitraryLoads: true }
          : undefined,
      },
    },
    android: {
      package: 'com.astrotalk.user',
      versionCode: 1,
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        backgroundColor: '#1E1033',
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
      backgroundColor: '#1E1033',
    },
    plugins: [
      'expo-router',
      [
        'expo-image-picker',
        {
          photosPermission: 'Chat me photo/video bhejne ke liye gallery access chahiye.',
          cameraPermission: 'Chat me photo lene ke liye camera access chahiye.',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#1E1033',
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          android: { image: './assets/images/splash-icon.png', imageWidth: 200 },
        },
      ],
      [
        'expo-build-properties',
        {
          android: {
            // androidx libs (via RN/Expo 57) require compileSdk >= 36
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            minSdkVersion: 24,
            buildToolsVersion: '36.0.0',
          },
        },
      ],
    ],
    experiments: { typedRoutes: true },
    extra: {
      apiUrl,
      eas: { projectId: '7636ced8-8e7e-456d-9e88-1a8a802d3bf6' },
    },
  },
};