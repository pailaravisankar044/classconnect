import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'classconnect_secure_jwt_secret_2026_super_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  nodeEnv: process.env.NODE_ENV || 'development',
  dbPath: process.env.DB_PATH || path.join(rootDir, 'data', 'classconnect.db'),
  uploadDir: process.env.UPLOAD_DIR || path.join(rootDir, 'uploads', 'materials'),
  defaultAttendanceThreshold: parseInt(process.env.DEFAULT_ATTENDANCE_THRESHOLD || '75', 10),
};
