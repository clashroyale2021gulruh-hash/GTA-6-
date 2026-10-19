export interface NewsArticle {
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
  publishedAt?: string;
}

export const INITIAL_GTA_NEWS: NewsArticle[] = [
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
