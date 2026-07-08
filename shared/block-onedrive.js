const { spawn, spawnSync } = require('child_process');
const path = require('path');

const cwd = process.cwd().replace(/\//g, '\\');
const rest = process.argv.slice(2).join(' ');

function run(command, options = {}) {
  const child = spawn(command, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });
  child.on('exit', (code) => process.exit(code ?? 1));
}

const restoreScript = path.join(__dirname, 'restore-corrupt-files.js');
if (fsExists(restoreScript)) {
  const restore = spawnSync('node', [restoreScript], {
    cwd,
    stdio: 'inherit',
    shell: false,
  });

  if (restore.status !== 0) {
    process.exit(restore.status ?? 1);
  }
}

if (rest) {
  run(rest);
} else {
  process.exit(0);
}

function fsExists(filePath) {
  try {
    require('fs').accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}