# 🌸 ANIME COMMUNITY PLATFORM — ENTERPRISE АРХИТЕКТУР

> **Монгол хэл дээр бичигдсэн. Production-ready, scalable, high-traffic anime community + game platform.**

---

## 📋 НИЙТ АРХИТЕКТУРЫН ТОЙМ

```
┌─────────────────────────────────────────────────────────────────────┐
│                         КЛИЕНТ ТАЛД                                  │
│  Next.js 14 (App Router) + TailwindCSS + Framer Motion              │
│  WebSocket Client (Socket.io) + Zustand + React Query               │
└─────────────────────┬───────────────────────────────────────────────┘
                      │ HTTPS / WSS
┌─────────────────────▼───────────────────────────────────────────────┐
│                    NGINX REVERSE PROXY                               │
│   Rate Limiting │ SSL Termination │ Load Balancing │ CDN Cache       │
└──────┬──────────────────────────────────────┬───────────────────────┘
       │ HTTP                                 │ WebSocket
┌──────▼───────────┐                 ┌────────▼──────────────────────┐
│  NestJS REST API │                 │   NestJS WebSocket Gateway     │
│  (Multiple Pods) │                 │   (Socket.io + Redis Adapter)  │
└──────┬───────────┘                 └────────┬──────────────────────┘
       │                                      │
┌──────▼──────────────────────────────────────▼───────────────────────┐
│                      СЕРВИСИЙН ДАВХАРГА                              │
│  Auth │ Users │ Characters │ Chat │ Attack │ Games │ Payment │ Admin │
└──────┬──────────────────────────────────────┬───────────────────────┘
       │                                      │
┌──────▼──────────┐  ┌──────────────┐  ┌─────▼──────────────────────┐
│  PostgreSQL      │  │    Redis     │  │      BullMQ Queues          │
│  (Supabase/AWS) │  │  (ElastiCache│  │  season│payment│moderation  │
│  Primary + Read │  │   / Upstash) │  │  xp│energy│leaderboard     │
│  Replicas       │  │  Pub/Sub+Cache│  │                             │
└─────────────────┘  └──────────────┘  └────────────────────────────┘
```

---

## 🗄️ DATABASE SCHEMA ТАЙЛБАР

### Үндсэн хүснэгтүүд:

| Хүснэгт | Тайлбар |
|---------|---------|
| `User` | Хэрэглэгчийн мэдээлэл, ban status, reputation |
| `AnimeCharacter` | Anime дүрийн мастер өгөгдөл |
| `Anime` | Anime цуврал |
| `UserCharacter` | Хэрэглэгч эзэмшсэн дүрүүд + level/XP |
| `Skill` | Дүр бүрийн чадвар, cooldown, эрчим |
| `ChatRoom` | Чат өрөөнүүд (ALL/ANIME/PRIVATE/GUILD) |
| `Message` | Чатын мессежүүд |
| `Season` | 7 хоногийн PvP season |
| `SeasonStat` | Season дахь хэрэглэгч бүрийн HP/AP/kills |
| `AttackLog` | PvP дайралтын бүртгэл + replay data |
| `Payment` | QPay болон банкны шилжүүлгийн бүртгэл |
| `MiniGame` | Мини тоглоомын тодорхойлолт |
| `MiniGameSession` | Тоглоомын үр дүн + cheat detection |
| `Guild` | Anime-д суурилсан гильди |
| `ModerationWarning` | Автомат болон гарын предупреждени |
| `Report` | Хэрэглэгч бусдыг гомдол гаргах |
| `ReputationLog` | Reputation өөрчлөлтийн түүх |
| `CosmeticItem` | Косметик зүйлс (stat-д нөлөөгүй) |

---

## ⚡ REALTIME CHAT АРХИТЕКТУР

```
Хэрэглэгч → Socket.io Client
           → NestJS Gateway (WebSocket)
           → Redis Pub/Sub (Shard хооронд хуваалцах)
           → Бусад Gateway pod-ууд
           → Клиент хүлээн авна

Мессеж илгээх урсгал:
1. Gateway мессеж хүлээн авна
2. Rate limit шалгана (Redis)
3. Spam detection (Redis + ML pattern)
4. Profanity filter шалгана
5. PostgreSQL-д хадгална (async)
6. Redis Pub/Sub-р broadcast хийнэ
7. Бүх холбогдсон клиентэд хүргэнэ
```

**Redis өрөөний удирдлага:**
```
chat:room:{id}:members  → Set (онлайн гишүүдийн жагсаалт)
chat:room:{id}:messages → List (сүүлийн 100 мессеж cache)
chat:spam:{userId}      → Sorted Set (spam detection)
rate:chat:{userId}      → String (rate counter)
```

---

## ⚔️ ATTACK EVENT АЛГОРИТМ

```
Season эхлэлт (Даваа 00:00):
  1. Шинэ Season үүсгэнэ
  2. Бүх идэвхтэй хэрэглэгчийн SeasonStat reset хийнэ
     - HP: 1000
     - AttackPoint: 100
     - Energy: 100

Attack хийх урсгал:
  1. Хэрэглэгч skill сонгоно
  2. Energy шалгана (Redis: user:{id}:energy)
  3. Cooldown шалгана (Redis: skill:cd:{userId}:{skillId})
  4. Damage тооцоолно:
     - base = random(skill.damageMin, skill.damageMax)
     - multiplier = f(attacker.level, mastery)
     - final = base * multiplier
  5. Defender HP хасна (PostgreSQL + Redis cache)
  6. AttackLog үүсгэнэ (replay data-тай)
  7. XP тоос хоёулаа авна
  8. Leaderboard update (Redis Sorted Set)
  9. WebSocket notification defender-т

HP 0 болвол:
  - Тухайн season дахь kills/deaths update
  - Defender-т character point шагнал
  - Season leaderboard-д тусна

Season дуусгалт (Баасан 23:59):
  1. Leaderboard snapshot авна
  2. Дээд 10 хэрэглэгчид character point шагнана
  3. Guild бонус тооцоолно
  4. Archived season record үүсгэнэ
  5. Шинэ season эхлэлтийг queue-д оруулна
```

---

## 🎮 MINI GAME REWARD ЛОГИК

```
Тоглоом дуусах үед:
1. Score validate (server-side)
2. Duration шалгана (хэт богино = cheat)
3. Behavior pattern шалгана (Redis score history)
4. Anti-bot check (honeypot values)
5. Reward тооцоолно:
   - reward = clamp(score * multiplier, minReward, maxReward)
   - multiplier = f(gameType, difficulty)
6. Daily cap шалгана (Redis: game:cap:{userId}:{date})
7. Attack point нэмнэ
8. Energy refill option

Cheat Detection:
- Score > theoretical maximum → reject
- Duration < minimum human time → flag
- Identical scores repeated → flag
- IP-д олон account → flag
- Score variance анализ → suspicious хэт uniform score
```

---

## 🎭 CHARACTER OWNERSHIP ЛОГИК

```
Дүр авах урсгал:
1. Payment баталгаажна (QPay эсвэл Admin verify)
2. UserCharacter record үүсгэнэ (level=1, xp=0)
3. Base skills автоматаар unlock
4. Anime чатад нэвтрэх эрх олгоно
5. WebSocket notification: "character_unlocked"

Progression:
XP тооцоолол:
  - Attack event дайрах: +10 XP
  - Mini game: +5-20 XP
  - Chat activity: +1 XP (anti-spam-тай)

Level threshold: [0, 100, 250, 500, 1000, 2000, 4000, 8000, ...]
Level 5 → Silver tier skill animations
Level 10 → Gold tier
Level 20 → Platinum tier
Level 30 → Diamond tier (ultimate moves)
```

---

## 💳 PAYMENT FLOW

### QPay:
```
1. Хэрэглэгч "Худалдах" дарна
2. POST /payment/qpay/create
   → QPay API-д invoice үүсгэнэ
   → QR code буцаана
3. Хэрэглэгч QPay-р төлнө
4. QPay webhook → POST /payment/qpay/webhook
5. Webhook signature verify
6. Payment status → COMPLETED
7. Character unlock queue-д оруулна
8. WebSocket: "payment_success"
```

### Банкны шилжүүлэг:
```
1. Хэрэглэгч дансны мэдээлэл харна (systemId хамт)
2. Гар аргаар шилжүүлнэ (гүйлгээний утга = systemId)
3. Admin panel → Pending transfers жагсаалт
4. Admin: systemId → хэрэглэгч хайна
5. Admin confirm → Character unlock
6. Payment record: adminVerifiedBy, adminVerifiedAt
```

---

## 🛡️ ADMIN SYSTEM

```
Permission matrix:
                    SUPER_ADMIN    ADMIN
User BAN/UNBAN         ✅           ✅
Chat moderation        ✅           ✅
Payment verify         ✅           ✅
Character unlock       ✅           ✅
Character price        ✅           ❌
Attack event control   ✅           ❌
Mini game reward       ✅           ❌
Server monitoring      ✅           ❌
Admin management       ✅           ❌
```

---

## 🤖 AUTO MODERATION SYSTEM

```
Profanity Detection:
1. Монгол + Англи хэлний хориотой үгийн жагсаалт
2. Leet speak detection (4 = a, 3 = e, etc.)
3. Unicode bypass detection
4. Context analysis (false positive буурагдана)

Warning → Ban урсгал:
- 1-р зөрчил → WARNING (chat visible)
- 2-р зөрчил → MUTE (1 цаг)
- 3-р зөрчил → AUTO BAN (24 цаг)
- Давтагдвал → Permanent BAN (Admin review)

Spam Detection:
- 5 секундэд 3 ижил мессеж → spam
- Redis Sliding Window counter
- Admin override: унban хийж болно
```

---

## 📈 PERFORMANCE & SCALING

```
Horizontal Scaling:
- NestJS pods: Kubernetes HPA
  - CPU > 70% → нэмэлт pod
  - WebSocket session → Redis adapter (cross-pod)

Database Optimization:
- PostgreSQL connection pool (PgBouncer)
- Read replicas (analytics + leaderboard)
- Index strategy:
  - (seasonId, userId) → SeasonStat
  - (roomId, createdAt DESC) → Message pagination
  - (userId, characterId) → UserCharacter lookup

Redis Strategy:
- Leaderboard: Sorted Sets (O(log N) update)
- Session: String with TTL
- Rate limit: Sliding Window (Lua script atomic)
- Energy: String with lazy evaluation

CDN Strategy:
- Character images, animations → CloudFront
- Audio/Video effects → Edge caching
- Static assets → Vercel/CloudFront

Shard Architecture (Anime-based):
- Anime бүр өөрийн chat shard-тай байж болно
- Popular anime → dedicated pod
- Load balancer anime ID-р route хийнэ
```

---

## 🔐 SECURITY

- **JWT** + Refresh token rotation
- **Rate limiting**: IP + User level (Redis)
- **CSRF** protection
- **SQL injection**: Prisma parametrized queries
- **XSS**: Content Security Policy + sanitization
- **Multi-account**: IP + device fingerprint tracking
- **Anti-cheat**: Server-side validation бүх тоглоомд
- **Payment**: Webhook signature verification

---

## 📊 MONITORING

- **Prometheus** metrics export
- **Grafana** dashboard
- **Real-time** active user count
- **WebSocket** connection health
- **Queue** depth monitoring
- **DB** slow query alerting
- **Auto-scale** trigger at 80% capacity
