const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://astro-app-ru1d.onrender.com/api';
const isHttp = apiUrl.startsWith('http://');

/**
 * Crash-safe Android APK config (Partner / Astrologer panel)
 * Same stability fixes as user-panel: New Arch OFF, Agora packaging pickFirst.
 */
export default {
  expo: {
    name: 'AstroTalk Partner',
    slug: 'astrotalk-astro',
    owner: 'sunaina0s-team',
    version: '1.0.1',
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    backgroundColor: '#1E1033',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astro-app',
    userInterfaceStyle: 'automatic',
    newArchEnabled: false,
    // EAS Update (required for eas build / eas update)
    updates: {
      url: 'https://u.expo.dev/bd897ff7-209e-4dc9-a215-33ae6875352f',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ios: {
      bundleIdentifier: 'com.astrotalk.astro',
      buildNumber: '2',
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
      versionCode: 2,
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
            targetSdkVersion: 36,
            minSdkVersion: 24,
            buildToolsVersion: '36.0.0',
            enableMinifyInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
            usesCleartextTraffic: true,
            packagingOptions: {
              pickFirst: [
                '**/libc++_shared.so',
                '**/libfbjni.so',
                '**/libjsc.so',
                '**/libreactnative.so',
              ],
            },
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
      eas: { projectId: 'bd897ff7-209e-4dc9-a215-33ae6875352f' },
    },
  },
};
