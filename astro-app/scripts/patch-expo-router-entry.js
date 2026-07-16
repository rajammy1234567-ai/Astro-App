/**
 * Ensure expo-router entry files are healthy after npm install.
 * Copies known-good entry stubs if package subpath resolution breaks.
 * Prefer NOT rewriting relative imports unless original files are missing.
 * Must never fail npm/EAS install (exit 0 on any error).
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const entry = path.join(root, 'node_modules', 'expo-router', 'entry.js');
const classic = path.join(root, 'node_modules', 'expo-router', 'entry-classic.js');

try {

if (!fs.existsSync(entry) || !fs.existsSync(classic)) {
  console.warn('expo-router entry files missing — run npm install in astro-app');
  process.exit(0);
}

const entrySrc = fs.readFileSync(entry, 'utf8');
const classicSrc = fs.readFileSync(classic, 'utf8');

// If someone left a broken relative-only patch that Metro still can't resolve,
// restore the official package subpath form (works with simple metro.config).
const officialEntry = `// This is aliased to another location when server components are enabled.
// We use this intermediate file to avoid issues with aliases not applying to package.json main field resolution.
import 'expo-router/entry-classic';
`;

const officialClassic = `// \`@expo/metro-runtime\` MUST be the first import to ensure Fast Refresh works
// on web.
import '@expo/metro-runtime';

import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';

// This file should only import and register the root. No components or exports
// should be added here.
renderRootComponent(App);
`;

let changed = false;
if (!entrySrc.includes("expo-router/entry-classic") && !entrySrc.includes("./entry-classic")) {
  fs.writeFileSync(entry, officialEntry);
  changed = true;
}
if (!classicSrc.includes('@expo/metro-runtime')) {
  fs.writeFileSync(classic, officialClassic);
  changed = true;
}

// If relative-import patch left Metro unable to resolve ./build/* (file map bug),
// restore official package imports.
if (classicSrc.includes("./build/qualified-entry")) {
  fs.writeFileSync(classic, officialClassic);
  changed = true;
  console.log('restored official expo-router/entry-classic.js');
}
if (entrySrc.includes("./entry-classic") && !entrySrc.includes("expo-router/entry-classic")) {
  // Keep relative for entry.js only if classic uses package paths — both ok.
  // Prefer official:
  fs.writeFileSync(entry, officialEntry);
  changed = true;
  console.log('restored official expo-router/entry.js');
}

if (!changed) {
  console.log('expo-router entry files OK');
}

} catch (e) {
  console.warn('[postinstall] expo-router entry patch skipped:', e?.message || e);
  process.exit(0);
}
