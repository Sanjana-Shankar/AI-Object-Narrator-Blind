# Frontend (React + Vite)

This folder contains the web UI for AI Object Narrator. It can run in the browser and can also be wrapped as a native Android app with Capacitor.

## Web development

1. Install dependencies.

```sh
npm install
```

2. Start development server.

```sh
npm run dev
```

By default, the app expects the backend at http://localhost:8000.

## Mobile (Android) with Capacitor

### 1) Configure backend URL for mobile build

Create `.env.production` (or `.env.local`) from `.env.mobile.example` and set a mobile-reachable backend URL.

Example:

```env
VITE_BACKEND_URL=https://your-backend-url.example.com
```

Use HTTPS for mobile whenever possible.

### 2) Build web assets

```sh
npm run mobile:build
```

### 3) Initialize Capacitor (one-time)

```sh
npm run mobile:init
```

### 4) Add Android platform (one-time)

```sh
npm run mobile:android:add
```

### 5) Sync/copy web assets to native project

```sh
npm run mobile:sync
```

### 6) Open in Android Studio

```sh
npm run mobile:android:open
```

From Android Studio, run on an emulator or connected device.

## Testing on a physical phone (Android)

1. Make the backend reachable on your LAN.

Run the backend with `0.0.0.0` and note your laptop IP:

```sh
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```

2. Set `VITE_BACKEND_URL` to your laptop IP.

Example:

```env
VITE_BACKEND_URL=http://192.168.1.50:8000
```

3. Build and sync, then run on device.

```sh
npm run mobile:build
npm run mobile:sync
npm run mobile:android:run
```

4. Optional: Live reload on device (faster UI iteration).

```sh
npm run dev -- --host
npx cap run android -l --external
```

The live reload URL must be reachable by the phone on the same Wi-Fi.

## Backend note for mobile

Ensure backend CORS includes your mobile/web origin(s). For LAN/tunnel testing, set `CORS_ORIGINS` in `backend/.env` to include the frontend origin you are using.

## Troubleshooting

- Error: Backend URL is not configured
: Set `VITE_BACKEND_URL` and rebuild before running Capacitor sync.

- Camera permission denied
: Verify app permissions on the Android device/emulator and ensure HTTPS when testing in browser mode.
