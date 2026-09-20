import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/index.js';
import { db, initDatabase } from './db/database.js';
import { setupClassroomSocket } from './socket/classroomHandler.js';

// Route handlers
import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import teacherRoutes from './routes/teacherRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import classRoutes from './routes/classRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import materialRoutes from './routes/materialRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

// Initialize database & tables
initDatabase();

// Auto-seed initial demo accounts and classes if brand new database
try {
  const userCount = (db.prepare('SELECT count(*) as count FROM users').get() as any)?.count || 0;
  if (userCount === 0) {
    console.log('🌱 Empty database detected on first launch. Auto-seeding demo data...');
    import('./db/seed.js').then(m => m.seedDatabase()).catch(err => console.error('Auto-seed error:', err));
  }
} catch (e) {
  console.warn('Auto-seed check note:', e);
}

const app = express();
// Enable reverse proxy support for Render, Railway, Cloudflare, Nginx HTTPS
app.set('trust proxy', 1);

const httpServer = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup real-time WebRTC & classroom handler
setupClassroomSocket(io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded learning materials
app.use('/uploads/materials', express.static(config.uploadDir));

// Endpoint to download ClassConnect Android APK
app.get(['/api/download/apk', '/download/ClassConnect.apk', '/download/apk'], (_req, res) => {
  const apkPaths = [
    path.join(rootDir, 'uploads', 'apk', 'ClassConnect.apk'),
    path.join(rootDir, 'client', 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    path.join(rootDir, 'client', 'dist', 'ClassConnect.apk'),
    path.join(rootDir, 'client', 'public', 'ClassConnect.apk')
  ];

  for (const p of apkPaths) {
    if (fs.existsSync(p)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="ClassConnect.apk"');
      return res.sendFile(p);
    }
  }

  res.status(404).json({
    success: false,
    message: 'APK file is currently being assembled. Please check back shortly.'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ClassConnect API', time: new Date().toISOString() });
});

// Serve frontend in production if built
const clientDistPath = path.join(rootDir, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  const isDev = config.nodeEnv === 'development';
  res.status(500).json({
    success: false,
    message: isDev ? err.message : 'Something went wrong. Please try again or contact support.'
  });
});

httpServer.listen(config.port, () => {
  console.log(`\n🎓 =================================================`);
  console.log(`🎓 ClassConnect Backend is live on port ${config.port}`);
  console.log(`🎓 URL: http://localhost:${config.port}`);
  console.log(`🎓 Tagline: Simple Online Classes. Easy Student Access.`);
  console.log(`🎓 =================================================\n`);
});
