const path = require('path');
const fs = require('fs');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// OneDrive + Windows: Watchman often breaks; Node crawler is safer
config.resolver.useWatchman = false;
config.projectRoot = projectRoot;

const nmRoot = path.join(projectRoot, 'node_modules');
const nm = (...p) => path.join(nmRoot, ...p);

const expoRoot = nm('expo');
const expoRouterRoot = nm('expo-router');
const rnRoot = nm('react-native');
const vendorRuntime = path.join(projectRoot, 'vendor', 'metro-runtime');
const metroRuntimeRoot = fs.existsSync(path.join(vendorRuntime, 'src', 'index.ts'))
  ? vendorRuntime
  : nm('@expo', 'metro-runtime');

// Prefer this project's node_modules (avoid monorepo root confusion)
config.resolver.nodeModulesPaths = [nmRoot];
// Hierarchical lookup from vendor/ is unreliable under OneDrive paths with spaces
config.resolver.disableHierarchicalLookup = true;

/**
 * Metro must watch these roots to compute SHA-1 hashes.
 * Custom resolve of files outside the crawl map → "Failed to get the SHA-1".
 */
config.watchFolders = [
  ...new Set(
    [
      ...(config.watchFolders || []),
      projectRoot,
      expoRoot,
      expoRouterRoot,
      rnRoot,
      metroRuntimeRoot,
      nmRoot,
    ].filter((p) => fs.existsSync(p))
  ),
];

// Redirect packages whose physical location differs (vendor runtime, etc.)
config.resolver.extraNodeModules = {
  '@expo/metro-runtime': metroRuntimeRoot,
  'whatwg-fetch': nm('whatwg-fetch'),
};

const sourceExts = config.resolver.sourceExts || [
  'ts',
  'tsx',
  'mjs',
  'js',
  'jsx',
  'json',
  'cjs',
];

function asFile(filePath) {
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return { type: 'sourceFile', filePath };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function asFileParts(...parts) {
  return asFile(path.join(...parts));
}

/** Resolve a path that may omit the extension (Metro sourceExts / platform variants). */
function resolveFileCandidate(basePath, platform) {
  const platformExts = platform
    ? [
        `.${platform}`,
        '.native',
        '',
      ]
    : ['.native', ''];

  // Already has a known extension
  const hitExact = asFile(basePath);
  if (hitExact) return hitExact;

  for (const plat of platformExts) {
    for (const ext of sourceExts) {
      const hit = asFile(`${basePath}${plat}.${ext}`);
      if (hit) return hit;
    }
    // directory index
    for (const ext of sourceExts) {
      const hit = asFile(path.join(`${basePath}${plat}`, `index.${ext}`));
      if (hit) return hit;
    }
  }
  return null;
}

function applyBrowserMap(pkg, rel) {
  if (!rel || typeof pkg.browser !== 'object' || pkg.browser === null) {
    return rel;
  }
  const map = pkg.browser;
  // browser field redirect map (e.g. axios node → browser build)
  if (typeof map[rel] === 'string') return map[rel];
  if (rel.startsWith('./') && typeof map[rel.slice(2)] === 'string') {
    return map[rel.slice(2)];
  }
  const withDot = rel.startsWith('./') ? rel : `./${rel}`;
  if (typeof map[withDot] === 'string') return map[withDot];
  return rel;
}

function resolveFromPackageJson(pkgDir, platform) {
  try {
    const pkgPath = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(pkgPath)) return null;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    // Only string entry fields — browser/react-native may be redirect maps (objects)
    let candidates = [
      typeof pkg['react-native'] === 'string' ? pkg['react-native'] : null,
      typeof pkg.browser === 'string' ? pkg.browser : null,
      typeof pkg.main === 'string' ? pkg.main : null,
      typeof pkg.module === 'string' ? pkg.module : null,
      'index.js',
      'src/index.ts',
      'src/index.tsx',
      'src/index.js',
    ].filter(Boolean);

    // Prefer browser-mapped entry (React Native is not Node)
    candidates = candidates.map((rel) => applyBrowserMap(pkg, rel));

    for (const rel of candidates) {
      const base = path.join(pkgDir, rel);
      const hit = resolveFileCandidate(base, platform) || asFile(base);
      if (hit) return hit;
    }

    // package.json "exports" default (common for modern packages)
    const exp = pkg.exports;
    if (exp && typeof exp === 'object') {
      const root = exp['.'] || exp;
      const pick =
        (typeof root === 'string' && root) ||
        (root &&
          typeof root === 'object' &&
          (root['react-native'] ||
            root.browser ||
            root.require ||
            root.default ||
            root.import));
      if (typeof pick === 'string') {
        const mapped = applyBrowserMap(pkg, pick);
        const base = path.join(pkgDir, mapped);
        const hit = resolveFileCandidate(base, platform) || asFile(base);
        if (hit) return hit;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

function resolveBarePackageFromFs(moduleName, platform) {
  const parts = moduleName.split('/');
  const isScoped = moduleName.startsWith('@');
  const pkgName = isScoped ? parts.slice(0, 2).join('/') : parts[0];
  const subPath = isScoped ? parts.slice(2).join('/') : parts.slice(1).join('/');
  const pkgDir = nm(...pkgName.split('/'));

  if (!fs.existsSync(path.join(pkgDir, 'package.json'))) return null;

  if (!subPath) {
    return resolveFromPackageJson(pkgDir, platform);
  }

  return (
    resolveFileCandidate(path.join(pkgDir, subPath), platform) ||
    resolveFileCandidate(path.join(pkgDir, 'src', subPath), platform) ||
    resolveFileCandidate(path.join(pkgDir, 'build', subPath), platform) ||
    resolveFileCandidate(path.join(pkgDir, 'lib', 'module', subPath), platform) ||
    resolveFileCandidate(path.join(pkgDir, 'lib', 'commonjs', subPath), platform)
  );
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'react-native-agora' ||
    moduleName.startsWith('react-native-agora/')
  ) {
    return { type: 'empty' };
  }

  // Vendored @expo/metro-runtime (outside node_modules)
  if (moduleName === '@expo/metro-runtime') {
    const hit =
      asFileParts(metroRuntimeRoot, 'src', 'index.ts') ||
      asFileParts(metroRuntimeRoot, 'src', 'index.js');
    if (hit) return hit;
  }
  if (moduleName.startsWith('@expo/metro-runtime/')) {
    const sub = moduleName.slice('@expo/metro-runtime/'.length);
    if (sub === 'rsc/runtime' || sub === 'rsc/runtime.js') {
      const hit = asFileParts(metroRuntimeRoot, 'rsc', 'runtime.js');
      if (hit) return hit;
    }
    const hit =
      resolveFileCandidate(path.join(metroRuntimeRoot, sub), platform) ||
      resolveFileCandidate(path.join(metroRuntimeRoot, 'src', sub), platform);
    if (hit) return hit;
  }

  // whatwg-fetch required by vendor metro-runtime
  if (moduleName === 'whatwg-fetch') {
    const hit =
      asFileParts(nm('whatwg-fetch'), 'dist', 'fetch.umd.js') ||
      asFileParts(nm('whatwg-fetch'), 'fetch.js') ||
      resolveFromPackageJson(nm('whatwg-fetch'), platform);
    if (hit) return hit;
  }

  // Force expo package entry (Metro can mishandle main: "src/Expo.ts")
  if (moduleName === 'expo') {
    const hit =
      asFileParts(expoRoot, 'src', 'Expo.ts') ||
      asFileParts(expoRoot, 'src', 'Expo.js');
    if (hit) return hit;
  }

  // Expo packages whose package.json "exports" sometimes break under OneDrive
  if (moduleName === 'expo-modules-core') {
    const hit =
      asFileParts(nm('expo-modules-core'), 'src', 'index.ts') ||
      resolveFromPackageJson(nm('expo-modules-core'), platform);
    if (hit) return hit;
  }
  if (moduleName === 'expo-linking') {
    const hit =
      asFileParts(nm('expo-linking'), 'build', 'Linking.js') ||
      asFileParts(nm('expo-linking'), 'src', 'Linking.ts') ||
      resolveFromPackageJson(nm('expo-linking'), platform);
    if (hit) return hit;
  }
  if (moduleName === 'expo-constants') {
    const hit =
      asFileParts(nm('expo-constants'), 'src', 'Constants.ts') ||
      asFileParts(nm('expo-constants'), 'build', 'Constants.js') ||
      resolveFromPackageJson(nm('expo-constants'), platform);
    if (hit) return hit;
  }

  // Prefer stock Metro (correct browser field / exports). On OneDrive the file map
  // often misses real files — fall back to direct filesystem resolution.
  try {
    return context.resolveRequest(context, moduleName, platform);
  } catch (defaultErr) {
    // Relative / absolute
    if (
      moduleName.startsWith('.') ||
      moduleName.startsWith('/') ||
      path.isAbsolute(moduleName)
    ) {
      try {
        const originDir = path.dirname(context.originModulePath);
        const absBase = path.isAbsolute(moduleName)
          ? moduleName
          : path.resolve(originDir, moduleName);
        const hit = resolveFileCandidate(absBase, platform);
        if (hit) return hit;
      } catch {
        /* rethrow original */
      }
    } else {
      const hit = resolveBarePackageFromFs(moduleName, platform);
      if (hit) return hit;
    }
    throw defaultErr;
  }
};

module.exports = config;
