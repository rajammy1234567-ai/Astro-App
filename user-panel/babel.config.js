module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 plugin must be last (includes worklets transform)
    plugins: ['react-native-reanimated/plugin'],
  };
};
