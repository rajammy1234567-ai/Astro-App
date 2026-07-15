const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// OneDrive + Windows: Watchman often breaks
config.resolver.useWatchman = false;
config.watcher = {
  ...(config.watcher || {}),
  healthCheck: { enabled: false },
};

const expoRouterRoot = path.join(projectRoot, 'node_modules', 'expo-router');
const metroRuntimeRoot = path.join(projectRoot, 'node_modules', '@expo', 'metro-runtime');
const rnRoot = path.join(projectRoot, 'node_modules', 'react-native');

config.watchFolders = [
  ...new Set([
    ...(config.watchFolders || []),
    projectRoot,
    rnRoot,
    expoRouterRoot,
    ...(fs.existsSync(metroRuntimeRoot) ? [metroRuntimeRoot] : []),
  ]),
];

function resolveFile(...parts) {
  const filePath = path.join(...parts);
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return { type: 'sourceFile', filePath };
    }
  } catch {
    /* ignore */
  }
  return null;
}

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Stub Agora — native .so crashes release APKs on RN 0.86
  if (
    moduleName === 'react-native-agora' ||
    moduleName.startsWith('react-native-agora/')
  ) {
    return { type: 'empty' };
  }

  // Force-resolve expo-router subpaths (fixes Expo Go 404)
  if (
    moduleName === 'expo-router/entry-classic' ||
    moduleName === 'expo-router/entry'
  ) {
    const file =
      moduleName === 'expo-router/entry'
        ? 'entry.js'
        : 'entry-classic.js';
    const hit = resolveFile(expoRouterRoot, file);
    if (hit) return hit;
  }

  if (moduleName.startsWith('expo-router/')) {
    const sub = moduleName.slice('expo-router/'.length);
    const hit =
      resolveFile(expoRouterRoot, `${sub}.js`) ||
      resolveFile(expoRouterRoot, sub) ||
      resolveFile(expoRouterRoot, 'build', `${sub}.js`) ||
      resolveFile(expoRouterRoot, 'build', sub + '.js') ||
      resolveFile(expoRouterRoot, 'build', sub, 'index.js');
    if (hit) return hit;
  }

  if (moduleName === '@expo/metro-runtime') {
    const hit =
      resolveFile(metroRuntimeRoot, 'src', 'index.ts') ||
      resolveFile(metroRuntimeRoot, 'src', 'index.js') ||
      resolveFile(metroRuntimeRoot, 'build', 'index.js');
    if (hit) return hit;
  }

  if (defaultResolve) {
    return defaultResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
