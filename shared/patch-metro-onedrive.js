const fs = require('fs');
const path = require('path');

function patchFile(projectRoot, relativePath, replacements) {
  const target = path.join(projectRoot, relativePath);
  if (!fs.existsSync(target)) return false;

  let source = fs.readFileSync(target, 'utf8');
  let changed = false;

  for (const [from, to] of replacements) {
    if (source.includes(to)) {
      // already patched
      continue;
    }
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

/**
 * Metro FallbackWatcher crashes on Windows/OneDrive when npm temp dirs
 * like node_modules/.any-promise-XXXX disappear while being watched.
 * Wrap fs.watch in try/catch so ENOENT/EPERM do not kill Expo.
 */
function patchFallbackWatcher(projectRoot) {
  const candidates = [
    'node_modules/@expo/metro-file-map/build/watchers/FallbackWatcher.js',
    'node_modules/metro-file-map/src/watchers/FallbackWatcher.js',
    // nested under expo
    'node_modules/expo/node_modules/@expo/metro-file-map/build/watchers/FallbackWatcher.js',
  ];

  // Compiled (@expo) form
  const compiledFrom = `    #watchdir = (dir) => {
        if (this.#watched[dir]) {
            return false;
        }
        const watcher = fs_1.default.watch(dir, { persistent: true }, (event, filename) => this.#normalizeChange(dir, event, filename));
        this.#watched[dir] = watcher;
        watcher.on('error', this.#checkedEmitError);
        if (this.root !== dir) {
            this.#register(dir, 'd');
        }
        return true;
    };`;

  const compiledTo = `    #watchdir = (dir) => {
        if (this.#watched[dir]) {
            return false;
        }
        let watcher;
        try {
            watcher = fs_1.default.watch(dir, { persistent: true }, (event, filename) => this.#normalizeChange(dir, event, filename));
        } catch (error) {
            // OneDrive / npm temp folders (e.g. .any-promise-XXXX) vanish mid-walk
            if (error && (error.code === 'ENOENT' || error.code === 'EPERM' || error.code === 'EACCES')) {
                return false;
            }
            throw error;
        }
        this.#watched[dir] = watcher;
        watcher.on('error', this.#checkedEmitError);
        if (this.root !== dir) {
            this.#register(dir, 'd');
        }
        return true;
    };`;

  // Source (metro-file-map) form
  const sourceFrom = `  #watchdir = (dir) => {
    if (this.#watched[dir]) {
      return false;
    }
    const watcher = _fs.default.watch(
      dir,
      {
        persistent: true,
      },
      (event, filename) => this.#normalizeChange(dir, event, filename),
    );
    this.#watched[dir] = watcher;
    watcher.on("error", this.#checkedEmitError);
    if (this.root !== dir) {
      this.#register(dir, "d");
    }
    return true;
  };`;

  const sourceTo = `  #watchdir = (dir) => {
    if (this.#watched[dir]) {
      return false;
    }
    let watcher;
    try {
      watcher = _fs.default.watch(
        dir,
        {
          persistent: true,
        },
        (event, filename) => this.#normalizeChange(dir, event, filename),
      );
    } catch (error) {
      // OneDrive / npm temp folders vanish mid-walk on Windows
      if (error && (error.code === "ENOENT" || error.code === "EPERM" || error.code === "EACCES")) {
        return false;
      }
      throw error;
    }
    this.#watched[dir] = watcher;
    watcher.on("error", this.#checkedEmitError);
    if (this.root !== dir) {
      this.#register(dir, "d");
    }
    return true;
  };`;

  let any = false;
  for (const relativePath of candidates) {
    any =
      patchFile(projectRoot, relativePath, [
        [compiledFrom, compiledTo],
        [sourceFrom, sourceTo],
      ]) || any;
  }
  return any;
}

function applyMetroOneDrivePatches(projectRoot = process.cwd()) {
  // SHA-1 map misses under OneDrive → Expo Go error 500
  try {
    require('./patch-metro-sha1-fallback').apply(projectRoot);
  } catch (e) {
    console.warn('sha1 fallback patch skipped:', e.message);
  }
  try {
    require('./patch-metro-treefs-sha1').apply(projectRoot);
  } catch (e) {
    console.warn('treefs sha1 patch skipped:', e.message);
  }

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

  // Critical: ignore vanished npm temp dirs on OneDrive/Windows
  patchFallbackWatcher(projectRoot);

  // Clean leftover npm temp dirs under node_modules (e.g. .any-promise-XXXX)
  cleanNpmTempDirs(projectRoot);
}

function cleanNpmTempDirs(projectRoot) {
  const nm = path.join(projectRoot, 'node_modules');
  if (!fs.existsSync(nm)) return;
  let removed = 0;
  try {
    for (const name of fs.readdirSync(nm)) {
      // npm uses .package-name-xxxxx temp folders during install
      if (name.startsWith('.') && /-[A-Za-z0-9]{6,}$/.test(name)) {
        const full = path.join(nm, name);
        try {
          fs.rmSync(full, { recursive: true, force: true });
          removed += 1;
        } catch {
          /* ignore locked */
        }
      }
    }
  } catch {
    /* ignore */
  }
  if (removed) {
    console.log(`cleaned ${removed} npm temp folder(s) under node_modules`);
  }
}

if (require.main === module) {
  applyMetroOneDrivePatches(process.cwd());
}

module.exports = { applyMetroOneDrivePatches, cleanNpmTempDirs };
