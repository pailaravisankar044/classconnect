# 🎓 ClassConnect

> **"Simple Online Classes. Easy Student Access."**

ClassConnect is a production-ready, high-reliability online classroom web application designed with an "easier than Zoom" philosophy. Engineered specifically for educational institutions, training cohorts, and students with varying digital literacy, ClassConnect reduces class attendance to a frictionless path:

```
LOGIN  ➔  SEE TODAY'S CLASS  ➔  CLICK "JOIN CLASS"  ➔  ENTER CLASS
```

---

## 🌟 Key Highlights & Architectural Features

- **Extreme Simplicity & Large Touch Targets**: Designed mobile-first for phones, tablets, laptops, and desktops. High-contrast typography, soft shadows, rounded cards, and distraction-free UI.
- **Unified Dual-Meeting Engine**:
  - **Internal Interactive Classroom**: Native WebRTC video/audio grid, teacher spotlight, student roster, screen sharing, Socket.IO real-time signaling, live chat ("Everyone"), hand raising, and teacher host controls (*Mute All*, *Lock Class*, *Disable Chat*, *End Class*).
  - **External Meeting Integration**: Native support for **Zoom**, **Google Meet**, **Microsoft Teams**, and custom links. Students simply tap the single **[ JOIN CLASS ]** button; the system records attendance and launches the meeting seamlessly without forcing students to search for meeting IDs or passwords.
- **Automated Attendance Engine**: Automatically logs join and leave timestamps, calculates participation duration, and evaluates the attendance percentage against configurable thresholds (`PRESENT` ≥ 75%, `PARTIAL` > 0%, `ABSENT`).
- **QR Code Class Joining**: Every class generates a scannable QR code and short join URL (`/join/:classCode`) allowing students to enter from their mobile phone cameras in seconds.
- **Node 24 Built-In SQLite Engine (`node:sqlite`)**: High-performance `DatabaseSync` engine with Write-Ahead Logging (WAL) and strict foreign key constraints. Zero external database installations required, zero C++ compilation failures on Windows.
- **Comprehensive Administration & Reports**: Full administrative controls for Students, Trainers, Courses, Batches, and Classrooms, complete with one-click CSV export generation for student attendance and session audits.

---

## 👥 Demo User Accounts

The database comes pre-seeded with realistic courses, batches, classes, and credentials:

| Role | Email | Password | Identifier / Code | Dashboard Route |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ Administrator** | `admin@classconnect.com` | `admin123` | System Admin | `/admin` |
| **👨‍🏫 Teacher / Trainer** | `teacher@classconnect.com` | `teacher123` | `TRN00001` | `/teacher` |
| **🎓 Student (Rahul)** | `student@classconnect.com` | `student123` | `STU00001` | `/student` |

*Additional 9 pre-registered demo students are available (`STU00002` through `STU00010`).*

---

## 🚀 Quickstart & Installation

### Prerequisites
- **Node.js**: v20+ or v24+ (Node 24 recommended for built-in `node:sqlite`)
- **npm**: v10+

### 1. Install Dependencies
Run the install command across both the backend server and frontend client:
```bash
# Windows
npm.cmd run install:all

# macOS / Linux
npm run install:all
```

### 2. Seed Database
Initialize the SQLite schema and populate the demo courses, batches, students, classes, and materials:
```bash
# Windows
npm.cmd run seed

# macOS / Linux
npm run seed
```

### 3. Start Development Server
Run the full-stack development environment (Server on `http://localhost:5000`, Client on `http://localhost:3000` with hot reload):
```bash
# Windows
npm.cmd run dev

# macOS / Linux
npm run dev
```

### 4. Production Build & Run
To compile both the React client into optimized static bundles and the TypeScript server:
```bash
# Windows
npm.cmd run build
npm.cmd start

# macOS / Linux
npm run build
npm start
```
The full application will be live at `http://localhost:5000`.

---

## 🧪 Automated Testing & Verification

ClassConnect includes an end-to-end automated verification suite covering authentication, role-based access control, class scheduling, attendance calculation, and CSV reporting:

```bash
# Windows
node scripts/test_e2e.js
```

### Verified Test Matrix (22/22 Passing)
- [x] API Health & base configuration
- [x] Multi-role JWT authentication (Student, Teacher, Admin)
- [x] Role-based access control (Students and Teachers blocked from `/admin/*`)
- [x] Student dashboard delivery & live class detection
- [x] Pre-join equipment test (Camera preview, Mic toggle, Audio check)
- [x] Automated attendance join logging & leave calculation
- [x] Attendance threshold status assignment (`PRESENT`, `PARTIAL`, `ABSENT`)
- [x] External meeting handling (Zoom & Google Meet)
- [x] Teacher classroom host controls (Mute All, Lock Room, End Class)
- [x] Admin student & teacher management with auto-generated codes (`STUxxxxx`, `TRNxxxxx`)
- [x] Admin class scheduler with auto-generated class codes (`CLSyyyymmddxxx`)
- [x] Administrative CSV exports (Student Attendance, Class Attendance, Trainer Performance)
- [x] Learning materials upload, view, and download

---

## ⚙️ Environment Variables

Create a `.env` file in `server/` if you wish to override default settings:

```env
# Server Port
PORT=5000

# Environment
NODE_ENV=production

# JWT Authentication Secret
JWT_SECRET=classconnect_secure_super_secret_jwt_key_2026

# JWT Expiration Duration
JWT_EXPIRES_IN=7d

# Path to SQLite Database file
DB_PATH=./data/classconnect.db

# Path to Uploaded Learning Materials
UPLOAD_DIR=./uploads/materials

# Default Attendance Percentage Threshold for 'PRESENT' status
DEFAULT_ATTENDANCE_THRESHOLD=75
```

---

## 📁 Repository Structure

```
zoommeeting/
├── package.json               # Root scripts (install, build, dev, seed, start)
├── README.md                  # Comprehensive platform documentation
├── data/
│   └── classconnect.db        # SQLite database (WAL mode, auto-created)
├── uploads/
│   └── materials/             # Uploaded PDF, PPT, and document resources
├── scripts/
│   ├── dev.js                 # Concurrent development runner
│   └── test_e2e.js            # Automated E2E verification test suite
├── server/                    # Node.js + Express + Socket.IO + SQLite Backend
│   ├── src/
│   │   ├── config/            # Environment configurations
│   │   ├── db/                # Schema, database helper, seed script
│   │   ├── middleware/        # JWT auth, RBAC, multer upload
│   │   ├── routes/            # Auth, Student, Teacher, Admin, Classes, Attendance, Reports
│   │   ├── services/          # Attendance logic, CSV generator
│   │   ├── socket/            # WebRTC signaling, live chat & host controls
│   │   └── server.ts          # Express & Socket.IO server bootstrap
│   ├── tsconfig.json
│   └── package.json
└── client/                    # Vite + React 18 + TypeScript + Tailwind CSS Frontend
    ├── index.html             # HTML template with mobile viewport configuration
    ├── src/
    │   ├── components/common/ # Navbar, MobileNav, QRCodeModal, CountdownTimer, EmptyState
    │   ├── context/           # AuthContext, SocketContext
    │   ├── pages/             # Landing, Login, Student, Teacher, Admin, Classroom, Join
    │   ├── services/          # API client with user-friendly error formatting
    │   └── App.tsx            # Routes, role-based guards, and layouts
    ├── tailwind.config.js
    ├── tsconfig.json
    └── vite.config.ts
```

---

## 📱 Mobile-First Experience & Accessibility

- **No Confusing Menus**: Students have a dedicated mobile bottom navigation bar (`Home`, `Classes`, `Materials`, `Attendance`, `Profile`).
- **One-Tap Attendance**: The primary CTA on the student dashboard is an oversized **[ JOIN CLASS ]** button with real-time status:
  - *Scheduled*: Displays live countdown (`Starts in: 00:24:30`).
  - *Live*: High-visibility pulsing badge (`🔴 LIVE NOW`).
  - *Completed*: Clearly marked (`Class Completed`).
- **Student-Friendly Error Messages**: Technical error codes (e.g. `500 Internal Server Error`) are intercepted and replaced with clear, calming guidance ("*Something went wrong on our end. Please try again.*") along with retry buttons and direct support links.
- **Accessibility**: High-contrast text exceeding WCAG AA standards, large touch targets (minimum 48px), and visible focus rings.

---

## 🔒 Security Architecture

1. **Authentication**: Passwords hashed with `bcryptjs` (salt rounds: 10). JWT tokens issued with configurable expirations.
2. **Authorization & RBAC**: Middleware-enforced route guards prevent students and teachers from accessing administrative endpoints or unauthorized batches.
3. **File Upload Hardening**: Multer file filter whitelists authorized MIME types (`PDF`, `DOC/DOCX`, `PPT/PPTX`, `PNG`, `JPG`, `MP4`) and restricts file size to 50MB.
4. **SQL Injection Protection**: All SQLite statements execute via parameterized prepared statements (`node:sqlite`).

---

## 🗺️ Product Roadmap & Future Architecture

### Fully Implemented in Phase 1 (Current Deliverable)
- Landing page with 1-click role logins and demo switchers.
- Student, Teacher, and Admin authentication with role-based routing.
- Student Dashboard featuring large Next Class card, countdown timer, upcoming sessions, attendance meter, and announcements.
- Pre-join equipment check with live camera preview, mic toggles, and troubleshooting tips.
- Live WebRTC classroom with teacher spotlight, student grid, screen sharing, chat, participant list, and teacher host controls (*Mute All*, *Lock*, *End Class*).
- External meeting provider integration (Zoom, Google Meet, Teams) with seamless redirection and automatic join attendance tracking.
- Attendance engine calculating duration and percentages against configurable thresholds.
- QR Code generation for every class session.
- Learning materials upload, view, and download.
- Administrative management for students, teachers, courses, batches, and classes.
- CSV report generation for Student Attendance, Class Logs, and Trainer Performance.
- Mobile bottom navigation and responsive design for smartphones and tablets.

### Ready for External Services Integration (Phase 2)
- **SFU/MCU Video Infrastructure**: While current peer WebRTC works seamlessly for classrooms and small cohorts, deploying an SFU (such as LiveKit or Mediasoup) is recommended for cohorts exceeding 50 concurrent video feeds.
- **Cloud Object Storage**: Transition from local `./uploads/materials` to AWS S3 or Google Cloud Storage.
- **SMS & WhatsApp Gateways**: Connect Twilio or WhatsApp Business API to the notification dispatcher for automated class reminder alerts.
