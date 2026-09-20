import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('🚀 Starting ClassConnect Full-Stack Development Environment...');

function runProcess(name, cwd, args, color) {
  const proc = spawn(npmCmd, args, {
    cwd: path.join(rootDir, cwd),
    stdio: 'pipe',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.log(`${color}[${name}]\x1b[0m ${line}`);
    }
  });

  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) console.error(`${color}[${name} ERR]\x1b[0m ${line}`);
    }
  });

  proc.on('close', (code) => {
    console.log(`${color}[${name}]\x1b[0m Process exited with code ${code}`);
  });

  return proc;
}

const serverProc = runProcess('SERVER', 'server', ['run', 'dev'], '\x1b[36m');
const clientProc = runProcess('CLIENT', 'client', ['run', 'dev'], '\x1b[35m');

process.on('SIGINT', () => {
  serverProc.kill();
  clientProc.kill();
  process.exit();
});
