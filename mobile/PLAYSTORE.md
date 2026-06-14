# Kurenai — Play Store Submission Guide

## App Info
- **App Name:** Kurenai
- **Package:** com.kurenai.anime
- **Version:** 1.0.0 (versionCode: 1)
- **Category:** Games / Entertainment

## Short Description (80 chars)
Anime-д суурилсан PvP тулалдааны платформ — гача, мини тоглоом, гилд

## Full Description
Kurenai бол таны дуртай аниме дүрүүдтэй тулалдах, найзуудтайгаа чатлах, гилд байгуулах онлайн платформ юм.

**Онцлог:**
⚔️ Real-time PvP тулалдаан — Rasengan, Chidori, Kamehameha skill effect-тэй
✨ Gacha систем — R/SR/SSR рарити, 3D карт flip animation
🎮 Мини тоглоомууд — Reaction test, Memory, Click speed, Pattern
💬 Real-time чат — WebSocket, skill effect overlay
🏰 Guild систем — Гилд дайн, жагсаалт
🏆 Улирлын жагсаалт, амжилтууд, хийх зүйлс

## Build & Release

### Development (APK for testing)
```bash
cd mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### Production (AAB for Play Store)
```bash
eas build --platform android --profile production
eas submit --platform android
```

### Local development
```bash
npx expo start --android
```

## Backend Connection
- Development: Edit `mobile/.env` → `EXPO_PUBLIC_API_URL`
- Production: Change to your server IP/domain before building

## Assets
- `assets/icon.png` — 1024×1024 app icon
- `assets/splash.png` — 1284×2778 splash screen
- `assets/adaptive-icon.png` — Android adaptive icon
- Regenerate: `node scripts/generate-assets.js`
