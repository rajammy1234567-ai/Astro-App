const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';
const isHttp = apiUrl.startsWith('http://');

export default {
  expo: {
    name: 'AstroTalk Partner',
    slug: 'astrotalk-astro',
    version: '1.0.0',
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    backgroundColor: '#1E1033',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astro-app',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.astrotalk.astro',
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
      package: 'com.astrotalk.astro',
      versionCode: 1,
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        backgroundColor: '#1E1033',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      permissions: ['INTERNET', 'ACCESS_NETWORK_STATE', 'READ_MEDIA_IMAGES', 'READ_EXTERNAL_STORAGE', 'CAMERA', 'RECORD_AUDIO'],
      usesCleartextTraffic: isHttp,
      softwareKeyboardLayoutMode: 'pan',
    },
    plugins: [
      'expo-router',
      [
        'expo-image-picker',
        {
          photosPermission: 'Profile photos upload karne ke liye gallery access chahiye',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Live session ke liye camera access chahiye',
          microphonePermission: 'Live session ke liye microphone access chahiye',
          recordAudioAndroid: true,
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
      eas: {"projectId": "bd897ff7-209e-4dc9-a215-33ae6875352f"},
    },
  },
};