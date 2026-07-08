const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// OneDrive + Windows: avoid symlink readlink crashes
config.resolver.useWatchman = false;

const reactNativeRoot = path.join(projectRoot, 'node_modules/react-native');
config.watchFolders = [...new Set([...(config.watchFolders || []), reactNativeRoot])];

module.exports = config;