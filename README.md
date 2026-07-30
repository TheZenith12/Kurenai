# Kurenai

Монголын аниме сонирхогчдод зориулсан community + game платформ. Аниме дүр цуглуулах, chat хийх, бусад хэрэглэгчидтэй тулалдах (PvP), гильди байгуулах, mini-game тоглох боломжтой — нэг дороо нэгдсэн enterprise түвшний систем болгож зохион бүтээж байгаа төсөл. Одоогоор хөгжүүлэлт дуусаагүй, идэвхтэй хийгдэж байгаа.

Энэ төслийг би ганцаараа, бие даан судалж хөгжүүлж байна. Өмнөх төслүүдээс (жишээ нь Mongolia-Resorts) илүү том, олон модультай систем учир backend architecture, realtime систем, queue-д суурилсан фоновын процесс зэргийг гүнзгий судалж, дадлагажин сурсан төсөл.

## Технологи

- **NestJS** (TypeScript) — backend framework, REST API + WebSocket Gateway
- **Prisma** + **PostgreSQL** — өгөгдлийн сан, схем удирдлага
- **Redis** + **BullMQ** — queue-д суурилсан фоновын процесс (XP тооцоолол, season, moderation)
- **Socket.io** (Redis adapter) — real-time chat, PvP мэдэгдэл
- **Passport + JWT** — authentication, refresh token
- **QPay** + банкны шилжүүлэг — төлбөрийн систем
- **Next.js 14** (App Router) — frontend
- **Tailwind CSS**, Zustand, React Query — UI, state, data fetching
- **Expo / React Native** — mobile апп (тусдаа)
- **Docker Compose + Nginx** — deployment, reverse proxy

## Юу хийдэг вэ

- **Auth** — бүртгэл, нэвтрэлт, нууц үг сэргээх, имэйл баталгаажуулалт
- **Payment** — QPay интеграц (create/webhook/status) болон банкны шилжүүлгийн баталгаажуулалт
- **Admin панель** — dashboard, хэрэглэгч ban/unban, төлбөр баталгаажуулах, тайлан, anime/character CRUD
- **Chat** — Socket.io дээр суурилсан real-time chat (нийтийн, anime-specific, хувийн)
- **Тулааны систем (PvP)** — дүрээр дайрах, leaderboard, replay, season-д суурилсан HP/AP/kills бүртгэл
- **Mini-game** — тоглоом эхлүүлэх/дуусгах, leaderboard, XP систем
- **Гильди систем** — гильди байгуулах, гишүүнчлэл, guild war
- **Аниме каталог** — anime, дүрийн мэдээлэл, watchlist, gacha (дүр татах)
- **Achievement, daily quest, reputation/moderation** — хэрэглэгчийн идэвх, зохисгүй агуулга шүүх

## Сурсан зүйл

Энэ төслийг хийхдээ NestJS-ийн модульчлагдсан архитектур, Prisma-аар нарийн relational схем зохион бүтээх, Redis дээр суурилсан WebSocket adapter-аар олон instance-ийн хооронд real-time мэдээлэл дамжуулах, BullMQ queue-аар "хэрэглэгчийг хүлээлгэхгүйгээр" фонд ажил гүйцэтгэх зэргийг гараар хийж сурсан. Мөн QPay-тэй интеграц хийж бодит төлбөрийн урсгал (webhook баталгаажуулалт орсон) хэрэгжүүлж, admin-side moderation/ban систем, season-д суурилсан тоглоомын логик зохион бүтээхэд ихээхэн цаг зарцуулсан.

## Одоогийн байдал

Backend талын ихэнх модуль (auth, payment, admin, chat, mini-game, PvP тулаан) бодит route/service/Prisma model-той, ажиллагаатай. Frontend нь backend-тэй харьцуулахад арай нимгэн — үндсэн route бүтэц бий ч зарим backend feature-т (gacha, guild war, achievement) зориулсан UI дутуу. Bracket-style tournament систем хараахан хийгдээгүй.
