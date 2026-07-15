/**
 * Prevent React Native community autolinking of Agora.
 * libagora*.so was crashing many Android release APKs on launch (RN 0.86 + Expo 57).
 * Call screens use soft mode via isAgoraNativeAvailable() === false.
 */
module.exports = {
  dependencies: {
    'react-native-agora': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
