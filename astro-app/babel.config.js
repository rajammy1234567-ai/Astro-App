module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Must be last — required for reanimated/worklets release builds
    plugins: ['react-native-reanimated/plugin'],
  };
};
