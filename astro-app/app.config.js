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
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astro-app',
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
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
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