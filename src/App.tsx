import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Bookmark,
  Play,
  User,
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
  Crown,
  CheckCircle2,
  AlertCircle,
  Send,
  RefreshCw,
  Compass,
  Flame,
  Star,
  Cpu,
  MapPin,
  Key,
  Navigation
} from 'lucide-react';
import {
  getHardwareDeviceId,
  loadDeviceStorageData,
  saveFavoriteCheats,
  saveFavoriteNews,
  saveVipStatus,
  validateVipKey,
  DEFAULT_AVATAR,
  DeviceProfile
} from './utils/deviceStorage';
import { safeFetchJson, openExternalUrl } from './utils/api';

// ============================================================================
// TYPES & DEFINITIONS
// ============================================================================

export type PlatformType = 'ps5' | 'xbox' | 'phone';
export type TabType = 'timer' | 'cheats' | 'map' | 'news' | 'profile';

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
}

export interface LocationItem {
  id: string;
  name: string;
  category: 'city' | 'nature' | 'water' | 'secret';
  tag: string;
  threatLevel: 'Низкий' | 'Средний' | 'Высокий' | 'Экстремальный';
  description: string;
  highlights: string[];
  coordinates: string;
}

export interface CryptoInvoice {
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

// ============================================================================
// 100% OFFLINE DATASETS
// ============================================================================

export const GTA_CHEATS: CheatItem[] = [
  {
    id: 'cheat_max_health_armor',
    title: 'Максимум здоровья и брони (Health & Armor)',
    category: 'player',
    description: 'Мгновенно восстанавливает 100% шкалы жизненных сил персонажа и экипирует тяжелый бронежилет.',
    codes: {
      ps5: ['◯', 'L1', '△', 'R2', 'X', '▢', '◯', 'RIGHT', '▢', 'L1', 'L1', 'L1'],
      xbox: ['B', 'LB', 'Y', 'RT', 'A', 'X', 'B', 'RIGHT', 'X', 'LB', 'LB', 'LB'],
      phone: '1-999-887-853 (TURTLE)'
    }
  },
  {
    id: 'cheat_invincibility',
    title: 'Режим бога и бессмертие (Invincibility / God Mode)',
    category: 'player',
    description: 'Полная неуязвимость персонажа на 5 минут. Защищает от любого урона, выстрелов, взрывов и атак хищников.',
    codes: {
      ps5: ['RIGHT', 'X', 'RIGHT', 'LEFT', 'RIGHT', 'R1', 'RIGHT', 'LEFT', 'X', '△'],
      xbox: ['RIGHT', 'A', 'RIGHT', 'LEFT', 'RIGHT', 'RB', 'RIGHT', 'LEFT', 'A', 'Y'],
      phone: '1-999-724-654-5537 (PAINKILLER)'
    }
  },
  {
    id: 'cheat_weapons_pack',
    title: 'Полный боевой арсенал оружия (All Weapons)',
    category: 'weapons',
    description: 'Выдает штурмовой карабин, тактический дробовик, микро-SMG, снайперскую винтовку и гранаты.',
    codes: {
      ps5: ['△', 'R2', 'LEFT', 'L1', 'X', 'RIGHT', '△', 'DOWN', '▢', 'L1', 'L1', 'L1'],
      xbox: ['Y', 'RT', 'LEFT', 'LB', 'A', 'RIGHT', 'Y', 'DOWN', 'X', 'LB', 'LB', 'LB'],
      phone: '1-999-866-587 (TOOLUP)'
    }
  },
  {
    id: 'cheat_explosive_bullets',
    title: 'Разрывные патроны (Explosive Ammo)',
    category: 'weapons',
    description: 'Каждый выстрел порождает мощную ударную волну и детонирует автомобили при первом же попадании.',
    codes: {
      ps5: ['RIGHT', '▢', 'X', 'LEFT', 'R1', 'R2', 'LEFT', 'RIGHT', 'RIGHT', 'L1', 'L1', 'L1'],
      xbox: ['RIGHT', 'X', 'A', 'LEFT', 'RB', 'RT', 'LEFT', 'RIGHT', 'RIGHT', 'LB', 'LB', 'LB'],
      phone: '1-999-444-439 (HIGHEX)'
    }
  },
  {
    id: 'cheat_flaming_bullets',
    title: 'Зажигательные пули (Incendiary Ammo)',
    category: 'weapons',
    description: 'Пули воспламеняют цели и объекты окружения при столкновении.',
    codes: {
      ps5: ['L1', 'R1', '▢', 'R1', 'LEFT', 'R2', 'R1', 'LEFT', '▢', 'RIGHT', 'L1', 'L1'],
      xbox: ['LB', 'RB', 'X', 'RB', 'LEFT', 'RT', 'RB', 'LEFT', 'X', 'RIGHT', 'LB', 'LB'],
      phone: '1-999-462-363-4279 (INCENDIARY)'
    }
  },
  {
    id: 'cheat_super_jump',
    title: 'Супер-прыжок и лунная гравитация',
    category: 'player',
    description: 'Позволяет совершать прыжки в высоту до 15 метров с плавным кинематографичным приземлением.',
    codes: {
      ps5: ['LEFT', 'LEFT', '△', '△', 'RIGHT', 'RIGHT', 'LEFT', 'RIGHT', '▢', 'R1', 'R2'],
      xbox: ['LEFT', 'LEFT', 'Y', 'Y', 'RIGHT', 'RIGHT', 'LEFT', 'RIGHT', 'X', 'RB', 'RT'],
      phone: '1-999-467-8648 (HOPTOIT)'
    }
  },
  {
    id: 'cheat_fast_run',
    title: 'Сверхскоростной спринт (Fast Sprint)',
    category: 'player',
    description: 'Увеличивает максимальную скорость бега персонажа в 2.5 раза без накопления усталости.',
    codes: {
      ps5: ['△', 'LEFT', 'RIGHT', 'RIGHT', 'L2', 'L1', '▢'],
      xbox: ['Y', 'LEFT', 'RIGHT', 'RIGHT', 'LT', 'LB', 'X'],
      phone: '1-999-228-8463 (CATCHME)'
    }
  },
  {
    id: 'cheat_spawn_cheetah',
    title: 'Суперкар Grotti Cheetah (Турбо Вайс-Сити)',
    category: 'vehicles',
    description: 'Эксклюзивный неоновый итальянский гиперкар с форсированным турбомотором и закисью азота.',
    codes: {
      ps5: ['R1', '◯', 'R2', 'RIGHT', 'L1', 'L2', 'X', 'X', '▢', 'R1'],
      xbox: ['RB', 'B', 'RT', 'RIGHT', 'LB', 'LT', 'A', 'A', 'X', 'RB'],
      phone: '1-999-266-3844 (COMET)'
    }
  },
  {
    id: 'cheat_spawn_buzzard',
    title: 'Боевой вертолет Buzzard / Hunter',
    category: 'vehicles',
    description: 'Спавнит скоростной маневренный ударный вертолет с самонаводящимися ракетами и пулеметом.',
    codes: {
      ps5: ['◯', '◯', 'L1', '◯', '◯', '◯', 'L1', 'L2', 'R1', '△', '◯', '△'],
      xbox: ['B', 'B', 'LB', 'B', 'B', 'B', 'LB', 'LT', 'RB', 'Y', 'B', 'Y'],
      phone: '1-999-289-9633 (BUZZOFF)'
    }
  },
  {
    id: 'cheat_spawn_tank',
    title: 'Тяжелый штурмовой танк Rhino',
    category: 'vehicles',
    description: 'Бронированный танк с активным орудием, сминающий любые преграды на автомагистралях Леониды.',
    codes: {
      ps5: ['◯', '◯', 'L1', '◯', '◯', '◯', 'L1', 'L2', 'R1', '△', '◯', 'X'],
      xbox: ['B', 'B', 'LB', 'B', 'B', 'B', 'LB', 'LT', 'RB', 'Y', 'B', 'A'],
      phone: '1-999-726-7648 (PANZER)'
    }
  },
  {
    id: 'cheat_spawn_speedboat',
    title: 'Скоростной катер Squalo & гидроцикл',
    category: 'vehicles',
    description: 'Маневренный морской катер для исследования побережья Ocean Beach и архипелага островов Кис.',
    codes: {
      ps5: ['△', '△', '▢', '◯', 'X', 'L1', 'L1', 'DOWN', 'UP'],
      xbox: ['Y', 'Y', 'X', 'B', 'A', 'LB', 'LB', 'DOWN', 'UP'],
      phone: '1-999-778-256 (SQUALO)'
    }
  },
  {
    id: 'cheat_skyfall',
    title: 'Свободное падение со стратосферы (Skyfall)',
    category: 'player',
    description: 'Мгновенная телепортация высоко в небо над Вайс-Сити для экстремального полета в вингсьюте.',
    codes: {
      ps5: ['L1', 'L2', 'R1', 'R2', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'L1', 'L2', 'R1', 'R2', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT'],
      xbox: ['LB', 'LT', 'RB', 'RT', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'LB', 'LT', 'RB', 'RT', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT'],
      phone: '1-999-759-3255 (SKYFALL)'
    }
  },
  {
    id: 'cheat_slow_mo_aim',
    title: 'Замедление времени при прицеливании (Dead Eye)',
    category: 'player',
    description: 'Замедляет время в 3 раза при прицеливании для сверхточных хедшотов и кинематографичной стрельбы.',
    codes: {
      ps5: ['▢', 'L2', 'R1', '△', 'LEFT', '▢', 'L2', 'RIGHT', 'X'],
      xbox: ['X', 'LT', 'RB', 'Y', 'LEFT', 'X', 'LT', 'RIGHT', 'A'],
      phone: '1-999-332-3393 (DEADEYE)'
    }
  },
  {
    id: 'cheat_lower_wanted',
    title: 'Сбросить розыск полиции (-1 звезда)',
    category: 'player',
    description: 'Снижает интерес патрульных служб полиции Вайс-Сити и шерифов округа Келли на один уровень.',
    codes: {
      ps5: ['R1', 'R1', '◯', 'R2', 'RIGHT', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'LEFT'],
      xbox: ['RB', 'RB', 'B', 'RT', 'RIGHT', 'LEFT', 'RIGHT', 'LEFT', 'RIGHT', 'LEFT'],
      phone: '1-999-529-93787 (LAWYERUP)'
    }
  },
  {
    id: 'cheat_weather_storm',
    title: 'Погода: Тропический ураган и шторм',
    category: 'world',
    description: 'Вызывает реалистичный шторм Флориды с объемными молниями, сильным ветром и тропическим ливнем.',
    codes: {
      ps5: ['R2', 'X', 'L1', 'L1', 'L2', 'L2', 'L2', '▢'],
      xbox: ['RT', 'A', 'LB', 'LB', 'LT', 'LT', 'LT', 'X'],
      phone: '1-999-623-6448 (MAKEITRAIN)'
    }
  }
];

export const GTA_NEWS: NewsItem[] = [
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
  }
];

export const LEONIDA_LOCATIONS: LocationItem[] = [
  {
    id: 'loc_ocean_beach',
    name: 'Ocean Beach & Ocean Drive',
    category: 'city',
    tag: 'ВАЙС-СИТИ',
    threatLevel: 'Низкий',
    description: 'Жемчужина ночного Вайс-Сити: знаменитый променад с неоновыми отелями ар-деко, пальмами, спорткарами и клубами.',
    highlights: ['Отель Malibu Club', 'Спавн спорткаров Cheetah', 'Набережная серферов'],
    coordinates: '25.7781° N, 80.1313° W'
  },
  {
    id: 'loc_downtown',
    name: 'Даунтаун Вайс-Сити (Downtown)',
    category: 'city',
    tag: 'МЕГАПОЛИС',
    threatLevel: 'Средний',
    description: 'Финансовый центр штата Леонида. Высотные стеклянные небоскребы, крыши для прыжков с парашютом и вертолетные площадки.',
    highlights: ['Штаб-квартиры корпораций', 'Арена корриды и шоу', 'Элитные пентхаусы'],
    coordinates: '25.7617° N, 80.1918° W'
  },
  {
    id: 'loc_vice_port',
    name: 'Порт Вайс-Сити (Vice Port)',
    category: 'water',
    tag: 'ДОКИ И ВОДА',
    threatLevel: 'Высокий',
    description: 'Крупнейший грузовой морской узел. Контейнерные терминалы, склады контрабандистов и стоянки скоростных катеров.',
    highlights: ['Морские катера Squalo', 'Контрабандные склады', 'Краны и контейнеры'],
    coordinates: '25.7420° N, 80.1750° W'
  },
  {
    id: 'loc_grassrivers',
    name: 'Болота Грассриверс (Everglades)',
    category: 'nature',
    tag: 'ДИКАЯ ПРИРОДА',
    threatLevel: 'Экстремальный',
    description: 'Бескрайние дикие топи с аллигаторами, густой тропической растительностью, аэролодками и тайными убежищами.',
    highlights: ['Глиссеры-аэролодки', 'Ферма гигантских аллигаторов', 'Лагеря браконьеров'],
    coordinates: '25.6800° N, 80.6500° W'
  },
  {
    id: 'loc_leonard_county',
    name: 'Округ Келли и Леонард (Kelly County)',
    category: 'city',
    tag: 'ПРОВИНЦИЯ',
    threatLevel: 'Средний',
    description: 'Одноэтажная Америка: мотели, трейлерные парки, ломбарды, автозаправки и грунтовые дороги сельской Леониды.',
    highlights: ['Мотель Джека и Люсии', 'Магазины оружия Ammu-Nation', 'Полицейские участки'],
    coordinates: '25.9200° N, 80.3400° W'
  },
  {
    id: 'loc_leonida_keys',
    name: 'Архипелаг Леонида-Кис (The Keys)',
    category: 'water',
    tag: 'ОСТРОВА',
    threatLevel: 'Низкий',
    description: 'Цепь тропических коралловых островов, соединенных легендарным 11-мильным мостом Overseas Highway над открытым океаном.',
    highlights: ['Мост Overseas Highway', 'Дайвинг и коралловые рифы', 'Гидропланы'],
    coordinates: '24.6500° N, 81.3000° W'
  },
  {
    id: 'loc_escobar_airport',
    name: 'Аэропорт Эскобар (Escobar Intl)',
    category: 'secret',
    tag: 'АВИАЦИЯ',
    threatLevel: 'Высокий',
    description: 'Главная воздушная гавань штата с тремя взлетно-посадочными полосами, грузовыми ангарами и частными джетами.',
    highlights: ['Пассажирские лайнеры', 'Частные джеты Nimbus', 'Охраняемая зона'],
    coordinates: '25.7959° N, 80.2870° W'
  },
  {
    id: 'loc_port_gellhorn',
    name: 'Порт-Геллхорн (Port Gellhorn)',
    category: 'city',
    tag: 'ПРОМЗОНА',
    threatLevel: 'Высокий',
    description: 'Западный прибрежный промышленный город, известный своими ночными гонками, автомастерскими и заброшенными складами.',
    highlights: ['Подпольные тюнинг-гаражи', 'Трассы ночного дрифта', 'Ломбарды'],
    coordinates: '26.1200° N, 81.8000° W'
  }
];

// Target release timestamp: November 19, 2026
const TARGET_RELEASE_TIMESTAMP = new Date('2026-11-19T00:00:00Z').getTime();

// ============================================================================
// ANIMATED COUNTDOWN COMPONENT
// ============================================================================

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
      {isSeconds && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D4FF00] animate-pulse opacity-75" />
      )}

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

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  // Navigation Tabs: timer | cheats | map | news | profile
  const [activeTab, setActiveTab] = useState<TabType>('timer');

  // Controller Platform: ps5 | xbox | phone
  const [platform, setPlatform] = useState<PlatformType>('ps5');

  // Cheats State
  const [cheatCategory, setCheatCategory] = useState<string>('all');
  const [cheatSearch, setCheatSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Map / Content State
  const [mapCategory, setMapCategory] = useState<string>('all');
  const [mapSearch, setMapSearch] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);

  // News State
  const [newsCategory, setNewsCategory] = useState<string>('Все');
  const [activeModalNews, setActiveModalNews] = useState<NewsItem | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [newsPage, setNewsPage] = useState<number>(1);
  const NEWS_PER_PAGE = 3;

  // Device Lock & Persistent State
  const [deviceId, setDeviceId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<DeviceProfile>({
    displayName: 'Игрок Leonida',
    avatarUrl: DEFAULT_AVATAR,
    statusText: 'Игрок Leonida',
    isVip: false
  });
  const [isVip, setIsVip] = useState<boolean>(false);
  const [favoriteCheats, setFavoriteCheats] = useState<string[]>([]);
  const [favoriteNews, setFavoriteNews] = useState<string[]>([]);

  // VIP Key Activation Input State (Profile Screen)
  const [vipKeyInput, setVipKeyInput] = useState<string>('');
  const [vipKeyFeedback, setVipKeyFeedback] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  const [isActivatingKey, setIsActivatingKey] = useState<boolean>(false);

  // UI Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [isReminderSet, setIsReminderSet] = useState<boolean>(false);

  // VIP Pass CryptoBot Invoice State
  const [activeInvoice, setActiveInvoice] = useState<CryptoInvoice | null>(null);
  const [hasCopiedInvoiceUrl, setHasCopiedInvoiceUrl] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [isCheckingInvoice, setIsCheckingInvoice] = useState<boolean>(false);
  const [invoiceFeedback, setInvoiceFeedback] = useState<{
    status: 'idle' | 'checking' | 'unpaid' | 'paid' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: 'Счет ожидает оплаты в Telegram @CryptoBot.'
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ==========================================================================
  // INITIALIZATION: INSTANT 0.1s OFFLINE LOAD FROM @capacitor/preferences
  // ==========================================================================

  useEffect(() => {
    loadDeviceStorageData().then((data) => {
      setDeviceId(data.deviceId);
      setFavoriteCheats(data.favCheats);
      setFavoriteNews(data.favNews);
      setIsVip(data.isVip);
      setUserProfile(data.profile);
    });

    try {
      const reminderVal = localStorage.getItem('gta6_reminder_enabled') === 'true';
      setIsReminderSet(reminderVal);
    } catch {}
  }, []);

  // ==========================================================================
  // COUNTDOWN ENGINE
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

  const toggleReminder = () => {
    const next = !isReminderSet;
    setIsReminderSet(next);
    try {
      localStorage.setItem('gta6_reminder_enabled', String(next));
    } catch {}
    showToast(
      next
        ? 'Уведомление включено: вы получите сигнал перед релизом 19 ноября 2026'
        : 'Уведомление о релизе отключено'
    );
  };

  // ==========================================================================
  // FAVORITES HANDLERS
  // ==========================================================================

  const toggleFavCheat = async (id: string) => {
    const isCurrentlyFav = favoriteCheats.includes(id);
    const updated = isCurrentlyFav
      ? favoriteCheats.filter((i) => i !== id)
      : [...favoriteCheats, id];

    setFavoriteCheats(updated);
    await saveFavoriteCheats(updated);
    showToast(isCurrentlyFav ? 'Чит удален из сохраненных' : 'Чит сохранен в избранное');
  };

  const toggleFavNews = async (id: string) => {
    const isCurrentlyFav = favoriteNews.includes(id);
    const updated = isCurrentlyFav
      ? favoriteNews.filter((i) => i !== id)
      : [...favoriteNews, id];

    setFavoriteNews(updated);
    await saveFavoriteNews(updated);
    showToast(isCurrentlyFav ? 'Новость удалена из закладок' : 'Новость сохранена в избранное');
  };

  const handleCopyCheat = async (cheat: CheatItem) => {
    let textToCopy = '';
    if (platform === 'ps5') {
      textToCopy = cheat.codes.ps5.join(' ');
    } else if (platform === 'xbox') {
      textToCopy = cheat.codes.xbox.join(' ');
    } else {
      textToCopy = cheat.codes.phone;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(cheat.id);
      showToast(`Код «${cheat.title}» скопирован!`);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('Не удалось скопировать код');
    }
  };

  // ==========================================================================
  // VIP KEY ACTIVATION (NATIVE ANDROID KEYBOARD HANDLING)
  // ==========================================================================

  const handleActivateVipKey = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = vipKeyInput.trim().toUpperCase();

    if (!cleanKey) {
      setVipKeyFeedback({
        type: 'error',
        message: 'Пожалуйста, введите лицензионный VIP-ключ.'
      });
      return;
    }

    setIsActivatingKey(true);
    setVipKeyFeedback({ type: 'idle', message: '' });

    // Validate key
    const isValid = validateVipKey(cleanKey);

    if (isValid) {
      setIsVip(true);
      const updatedProfile: DeviceProfile = {
        ...userProfile,
        isVip: true,
        statusText: 'Пожизненный Leonida VIP Pass',
        vipInvoiceId: cleanKey,
        vipVerifiedAt: new Date().toISOString(),
        activationMethod: 'license_key'
      };
      setUserProfile(updatedProfile);

      // Persist to @capacitor/preferences
      await saveVipStatus(true, {
        invoiceId: cleanKey,
        amount: '0.00',
        asset: 'LICENSE_KEY',
        verifiedAt: new Date().toISOString(),
        method: 'license_key'
      });

      setVipKeyFeedback({
        type: 'success',
        message: `VIP-ключ ${cleanKey} успешно активирован!`
      });
      showToast('Пожизненный Leonida VIP Pass успешно активирован!');
      setVipKeyInput('');
    } else {
      setVipKeyFeedback({
        type: 'error',
        message: 'Неверный VIP-ключ. Проверьте правильность или используйте промо-ключ: VIP-LEONIDA-2026'
      });
      showToast('Неверный VIP-ключ');
    }

    setIsActivatingKey(false);
  };

  // ==========================================================================
  // VIP CRYPTOBOT PURCHASE
  // ==========================================================================

  const handleInitiateVipPurchase = async () => {
    setIsProcessingPayment(true);
    setInvoiceFeedback({
      status: 'idle',
      message: 'Создание счета в @CryptoBot...'
    });
    showToast('Создание счета в @CryptoBot (2.99 USDT)...');

    const safePayload = deviceId || (await getHardwareDeviceId());

    try {
      const res = await safeFetchJson('/api/cryptobot/createInvoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: 'USDT',
          amount: '2.99',
          description: 'GTA 6 Leonida - Пожизненный VIP Pass',
          payload: safePayload
        })
      });

      if (res.ok && res.data && res.data.ok === true && res.data.result?.pay_url) {
        showToast('Счет создан! Открыто окно оплаты');
        setActiveInvoice(res.data.result);
        setInvoiceFeedback({
          status: 'idle',
          message: `Счет #${res.data.result.invoice_id} на 2.99 USDT создан в @CryptoBot.`
        });
        openExternalUrl(res.data.result.pay_url);
      } else {
        const directBotUrl = `https://t.me/CryptoBot?start=VIP_GTA6_${safePayload}`;
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
        showToast('Счет открыт! Переход в Telegram @CryptoBot...');
        openExternalUrl(directBotUrl);
      }
    } catch {
      const directBotUrl = `https://t.me/CryptoBot?start=VIP_GTA6_${safePayload}`;
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
      openExternalUrl(directBotUrl);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopyInvoiceUrl = async (url: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      setHasCopiedInvoiceUrl(true);
      showToast('Ссылка на оплату скопирована в буфер!');
      setTimeout(() => setHasCopiedInvoiceUrl(false), 2500);
    } catch {
      showToast('Не удалось скопировать ссылку');
    }
  };

  const handleVerifyAndActivateInvoice = async () => {
    if (!activeInvoice?.invoice_id) return;

    setIsCheckingInvoice(true);
    setInvoiceFeedback({
      status: 'checking',
      message: `Проверяем оплату счета #${activeInvoice.invoice_id} в Crypto Pay...`
    });

    try {
      const res = await safeFetchJson(`/api/cryptobot/getInvoices?invoice_ids=${activeInvoice.invoice_id}`);
      let isPaid = false;

      if (res.ok && res.data?.ok && Array.isArray(res.data.result?.items) && res.data.result.items.length > 0) {
        const item = res.data.result.items[0];
        if (item.status === 'paid') {
          isPaid = true;
        }
      }

      if (isPaid) {
        setIsVip(true);
        const updatedProfile: DeviceProfile = {
          ...userProfile,
          isVip: true,
          statusText: 'Пожизненный Leonida VIP Pass',
          vipInvoiceId: activeInvoice.invoice_id,
          vipAmount: activeInvoice.amount,
          vipAsset: activeInvoice.asset,
          vipVerifiedAt: new Date().toISOString(),
          activationMethod: 'cryptobot'
        };
        setUserProfile(updatedProfile);

        await saveVipStatus(true, {
          invoiceId: activeInvoice.invoice_id,
          amount: activeInvoice.amount,
          asset: activeInvoice.asset,
          verifiedAt: new Date().toISOString(),
          method: 'cryptobot'
        });

        setInvoiceFeedback({
          status: 'paid',
          message: 'Транзакция подтверждена! VIP Pass активирован.'
        });
        showToast('Оплата подтверждена! VIP Pass активирован!');
        setTimeout(() => setActiveInvoice(null), 2000);
      } else {
        setInvoiceFeedback({
          status: 'unpaid',
          message: `Оплата не поступила! Перейдите в бота Telegram @CryptoBot и завершите перевод 2.99 USDT.`
        });
        showToast('Оплата пока не обнаружена в CryptoBot');
      }
    } catch {
      setInvoiceFeedback({
        status: 'error',
        message: 'Не удалось проверить статус счета. Повторите попытку.'
      });
      showToast('Ошибка проверки счета');
    } finally {
      setIsCheckingInvoice(false);
    }
  };

  // ==========================================================================
  // GAMEPAD GLYPH RENDERER
  // ==========================================================================

  const renderGamepadGlyph = (glyph: string, currentPlatform: PlatformType, index: number) => {
    const isArrow = ['LEFT', 'RIGHT', 'UP', 'DOWN'].includes(glyph);
    const arrowSymbols: Record<string, string> = {
      LEFT: '◀',
      RIGHT: '▶',
      UP: '▲',
      DOWN: '▼'
    };

    if (isArrow) {
      return (
        <span
          key={index}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1a1a24] border border-white/15 text-neutral-200 text-xs font-mono font-bold shadow-sm"
          title={`Стрелка ${glyph}`}
        >
          {arrowSymbols[glyph] || glyph}
        </span>
      );
    }

    if (currentPlatform === 'ps5') {
      const psColors: Record<string, string> = {
        '△': 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
        '◯': 'text-rose-400 border-rose-500/30 bg-rose-950/40',
        X: 'text-sky-400 border-sky-500/30 bg-sky-950/40',
        '▢': 'text-pink-400 border-pink-500/30 bg-pink-950/40',
        L1: 'text-amber-300 border-amber-500/30 bg-amber-950/40 font-bold',
        L2: 'text-amber-400 border-amber-500/30 bg-amber-950/40 font-bold',
        R1: 'text-amber-300 border-amber-500/30 bg-amber-950/40 font-bold',
        R2: 'text-amber-400 border-amber-500/30 bg-amber-950/40 font-bold'
      };

      return (
        <span
          key={index}
          className={`inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-lg border text-xs font-mono font-bold shadow-sm ${
            psColors[glyph] || 'text-white border-white/20 bg-neutral-800'
          }`}
        >
          {glyph}
        </span>
      );
    }

    const xboxColors: Record<string, string> = {
      Y: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
      B: 'text-rose-400 border-rose-500/30 bg-rose-950/40',
      A: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
      X: 'text-sky-400 border-sky-500/30 bg-sky-950/40',
      LB: 'text-neutral-200 border-white/20 bg-neutral-800 font-bold',
      LT: 'text-neutral-200 border-white/20 bg-neutral-800 font-bold',
      RB: 'text-neutral-200 border-white/20 bg-neutral-800 font-bold',
      RT: 'text-neutral-200 border-white/20 bg-neutral-800 font-bold'
    };

    return (
      <span
        key={index}
        className={`inline-flex items-center justify-center min-w-7 h-7 px-1.5 rounded-lg border text-xs font-mono font-bold shadow-sm ${
          xboxColors[glyph] || 'text-white border-white/20 bg-neutral-800'
        }`}
      >
        {glyph}
      </span>
    );
  };

  // ==========================================================================
  // FILTERED DATA
  // ==========================================================================

  const filteredCheats = useMemo(() => {
    return GTA_CHEATS.filter((cheat) => {
      if (cheatCategory === 'saved') {
        if (!favoriteCheats.includes(cheat.id)) return false;
      } else if (cheatCategory !== 'all' && cheat.category !== cheatCategory) {
        return false;
      }

      if (cheatSearch.trim()) {
        const query = cheatSearch.toLowerCase();
        const matchesTitle = cheat.title.toLowerCase().includes(query);
        const matchesDesc = cheat.description.toLowerCase().includes(query);
        const matchesPhone = cheat.codes.phone.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesPhone;
      }

      return true;
    });
  }, [cheatCategory, cheatSearch, favoriteCheats]);

  const filteredLocations = useMemo(() => {
    return LEONIDA_LOCATIONS.filter((loc) => {
      if (mapCategory !== 'all' && loc.category !== mapCategory) {
        return false;
      }

      if (mapSearch.trim()) {
        const q = mapSearch.toLowerCase();
        const matchesName = loc.name.toLowerCase().includes(q);
        const matchesDesc = loc.description.toLowerCase().includes(q);
        const matchesTag = loc.tag.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesTag;
      }

      return true;
    });
  }, [mapCategory, mapSearch]);

  const filteredNews = useMemo(() => {
    return GTA_NEWS.filter((item) => {
      if (newsCategory !== 'Все' && item.tag !== newsCategory) {
        return false;
      }
      return true;
    });
  }, [newsCategory]);

  const totalNewsPages = Math.ceil(filteredNews.length / NEWS_PER_PAGE);
  const pagedNews = filteredNews.slice((newsPage - 1) * NEWS_PER_PAGE, newsPage * NEWS_PER_PAGE);

  const savedCheatItems = useMemo(() => {
    return GTA_CHEATS.filter((c) => favoriteCheats.includes(c.id));
  }, [favoriteCheats]);

  const savedNewsItems = useMemo(() => {
    return GTA_NEWS.filter((n) => favoriteNews.includes(n.id));
  }, [favoriteNews]);

  return (
    <div className="min-h-screen bg-[#09090d] text-neutral-100 flex flex-col font-sans select-none antialiased pb-20">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col relative">
        {/* ================================================================== */}
        {/* TOP APP HEADER */}
        {/* ================================================================== */}
        <header className="sticky top-0 z-40 bg-[#09090d]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D4FF00] to-[#bbf746] flex items-center justify-center font-display font-black text-black text-base shadow-[0_0_15px_rgba(212,255,0,0.3)]">
              VI
            </div>
            <div>
              <div className="font-display font-extrabold text-sm tracking-wide text-white leading-tight flex items-center space-x-1.5">
                <span>LEONIDA COMPANION</span>
                {isVip && (
                  <span className="text-[9px] font-black uppercase bg-[#D4FF00] text-black px-1.5 py-0.5 rounded-full">
                    VIP
                  </span>
                )}
              </div>
              <div className="text-[10px] text-neutral-400 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
                <span>100% Offline-Ready</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="flex items-center space-x-2 cursor-pointer p-1 rounded-xl hover:bg-white/[0.06] transition-colors"
            title="Профиль игрока"
          >
            <img
              src={userProfile.avatarUrl || DEFAULT_AVATAR}
              alt="Avatar"
              className="w-8 h-8 rounded-xl object-cover border border-[#D4FF00]/40 shadow-sm"
            />
          </button>
        </header>

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#15151c] text-neutral-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-[#D4FF00]/40 shadow-xl flex items-center space-x-2 animate-in fade-in duration-200">
            <BellRing className="w-4 h-4 text-[#D4FF00] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ================================================================== */}
        {/* TAB 1: ТАЙМЕР РЕЛИЗА (COUNTDOWN & ROADMAP) */}
        {/* ================================================================== */}
        {activeTab === 'timer' && (
          <main className="flex-1 p-4 space-y-5 animate-in fade-in duration-150">
            {/* HERO COUNTDOWN BANNER */}
            <div className="relative rounded-3xl bg-[#121217] border border-white/[0.08] p-5 shadow-xl overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4FF00] bg-[#D4FF00]/10 px-2.5 py-1 rounded-md border border-[#D4FF00]/20">
                      Официальный релиз
                    </span>
                    <h1 className="text-2xl font-display font-black text-white mt-2 tracking-tight">
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
                    title={isReminderSet ? 'Уведомление включено' : 'Включить напоминание'}
                  >
                    <Bell className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <AnimatedCountdownSlot label="Дней" value={timeLeft.days} />
                  <AnimatedCountdownSlot label="Часов" value={timeLeft.hours} />
                  <AnimatedCountdownSlot label="Минут" value={timeLeft.minutes} />
                  <AnimatedCountdownSlot label="Секунд" value={timeLeft.seconds} isSeconds />
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-neutral-400">
                  <span className="text-neutral-300 font-medium">Штат Леонида • Вайс-Сити</span>
                  <span className="text-neutral-400">PS5 • Xbox Series X|S</span>
                </div>
              </div>
            </div>

            {/* ROADMAP */}
            <div className="p-4 rounded-3xl bg-[#121217] border border-white/[0.08] space-y-3 shadow-lg">
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
                  { title: 'Официальный анонс и Трейлер 1', date: 'Декабрь 2023', status: 'completed' },
                  { title: 'Подтверждение релизного окна Take-Two', date: '2024–2025', status: 'completed' },
                  { title: 'Трейлер 2 и Детальный геймплей', date: 'Сентябрь 2026', status: 'completed' },
                  { title: 'Старт предзаказов', date: 'Скоро', status: 'upcoming' },
                  { title: 'Мировой запуск Grand Theft Auto VI', date: '19 Ноября 2026', status: 'target' }
                ].map((step, idx) => (
                  <div
                    key={idx}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-between transition-all ${
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

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('cheats')}
                className="p-3.5 rounded-2xl bg-[#121217] border border-white/[0.08] hover:border-[#D4FF00]/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#D4FF00] mb-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Читы</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Все коды открыты
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className="p-3.5 rounded-2xl bg-[#121217] border border-white/[0.08] hover:border-[#D4FF00]/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#D4FF00] mb-0.5">
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>Атлас Леониды</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  Карта и локации
                </p>
              </button>
            </div>
          </main>
        )}

        {/* ================================================================== */}
        {/* TAB 2: ЧИТ-КОДЫ */}
        {/* ================================================================== */}
        {activeTab === 'cheats' && (
          <main className="flex-1 p-4 space-y-4 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl font-display font-black text-white">
                Чит-коды GTA VI
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Все стандартные читы полностью доступны без ограничений
              </p>
            </div>

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#121217] rounded-2xl border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setPlatform('ps5')}
                className={`py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  platform === 'ps5'
                    ? 'bg-[#D4FF00] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>PlayStation 5</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('xbox')}
                className={`py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  platform === 'xbox'
                    ? 'bg-[#D4FF00] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Xbox Series</span>
              </button>

              <button
                type="button"
                onClick={() => setPlatform('phone')}
                className={`py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
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
                type="text"
                placeholder="Поиск по названию или коду..."
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
            <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              {[
                { id: 'all', label: 'Все читы' },
                { id: 'saved', label: `Сохраненные (${favoriteCheats.length})` },
                { id: 'player', label: 'Игрок' },
                { id: 'weapons', label: 'Оружие' },
                { id: 'vehicles', label: 'Транспорт' },
                { id: 'world', label: 'Мир и погода' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCheatCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                    cheatCategory === cat.id
                      ? 'bg-[#D4FF00] text-black font-extrabold shadow-sm'
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
                <div className="p-8 text-center rounded-2xl bg-[#121411] border border-white/[0.08] space-y-2">
                  <p className="text-sm font-semibold text-neutral-300">
                    {cheatCategory === 'saved' ? 'Нет сохраненных читов' : 'Читы не найдены'}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {cheatCategory === 'saved'
                      ? 'Нажмите на значок закладки у любого чита, чтобы сохранить его.'
                      : 'Попробуйте изменить поисковый запрос.'}
                  </p>
                </div>
              ) : (
                filteredCheats.map((cheat) => {
                  const isFav = favoriteCheats.includes(cheat.id);
                  const isCopied = copiedId === cheat.id;

                  const categoryLabels: Record<string, string> = {
                    player: 'Игрок',
                    weapons: 'Оружие',
                    vehicles: 'Транспорт',
                    world: 'Мир и погода'
                  };

                  return (
                    <div
                      key={cheat.id}
                      className="p-4 rounded-2xl bg-[#121217] border border-white/[0.08] hover:border-[#D4FF00]/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h2 className="font-display font-bold text-sm text-white">
                              {cheat.title}
                            </h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border text-neutral-400 bg-white/[0.04] border-white/[0.08] uppercase">
                              {categoryLabels[cheat.category] || cheat.category}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {cheat.description}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleFavCheat(cheat.id)}
                          className={`p-2 rounded-xl transition-colors ml-2 shrink-0 cursor-pointer ${
                            isFav ? 'text-[#D4FF00] bg-[#D4FF00]/10' : 'text-neutral-500 hover:text-white'
                          }`}
                          title="Сохранить в избранное"
                        >
                          <Bookmark className={`w-4 h-4 ${isFav ? 'fill-[#D4FF00]' : ''}`} />
                        </button>
                      </div>

                      {/* Code Combination Display */}
                      <div className="pt-1">
                        {platform === 'phone' ? (
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
                        )}
                      </div>

                      {/* Copy Action Button */}
                      <div className="flex justify-end pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleCopyCheat(cheat)}
                          className={`text-xs font-bold py-1.5 px-3 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer ${
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </main>
        )}

        {/* ================================================================== */}
        {/* TAB 3: КАРТА И АТЛАС ЛЕОНИДЫ (CONTENT & LOCATIONS) */}
        {/* ================================================================== */}
        {activeTab === 'map' && (
          <main className="flex-1 p-4 space-y-4 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl font-display font-black text-white">
                Атлас штата Леонида
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Районы Вайс-Сити, секретные точки, спавны транспорта и болота
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Поиск района, локации или секрета..."
                value={mapSearch}
                onChange={(e) => setMapSearch(e.target.value)}
                className="w-full bg-[#121217] border border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00]/50 transition-colors"
              />
              {mapSearch && (
                <button
                  type="button"
                  onClick={() => setMapSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Categories */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              {[
                { id: 'all', label: 'Все локации' },
                { id: 'city', label: 'Город Вайс-Сити' },
                { id: 'nature', label: 'Болота и природа' },
                { id: 'water', label: 'Вода и острова' },
                { id: 'secret', label: 'Секретные зоны' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMapCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                    mapCategory === cat.id
                      ? 'bg-[#D4FF00] text-black font-extrabold shadow-sm'
                      : 'bg-[#121411] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Locations Cards List */}
            <div className="space-y-3">
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc)}
                  className="p-4 rounded-2xl bg-[#121217] border border-white/[0.08] hover:border-[#D4FF00]/40 transition-all cursor-pointer space-y-2.5 shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D4FF00]/10 border border-[#D4FF00]/30 text-[#D4FF00]">
                          {loc.tag}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            loc.threatLevel === 'Экстремальный'
                              ? 'text-rose-400 border-rose-500/30 bg-rose-950/30'
                              : loc.threatLevel === 'Высокий'
                              ? 'text-amber-400 border-amber-500/30 bg-amber-950/30'
                              : 'text-emerald-400 border-emerald-500/30 bg-emerald-950/30'
                          }`}
                        >
                          Угроза: {loc.threatLevel}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-white mt-1.5">
                        {loc.name}
                      </h3>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] flex items-center justify-center text-neutral-400">
                      <Navigation className="w-4 h-4 text-[#D4FF00]" />
                    </div>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">
                    {loc.description}
                  </p>

                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {loc.highlights.map((h, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-lg bg-black/40 border border-white/[0.06] text-neutral-300"
                      >
                        • {h}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="font-mono">{loc.coordinates}</span>
                    <span className="text-[#D4FF00] font-semibold">Подробнее →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Location Detail Modal */}
            {selectedLocation && (
              <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
                <div className="w-full max-w-sm bg-[#0e110d] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5 text-[#D4FF00]" />
                      <h3 className="font-display font-bold text-base text-white">
                        {selectedLocation.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedLocation(null)}
                      className="p-1 rounded-full text-neutral-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/50 border border-white/[0.06]">
                      <span className="text-neutral-400">Сектор:</span>
                      <span className="font-bold text-[#D4FF00]">{selectedLocation.tag}</span>
                    </div>

                    <div className="flex justify-between items-center p-2.5 rounded-xl bg-black/50 border border-white/[0.06]">
                      <span className="text-neutral-400">Координаты GPS:</span>
                      <span className="font-mono text-neutral-200">{selectedLocation.coordinates}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06] space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Описание сектора</span>
                      <p className="text-neutral-300 leading-relaxed">{selectedLocation.description}</p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#D4FF00]">Ключевые точки и транспорт</span>
                      <div className="space-y-1">
                        {selectedLocation.highlights.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 p-2 rounded-lg bg-white/[0.03]">
                            <Check className="w-3.5 h-3.5 text-[#D4FF00] shrink-0" />
                            <span className="text-neutral-200">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      showToast(`Координаты ${selectedLocation.name} отмечены`);
                      setSelectedLocation(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#D4FF00] text-black font-display font-extrabold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Понятно
                  </button>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ================================================================== */}
        {/* TAB 4: НОВОСТИ И 4K ВИДЕО */}
        {/* ================================================================== */}
        {activeTab === 'news' && (
          <main className="flex-1 p-4 space-y-4 animate-in fade-in duration-150">
            <div>
              <h1 className="text-2xl font-display font-black text-white">
                Новости GTA VI
              </h1>
              <p className="text-xs text-neutral-400 mt-0.5">
                Официальные трейлеры, инсайды и разбор физики Вайс-Сити
              </p>
            </div>

            {/* Categories */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              {['Все', 'ОФИЦИАЛЬНО', 'ТРЕЙЛЕР', 'ИНСАЙДЫ', 'САУНДТРЕК'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setNewsCategory(tag);
                    setNewsPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                    newsCategory === tag
                      ? 'bg-[#D4FF00] text-black font-extrabold shadow-sm'
                      : 'bg-[#121411] text-neutral-400 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* News Cards */}
            <div className="space-y-4">
              {pagedNews.map((news) => {
                const isFav = favoriteNews.includes(news.id);
                return (
                  <article
                    key={news.id}
                    onClick={() => {
                      setActiveModalNews(news);
                      setIsVideoPlaying(false);
                    }}
                    className="rounded-3xl bg-[#121217] border border-white/[0.08] overflow-hidden group hover:border-[#D4FF00]/40 transition-all cursor-pointer shadow-lg"
                  >
                    <div className="relative aspect-video overflow-hidden bg-black">
                      <img
                        src={news.image}
                        alt={news.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-transparent" />

                      <div className="absolute top-3 left-3 bg-black/80 px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-[#D4FF00] uppercase tracking-wider">
                        {news.tag}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavNews(news.id);
                        }}
                        className={`absolute top-3 right-3 p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 transition-colors cursor-pointer ${
                          isFav ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-white'
                        }`}
                        title="В закладки"
                      >
                        <Bookmark className={`w-4 h-4 ${isFav ? 'fill-[#D4FF00]' : ''}`} />
                      </button>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex items-center space-x-2 text-xs text-neutral-400">
                        <span>{news.date}</span>
                        <span>•</span>
                        <span>{news.readTime} чтения</span>
                      </div>

                      <h2 className="font-display font-bold text-sm text-white group-hover:text-[#D4FF00] transition-colors leading-snug">
                        {news.title}
                      </h2>

                      <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                        {news.summary}
                      </p>

                      <div className="pt-2 flex items-center justify-between text-xs font-semibold text-[#D4FF00]">
                        <span>Читать и смотреть видео</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-neutral-400" />
                      </div>
                    </div>
                  </article>
                );
              })}

              {/* Pagination */}
              {totalNewsPages > 1 && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#121217] border border-white/[0.08] text-xs">
                  <span className="text-neutral-400">
                    Страница {newsPage} из {totalNewsPages}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      disabled={newsPage === 1}
                      onClick={() => setNewsPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-white cursor-pointer"
                    >
                      Назад
                    </button>
                    <button
                      type="button"
                      disabled={newsPage === totalNewsPages}
                      onClick={() => setNewsPage((p) => Math.min(totalNewsPages, p + 1))}
                      className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed font-semibold text-white cursor-pointer"
                    >
                      Вперед
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {/* ================================================================== */}
        {/* TAB 5: ЧИСТЫЙ И МИНИМАЛИСТИЧНЫЙ ПРОФИЛЬ */}
        {/* ================================================================== */}
        {activeTab === 'profile' && (
          <main className="flex-1 p-4 space-y-5 animate-in fade-in duration-150">
            {/* 1. ШАПКА ПРОФИЛЯ */}
            <div className="p-5 rounded-3xl bg-[#121217] border border-white/[0.08] shadow-xl flex items-center space-x-4">
              <img
                src={userProfile.avatarUrl || DEFAULT_AVATAR}
                alt="Игрок Leonida"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.25)]"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-display font-bold text-white truncate">
                    Игрок Leonida
                  </h2>
                  {isVip && (
                    <span className="text-[10px] font-extrabold uppercase bg-[#D4FF00] text-black px-2 py-0.5 rounded-full shrink-0">
                      VIP
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-[#D4FF00] shrink-0" />
                  <p className="text-xs text-neutral-300 truncate">
                    {isVip ? 'Пожизненный Leonida VIP Pass' : 'Стандартный доступ'}
                  </p>
                </div>

                {deviceId && (
                  <div className="text-[10px] text-neutral-500 font-mono mt-1 truncate flex items-center space-x-1">
                    <Cpu className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate">Device: {deviceId.slice(0, 16)}...</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. КАРТОЧКА VIP PASS С ПОЛЕМ ВВОДА VIP-КЛЮЧА */}
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
                      {isVip && (
                        <span className="text-[10px] uppercase font-extrabold bg-[#D4FF00] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(212,255,0,0.3)]">
                          VIP Активен
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {isVip
                        ? 'Пожизненный статус привязан к вашему оборудованию'
                        : 'Мгновенная активация по ключу или через CryptoBot'}
                    </p>
                  </div>
                </div>
              </div>

              {isVip ? (
                <div className="p-3.5 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/30 flex items-center space-x-3 relative z-10">
                  <ShieldCheck className="w-5 h-5 text-[#D4FF00] shrink-0" />
                  <div className="text-xs text-neutral-200">
                    <span className="font-bold text-[#D4FF00]">VIP Pass Активен:</span> Лицензия привязана к оборудованию устройства (Device ID) и сохраняется при очистке кэша Android.
                  </div>
                </div>
              ) : (
                <div className="space-y-4 pt-1 relative z-10">
                  {/* ПОЛЕ ВВОДА VIP-КЛЮЧА (С ПОДДЕРЖКОЙ КЛАВИАТУРЫ ANDROID) */}
                  <form onSubmit={handleActivateVipKey} className="space-y-2">
                    <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider flex items-center space-x-1.5">
                      <Key className="w-3.5 h-3.5 text-[#D4FF00]" />
                      <span>Активация по VIP-ключу</span>
                    </label>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        inputMode="text"
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="Например: VIP-LEONIDA-2026"
                        value={vipKeyInput}
                        onChange={(e) => {
                          setVipKeyInput(e.target.value.toUpperCase());
                          if (vipKeyFeedback.type !== 'idle') {
                            setVipKeyFeedback({ type: 'idle', message: '' });
                          }
                        }}
                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00] transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={isActivatingKey || !vipKeyInput.trim()}
                        className="px-3.5 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#bbf746] disabled:opacity-50 text-black font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center shrink-0 transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 mr-1" />
                        <span>Ввести</span>
                      </button>
                    </div>

                    {vipKeyFeedback.message && (
                      <p
                        className={`text-[11px] font-medium leading-snug ${
                          vipKeyFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {vipKeyFeedback.message}
                      </p>
                    )}
                  </form>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-white/[0.08]" />
                    <span className="flex-shrink mx-2 text-[10px] text-neutral-500 uppercase tracking-wider">или онлайн счет</span>
                    <div className="flex-grow border-t border-white/[0.08]" />
                  </div>

                  {/* Кнопка создания счета Telegram @CryptoBot */}
                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.08] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Crown className="w-3.5 h-3.5 text-[#D4FF00]" />
                        <span>Оформить через CryptoBot</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        2.99 USDT • Пожизненный доступ
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInitiateVipPurchase}
                      disabled={isProcessingPayment}
                      className="py-2 px-3.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-display font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 text-[#D4FF00]" />
                      <span>{isProcessingPayment ? 'Счет...' : 'Оплатить'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. БЛОК: СОХРАНЕННЫЕ ЧИТЫ */}
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
                    type="button"
                    onClick={() => setActiveTab('cheats')}
                    className="text-xs text-[#D4FF00] hover:underline cursor-pointer"
                  >
                    Все читы →
                  </button>
                )}
              </div>

              {savedCheatItems.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#121217] border border-white/[0.08] text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00]">
                    <Gamepad2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-neutral-300 font-medium">
                    У вас пока нет сохраненных читов.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cheats')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>Перейти к читам</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedCheatItems.map((cheat) => (
                    <div
                      key={cheat.id}
                      className="p-3.5 rounded-2xl bg-[#121217] border border-white/[0.08] flex items-center justify-between gap-3 hover:border-white/20 transition-colors"
                    >
                      <div className="truncate min-w-0">
                        <div className="font-bold text-sm text-white truncate">
                          {cheat.title}
                        </div>
                        <div className="text-xs text-[#D4FF00] truncate font-mono mt-0.5">
                          {cheat.codes.phone}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 shrink-0">
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

            {/* 4. БЛОК: ИЗБРАННЫЕ НОВОСТИ */}
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
                    type="button"
                    onClick={() => setActiveTab('news')}
                    className="text-xs text-[#D4FF00] hover:underline cursor-pointer"
                  >
                    Все новости →
                  </button>
                )}
              </div>

              {savedNewsItems.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#121217] border border-white/[0.08] text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#D4FF00]/10 border border-[#D4FF00]/20 flex items-center justify-center text-[#D4FF00]">
                    <Bookmark className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-neutral-300 font-medium">
                    У вас нет сохраненных новостей.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('news')}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#D4FF00]/15 hover:bg-[#D4FF00]/25 text-[#D4FF00] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <span>Открыть новости</span>
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
                      className="p-3.5 rounded-2xl bg-[#121217] border border-white/[0.08] flex items-center justify-between gap-3 cursor-pointer hover:border-[#D4FF00]/30 transition-colors"
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
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#09090d]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-2 z-40 flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'timer' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Таймер</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cheats')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'cheats' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Читы</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'map' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <MapPin className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Карта</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'news' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Новости</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold">Профиль</span>
          </button>
        </nav>

        {/* ================================================================== */}
        {/* DETAILED NEWS & 4K VIDEO MODAL */}
        {/* ================================================================== */}
        {activeModalNews && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="w-full max-w-md max-h-[92vh] bg-[#0d0d12] border border-white/10 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
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
                    type="button"
                    onClick={() => toggleFavNews(activeModalNews.id)}
                    className={`p-2 rounded-full border transition-colors cursor-pointer ${
                      favoriteNews.includes(activeModalNews.id)
                        ? 'bg-[#D4FF00]/15 text-[#D4FF00] border-[#D4FF00]/30'
                        : 'bg-white/[0.05] text-neutral-300 border-white/10 hover:text-white'
                    }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        favoriteNews.includes(activeModalNews.id) ? 'fill-[#D4FF00]' : ''
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalNews(null);
                      setIsVideoPlaying(false);
                    }}
                    className="p-2 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto p-5 space-y-5">
                <h2 className="text-xl font-display font-extrabold text-white leading-tight">
                  {activeModalNews.title}
                </h2>

                <div className="space-y-2">
                  <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-lg">
                    {isVideoPlaying ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${activeModalNews.youtubeId}?autoplay=1&rel=0`}
                        title={activeModalNews.title}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div
                        onClick={() => setIsVideoPlaying(true)}
                        className="relative w-full h-full cursor-pointer flex flex-col justify-between group"
                      >
                        <img
                          src={news_img_safe(activeModalNews.image)}
                          alt={activeModalNews.title}
                          className="w-full h-full object-cover absolute inset-0 opacity-80 group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                        <div className="relative z-10 p-3 flex justify-between text-xs font-bold text-white">
                          <span className="bg-black/80 px-2 py-0.5 rounded-md border border-white/10">
                            4K Ultra HD
                          </span>
                          <span className="bg-black/80 px-2 py-0.5 rounded-md border border-white/10">
                            {activeModalNews.videoDuration}
                          </span>
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center space-y-2">
                          <div className="w-14 h-14 rounded-full bg-[#D4FF00] text-black flex items-center justify-center shadow-[0_0_25px_rgba(204,255,0,0.5)] group-hover:scale-110 active:scale-95 transition-all">
                            <Play className="w-6 h-6 ml-0.5 fill-black" />
                          </div>
                          <span className="text-xs font-bold text-white bg-black/70 px-3 py-1 rounded-full border border-white/10">
                            Воспроизвести
                          </span>
                        </div>

                        <div className="relative z-10 p-3 text-xs text-neutral-300 flex justify-between items-center">
                          <span className="font-semibold text-[#D4FF00]">YouTube Player</span>
                          <span className="text-neutral-400">Официальный ролик</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                  {activeModalNews.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {activeModalNews.keyFacts && activeModalNews.keyFacts.length > 0 && (
                  <div className="rounded-2xl bg-[#121217] border border-white/[0.08] p-4 space-y-2">
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
              </div>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: CRYPTO PAY INVOICE (@CryptoBot) */}
        {/* ================================================================== */}
        {activeInvoice && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-[#0e110d] border border-[#D4FF00]/40 rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-200">
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
                  type="button"
                  onClick={() => setActiveInvoice(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

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

                <div className="p-3 rounded-xl bg-black/50 border border-white/[0.08] space-y-1.5 text-xs">
                  <div className="flex justify-between items-center text-neutral-400">
                    <span>Статус счета:</span>
                    <span className="text-[#D4FF00] font-medium flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Ожидание оплаты</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 leading-snug">
                    {invoiceFeedback.message}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => openExternalUrl(activeInvoice.pay_url)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] text-black font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-black text-black shrink-0" />
                  <span>1. Оплатить в Telegram @CryptoBot</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyInvoiceUrl(activeInvoice.pay_url)}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-neutral-200 font-display font-medium text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  {hasCopiedInvoiceUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#D4FF00]" />
                      <span className="text-[#D4FF00] font-semibold">Ссылка скопирована!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Скопировать ссылку</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleVerifyAndActivateInvoice}
                  disabled={isCheckingInvoice}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-display font-extrabold text-xs tracking-wider uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingInvoice ? 'animate-spin text-[#D4FF00]' : ''}`} />
                  <span>
                    {isCheckingInvoice ? 'Проверка...' : '2. Проверить оплату и активировать'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function news_img_safe(url: string): string {
  if (!url) return 'https://img.youtube.com/vi/QdBZY2fkU-0/maxresdefault.jpg';
  return url;
}
