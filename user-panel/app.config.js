const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://astro-app-ru1d.onrender.com/api';
const isHttp = apiUrl.startsWith('http://');

/**
 * Crash-safe Android APK config
 * - New Architecture OFF (Agora + reanimated more stable)
 * - packagingOptions pickFirst for libc++_shared (Agora vs RN clash)
 * - Production default API = Render HTTPS (not localhost)
 */
export default {
  expo: {
    name: 'AstroTalk',
    slug: 'astrotalk-user',
    owner: 'sunaina0',
    version: '1.0.1',
    platforms: ['ios', 'android', 'web'],
    orientation: 'portrait',
    backgroundColor: '#1E1033',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astrotalkuser',
    userInterfaceStyle: 'automatic',
    // New Arch often crashes release APKs with Agora / some native modules
    newArchEnabled: false,
    // EAS Update (required for eas build / eas update)
    updates: {
      url: 'https://u.expo.dev/7636ced8-8e7e-456d-9e88-1a8a802d3bf6',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ios: {
      bundleIdentifier: 'com.astrotalk.user',
      buildNumber: '2',
      supportsTablet: false,
      icon: './assets/images/icon.png',
      infoPlist: {
        NSMicrophoneUsageDescription: 'Voice call with astrologer ke liye microphone chahiye.',
        NSCameraUsageDescription: 'Video call ke liye camera chahiye.',
        NSAppTransportSecurity: isHttp
          ? { NSAllowsArbitraryLoads: true }
          : undefined,
      },
    },
    android: {
      package: 'com.astrotalk.user',
      versionCode: 2,
      // edge-to-edge can crash some OEM launchers / older WebViews — keep off for stability
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
        'RECORD_AUDIO',
        'MODIFY_AUDIO_SETTINGS',
        'CAMERA',
        'BLUETOOTH',
        'BLUETOOTH_CONNECT',
      ],
      // true so misconfigured LAN builds still work; HTTPS preferred via env
      usesCleartextTraffic: true,
      softwareKeyboardLayoutMode: 'pan',
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png',
      name: 'AstroTalk',
      shortName: 'AstroTalk',
      lang: 'en',
      themeColor: '#FDB913',
      backgroundColor: '#1E1033',
    },
    plugins: [
      'expo-router',
      [
        'expo-image-picker',
        {
          photosPermission: 'Gallery access is needed to send photos and videos in chat.',
          cameraPermission: 'Camera access is needed to take photos for chat.',
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
            // Avoid R8 stripping Agora / Hermes symbols that cause instant close
            enableMinifyInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
            usesCleartextTraffic: true,
            // Agora + React Native both ship libc++_shared → pick first or crash on load
            packagingOptions: {
              pickFirst: [
                '**/libc++_shared.so',
                '**/libfbjni.so',
                '**/libjsc.so',
                '**/libreactnative.so',
              ],
            },
            // Prefer arm devices (phones); fewer .so variants = fewer load issues
            buildArchs: ['armeabi-v7a', 'arm64-v8a'],
          },
        },
      ],
      [
        'expo-av',
        {
          microphonePermission: 'Voice call ke liye microphone access chahiye.',
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
