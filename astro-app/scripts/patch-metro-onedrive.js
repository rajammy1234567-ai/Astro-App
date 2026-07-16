// Never fail npm install (EAS Linux has no OneDrive; patch is a no-op when files mismatch)
try {
  require('../../shared/patch-metro-onedrive').applyMetroOneDrivePatches();
} catch (e) {
  console.warn('[postinstall] metro OneDrive patch skipped:', e?.message || e);
}