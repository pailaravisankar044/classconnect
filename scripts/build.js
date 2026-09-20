import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('📦 [1/2] Building Client Web Application (Vite)...');
execSync(`${npmCmd} --prefix client run build`, { cwd: rootDir, stdio: 'inherit', shell: true });

console.log('📦 [2/2] Compiling Backend Server (TypeScript)...');
execSync(`${npmCmd} --prefix server run build`, { cwd: rootDir, stdio: 'inherit', shell: true });

// Ensure APK is available in client/dist for direct web download
const sourceApk = path.join(rootDir, 'uploads', 'apk', 'ClassConnect.apk');
const distApk = path.join(rootDir, 'client', 'dist', 'ClassConnect.apk');
if (fs.existsSync(sourceApk)) {
  fs.copyFileSync(sourceApk, distApk);
  console.log('📱 Synced ClassConnect.apk to client/dist');
}

console.log('✅ ClassConnect Production Build Completed Successfully!');
