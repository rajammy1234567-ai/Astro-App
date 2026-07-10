const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = process.cwd();
const appName = path.basename(projectRoot);
const devRoot = path.join('C:\\astro-app-dev', appName);
const repoRoot = path.resolve(projectRoot, '..');
const extensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.json']);

// Paths relative to project root. Nested package layouts (e.g. semver@6 at root +
// semver@7 under expo/) are OK — we resolve any known good location.
const criticalNodeModules = [
  {
    label: 'react-native EventInternals',
    candidates: [
      'node_modules/react-native/src/private/webapis/dom/events/internals/EventInternals.js',
    ],
  },
  {
    label: 'semver satisfies',
    candidates: [
      'node_modules/semver/functions/satisfies.js',
      'node_modules/expo/node_modules/semver/functions/satisfies.js',
      'node_modules/react-native/node_modules/semver/functions/satisfies.js',
    ],
  },
];

function isCorrupt(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    return buffer.length >= 2 && buffer[0] === 0 && buffer[1] === 0;
  } catch {
    return false;
  }
}

function isHealthyFile(filePath) {
  return fs.existsSync(filePath) && !isCorrupt(filePath);
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.expo' || entry.name === 'dist') {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (!extensions.has(path.extname(entry.name))) {
      continue;
    }

    if (isCorrupt(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function restoreFromDev(relativePath) {
  const source = path.join(devRoot, relativePath);
  if (!fs.existsSync(source) || isCorrupt(source)) {
    return false;
  }

  const target = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return true;
}

function restoreFromGit(relativePath) {
  try {
    const gitPath = `${appName}/${relativePath.replace(/\\/g, '/')}`;
    const content = execSync(`git show HEAD:${gitPath}`, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const target = path.join(projectRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
    return true;
  } catch {
    return false;
  }
}

function checkCriticalNodeModules() {
  const missing = [];

  for (const entry of criticalNodeModules) {
    const ok = entry.candidates.some((relativePath) =>
      isHealthyFile(path.join(projectRoot, relativePath))
    );
    if (!ok) {
      missing.push(`${entry.label} (${entry.candidates[0]})`);
    }
  }

  return missing;
}

const corruptFiles = walk(projectRoot);
const missingNodeModules = checkCriticalNodeModules();

if (corruptFiles.length === 0 && missingNodeModules.length === 0) {
  process.exit(0);
}

if (missingNodeModules.length > 0) {
  console.error('\nCritical node_modules files missing or corrupted (OneDrive sync issue):');
  for (const relativePath of missingNodeModules) {
    console.error(`  ${relativePath}`);
  }
  console.error('Run: npm install --legacy-peer-deps');
  console.error('Or move project out of OneDrive to C:\\astro-app-dev\n');
}

console.log(`\nOneDrive corruption detected: restoring ${corruptFiles.length} file(s)...`);

let restored = 0;
let failed = 0;

for (const filePath of corruptFiles) {
  const relativePath = path.relative(projectRoot, filePath);

  if (restoreFromDev(relativePath) || restoreFromGit(relativePath)) {
    restored += 1;
    console.log(`  restored ${relativePath}`);
    continue;
  }

  failed += 1;
  console.error(`  failed ${relativePath}`);
}

console.log(`Restore complete: ${restored} ok, ${failed} failed\n`);
process.exit(failed > 0 || missingNodeModules.length > 0 ? 1 : 0);