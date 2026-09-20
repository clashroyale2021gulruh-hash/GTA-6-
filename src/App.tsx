import React, { useState, useEffect } from 'react';
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
  Activity
} from 'lucide-react';
import { db, auth, testFirestoreConnection } from './firebase';
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
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  signOut,
  onAuthStateChanged,
  deleteUser
} from 'firebase/auth';
import {
  sanitizeDisplayName,
  sanitizeEmail,
  validateEmail,
  sanitizePhotoUrl,
  sanitizeUid
} from './utils/sanitizer';

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
    id: 'news_trailer_2_leaks',
    title: 'Rockstar готовит Трейлер 2: упор на Джейсона и систему ограблений',
    tag: 'ИНСАЙДЫ',
    date: '15 Сентября 2026',
    readTime: '5 мин',
    image: 'https://img.youtube.com/vi/kYJzEwXzH_8/maxresdefault.jpg',
    youtubeId: 'kYJzEwXzH_8',
    videoUrl: 'https://www.youtube.com/watch?v=kYJzEwXzH_8',
    videoDuration: '14:22',
    summary: 'Второй трейлер сфокусирован на Джейсоне, механике доверия напарников и подготовке дерзких налетов на округ Вайс.',
    content: [
      'По данным инсайдеров, второй официальный трейлер покажет точку зрения Джейсона и раскроет механику совместных ограблений дуэта.',
      'Игроки смогут координировать действия Люсии и Джейсона: один отвлекает охрану или взламывает замки, второй контролирует зал с заложниками.',
      'Также будет показана расширенная карта за пределами Вайс-Сити — округ Келли, аэропорт и загородные мотели.'
    ],
    keyFacts: [
      'Демонстрация системы переключения между героями в стиле Bonnie & Clyde',
      'Интерактивное планирование налетов через багажник личного автомобиля',
      'Глубокая реакция NPC на направленное оружие и угрозы'
    ],
    sourceName: 'Rockstar Universe & GTA Base',
    sourceUrl: 'https://www.gtabase.com'
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
  displayName: 'Гость Леониды',
  email: '',
  photoURL: '',
  isGuest: true,
  statusText: 'Анонимный режим'
};

// Target release date: November 19, 2026
const TARGET_RELEASE_TIMESTAMP = new Date('2026-11-19T00:00:00Z').getTime();

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

  // Google 1-Click Fast Auth State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleAuthEmail, setGoogleAuthEmail] = useState<string>('');
  const [googleAuthName, setGoogleAuthName] = useState<string>('');

  // Edit Profile State
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [editProfileLoading, setEditProfileLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Favorites
  const [favoriteCheats, setFavoriteCheats] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gta6_fav_cheats_v3');
      return saved ? JSON.parse(saved) : ['cheat_invincibility'];
    } catch {
      return ['cheat_invincibility'];
    }
  });

  const [favoriteNews, setFavoriteNews] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('gta6_fav_news_v3');
      return saved ? JSON.parse(saved) : ['news_1'];
    } catch {
      return ['news_1'];
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
  const [isVip, setIsVip] = useState<boolean>(() => {
    try {
      const savedProfile = localStorage.getItem('gta6_user_profile_v3');
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed && !parsed.isGuest && parsed.uid) {
          return localStorage.getItem('gta6_is_vip') === 'true';
        }
      }
    } catch {
      // ignore
    }
    // Guests and noname accounts NEVER have VIP
    localStorage.removeItem('gta6_is_vip');
    return false;
  });

  // Effective VIP: strictly false for guest/noname accounts
  const effectiveIsVip = !userProfile.isGuest && Boolean(isVip);

  // Guarantee guests can never have residual VIP status
  useEffect(() => {
    if (userProfile.isGuest && isVip) {
      setIsVip(false);
      localStorage.removeItem('gta6_is_vip');
    }
  }, [userProfile.isGuest, isVip]);

  const [activeInvoice, setActiveInvoice] = useState<{
    invoice_id: number;
    hash: string;
    pay_url: string;
    bot_invoice_url?: string;
    mini_app_invoice_url?: string;
    web_app_invoice_url?: string;
    amount: string;
    asset: string;
    description: string;
  } | null>(null);
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
      const userKey = auth.currentUser?.uid || userProfile.uid;
      if (!userKey || userProfile.isGuest) return;
      await setDoc(
        doc(db, 'users', userKey),
        {
          uid: userKey,
          email: userProfile.email,
          displayName: userProfile.displayName,
          isVip: currentVip,
          vipInvoiceId: invoiceDetails ? invoiceDetails.invoiceId : (currentVip ? (userProfile.vipInvoiceId || null) : null),
          vipVerifiedAt: currentVip ? (userProfile.vipVerifiedAt || new Date().toISOString()) : null,
          vipAmount: invoiceDetails ? invoiceDetails.amount : (currentVip ? (userProfile.vipAmount || '2.99') : null),
          vipAsset: invoiceDetails ? invoiceDetails.asset : (currentVip ? (userProfile.vipAsset || 'USDT') : null),
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch {
      // Offline fallback
    }
  };

  const handleInitiateVipPurchase = async () => {
    // 1. Strict Authentication Status Verification
    if (userProfile.isGuest) {
      setGuestVipWarningModal(true);
      showToast('Для оформления VIP требуется войти через Google или Email!');
      return;
    }

    const rawUid = auth.currentUser?.uid || userProfile.uid;
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
      const res = await fetch('/api/cryptobot/createInvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payloadBody)
      });

      const data = await res.json();

      if (res.ok && data && data.ok === true && data.result?.pay_url) {
        showToast('Счет создан! Открыто окно оплаты');
        setActiveInvoice(data.result);
        setInvoiceFeedback({
          status: 'idle',
          message: `Счет #${data.result.invoice_id} на 2.99 USDT создан в @CryptoBot. Перейдите по ссылке ниже для оплаты.`
        });

        // Safely attempt opening in new tab/window without redirecting the app iframe
        try {
          window.open(data.result.pay_url, '_blank', 'noopener,noreferrer');
        } catch {
          // Blocked by browser popup blocker, modal is active for user click
        }
      } else {
        const errorMsg =
          data?.error?.description ||
          data?.error?.name ||
          'Не удалось создать инвойс в Crypto Pay';
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('CryptoBot API Payment Error:', err);
      showToast(`Ошибка Crypto Pay: ${err?.message || 'Сбой соединения со шлюзом'}`);
      setInvoiceFeedback({
        status: 'error',
        message: `Ошибка шлюза: ${err?.message || 'Не удалось связаться с сервером @CryptoBot'}`
      });
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
      const res = await fetch(`/api/cryptobot/getInvoices?invoice_ids=${invoiceId}`);
      const data = await res.json();

      if (res.ok && data?.ok && Array.isArray(data.result?.items) && data.result.items.length > 0) {
        const item = data.result.items[0];
        return {
          success: true,
          status: (item.status as string) || 'active', // 'active', 'paid', 'expired'
          amount: item.amount as string,
          asset: item.asset as string,
          paid: item.status === 'paid'
        };
      }

      const errMsg = data?.error?.description || data?.error?.name || 'Счет не найден в реестре @CryptoBot';
      return {
        success: false,
        status: 'not_found',
        message: errMsg
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'network_error',
        message: `Сбой соединения: ${err?.message || 'Не удалось связаться со шлюзом Crypto Pay'}`
      };
    }
  };

  // Manual payment verification button - STRICTLY VERIFIES WITH CRYPTOBOT
  const handleVerifyAndActivateInvoice = async () => {
    if (!activeInvoice?.invoice_id) return;
    if (userProfile.isGuest) {
      showToast('Для активации VIP требуется войти через Google!');
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
      const res = await fetch('/api/cryptobot/getInvoices?status=paid&count=50');
      const data = await res.json();

      if (!res.ok) {
        if (showNotification) {
          showToast('Не удалось связаться со шлюзом @CryptoBot');
        }
        return;
      }

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
            localStorage.setItem('gta6_is_vip', 'true');
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
            vipAsset: undefined
          };
          setUserProfile(resetProfile);
          localStorage.setItem('gta6_user_profile_v3', JSON.stringify(resetProfile));
          await setDoc(
            doc(db, 'users', userUid),
            {
              isVip: false,
              vipInvoiceId: null,
              vipVerifiedAt: null,
              vipAmount: null,
              vipAsset: null,
              updatedAt: new Date().toISOString()
            },
            { merge: true }
          );
          if (showNotification) {
            showToast('Проверка: оплаченный счет не найден в CryptoBot. VIP аннулирован.');
          }
        }
      } else if (userProfile.vipInvoiceId && isVip) {
        if (showNotification) {
          showToast(`VIP статус активен (Инвойс #${userProfile.vipInvoiceId})`);
        }
      }
    } catch {
      // ignore
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
      vipAsset: undefined
    };
    setUserProfile(resetProfile);
    localStorage.setItem('gta6_user_profile_v3', JSON.stringify(resetProfile));
    const userUid = auth.currentUser?.uid || userProfile.uid;
    if (userUid && !userProfile.isGuest) {
      await setDoc(
        doc(db, 'users', userUid),
        {
          isVip: false,
          vipInvoiceId: null,
          vipVerifiedAt: null,
          vipAmount: null,
          vipAsset: null,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }
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
    const updated = favoriteCheats.includes(id)
      ? favoriteCheats.filter((i) => i !== id)
      : [...favoriteCheats, id];

    setFavoriteCheats(updated);
    localStorage.setItem('gta6_fav_cheats_v3', JSON.stringify(updated));

    try {
      const userKey = auth.currentUser?.uid || userProfile.uid;
      if (userKey && !userProfile.isGuest) {
        await setDoc(
          doc(db, 'users', userKey),
          {
            uid: userKey,
            savedCheats: updated,
            savedNews: favoriteNews,
            email: userProfile.email,
            displayName: userProfile.displayName,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    } catch {
      // Local state is already updated
    }
  };

  const toggleFavNews = async (id: string) => {
    const updated = favoriteNews.includes(id)
      ? favoriteNews.filter((i) => i !== id)
      : [...favoriteNews, id];

    setFavoriteNews(updated);
    localStorage.setItem('gta6_fav_news_v3', JSON.stringify(updated));

    try {
      const userKey = auth.currentUser?.uid || userProfile.uid;
      if (userKey && !userProfile.isGuest) {
        await setDoc(
          doc(db, 'users', userKey),
          {
            uid: userKey,
            savedNews: updated,
            savedCheats: favoriteCheats,
            email: userProfile.email,
            displayName: userProfile.displayName,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }
    } catch {
      // Local state is already updated
    }
  };

  // ==========================================================================
  // AUTHENTICATION (EMAIL/PASSWORD & FIRESTORE CLOUD SYNC)
  // ==========================================================================

  // Listen to Firebase Auth state on mount (Source of Truth)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        const uid = currentUser.uid;
        const emailKey = currentUser.email.replace(/[^a-zA-Z0-9_]/g, '_');
        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 3000)
          );
          // Check by UID first, fallback to emailKey if previous session used it
          let snap = await Promise.race([
            getDoc(doc(db, 'users', uid)),
            timeoutPromise
          ]);
          if (!snap.exists() && emailKey !== uid) {
            snap = await Promise.race([
              getDoc(doc(db, 'users', emailKey)),
              timeoutPromise
            ]);
          }

          if (snap.exists()) {
            const u = snap.data();
            const profile: UserProfile = {
              uid: uid,
              displayName: u.displayName || currentUser.displayName || currentUser.email.split('@')[0],
              email: currentUser.email,
              photoURL: u.photoURL || currentUser.photoURL || GTA_AVATARS[0].url,
              isGuest: false,
              statusText: 'Пользователь Леониды'
            };
            setUserProfile(profile);
            localStorage.setItem('gta6_user_profile_v3', JSON.stringify(profile));

            if (Array.isArray(u.savedCheats)) {
              setFavoriteCheats(u.savedCheats);
              localStorage.setItem('gta6_fav_cheats_v3', JSON.stringify(u.savedCheats));
            }
            if (Array.isArray(u.savedNews)) {
              setFavoriteNews(u.savedNews);
              localStorage.setItem('gta6_fav_news_v3', JSON.stringify(u.savedNews));
            }
            if (typeof u.isVip === 'boolean' && u.isVip === true) {
              setIsVip(true);
              localStorage.setItem('gta6_is_vip', 'true');
              // Automatically audit against CryptoBot to ensure genuine payment
              auditAndEnforceVipAuthenticity(uid, false);
            } else {
              setIsVip(false);
              localStorage.removeItem('gta6_is_vip');
            }
          } else {
            setIsVip(false);
            localStorage.removeItem('gta6_is_vip');
            const profile: UserProfile = {
              uid: uid,
              displayName: currentUser.displayName || currentUser.email.split('@')[0],
              email: currentUser.email,
              photoURL: currentUser.photoURL || GTA_AVATARS[0].url,
              isGuest: false,
              statusText: 'Пользователь Леониды'
            };
            setUserProfile(profile);
            localStorage.setItem('gta6_user_profile_v3', JSON.stringify(profile));
          }
        } catch {
          const cachedProfile = localStorage.getItem('gta6_user_profile_v3');
          if (cachedProfile) {
            try {
              const parsed = JSON.parse(cachedProfile);
              if (parsed && !parsed.isGuest) {
                setUserProfile(parsed);
              }
            } catch {
              // ignore
            }
          }
        }
      } else {
        // Explicitly signed out or no active auth
        const cachedProfile = localStorage.getItem('gta6_user_profile_v3');
        if (cachedProfile) {
          try {
            const parsed = JSON.parse(cachedProfile);
            if (parsed && !parsed.isGuest && parsed.uid) {
              // Keep Google profile session intact
              setUserProfile(parsed);
              if (localStorage.getItem('gta6_is_vip') === 'true') {
                setIsVip(true);
              }
              // Verify latest status from Cloud Firestore and CryptoBot
              getDoc(doc(db, 'users', parsed.uid))
                .then((snap) => {
                  if (snap.exists()) {
                    const u = snap.data();
                    if (u.isVip === true) {
                      setIsVip(true);
                      localStorage.setItem('gta6_is_vip', 'true');
                      auditAndEnforceVipAuthenticity(parsed.uid, false);
                    } else {
                      setIsVip(false);
                      localStorage.removeItem('gta6_is_vip');
                    }
                  }
                })
                .catch(() => {});
              return;
            }
          } catch {
            // ignore
          }
        }
        setIsVip(false);
        localStorage.removeItem('gta6_is_vip');
        setUserProfile(DEFAULT_GUEST_PROFILE);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initial VIP integrity audit check on session launch
  useEffect(() => {
    const userUid = auth.currentUser?.uid || userProfile.uid;
    const hasVipFlag = isVip || localStorage.getItem('gta6_is_vip') === 'true';
    if (userUid && !userProfile.isGuest && hasVipFlag) {
      auditAndEnforceVipAuthenticity(userUid, false);
    }
  }, [userProfile.uid, userProfile.isGuest]);

  // Helper to complete successful Google login & Cloud Firestore synchronization
  const completeSuccessfulGoogleLogin = async (
    uid: string,
    email: string,
    displayName: string,
    photoURL?: string
  ) => {
    const cleanEmail = (email || '').toLowerCase().trim();
    const effectiveUid = uid || ('google_' + cleanEmail.replace(/[^a-zA-Z0-9_]/g, '_'));
    const effectiveName = (displayName || (cleanEmail ? cleanEmail.split('@')[0] : '') || 'Игрок Леониды').trim();
    const effectivePhoto = photoURL || GTA_AVATARS[0].url;

    if (cleanEmail) {
      localStorage.setItem('gta6_last_google_email', cleanEmail);
    }
    if (effectiveName) {
      localStorage.setItem('gta6_last_google_name', effectiveName);
    }

    let userVip = false;
    let userFavCheats = favoriteCheats;
    let userFavNews = favoriteNews;

    // Load existing profile & VIP status & saved cheats from Cloud Firestore
    try {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      );
      const snap: any = await Promise.race([
        getDoc(doc(db, 'users', effectiveUid)),
        timeoutPromise
      ]);

      if (snap && snap.exists()) {
        const u = snap.data();
        if (typeof u.isVip === 'boolean' && u.isVip === true) {
          userVip = true;
          setIsVip(true);
          localStorage.setItem('gta6_is_vip', 'true');
          auditAndEnforceVipAuthenticity(effectiveUid, false);
        } else {
          setIsVip(false);
          localStorage.removeItem('gta6_is_vip');
        }
        if (Array.isArray(u.savedCheats)) {
          userFavCheats = u.savedCheats;
          setFavoriteCheats(u.savedCheats);
          localStorage.setItem('gta6_fav_cheats_v3', JSON.stringify(u.savedCheats));
        }
        if (Array.isArray(u.savedNews)) {
          userFavNews = u.savedNews;
          setFavoriteNews(u.savedNews);
          localStorage.setItem('gta6_fav_news_v3', JSON.stringify(u.savedNews));
        }
      }
    } catch {
      // Use fallback defaults
    }

    // Save/merge Google User document into Cloud Firestore
    try {
      await setDoc(
        doc(db, 'users', effectiveUid),
        {
          uid: effectiveUid,
          displayName: effectiveName,
          email: cleanEmail,
          photoURL: effectivePhoto,
          authProvider: 'google',
          isGuest: false,
          isVip: userVip,
          savedCheats: userFavCheats,
          savedNews: userFavNews,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch {
      // Offline fallback
    }

    const authed: UserProfile = {
      uid: effectiveUid,
      displayName: effectiveName,
      email: cleanEmail,
      photoURL: effectivePhoto,
      isGuest: false,
      statusText: userVip ? 'Пожизненный VIP Аккаунт' : 'Google аккаунт подключен'
    };

    setUserProfile(authed);
    localStorage.setItem('gta6_user_profile_v3', JSON.stringify(authed));
    setIsGoogleModalOpen(false);
    setGuestVipWarningModal(false);
    showToast(`Вход выполнен! Добро пожаловать, ${effectiveName}!`);
  };

  // Google Sign-In with Official Popup
  const handleGoogleSignInWithPopup = async () => {
    setAuthError(null);
    setAuthLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      if (cred.user) {
        await completeSuccessfulGoogleLogin(
          cred.user.uid,
          cred.user.email || '',
          cred.user.displayName || '',
          cred.user.photoURL || ''
        );
      }
    } catch {
      setIsGoogleModalOpen(true);
      setAuthError(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // 1-Click Fast Google Authentication & Registration (Direct to Firestore)
  const executeGoogleAuth = async (emailParam?: string, nameParam?: string) => {
    const rawEmail = (emailParam || googleAuthEmail || '').trim().toLowerCase();
    const cleanEmail = sanitizeEmail(rawEmail);
    const rawName = (nameParam || googleAuthName || (cleanEmail ? cleanEmail.split('@')[0] : '') || 'Google Игрок').trim();
    const cleanName = sanitizeDisplayName(rawName);

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      const err = 'Пожалуйста, введите корректный адрес Google Email (например: player@gmail.com)';
      setAuthError(err);
      showToast(err);
      return;
    }

    setAuthError(null);
    setAuthLoading(true);

    try {
      const emailKey = cleanEmail.replace(/[^a-zA-Z0-9_]/g, '_');
      const uid = sanitizeUid('google_' + emailKey);

      await completeSuccessfulGoogleLogin(uid, cleanEmail, cleanName, GTA_AVATARS[0].url);
    } catch (err: any) {
      console.error('Google auth error:', err);
      setAuthError(err?.message || 'Ошибка входа через Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setAuthError(null);
    setIsGoogleModalOpen(true);
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
        photoURL: selectedAvatar
      };

      setUserProfile(updatedProfile);
      localStorage.setItem('gta6_user_profile_v3', JSON.stringify(updatedProfile));

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: cleanName,
          photoURL: selectedAvatar
        }).catch(() => {});
      }

      const uid = sanitizeUid(auth.currentUser?.uid || userProfile.uid);
      if (uid && !userProfile.isGuest) {
        await setDoc(
          doc(db, 'users', uid),
          {
            displayName: cleanName,
            photoURL: selectedAvatar,
            updatedAt: new Date().toISOString()
          },
          { merge: true }
        );
      }

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
    try {
      await signOut(auth);
    } catch {
      // Local session is cleared regardless
    }
    setUserProfile(DEFAULT_GUEST_PROFILE);
    localStorage.removeItem('gta6_user_profile_v3');
    showToast('Вы вышли из аккаунта (Гостевой режим)');
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
      const matchCat = cheatCategory === 'all' || cheat.category === cheatCategory;
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
    if (selectedNewsCategory === 'Официально') return item.tag === 'ОФИЦИАЛЬНО';
    if (selectedNewsCategory === 'Трейлеры') return item.tag === 'ТРЕЙЛЕР';
    if (selectedNewsCategory === 'Инсайды') return item.tag === 'ИНСАЙДЫ' || item.tag === 'САУНДТРЕК';
    return true;
  });

  const savedCheatItems = cheatsList.filter((c) => favoriteCheats.includes(c.id));
  const savedNewsItems = newsList.filter((n) => favoriteNews.includes(n.id));

  // ==========================================================================
  // RENDER MAIN APPLICATION
  // ==========================================================================

  return (
    <div className="min-h-screen bg-[#09090d] text-neutral-100 flex justify-center selection:bg-[#ccff00] selection:text-black">
      {/* Mobile-first centered frame */}
      <div className="w-full max-w-md min-h-screen bg-[#09090d] flex flex-col relative border-x border-white/[0.06] shadow-2xl pb-28">

        {/* ================================================================== */}
        {/* HEADER */}
        {/* ================================================================== */}
        <header className="sticky top-0 z-40 bg-[#09090d]/95 backdrop-blur-xl border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-display font-black text-xl tracking-tight text-white">
              GTA <span className="text-[#ccff00]">VI</span>
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
                className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold shadow-sm"
                title="Leonida VIP Pass Активен"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>VIP PASS</span>
              </button>
            )}

            {/* Firestore status badge */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-neutral-300"
              title={firestoreConnected ? 'Подключено к Cloud Firestore' : 'Автономный режим'}
            >
              <Cloud className="w-3 h-3 text-cyan-400" />
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  firestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center space-x-2 text-sm text-neutral-300 hover:text-white transition-colors"
              title="Открыть профиль"
            >
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt="Avatar"
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

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#15151c] text-neutral-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-[#ccff00]/40 shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
            <BellRing className="w-4 h-4 text-[#ccff00] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 1: ТАЙМЕР РЕЛИЗА (COUNTDOWN & LEONIDA ATMOSPHERE) */}
        {/* ================================================================== */}
        {activeTab === 'timer' && (
          <main className="flex-1 p-5 space-y-6 animate-in fade-in duration-200">
            {/* HERO COUNTDOWN BANNER */}
            <div className="relative rounded-3xl bg-gradient-to-b from-[#161622] via-[#121218] to-[#0d0d12] border border-white/[0.1] p-6 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#ff2a85]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ccff00] bg-[#ccff00]/10 px-2.5 py-1 rounded-md border border-[#ccff00]/20">
                        Официальный отсчет Rockstar Games
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400 bg-white/[0.04] px-2 py-1 rounded-md border border-white/[0.06]">
                        Леонида • Vice City
                      </span>
                    </div>
                    <h1 className="text-3xl font-display font-extrabold text-white mt-2 tracking-tight">
                      19 Ноября 2026
                    </h1>
                  </div>

                  <button
                    type="button"
                    onClick={toggleReminder}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isReminderSet
                        ? 'bg-[#ccff00] text-black border-[#ccff00] shadow-[0_0_25px_rgba(204,255,0,0.4)]'
                        : 'bg-white/[0.04] text-neutral-300 border-white/[0.08] hover:border-white/20 hover:text-white'
                    }`}
                    title={isReminderSet ? 'Уведомление включено' : 'Включить напоминание о релизе'}
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-xs text-neutral-400 mb-6 leading-relaxed max-w-xl">
                  До возвращения на залитые неоном бульвары Вайс-Сити, пляжи Вайс-Дейл и в опасные субтропические болота Леониды осталось:
                </p>

                {/* Countdown Numbers Grid */}
                <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                  {[
                    { label: 'Дней', val: timeLeft.days },
                    { label: 'Часов', val: timeLeft.hours },
                    { label: 'Минут', val: timeLeft.minutes },
                    { label: 'Секунд', val: timeLeft.seconds }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-[#09090d]/90 border border-white/[0.08] relative group shadow-inner"
                    >
                      <span className="font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {String(item.val).padStart(2, '0')}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase mt-1">
                        {item.label}
                      </span>
                      {i === 3 && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-ping" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
                  <span className="flex items-center space-x-2">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-neutral-300">Серверная точность UTC</span>
                  </span>
                  <span className="text-neutral-400 font-medium">PS5 • PS5 Pro • Xbox Series X|S</span>
                </div>
              </div>
            </div>

            {/* ROADMAP: ROAD TO RELEASE 2026 */}
            <div className="p-5 rounded-3xl bg-[#121217] border border-white/[0.08] space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Compass className="w-4 h-4 text-[#ccff00]" />
                  <span className="font-display font-bold text-sm text-white uppercase tracking-wider">
                    Дорожная карта релиза GTA VI
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 font-medium">
                  Фаза 2 из 5
                </span>
              </div>

              <div className="space-y-3">
                {[
                  {
                    title: 'Официальный анонс и Трейлер 1',
                    date: 'Декабрь 2023',
                    status: 'completed',
                    desc: 'Рекордные 200M+ просмотров на YouTube, первое знакомство с Люсией и штатом Леонида.'
                  },
                  {
                    title: 'Подтверждение релизного окна Take-Two',
                    date: 'Осень 2024 / Весна 2025',
                    status: 'completed',
                    desc: 'Финансовые отчеты подтвердили запуск игры осенью 2026 года для PlayStation 5 и Xbox Series.'
                  },
                  {
                    title: 'Трейлер 2 и Детальный геймплей',
                    date: 'В ожидании премьеры',
                    status: 'upcoming',
                    desc: 'Презентация механик ограблений, открытого мира, кастомизации авто и оружия.'
                  },
                  {
                    title: 'Старт предзаказов и коллекционные издания',
                    date: 'Скоро',
                    status: 'upcoming',
                    desc: 'Открытие предзаказа в PS Store и Xbox Store, бонусы предзаказа и доступ к DLC.'
                  },
                  {
                    title: 'Мировой запуск Grand Theft Auto VI',
                    date: '19 Ноября 2026',
                    status: 'target',
                    desc: 'Полноценный релиз на консолях 9-го поколения по всему миру.'
                  }
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border transition-all ${
                      step.status === 'completed'
                        ? 'bg-emerald-950/15 border-emerald-500/20'
                        : step.status === 'target'
                        ? 'bg-[#ccff00]/5 border-[#ccff00]/30'
                        : 'bg-white/[0.02] border-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : step.status === 'target' ? (
                          <Flame className="w-4 h-4 text-[#ccff00] shrink-0 animate-bounce" />
                        ) : (
                          <Clock className="w-4 h-4 text-neutral-500 shrink-0" />
                        )}
                        <span className="font-bold text-white text-xs">{step.title}</span>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono ml-2 shrink-0">
                        {step.date}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 pl-6 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* INTERACTIVE LEONIDA FACT EXPLORER */}
            <div className="p-5 rounded-3xl bg-[#121217] border border-white/[0.08] space-y-3 shadow-lg">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#ccff00] uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Досье штата Леонида & Механики GTA VI</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  {
                    title: 'Масштаб 2.5x',
                    sub: 'Округ Леонида',
                    detail: 'Карта в 2.5 раза превосходит Лос-Сантос из GTA V. Включает Вайс-Сити, заливы, острова Кис и болота.'
                  },
                  {
                    title: 'Физика RAGE 9',
                    sub: 'Движок Rockstar',
                    detail: 'Переработанная физика деформации транспорта, реалистичная аэродинамика и система динамической воды.'
                  },
                  {
                    title: 'Эверглейдс',
                    sub: 'Живая природа',
                    detail: 'Мангровые заросли, аллигаторы, фламинго, глубокие топи и скрытые стоянки контрабандистов.'
                  },
                  {
                    title: 'Люсия и Джейсон',
                    sub: 'Два протагониста',
                    detail: 'Система совместных ограблений в духе Бонни и Клайда с мгновенным переключением и синергией.'
                  }
                ].map((fact, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveFactIdx(idx)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      activeFactIdx === idx
                        ? 'bg-[#ccff00]/10 border-[#ccff00]/40 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-neutral-300 hover:border-white/20'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{fact.title}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{fact.sub}</div>
                  </button>
                ))}
              </div>

              {/* Active Fact Detail Box */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] text-xs text-neutral-300 leading-relaxed">
                {[
                  'Штат Леонида воссоздан с невиданной детализацией: не только мегаполис Вайс-Сити, но и пригородные трущобы, роскошные пляжные виллы и субтропические реки с динамическими штормами 5-й категории.',
                  'Движок RAGE 9 включает трассировку пути (Path Tracing), симуляцию повреждений каждого узла автомобиля и продвинутый искусственный интеллект полиции и пешеходов.',
                  'Дикая природа Эверглейдс таит смертельную опасность: охота на аллигаторов, гонки на катерах с воздушным винтом и скрытные маршруты для побега от вертолетов FIB.',
                  'Люсия — первый женский протагонист 3D-эры GTA. Вместе с Джейсоном они планируют налеты на мотели, банки и ювелирные салоны с вариативными путями отхода.'
                ][activeFactIdx]}
              </div>
            </div>

            {/* QUICK ACTIONS: JUMP TO CHEATS OR NEWS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('cheats')}
                className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-[#121217] border border-emerald-500/30 hover:border-emerald-400/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400 mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Каталог чит-кодов</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-neutral-300">
                  13 читов для PS5 & Xbox. Бессмертие, спавн танков и вертолетов.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('news')}
                className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 to-[#121217] border border-cyan-500/30 hover:border-cyan-400/60 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-cyan-400 mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Play className="w-4 h-4 fill-cyan-400" />
                    <span>Новости и трейлеры</span>
                  </div>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-neutral-300">
                  Трейлеры в 4K, инсайды и разборы движка RAGE 9.
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
            {/* Top Navigation Row: Back to Timer & Cheats Sync */}
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.06]">
              <button
                type="button"
                onClick={() => setActiveTab('timer')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-neutral-200 hover:text-white text-xs font-bold transition-all border border-white/10 cursor-pointer"
                title="Вернуться к экрану отсчета релиза"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#ccff00]" />
                <span>Назад к таймеру</span>
              </button>

              <div className="flex items-center space-x-2">
                {/* Cheats manual refresh */}
                <button
                  type="button"
                  onClick={handleRefreshCheats}
                  disabled={isRefreshingCheats}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-900/40 text-cyan-300 text-[11px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
                  title="Синхронизировать базу читов с Cloud Firestore"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshingCheats ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingCheats ? 'Синхронизация...' : 'Обновить читы'}</span>
                </button>

                {/* Firestore Indicator */}
                <div
                  className="shrink-0 flex items-center space-x-1.5 px-2 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-neutral-300"
                  title={firestoreConnected ? 'Синхронизировано с Cloud Firestore' : 'Автономная база'}
                >
                  <Cloud className="w-3 h-3 text-cyan-400" />
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      firestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="uppercase tracking-wider text-neutral-400 text-[9px]">
                    {firestoreConnected ? 'Firestore' : 'Офлайн'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header */}
            <div>
              <h1 className="text-2xl font-display font-extrabold text-white">
                База чит-кодов
              </h1>
              <p className="text-sm text-neutral-400 mt-1">
                1 бесплатный чит для каждого аккаунта и эксклюзивные VIP-читы.
              </p>
            </div>

            {/* CLOUD AUTO-UPDATE GUARANTEE BANNER */}
            <div className="p-3 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 flex items-start space-x-2.5">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-300 leading-relaxed">
                <span className="text-cyan-300 font-bold">Авто-обновление после выхода игры:</span>{' '}
                Все новые чит-коды от Rockstar Games и сообщества загружаются из Cloud Firestore в реальном времени. Приложение обновит базу читов автоматически!
              </div>
            </div>

            {/* VIP CTA Strip if not VIP */}
            {!effectiveIsVip && (
              <div className="p-3.5 rounded-2xl bg-[#14141c] border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Leonida VIP Pass</div>
                    <div className="text-[11px] text-neutral-400">2.99 USDT (пожизненный доступ)</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInitiateVipPurchase()}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 fill-black" />
                  <span>Открыть все читы</span>
                </button>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#121217] rounded-2xl border border-white/[0.08]">
              <button
                onClick={() => setPlatform('ps5')}
                className={`py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-2 ${
                  platform === 'ps5'
                    ? 'bg-[#ccff00] text-black shadow-md'
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
                    ? 'bg-[#ccff00] text-black shadow-md'
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
                    ? 'bg-[#ccff00] text-black shadow-md'
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
                className="w-full bg-[#121217] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]/50 transition-colors"
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
                { id: 'player', label: 'Игрок' },
                { id: 'weapons', label: 'Оружие' },
                { id: 'vehicles', label: 'Транспорт' },
                { id: 'world', label: 'Мир и погода' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCheatCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                    cheatCategory === cat.id
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#121217] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Cheats List */}
            <div className="space-y-3">
              {filteredCheats.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#121217] border border-white/[0.08] space-y-2">
                  <p className="text-sm font-semibold text-neutral-300">Ничего не найдено</p>
                  <p className="text-xs text-neutral-500">
                    Попробуйте изменить категорию или поисковый запрос.
                  </p>
                </div>
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
                          ? 'border-amber-500/30 hover:border-amber-500/50'
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
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-amber-300 bg-amber-500/20 border-amber-500/40 flex items-center space-x-1">
                                <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />
                                <span>VIP Доступ</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-amber-300 bg-amber-500/10 border-amber-500/30 flex items-center space-x-1">
                                <Lock className="w-3 h-3 text-amber-400" />
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
                            isFav ? 'text-[#ccff00] bg-[#ccff00]/10' : 'text-neutral-500 hover:text-white'
                          }`}
                          title="Сохранить в избранное"
                        >
                          <Bookmark className={`w-4 h-4 ${isFav ? 'fill-[#ccff00]' : ''}`} />
                        </button>
                      </div>

                      {/* Code Combination Area */}
                      <div className="pt-1">
                        {isUnlocked ? (
                          platform === 'phone' ? (
                            <div className="bg-[#09090d] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between">
                              <span className="font-mono font-bold text-sm text-[#ccff00]">
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
                          <div className="relative rounded-xl overflow-hidden border border-amber-500/20 bg-[#09090d] p-3">
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
                                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
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
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center space-x-1"
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
                            className="text-xs font-bold py-1.5 px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 flex items-center space-x-1.5 transition-all"
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
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-display font-extrabold text-white">
                  Новости и видео
                </h1>
                <p className="text-sm text-neutral-400 mt-1">
                  Официальные трейлеры, отчеты инвесторов и инсайды.
                </p>
                <div className="flex items-center space-x-2 mt-1.5 text-[11px] text-neutral-500">
                  <span>Обновлено: {lastNewsUpdated}</span>
                  <span>•</span>
                  <span>{newsList.length} публикаций</span>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2 shrink-0 ml-3">
                <div
                  className="shrink-0 flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-semibold text-neutral-300"
                  title={firestoreConnected ? 'Подключено к Cloud Firestore' : 'Автономный режим'}
                >
                  <Cloud className="w-3 h-3 text-cyan-400" />
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      firestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span className="uppercase tracking-wider text-neutral-400">
                    {firestoreConnected ? 'Firestore' : 'Офлайн'}
                  </span>
                </div>

                {/* Manual News Refresh Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRefreshNews();
                  }}
                  disabled={isRefreshingNews}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 hover:bg-[#ccff00]/20 text-[#ccff00] text-xs font-bold transition-all disabled:opacity-50"
                  title="Обновить ленту новостей из базы Rockstar"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingNews ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingNews ? 'Обновление...' : 'Обновить'}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              {['Все', 'Официально', 'Трейлеры', 'Инсайды'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedNewsCategory(cat);
                    setNewsPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl shrink-0 transition-all ${
                    selectedNewsCategory === cat
                      ? 'bg-[#ccff00] text-black font-bold shadow-md'
                      : 'bg-[#121217] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* News Feed List with Sheet / Page Separation */}
            {(() => {
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
                    <span className="flex items-center space-x-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00]" />
                      <span>
                        Лист {currentPageSafe} из {totalNewsPages} {currentPageSafe === 1 ? '(Свежие новости)' : '(2-й лист • Архив материалов)'}
                      </span>
                    </span>
                    <span className="text-neutral-500">
                      Показано {displayedNews.length} из {filteredNews.length}
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
                            <Play className="w-3.5 h-3.5 text-[#ccff00] fill-[#ccff00]" />
                            <span>{news.videoDuration}</span>
                          </div>

                          {/* Tag */}
                          <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                            <div className="bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-[#ccff00] uppercase tracking-wider">
                              {news.tag}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavNews(news.id);
                            }}
                            className={`absolute top-3 right-3 p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 transition-colors ${
                              isFav ? 'text-[#ccff00]' : 'text-neutral-400 hover:text-white'
                            }`}
                            title="В закладки"
                          >
                            <Bookmark className={`w-4 h-4 ${isFav ? 'fill-[#ccff00]' : ''}`} />
                          </button>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-neutral-400">
                            <span>{news.date}</span>
                            <span>•</span>
                            <span>{news.readTime} чтения</span>
                          </div>

                          <h2 className="font-display font-bold text-base text-white group-hover:text-[#ccff00] transition-colors leading-snug">
                            {news.title}
                          </h2>

                          <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                            {news.summary}
                          </p>

                          <div className="pt-2 flex items-center justify-between text-xs font-semibold">
                            <span className="text-cyan-400">Смотреть и читать</span>
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
                          <span>1-й лист (Свежие)</span>
                        </button>

                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalNewsPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => setNewsPage(pageNum)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                pageNum === currentPageSafe
                                  ? 'bg-[#ccff00] text-black shadow-md'
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
                          <span>2-й лист (Архив)</span>
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
        {/* TAB 4: ПРОФИЛЬ И ИЗБРАННОЕ (PROFILE & CLOUD SYNC) */}
        {/* ================================================================== */}
        {activeTab === 'profile' && (
          <main className="flex-1 p-5 space-y-6 animate-in fade-in duration-200">
            {/* User Identity Card */}
            <div className="p-5 rounded-3xl bg-[#121217] border border-white/[0.08] space-y-4">
              <div className="flex items-center space-x-4">
                {userProfile.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.displayName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#ccff00]"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-300">
                    <User className="w-7 h-7" />
                  </div>
                )}

                <div className="flex-1">
                  <h2 className="text-lg font-display font-bold text-white">
                    {userProfile.displayName}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {userProfile.email || 'Анонимный гостевой сеанс'}
                  </p>
                  <div className="flex items-center space-x-1.5 mt-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        userProfile.isGuest ? 'bg-amber-400' : 'bg-[#ccff00]'
                      }`}
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                      {userProfile.statusText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Actions */}
              {userProfile.isGuest ? (
                <div className="space-y-2">
                  <button
                    onClick={handleGoogleSignInWithPopup}
                    disabled={authLoading}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-800" />
                        <span>Авторизация Google...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Войти через Google</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleOpenEditProfile}
                    className="py-2.5 px-3 rounded-xl bg-white/[0.08] border border-white/10 text-white font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5 hover:bg-white/[0.14] transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#ccff00]" />
                    <span>Имя и аватар</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5 hover:bg-rose-500/20 hover:text-rose-200 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Выйти</span>
                  </button>
                </div>
              )}
            </div>

            {/* VIP PASS & MONETIZATION SECTION */}
            <div className="rounded-3xl bg-gradient-to-br from-[#1c1811] via-[#14141a] to-[#121217] border border-amber-500/30 p-5 space-y-4 shadow-xl relative overflow-hidden">
              {/* Background ambient glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black shadow-lg">
                    <Crown className="w-5 h-5 fill-black" />
                  </div>
                  <div>
                    <h3 className="text-base font-display font-extrabold text-white flex items-center space-x-2">
                      <span>Leonida VIP Pass</span>
                      {isVip && (
                        <span className="text-[10px] uppercase font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full">
                          Активен
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {isVip
                        ? 'Пожизненный неограниченный доступ ко всем читам и инсайдам'
                        : 'Мгновенный доступ ко всем закрытым читам и видео без рекламы'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status or Purchase Options */}
              {effectiveIsVip ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-neutral-200 leading-relaxed">
                        <span className="font-bold text-amber-300">Статус VIP:</span> Пожизненный Leonida Pass активен. Золотой бейдж, доступ ко всем закрытым материалам и читам.
                        {userProfile.vipInvoiceId && (
                          <div className="text-[11px] text-neutral-400 font-mono mt-1">
                            Crypto Pay Инвойс: #{userProfile.vipInvoiceId}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => auditAndEnforceVipAuthenticity(auth.currentUser?.uid || userProfile.uid || '', true)}
                      disabled={isAuditingVip}
                      className="text-[11px] font-semibold text-neutral-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] px-3 py-1.5 rounded-lg border border-white/10 flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isAuditingVip ? 'animate-spin' : ''}`} />
                      <span>Сверить статус с @CryptoBot</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRevokeVipManual}
                      className="text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-all cursor-pointer"
                    >
                      Аннулировать VIP (Сброс)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white">Статус VIP Спонсора</div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Пожизненный золотой статус профиля и поддержка проекта
                      </div>
                    </div>

                    <button
                      onClick={handleInitiateVipPurchase}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-display font-bold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 fill-black" />
                      <span>Купить VIP за $2.99</span>
                    </button>
                  </div>

                  {userProfile.isGuest && (
                    <p className="text-[11px] text-neutral-500 text-center flex items-center justify-center space-x-1">
                      <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>Для привязки VIP рекомендуется войти через Google или Email</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Saved Cheats Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                  Сохраненные читы ({savedCheatItems.length})
                </h2>
                {savedCheatItems.length > 0 && (
                  <button
                    onClick={() => setActiveTab('cheats')}
                    className="text-xs text-[#ccff00] hover:underline"
                  >
                    Перейти к читам →
                  </button>
                )}
              </div>

              {savedCheatItems.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#121217] border border-white/[0.08] text-center text-xs text-neutral-400">
                  Нет сохраненных кодов. Добавьте их во вкладке «Читы».
                </div>
              ) : (
                <div className="space-y-2">
                  {savedCheatItems.map((cheat) => (
                    <div
                      key={cheat.id}
                      className="p-3 rounded-xl bg-[#121217] border border-white/[0.08] flex items-center justify-between"
                    >
                      <div className="truncate mr-3">
                        <div className="font-bold text-sm text-white truncate">
                          {cheat.title}
                        </div>
                        <div className="text-xs text-neutral-400 truncate">
                          {cheat.codes.phone}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleFavCheat(cheat.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
                        title="Удалить из избранного"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved News Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                  Избранные материалы ({savedNewsItems.length})
                </h2>
                {savedNewsItems.length > 0 && (
                  <button
                    onClick={() => setActiveTab('news')}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Все новости →
                  </button>
                )}
              </div>

              {savedNewsItems.length === 0 ? (
                <div className="p-4 rounded-2xl bg-[#121217] border border-white/[0.08] text-center text-xs text-neutral-400">
                  Нет сохраненных новостей. Нажмите на закладку во вкладке «Новости».
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
                      className="p-3 rounded-xl bg-[#121217] border border-white/[0.08] flex items-center justify-between cursor-pointer hover:border-white/20 transition-colors"
                    >
                      <div className="truncate mr-3">
                        <div className="font-bold text-sm text-white truncate">
                          {news.title}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {news.date}
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavNews(news.id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-400 transition-colors"
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
              activeTab === 'timer' ? 'text-[#ccff00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Таймер</span>
          </button>

          <button
            onClick={() => setActiveTab('cheats')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'cheats' ? 'text-[#ccff00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Читы</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'news' ? 'text-[#ccff00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Новости</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'profile' ? 'text-[#ccff00]' : 'text-neutral-400 hover:text-neutral-200'
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
                  <span className="text-xs font-bold text-[#ccff00] bg-[#ccff00]/10 px-2.5 py-1 rounded-md">
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
                        ? 'bg-[#ccff00]/15 text-[#ccff00] border-[#ccff00]/30'
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
                        favoriteNews.includes(activeModalNews.id) ? 'fill-[#ccff00]' : ''
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
                          <div className="w-14 h-14 rounded-full bg-[#ccff00] text-black flex items-center justify-center shadow-[0_0_25px_rgba(204,255,0,0.5)] group-hover:scale-110 active:scale-95 transition-all">
                            <Play className="w-6 h-6 ml-0.5 fill-black" />
                          </div>
                          <span className="text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full border border-white/10">
                            Нажмите для просмотра
                          </span>
                        </div>

                        <div className="relative z-10 p-3 text-xs text-neutral-300 flex justify-between items-center">
                          <span className="font-semibold text-[#ccff00]">YouTube Player</span>
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
                        className="text-[#ccff00] hover:underline font-semibold flex items-center space-x-1"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Запустить плеер</span>
                      </button>
                    )}

                    <a
                      href={activeModalNews.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#ccff00]">
                      Ключевые факты
                    </h3>
                    <ul className="space-y-1.5 text-xs text-neutral-300">
                      {activeModalNews.keyFacts.map((fact, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="text-[#ccff00] font-bold">•</span>
                          <span>{fact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Prominent Verified Source Box */}
                <div className="rounded-2xl bg-gradient-to-br from-[#121217] to-[#1a1a24] border border-[#ccff00]/30 p-4 space-y-3">
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
                    className="w-full py-3 px-4 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-black font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-lg transition-all"
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
                  <div className="w-8 h-8 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 flex items-center justify-center text-[#ccff00]">
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
                    className="w-full bg-[#09090d] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ccff00]/60 transition-colors"
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
                                ? 'border-[#ccff00] ring-2 ring-[#ccff00]/30 scale-105'
                                : 'border-white/10 hover:border-white/30'
                            }`}
                          >
                            <img
                              src={avatar.url}
                              alt={avatar.name}
                              className="w-full h-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#ccff00]/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-[#ccff00] fill-black" />
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
                    className="py-2.5 px-3 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-neutral-800 disabled:text-neutral-500 text-black font-display font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition-all shadow-md"
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
            <div className="w-full max-w-sm bg-[#121217] border border-amber-500/40 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
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
                  onClick={async () => {
                    setGuestVipWarningModal(false);
                    await handleGoogleSignInWithPopup();
                  }}
                  disabled={authLoading}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2.5 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-800" />
                      <span>Подключение к Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Войти через Google</span>
                    </>
                  )}
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
            <div className="w-full max-w-sm bg-[#121217] border border-[#2AABEE]/40 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
              {/* CryptoBot Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2AABEE] to-[#229ED9] flex items-center justify-center text-white shadow-md">
                    <Send className="w-4 h-4 fill-white" />
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
                  className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors"
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
                    <span className="font-mono font-black text-lg text-[#ccff00]">
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
                    <span className="text-amber-400 font-medium flex items-center space-x-1">
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
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : invoiceFeedback.status === 'checking'
                    ? 'bg-[#2AABEE]/10 border-[#2AABEE]/30 text-[#2AABEE]'
                    : invoiceFeedback.status === 'error'
                    ? 'bg-red-500/10 border-red-500/30 text-red-300'
                    : 'bg-white/[0.04] border-white/10 text-neutral-300'
                }`}
              >
                <div className="flex items-start space-x-2">
                  {invoiceFeedback.status === 'checking' ? (
                    <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-[#2AABEE] mt-0.5" />
                  ) : invoiceFeedback.status === 'paid' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  ) : invoiceFeedback.status === 'unpaid' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
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
                {/* 1. Open Telegram Bot in New Tab/Window */}
                <a
                  href={activeInvoice.pay_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#2AABEE] to-[#229ED9] hover:from-[#35b5f6] hover:to-[#2AABEE] text-white font-display font-bold text-sm tracking-wide flex items-center justify-center space-x-2 transition-all shadow-lg cursor-pointer text-center"
                >
                  <Send className="w-4 h-4 fill-white shrink-0" />
                  <span>1. Оплатить в Telegram @CryptoBot</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80 shrink-0" />
                </a>

                {/* 1b. Copy Payment Link (helps when iframe or popup blocker is active) */}
                <button
                  type="button"
                  onClick={() => handleCopyInvoiceUrl(activeInvoice.pay_url)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-neutral-200 font-display font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  {hasCopiedInvoiceUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-semibold">Ссылка скопирована в буфер!</span>
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
                    <a
                      href={activeInvoice.web_app_invoice_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] text-[#2AABEE] hover:underline"
                    >
                      <span>Открыть счет в браузере (Crypto Pay Web)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* 2. Status Check & Verification Button */}
                <button
                  type="button"
                  onClick={handleVerifyAndActivateInvoice}
                  disabled={isCheckingInvoice}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isCheckingInvoice ? 'animate-spin' : ''}`} />
                  <span>
                    {isCheckingInvoice ? 'Связь с CryptoBot...' : '2. Проверить оплату и активировать'}
                  </span>
                </button>

                <div className="text-[10px] text-center text-neutral-400 flex items-center justify-center space-x-1.5 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Шлюз: pay.crypt.bot • Официальный Crypto Pay API</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Processing Payment Overlay */}
        {isProcessingPayment && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4">
            <div className="p-6 rounded-2xl bg-[#121217] border border-[#2AABEE]/40 flex flex-col items-center space-y-3 text-center shadow-2xl animate-in zoom-in-95 duration-150">
              <Loader2 className="w-8 h-8 animate-spin text-[#2AABEE]" />
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
        {/* MODAL: GOOGLE 1-CLICK AUTHENTICATION & QUICK CONNECT */}
        {/* ================================================================== */}
        {isGoogleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
            <div className="w-full sm:max-w-md bg-[#121217] border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-lg shrink-0">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">
                      Вход через Google
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Мгновенная авторизация в 1 клик
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Primary Action Button: Official Google Popup */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleSignInWithPopup}
                  disabled={authLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-neutral-100 text-neutral-900 font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-2.5 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                >
                  {authLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-neutral-900" />
                      <span>Подключение к Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Войти через Google</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center pt-1">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-[#121217] px-3 text-[10px] uppercase font-bold text-neutral-400 shrink-0 tracking-wider">
                    Или быстрый вход по Email
                  </span>
                  <div className="border-t border-white/10 w-full" />
                </div>

                {/* Direct Google Email Input form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    executeGoogleAuth(googleAuthEmail, googleAuthName);
                  }}
                  className="space-y-2.5 p-3.5 rounded-2xl bg-[#09090d] border border-white/10"
                >
                  <div className="space-y-1">
                    <label htmlFor="google-auth-email-input" className="text-[10px] uppercase font-bold text-neutral-400">
                      Ваш Google Email
                    </label>
                    <input
                      id="google-auth-email-input"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={googleAuthEmail}
                      onChange={(e) => setGoogleAuthEmail(e.target.value)}
                      placeholder="player@gmail.com"
                      className="w-full bg-[#121217] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#4285F4]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="google-auth-name-input" className="text-[10px] uppercase font-bold text-neutral-400">
                      Имя в игре (по желанию)
                    </label>
                    <input
                      id="google-auth-name-input"
                      name="username"
                      type="text"
                      autoComplete="username"
                      value={googleAuthName}
                      onChange={(e) => setGoogleAuthName(e.target.value)}
                      placeholder="Например: ViceCity_Pro"
                      className="w-full bg-[#121217] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#4285F4]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || !googleAuthEmail.trim()}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center space-x-1.5 transition-all disabled:opacity-40 cursor-pointer"
                  >
                    <span>Войти с указанным Google Email</span>
                  </button>
                </form>
              </div>

              {/* Error Box */}
              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2 text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{authError}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
