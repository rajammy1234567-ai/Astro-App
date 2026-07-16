module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 plugin MUST be listed last (re-exports worklets transform)
    plugins: ['react-native-reanimated/plugin'],
  };
};
