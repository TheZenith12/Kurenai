# 🚀 Anime Platform - Хурдан эхлэх заавар

## 1️⃣ Шаардлага

- Node.js 20+
- Docker + Docker Compose
- PostgreSQL 16+
- Redis 7+

## 2️⃣ Орчин тохируулах

```bash
# Project-д орох
cd anime-platform

# Backend .env тохируулах
cp backend/.env.example backend/.env
# .env файл дотор QPay мэдээлэл болон JWT secret солих!

# Docker-р бүгдийг ажиллуулах (хамгийн хялбар)
docker-compose up -d

# Эсвэл гараар:
```

## 3️⃣ Гараар суулгах

### Backend
```bash
cd backend

# Dependencies суулгах
npm install

# Prisma client үүсгэх
npx prisma generate

# Database migrate + seed хийх
npx prisma migrate dev --name init
npx prisma db seed

# Dev server эхлүүлэх
npm run start:dev
```

### Frontend
```bash
cd frontend

# Dependencies суулгах
npm install

# Dev server эхлүүлэх
npm run dev
```

## 4️⃣ Нэвтрэх

| URL | Тайлбар |
|-----|---------|
| `http://localhost:3000` | Frontend |
| `http://localhost:3001/api/v1` | Backend API |
| `http://localhost:3001/api/docs` | Swagger Docs |
| `http://localhost:5555` | Prisma Studio |

**Admin нэвтрэх:**
- Email: `superadmin@animeplatform.mn`
- Password: `Admin@12345`

## 5️⃣ Environment Variables (Заавал солих!)

```env
# backend/.env
JWT_SECRET=<32+ тэмдэгтийн санамсаргүй мөр>
JWT_REFRESH_SECRET=<32+ тэмдэгтийн санамсаргүй мөр>

QPAY_USERNAME=<QPay merchant username>
QPAY_PASSWORD=<QPay merchant password>
QPAY_INVOICE_CODE=<QPay invoice code>

BANK_NAME=Хаан Банк
BANK_ACCOUNT_NAME=<Таны нэр>
BANK_ACCOUNT_NO=<Дансны дугаар>
```

## 6️⃣ Production Deploy

```bash
# Production docker compose
docker-compose -f docker-compose.prod.yml up -d

# Database migrate (production)
docker exec anime_backend npx prisma migrate deploy
```

## 📁 Файлын бүтэц

```
anime-platform/
├── ARCHITECTURE.md      # Архитектурын баримт бичиг
├── QUICKSTART.md        # Энэ файл
├── docker-compose.yml   # Development Docker
├── nginx/               # Nginx config
├── backend/             # NestJS API
│   ├── prisma/          # Database schema + seed
│   └── src/
│       ├── auth/        # JWT authentication
│       ├── users/       # User management
│       ├── characters/  # Anime characters
│       ├── chat/        # Real-time chat (WebSocket)
│       ├── attack-event/ # PvP system
│       ├── seasons/     # Season management
│       ├── mini-games/  # Mini game system
│       ├── payment/     # QPay + bank transfer
│       ├── admin/       # Admin panel
│       ├── leaderboard/ # Leaderboard
│       ├── guilds/      # Guild system
│       ├── moderation/  # Auto moderation
│       ├── energy/      # Energy system
│       ├── reputation/  # Reputation system
│       ├── analytics/   # Analytics
│       ├── redis/       # Redis service
│       └── prisma/      # Prisma service
└── frontend/            # Next.js App
    └── src/
        ├── app/
        │   ├── (auth)/  # Login, Register
        │   ├── (dashboard)/ # Main 4-section dashboard
        │   └── admin/   # Admin panel
        ├── components/
        ├── lib/         # API client, Socket.io
        └── store/       # Zustand state
```

## 🔥 Үндсэн онцлогууд

| Онцлог | Тайлбар |
|--------|---------|
| WebSocket | Socket.io + Redis adapter |
| Chat | All / Anime / Private / Guild chat |
| PvP | 7 хоногийн Season, HP/Energy/Cooldown |
| Mini Games | 4 төрлийн тоглоом + cheat detection |
| Payment | QPay + банкны шилжүүлэг |
| Moderation | Auto profanity → warn → mute → ban |
| Leaderboard | Real-time, anime-specific |
| Guilds | Anime-based guild system |
| Admin | Бүрэн хяналтын самбар |
