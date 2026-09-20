import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('📦 Installing Server Dependencies...');
execSync(`${npmCmd} --prefix server install`, { cwd: rootDir, stdio: 'inherit', shell: true });

console.log('📦 Installing Client Dependencies...');
execSync(`${npmCmd} --prefix client install`, { cwd: rootDir, stdio: 'inherit', shell: true });

console.log('✅ All dependencies installed!');
