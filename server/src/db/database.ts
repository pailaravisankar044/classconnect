import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directories exist
fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });
fs.mkdirSync(config.uploadDir, { recursive: true });

export const db = new DatabaseSync(config.dbPath);

// Enable performance and relational safety pragmas
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  let schemaPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.join(__dirname, '..', '..', 'src', 'db', 'schema.sql');
  }
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  
  // Set default settings if not exists
  const defaultSettings = [
    ['organization_name', 'ClassConnect Global Academy'],
    ['support_email', 'support@classconnect.com'],
    ['attendance_threshold', String(config.defaultAttendanceThreshold)],
    ['timezone', 'Asia/Kolkata'],
    ['allow_guest_join', 'false'],
    ['meeting_provider_default', 'internal']
  ];

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [key, value] of defaultSettings) {
    insertSetting.run(key, value);
  }
}

export const dbHelper = {
  prepare(sql: string) {
    return db.prepare(sql);
  },

  all<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = db.prepare(sql);
    return stmt.all(...params) as T[];
  },

  get<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = db.prepare(sql);
    return stmt.get(...params) as T | undefined;
  },

  run(sql: string, params: any[] = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  transaction<T>(fn: () => T): T {
    db.exec('BEGIN TRANSACTION;');
    try {
      const result = fn();
      db.exec('COMMIT;');
      return result;
    } catch (error) {
      db.exec('ROLLBACK;');
      throw error;
    }
  }
};
