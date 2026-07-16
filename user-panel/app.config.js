const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://astro-app-ru1d.onrender.com/api';
const isHttp = apiUrl.startsWith('http://');

/**
 * Crash-safe Android APK config (User app) — v1.0.5
 * - New Architecture ON (required for Expo SDK 57 / RN 0.86 / Reanimated 4)
 * - Agora package REMOVED (libagora*.so was crashing release APKs on launch)
 * - edge-to-edge OFF
 * - minify/shrink OFF
 * - legacy packaging + pickFirst for native lib clashes
 * - Production API = Render HTTPS
 * EAS owner: viz_eas_001
 */
export default {
  expo: {
    name: 'AstroTalk',
    slug: 'astrotalk-user',
    owner: 'viz_eas_001',
    version: '1.0.5',
    platforms: ['ios', 'android', 'web'],
    orientation: 'portrait',
    backgroundColor: '#1E1033',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astrotalkuser',
    userInterfaceStyle: 'automatic',
    // Expo 55+ / RN 0.82+: New Arch is mandatory. false is ignored and leaves
    // Reanimated 4 / Worklets in a broken native state → instant open crash.
    newArchEnabled: true,
    jsEngine: 'hermes',
    // Disabled — avoids update-check crashes on launch for internal APKs
    updates: {
      enabled: false,
      checkAutomatically: 'NEVER',
      fallbackToCacheTimeout: 0,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ios: {
      bundleIdentifier: 'com.astrotalk.user',
      buildNumber: '5',
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
        'RECORD_AUDIO',
        'MODIFY_AUDIO_SETTINGS',
        'CAMERA',
        'BLUETOOTH',
        'BLUETOOTH_CONNECT',
      ],
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
      'expo-image',
      'expo-status-bar',
      'expo-web-browser',
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
            targetSdkVersion: 35,
            minSdkVersion: 24,
            buildToolsVersion: '36.0.0',
            enableMinifyInReleaseBuilds: false,
            enableShrinkResourcesInReleaseBuilds: false,
            usesCleartextTraffic: true,
            useLegacyPackaging: true,
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
          microphonePermission: 'Voice call ke liye microphone access chahiye.',
        },
      ],
    ],
    experiments: { typedRoutes: true },
    extra: {
      apiUrl,
      // projectId injected by `eas init` / `eas build` under account viz_eas_001
      eas: { "projectId": "38f0d308-dfc1-45c5-9ffa-408a3277c7ac"},
    },
  },
};
