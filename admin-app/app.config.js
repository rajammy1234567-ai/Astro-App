const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://astro-app-ru1d.onrender.com/api';
const isHttp = apiUrl.startsWith('http://');

/**
 * Admin panel — EAS owner must match logged-in account (eas whoami).
 * Old owner sunaina0s-team + projectId 359dc5a5-... caused "Entity not authorized".
 */
export default {
  expo: {
    name: 'AstroTalk Admin',
    slug: 'astrotalk-admin',
    owner: 'sharma_sunaina',
    version: '1.0.0',
    platforms: ['android', 'ios'],
    orientation: 'portrait',
    backgroundColor: '#1E1033',
    primaryColor: '#FDB913',
    icon: './assets/images/icon.png',
    scheme: 'astrotalkadmin',
    userInterfaceStyle: 'dark',
    // EAS Update — @sharma_sunaina/astrotalk-admin
    updates: {
      url: 'https://u.expo.dev/e54e100d-c5a6-4f5d-906d-7dbaa5aa2e7c',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ios: {
      bundleIdentifier: 'com.astrotalk.admin',
      buildNumber: '1',
      supportsTablet: true,
      icon: './assets/images/icon.png',
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
        backgroundColor: '#1E1033',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
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
      'expo-status-bar',
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
      eas: {
        projectId: 'e54e100d-c5a6-4f5d-906d-7dbaa5aa2e7c',
      },
    },
  },
};