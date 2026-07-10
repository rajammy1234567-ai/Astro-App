const fs = require('fs');
const path = require('path');

function walk(d, a = []) {
  let entries;
  try {
    entries = fs.readdirSync(d, { withFileTypes: true });
  } catch {
    return a;
  }
  for (const e of entries) {
    if (
      e.name === 'node_modules' ||
      e.name === 'dist' ||
      e.name === '.expo' ||
      e.name === 'uploads' ||
      e.name.startsWith('.expo')
    )
      continue;
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p, a);
    else if (/\.(js|jsx)$/.test(e.name)) a.push(p);
  }
  return a;
}

const roots = ['user-panel', 'admin-app', 'astro-app', 'server'];
const missing = [];

for (const root of roots) {
  if (!fs.existsSync(root)) continue;
  const files = walk(root);
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const re = /(?:from|require\()\s*['"](\.\.?\/[^'"]+)['"]/g;
    let m;
    while ((m = re.exec(content))) {
      const imp = m[1];
      const base = path.dirname(f);
      const resolved = path.resolve(base, imp);
      const candidates = [
        resolved,
        resolved + '.js',
        resolved + '.jsx',
        resolved + '.ts',
        resolved + '.tsx',
        path.join(resolved, 'index.js'),
        path.join(resolved, 'index.jsx'),
      ];
      if (!candidates.some((c) => fs.existsSync(c))) {
        missing.push({ file: f, import: imp });
      }
    }
  }
}

console.log(JSON.stringify(missing, null, 2));
console.log('TOTAL', missing.length);
