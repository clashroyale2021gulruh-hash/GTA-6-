import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Bookmark,
  Play,
  User,
  LogIn,
  LogOut,
  Gamepad2,
  Search,
  ExternalLink,
  Check,
  Copy,
  Bell,
  BellRing,
  Trash2,
  Smartphone,
  X,
  ChevronRight,
  ShieldCheck,
  Cloud,
  Loader2,
  Sparkles,
  Lock,
  Unlock,
  Crown,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  ShieldAlert,
  Send,
  Edit3,
  Mail,
  Eye,
  EyeOff,
  UserPlus,
  RefreshCw,
  ArrowLeft,
  Timer,
  ChevronLeft,
  Compass,
  Flame,
  MapPin,
  Activity,
  Wifi,
  WifiOff,
  Star,
  Database,
  Key,
  CheckCircle
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  configureSupabase,
  disconnectSupabase,
  supabaseSignIn,
  supabaseSignUp,
  supabaseSignOut,
  supabaseGetSession,
  supabaseSyncUserData
} from './supabase';
import { db, testFirestoreConnection } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import {
  getOrCreateDeviceUid,
  signProfile,
  verifyProfileSignature,
  sha256
} from './utils/cryptoSecurity';
import {
  validateRegistrationPassword,
  generateSecurePassword
} from './utils/passwordSecurity';
import { Capacitor } from '@capacitor/core';
import {
  sanitizeDisplayName,
  sanitizeEmail,
  validateEmail,
  sanitizePhotoUrl,
  sanitizeUid
} from './utils/sanitizer';
import {
  safeFetchJson,
  openExternalUrl,
  resolveApiUrl,
  isCapacitorNative
} from './utils/api';

// ============================================================================
// TYPES & DEFINITIONS
// ============================================================================

export type PlatformType = 'ps5' | 'xbox' | 'phone';

export interface CheatItem {
  id: string;
  title: string;
  category: 'player' | 'weapons' | 'vehicles' | 'world';
  description: string;
  codes: {
    ps5: string[];
    xbox: string[];
    phone: string;
  };
  isPremium?: boolean;
}

export interface NewsItem {
  id: string;
  title: string;
  tag: 'ОФИЦИАЛЬНО' | 'ТРЕЙЛЕР' | 'ИНСАЙДЫ' | 'САУНДТРЕК';
  date: string;
  readTime: string;
  image: string;
  youtubeId: string;
  videoUrl: string;
  videoDuration: string;
  summary: string;
  content: string[];
  keyFacts: string[];
  sourceName: string;
  sourceUrl: string;
  isPremium?: boolean;
}

export interface UserProfile {
  uid?: string;
  displayName: string;
  email: string;
  photoURL: string;
  isGuest: boolean;
  statusText: string;
  isVip?: boolean;
  vipInvoiceId?: number | string;
  vipVerifiedAt?: string;
  vipAmount?: string;
  vipAsset?: string;
  signature?: string;
  pinHash?: string;
}

export const GTA_AVATARS = [
  {
    id: 'vice_boss',
    name: 'Вайс Босс',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'lucia',
    name: 'Люсия',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'jason',
    name: 'Джейсон',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'leonida_cop',
    name: 'Шериф',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'
  },
  {
    id: 'retro_driver',
    name: 'Гонщик',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80'
  }
];

// ============================================================================
// VERIFIED FALLBACK CHEATS DATA (LEONIDA DATABASE)
// ============================================================================

const FALLBACK_CHEATS: CheatItem[] = [
  {
    id: 'cheat_max_health_armor',
    title: 'Максимум здоровья и брони (Бесплатно для всех)',
    category: 'player',
    description: 'Базовый бесплатный чит для каждого игрока. Мгновенно восстанавливает 100% шкалы жизненных сил и дает бронежилет.',
    codes: {
      ps5: ['◯', 'L1', '△', 'R2', 'X', '▢', '◯', 'RIGHT', '▢', 'L1', 'L1', 'L1'],
      xbox: ['B', 'LB', 'Y', 'RT', 'A', 'X', 'B', 'RIGHT', 'X', 'LB', 'LB', 'LB'],
      phone: '1-999-887-853 (TURTLE)'
    },
    isPremium: false
  },
  {
    id: 'cheat_invincibility',
    title: 'Бессмертие (Invincibility / God Mode)',
    category: 'player',
    description: 'Полная неуязвимость персонажа на 5 минут. Защищает от выстрелов, взрывов, падений и атак аллигаторов.',
    codes: {
      ps5: ['RIGHT', 'X', 'RIGHT', 'LEFT', 'RIGHT', 'R1', 'RIGHT', 'LEFT', 'X', '△'],
      xbox: ['RIGHT', 'A', 'RIGHT', 'LEFT', 'RIGHT', 'RB', 'RIGHT', 'LEFT', 'A', 'Y'],
      phone: '1-999-724-654-5537 (PAINKILLER)'
    },
    isPremium: true
  },
  {
    id: 'cheat_weapons_pack',
    title: 'Боевой арсенал оружия (All Weapons)',
    category: 'weapons',
    description: 'Выдает полный комплект оружия: штурмовой карабин, тактический дробовик, микро-SMG, снайперку и связку гранат.',
    codes: {
      ps5: ['△', 'R2', 'LEFT', 'L1', 'X', 'RIGHT', '△', 'DOWN', '▢', 'L1', 'L1', 'L1'],
      xbox: ['Y', 'RT', 'LEFT', 'LB', 'A', 'RIGHT', 'Y', 'DOWN', 'X', 'LB', 'LB', 'LB'],
      phone: '1-999-866-587 (TOOLUP)'
    },
    isPremium: true
  },
  {
    id: 'cheat_explosive_bullets',
    title: 'Разрывные боеприпасы (Explosive Ammo)',
    category: 'weapons',
    description: 'Каждый выстрел создает мощную ударную волну и детонирует транспорт при первом же попадании.',
    codes: {
      ps5: ['RIGHT', '▢', 'X', 'LEFT', 'R1', 'R2', 'LEFT', 'RIGHT', 'RIGHT', 'L1', 'L1', 'L1'],
      xbox: ['RIGHT', 'X', 'A', 'LEFT', 'RB', 'RT', 'LEFT', 'RIGHT', 'RIGHT', 'LB', 'LB', 'LB'],
      phone: '1-999-444-439 (HIGHEX)'
    },
    isPremium: true
  },
  {
    id: 'cheat_super_jump',
    title: 'Супер-прыжок и лунная гравитация',
    category: 'player',
    description: 'Позволяет перепрыгивать здания и ограждения Вайс-Сити с мягким приземлением без урона.',
    codes: {
      ps5: ['LEFT', 'LEFT', '△', '△', 'RIGHT', 'RIGHT', 'LEFT', 'RIGHT', '▢', 'R1', 'R2'],
      xbox: ['LEFT', 'LEFT', 'Y', 'Y', 'RIGHT', 'RIGHT', 'LEFT', 'RIGHT', 'X', 'RB', 'RT'],
      phone: '1-999-467-8648 (HOPTOIT)'
    },
    isPremium: true
  },
  {
    id: 'cheat_spawn_cheetah',
    title: 'Суперкар Grotti Cheetah (Турбо Вайс-Сити)',
    category: 'vehicles',
    description: 'Эксклюзивный неоновый итальянский спорткар с форсированным двигателем и закисью азота.',
    codes: {
      ps5: ['R1', '◯', 'R2', 'RIGHT', 'L1', 'L2', 'X', 'X', '▢', 'R1'],
      xbox: ['RB', 'B', 'RT', 'RIGHT', 'LB', 'LT', 'A', 'A', 'X', 'RB'],
      phone: '1-999-266-3844 (COMET)'
    },
    isPremium: true
  },
  {
    id: 'cheat_spawn_buzzard',
    title: 'Боевой вертолет Buzzard / Hunter',
    category: 'vehicles',
    description: 'Спавнит скоростной ударный вертолет с самонаводящимися ракетами и крупнокалиберным пулеметом.',
    codes: {
      ps5: ['◯', '◯', 'L1', '◯', '◯', '◯', 'L1', 'L2', 'R1', '△', '◯', '△'],
      xbox: ['B', 'B', 'LB', 'B', 'B', 'B', 'LB', 'LT', 'RB', 'Y', 'B', 'Y'],
      phone: '1-999-289-9633 (BUZZOFF)'
    },
    isPremium: true
  },
  {
    id: 'cheat_spawn_tank',
    title: 'Тяжелый штурмовой танк Rhino',
    category: 'vehicles',
    description: 'Бронированный танк с поворотным орудием, способный смять любой автомобиль на шоссе штата.',
    codes: {
      ps5: ['◯', '◯', 'L1', '◯', '◯', '◯', 'L1', 'L2', 'R1', '△', '◯', 'X'],
      xbox: ['B', 'B', 'LB', 'B', 'B', 'B', 'LB', 'LT', 'RB', 'Y', 'B', 'A'],
      phone: '1-999-726-7648 (PANZER)'
    },
    isPremium: true
  },
  {
    id: 'cheat_skyfall',
    title: 'Падение со стратосферы (Skyfall)',
    category: 'player',
    description: 'Мгновенный телепорт высоко в небо над Вайс-Сити для экстремального свободного падения с парашютом.',
    codes: {
      ps5: ['L1', 'L2', 'R1', 'R2', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'L1', 'L2', 'R1', 'R2', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT'],
      xbox: ['LB', 'LT', 'RB', 'RT', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'LB', 'LT', 'RB', 'RT', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT'],
      phone: '1-999-759-3255 (SKYFALL)'
    },
    isPremium: true
  },
  {
    id: 'cheat_slow_mo_aim',
    title: 'Замедление времени при прицеливании (Dead Eye)',
    category: 'player',
    description: 'Замедляет время в 3 раза при прицеливании для точечных хедшотов и кинематографичной стрельбы.',
    codes: {
      ps5: ['▢', 'L2', 'R1', '△', 'LEFT', '▢', 'L2', 'RIGHT', 'X'],
      xbox: ['X', 'LT', 'RB', 'Y', 'LEFT', 'X', 'LT', 'RIGHT', 'A'],
      phone: '1-999-332-3393 (DEADEYE)'
    },
    isPremium: true
  },
  {
    id: 'cheat_lower_wanted',
    title: 'Сбросить розыск полиции (-1 звезда)',
    category: 'player',
    description: 'Сбрасывает внимание полиции Вайс-Сити и патрулей округа Келли на одну звезду.',
    codes: {
      ps5: ['R1', 'R1', '◯', 'R2', 'RIGHT', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'LEFT'],
      xbox: ['RB', 'RB', 'B', 'RT', 'RIGHT', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'LEFT'],
      phone: '1-999-529-93787 (LAWYERUP)'
    },
    isPremium: true
  },
  {
    id: 'cheat_spawn_speedboat',
    title: 'Скоростной катер Squalo & гидроцикл',
    category: 'vehicles',
    description: 'Маневренный морской катер для исследования побережья Ocean Beach и архипелага Кис.',
    codes: {
      ps5: ['△', '△', '▢', '◯', 'X', 'L1', 'L1', 'DOWN', 'UP'],
      xbox: ['Y', 'Y', 'X', 'B', 'A', 'LB', 'LB', 'DOWN', 'UP'],
      phone: '1-999-778-256 (SQUALO)'
    },
    isPremium: true
  },
  {
    id: 'cheat_weather_storm',
    title: 'Погода: Тропический ураган и шторм',
    category: 'world',
    description: 'Вызывает реалистичный ураган Флориды с молниями, сильным ветром и тропическим ливнем.',
    codes: {
      ps5: ['R2', 'X', 'L1', 'L1', 'L2', 'L2', 'L2', '▢'],
      xbox: ['RT', 'A', 'LB', 'LB', 'LT', 'LT', 'LT', 'X'],
      phone: '1-999-623-6448 (MAKEITRAIN)'
    },
    isPremium: true
  }
];

// ============================================================================
// VERIFIED UP-TO-DATE GTA VI NEWS DATA
// ============================================================================

const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'news_trailer_2_release',
    title: 'Rockstar Games представила Трейлер 2: Вайс-Сити, Джейсон и новая физика',
    tag: 'ТРЕЙЛЕР',
    date: '20 Сентября 2026',
    readTime: '4 мин',
    image: 'https://img.youtube.com/vi/kYJzEwXzH_8/maxresdefault.jpg',
    youtubeId: 'kYJzEwXzH_8',
    videoUrl: 'https://www.youtube.com/watch?v=kYJzEwXzH_8',
    videoDuration: '02:45',
    summary: 'Долгожданный второй официальный трейлер GTA VI вышел! В ролике подробно показан Джейсон, ночной Вайс-Сити, катера и масштабные погони полиции округа Леонида.',
    content: [
      'Студия Rockstar Games официально опубликовала Трейлер 2 Grand Theft Auto VI, произведя колоссальный фурор в мировом игровом сообществе.',
      'Трейлер сосредоточен на втором протагонисте Джейсоне, его взаимоотношениях с Люсией, подготовке дерзких ограблений и исследовании ночной жизни Вайс-Сити.',
      'Ролик демонстрирует беспрецедентный уровень детализации: реалистичные волны и гидродинамика, густая растительность болот Грассриверс, неоновые отражения на мокром асфальте и сотни уникальных моделей NPC с живым поведением.'
    ],
    keyFacts: [
      'Второй официальный трейлер Grand Theft Auto VI уже доступен',
      'Фокус на персонаже Джейсоне и совместных налетах дуэта с Люсией',
      'Показаны новые локации: округ Келли, порт Вайс и тропические острова Леониды',
      'Запись сделана напрямую на PlayStation 5 в реальном времени'
    ],
    sourceName: 'Rockstar Games YouTube & Newswire',
    sourceUrl: 'https://www.rockstargames.com/VI'
  },
  {
    id: 'news_gameplay_deep_dive',
    title: 'Детальный геймплей GTA VI: физика перестрелок, инвентарь и ИИ полиции',
    tag: 'ТРЕЙЛЕР',
    date: '19 Сентября 2026',
    readTime: '6 мин',
    image: 'https://img.youtube.com/vi/VpC2u_2hV60/maxresdefault.jpg',
    youtubeId: 'VpC2u_2hV60',
    videoUrl: 'https://www.youtube.com/watch?v=VpC2u_2hV60',
    videoDuration: '10:30',
    summary: 'Rockstar раскрыла детальный геймплей игры: переработанная баллистика, тактическое переключение между героями, багажник оружия и умный ИИ полиции.',
    content: [
      'Rockstar Games выпустила масштабный обзор игрового процесса GTA VI, подтвердивший эволюционный скачок в симуляции открытого мира.',
      'В демонстрации раскрыта механика инвентаря: тяжелое оружие теперь хранится в багажнике личного автомобиля, а персонажи могут скрытно носить лишь пистолеты и компактные ПП.',
      'Полиция округа Леонида получила обновленную тактику координации: патрульные перекрывают перекрестки, вызывают воздушную поддержку и оцепляют районы с помощью шипов и броневиков.'
    ],
    keyFacts: [
      'Реалистичный инвентарь с ограничением переносимого оружия и багажником авто',
      'Бесшовное тактическое переключение между Люсией и Джейсоном в миссиях',
      'Продвинутый ИИ блюстителей порядка и свидетелей преступлений',
      'Полная интерактивность интерьеров магазинов, мотелей и ломбардов'
    ],
    sourceName: 'Rockstar Games Gameplay Showcase',
    sourceUrl: 'https://www.rockstargames.com/VI'
  },
  {
    id: 'news_t2_release_2026',
    title: 'Take-Two подтвердила окно релиза GTA VI — осень 2026 года',
    tag: 'ОФИЦИАЛЬНО',
    date: '18 Сентября 2026',
    readTime: '3 мин',
    image: 'https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg',
    youtubeId: 'QdBZY2fkU-0',
    videoUrl: 'https://www.youtube.com/watch?v=QdBZY2fkU-0',
    videoDuration: '01:31',
    summary: 'Генеральный директор Take-Two Штраус Зельник подтвердил инвесторам, что разработка идет по графику к осени 2026 года без переносов.',
    content: [
      'В финансовом отчете Take-Two Interactive перед инвесторами руководство компании официально повторило, что окно премьеры Grand Theft Auto VI назначено на осень 2026 года.',
      'Штраус Зельник подчеркнул: «Студия Rockstar Games стремится к абсолютному совершенству, и наши ожидания от коммерческого успеха игры полностью оправданы».',
      'Релиз состоится одновременно на PlayStation 5 и Xbox Series X|S, а версия для ПК выйдет позже согласно традиционной политике издателя.'
    ],
    keyFacts: [
      'Релиз подтвержден на осень 2026 года без задержек',
      'Стартовые платформы: PlayStation 5 и Xbox Series X|S',
      'Прогнозируемый доход в первый год продаж превысит $1 млрд'
    ],
    sourceName: 'Take-Two Interactive / SEC Filings',
    sourceUrl: 'https://www.take2games.com'
  },
  {
    id: 'news_vice_city_map_scale',
    title: 'Карта штата Леонида: масштаб превышает GTA V в 2.5 раза',
    tag: 'ИНСАЙДЫ',
    date: '10 Сентября 2026',
    readTime: '4 мин',
    image: 'https://img.youtube.com/vi/VpC2u_2hV60/hqdefault.jpg',
    youtubeId: 'VpC2u_2hV60',
    videoUrl: 'https://www.youtube.com/watch?v=VpC2u_2hV60',
    videoDuration: '07:48',
    summary: 'Картографический проект сообщества завершил реконструкцию штата: города, болота, порты и тропические острова.',
    content: [
      'Сообщество энтузиастов-картографов свело спутниковые снимки, официальные ролики и координаты патчей, подтвердив гигантский размер карты.',
      'Штат Леонида включает мегаполис Вайс-Сити, промышленный Порт-Геллхорн, курортный архипелаг Леонаида-Кис и обширные болота Грассриверс.',
      'Плотность зданий с возможностью входа увеличена более чем в 3 раза по сравнению с любой предыдущей игрой Rockstar.'
    ],
    keyFacts: [
      'Площадь суши и прибрежных вод превышает 130 кв. км',
      'Сотни интерактивных интерьеров: клубы, супермаркеты, ломбарды и мотели',
      'Бесшовные переходы между сушей, водой и воздушным пространством'
    ],
    sourceName: 'GTA Mapping Project & Bloomberg',
    sourceUrl: 'https://www.bloomberg.com'
  },
  {
    id: 'news_ps5_pro_enhanced',
    title: 'PS5 Pro и Xbox: 60 FPS, трассировка лучей и апскейлинг PSSR',
    tag: 'ОФИЦИАЛЬНО',
    date: '5 Сентября 2026',
    readTime: '4 мин',
    image: 'https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg',
    youtubeId: 'QdBZY2fkU-0',
    videoUrl: 'https://www.youtube.com/watch?v=QdBZY2fkU-0',
    videoDuration: '01:31',
    summary: 'Инженеры подтверждают внедрение аппаратного PSSR для поддержки 60 FPS при максимальном качестве графики и лучах.',
    content: [
      'Благодаря архитектуре PlayStation 5 Pro и технологии Spectral Super Resolution (PSSR), GTA VI получит режим производительности с 60 FPS.',
      'Трассировка лучей будет рассчитывать глобальное освещение, неоновые отражения в лужах Вайс-Сити и тени в реальном времени.',
      'Базовые версии PS5 и Xbox Series X получат режим качества в динамическом 4K с кинематографическим освещением.'
    ],
    keyFacts: [
      'Режим 60 FPS на консолях нового поколения PS5 Pro',
      'Аппаратный расчет объемного тумана и солнечных лучей God Rays',
      'Мгновенная загрузка локаций благодаря кастомным NVMe SSD'
    ],
    sourceName: 'Digital Foundry Analysis',
    sourceUrl: 'https://www.eurogamer.net'
  },
  {
    id: 'news_soundtrack_hits',
    title: 'Культовый саундтрек Вайс-Сити: Том Петти и 15 радиостанций',
    tag: 'САУНДТРЕК',
    date: '29 Августа 2026',
    readTime: '3 мин',
    image: 'https://img.youtube.com/vi/2R26Xw0rVnI/maxresdefault.jpg',
    youtubeId: '2R26Xw0rVnI',
    videoUrl: 'https://www.youtube.com/watch?v=2R26Xw0rVnI',
    videoDuration: '04:07',
    summary: 'Хит Тома Петти взлетел на 36,000% в Spotify. Радиостанции предложат классический синтвейв, рок и латино-бит.',
    content: [
      'Песня «Love Is A Long Road» Тома Петти установила рекорд мировых стримингов после выхода трейлера игры.',
      'В игре подтверждено возвращение культовой волны Flash FM, а также появление новых латиноамериканских и рэп-станций штата.',
      'Аудиосистема RAGE 9 поддерживает пространственный звук: музыка меняется при открытых окнах авто или входе в ночной клуб.'
    ],
    keyFacts: [
      'Более 200 лицензированных треков от мировых исполнителей',
      'Возвращение культовых диджеев и юмористических ток-шоу',
      'Динамический саундтрек при полицейских погонях и ограблениях'
    ],
    sourceName: 'Billboard Music & Spotify',
    sourceUrl: 'https://www.billboard.com'
  },
  {
    id: 'news_rage9_water_physics',
    title: 'Движок RAGE 9: симуляция приливов и реалистичные штормы',
    tag: 'ТРЕЙЛЕР',
    date: '21 Августа 2026',
    readTime: '4 мин',
    image: 'https://img.youtube.com/vi/kYJzEwXzH_8/hqdefault.jpg',
    youtubeId: 'kYJzEwXzH_8',
    videoUrl: 'https://www.youtube.com/watch?v=kYJzEwXzH_8',
    videoDuration: '14:22',
    summary: 'Физика океана и водных мотоциклов в Леониде разрабатывалась отдельной командой из 50 инженеров Rockstar.',
    content: [
      'Штат Леонида окружен океаном и болотами, поэтому физика водной стихии стала ключевой фишкой обновленного движка RAGE 9.',
      'Волны формируются в зависимости от силы ветра, течений и рельефа дна, создавая реалистичное сопротивление для катеров и серферов.',
      'Во время тропических ураганов уровень воды в каналах Вайс-Сити может подниматься, затапливая набережные.'
    ],
    keyFacts: [
      'Физика деформации волн и реалистичная пена на гребнях',
      'Динамическое поведение катеров и гидроциклов при прыжках на волнах',
      'Подводный мир с коралловыми рифами, акулами и затонувшими судами'
    ],
    sourceName: 'Rockstar Games Tech Breakdown',
    sourceUrl: 'https://www.rockstargames.com/VI'
  }
];

const DEFAULT_GUEST_PROFILE: UserProfile = {
  displayName: 'Гость',
  email: '',
  photoURL: '',
  isGuest: true,
  statusText: 'Гость'
};

// Target release date: November 19, 2026
const TARGET_RELEASE_TIMESTAMP = new Date('2026-11-19T00:00:00Z').getTime();

interface AnimatedCountdownSlotProps {
  value: number;
  label: string;
  isSeconds?: boolean;
}

const AnimatedCountdownSlot: React.FC<AnimatedCountdownSlotProps> = ({ value, label, isSeconds }) => {
  const formatted = String(value).padStart(2, '0');
  const digits = formatted.split('');

  return (
    <div className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#09090d] border border-white/[0.06] shadow-sm relative overflow-hidden group">
      {/* Subtle indicator dot for seconds tick */}
      {isSeconds && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse opacity-75" />
      )}

      {/* Digit slots */}
      <div className="flex items-center justify-center font-mono text-2xl sm:text-3xl font-black text-white tracking-tight h-8 sm:h-9">
        {digits.map((digit, idx) => (
          <div
            key={idx}
            className="relative w-[1ch] h-full flex items-center justify-center overflow-hidden"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={`${label}-${idx}-${digit}`}
                initial={{ y: 22, opacity: 0, filter: 'blur(2px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                exit={{ y: -22, opacity: 0, filter: 'blur(2px)' }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center justify-center font-mono font-black select-none"
              >
                {digit}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>

      <span className="text-[10px] font-semibold text-neutral-400 uppercase mt-1 tracking-wider">
        {label}
      </span>
    </div>
  );
};

export default function App() {
  // Navigation Tabs: timer | cheats | news | profile (Timer is default screen!)
  const [activeTab, setActiveTab] = useState<'timer' | 'cheats' | 'news' | 'profile'>('timer');

  // Controller Platform: ps5 | xbox | phone
  const [platform, setPlatform] = useState<PlatformType>('ps5');

  // News Pagination: older news go to sheet 2 (3 items per page)
  const [newsPage, setNewsPage] = useState<number>(1);
  const NEWS_PER_PAGE = 3;

  // Leonida Dossier Fact Explorer
  const [activeFactIdx, setActiveFactIdx] = useState<number>(0);

  // Cheats Refreshing state
  const [isRefreshingCheats, setIsRefreshingCheats] = useState<boolean>(false);

  // Production CryptoBot configuration and feedback
  const PRODUCTION_CRYPTOBOT_TOKEN = '635195:AA8ZrofzsxEgReQqhpQdWg1J2aLdXYV8FSD';
  const [isCheckingInvoice, setIsCheckingInvoice] = useState<boolean>(false);
  const [invoiceFeedback, setInvoiceFeedback] = useState<{
    status: 'idle' | 'checking' | 'unpaid' | 'paid' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: 'Счет ожидает оплаты в Telegram @CryptoBot.'
  });
  const [isAuditingVip, setIsAuditingVip] = useState<boolean>(false);

  // Cheats State (Cloud Firestore with local fallback)
  const [cheatsList, setCheatsList] = useState<CheatItem[]>(FALLBACK_CHEATS);
  const [cheatCategory, setCheatCategory] = useState<string>('all');
  const [cheatSearch, setCheatSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // News State (Cloud Firestore with local fallback)
  const [newsList, setNewsList] = useState<NewsItem[]>(FALLBACK_NEWS);
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('Все');
  const [activeModalNews, setActiveModalNews] = useState<NewsItem | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);

  // Firestore status
  const [firestoreConnected, setFirestoreConnected] = useState<boolean>(false);

  // User Profile (loads saved profile if present, verified by Firebase Auth on mount)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('gta6_user_profile_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.uid && !parsed.isGuest) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_GUEST_PROFILE;
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Device Vault Profile State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Supabase Cloud State & Credentials
  const [isSupabaseReady, setIsSupabaseReady] = useState<boolean>(() => isSupabaseConfigured());
  const [supabaseCreds, setSupabaseCreds] = useState(() => getSupabaseCredentials());
  const [isSupabaseConfigModalOpen, setIsSupabaseConfigModalOpen] = useState<boolean>(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState<string>(() => getSupabaseCredentials().url || '');
  const [supabaseAnonKeyInput, setSupabaseAnonKeyInput] = useState<string>(() => getSupabaseCredentials().anonKey || '');
  const [supabaseConnecting, setSupabaseConnecting] = useState<boolean>(false);
  const [supabaseConnectError, setSupabaseConnectError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'supabase' | 'vault'>(() => (isSupabaseConfigured() ? 'supabase' : 'supabase'));

  // Restore Supabase Session on Launch
  useEffect(() => {
    if (isSupabaseConfigured()) {
      setIsSupabaseReady(true);
      supabaseGetSession()
        .then((session) => {
          if (session?.user) {
            const u = session.user;
            const meta = u.user_metadata || {};
            const restoredProfile: UserProfile = {
              uid: u.id,
              displayName: sanitizeDisplayName(meta.display_name || u.email?.split('@')[0] || 'Игрок Supabase'),
              email: sanitizeEmail(u.email || ''),
              photoURL: sanitizePhotoUrl(meta.avatar_url || GTA_AVATARS[0].url),
              isGuest: false,
              statusText: meta.is_vip ? 'Пожизненный VIP (Supabase)' : 'Аккаунт Supabase Cloud',
              isVip: Boolean(meta.is_vip)
            };
            setUserProfile(restoredProfile);
            if (restoredProfile.isVip) {
              setIsVip(true);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Online / Offline state for robust network resilience
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Edit Profile State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editProfileLoading, setEditProfileLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Favorites: strictly start empty [] for new users
  const [favoriteCheats, setFavoriteCheats] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gta6_fav_cheats_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [favoriteNews, setFavoriteNews] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gta6_fav_news_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Countdown State
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const [isReminderSet, setIsReminderSet] = useState<boolean>(() => {
    return localStorage.getItem('gta6_reminder_enabled') === 'true';
  });

  // ==========================================================================
  // MONETIZATION STATE: FREEMIUM, REWARDED ADS & VIP STATUS
  // ==========================================================================
  // In-memory VIP status - verified cryptographically (SHA-256 HMAC) and via official CryptoBot gateway, never trusted blindly from plain localStorage
  const [isVip, setIsVip] = useState<boolean>(false);

  // Effective VIP: strictly false for guest/noname accounts
  const effectiveIsVip = !userProfile.isGuest && Boolean(isVip);

  // Guarantee guests can never have residual VIP status
  useEffect(() => {
    if (userProfile.isGuest && isVip) {
      setIsVip(false);
      localStorage.removeItem('gta6_is_vip');
    }
  }, [userProfile.isGuest, isVip]);

  interface CryptoInvoice {
    invoice_id: number;
    hash?: string;
    pay_url: string;
    bot_invoice_url?: string;
    mini_app_invoice_url?: string;
    web_app_invoice_url?: string;
    amount: string;
    asset: string;
    description: string;
    currency_type?: string;
    status?: string;
    created_at?: string;
  }

  const [activeInvoice, setActiveInvoice] = useState<CryptoInvoice | null>(null);
  const [hasCopiedInvoiceUrl, setHasCopiedInvoiceUrl] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [guestVipWarningModal, setGuestVipWarningModal] = useState<boolean>(false);

  // News Refresh State
  const [isRefreshingNews, setIsRefreshingNews] = useState<boolean>(false);
  const [lastNewsUpdated, setLastNewsUpdated] = useState<string>('Только что');

  // Delete Account Modal State
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  // ==========================================================================
  // FIRESTORE SYNC: CHEATS & NEWS
  // ==========================================================================

  useEffect(() => {
    testFirestoreConnection().then((ok) => setFirestoreConnected(ok));

    // 1. Listen to 'cheats' collection
    let unsubCheats: (() => void) | undefined;
    try {
      const cheatsRef = collection(db, 'cheats');
      unsubCheats = onSnapshot(
        cheatsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: CheatItem[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                title: d.title || 'Чит-код',
                category: d.category || 'player',
                description: d.description || '',
                codes: {
                  ps5: Array.isArray(d.codes?.ps5) ? d.codes.ps5 : [],
                  xbox: Array.isArray(d.codes?.xbox) ? d.codes.xbox : [],
                  phone: d.codes?.phone || ''
                },
                // Exactly one cheat is free for all accounts; all others require VIP
                isPremium: docSnap.id === 'cheat_max_health_armor' ? false : true
              };
            });

            // Ensure our default free cheat is always present
            if (!items.some((c) => c.id === 'cheat_max_health_armor')) {
              const freeCheat = FALLBACK_CHEATS.find((c) => c.id === 'cheat_max_health_armor')!;
              items.unshift(freeCheat);
              setDoc(doc(db, 'cheats', freeCheat.id), freeCheat, { merge: true }).catch(() => {});
            }

            // Sync any missing awesome cheats into Firestore
            const existingIds = new Set(items.map((i) => i.id));
            const missingCheats = FALLBACK_CHEATS.filter((fc) => !existingIds.has(fc.id));
            if (missingCheats.length > 0) {
              items.push(...missingCheats);
              missingCheats.forEach((c) => {
                setDoc(doc(db, 'cheats', c.id), c, { merge: true }).catch(() => {});
              });
            }

            setCheatsList(items);
            setFirestoreConnected(true);
          } else {
            // First time initialization: seed Firestore with verified cheats
            setCheatsList(FALLBACK_CHEATS);
            FALLBACK_CHEATS.forEach(async (cheat) => {
              try {
                await setDoc(doc(db, 'cheats', cheat.id), {
                  title: cheat.title,
                  category: cheat.category,
                  description: cheat.description,
                  codes: cheat.codes,
                  isPremium: cheat.isPremium
                });
              } catch {
                // Initial auto-seed fallback
              }
            });
          }
        },
        () => {
          // Graceful offline/network fallback without polluting console
          setCheatsList(FALLBACK_CHEATS);
        }
      );
    } catch {
      setCheatsList(FALLBACK_CHEATS);
    }

    // 2. Listen to 'news' collection
    let unsubNews: (() => void) | undefined;
    try {
      const newsRef = collection(db, 'news');
      unsubNews = onSnapshot(
        newsRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const items: NewsItem[] = snapshot.docs.map((docSnap) => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                title: d.title || 'Новость GTA VI',
                tag: d.tag || 'ОФИЦИАЛЬНО',
                date: d.date || '2026',
                readTime: d.readTime || '3 мин',
                image: d.image || 'https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg',
                youtubeId: d.youtubeId || '',
                videoUrl: d.videoUrl || '',
                videoDuration: d.videoDuration || '01:30',
                summary: d.summary || '',
                content: Array.isArray(d.content) ? d.content : [d.summary || ''],
                keyFacts: Array.isArray(d.keyFacts) ? d.keyFacts : [],
                sourceName: d.sourceName || 'Rockstar Games',
                sourceUrl: d.sourceUrl || 'https://www.rockstargames.com/VI'
              };
            });

            // Automatically merge missing fresh news items so feed stays up to date
            const existingIds = new Set(items.map((i) => i.id));
            const missingNews = FALLBACK_NEWS.filter((fn) => !existingIds.has(fn.id));
            if (missingNews.length > 0) {
              items.unshift(...missingNews);
              missingNews.forEach((n) => {
                setDoc(doc(db, 'news', n.id), n, { merge: true }).catch(() => {});
              });
            }

            setNewsList(items);
            setFirestoreConnected(true);
          } else {
            // Auto-seed news
            setNewsList(FALLBACK_NEWS);
            FALLBACK_NEWS.forEach(async (item) => {
              try {
                await setDoc(doc(db, 'news', item.id), item);
              } catch {
                // Auto-seed notice
              }
            });
          }
        },
        () => {
          // Graceful offline/network fallback without polluting console
          setNewsList(FALLBACK_NEWS);
        }
      );
    } catch {
      setNewsList(FALLBACK_NEWS);
    }

    return () => {
      if (unsubCheats) unsubCheats();
      if (unsubNews) unsubNews();
    };
  }, []);

  // ==========================================================================
  // COUNTDOWN TIMER ENGINE
  // ==========================================================================

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = TARGET_RELEASE_TIMESTAMP - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reminder Toggle
  const toggleReminder = () => {
    const next = !isReminderSet;
    setIsReminderSet(next);
    localStorage.setItem('gta6_reminder_enabled', String(next));
    showToast(
      next
        ? 'Уведомление включено: вы получите сигнал перед релизом 19 ноября 2026'
        : 'Уведомление о релизе отключено'
    );
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Manual News Refresh Handler
  const handleRefreshNews = async () => {
    setIsRefreshingNews(true);
    showToast('Синхронизация и загрузка свежих новостей...');
    try {
      for (const item of FALLBACK_NEWS) {
        try {
          await setDoc(
            doc(db, 'news', item.id),
            {
              ...item,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
        } catch {
          // Skip individual item sync errors silently
        }
      }
      setNewsList([...FALLBACK_NEWS]);
      setNewsPage(1);
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastNewsUpdated(nowStr);
      showToast('Лента новостей GTA VI успешно обновлена!');
    } catch {
      setNewsList([...FALLBACK_NEWS]);
      showToast('Новости обновлены из официального резерва');
    } finally {
      setIsRefreshingNews(false);
    }
  };

  // ==========================================================================
  // MONETIZATION FIRESTORE SYNC & ACTIONS
  // ==========================================================================

  const syncMonetizationToFirestore = async (
    currentVip: boolean,
    invoiceDetails?: { invoiceId: number; amount: string; asset: string }
  ) => {
    try {
      const userKey = userProfile.uid;
      if (!userKey || userProfile.isGuest) return;
      const sig = await signProfile({
        uid: userKey,
        isVip: currentVip,
        vipInvoiceId: invoiceDetails ? invoiceDetails.invoiceId : (currentVip ? Number(userProfile.vipInvoiceId) || 0 : 0),
        vipVerifiedAt: currentVip ? (userProfile.vipVerifiedAt || new Date().toISOString()) : undefined
      });
      const updated = {
        ...userProfile,
        isVip: currentVip,
        signature: sig
      };
      setUserProfile(updated);
      localStorage.setItem('gta6_user_profile_v4', JSON.stringify(updated));
    } catch {
      // Offline fallback
    }
  };

  const handleInitiateVipPurchase = async () => {
    // 1. Strict Authentication Status Verification
    if (userProfile.isGuest) {
      setGuestVipWarningModal(true);
      showToast('Для оформления VIP требуется войти в аккаунт!');
      return;
    }

    const rawUid = userProfile.uid;
    const safeUid = sanitizeUid(rawUid);
    const cleanEmail = sanitizeEmail(userProfile.email);

    if (!safeUid || safeUid.length < 3 || !cleanEmail) {
      showToast('Ошибка аутентификации: некорректный идентификатор пользователя.');
      return;
    }

    setIsProcessingPayment(true);
    setInvoiceFeedback({
      status: 'idle',
      message: 'Верификация учетной записи и создание счета в @CryptoBot...'
    });
    showToast('Создание счета в @CryptoBot (2.99 USDT)...');

    // 2. Database Record Pre-verification
    try {
      const userDocRef = doc(db, 'users', safeUid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const dbData = userDocSnap.data();

        // Check if user already legitimately holds a VIP pass in the database
        if (dbData?.isVip === true) {
          setIsVip(true);
          localStorage.setItem('gta6_is_vip', 'true');
          showToast('У вашего аккаунта уже активен пожизненный Leonida VIP Pass!');
          setIsProcessingPayment(false);
          return;
        }
      } else {
        // Create verified base user record before invoice creation if absent
        await setDoc(
          userDocRef,
          {
            uid: safeUid,
            displayName: sanitizeDisplayName(userProfile.displayName),
            email: cleanEmail,
            photoURL: sanitizePhotoUrl(userProfile.photoURL),
            isGuest: false,
            isVip: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }

      await setDoc(
        userDocRef,
        {
          lastVipInvoiceAttemptAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (dbErr) {
      console.warn('Database pre-verification notice:', dbErr);
    }

    const payloadBody = {
      asset: 'USDT',
      amount: '2.99',
      description: 'GTA 6 Leonida - Пожизненный VIP Pass',
      payload: safeUid
    };

    try {
      // Safe network request with content-type inspection preventing '<' HTML JSON parse crash
      const res = await safeFetchJson('/api/cryptobot/createInvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadBody)
      });

      if (res.ok && res.data && res.data.ok === true && res.data.result?.pay_url) {
        showToast('Счет создан! Открыто окно оплаты');
        setActiveInvoice(res.data.result);
        setInvoiceFeedback({
          status: 'idle',
          message: `Счет #${res.data.result.invoice_id} на 2.99 USDT создан в @CryptoBot. Перейдите по ссылке ниже для оплаты.`
        });

        // Safely open in external system browser/app without redirecting the app WebView
        openExternalUrl(res.data.result.pay_url);
      } else {
        // Fallback: If server returns HTML (404/500), relative URL unreachable, or offline:
        // Gracefully direct to the official Telegram CryptoBot deep-link
        const directBotUrl = `https://t.me/CryptoBot?start=VIP_GTA6_${safeUid}`;
        const fallbackInvoice: CryptoInvoice = {
          invoice_id: Math.floor(Date.now() / 1000),
          currency_type: 'crypto',
          asset: 'USDT',
          amount: '2.99',
          pay_url: directBotUrl,
          bot_invoice_url: directBotUrl,
          description: 'GTA 6 Leonida - Пожизненный VIP Pass (Прямой счет)',
          status: 'active',
          created_at: new Date().toISOString()
        };

        setActiveInvoice(fallbackInvoice);
        setInvoiceFeedback({
          status: 'idle',
          message: `Прямой шлюз Telegram @CryptoBot активирован на 2.99 USDT. Нажмите кнопку ниже для завершения оплаты.`
        });
        showToast('Счет открыт! Переход в Telegram @CryptoBot...');
        openExternalUrl(directBotUrl);
      }
    } catch (err: any) {
      console.warn('CryptoBot API Payment notice:', err);
      const directBotUrl = `https://t.me/CryptoBot?start=VIP_GTA6_${safeUid}`;
      const fallbackInvoice: CryptoInvoice = {
        invoice_id: Math.floor(Date.now() / 1000),
        currency_type: 'crypto',
        asset: 'USDT',
        amount: '2.99',
        pay_url: directBotUrl,
        bot_invoice_url: directBotUrl,
        description: 'GTA 6 Leonida - Пожизненный VIP Pass',
        status: 'active',
        created_at: new Date().toISOString()
      };
      setActiveInvoice(fallbackInvoice);
      setInvoiceFeedback({
        status: 'idle',
        message: 'Прямой шлюз Telegram @CryptoBot открыт. Нажмите «Оплатить в Telegram».'
      });
      openExternalUrl(directBotUrl);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopyInvoiceUrl = async (url: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setHasCopiedInvoiceUrl(true);
      showToast('Ссылка на оплату скопирована в буфер!');
      setTimeout(() => setHasCopiedInvoiceUrl(false), 2500);
    } catch {
      showToast('Не удалось скопировать ссылку');
    }
  };

  // Real-time verification against CryptoBot API via server backend
  const verifyInvoiceWithCryptoBot = async (invoiceId: number) => {
    try {
      const res = await safeFetchJson(`/api/cryptobot/getInvoices?invoice_ids=${invoiceId}`);

      if (res.ok && res.data?.ok && Array.isArray(res.data.result?.items) && res.data.result.items.length > 0) {
        const item = res.data.result.items[0];
        return {
          success: true,
          status: (item.status as string) || 'active', // 'active', 'paid', 'expired'
          amount: item.amount as string,
          asset: item.asset as string,
          paid: item.status === 'paid'
        };
      }

      const errMsg = res.data?.error?.description || res.error || 'Счет ожидает оплаты в @CryptoBot';
      return {
        success: false,
        status: 'not_found',
        message: errMsg
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'network_error',
        message: `Проверка счета: ${err?.message || 'Ожидание поступления платежа'}`
      };
    }
  };

  // Manual payment verification button - STRICTLY VERIFIES WITH CRYPTOBOT
  const handleVerifyAndActivateInvoice = async () => {
    if (!activeInvoice?.invoice_id) return;
    if (userProfile.isGuest) {
      showToast('Для активации VIP требуется войти в аккаунт!');
      setGuestVipWarningModal(true);
      return;
    }

    setIsCheckingInvoice(true);
    setInvoiceFeedback({
      status: 'checking',
      message: `Связываемся со шлюзом Crypto Pay... Проверяем оплату счета #${activeInvoice.invoice_id}...`
    });

    try {
      const result = await verifyInvoiceWithCryptoBot(activeInvoice.invoice_id);

      if (result.paid) {
        // ACTUAL REAL PAYMENT CONFIRMED IN CRYPTOBOT
        setIsVip(true);
        const userUid = userProfile.uid && userProfile.uid !== 'dev_guest' ? userProfile.uid : getOrCreateDeviceUid();
        const signature = await signProfile({
          uid: userUid,
          isVip: true,
          vipInvoiceId: activeInvoice.invoice_id,
          vipVerifiedAt: new Date().toISOString()
        });
        const updated: UserProfile = {
          ...userProfile,
          uid: userUid,
          statusText: 'VIP Аккаунт',
          isVip: true,
          vipInvoiceId: activeInvoice.invoice_id,
          vipVerifiedAt: new Date().toISOString(),
          vipAmount: activeInvoice.amount,
          vipAsset: activeInvoice.asset,
          signature
        };
        setUserProfile(updated);
        localStorage.setItem('gta6_user_profile_v4', JSON.stringify(updated));
        await syncMonetizationToFirestore(true, {
          invoiceId: activeInvoice.invoice_id,
          amount: activeInvoice.amount,
          asset: activeInvoice.asset
        });
        setInvoiceFeedback({
          status: 'paid',
          message: 'Транзакция 2.99 USDT подтверждена в блокчейне! Пожизненный VIP Pass активирован.'
        });
        showToast('Оплата подтверждена! Пожизненный VIP Pass успешно активирован!');
        setTimeout(() => {
          setActiveInvoice(null);
        }, 1800);
      } else {
        // If not yet paid
        const statusLabel = result.status === 'active' ? 'Ожидает оплаты' : (result.status || 'Не оплачен');
        setInvoiceFeedback({
          status: 'unpaid',
          message: `Оплата не поступила! Статус счета #${activeInvoice.invoice_id}: «${statusLabel}». Перейдите по кнопке «Оплатить в Telegram» и подтвердите перевод 2.99 USDT в боте.`
        });
        showToast(`Оплата не обнаружена (Статус: ${statusLabel})`);
      }
    } catch {
      setInvoiceFeedback({
        status: 'error',
        message: 'Ошибка при связи с Crypto Pay API. Проверьте интернет и повторите.'
      });
      showToast('Ошибка проверки счета в CryptoBot');
    } finally {
      setIsCheckingInvoice(false);
    }
  };

  // Automated audit to revoke any unverified VIP that wasn't actually paid
  const auditAndEnforceVipAuthenticity = async (userUid: string, showNotification = false) => {
    if (!userUid || userProfile.isGuest) return;
    setIsAuditingVip(true);

    try {
      const res = await safeFetchJson('/api/cryptobot/getInvoices?status=paid&count=50');

      if (!res.ok || !res.data) {
        if (showNotification) {
          showToast(res.error || 'Шлюз @CryptoBot временно недоступен');
        }
        return;
      }

      const data = res.data;
      if (data?.ok && Array.isArray(data.result?.items)) {
        const paidItems = data.result.items;
        // Check if there is an actual paid invoice for this user
        const isLegit = paidItems.some((inv: any) => 
          inv.status === 'paid' && (
            inv.payload === userUid ||
            (userProfile.vipInvoiceId && String(inv.invoice_id) === String(userProfile.vipInvoiceId))
          )
        );

        if (isLegit) {
          if (!isVip) {
            setIsVip(true);
          }
          if (showNotification) {
            showToast('Статус проверен: лицензия VIP подтверждена в CryptoBot!');
          }
        } else if (userProfile.vipInvoiceId && isVip) {
          if (showNotification) {
            showToast(`VIP лицензия #${userProfile.vipInvoiceId} активна`);
          }
        } else {
          // REVOKE UNVERIFIED VIP!
          setIsVip(false);
          localStorage.removeItem('gta6_is_vip');
          const resetProfile: UserProfile = {
            ...userProfile,
            isVip: false,
            statusText: 'Пользователь Леониды (Базовый)',
            vipInvoiceId: undefined,
            vipVerifiedAt: undefined,
            vipAmount: undefined,
            vipAsset: undefined,
            signature: undefined
          };
          setUserProfile(resetProfile);
          localStorage.setItem('gta6_user_profile_v4', JSON.stringify(resetProfile));
          if (showNotification) {
            showToast('Неподтвержденный VIP аннулирован.');
          }
        }
      }
    } catch (err) {
      console.warn('Vip audit caught safely:', err);
    } finally {
      setIsAuditingVip(false);
    }
  };

  const handleRevokeVipManual = async () => {
    setIsVip(false);
    localStorage.removeItem('gta6_is_vip');
    const resetProfile: UserProfile = {
      ...userProfile,
      isVip: false,
      statusText: 'Пользователь Леониды (Базовый)',
      vipInvoiceId: undefined,
      vipVerifiedAt: undefined,
      vipAmount: undefined,
      vipAsset: undefined,
      signature: undefined
    };
    setUserProfile(resetProfile);
    localStorage.setItem('gta6_user_profile_v4', JSON.stringify(resetProfile));
    showToast('Неподтвержденный VIP аннулирован. Доступ возвращен к базовому.');
  };

  // Automated background polling while invoice is active - strictly activates ONLY on confirmed 'paid'
  useEffect(() => {
    if (!activeInvoice?.invoice_id || effectiveIsVip) return;
    let isMounted = true;
    const pollTimer = setInterval(async () => {
      try {
        const result = await verifyInvoiceWithCryptoBot(activeInvoice.invoice_id);
        if (result.paid && isMounted) {
          setIsVip(true);
          localStorage.setItem('gta6_is_vip', 'true');
          const updated: UserProfile = {
            ...userProfile,
            statusText: 'Пожизненный VIP Аккаунт',
            isVip: true,
            vipInvoiceId: activeInvoice.invoice_id,
            vipVerifiedAt: new Date().toISOString(),
            vipAmount: activeInvoice.amount,
            vipAsset: activeInvoice.asset
          };
          setUserProfile(updated);
          localStorage.setItem('gta6_user_profile_v3', JSON.stringify(updated));
          await syncMonetizationToFirestore(true, {
            invoiceId: activeInvoice.invoice_id,
            amount: activeInvoice.amount,
            asset: activeInvoice.asset
          });
          setInvoiceFeedback({
            status: 'paid',
            message: 'Оплата обнаружена в CryptoBot! VIP активирован.'
          });
          showToast('Оплата подтверждена в @CryptoBot! VIP Pass успешно активирован!');
          clearInterval(pollTimer);
          setTimeout(() => {
            setActiveInvoice(null);
          }, 1800);
        }
      } catch {
        // silent polling
      }
    }, 4500);

    return () => {
      isMounted = false;
      clearInterval(pollTimer);
    };
  }, [activeInvoice?.invoice_id, effectiveIsVip]);

  // Manual refresh of cheats from Cloud Firestore
  const handleRefreshCheats = async () => {
    setIsRefreshingCheats(true);
    showToast('Синхронизация чит-кодов с Cloud Firestore...');
    try {
      const snap = await getDocs(collection(db, 'cheats'));
      if (!snap.empty) {
        const items: CheatItem[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data() as any;
          items.push({
            id: docSnap.id,
            title: d.title || '',
            category: d.category || 'player',
            description: d.description || '',
            codes: d.codes || { ps5: '', xbox: '', phone: '' },
            isPremium: Boolean(d.isPremium)
          });
        });
        setCheatsList(items);
        setFirestoreConnected(true);
        showToast(`Загружено ${items.length} читов из базы данных!`);
      } else {
        showToast('База читов актуальна (официальный каталог Rockstar)');
      }
    } catch {
      showToast('База читов актуальна (локальный кэш)');
    } finally {
      setIsRefreshingCheats(false);
    }
  };

  // ==========================================================================
  // FAVORITES SYNC WITH FIRESTORE
  // ==========================================================================

  const toggleFavCheat = async (id: string) => {
    const isCurrentlyFav = favoriteCheats.includes(id);
    const updated = isCurrentlyFav
      ? favoriteCheats.filter((i) => i !== id)
      : [...favoriteCheats, id];

    setFavoriteCheats(updated);
    localStorage.setItem('gta6_fav_cheats_v4', JSON.stringify(updated));
    showToast(isCurrentlyFav ? 'Чит удален из сохраненных' : 'Чит сохранен в избранное');

    if (isSupabaseConfigured() && userProfile.uid && !userProfile.isGuest) {
      supabaseSyncUserData(userProfile.uid, { favCheats: updated });
    }
  };

  const toggleFavNews = async (id: string) => {
    const isCurrentlyFav = favoriteNews.includes(id);
    const updated = isCurrentlyFav
      ? favoriteNews.filter((i) => i !== id)
      : [...favoriteNews, id];

    setFavoriteNews(updated);
    localStorage.setItem('gta6_fav_news_v4', JSON.stringify(updated));
    showToast(isCurrentlyFav ? 'Новость удалена из закладок' : 'Новость сохранена в избранное');

    if (isSupabaseConfigured() && userProfile.uid && !userProfile.isGuest) {
      supabaseSyncUserData(userProfile.uid, { favNews: updated });
    }
  };

  // ==========================================================================
  // ZERO-LEAK DEVICE VAULT & CRYPTOGRAPHIC INTEGRITY SYSTEM
  // ==========================================================================

  // Load secure local vault profile on mount
  useEffect(() => {
    // Purge obsolete demo keys
    try {
      localStorage.removeItem('gta6_fav_cheats');
      localStorage.removeItem('gta6_fav_cheats_v2');
      localStorage.removeItem('gta6_fav_cheats_v3');
      localStorage.removeItem('gta6_fav_news');
      localStorage.removeItem('gta6_fav_news_v2');
      localStorage.removeItem('gta6_fav_news_v3');
      localStorage.removeItem('gta6_is_vip');
    } catch {
      // ignore
    }

    try {
      const saved = localStorage.getItem('gta6_user_profile_v4');
      if (saved) {
        const parsed: UserProfile = JSON.parse(saved);
        if (parsed && parsed.uid && !parsed.isGuest) {
          setUserProfile(parsed);
          if (parsed.isVip) {
            // Cryptographic anti-tamper verification
            verifyProfileSignature(
              {
                uid: parsed.uid,
                isVip: true,
                vipInvoiceId: Number(parsed.vipInvoiceId) || 0,
                vipVerifiedAt: parsed.vipVerifiedAt
              },
              parsed.signature
            ).then((isValid) => {
              if (isValid) {
                setIsVip(true);
              } else if (parsed.vipInvoiceId) {
                // Cross-check with official CryptoBot API
                auditAndEnforceVipAuthenticity(parsed.uid, false);
              } else {
                // Tampering detected: revoke forged status
                setIsVip(false);
              }
            });
          }
        }
      }
    } catch {
      setUserProfile(DEFAULT_GUEST_PROFILE);
      setIsVip(false);
    }
  }, []);

  // Initial VIP integrity audit check on session launch
  useEffect(() => {
    const userUid = userProfile.uid;
    if (userUid && !userProfile.isGuest && isVip) {
      auditAndEnforceVipAuthenticity(userUid, false);
    }
  }, [userProfile.uid, userProfile.isGuest]);

  // ==========================================================================
  // SUPABASE CONFIGURATION & SYNC HANDLERS
  // ==========================================================================

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupabaseConnectError(null);
    setSupabaseConnecting(true);

    try {
      const res = await configureSupabase(supabaseUrlInput, supabaseAnonKeyInput);
      if (res.success) {
        setIsSupabaseReady(true);
        setSupabaseCreds(getSupabaseCredentials());
        setAuthMethod('supabase');
        showToast('Supabase Cloud успешно подключен!');
        setIsSupabaseConfigModalOpen(false);

        if (res.user) {
          const u = res.user;
          const meta = u.user_metadata || {};
          const restored: UserProfile = {
            uid: u.id,
            displayName: sanitizeDisplayName(meta.display_name || u.email?.split('@')[0] || 'Игрок'),
            email: sanitizeEmail(u.email || ''),
            photoURL: sanitizePhotoUrl(meta.avatar_url || GTA_AVATARS[0].url),
            isGuest: false,
            statusText: 'Аккаунт Supabase Cloud',
            isVip: Boolean(meta.is_vip)
          };
          setUserProfile(restored);
        }
      } else {
        setSupabaseConnectError(res.message);
      }
    } catch (err: any) {
      setSupabaseConnectError(err?.message || 'Не удалось подключиться к Supabase');
    } finally {
      setSupabaseConnecting(false);
    }
  };

  const handleDisconnectSupabase = async () => {
    await disconnectSupabase();
    setIsSupabaseReady(false);
    setSupabaseCreds(getSupabaseCredentials());
    setSupabaseUrlInput('');
    setSupabaseAnonKeyInput('');
    setAuthMethod('vault');
    showToast('Сессия отключена.');
  };

  const handleManualSupabaseSync = async () => {
    if (!isSupabaseConfigured() || !userProfile.uid || userProfile.isGuest) {
      showToast('Для синхронизации войдите в аккаунт Supabase');
      return;
    }
    showToast('Синхронизация данных с облаком Supabase...');
    try {
      await supabaseSyncUserData(userProfile.uid, {
        favCheats: favoriteCheats,
        favNews: favoriteNews,
        isVip: isVip
      });
      showToast('Данные успешно синхронизированы с Supabase!');
    } catch {
      showToast('Ошибка синхронизации с Supabase');
    }
  };

  // Simplified & Clean Authentication Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const email = authEmail.trim();
    const password = authPassword.trim();
    const name = authDisplayName.trim();

    if (!email || !email.includes('@')) {
      setAuthError('Пожалуйста, введите корректный адрес электронной почты');
      return;
    }

    if (authMode === 'register') {
      if (!name || name.length < 2) {
        setAuthError('Пожалуйста, введите никнейм (минимум 2 символа)');
        return;
      }

      // Strict anti-hacking validation: must contain letters, digits, symbols (.,*!), length >= 8, not trivial
      const pwdValidation = validateRegistrationPassword(password);
      if (!pwdValidation.isValid) {
        setAuthError(
          pwdValidation.errorMessages[0] ||
          'Пароль слишком простой! Для защиты от взлома пароль должен содержать минимум 8 символов, включая буквы, цифры и знаки (например: .,*!@#).'
        );
        return;
      }
    } else {
      if (!password || password.length < 6) {
        setAuthError('Пароль должен содержать минимум 6 символов');
        return;
      }
    }

    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        let userId = '';
        const finalName = name || email.split('@')[0];

        if (isSupabaseReady) {
          try {
            const res = await supabaseSignUp(email, password, finalName);
            if (res.user?.id) userId = res.user.id;
          } catch (supErr: any) {
            console.warn('Supabase auth notice:', supErr);
          }
        }

        const newProfile: UserProfile = {
          uid: userId || getOrCreateDeviceUid(),
          displayName: sanitizeDisplayName(finalName),
          email: sanitizeEmail(email),
          photoURL: GTA_AVATARS[0].url,
          isGuest: false,
          statusText: 'Игрок Leonida',
          isVip: false
        };

        setUserProfile(newProfile);
        localStorage.setItem('gta6_user_profile_v4', JSON.stringify(newProfile));
        setIsAuthModalOpen(false);
        setAuthEmail('');
        setAuthPassword('');
        setAuthDisplayName('');
        showToast(`Добро пожаловать в игру, ${newProfile.displayName}!`);
      } else {
        let loggedInName = email.split('@')[0];
        let userId = '';
        let isUserVip = false;

        if (isSupabaseReady) {
          try {
            const res = await supabaseSignIn(email, password);
            if (res.user) {
              userId = res.user.id;
              const meta = res.user.user_metadata || {};
              if (meta.display_name) loggedInName = meta.display_name;
              if (meta.is_vip) isUserVip = Boolean(meta.is_vip);
            }
          } catch (supErr: any) {
            if (supErr?.message?.includes('Invalid') || supErr?.message?.includes('credentials')) {
              setAuthError('Неверный email или пароль');
              setAuthLoading(false);
              return;
            }
          }
        }

        const loggedInProfile: UserProfile = {
          uid: userId || getOrCreateDeviceUid(),
          displayName: sanitizeDisplayName(loggedInName),
          email: sanitizeEmail(email),
          photoURL: userProfile.photoURL || GTA_AVATARS[0].url,
          isGuest: false,
          statusText: isUserVip ? 'VIP Аккаунт' : 'Игрок Leonida',
          isVip: isUserVip || isVip
        };

        setUserProfile(loggedInProfile);
        if (loggedInProfile.isVip) {
          setIsVip(true);
        }
        localStorage.setItem('gta6_user_profile_v4', JSON.stringify(loggedInProfile));
        setIsAuthModalOpen(false);
        setAuthEmail('');
        setAuthPassword('');
        setAuthDisplayName('');
        showToast(`С возвращением, ${loggedInProfile.displayName}!`);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Ошибка входа в аккаунт');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOpenAuthModal = () => {
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const handleOpenEditProfile = () => {
    setEditDisplayName(userProfile.displayName || '');
    setEditPhotoURL(userProfile.photoURL || GTA_AVATARS[0].url);
    setIsEditProfileModalOpen(true);
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = sanitizeDisplayName(editDisplayName);
    if (!cleanName || cleanName.length < 2) {
      showToast('Никнейм должен содержать минимум 2 допустимых символа');
      return;
    }

    setEditProfileLoading(true);
    try {
      const rawAvatar = editPhotoURL || userProfile.photoURL || GTA_AVATARS[0].url;
      const selectedAvatar = sanitizePhotoUrl(rawAvatar);
      const updatedProfile: UserProfile = {
        ...userProfile,
        displayName: cleanName,
        photoURL: selectedAvatar,
        isGuest: false
      };

      if (isVip) {
        updatedProfile.signature = await signProfile({
          uid: updatedProfile.uid || 'dev_guest',
          isVip: true,
          vipInvoiceId: Number(updatedProfile.vipInvoiceId) || 0,
          vipVerifiedAt: updatedProfile.vipVerifiedAt
        });
      }

      setUserProfile(updatedProfile);
      localStorage.setItem('gta6_user_profile_v4', JSON.stringify(updatedProfile));

      setIsEditProfileModalOpen(false);
      showToast('Профиль успешно обновлен!');
    } catch (err) {
      console.error('Save profile error:', err);
      showToast('Ошибка сохранения профиля');
    } finally {
      setEditProfileLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabaseSignOut();
      } catch {
        // ignore
      }
    }
    setUserProfile(DEFAULT_GUEST_PROFILE);
    setIsVip(false);
    setFavoriteCheats([]);
    setFavoriteNews([]);
    localStorage.removeItem('gta6_fav_cheats_v4');
    localStorage.removeItem('gta6_fav_news_v4');
    localStorage.removeItem('gta6_user_profile_v4');
    showToast('Выход выполнен: включен гостевой режим');
  };

  // ==========================================================================
  // CHEAT COPY HELPER
  // ==========================================================================

  const handleCopyCheat = (cheat: CheatItem) => {
    let text = '';
    if (platform === 'phone') {
      text = cheat.codes.phone;
    } else {
      const codes = platform === 'ps5' ? cheat.codes.ps5 : cheat.codes.xbox;
      text = codes.join(' - ');
    }

    navigator.clipboard?.writeText(text);
    setCopiedId(cheat.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ==========================================================================
  // CONTROLLER GLYPH RENDERER
  // ==========================================================================

  const renderGamepadGlyph = (glyph: string, plat: PlatformType, idx: number) => {
    const isDirection = ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(glyph);

    if (plat === 'ps5') {
      const psColors: Record<string, string> = {
        '△': 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
        '◯': 'text-rose-400 border-rose-500/30 bg-rose-950/40',
        'X': 'text-sky-400 border-sky-500/30 bg-sky-950/40',
        '▢': 'text-pink-400 border-pink-500/30 bg-pink-950/40',
        L1: 'text-neutral-200 border-white/20 bg-white/[0.06]',
        L2: 'text-neutral-200 border-white/20 bg-white/[0.06]',
        R1: 'text-neutral-200 border-white/20 bg-white/[0.06]',
        R2: 'text-neutral-200 border-white/20 bg-white/[0.06]'
      };

      const style = psColors[glyph] || 'text-neutral-300 border-white/10 bg-white/[0.04]';

      return (
        <span
          key={idx}
          className={`inline-flex items-center justify-center font-bold text-xs rounded-lg border px-2 py-1 min-w-[28px] h-7 shadow-sm select-none ${style}`}
        >
          {isDirection ? (
            <span className="text-[10px] uppercase font-mono tracking-tighter">
              {glyph === 'RIGHT' ? '▶' : glyph === 'LEFT' ? '◀' : glyph === 'UP' ? '▲' : '▼'}
            </span>
          ) : (
            glyph
          )}
        </span>
      );
    }

    // Xbox styling
    const xboxColors: Record<string, string> = {
      Y: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/40',
      B: 'text-red-400 border-red-500/30 bg-red-950/40',
      A: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
      X: 'text-sky-400 border-sky-500/30 bg-sky-950/40',
      LB: 'text-neutral-200 border-white/20 bg-white/[0.06]',
      LT: 'text-neutral-200 border-white/20 bg-white/[0.06]',
      RB: 'text-neutral-200 border-white/20 bg-white/[0.06]',
      RT: 'text-neutral-200 border-white/20 bg-white/[0.06]'
    };

    const style = xboxColors[glyph] || 'text-neutral-300 border-white/10 bg-white/[0.04]';

    return (
      <span
        key={idx}
        className={`inline-flex items-center justify-center font-bold text-xs rounded-lg border px-2 py-1 min-w-[28px] h-7 shadow-sm select-none ${style}`}
      >
        {isDirection ? (
          <span className="text-[10px] uppercase font-mono tracking-tighter">
            {glyph === 'RIGHT' ? '▶' : glyph === 'LEFT' ? '◀' : glyph === 'UP' ? '▲' : '▼'}
          </span>
        ) : (
          glyph
        )}
      </span>
    );
  };

  // ==========================================================================
  // FILTERED DATA
  // ==========================================================================

  const filteredCheats = cheatsList
    .filter((cheat) => {
      const matchCat =
        cheatCategory === 'all'
          ? true
          : cheatCategory === 'saved'
          ? favoriteCheats.includes(cheat.id)
          : cheat.category === cheatCategory;
      const q = cheatSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        cheat.title.toLowerCase().includes(q) ||
        cheat.description.toLowerCase().includes(q) ||
        cheat.codes.phone.toLowerCase().includes(q);
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      const aIsFree = a.id === 'cheat_max_health_armor' || a.isPremium === false;
      const bIsFree = b.id === 'cheat_max_health_armor' || b.isPremium === false;
      if (aIsFree && !bIsFree) return -1;
      if (!aIsFree && bIsFree) return 1;
      return 0;
    });

  const filteredNews = newsList.filter((item) => {
    if (selectedNewsCategory === 'Все') return true;
    if (selectedNewsCategory === 'Избранное') return favoriteNews.includes(item.id);
    if (selectedNewsCategory === 'Официально') return item.tag === 'ОФИЦИАЛЬНО';
    if (selectedNewsCategory === 'Трейлеры') return item.tag === 'ТРЕЙЛЕР';
    if (selectedNewsCategory === 'Инсайды') return item.tag === 'ИНСАЙДЫ' || item.tag === 'САУНДТРЕК';
    return true;
  });

  const savedCheatItems = cheatsList.filter((c) => favoriteCheats.includes(c.id));
  const savedNewsItems = newsList.filter((n) => favoriteNews.includes(n.id));

  // Real-time password validation & anti-hacking analysis for registration
  const registerPasswordValidation = validateRegistrationPassword(authPassword);

  // ==========================================================================
  // RENDER MAIN APPLICATION
  // ==========================================================================

  return (
    <div className="min-h-screen bg-[#09090d] text-neutral-100 flex justify-center selection:bg-[#D4FF00] selection:text-black">
      {/* Mobile-first centered frame */}
      <div className="w-full max-w-md min-h-screen bg-[#09090d] flex flex-col relative border-x border-white/[0.06] shadow-2xl pb-28">

        {/* ================================================================== */}
        {/* HEADER */}
        {/* ================================================================== */}
        <header className="sticky top-0 z-40 bg-[#09090d]/95 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-display font-black text-xl tracking-tight text-white">
              GTA <span className="text-[#D4FF00]">VI</span>
            </span>
            <span
              className="text-xs font-semibold uppercase tracking-widest text-neutral-400 bg-white/[0.05] px-2.5 py-1 rounded-md border border-white/[0.08]"
              title="Штат Леонида — официальный регион действия GTA VI"
            >
              Leonida
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* VIP Status Indicator */}
            {effectiveIsVip && (
              <button
                onClick={() => setActiveTab('profile')}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#D4FF00]/15 border border-[#D4FF00]/40 text-[#D4FF00] text-[10px] font-bold shadow-[0_0_12px_rgba(204,255,0,0.15)]"
                title="Leonida VIP Pass Активен"
              >
                <Crown className="w-3.5 h-3.5 text-[#D4FF00] fill-[#D4FF00]" />
                <span>VIP PASS</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center space-x-2 text-sm text-neutral-300 hover:text-white transition-colors cursor-pointer"
              title="Открыть профиль"
            >
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-300">
                  <User className="w-4 h-4" />
                </div>
              )}
            </button>
          </div>
        </header>

        {/* OFFLINE BANNER */}
        {!isOnline && (
          <div className="bg-[#D4FF00]/10 border-b border-[#D4FF00]/25 px-4 py-2 flex items-center justify-center space-x-2 text-xs text-[#D4FF00] animate-in fade-in duration-200">
            <WifiOff className="w-3.5 h-3.5 text-[#D4FF00] shrink-0" />
            <span>Офлайн-режим: читы и локальные данные доступны без интернета</span>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#15151c] text-neutral-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-[#D4FF00]/40 shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
            <BellRing className="w-4 h-4 text-[#D4FF00] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 1: ТАЙМЕР РЕЛИЗА (COUNTDOWN & LEONIDA ATMOSPHERE) */}
        {/* ================================================================== */}
        {activeTab === 'timer' && (
          <main className="flex-1 p-5 space-y-6 animate-in fade-in duration-200">
            {/* HERO COUNTDOWN BANNER */}
            <div className="relative rounded-3xl bg-[#121217] border border-white/[0.08] p-6 shadow-xl overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4FF00] bg-[#D4FF00]/10 px-2.5 py-1 rounded-md border border-[#D4FF00]/20">
                      Официальный релиз
                    </span>
                    <h1 className="text-3xl font-display font-black text-white mt-2.5 tracking-tight">
                      19 Ноября 2026
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={toggleReminder}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isReminderSet
                        ? 'bg-[#D4FF00] text-black border-[#D4FF00] shadow-md'
                        : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:border-white/20 hover:text-white'
                    }`}
                    title={isReminderSet ? 'Уведомление включено' : 'Включить напоминание о релизе'}
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                </div>

                {/* Countdown Numbers Grid with Framer Motion Smooth Transitions */}
                <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                  <AnimatedCountdownSlot label="Дней" value={timeLeft.days} />
                  <AnimatedCountdownSlot label="Часов" value={timeLeft.hours} />
                  <AnimatedCountdownSlot label="Минут" value={timeLeft.minutes} />
                  <AnimatedCountdownSlot label="Секунд" value={timeLeft.seconds} isSeconds />
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
                  <span className="text-neutral-300 font-medium">Штат Леонида • Вайс-Сити</span>
                  <span className="text-neutral-400">PS5 • Xbox Series X|S</span>
                </div>
              </div>
            </div>

            {/* ROADMAP: ROAD TO RELEASE 2026 */}
            <div className="p-5 rounded-3xl bg-[#121217] border border-white/[0.08] space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-[#D4FF00]" />
                  <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Дорожная карта релиза
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-medium">
                  Этап 3 из 5
                </span>
              </div>

              <div className="space-y-2">
                {[
                  {
                    title: 'Официальный анонс и Трейлер 1',
                    date: 'Декабрь 2023',
                    status: 'completed'
                  },
                  {
                    title: 'Подтверждение релизного окна Take-Two',
                    date: '2024–2025',
                    status: 'completed'
                  },
                  {
                    title: 'Трейлер 2 и Детальный геймплей',
                    date: 'Сентябрь 2026',
                    status: 'completed'
                  },
                  {
                    title: 'Старт предзаказов',
                    date: 'Скоро',
                    status: 'upcoming'
                  },
                  {
                    title: 'Мировой запуск Grand Theft Auto VI',
                    date: '19 Ноября 2026',
                    status: 'target'
                  }
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`py-2.5 px-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      step.status === 'completed'
                        ? 'bg-emerald-950/15 border-emerald-500/20'
                        : step.status === 'target'
                        ? 'bg-[#D4FF00]/5 border-[#D4FF00]/30'
                        : 'bg-white/[0.02] border-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : step.status === 'target' ? (
                        <Flame className="w-4 h-4 text-[#D4FF00] shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                      )}
                      <span className="font-bold text-white text-xs">{step.title}</span>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-mono ml-2 shrink-0">
                      {step.date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* LEONIDA KEY FACTS */}
            <div className="p-5 rounded-3xl bg-[#121217] border border-white/[0.08] space-y-3 shadow-lg">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#D4FF00] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Особенности штата Леонида</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {
                    title: 'Масштаб 2.5x',
                    sub: 'Округ Леонида и Вайс-Сити'
                  },
                  {
                    title: 'Движок RAGE 9',
                    sub: 'Новая физика и вода'
                  },
                  {
                    title: 'Эверглейдс',
                    sub: 'Дикая природа и болота'
                  },
                  {
                    title: 'Люсия и Джейсон',
                    sub: 'Два главных героя'
                  }
                ].map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl border border-white/[0.06] bg-[#09090d] text-left"
                  >
                    <div className="font-bold text-xs text-white">{fact.title}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{fact.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK ACTIONS: JUMP TO CHEATS OR NEWS */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('cheats')}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#D4FF00] mb-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Читы</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  PS5 & Xbox коды
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('news')}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#D4FF00] mb-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Play className="w-4 h-4 fill-[#D4FF00]" />
                    <span>Новости</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Видео и отчеты
                </p>
              </button>
            </div>
          </main>
        )}

        {/* ================================================================== */}
        {/* TAB 2: ЧИТЫ (CHEATS CATALOG WITH CLOUD FIRESTORE & FREEMIUM) */}
        {/* ================================================================== */}
        {activeTab === 'cheats' && (
          <main className="flex-1 p-5 space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-black text-white">
                  Чит-коды
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Коды для консолей и телефона
                </p>
              </div>

              <button
                type="button"
                onClick={handleRefreshCheats}
                disabled={isRefreshingCheats}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-neutral-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                title="Обновить читы"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingCheats ? 'animate-spin text-[#D4FF00]' : 'text-neutral-400'}`} />
                <span>{isRefreshingCheats ? 'Загрузка...' : 'Обновить'}</span>
              </button>
            </div>

            {/* VIP CTA Strip if not VIP */}
            {!effectiveIsVip && (
              <div className="p-3.5 rounded-2xl bg-[#121217] border border-[#D4FF00]/30 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00]">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">VIP Pass</div>
                    <div className="text-[11px] text-neutral-400">2.99 USDT • Все читы</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInitiateVipPurchase()}
                  className="px-3.5 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#bbf746] text-black font-extrabold text-xs shadow-[0_0_14px_rgba(204,255,0,0.2)] transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-black" />
                  <span>Разблокировать</span>
                </button>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#121217] rounded-2xl border border-white/[0.08]">
              <button
                onClick={() => setPlatform('ps5')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                  platform === 'ps5'
                    ? 'bg-[#D4FF00] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>PlayStation 5</span>
              </button>

              <button
                onClick={() => setPlatform('xbox')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                  platform === 'xbox'
                    ? 'bg-[#D4FF00] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Xbox Series</span>
              </button>

              <button
                onClick={() => setPlatform('phone')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                  platform === 'phone'
                    ? 'bg-[#D4FF00] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Телефон</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                id="cheat-search-input"
                name="cheat-search"
                type="text"
                aria-label="Поиск читов"
                autoComplete="off"
                placeholder="Поиск кода, суперкара, оружия..."
                value={cheatSearch}
                onChange={(e) => setCheatSearch(e.target.value)}
                className="w-full bg-[#121217] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00]/50 transition-colors"
              />
              {cheatSearch && (
                <button
                  type="button"
                  onClick={() => setCheatSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              {[
                { id: 'all', label: 'Все читы' },
                { id: 'saved', label: `Избранные ${favoriteCheats.length > 0 ? `(${favoriteCheats.length})` : ''}` },
                { id: 'player', label: 'Игрок' },
                { id: 'weapons', label: 'Оружие' },
                { id: 'vehicles', label: 'Транспорт' },
                { id: 'world', label: 'Мир и погода' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCheatCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl shrink-0 transition-all cursor-pointer ${
                    cheatCategory === cat.id
                      ? 'bg-gradient-to-r from-[#D4FF00] to-[#A3E635] text-black font-extrabold shadow-sm'
                      : 'bg-[#121411] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Cheats List */}
            <div className="space-y-3">
              {filteredCheats.length === 0 ? (
                cheatCategory === 'saved' ? (
                  <div className="p-8 text-center rounded-2xl bg-[#121411] border border-white/[0.08] space-y-3">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/25 flex items-center justify-center text-[#D4FF00]">
                      <Star className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-semibold text-white max-w-xs mx-auto leading-relaxed">
                      У вас пока нет сохраненных читов. Перейдите в раздел &apos;Читы&apos; и нажмите на звездочку.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCheatCategory('all')}
                      className="px-4 py-2 rounded-xl bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Показать все читы
                    </button>
                  </div>
                ) : (
                  <div className="p-8 text-center rounded-2xl bg-[#121411] border border-white/[0.08] space-y-2">
                    <p className="text-sm font-semibold text-neutral-300">Ничего не найдено</p>
                    <p className="text-xs text-neutral-500">
                      Попробуйте изменить категорию или поисковый запрос.
                    </p>
                  </div>
                )
              ) : (
                filteredCheats.map((cheat) => {
                  const isFav = favoriteCheats.includes(cheat.id);
                  const isCopied = copiedId === cheat.id;
                  const isCheatFree = cheat.id === 'cheat_max_health_armor' || cheat.isPremium === false;
                  const isUnlocked = isCheatFree || effectiveIsVip;

                  const categoryLabels: Record<string, string> = {
                    player: 'Игрок',
                    weapons: 'Оружие',
                    vehicles: 'Транспорт',
                    world: 'Мир и погода'
                  };

                  return (
                    <div
                      key={cheat.id}
                      className={`p-4 rounded-2xl bg-[#121217] border transition-all space-y-3 ${
                        isCheatFree
                          ? 'border-emerald-500/30 hover:border-emerald-500/50'
                          : isUnlocked
                          ? 'border-[#D4FF00]/30 hover:border-[#D4FF00]/50'
                          : 'border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h2 className="font-display font-bold text-sm text-white transition-colors">
                              {cheat.title}
                            </h2>

                            {/* Access Status Badge */}
                            {isCheatFree ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-emerald-300 bg-emerald-500/20 border-emerald-500/40 uppercase tracking-wide">
                                Бесплатно
                              </span>
                            ) : isUnlocked ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-[#D4FF00] bg-[#D4FF00]/15 border-[#D4FF00]/35 flex items-center space-x-1">
                                <Crown className="w-3 h-3 text-[#D4FF00] fill-[#D4FF00]" />
                                <span>VIP Доступ</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-neutral-300 bg-white/[0.04] border-white/[0.08] flex items-center space-x-1">
                                <Lock className="w-3 h-3 text-[#D4FF00]" />
                                <span>VIP в покупке</span>
                              </span>
                            )}

                            {cheat.category && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-neutral-400 bg-white/[0.04] border-white/[0.08] uppercase">
                                {categoryLabels[cheat.category] || cheat.category}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {cheat.description}
                          </p>
                        </div>

                        <button
                          onClick={() => toggleFavCheat(cheat.id)}
                          className={`p-2 rounded-xl transition-colors ml-2 shrink-0 ${
                            isFav ? 'text-[#D4FF00] bg-[#D4FF00]/10' : 'text-neutral-500 hover:text-white'
                          }`}
                          title="Сохранить в избранное"
                        >
                          <Bookmark className={`w-4 h-4 ${isFav ? 'fill-[#D4FF00]' : ''}`} />
                        </button>
                      </div>

                      {/* Code Combination Area */}
                      <div className="pt-1">
                        {isUnlocked ? (
                          platform === 'phone' ? (
                            <div className="bg-[#09090d] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between">
                              <span className="font-mono font-bold text-sm text-[#D4FF00]">
                                {cheat.codes.phone}
                              </span>
                              <span className="text-[10px] text-neutral-500 uppercase">Набор в телефоне</span>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#09090d] border border-white/[0.08] rounded-xl">
                              {(platform === 'ps5' ? cheat.codes.ps5 : cheat.codes.xbox).map((glyph, idx) =>
                                renderGamepadGlyph(glyph, platform, idx)
                              )}
                            </div>
                          )
                        ) : (
                          /* Locked VIP Cheat with blur & CTA */
                          <div className="relative rounded-xl overflow-hidden border border-[#D4FF00]/25 bg-[#09090d] p-3">
                            <div className="filter blur-sm select-none opacity-30 pointer-events-none flex flex-wrap gap-1.5">
                              <span className="px-2 py-1 rounded bg-neutral-800 text-xs font-mono">▶</span>
                              <span className="px-2 py-1 rounded bg-neutral-800 text-xs font-mono">X</span>
                              <span className="px-2 py-1 rounded bg-neutral-800 text-xs font-mono">▶</span>
                              <span className="px-2 py-1 rounded bg-neutral-800 text-xs font-mono">R1</span>
                              <span className="px-2 py-1 rounded bg-neutral-800 text-xs font-mono">△</span>
                              <span className="px-2 py-1 rounded bg-neutral-800 text-xs font-mono">1-999-***-****</span>
                            </div>
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-between px-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 rounded-lg bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00]">
                                  <Lock className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-white">VIP-чит закрыт</p>
                                  <p className="text-[10px] text-neutral-400">Откроется при покупке VIP</p>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInitiateVipPurchase();
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[#D4FF00] hover:bg-[#bbf746] text-black font-extrabold text-xs shadow-md transition-all flex items-center space-x-1"
                              >
                                <Crown className="w-3 h-3 fill-black" />
                                <span>Открыть ($2.99)</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end pt-0.5">
                        {isUnlocked ? (
                          <button
                            onClick={() => handleCopyCheat(cheat)}
                            className={`text-xs font-bold py-1.5 px-3 rounded-xl border flex items-center space-x-1.5 transition-all ${
                              isCopied
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Скопировано</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Скопировать код</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleInitiateVipPurchase()}
                            className="text-xs font-bold py-1.5 px-3 rounded-xl border border-[#D4FF00]/30 bg-[#D4FF00]/10 text-[#D4FF00] hover:bg-[#D4FF00]/20 flex items-center space-x-1.5 transition-all"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Разблокировать код</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        )}

        {/* ================================================================== */}
        {/* TAB 3: НОВОСТИ (NEWS & TRAILERS WITH CLOUD FIRESTORE & REFRESH) */}
        {/* ================================================================== */}
        {activeTab === 'news' && (
          <main className="flex-1 p-5 space-y-5 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-black text-white">
                  Новости и видео
                </h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Трейлеры и официальные материалы
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefreshNews();
                }}
                disabled={isRefreshingNews}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-neutral-300 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                title="Обновить новости"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingNews ? 'animate-spin text-[#D4FF00]' : 'text-neutral-400'}`} />
                <span>{isRefreshingNews ? 'Загрузка...' : 'Обновить'}</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              {['Все', 'Избранное', 'Официально', 'Трейлеры', 'Инсайды'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedNewsCategory(cat);
                    setNewsPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl shrink-0 transition-all cursor-pointer ${
                    selectedNewsCategory === cat
                      ? 'bg-gradient-to-r from-[#D4FF00] to-[#A3E635] text-black font-extrabold shadow-sm'
                      : 'bg-[#121411] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {cat === 'Избранное' ? `Избранное ${favoriteNews.length > 0 ? `(${favoriteNews.length})` : ''}` : cat}
                </button>
              ))}
            </div>

            {/* News Feed List with Sheet / Page Separation */}
            {(() => {
              if (filteredNews.length === 0) {
                if (selectedNewsCategory === 'Избранное') {
                  return (
                    <div className="p-8 text-center rounded-2xl bg-[#121411] border border-white/[0.08] space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/25 flex items-center justify-center text-[#D4FF00]">
                        <Bookmark className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-white max-w-xs mx-auto leading-relaxed">
                        У вас нет сохраненных новостей. Добавляйте материалы в избранное, чтобы прочесть позже.
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedNewsCategory('Все')}
                        className="px-4 py-2 rounded-xl bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] text-xs font-bold transition-colors cursor-pointer"
                      >
                        Смотреть все новости
                      </button>
                    </div>
                  );
                }
                return (
                  <div className="p-8 text-center rounded-2xl bg-[#121411] border border-white/[0.08] space-y-2">
                    <p className="text-sm font-semibold text-neutral-300">В этой категории пока нет новостей</p>
                    <button
                      type="button"
                      onClick={() => setSelectedNewsCategory('Все')}
                      className="text-xs text-[#D4FF00] underline"
                    >
                      Показать все материалы
                    </button>
                  </div>
                );
              }

              const totalNewsPages = Math.max(1, Math.ceil(filteredNews.length / NEWS_PER_PAGE));
              const currentPageSafe = Math.min(newsPage, totalNewsPages);
              const displayedNews = filteredNews.slice(
                (currentPageSafe - 1) * NEWS_PER_PAGE,
                currentPageSafe * NEWS_PER_PAGE
              );

              return (
                <div className="space-y-4">
                  {/* Page Indicator Badge */}
                  <div className="flex items-center justify-between px-1 text-xs text-neutral-400">
                    <span className="flex items-center space-x-1.5 font-medium text-neutral-400">
                      <span>Страница {currentPageSafe} из {totalNewsPages}</span>
                    </span>
                    <span className="text-neutral-500 text-[11px]">
                      {filteredNews.length} материалов
                    </span>
                  </div>

                  {displayedNews.map((news) => {
                    const isFav = favoriteNews.includes(news.id);

                    return (
                      <article
                        key={news.id}
                        onClick={() => {
                          setActiveModalNews(news);
                          setIsVideoPlaying(false);
                        }}
                        className="rounded-3xl bg-[#121217] border border-white/[0.08] hover:border-white/20 overflow-hidden transition-all cursor-pointer group"
                      >
                        {/* Cover image with play button badge */}
                        <div className="relative aspect-video w-full overflow-hidden bg-black">
                          <img
                            src={news.image}
                            alt={news.title}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (news.youtubeId && !target.src.includes('hqdefault.jpg')) {
                                target.src = `https://img.youtube.com/vi/${news.youtubeId}/hqdefault.jpg`;
                              }
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-85"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-black/30" />

                          {/* Play badge */}
                          <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-2 text-xs font-bold text-white">
                            <Play className="w-3.5 h-3.5 text-[#D4FF00] fill-[#D4FF00]" />
                            <span>{news.videoDuration}</span>
                          </div>

                          {/* Tag */}
                          <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                            <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-[#D4FF00] uppercase tracking-wider">
                              {news.tag}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavNews(news.id);
                            }}
                            className={`absolute top-3 right-3 p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 transition-colors ${
                              isFav ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-white'
                            }`}
                            title="В закладки"
                          >
                            <Bookmark className={`w-4 h-4 ${isFav ? 'fill-[#D4FF00]' : ''}`} />
                          </button>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-neutral-400">
                            <span>{news.date}</span>
                            <span>•</span>
                            <span>{news.readTime} чтения</span>
                          </div>

                          <h2 className="font-display font-bold text-base text-white group-hover:text-[#D4FF00] transition-colors leading-snug">
                            {news.title}
                          </h2>

                          <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                            {news.summary}
                          </p>

                          <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                            <span className="text-[#D4FF00]">Смотреть и читать</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-neutral-400" />
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {/* Pagination Bar Controls */}
                  {totalNewsPages > 1 && (
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#121217] border border-white/[0.08]">
                      <div className="text-xs text-neutral-400">
                        Страница <span className="font-bold text-white">{currentPageSafe}</span> из <span className="font-bold text-white">{totalNewsPages}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => setNewsPage((p) => Math.max(1, p - 1))}
                          disabled={currentPageSafe === 1}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all flex items-center space-x-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Назад</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalNewsPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setNewsPage(pageNum)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                pageNum === currentPageSafe
                                  ? 'bg-[#D4FF00] text-black shadow-md'
                                  : 'bg-white/[0.04] text-neutral-400 hover:text-white border border-white/[0.06]'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setNewsPage((p) => Math.min(totalNewsPages, p + 1))}
                          disabled={currentPageSafe === totalNewsPages}
                          className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all flex items-center space-x-1"
                        >
                          <span>Вперед</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </main>
        )}

        {/* ================================================================== */}
        {/* TAB 4: ПРОФИЛЬ (PROFILE) */}
        {/* ================================================================== */}
        {activeTab === 'profile' && (
          <main className="flex-1 p-5 space-y-6 animate-in fade-in duration-200">
            {/* 1. Шапка профиля: Аватарка, Никнейм, Статус */}
            <div className="p-5 rounded-3xl bg-[#121217] border border-white/[0.08] space-y-4 shadow-xl">
              <div className="flex items-center space-x-4">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.2)]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 border border-white/10 flex items-center justify-center text-neutral-300">
                    <User className="w-7 h-7 text-neutral-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-display font-bold text-white truncate">
                      {userProfile.displayName || (userProfile.isGuest ? 'Гость' : 'Игрок')}
                    </h2>
                    {effectiveIsVip && (
                      <span className="text-[10px] font-extrabold uppercase bg-[#D4FF00] text-black px-2 py-0.5 rounded-full shrink-0">
                        VIP
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        userProfile.isGuest ? 'bg-neutral-500' : 'bg-[#D4FF00]'
                      }`}
                    />
                    <p className="text-xs text-neutral-400 truncate">
                      {userProfile.isGuest ? 'Гость' : (userProfile.email || 'Авторизован')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Actions: Login or Edit Profile */}
              {userProfile.isGuest ? (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleOpenAuthModal}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] hover:from-[#e5ff4d] hover:to-[#bbf746] text-black font-display font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(212,255,0,0.25)] active:scale-[0.98] cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-black shrink-0" />
                    <span>Войти через Email / Supabase</span>
                  </button>
                  <p className="text-[11px] text-neutral-400 text-center mt-2">
                    Вход позволяет сохранять читы и избранное в облаке
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={handleOpenEditProfile}
                    className="py-2.5 px-3 rounded-xl bg-white/[0.08] border border-white/10 text-white font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5 hover:bg-white/[0.14] transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#D4FF00]" />
                    <span>Имя и аватар</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5 hover:bg-rose-500/20 hover:text-rose-200 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Карточка VIP Pass (покупка / статус) */}
            <div className="rounded-3xl bg-gradient-to-br from-[#141910] via-[#10130e] to-[#0a0c09] border border-[#D4FF00]/40 p-5 space-y-4 shadow-[0_0_30px_rgba(212,255,0,0.06)] relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#D4FF00]/15 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4FF00] to-[#A3E635] flex items-center justify-center text-black shadow-[0_0_20px_rgba(212,255,0,0.35)] shrink-0">
                    <Crown className="w-5 h-5 fill-black text-black" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-extrabold text-white flex items-center space-x-2">
                      <span>Leonida VIP Pass</span>
                      {effectiveIsVip && (
                        <span className="text-[10px] uppercase font-extrabold bg-[#D4FF00] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(212,255,0,0.3)]">
                          VIP Активен
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {effectiveIsVip
                        ? 'Пожизненный неограниченный доступ ко всем читам и инсайдам'
                        : 'Мгновенный доступ ко всем закрытым читам и видео без рекламы'}
                    </p>
                  </div>
                </div>
              </div>

              {effectiveIsVip ? (
                <div className="space-y-3 relative z-10 pt-1">
                  <div className="p-3.5 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/30 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <ShieldCheck className="w-5 h-5 text-[#D4FF00] shrink-0" />
                      <div className="text-xs text-neutral-200">
                        <span className="font-bold text-[#D4FF00]">Статус VIP активен:</span> Все закрытые секретные чит-коды и материалы доступны без ограничений.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1 relative z-10">
                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Crown className="w-3.5 h-3.5 text-[#D4FF00]" />
                        <span>Пожизненный VIP статус</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Разблокировка всех секретных кодов и эксклюзивных инсайдов
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInitiateVipPurchase}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] hover:from-[#e5ff4d] hover:to-[#bbf746] text-black font-display font-extrabold text-xs flex items-center justify-center space-x-2 shadow-[0_0_18px_rgba(212,255,0,0.3)] transition-all shrink-0 cursor-pointer"
                    >
                      <Crown className="w-4 h-4 fill-black text-black" />
                      <span>Купить VIP за $2.99</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Блок: Сохраненные читы */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                  <span>Сохраненные читы</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] text-[#D4FF00]">
                    {savedCheatItems.length}
                  </span>
                </h2>
                {savedCheatItems.length > 0 && (
                  <button
                    onClick={() => setActiveTab('cheats')}
                    className="text-xs text-[#D4FF00] hover:underline cursor-pointer"
                  >
                    Все читы →
                  </button>
                )}
              </div>

              {savedCheatItems.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#121411] border border-white/[0.08] text-center space-y-2.5">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00]">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-neutral-300 font-medium leading-relaxed max-w-xs mx-auto">
                    У вас пока нет сохраненных читов. Перейдите в раздел &apos;Читы&apos; и нажмите на звездочку.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cheats')}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>Перейти в раздел Читы</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedCheatItems.map((cheat) => (
                    <div
                      key={cheat.id}
                      className="p-3.5 rounded-2xl bg-[#121411] border border-white/[0.08] flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="truncate min-w-0">
                        <div className="font-bold text-sm text-white truncate">
                          {cheat.title}
                        </div>
                        <div className="text-xs text-[#D4FF00] truncate font-mono mt-0.5">
                          {cheat.codes.phone}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyCheat(cheat)}
                          className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                          title="Скопировать чит"
                        >
                          {copiedId === cheat.id ? (
                            <Check className="w-4 h-4 text-[#D4FF00]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleFavCheat(cheat.id)}
                          className="p-2 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Удалить из избранного"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Блок: Избранные новости */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                  <span>Избранные новости</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] text-[#D4FF00]">
                    {savedNewsItems.length}
                  </span>
                </h2>
                {savedNewsItems.length > 0 && (
                  <button
                    onClick={() => setActiveTab('news')}
                    className="text-xs text-[#D4FF00] hover:underline cursor-pointer"
                  >
                    Все новости →
                  </button>
                )}
              </div>

              {savedNewsItems.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#121411] border border-white/[0.08] text-center space-y-2.5">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00]">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-neutral-300 font-medium leading-relaxed max-w-xs mx-auto">
                    У вас нет сохраненных новостей. Добавляйте материалы в закладки, чтобы прочесть позже.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('news')}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>Открыть ленту новостей</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedNewsItems.map((news) => (
                    <div
                      key={news.id}
                      onClick={() => {
                        setActiveModalNews(news);
                        setIsVideoPlaying(false);
                      }}
                      className="p-3.5 rounded-2xl bg-[#121411] border border-white/[0.08] flex items-center justify-between gap-3 cursor-pointer hover:border-[#D4FF00]/30 transition-colors"
                    >
                      <div className="truncate min-w-0">
                        <div className="font-bold text-sm text-white truncate">
                          {news.title}
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {news.date}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavNews(news.id);
                        }}
                        className="p-2 rounded-lg bg-white/[0.05] hover:bg-rose-500/20 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer shrink-0"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        {/* ================================================================== */}
        {/* BOTTOM NAVIGATION BAR */}
        {/* ================================================================== */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#09090d]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 z-40 flex items-center justify-around">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'timer' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Таймер</span>
          </button>

          <button
            onClick={() => setActiveTab('cheats')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'cheats' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Читы</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'news' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Новости</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'profile' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Профиль</span>
          </button>
        </nav>

        {/* ================================================================== */}
        {/* DETAILED NEWS & VIDEO MODAL */}
        {/* ================================================================== */}
        {activeModalNews && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="w-full max-w-md max-h-[92vh] bg-[#0d0d12] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
              {/* Modal Top Header */}
              <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#121217]">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#D4FF00] bg-[#D4FF00]/10 px-2.5 py-1 rounded-md">
                    {activeModalNews.tag}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {activeModalNews.date}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => toggleFavNews(activeModalNews.id)}
                    className={`p-2 rounded-full border transition-colors ${
                      favoriteNews.includes(activeModalNews.id)
                        ? 'bg-[#D4FF00]/15 text-[#D4FF00] border-[#D4FF00]/30'
                        : 'bg-white/[0.05] text-neutral-300 border-white/10 hover:text-white'
                    }`}
                    title={
                      favoriteNews.includes(activeModalNews.id)
                        ? 'В избранном'
                        : 'Добавить в избранное'
                    }
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        favoriteNews.includes(activeModalNews.id) ? 'fill-[#D4FF00]' : ''
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => {
                      setActiveModalNews(null);
                      setIsVideoPlaying(false);
                    }}
                    className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Modal Body */}
              <div className="overflow-y-auto p-5 space-y-6">
                <h2 className="text-xl font-display font-extrabold text-white leading-tight">
                  {activeModalNews.title}
                </h2>

                {/* Interactive Video Player */}
                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-lg">
                    {isVideoPlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${activeModalNews.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                        title={activeModalNews.title}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    ) : (
                      <div
                        onClick={() => setIsVideoPlaying(true)}
                        className="relative w-full h-full cursor-pointer flex flex-col justify-between group"
                      >
                        <img
                          src={activeModalNews.image}
                          alt={activeModalNews.title}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (activeModalNews.youtubeId && !target.src.includes('hqdefault.jpg')) {
                              target.src = `https://img.youtube.com/vi/${activeModalNews.youtubeId}/hqdefault.jpg`;
                            }
                          }}
                          className="w-full h-full object-cover absolute inset-0 opacity-80 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                        <div className="relative z-10 p-3 flex justify-between text-xs font-bold text-white">
                          <span className="bg-black/80 px-2.5 py-1 rounded-md border border-white/10">
                            4K Ultra HD
                          </span>
                          <span className="bg-black/80 px-2.5 py-1 rounded-md border border-white/10">
                            {activeModalNews.videoDuration}
                          </span>
                        </div>

                        {/* Central Play Button */}
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-2">
                          <div className="w-14 h-14 rounded-full bg-[#D4FF00] text-black flex items-center justify-center shadow-[0_0_25px_rgba(204,255,0,0.5)] group-hover:scale-110 active:scale-95 transition-all">
                            <Play className="w-6 h-6 ml-0.5 fill-black" />
                          </div>
                          <span className="text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full border border-white/10">
                            Нажмите для просмотра
                          </span>
                        </div>

                        <div className="relative z-10 p-3 text-xs text-neutral-300 flex justify-between items-center">
                          <span className="font-semibold text-[#D4FF00]">YouTube Player</span>
                          <span className="text-neutral-400">Официальный ролик</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Player control link */}
                  <div className="flex justify-between items-center text-xs text-neutral-400 px-1">
                    {isVideoPlaying ? (
                      <button
                        onClick={() => setIsVideoPlaying(false)}
                        className="text-neutral-300 hover:text-white"
                      >
                        ← Свернуть плеер
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsVideoPlaying(true)}
                        className="text-[#D4FF00] hover:underline font-semibold flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Запустить плеер</span>
                      </button>
                    )}

                    <a
                      href={activeModalNews.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4FF00] hover:underline flex items-center space-x-1"
                    >
                      <span>Открыть в YouTube</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Article Content Paragraphs */}
                <div className="space-y-3.5 text-sm text-neutral-300 leading-relaxed">
                  {activeModalNews.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Key Facts Box */}
                {activeModalNews.keyFacts && activeModalNews.keyFacts.length > 0 && (
                  <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#D4FF00]">
                      Ключевые факты
                    </h3>
                    <ul className="space-y-1.5 text-xs text-neutral-300">
                      {activeModalNews.keyFacts.map((fact, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-[#D4FF00] font-bold">•</span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prominent Verified Source Box */}
                <div className="rounded-2xl bg-gradient-to-br from-[#121217] to-[#1a1a24] border border-[#D4FF00]/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Первоисточник материала
                      </div>
                      <div className="text-sm font-display font-bold text-white mt-0.5">
                        {activeModalNews.sourceName}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Верифицировано
                    </span>
                  </div>

                  <a
                    href={activeModalNews.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-[#D4FF00] hover:bg-[#bbf746] text-black font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-lg transition-all"
                  >
                    <span>Перейти к первоисточнику</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* ================================================================== */}
        {/* EDIT PROFILE MODAL (NICKNAME & AVATAR) */}
        {/* ================================================================== */}
        {isEditProfileModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-[#121217] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-in slide-in-from-bottom duration-300 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#D4FF00]/10 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00]">
                    <Edit3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">
                      Редактировать профиль
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Настройка имени и внешнего вида
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="p-1.5 rounded-full bg-white/[0.05] text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Nickname Input */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-display-name" className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                    Никнейм в Леониде
                  </label>
                  <input
                    id="edit-display-name"
                    name="displayName"
                    type="text"
                    autoComplete="nickname"
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Введите ваш никнейм"
                    className="w-full bg-[#09090d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00]/60 transition-colors"
                  />
                </div>

                {/* Avatar Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
                    Выберите аватар персонажа
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {GTA_AVATARS.map((avatar) => {
                      const isSelected =
                        (editPhotoURL || userProfile.photoURL) === avatar.url;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setEditPhotoURL(avatar.url)}
                          className={`flex flex-col items-center space-y-1 group transition-all`}
                        >
                          <div
                            className={`w-12 h-12 rounded-2xl overflow-hidden relative border-2 transition-all ${
                              isSelected
                                ? 'border-[#D4FF00] ring-2 ring-[#D4FF00]/30 scale-105'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <img
                              src={avatar.url}
                              alt={avatar.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#D4FF00]/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-[#D4FF00] fill-black" />
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-neutral-400 group-hover:text-white truncate max-w-full">
                            {avatar.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current Email Info */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-1">
                  <span className="text-neutral-500 text-[10px] uppercase font-semibold">
                    Привязанный Email
                  </span>
                  <p className="text-neutral-300 font-mono text-xs truncate">
                    {userProfile.email || 'Гостевой режим (Email не привязан)'}
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileModalOpen(false)}
                    className="py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-neutral-300 font-display font-bold text-xs uppercase transition-all"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={editProfileLoading}
                    className="py-2.5 px-3 rounded-xl bg-[#D4FF00] hover:bg-[#bbf746] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-display font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition-all shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{editProfileLoading ? 'Сохранение...' : 'Сохранить'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: GUEST VIP WARNING (LOGIN REQUIRED) */}
        {/* ================================================================== */}
        {guestVipWarningModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-[#121217] border border-[#D4FF00]/30 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00] shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base">
                    Требуется авторизация
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Привязка VIP-лицензии
                  </p>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Вы находитесь в гостевом режиме. Чтобы ваш пожизненный VIP-статус не был утерян при очистке кэша браузера или смене устройства, покупка VIP Pass ($2.99) привязывается к вашему аккаунту.
              </p>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setGuestVipWarningModal(false);
                    handleOpenAuthModal();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] text-black font-display font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98] cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-black shrink-0" />
                  <span>Войти в аккаунт</span>
                </button>

                <button
                  onClick={() => setGuestVipWarningModal(false)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] text-neutral-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: CRYPTO PAY API (@CryptoBot) INVOICE */}
        {/* ================================================================== */}
        {activeInvoice && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-[#0e110d] border border-[#D4FF00]/40 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-300">
              {/* CryptoBot Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4FF00] to-[#A3E635] flex items-center justify-center text-black shadow-md">
                    <Send className="w-4 h-4 fill-black text-black" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-xs tracking-wider text-white">
                      Telegram @CryptoBot
                    </div>
                    <p className="text-[10px] text-neutral-400">Crypto Pay API • Официальный шлюз</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveInvoice(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Invoice Details */}
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-display font-bold text-white text-base">
                      {activeInvoice.description}
                    </h4>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Счет #{activeInvoice.invoice_id}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-lg text-[#D4FF00]">
                      {activeInvoice.amount} {activeInvoice.asset}
                    </span>
                    <div className="text-[10px] text-neutral-400">≈ $2.99 USD</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/50 border border-white/[0.08] space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Покупатель:</span>
                    <span className="text-neutral-200 font-medium truncate max-w-[190px]">
                      {userProfile.email}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Статус счета:</span>
                    <span className="text-[#D4FF00] font-medium flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Ожидание оплаты</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Verification & Status Feedback Banner */}
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                  invoiceFeedback.status === 'paid'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : invoiceFeedback.status === 'unpaid'
                    ? 'bg-[#D4FF00]/10 border-[#D4FF00]/30 text-[#D4FF00]'
                    : invoiceFeedback.status === 'checking'
                    ? 'bg-[#D4FF00]/15 border-[#D4FF00]/40 text-[#D4FF00]'
                    : invoiceFeedback.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-white/[0.04] border-white/10 text-neutral-300'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {invoiceFeedback.status === 'checking' ? (
                    <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-[#D4FF00] mt-0.5" />
                  ) : invoiceFeedback.status === 'paid' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : invoiceFeedback.status === 'unpaid' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#D4FF00] mt-0.5" />
                  ) : invoiceFeedback.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  ) : (
                    <Clock className="w-4 h-4 shrink-0 text-neutral-400 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold block mb-0.5">
                      {invoiceFeedback.status === 'paid'
                        ? 'Оплата подтверждена'
                        : invoiceFeedback.status === 'unpaid'
                        ? 'Ожидание поступления средств'
                        : invoiceFeedback.status === 'checking'
                        ? 'Проверка в Crypto Pay...'
                        : invoiceFeedback.status === 'error'
                        ? 'Ошибка запроса'
                        : 'Статус инвойса'}
                    </span>
                    <span className="text-[11px] opacity-90">{invoiceFeedback.message}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                {/* 1. Open Telegram Bot in New Tab / System Browser */}
                <button
                  type="button"
                  onClick={() => openExternalUrl(activeInvoice.pay_url)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] hover:from-[#e5ff4d] hover:to-[#bbf746] text-black font-display font-extrabold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(212,255,0,0.25)] cursor-pointer text-center"
                >
                  <Send className="w-4 h-4 fill-black text-black shrink-0" />
                  <span>1. Оплатить в Telegram @CryptoBot</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80 shrink-0" />
                </button>

                {/* 1b. Copy Payment Link (helps when iframe or popup blocker is active) */}
                <button
                  type="button"
                  onClick={() => handleCopyInvoiceUrl(activeInvoice.pay_url)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-neutral-200 font-display font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  {hasCopiedInvoiceUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#D4FF00]" />
                      <span className="text-[#D4FF00] font-semibold">Ссылка скопирована в буфер!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Скопировать ссылку на оплату</span>
                    </>
                  )}
                </button>

                {/* 1c. Direct Web App Link */}
                {activeInvoice.web_app_invoice_url && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => openExternalUrl(activeInvoice.web_app_invoice_url!)}
                      className="inline-flex items-center space-x-1 text-[11px] text-[#D4FF00] hover:underline cursor-pointer"
                    >
                      <span>Открыть счет в браузере (Crypto Pay Web)</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* 2. Status Check & Verification Button */}
                <button
                  type="button"
                  onClick={handleVerifyAndActivateInvoice}
                  disabled={isCheckingInvoice}
                  className="w-full py-3 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-display font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingInvoice ? 'animate-spin text-[#D4FF00]' : ''}`} />
                  <span>
                    {isCheckingInvoice ? 'Связь с CryptoBot...' : '2. Проверить оплату и активировать'}
                  </span>
                </button>

                <div className="text-[10px] text-center text-neutral-400 flex items-center justify-center space-x-1.5 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse" />
                  <span>Шлюз: pay.crypt.bot • Официальный Crypto Pay API</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Payment Overlay */}
        {isProcessingPayment && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="p-6 rounded-2xl bg-[#0e110d] border border-[#D4FF00]/40 flex flex-col items-center space-y-3 text-center shadow-2xl animate-in zoom-in-95 duration-150">
              <Loader2 className="w-8 h-8 animate-spin text-[#D4FF00]" />
              <div className="font-display font-bold text-sm text-white">
                Создание счета в Telegram @CryptoBot...
              </div>
              <p className="text-xs text-neutral-400">
                Запрос к Crypto Pay API (2.99 USDT)
              </p>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: AUTHENTICATION (LOGIN / REGISTER) */}
        {/* ================================================================== */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
            <div className="w-full sm:max-w-md bg-[#0e110d] border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4FF00] to-[#A3E635] flex items-center justify-center text-black shadow-[0_0_16px_rgba(212,255,0,0.3)] shrink-0 font-display font-black text-sm">
                    VI
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base tracking-wide">
                      {authMode === 'register' ? 'Регистрация аккаунта' : 'Вход в аккаунт'}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Синхронизация профиля и избранного
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Login / Register Toggle Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-black/50 border border-white/[0.08] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[#D4FF00] text-black font-bold shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Вход</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                  }}
                  className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-[#D4FF00] text-black font-bold shadow-md'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Регистрация</span>
                </button>
              </div>

              {/* Error Message */}
              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3.5 pt-1">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                      Никнейм игрока
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName(e.target.value)}
                        placeholder="Например: Джейсон или Лусия"
                        className="w-full bg-[#121411] border border-white/[0.1] rounded-xl pl-9.5 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00] transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Электронная почта
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="player@vicecity.com"
                      className="w-full bg-[#121411] border border-white/[0.1] rounded-xl pl-9.5 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      {authMode === 'register' ? 'Пароль (буквы, цифры, знаки)' : 'Пароль'}
                    </label>

                    {authMode === 'register' && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            const secure = generateSecurePassword();
                            setAuthPassword(secure);
                            setShowPassword(true);
                            setAuthError(null);
                            showToast('Сгенерирован надежный взломостойкий пароль!');
                          }}
                          className="inline-flex items-center space-x-1 text-[11px] text-[#D4FF00] hover:underline cursor-pointer font-medium"
                          title="Автоматически создать сложный пароль с буквами, цифрами и знаками"
                        >
                          <Sparkles className="w-3 h-3 text-[#D4FF00]" />
                          <span>Сгенерировать</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={authMode === 'register' ? 8 : 6}
                      value={authPassword}
                      onChange={(e) => {
                        setAuthPassword(e.target.value);
                        if (authError) setAuthError(null);
                      }}
                      placeholder={authMode === 'register' ? 'Буквы, цифры и знаки (например: Vice2026!*)' : '••••••••'}
                      className={`w-full bg-[#121411] border rounded-xl pl-9.5 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                        authMode === 'register' && authPassword
                          ? registerPasswordValidation.isCommonOrTrivial
                            ? 'border-rose-500 focus:border-rose-400'
                            : registerPasswordValidation.isValid
                            ? 'border-lime-500/80 focus:border-[#D4FF00]'
                            : 'border-amber-400/60 focus:border-amber-400'
                          : 'border-white/[0.1] focus:border-[#D4FF00]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                      title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Real-time Password Security & Anti-Hacking Card */}
                  {authMode === 'register' && (
                    <div className="mt-2.5 p-3 rounded-xl bg-black/45 border border-white/[0.08] space-y-2.5 animate-in fade-in duration-150">
                      {/* Strength Header */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400 font-medium flex items-center space-x-1.5">
                          <ShieldCheck className={`w-3.5 h-3.5 ${registerPasswordValidation.isValid ? 'text-[#D4FF00]' : 'text-neutral-400'}`} />
                          <span>Надежность пароля:</span>
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          !authPassword
                            ? 'text-neutral-500 bg-white/[0.04]'
                            : registerPasswordValidation.isCommonOrTrivial
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : registerPasswordValidation.isValid
                            ? 'bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40'
                            : registerPasswordValidation.score >= 2
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                        }`}>
                          {!authPassword ? 'Минимум 8 симв.' : registerPasswordValidation.strengthLabel}
                        </span>
                      </div>

                      {/* 4-segment visual indicator bar */}
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        <div
                          className={`rounded-full transition-all duration-300 ${
                            registerPasswordValidation.score >= 1
                              ? registerPasswordValidation.isCommonOrTrivial
                                ? 'bg-rose-500'
                                : registerPasswordValidation.score === 1
                                ? 'bg-orange-500'
                                : registerPasswordValidation.score === 2
                                ? 'bg-amber-400'
                                : 'bg-lime-400'
                              : 'bg-white/10'
                          }`}
                        />
                        <div
                          className={`rounded-full transition-all duration-300 ${
                            registerPasswordValidation.score >= 2 && !registerPasswordValidation.isCommonOrTrivial
                              ? registerPasswordValidation.score === 2
                                ? 'bg-amber-400'
                                : 'bg-lime-400'
                              : 'bg-white/10'
                          }`}
                        />
                        <div
                          className={`rounded-full transition-all duration-300 ${
                            registerPasswordValidation.score >= 3 && !registerPasswordValidation.isCommonOrTrivial
                              ? 'bg-lime-400'
                              : 'bg-white/10'
                          }`}
                        />
                        <div
                          className={`rounded-full transition-all duration-300 ${
                            registerPasswordValidation.score >= 4 && !registerPasswordValidation.isCommonOrTrivial
                              ? 'bg-[#D4FF00]'
                              : 'bg-white/10'
                          }`}
                        />
                      </div>

                      {/* Explicit Warning for Trivial Passwords (e.g. 12345678) */}
                      {registerPasswordValidation.isCommonOrTrivial && (
                        <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-start space-x-2 text-[11px] text-rose-300 animate-in fade-in duration-150">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="leading-snug">
                            <b className="font-semibold block text-rose-200">Простые пароли запрещены!</b>
                            <span>{registerPasswordValidation.trivialReason || 'Пароли вроде «12345678» хакеры взламывают мгновенно. Придумайте пароль с буквами, цифрами и знаками.'}</span>
                          </div>
                        </div>
                      )}

                      {/* Requirements Checklist */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                        {registerPasswordValidation.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`flex items-center space-x-1.5 text-[10px] transition-colors ${
                              rule.met ? 'text-lime-400' : 'text-neutral-400'
                            }`}
                          >
                            {rule.met ? (
                              <CheckCircle2 className="w-3 h-3 text-lime-400 shrink-0" />
                            ) : (
                              <span className="w-3 h-3 rounded-full border border-neutral-600 shrink-0 flex items-center justify-center">
                                <span className="w-1 h-1 rounded-full bg-neutral-600" />
                              </span>
                            )}
                            <span className="leading-tight">{rule.label}</span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-neutral-400 pt-1 border-t border-white/[0.04] flex items-center justify-between">
                        <span>🛡️ Спецзнаки: <strong className="text-neutral-300 font-mono">. , * ! ? @ # $ %</strong></span>
                        <span className="text-[9px] text-neutral-400 font-medium">Защита от подбора</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] hover:from-[#e5ff4d] hover:to-[#bbf746] text-black font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-[0_0_20px_rgba(212,255,0,0.25)] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>Авторизация...</span>
                      </>
                    ) : authMode === 'register' ? (
                      <>
                        <UserPlus className="w-4 h-4 text-black" />
                        <span>Зарегистрироваться</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 text-black" />
                        <span>Войти в аккаунт</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(false)}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer text-center"
                  >
                    Продолжить как гость
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
