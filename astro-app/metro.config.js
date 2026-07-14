const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// OneDrive + Windows: avoid symlink readlink crashes
config.resolver.useWatchman = false;

const reactNativeRoot = path.join(projectRoot, 'node_modules/react-native');
const metroRuntimeRoot = path.join(projectRoot, 'node_modules', '@expo', 'metro-runtime');
config.watchFolders = [
  ...new Set([
    ...(config.watchFolders || []),
    reactNativeRoot,
    ...(fs.existsSync(metroRuntimeRoot) ? [metroRuntimeRoot] : []),
  ]),
];

// Prefer project node_modules over broken nested expo-router copies
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  ...(config.resolver.nodeModulesPaths || []),
];
config.resolver.disableHierarchicalLookup = false;

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

  // Force healthy root @expo/metro-runtime (nested copy under expo-router can be incomplete on OneDrive)
  if (moduleName === '@expo/metro-runtime') {
    const hit =
      resolveFile(metroRuntimeRoot, 'src', 'index.ts') ||
      resolveFile(metroRuntimeRoot, 'src', 'index.js') ||
      resolveFile(metroRuntimeRoot, 'build', 'index.js');
    if (hit) return hit;
  }
  if (moduleName.startsWith('@expo/metro-runtime/')) {
    const sub = moduleName.slice('@expo/metro-runtime/'.length);
    const hit =
      resolveFile(metroRuntimeRoot, sub) ||
      resolveFile(metroRuntimeRoot, `${sub}.ts`) ||
      resolveFile(metroRuntimeRoot, `${sub}.js`) ||
      resolveFile(metroRuntimeRoot, 'src', `${sub}.ts`) ||
      resolveFile(metroRuntimeRoot, 'src', `${sub}.js`);
    if (hit) return hit;
  }

  if (defaultResolve) {
    return defaultResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;