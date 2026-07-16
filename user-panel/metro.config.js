const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// OneDrive + Windows: Watchman often breaks; Node crawler is safer
config.resolver.useWatchman = false;

/**
 * Metro must watch these roots to compute SHA-1 hashes.
 * Custom resolve of files outside the crawl map → "Failed to get the SHA-1".
 * OneDrive + nested node_modules makes this stricter than normal.
 */
const expoRoot = path.join(projectRoot, 'node_modules', 'expo');
const expoRouterRoot = path.join(projectRoot, 'node_modules', 'expo-router');
const rnRoot = path.join(projectRoot, 'node_modules', 'react-native');

config.watchFolders = [
  ...new Set([
    ...(config.watchFolders || []),
    projectRoot,
    expoRoot,
    expoRouterRoot,
    rnRoot,
  ]),
];

function resolveIfExists(...parts) {
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

config.resolver.resolveRequest = (context, moduleName, platform) => {
  /**
   * ALWAYS stub Agora native SDK in JS bundle.
   * Native module is also excluded via package.json expo.autolinking
   * because linking libagora*.so crashes many Android APKs on launch (RN 0.86).
   * Call UI still works; isAgoraNativeAvailable() returns false (soft live mode).
   */
  if (
    moduleName === 'react-native-agora' ||
    moduleName.startsWith('react-native-agora/')
  ) {
    return { type: 'empty' };
  }

  // expo-router depends on standard-navigation; OneDrive/Metro TreeFS often
  // finds package.json but misses lib/src/index.js → break APK export:embed.
  if (moduleName === 'standard-navigation') {
    const hit =
      resolveIfExists(projectRoot, 'node_modules', 'standard-navigation', 'lib', 'src', 'index.js') ||
      resolveIfExists(
        projectRoot,
        'node_modules',
        'expo-router',
        'node_modules',
        'standard-navigation',
        'lib',
        'src',
        'index.js'
      );
    if (hit) return hit;
  }

  // Force expo package entry (Metro mishandles main: "src/Expo.ts" → looks for .ts.ts)
  if (moduleName === 'expo') {
    const hit =
      resolveIfExists(expoRoot, 'src', 'Expo.ts') ||
      resolveIfExists(expoRoot, 'src', 'Expo.js');
    if (hit) return hit;
  }

  // expo-router pulls expo/dom/global on web
  if (moduleName.startsWith('expo/dom/')) {
    const sub = moduleName.slice('expo/dom/'.length);
    const hit =
      resolveIfExists(expoRoot, 'dom', `${sub}.js`) ||
      resolveIfExists(expoRoot, 'dom', `${sub}.ts`);
    if (hit) return hit;
  }

  if (moduleName.startsWith('expo/') && !moduleName.includes('node_modules')) {
    const sub = moduleName.slice('expo/'.length);
    const hit =
      resolveIfExists(expoRoot, `${sub}.js`) ||
      resolveIfExists(expoRoot, `${sub}.ts`) ||
      resolveIfExists(expoRoot, sub, 'index.js');
    if (hit) return hit;
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
