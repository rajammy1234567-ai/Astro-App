const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://astro-app-ru1d.onrender.com/api';
const isHttp = apiUrl.startsWith('http://');

/**
 * Crash-safe Android APK config (Partner / Astrologer) — v1.0.5
 * - New Architecture ON (required for Expo SDK 57 / RN 0.86 / Reanimated 4)
 * - Agora package REMOVED (libagora*.so was crashing release APKs on launch)
 * - edge-to-edge OFF
 * - minify/shrink OFF
 * - legacy packaging + pickFirst
 * - Production API = Render HTTPS
 * EAS owner: sharma_sunaina
 */
export default {
  expo: {
    name: 'AstroTalk Partner',
    slug: 'astrotalk-astro',
    owner: 'sharma_sunaina',
    version: '1.0.5',
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    backgroundColor: '#1E1033',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astro-app',
    userInterfaceStyle: 'automatic',
    // Expo 55+ / RN 0.82+: New Arch is mandatory. false is ignored and leaves
    // Reanimated 4 / Worklets in a broken native state → instant open crash.
    newArchEnabled: true,
    jsEngine: 'hermes',
    ios: {
      bundleIdentifier: 'com.astrotalk.astro',
      buildNumber: '5',
      supportsTablet: false,
      icon: './assets/images/icon.png',
      infoPlist: {
        NSMicrophoneUsageDescription: 'User se voice call ke liye microphone chahiye.',
        NSCameraUsageDescription: 'Video call / live ke liye camera chahiye.',
        NSAppTransportSecurity: isHttp
          ? { NSAllowsArbitraryLoads: true }
          : undefined,
      },
    },
    android: {
      package: 'com.astrotalk.astro',
      versionCode: 6,
      edgeToEdgeEnabled: false,
      adaptiveIcon: {
        backgroundColor: '#1E1033',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      permissions: [
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'READ_MEDIA_IMAGES',
        'READ_EXTERNAL_STORAGE',
        'CAMERA',
        'RECORD_AUDIO',
        'MODIFY_AUDIO_SETTINGS',
        'BLUETOOTH',
        'BLUETOOTH_CONNECT',
      ],
      usesCleartextTraffic: true,
      softwareKeyboardLayoutMode: 'pan',
    },
    plugins: [
      'expo-router',
      'expo-image',
      'expo-status-bar',
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
            compileSdkVersion: 36,
            targetSdkVersion: 35,
            minSdkVersion: 24,
            buildToolsVersion: '36.0.0',
            enableMinifyInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
            usesCleartextTraffic: true,
            useLegacyPackaging: false,
            buildArchs: ['armeabi-v7a', 'arm64-v8a'],
          },
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Call ke liye microphone access chahiye.',
        },
      ],
    ],
    experiments: { typedRoutes: true },
    extra: {
      apiUrl,
      // projectId from eas init under @sharma_sunaina/astrotalk-astro
      eas: {
        projectId: 'cffd31e4-2038-47e4-ab8a-8865811975ba',
      },
    },
  },
};
