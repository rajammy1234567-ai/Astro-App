const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// OneDrive + Windows: avoid symlink / vanished-temp-folder crashes
config.resolver.useWatchman = false;
// Ignore npm install temp dirs + common junk so watcher does not crash (ENOENT)
config.watcher = {
  ...(config.watcher || {}),
  healthCheck: { enabled: false },
  additionalExts: config.watcher?.additionalExts,
};
// Do not crawl npm temp folders like node_modules/.any-promise-XXXX
const prevBlock = config.resolver.blockList;
const tempDirBlock = /[\\/]node_modules[\\/]\.[^\\/]+-[A-Za-z0-9]{6,}([\\/]|$)/;
config.resolver.blockList = prevBlock
  ? [prevBlock, tempDirBlock].flat()
  : tempDirBlock;

const reactNativeRoot = path.join(projectRoot, 'node_modules/react-native');
const metroRuntimeRoot = path.join(projectRoot, 'node_modules', '@expo', 'metro-runtime');
config.watchFolders = [
  ...new Set([
    ...(config.watchFolders || []),
    reactNativeRoot,
    ...(fs.existsSync(metroRuntimeRoot) ? [metroRuntimeRoot] : []),
  ]),
];

// Prefer project root node_modules only.
// Nested copies under expo/expo-router are often incomplete on OneDrive (missing build/*.js).
config.resolver.nodeModulesPaths = [path.join(projectRoot, 'node_modules')];
config.resolver.disableHierarchicalLookup = true;

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

// Agora stub removed for calling feature

const defaultResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {

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