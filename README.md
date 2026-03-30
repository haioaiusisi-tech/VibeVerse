# VibeVerse

VibeVerse is a full-stack social platform with:

- Email/password signup, login, logout, JWT auth
- Profiles with username, avatar, bio, boards, and saved posts
- Text, image, and short clip posts with likes, comments, anonymous mode, and AI-driven tag suggestions
- Public/private boards
- Infinite feed plus a ranked VibeFeed algorithm
- Electron desktop app that packages to a Windows `.exe`
- React Native mobile app that packages to an Android `.apk`
- Node.js + Express + MongoDB backend with an automatic in-memory Mongo fallback for local development
- Cloud-ready backend deployment using Render + MongoDB Atlas + Cloudinary

## Project structure

- `backend/` Express API, auth, feed, boards, posts, uploads
- `desktop/` React + Electron desktop client
- `mobile/` Expo React Native Android client
- `build_scripts/` automation for branding and packaging
- `output/` generated build artifacts

## Quick start

1. Install dependencies:

```powershell
npm install
```

2. Generate icons and splash assets:

```powershell
npm run generate:branding
```

3. Start the backend:

```powershell
npm run dev:backend
```

4. Start the desktop app renderer during development:

```powershell
npm run dev:desktop
```

5. Start the mobile app:

```powershell
npm run dev:mobile
```

## Desktop exe build

```powershell
npm run build --workspace desktop
```

The packaged installer is written to `output/desktop/`.

## Android apk build

Requirements:

- Java 17
- Android SDK installed and available at `%LOCALAPPDATA%\Android\Sdk` or `%ANDROID_HOME%`

Then run:

```powershell
npm run build:apk --workspace mobile
```

The final APK is copied to `output/mobile/VibeVerse.apk`.

## Full automated build

```powershell
npm run package
```

That script installs dependencies, generates branding assets, builds the desktop installer, and then builds the Android APK.

## API notes

- Default backend URL: `http://localhost:4000/api`
- Desktop override: set `desktop/.env` with `VITE_API_URL=...`
- Mobile override: set `EXPO_PUBLIC_API_URL=...` before launching Expo
- If `MONGODB_URI` is not set, the backend uses `mongodb-memory-server` automatically
- If Cloudinary env vars are set, post media is stored in the cloud instead of the local filesystem

## Cloud deployment

The backend is now prepared to run in the cloud instead of on your PC.

Recommended stack:

- Render for the Node/Express API
- MongoDB Atlas for the managed database
- Cloudinary for image and short clip storage

Files added for this:

- `render.yaml` for Render blueprint deployment
- `desktop/.env.example` and `mobile/.env.example` for pointing clients at the hosted API
- Cloud media storage support in `backend/src/services/mediaStorage.js`

### Render

1. Push this repo to GitHub.
2. In Render, create a Blueprint deploy from the repo root.
3. Set these secret env vars in Render:
   - `APP_BASE_URL`
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Keep `ALLOW_MEMORY_DB=false` in production.
5. After deploy, your API lives at `https://<your-render-service>.onrender.com/api`.

### MongoDB Atlas

Create a free Atlas cluster, create a database user, allow your Render service IP access, and copy the Node connection string into `MONGODB_URI`.

### Cloudinary

Create a Cloudinary product environment and copy the cloud name, API key, and API secret into the Render env vars. Once those are set, uploaded post media stops using the local disk and is stored in Cloudinary instead.

### Point the apps to cloud

Desktop:

```powershell
Set-Content desktop\\.env "VITE_API_URL=https://your-vibeverse-api.onrender.com/api"
```

Mobile:

```powershell
Set-Content mobile\\.env "EXPO_PUBLIC_API_URL=https://your-vibeverse-api.onrender.com/api"
```

Rebuild the desktop exe and mobile apk after setting those values so both apps call the hosted backend.

## Demo seed

To seed a demo account:

```powershell
npm run seed --workspace backend
```

Demo credentials:

- `maya@vibeverse.app`
- `password123`

## Future updates

- Add push notifications, realtime sockets, and richer moderation flows in `backend/src/routes` and the two frontend clients.
- Swap the starter tag suggestion service in `backend/src/services/tagService.js` for a hosted model when you want higher-quality AI tagging.
- Replace the generated icon assets in `desktop/assets/` and `mobile/assets/` with your final brand artwork. If you provide a custom picture later, rerun `npm run generate:branding` after updating the branding script or replacing the assets directly.
