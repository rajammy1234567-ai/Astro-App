/**
 * Patch metro-file-map TreeFS.getOrComputeSha1 for OneDrive:
 * when the in-memory map misses a file that exists on disk, compute SHA-1
 * from the filesystem instead of returning null (which crashes Expo).
 */
const fs = require('fs');
const path = require('path');

const NEW_FN = `  async getOrComputeSha1(mixedPath) {
    // OneDrive TreeFS SHA-1 fallback
    const diskSha1 = () => {
      try {
        const fs = require('fs');
        const crypto = require('crypto');
        const path = require('path');
        const candidates = [
          String(mixedPath),
          path.normalize(String(mixedPath)),
          path.resolve(String(mixedPath)),
          path.resolve(process.cwd(), String(mixedPath)),
        ];
        for (const abs of candidates) {
          try {
            if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
              return {
                sha1: crypto
                  .createHash('sha1')
                  .update(fs.readFileSync(abs))
                  .digest('hex'),
              };
            }
          } catch (_) {}
        }
      } catch (_) {}
      return null;
    };
    const normalPath = this.#normalizePath(mixedPath);
    const result = this.#lookupByNormalPath(normalPath, {
      followLeaf: true,
    });
    if (!result.exists || isDirectory(result.node)) {
      return diskSha1();
    }
    const { canonicalPath, node: fileMetadata } = result;
    const existing = fileMetadata[_constants.default.SHA1];
    if (existing != null && existing.length > 0) {
      return {
        sha1: existing,
      };
    }
    try {
      const maybeContent = await this.#processFile(canonicalPath, fileMetadata, {
        computeSha1: true,
      });
      const sha1 = fileMetadata[_constants.default.SHA1];
      if (sha1 != null && sha1.length > 0) {
        return maybeContent
          ? {
              content: maybeContent,
              sha1,
            }
          : {
              sha1,
            };
      }
    } catch (_) {}
    return diskSha1();
  }
`;

function patchTreeFS(file) {
  if (!fs.existsSync(file)) return false;
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes('OneDrive TreeFS SHA-1 fallback')) {
    console.log('ok', path.basename(path.dirname(file)), 'TreeFS already patched');
    return true;
  }
  const re =
    /  async getOrComputeSha1\(mixedPath\) \{[\s\S]*?\n  exists\(mixedPath\)/;
  if (!re.test(src)) {
    console.warn('pattern miss', file);
    return false;
  }
  src = src.replace(re, `${NEW_FN}  exists(mixedPath)`);
  fs.writeFileSync(file, src);
  console.log('patched', file);
  return true;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '.git') continue;
      walk(full, out);
    } else if (ent.name === 'TreeFS.js' && full.includes(`${path.sep}lib${path.sep}`)) {
      out.push(full);
    }
  }
  return out;
}

function apply(projectRoot = process.cwd()) {
  const files = walk(path.join(projectRoot, 'node_modules'));
  // always try known paths first
  const known = [
    path.join(projectRoot, 'node_modules/metro-file-map/src/lib/TreeFS.js'),
    path.join(projectRoot, 'node_modules/@expo/metro-file-map/build/lib/TreeFS.js'),
  ];
  const all = [...new Set([...known, ...files])];
  let n = 0;
  for (const f of all) {
    if (patchTreeFS(f)) n += 1;
  }
  console.log(`treefs-sha1: ${n} file(s) ok`);
  return n > 0;
}

if (require.main === module) {
  apply(process.cwd());
}

module.exports = { apply };
