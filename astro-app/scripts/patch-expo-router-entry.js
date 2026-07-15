/**
 * Fix Expo Go error 500:
 *   Unable to resolve module expo-router/entry-classic
 *
 * Metro under OneDrive/Windows often fails package subpath imports
 * like `import 'expo-router/entry-classic'`. Relative imports work.
 * Run from postinstall + before expo start.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const entry = path.join(root, 'node_modules', 'expo-router', 'entry.js');
const classic = path.join(root, 'node_modules', 'expo-router', 'entry-classic.js');

function writeIfNeeded(filePath, contents, label) {
  if (!fs.existsSync(filePath)) {
    console.warn(`skip ${label}: missing ${filePath}`);
    return;
  }
  const current = fs.readFileSync(filePath, 'utf8');
  if (current.trim() === contents.trim()) {
    console.log(`ok ${label} (already patched)`);
    return;
  }
  fs.writeFileSync(filePath, contents, 'utf8');
  console.log(`patched ${label}`);
}

writeIfNeeded(
  entry,
  `// Patched for Metro/OneDrive: relative import fixes Expo Go 500
// UnableToResolveError for expo-router/entry-classic
import './entry-classic';
`,
  'expo-router/entry.js'
);

writeIfNeeded(
  classic,
  `// Patched: relative build imports (package subpaths break on OneDrive Metro)
import '@expo/metro-runtime';

import { App } from './build/qualified-entry';
import { renderRootComponent } from './build/renderRootComponent';

renderRootComponent(App);
`,
  'expo-router/entry-classic.js'
);
