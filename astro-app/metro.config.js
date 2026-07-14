const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// OneDrive + Windows: avoid symlink readlink crashes
config.resolver.useWatchman = false;

const reactNativeRoot = path.join(projectRoot, 'node_modules/react-native');
config.watchFolders = [...new Set([...(config.watchFolders || []), reactNativeRoot])];

// Stub Agora on all platforms — native .so was crashing release APKs on launch.
// package.json also excludes it from autolinking.
const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native-agora' ||
    moduleName.startsWith('react-native-agora/')
  ) {
    return { type: 'empty' };
  }
  if (defaultResolve) {
    return defaultResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;