const fs = require('fs');
const path = require('path');

function patchFile(projectRoot, relativePath, replacements) {
  const target = path.join(projectRoot, relativePath);
  if (!fs.existsSync(target)) return false;

  let source = fs.readFileSync(target, 'utf8');
  let changed = false;

  for (const [from, to] of replacements) {
    if (source.includes(from)) {
      source = source.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(target, source);
    console.log(`patched ${relativePath}`);
  }

  return changed;
}

function applyMetroOneDrivePatches(projectRoot = process.cwd()) {
  patchFile(projectRoot, 'node_modules/metro/src/node-haste/DependencyGraph/createFileMap.js', [
    ['enableSymlinks: true,', 'enableSymlinks: false,'],
  ]);

  const expoCliForkPaths = [
    'node_modules/@expo/cli/build/src/start/server/metro/createFileMap-fork.js',
    'node_modules/expo/node_modules/@expo/cli/build/src/start/server/metro/createFileMap-fork.js',
  ];

  for (const relativePath of expoCliForkPaths) {
    patchFile(projectRoot, relativePath, [
      ['enableSymlinks: true,', 'enableSymlinks: false,'],
    ]);
  }

  // Metro actually uses metro-file-map (not @expo/metro-file-map).
  patchFile(projectRoot, 'node_modules/metro-file-map/src/index.js', [
    [
      `  #maybeReadLink(normalPath, fileMetadata) {
    if (fileMetadata[_constants.default.SYMLINK] === 1) {`,
      `  #maybeReadLink(normalPath, fileMetadata) {
    if (!this.#options.enableSymlinks) {
      return null;
    }
    if (fileMetadata[_constants.default.SYMLINK] === 1) {`,
    ],
    [
      `      if (fileData[_constants.default.SYMLINK] === 0) {
        filesToProcess.push([normalFilePath, fileData]);
      } else {
        const maybeReadLink = this.#maybeReadLink(normalFilePath, fileData);`,
      `      if (fileData[_constants.default.SYMLINK] === 0) {
        filesToProcess.push([normalFilePath, fileData]);
      } else if (!this.#options.enableSymlinks) {
        fileData[_constants.default.SYMLINK] = 0;
        filesToProcess.push([normalFilePath, fileData]);
      } else {
        const maybeReadLink = this.#maybeReadLink(normalFilePath, fileData);`,
    ],
  ]);

  patchFile(projectRoot, 'node_modules/@expo/metro-file-map/build/index.js', [
    [
      `    #maybeReadLink(normalPath, fileMetadata) {
        // If we only need to read a link, it's more efficient to do it in-band`,
      `    #maybeReadLink(normalPath, fileMetadata) {
        if (!this.#options.enableSymlinks) {
            return null;
        }
        // If we only need to read a link, it's more efficient to do it in-band`,
    ],
    [
      `            if (fileData[constants_1.default.SYMLINK] === 0) {
                filesToProcess.push([normalFilePath, fileData]);
            }
            else if (fileData[constants_1.default.MTIME] != null && fileData[constants_1.default.MTIME] !== 0) {`,
      `            if (fileData[constants_1.default.SYMLINK] === 0) {
                filesToProcess.push([normalFilePath, fileData]);
            }
            else if (!this.#options.enableSymlinks) {
                fileData[constants_1.default.SYMLINK] = 0;
                filesToProcess.push([normalFilePath, fileData]);
            }
            else if (fileData[constants_1.default.MTIME] != null && fileData[constants_1.default.MTIME] !== 0) {`,
    ],
  ]);
}

if (require.main === module) {
  applyMetroOneDrivePatches(path.join(__dirname, '..'));
}

module.exports = { applyMetroOneDrivePatches };