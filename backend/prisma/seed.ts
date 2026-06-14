import { PrismaClient } from '@prisma/client';
import { UserRole, MasteryTier, SkillEffect, MiniGameType, ChatType } from '../src/common/enums';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Real MAL CDN character image URLs
const MAL_AVATARS: Record<string, string> = {
  'naruto-base':   'https://cdn.myanimelist.net/images/characters/12/61330.jpg',
  'naruto-bijuu':  'https://cdn.myanimelist.net/images/characters/12/61330.jpg',
  'sasuke-base':   'https://cdn.myanimelist.net/images/characters/2/69196.jpg',
  'kakashi-base':  'https://cdn.myanimelist.net/images/characters/5/62968.jpg',
  'luffy-base':    'https://cdn.myanimelist.net/images/characters/9/55741.jpg',
  'zoro-base':     'https://cdn.myanimelist.net/images/characters/5/26120.jpg',
  'ace-base':      'https://cdn.myanimelist.net/images/characters/7/284129.jpg',
  'ichigo-base':   'https://cdn.myanimelist.net/images/characters/3/72326.jpg',
  'rukia-base':    'https://cdn.myanimelist.net/images/characters/13/73317.jpg',
  'goku-base':     'https://cdn.myanimelist.net/images/characters/9/46566.jpg',
  'vegeta-base':   'https://cdn.myanimelist.net/images/characters/12/46863.jpg',
  'tanjiro-base':  'https://cdn.myanimelist.net/images/characters/6/360571.jpg',
  'rengoku-base':  'https://cdn.myanimelist.net/images/characters/14/360591.jpg',
  'eren-base':     'https://cdn.myanimelist.net/images/characters/8/172585.jpg',
  'levi-base':     'https://cdn.myanimelist.net/images/characters/13/159377.jpg',
  'deku-base':     'https://cdn.myanimelist.net/images/characters/3/28172.jpg',
  'bakugo-base':   'https://cdn.myanimelist.net/images/characters/5/170745.jpg',
  'edward-base':   'https://cdn.myanimelist.net/images/characters/14/30854.jpg',
};
const avatar = (id: string) => MAL_AVATARS[id] ?? '';

async function main() {
  console.log('🌱 Seed эхэлж байна...');

  // ─── Admin хэрэглэгчид ────────────────────────────────────────────

  await prisma.user.upsert({
    where: { email: 'superadmin@animeplatform.mn' },
    update: {},
    create: {
      email: 'superadmin@animeplatform.mn',
      username: 'superadmin',
      displayName: 'Super Admin',
      passwordHash: await bcrypt.hash('Admin@12345', 12),
      role: UserRole.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@animeplatform.mn' },
    update: {},
    create: {
      email: 'admin@animeplatform.mn',
      username: 'admin',
      displayName: 'Admin',
      passwordHash: await bcrypt.hash('Admin@12345', 12),
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Admin хэрэглэгчид үүслээ');

  // ─── Bank Config ──────────────────────────────────────────────────

  await prisma.bankConfig.upsert({
    where: { id: 'default-bank' },
    update: {},
    create: {
      id: 'default-bank',
      bankName: 'Хаан Банк',
      accountName: 'Тоглоомын Платформ ХХК',
      accountNo: '5000123456789',
      isActive: true,
    },
  });

  // ─── All Chat Room ────────────────────────────────────────────────

  await prisma.chatRoom.upsert({
    where: { id: 'all-chat-room' },
    update: {},
    create: {
      id: 'all-chat-room',
      type: ChatType.ALL,
      name: 'Нийт чат',
    },
  });

  // ─── Anime-уудыг үүсгэх ──────────────────────────────────────────

  const animes = [
    {
      id: 'naruto',
      name: 'Naruto',
      description: 'Нинжагийн замд явж буй залуу Naruto-ийн тухай үлгэр',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg',
      bannerUrl: 'https://cdn.myanimelist.net/images/anime/13/17405.jpg',
      themeColor: 'FF6B35',
      emoji: '🍥',
    },
    {
      id: 'one-piece',
      name: 'One Piece',
      description: 'Далайн дээрэмч Luffy-ийн One Piece хайх аялал',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
      bannerUrl: 'https://cdn.myanimelist.net/images/anime/6/73245.jpg',
      themeColor: 'E63946',
      emoji: '🏴‍☠️',
    },
    {
      id: 'bleach',
      name: 'Bleach',
      description: 'Сүнсний цагаатгагч Ichigo-ийн тулаан',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/3/40451.jpg',
      themeColor: '2B2D42',
      emoji: '⚔️',
    },
    {
      id: 'dragon-ball',
      name: 'Dragon Ball Z',
      description: 'Goku болон найзуудын тулаан',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/1277/142306.jpg',
      themeColor: 'FFD700',
      emoji: '🐉',
    },
    {
      id: 'demon-slayer',
      name: 'Demon Slayer',
      description: 'Tanjiro болон чөтгөр алагчдын тулаан',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/1286/99889.jpg',
      themeColor: '06AED5',
      emoji: '🌊',
    },
    {
      id: 'aot',
      name: 'Attack on Titan',
      description: 'Дэлхийн хамгийн аюулгүй гэгдэх хана цаана юу байдаг вэ',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/10/47347.jpg',
      themeColor: '4A4E69',
      emoji: '🏰',
    },
    {
      id: 'mha',
      name: 'My Hero Academia',
      description: 'Quirk-гүй Deku баатар болохыг мөрөөддөг',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/10/78745.jpg',
      themeColor: '2D6A4F',
      emoji: '💚',
    },
    {
      id: 'fma',
      name: 'Fullmetal Alchemist',
      description: 'Edward болон Alphonse Elric алхимийн хуулийг сорьдог',
      imageUrl: 'https://cdn.myanimelist.net/images/anime/1223/96541.jpg',
      themeColor: 'CB4335',
      emoji: '⚗️',
    },
  ];

  for (const anime of animes) {
    const { themeColor, emoji, ...animeData } = anime;
    await prisma.anime.upsert({
      where: { id: anime.id },
      update: { imageUrl: animeData.imageUrl },
      create: { ...animeData, sortOrder: animes.indexOf(anime) },
    });

    const chatRoom = await prisma.chatRoom.upsert({
      where: { id: `anime-chat-${anime.id}` },
      update: {},
      create: {
        id: `anime-chat-${anime.id}`,
        type: ChatType.ANIME,
        name: `${anime.name} чат`,
      },
    });

    await prisma.animeChat.upsert({
      where: { animeId: anime.id },
      update: {},
      create: { animeId: anime.id, chatRoomId: chatRoom.id },
    });

    await prisma.guild.upsert({
      where: { animeId: anime.id },
      update: {},
      create: {
        name: `${anime.name} Guild`,
        animeId: anime.id,
        description: `${anime.name} anime-ийн дурлагч нарын guild`,
      },
    });
  }

  console.log('✅ Anime-ууд үүслээ (8 anime)');

  // ─── NARUTO characters ────────────────────────────────────────────

  await prisma.animeCharacter.upsert({
    where: { id: 'naruto-base' },
    update: { avatarUrl: avatar('naruto-base') },
    create: {
      id: 'naruto-base',
      animeId: 'naruto',
      name: 'Naruto Uzumaki',
      description: 'Конохагийн баатар, Hokage зорилготой залуу ninja',
      avatarUrl: avatar('naruto-base'),
      isBaseForm: true,
      price: 0,
      characterPoints: 0,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'naruto-base',
        name: 'Rasengan',
        description: 'Гарт эрчим хүч цуглуулж эсрэгтэйгээ цохино',
        damageMin: 80, damageMax: 120, energyCost: 20, cooldownSeconds: 15,
        animationUrl: '',
        effectType: SkillEffect.WIND, requiredLevel: 1, requiredTier: MasteryTier.BRONZE,
      },
      {
        characterId: 'naruto-base',
        name: 'Shadow Clone',
        description: 'Хувилгаан үүсгэж дайрна',
        damageMin: 50, damageMax: 80, energyCost: 15, cooldownSeconds: 10,
        animationUrl: '',
        effectType: SkillEffect.WIND, requiredLevel: 3, requiredTier: MasteryTier.BRONZE,
      },
      {
        characterId: 'naruto-base',
        name: 'Rasengan Barrage',
        description: 'Олон Rasengan нэгэн зэрэг цохино',
        damageMin: 120, damageMax: 180, energyCost: 35, cooldownSeconds: 25,
        animationUrl: '',
        effectType: SkillEffect.RASENGAN, requiredLevel: 7, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'naruto-bijuu' },
    update: { avatarUrl: avatar('naruto-bijuu') },
    create: {
      id: 'naruto-bijuu',
      animeId: 'naruto',
      parentId: 'naruto-base',
      name: 'Naruto (Bijuu Mode)',
      description: 'Ёсон сүүлт үнэгний хүч ашигласан Naruto',
      avatarUrl: avatar('naruto-bijuu'),
      isBaseForm: false,
      price: 8000,
      characterPoints: 300,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'naruto-bijuu',
        name: 'Bijuu Bomb',
        description: 'Хар тугалган бөмбөг хаяна',
        damageMin: 150, damageMax: 250, energyCost: 40, cooldownSeconds: 30,
        animationUrl: '',
        effectType: SkillEffect.DARK, requiredLevel: 1, isUltimate: true,
      },
      {
        characterId: 'naruto-bijuu',
        name: 'Tailed Beast Charge',
        description: 'Bijuu хэлбэрт орж дайрна',
        damageMin: 100, damageMax: 160, energyCost: 30, cooldownSeconds: 20,
        animationUrl: '',
        effectType: SkillEffect.SPIRIT, requiredLevel: 3,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'sasuke-base' },
    update: { avatarUrl: avatar('sasuke-base') },
    create: {
      id: 'sasuke-base',
      animeId: 'naruto',
      name: 'Sasuke Uchiha',
      description: 'Sharingan-тай Uchiha овгийн сүүлч амьд гишүүн',
      avatarUrl: avatar('sasuke-base'),
      isBaseForm: false,
      price: 7000,
      characterPoints: 250,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'sasuke-base',
        name: 'Chidori',
        description: 'Цахилгаан цуглуулсан цохилт',
        damageMin: 100, damageMax: 160, energyCost: 25, cooldownSeconds: 20,
        animationUrl: '',
        effectType: SkillEffect.LIGHTNING,
      },
      {
        characterId: 'sasuke-base',
        name: 'Amaterasu',
        description: 'Хэзээ ч унтраашгүй хар гал',
        damageMin: 130, damageMax: 200, energyCost: 35, cooldownSeconds: 25,
        animationUrl: '',
        effectType: SkillEffect.SHARINGAN, requiredLevel: 5, isUltimate: false,
      },
      {
        characterId: 'sasuke-base',
        name: 'Susanoo',
        description: 'Аварга том сүнсэн дарцаг дуудна',
        damageMin: 180, damageMax: 280, energyCost: 50, cooldownSeconds: 45,
        animationUrl: '',
        effectType: SkillEffect.SHARINGAN, requiredLevel: 8, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'kakashi-base' },
    update: { avatarUrl: avatar('kakashi-base') },
    create: {
      id: 'kakashi-base',
      animeId: 'naruto',
      name: 'Kakashi Hatake',
      description: 'Копи ninja, мянган chakra technique-тэй',
      avatarUrl: avatar('kakashi-base'),
      isBaseForm: false,
      price: 9000,
      characterPoints: 350,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'kakashi-base',
        name: 'Lightning Blade',
        description: 'Аянгын хурдтай цохилт',
        damageMin: 110, damageMax: 170, energyCost: 28, cooldownSeconds: 18,
        animationUrl: '',
        effectType: SkillEffect.LIGHTNING,
      },
      {
        characterId: 'kakashi-base',
        name: 'Kamui',
        description: 'Орон зайг нугалж устгана',
        damageMin: 200, damageMax: 300, energyCost: 60, cooldownSeconds: 60,
        animationUrl: '',
        effectType: SkillEffect.VOID, requiredLevel: 6, isUltimate: true,
      },
    ],
  });

  // ─── ONE PIECE characters ─────────────────────────────────────────

  await prisma.animeCharacter.upsert({
    where: { id: 'luffy-base' },
    update: { avatarUrl: avatar('luffy-base') },
    create: {
      id: 'luffy-base',
      animeId: 'one-piece',
      name: 'Monkey D. Luffy',
      description: 'Резиний хүн, Пират хааны зорилготой',
      avatarUrl: avatar('luffy-base'),
      isBaseForm: true,
      price: 0,
      characterPoints: 0,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'luffy-base',
        name: 'Gomu Gomu Pistol',
        description: 'Резиний гараа сунгаж цохино',
        damageMin: 70, damageMax: 100, energyCost: 15, cooldownSeconds: 10,
        animationUrl: '',
        effectType: SkillEffect.WIND,
      },
      {
        characterId: 'luffy-base',
        name: 'Gear Second',
        description: 'Цусыг хурдасгаж хүч нэмэгдүүлнэ',
        damageMin: 110, damageMax: 150, energyCost: 30, cooldownSeconds: 25,
        animationUrl: '',
        effectType: SkillEffect.FIRE, requiredLevel: 4,
      },
      {
        characterId: 'luffy-base',
        name: 'Gear Fifth',
        description: 'Sun God Nika хэлбэрт орж байгалийн хуулийг зөрчнө',
        damageMin: 200, damageMax: 350, energyCost: 70, cooldownSeconds: 60,
        animationUrl: '',
        effectType: SkillEffect.LIGHT, requiredLevel: 8, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'zoro-base' },
    update: { avatarUrl: avatar('zoro-base') },
    create: {
      id: 'zoro-base',
      animeId: 'one-piece',
      name: 'Roronoa Zoro',
      description: 'Гурван сэлэм барих мастер',
      avatarUrl: avatar('zoro-base'),
      isBaseForm: false,
      price: 6000,
      characterPoints: 200,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'zoro-base',
        name: 'Oni Giri',
        description: 'Гурван сэлмээр нэгэн зэрэг цохино',
        damageMin: 90, damageMax: 130, energyCost: 20, cooldownSeconds: 15,
        animationUrl: '',
        effectType: SkillEffect.WIND,
      },
      {
        characterId: 'zoro-base',
        name: '1080 Pound Phoenix',
        description: '1080 хэм эргэлдэж цохилт өгнө',
        damageMin: 160, damageMax: 240, energyCost: 45, cooldownSeconds: 40,
        animationUrl: '',
        effectType: SkillEffect.FIRE, requiredLevel: 6, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'ace-base' },
    update: { avatarUrl: avatar('ace-base') },
    create: {
      id: 'ace-base',
      animeId: 'one-piece',
      name: 'Portgas D. Ace',
      description: 'Гал залгиурын эзэн, Luffy-ийн ах',
      avatarUrl: avatar('ace-base'),
      isBaseForm: false,
      price: 7500,
      characterPoints: 280,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'ace-base',
        name: 'Fire Fist',
        description: 'Аварга галын нударга цохино',
        damageMin: 120, damageMax: 180, energyCost: 30, cooldownSeconds: 20,
        animationUrl: '',
        effectType: SkillEffect.FIRE,
      },
      {
        characterId: 'ace-base',
        name: 'Flame Mirror',
        description: 'Эргэн тойрон галаар хучина',
        damageMin: 80, damageMax: 120, energyCost: 20, cooldownSeconds: 15,
        animationUrl: '',
        effectType: SkillEffect.FIRE,
      },
    ],
  });

  // ─── BLEACH characters ────────────────────────────────────────────

  await prisma.animeCharacter.upsert({
    where: { id: 'ichigo-base' },
    update: { avatarUrl: avatar('ichigo-base') },
    create: {
      id: 'ichigo-base',
      animeId: 'bleach',
      name: 'Ichigo Kurosaki',
      description: 'Орлон Shinigami, Hollow болон Quincy цус аль алийг нь агуулна',
      avatarUrl: avatar('ichigo-base'),
      isBaseForm: true,
      price: 0,
      characterPoints: 0,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'ichigo-base',
        name: 'Getsuga Tensho',
        description: 'Сэлмээр сарын цохилт илгээнэ',
        damageMin: 90, damageMax: 140, energyCost: 22, cooldownSeconds: 18,
        animationUrl: '',
        effectType: SkillEffect.DARK,
      },
      {
        characterId: 'ichigo-base',
        name: 'Bankai: Tensa Zangetsu',
        description: 'Ертөнцийн хурдтай Bankai горим',
        damageMin: 180, damageMax: 260, energyCost: 55, cooldownSeconds: 50,
        animationUrl: '',
        effectType: SkillEffect.DARK, requiredLevel: 7, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'rukia-base' },
    update: { avatarUrl: avatar('rukia-base') },
    create: {
      id: 'rukia-base',
      animeId: 'bleach',
      name: 'Rukia Kuchiki',
      description: 'Мөсний Zanpakuto эзэмшсэн Shinigami',
      avatarUrl: avatar('rukia-base'),
      isBaseForm: false,
      price: 5500,
      characterPoints: 180,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'rukia-base',
        name: 'Sodenoshirayuki',
        description: 'Мөсэн цэцэгтэй Zanpakuto дуудна',
        damageMin: 80, damageMax: 120, energyCost: 20, cooldownSeconds: 15,
        animationUrl: '',
        effectType: SkillEffect.ICE,
      },
      {
        characterId: 'rukia-base',
        name: 'Bankai: Hakka no Togame',
        description: 'Бүх зүйлийг хөлдөөдөг Bankai',
        damageMin: 160, damageMax: 240, energyCost: 50, cooldownSeconds: 45,
        animationUrl: '',
        effectType: SkillEffect.ICE, requiredLevel: 6, isUltimate: true,
      },
    ],
  });

  // ─── DRAGON BALL characters ───────────────────────────────────────

  await prisma.animeCharacter.upsert({
    where: { id: 'goku-base' },
    update: { avatarUrl: avatar('goku-base') },
    create: {
      id: 'goku-base',
      animeId: 'dragon-ball',
      name: 'Son Goku',
      description: 'Saiyan дайчин, дэлхийг хамгаалагч',
      avatarUrl: avatar('goku-base'),
      isBaseForm: true,
      price: 0,
      characterPoints: 0,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'goku-base',
        name: 'Kamehameha',
        description: 'Хамгийн алдартай Ki цохилт',
        damageMin: 85, damageMax: 130, energyCost: 20, cooldownSeconds: 15,
        animationUrl: '',
        effectType: SkillEffect.LIGHT,
      },
      {
        characterId: 'goku-base',
        name: 'Super Saiyan',
        description: 'SSJ горим идэвхжүүлж хүчийг нэмэгдүүлнэ',
        damageMin: 130, damageMax: 190, energyCost: 40, cooldownSeconds: 30,
        animationUrl: '',
        effectType: SkillEffect.LIGHTNING, requiredLevel: 5,
      },
      {
        characterId: 'goku-base',
        name: 'Ultra Instinct',
        description: 'Бурхны мөн чанарт хүрсэн хэлбэр',
        damageMin: 220, damageMax: 350, energyCost: 75, cooldownSeconds: 70,
        animationUrl: '',
        effectType: SkillEffect.LIGHT, requiredLevel: 9, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'vegeta-base' },
    update: { avatarUrl: avatar('vegeta-base') },
    create: {
      id: 'vegeta-base',
      animeId: 'dragon-ball',
      name: 'Vegeta',
      description: 'Saiyan ноёдын хунтайж',
      avatarUrl: avatar('vegeta-base'),
      isBaseForm: false,
      price: 7000,
      characterPoints: 250,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'vegeta-base',
        name: 'Galick Gun',
        description: 'Galick хийн цохилт',
        damageMin: 90, damageMax: 135, energyCost: 22, cooldownSeconds: 18,
        animationUrl: '',
        effectType: SkillEffect.DARK,
      },
      {
        characterId: 'vegeta-base',
        name: 'Final Flash',
        description: 'Хамгийн хүчирхэг цохилт',
        damageMin: 180, damageMax: 270, energyCost: 60, cooldownSeconds: 55,
        animationUrl: '',
        effectType: SkillEffect.LIGHTNING, requiredLevel: 6, isUltimate: true,
      },
    ],
  });

  // ─── DEMON SLAYER characters ──────────────────────────────────────

  await prisma.animeCharacter.upsert({
    where: { id: 'tanjiro-base' },
    update: { avatarUrl: avatar('tanjiro-base') },
    create: {
      id: 'tanjiro-base',
      animeId: 'demon-slayer',
      name: 'Tanjiro Kamado',
      description: 'Усны болон Улаан нарны амьсгал эзэмшсэн дэмон алагч',
      avatarUrl: avatar('tanjiro-base'),
      isBaseForm: true,
      price: 0,
      characterPoints: 0,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'tanjiro-base',
        name: 'Water Breathing',
        description: 'Усны амьсгалын анхны хэлбэр',
        damageMin: 75, damageMax: 115, energyCost: 18, cooldownSeconds: 12,
        animationUrl: '',
        effectType: SkillEffect.WATER,
      },
      {
        characterId: 'tanjiro-base',
        name: 'Hinokami Kagura',
        description: 'Улаан нарны бурханы хатрын хэлбэр',
        damageMin: 170, damageMax: 250, energyCost: 55, cooldownSeconds: 50,
        animationUrl: '',
        effectType: SkillEffect.FIRE, requiredLevel: 6, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'rengoku-base' },
    update: { avatarUrl: avatar('rengoku-base') },
    create: {
      id: 'rengoku-base',
      animeId: 'demon-slayer',
      name: 'Kyojuro Rengoku',
      description: 'Дөлийн тулгын нэрлэгдсэн хилэнцтэй галын дайчин',
      avatarUrl: avatar('rengoku-base'),
      isBaseForm: false,
      price: 8500,
      characterPoints: 320,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'rengoku-base',
        name: 'Flame Breathing',
        description: 'Галын амьсгалын гуравдугаар хэлбэр',
        damageMin: 105, damageMax: 155, energyCost: 25, cooldownSeconds: 18,
        animationUrl: '',
        effectType: SkillEffect.FIRE,
      },
      {
        characterId: 'rengoku-base',
        name: 'Ninth Form: Rengoku',
        description: 'Дөлийн тулгын хамгийн хүчирхэг хэлбэр',
        damageMin: 200, damageMax: 300, energyCost: 65, cooldownSeconds: 55,
        animationUrl: '',
        effectType: SkillEffect.FIRE, requiredLevel: 7, isUltimate: true,
      },
    ],
  });

  // ─── ATTACK ON TITAN characters ───────────────────────────────────

  await prisma.animeCharacter.upsert({
    where: { id: 'eren-base' },
    update: { avatarUrl: avatar('eren-base') },
    create: {
      id: 'eren-base',
      animeId: 'aot',
      name: 'Eren Yeager',
      description: 'Дайрах Titan, Хүрдэн Titan, Эх Titan-ийн эзэн',
      avatarUrl: avatar('eren-base'),
      isBaseForm: true,
      price: 0,
      characterPoints: 0,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'eren-base',
        name: 'Titan Strike',
        description: 'Titan хэлбэрт орж цохино',
        damageMin: 100, damageMax: 150, energyCost: 25, cooldownSeconds: 20,
        animationUrl: '',
        effectType: SkillEffect.EARTH,
      },
      {
        characterId: 'eren-base',
        name: 'Rumbling',
        description: 'Дэлхийн Titan-уудыг дуудна',
        damageMin: 250, damageMax: 400, energyCost: 80, cooldownSeconds: 90,
        animationUrl: '',
        effectType: SkillEffect.EARTH, requiredLevel: 9, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'levi-base' },
    update: { avatarUrl: avatar('levi-base') },
    create: {
      id: 'levi-base',
      animeId: 'aot',
      name: 'Levi Ackerman',
      description: 'Хүн төрөлхтний хамгийн хүчтэй цэрэг',
      avatarUrl: avatar('levi-base'),
      isBaseForm: false,
      price: 9000,
      characterPoints: 380,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'levi-base',
        name: 'ODM Slash',
        description: 'Манипуляторын хурдтай зүсэлт',
        damageMin: 115, damageMax: 165, energyCost: 22, cooldownSeconds: 15,
        animationUrl: '',
        effectType: SkillEffect.WIND,
      },
      {
        characterId: 'levi-base',
        name: 'Ackerman Fury',
        description: 'Ackerman clan-ын нуугдмал хүч',
        damageMin: 190, damageMax: 280, energyCost: 55, cooldownSeconds: 45,
        animationUrl: '',
        effectType: SkillEffect.WIND, requiredLevel: 6, isUltimate: true,
      },
    ],
  });

  // ─── MY HERO ACADEMIA characters ──────────────────────────────────

  await prisma.animeCharacter.upsert({
    where: { id: 'deku-base' },
    update: { avatarUrl: avatar('deku-base') },
    create: {
      id: 'deku-base',
      animeId: 'mha',
      name: 'Izuku Midoriya',
      description: 'One For All-ийн 9 дэх эзэн, Хамгийн шилдэг баатар болох зорилготой',
      avatarUrl: avatar('deku-base'),
      isBaseForm: true,
      price: 0,
      characterPoints: 0,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'deku-base',
        name: 'Detroit Smash',
        description: 'One For All ашиглан цохилт өгнө',
        damageMin: 85, damageMax: 130, energyCost: 20, cooldownSeconds: 15,
        animationUrl: '',
        effectType: SkillEffect.WIND,
      },
      {
        characterId: 'deku-base',
        name: 'United States of Smash',
        description: 'All Might-аас сурсан хамгийн хүчтэй цохилт',
        damageMin: 210, damageMax: 320, energyCost: 70, cooldownSeconds: 65,
        animationUrl: '',
        effectType: SkillEffect.LIGHTNING, requiredLevel: 8, isUltimate: true,
      },
    ],
  });

  await prisma.animeCharacter.upsert({
    where: { id: 'bakugo-base' },
    update: { avatarUrl: avatar('bakugo-base') },
    create: {
      id: 'bakugo-base',
      animeId: 'mha',
      name: 'Katsuki Bakugo',
      description: 'Тэсрэлтийн Quirk-тэй хүч чадлаар дүүрэн баатар',
      avatarUrl: avatar('bakugo-base'),
      isBaseForm: false,
      price: 6500,
      characterPoints: 220,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'bakugo-base',
        name: 'Stun Grenade',
        description: 'Гараас тэсрэлт үүсгэнэ',
        damageMin: 95, damageMax: 140, energyCost: 22, cooldownSeconds: 16,
        animationUrl: '',
        effectType: SkillEffect.FIRE,
      },
      {
        characterId: 'bakugo-base',
        name: 'Howitzer Impact',
        description: 'Эргэлдэн тэсрэх хамгийн хүчтэй дайралт',
        damageMin: 170, damageMax: 250, energyCost: 50, cooldownSeconds: 45,
        animationUrl: '',
        effectType: SkillEffect.FIRE, requiredLevel: 5, isUltimate: true,
      },
    ],
  });

  // ─── FULLMETAL ALCHEMIST characters ───────────────────────────────

  await prisma.animeCharacter.upsert({
    where: { id: 'edward-base' },
    update: { avatarUrl: avatar('edward-base') },
    create: {
      id: 'edward-base',
      animeId: 'fma',
      name: 'Edward Elric',
      description: 'Металлын Алхимич, хэзээ ч автаагүй залуу сурагч',
      avatarUrl: avatar('edward-base'),
      isBaseForm: true,
      price: 0,
      characterPoints: 0,
    },
  });

  await prisma.skill.createMany({
    skipDuplicates: true,
    data: [
      {
        characterId: 'edward-base',
        name: 'Alchemy Transmute',
        description: 'Газрыг алхимиар хувиргана',
        damageMin: 80, damageMax: 120, energyCost: 18, cooldownSeconds: 12,
        animationUrl: '',
        effectType: SkillEffect.EARTH,
      },
      {
        characterId: 'edward-base',
        name: 'Spear of Alkaest',
        description: 'Алтаар хийсэн хутгаар цохино',
        damageMin: 140, damageMax: 200, energyCost: 40, cooldownSeconds: 35,
        animationUrl: '',
        effectType: SkillEffect.LIGHT, requiredLevel: 5, isUltimate: true,
      },
    ],
  });

  // ─── Mini Games ────────────────────────────────────────────────────

  await prisma.miniGame.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'reaction-game',
        name: 'Хурдан Дарах',
        description: '10 секундэд аль болох олон удаа дарна уу!',
        type: MiniGameType.REACTION,
        maxReward: 50, minReward: 5, cooldownMin: 30, dailyCap: 300, sortOrder: 1,
      },
      {
        id: 'quiz-game',
        name: 'Anime Quiz',
        description: 'Anime-ийн тухай 5 асуулт — хэдийг мэдэх вэ?',
        type: MiniGameType.QUIZ,
        maxReward: 80, minReward: 10, cooldownMin: 60, dailyCap: 400, sortOrder: 2,
      },
      {
        id: 'dodge-game',
        name: 'Dodge!',
        description: 'Унаж буй саадуудаас зайлсхий — 3 амь, 15 секунд!',
        type: MiniGameType.DODGE,
        maxReward: 70, minReward: 8, cooldownMin: 45, dailyCap: 350, sortOrder: 3,
      },
      {
        id: 'identify-game',
        name: 'Дүрс Таних',
        description: 'Дохиогоор аль anime дүрийг тааль?',
        type: MiniGameType.IDENTIFY,
        maxReward: 100, minReward: 15, cooldownMin: 90, dailyCap: 500, sortOrder: 4,
      },
    ],
  });

  console.log('✅ Mini games үүслээ');
  console.log('✅ Characters үүслээ (8 anime, 20+ characters)');
  console.log('🎉 Seed амжилттай дуусгалаа!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
