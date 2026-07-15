/**
 * Patch Metro so OneDrive incomplete file-maps do not crash Expo with:
 *   Failed to get the SHA-1 for: ...\node_modules\...
 *
 * Applies to every nested copy of DependencyGraph.js under node_modules.
 */
const fs = require('fs');
const path = require('path');

const REPLACEMENT = `async getOrComputeSha1(mixedPath) {
    let result = null;
    try {
      result = await this._fileSystem.getOrComputeSha1(mixedPath);
    } catch (_) {
      result = null;
    }
    if (!result || !result.sha1) {
      // OneDrive SHA-1 fallback: map miss / throw but file exists on disk
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
              const sha1 = crypto
                .createHash('sha1')
                .update(fs.readFileSync(abs))
                .digest('hex');
              result = { sha1, content: undefined };
              break;
            }
          } catch (_) {}
        }
      } catch (_) {}
    }
    if (!result || !result.sha1) {
      throw new Error`;

const NEEDLES = [
  // original
  `async getOrComputeSha1(mixedPath) {
    const result = await this._fileSystem.getOrComputeSha1(mixedPath);
    if (!result || !result.sha1) {
      throw new Error`,
  // already partially patched (let result = ...)
  `async getOrComputeSha1(mixedPath) {
    let result = await this._fileSystem.getOrComputeSha1(mixedPath);
    if (!result || !result.sha1) {
      // OneDrive SHA-1 fallback: map miss but file on disk
      try {
        const fs = require('fs');
        const crypto = require('crypto');
        const path = require('path');
        const abs = path.normalize(String(mixedPath));
        if (fs.existsSync(abs) && fs.statSync(abs).isFile()) {
          const sha1 = crypto
            .createHash('sha1')
            .update(fs.readFileSync(abs))
            .digest('hex');
          result = { sha1 };
        }
      } catch (_) {
        /* keep throw path below */
      }
    }
    if (!result || !result.sha1) {
      throw new Error`,
];

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
      if (ent.name === '.git' || ent.name === 'dist') continue;
      walk(full, out);
    } else if (ent.name === 'DependencyGraph.js' && full.includes(`${path.sep}node-haste${path.sep}`)) {
      out.push(full);
    }
  }
  return out;
}

function patchFile(file) {
  let src = fs.readFileSync(file, 'utf8');
  // normalize line endings for matching
  const normalized = src.replace(/\r\n/g, '\n');

  if (
    normalized.includes('OneDrive SHA-1 fallback: map miss / throw') &&
    normalized.includes('candidates = [')
  ) {
    return 'skip';
  }

  let next = normalized;
  let applied = false;
  for (const needle of NEEDLES) {
    if (next.includes(needle)) {
      next = next.replace(needle, REPLACEMENT);
      applied = true;
      break;
    }
  }

  if (!applied) {
    // last resort: replace function body start if still original-ish
    const re =
      /async getOrComputeSha1\(mixedPath\) \{\s*(?:const|let) result = await this\._fileSystem\.getOrComputeSha1\(mixedPath\);\s*if \(!result \|\| !result\.sha1\) \{\s*(?:\/\/[^\n]*\n(?:[\s\S]*?)?)?throw new Error/;
    if (re.test(next) && !next.includes('candidates = [')) {
      // too risky — report
      return 'miss';
    }
    return 'miss';
  }

  // restore CRLF if original used it
  if (src.includes('\r\n')) {
    next = next.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(file, next, 'utf8');
  return 'ok';
}

function apply(projectRoot = process.cwd()) {
  const nm = path.join(projectRoot, 'node_modules');
  const files = walk(nm);
  let ok = 0;
  let skip = 0;
  let miss = 0;
  for (const f of files) {
    const r = patchFile(f);
    if (r === 'ok') {
      ok += 1;
      console.log('patched', path.relative(projectRoot, f));
    } else if (r === 'skip') {
      skip += 1;
    } else {
      miss += 1;
      console.warn('pattern miss', path.relative(projectRoot, f));
    }
  }
  console.log(`sha1-fallback: patched=${ok} already=${skip} miss=${miss} total=${files.length}`);
  return ok + skip > 0;
}

if (require.main === module) {
  apply(process.cwd());
}

module.exports = { apply };
