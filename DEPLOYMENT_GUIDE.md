# ClassConnect — 24/7 Cloud Deployment Guide

This guide explains how to deploy **ClassConnect** to a permanent cloud hosting provider so that teachers, students, and administrators can access the platform **from anywhere in the world on any device (cellular 4G/5G, Wi-Fi, mobile, desktop)** 24 hours a day, 7 days a week.

---

## Deployment Architecture

ClassConnect is designed as a self-contained, high-performance web application:
* **Single Container / Single Server**: The Node.js Express server delivers both the REST API, Socket.IO WebSockets, and the optimized React single-page frontend.
* **Native SQLite (WAL Mode)**: High performance with zero external database server requirements. Data is stored in `./data/classconnect.db` and is persisted across restarts.
* **Automatic HTTPS**: Cloud providers automatically issue free SSL certificates, unlocking WebRTC video, microphone, and screen-sharing permissions on remote mobile browsers.

---

## Option 1: Render.com (Recommended — 100% Free, Automated HTTPS)

Render is the simplest and fastest way to host ClassConnect for free with zero server maintenance.

### Step 1: Upload Your Code to GitHub
1. Create a free account at [github.com](https://github.com) (if you don't already have one).
2. Create a new GitHub repository called `classconnect` (can be public or private).
3. Push or upload this project directory to your GitHub repository:
   * **Using GitHub Desktop** (Easiest for Windows):
     1. Download and open [GitHub Desktop](https://desktop.github.com/).
     2. Click **File ➔ Add Local Repository...** and select `C:\Users\Hp\OneDrive\Desktop\zoommeeting`.
     3. Click **Publish repository** to GitHub.
   * **Or using Git in terminal**:
     ```bash
     git init
     git add .
     git commit -m "ClassConnect production release"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/classconnect.git
     git push -u origin main
     ```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. In the Render Dashboard, click **New +** and select **Blueprint** (or **Web Service**).
   * **Using Blueprint (Automatic via `render.yaml`)**:
     1. Select your `classconnect` repository.
     2. Render will automatically detect [`render.yaml`](file:///c:/Users/Hp/OneDrive/Desktop/zoommeeting/render.yaml) and configure the Docker build.
     3. Click **Apply**.
   * **Or Using Standard Web Service**:
     1. Click **New + ➔ Web Service**.
     2. Select your `classconnect` repository.
     3. Choose **Docker** as the Runtime (Render will automatically use the included [`Dockerfile`](file:///c:/Users/Hp/OneDrive/Desktop/zoommeeting/Dockerfile)).
     4. Select the **Free** instance type.
     5. Under **Environment Variables**, add:
        * `NODE_ENV`: `production`
        * `JWT_SECRET`: *(Click 'Generate' or enter any secure random string)*
        * `DEFAULT_ATTENDANCE_THRESHOLD`: `75`
     6. Click **Create Web Service**.

### Step 3: Access Your Live Application
* Within 3–4 minutes, Render will build and deploy your application.
* Your live URL will appear at the top of the Render dashboard:
  ```
  https://classconnect-xxxx.onrender.com
  ```
* Open this URL in any browser or phone to verify that the app is live!

---

## Option 2: Railway.app (Alternative 1-Click Cloud)

Railway is another excellent cloud host with instant deployments and volume support.

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **New Project ➔ Deploy from GitHub repo**.
3. Select your `classconnect` repository.
4. Railway will automatically detect the [`Dockerfile`](file:///c:/Users/Hp/OneDrive/Desktop/zoommeeting/Dockerfile) and begin the build.
5. In your service settings:
   * Click **Networking ➔ Generate Domain** to get your public HTTPS URL (e.g., `https://classconnect-production.up.railway.app`).
   * (Optional) Under **Volumes**, click **Add Volume** mounted to `/app/data` to ensure SQLite data persists permanently.

---

## Option 3: Self-Hosted Cloud VPS (DigitalOcean, AWS, Linode, Ubuntu)

If you have a Linux VPS (Ubuntu 22.04 or 24.04):

### Step 1: Install Docker & Docker Compose
```bash
sudo apt update
sudo apt install -y docker.io docker-compose git
```

### Step 2: Clone and Launch
```bash
git clone https://github.com/YOUR_USERNAME/classconnect.git
cd classconnect
docker-compose up -d --build
```

### Step 3: Setup Nginx Reverse Proxy & Free SSL (Certbot)
```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Configure Nginx for your domain:
# Point proxy_pass to http://localhost:5000 with WebSocket headers:
#   proxy_http_version 1.1;
#   proxy_set_header Upgrade $http_upgrade;
#   proxy_set_header Connection "upgrade";

sudo certbot --nginx -d youracademy.com
```

---

## Updating the Mobile APK for Your Cloud Domain

Once your cloud service is live (e.g., `https://classconnect.onrender.com`):

1. Open [`client/capacitor.config.ts`](file:///c:/Users/Hp/OneDrive/Desktop/zoommeeting/client/capacitor.config.ts) and update the server URL to your live cloud URL:
   ```typescript
   server: {
     url: 'https://classconnect.onrender.com', // Replace with your live URL
     cleartext: false
   }
   ```
2. In PowerShell, re-sync and rebuild the APK:
   ```powershell
   cd c:\Users\Hp\OneDrive\Desktop\zoommeeting\client
   cmd.exe /c "npx cap sync android"
   cd android
   $env:ANDROID_HOME="C:\Users\Hp\android-sdk"
   .\gradlew.bat assembleDebug
   ```
3. Copy the newly compiled APK:
   ```powershell
   Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\..\uploads\apk\ClassConnect.apk" -Force
   Copy-Item "app\build\outputs\apk\debug\app-debug.apk" "..\dist\ClassConnect.apk" -Force
   ```
4. Now, any student anywhere in the world who downloads the APK will connect directly to your 24/7 cloud server!

---

## Production Security & Best Practices

1. **Change Default Passwords**:
   * Log into the Admin portal (`/admin`) and change the default passwords for `admin@classconnect.com` and `teacher@classconnect.com`.
2. **Backups**:
   * Download a copy of `data/classconnect.db` periodically or download student and class attendance CSV reports via the Admin dashboard.
3. **Custom Domain**:
   * On Render, go to **Settings ➔ Custom Domains** and add your own domain (e.g. `classes.myschool.com`). Render will automatically provision an SSL certificate for your domain.
