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
  ChevronLeft,
  Compass,
  Flame,
  Sparkles,
  Star,
  Cpu,
  LogIn,
  LogOut,
  UserPlus,
  Lock,
  Mail,
  Cloud,
  Key
} from 'lucide-react';
import {
  getHardwareDeviceId,
  loadDeviceStorageData,
  saveFavoriteCheats,
  saveFavoriteNews,
  saveVipStatus,
  saveDeviceProfile,
  getCachedNews,
  saveCachedNews,
  getLastNewsSync,
  saveLastNewsSync,
  DEFAULT_AVATAR,
  DeviceProfile,
  PendingVipOrder,
  savePendingVipOrder,
  getPendingVipOrder
} from './utils/deviceStorage';
import { App as CapApp } from '@capacitor/app';
import { supabase, checkSupabaseVipStatus, syncDeviceToSupabase } from './utils/supabaseClient';
import { safeFetchJson, openExternalUrl } from './utils/api';
import { INITIAL_GTA_NEWS } from './data/newsFeed';
import {
  loginWithEmail,
  registerWithEmail,
  loginAsGuest,
  logoutUser,
  getUserCloudData,
  saveUserCloudData,
  auth,
  onAuthStateChanged,
  User as FirebaseUser
} from './utils/authService';

// ============================================================================
// TYPES & DATA STRUCTURES
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
// LEONIDA VERIFIED CHEATS CATALOG
// All cheats are completely accessible immediately without blocks or paywalls
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
    description: 'Увеличивает максимальную скорость бега персонажа в 2.5 раза без усталости.',
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

// ============================================================================
// VERIFIED GTA VI NEWS & INSIDER REPORTS
// ============================================================================

export const GTA_NEWS: NewsItem[] = INITIAL_GTA_NEWS;

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
  // Navigation Tabs: timer | cheats | news | profile
  const [activeTab, setActiveTab] = useState<'timer' | 'cheats' | 'news' | 'profile'>('timer');

  // Controller Platform: ps5 | xbox | phone
  const [platform, setPlatform] = useState<PlatformType>('ps5');

  // Cheats Search & Filter State
  const [cheatCategory, setCheatCategory] = useState<string>('all');
  const [cheatSearch, setCheatSearch] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // News Filter & Modal State
  const [newsList, setNewsList] = useState<NewsItem[]>(INITIAL_GTA_NEWS);
  const [isSyncingNews, setIsSyncingNews] = useState<boolean>(false);
  const [lastNewsSyncText, setLastNewsSyncText] = useState<string>('Проверено');
  const [newsCategory, setNewsCategory] = useState<string>('Все');
  const [newsSearch, setCheatNewsSearch] = useState<string>('');
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

  // Supabase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authDisplayName, setAuthDisplayName] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthProcessing, setIsAuthProcessing] = useState<boolean>(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  // Supabase VIP Cloud Verification State
  const [isCheckingSupabaseVip, setIsCheckingSupabaseVip] = useState<boolean>(false);

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

  // VIP Pass Purchase & Verification State (@CryptoBot)
  const [activeInvoice, setActiveInvoice] = useState<CryptoInvoice | null>(null);
  const [hasCopiedInvoiceUrl, setHasCopiedInvoiceUrl] = useState<boolean>(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [isCheckingInvoice, setIsCheckingInvoice] = useState<boolean>(false);
  const [pendingOrder, setPendingOrder] = useState<PendingVipOrder | null>(null);
  const [invoiceFeedback, setInvoiceFeedback] = useState<{
    status: 'idle' | 'checking' | 'unpaid' | 'paid' | 'error';
    message: string;
  }>({
    status: 'idle',
    message: 'Счет ожидает оплаты в Telegram @CryptoBot.'
  });

  // Show Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ==========================================================================
  // AUTOMATIC NEWS FEED SYNC (FETCH ON EACH APP LAUNCH & CACHING)
  // ==========================================================================

  const syncNewsFromNetwork = async (isManual = false) => {
    if (isManual) setIsSyncingNews(true);
    try {
      const res = await safeFetchJson<{
        ok: boolean;
        items: NewsItem[];
        lastUpdated?: string;
      }>('/api/news');

      if (res.ok && res.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
        setNewsList(res.data.items);
        await saveCachedNews(res.data.items);
        const now = new Date();
        const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const label = `Обновлено в ${timeStr}`;
        setLastNewsSyncText(label);
        await saveLastNewsSync(label);
        if (isManual) {
          showToast(`Лента обновлена (${res.data.items.length} статей)`);
        }
      } else if (isManual) {
        showToast('Сервер пока не содержит новых статей');
      }
    } catch {
      if (isManual) {
        showToast('Не удалось связаться с сервером новостей');
      }
    } finally {
      if (isManual) {
        setIsSyncingNews(false);
      }
    }
  };

  // ==========================================================================
  // BOOTSTRAP: INSTANT 0.1s INITIALIZATION FROM DEVICE PREFERENCES + AUTO-SYNC
  // ==========================================================================

  useEffect(() => {
    // 1) Load hardware-linked data from @capacitor/preferences
    loadDeviceStorageData().then(async (data) => {
      setDeviceId(data.deviceId);
      setFavoriteCheats(data.favCheats);
      setFavoriteNews(data.favNews);
      setIsVip(data.isVip);
      setUserProfile(data.profile);

      // Check VIP status in Supabase profiles/users table with timeout handling (offline-safe)
      try {
        const supaRes = await checkSupabaseVipStatus(data.deviceId, 4000);
        if (supaRes.isVip) {
          setIsVip(true);
          setUserProfile((prev) => ({
            ...prev,
            isVip: true,
            statusText: 'VIP Игрок ⚡'
          }));
          await saveVipStatus(true, {
            invoiceId: supaRes.rawData?.invoice_id || Math.floor(Date.now() / 1000),
            amount: '2.99',
            asset: 'SUPABASE_CLOUD',
            verifiedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('Supabase initial VIP check handled offline:', err);
      }
    });

    // 2) Load cached news from preferences for instant render
    getCachedNews<NewsItem>().then((cached) => {
      if (cached && cached.length > 0) {
        setNewsList(cached);
      }
    });

    getLastNewsSync().then((savedTime) => {
      if (savedTime) setLastNewsSyncText(savedTime);
    });

    try {
      const reminderVal = localStorage.getItem('gta6_reminder_enabled') === 'true';
      setIsReminderSet(reminderVal);
    } catch {}

    // Load any pending order for the visual indicator
    getPendingVipOrder().then((saved) => {
      if (saved) {
        setPendingOrder(saved);
      }
    });

    // 3) Automatic silent fetch on every app startup without blocking UI
    syncNewsFromNetwork(false);

    // 4) Background listener for Firebase Auth and cloud user sync
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const cloudData = await getUserCloudData(user.uid);
          if (cloudData) {
            if (cloudData.isVip) {
              setIsVip(true);
              await saveVipStatus(true, {
                invoiceId: cloudData.vipInvoiceId || 0,
                amount: cloudData.vipAmount || '2.99',
                asset: cloudData.vipAsset || 'USDT',
                verifiedAt: cloudData.vipVerifiedAt
              });
            } else {
              const currentVipState = await loadDeviceStorageData();
              if (currentVipState.isVip) {
                await saveUserCloudData(user.uid, {
                  isVip: true,
                  vipAmount: '2.99',
                  vipAsset: 'USDT'
                });
              }
            }

            if (Array.isArray(cloudData.savedCheats) && cloudData.savedCheats.length > 0) {
              setFavoriteCheats((prev) => Array.from(new Set([...prev, ...cloudData.savedCheats!])));
            }
            if (Array.isArray(cloudData.savedNews) && cloudData.savedNews.length > 0) {
              setFavoriteNews((prev) => Array.from(new Set([...prev, ...cloudData.savedNews!])));
            }
          }
        } catch (err) {
          console.warn('Auth sync notice:', err);
        }
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  // RuStore & Android Native Back Button Support
  useEffect(() => {
    let backListener: any = null;
    try {
      CapApp.addListener('backButton', () => {
        if (activeInvoice) {
          setActiveInvoice(null);
          return;
        }
        if (activeModalNews) {
          setActiveModalNews(null);
          return;
        }
        if (isAuthModalOpen) {
          setIsAuthModalOpen(false);
          return;
        }
        if (activeTab !== 'cheats') {
          setActiveTab('cheats');
          return;
        }
        CapApp.exitApp();
      }).then((handle) => {
        backListener = handle;
      });
    } catch {
      // non-Capacitor environment
    }

    return () => {
      if (backListener && typeof backListener.remove === 'function') {
        backListener.remove();
      }
    };
  }, [activeInvoice, activeModalNews, isAuthModalOpen, activeTab]);

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
  // FAVORITES PERSISTENCE WITH DEVICE LOCK (@capacitor/preferences)
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
  // SUPABASE AUTHENTICATION HANDLERS
  // ==========================================================================

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthError('Заполните Email и пароль');
      return;
    }

    if (authPassword.length < 6) {
      setAuthError('Пароль должен содержать не менее 6 символов');
      return;
    }

    setIsAuthProcessing(true);
    try {
      if (authMode === 'login') {
        const user = await loginWithEmail(authEmail, authPassword);
        setCurrentUser(user);
        setUserProfile((prev) => ({
          ...prev,
          displayName: user.displayName || prev.displayName
        }));
        showToast(`С возвращением, ${user.displayName || 'Игрок'}!`);
      } else {
        const user = await registerWithEmail(authEmail, authPassword, authDisplayName);
        setCurrentUser(user);
        setUserProfile((prev) => ({
          ...prev,
          displayName: user.displayName || prev.displayName
        }));
        showToast('Регистрация в Supabase успешна!');
      }

      setIsAuthModalOpen(false);
      setAuthEmail('');
      setAuthPassword('');
      setAuthDisplayName('');
    } catch (err: any) {
      setAuthError(err?.message || 'Ошибка авторизации. Проверьте данные.');
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleGuestSignIn = async () => {
    setAuthError(null);
    setIsAuthProcessing(true);
    try {
      const user = await loginAsGuest();
      setCurrentUser(user);
      setIsAuthModalOpen(false);
      showToast('Вход в гостевом режиме выполнен');
    } catch (err: any) {
      setAuthError(err?.message || 'Не удалось выполнить гостевой вход');
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      showToast('Вы вышли из профиля');
    } catch {
      showToast('Ошибка при выходе');
    }
  };

  // ==========================================================================
  // VIP PASS: DIRECT CRYPTO PAY API INVOICING & SUPABASE CLOUD VALIDATION
  // ==========================================================================

  const handleInitiateVipPurchase = async () => {
    setIsProcessingPayment(true);
    try {
      let currentDeviceId = deviceId;
      if (!currentDeviceId) {
        currentDeviceId = await getHardwareDeviceId();
        setDeviceId(currentDeviceId);
      }

      const activeUserId = currentUser?.id || currentUser?.uid || currentDeviceId;

      showToast('Формируем прямой счет в Crypto Pay...');
      const res = await safeFetchJson<{
        ok: boolean;
        result?: CryptoInvoice;
        error?: any;
      }>('/api/cryptobot/createInvoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          asset: 'USDT',
          amount: '2.99',
          description: 'GTA 6 Leonida - Пожизненный VIP Pass',
          payload: JSON.stringify({
            userId: activeUserId,
            deviceId: currentDeviceId
          })
        })
      });

      if (res.ok && res.data?.result) {
        const inv = res.data.result;
        setActiveInvoice(inv);
        const orderData: PendingVipOrder = {
          invoiceId: inv.invoice_id,
          amount: inv.amount,
          asset: inv.asset,
          payUrl: inv.bot_invoice_url || inv.pay_url,
          status: 'created',
          createdAt: new Date().toISOString()
        };
        setPendingOrder(orderData);
        await savePendingVipOrder(orderData);

        setInvoiceFeedback({
          status: 'idle',
          message: 'Счет на 2.99 USDT сформирован. Оплатите через шлюз Crypto Pay.'
        });
        showToast('Счет в Crypto Pay успешно создан!');

        // Direct payment redirect to Crypto Pay gateway
        const payLink = inv.bot_invoice_url || inv.pay_url;
        if (payLink) {
          openExternalUrl(payLink);
        }
      } else {
        showToast('Не удалось сформировать счет в Crypto Pay');
      }
    } catch {
      showToast('Ошибка обращения к шлюзу Crypto Pay');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCopyDeviceId = async () => {
    try {
      const currentDeviceId = deviceId || (await getHardwareDeviceId());
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentDeviceId);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentDeviceId;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Device ID скопирован в буфер!');
    } catch {
      showToast('Не удалось скопировать Device ID');
    }
  };

  const handleCheckSupabaseVip = async (isManual = true) => {
    if (isManual) setIsCheckingSupabaseVip(true);
    try {
      const currentDeviceId = deviceId || (await getHardwareDeviceId());
      const queryId = currentUser?.id || currentUser?.uid || currentDeviceId;
      const res = await checkSupabaseVipStatus(queryId, 5000);

      if (res.isVip) {
        setIsVip(true);
        const updatedProfile: DeviceProfile = {
          ...userProfile,
          isVip: true,
          statusText: 'VIP Игрок ⚡',
          vipVerifiedAt: new Date().toISOString()
        };
        setUserProfile(updatedProfile);

        // Save in @capacitor/preferences
        await saveVipStatus(true, {
          invoiceId: res.rawData?.vip_invoice_id || res.rawData?.invoice_id || Math.floor(Date.now() / 1000),
          amount: '2.99',
          asset: 'CRYPTO_PAY',
          verifiedAt: new Date().toISOString()
        });
        await saveDeviceProfile(updatedProfile);

        const targetUid = currentUser?.id || currentUser?.uid;
        if (targetUid) {
          await saveUserCloudData(targetUid, {
            isVip: true,
            vipAmount: '2.99',
            vipAsset: 'CRYPTO_PAY'
          });
        }

        if (isManual) {
          showToast('VIP статус успешно подтвержден в Supabase! ⚡');
        }
      } else if (isManual) {
        if (res.source === 'offline_timeout') {
          showToast('Таймаут соединения с Supabase (нет интернета)');
        } else {
          showToast('Активная подписка не найдена в базе данных Supabase');
        }
      }
    } catch {
      if (isManual) {
        showToast('Не удалось проверить статус в Supabase');
      }
    } finally {
      if (isManual) {
        setIsCheckingSupabaseVip(false);
      }
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
      const targetUserId = currentUser?.id || currentUser?.uid;

      // 1. Check via server activation endpoint
      let isPaid = false;
      const verifyRes = await safeFetchJson<{
        ok: boolean;
        isPaid?: boolean;
        message?: string;
        record?: any;
      }>('/api/vip/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_id: activeInvoice.invoice_id,
          userId: targetUserId,
          deviceId
        })
      });

      if (verifyRes.ok && verifyRes.data?.isPaid) {
        isPaid = true;
      } else {
        // Fallback: direct check of Crypto Pay invoices
        const res = await safeFetchJson(`/api/cryptobot/getInvoices?invoice_ids=${activeInvoice.invoice_id}`);
        if (res.ok && res.data?.ok && Array.isArray(res.data.result?.items) && res.data.result.items.length > 0) {
          const item = res.data.result.items[0];
          if (item.status === 'paid') {
            isPaid = true;
          }
        }
      }

      if (isPaid) {
        // 1. Immediate UI unlock
        setIsVip(true);
        const updatedProfile: DeviceProfile = {
          ...userProfile,
          isVip: true,
          statusText: 'VIP Игрок ⚡',
          vipInvoiceId: activeInvoice.invoice_id,
          vipAmount: activeInvoice.amount,
          vipAsset: activeInvoice.asset,
          vipVerifiedAt: new Date().toISOString()
        };
        setUserProfile(updatedProfile);

        // 2. Persistent storage in Capacitor Preferences + localStorage
        await saveVipStatus(true, {
          invoiceId: activeInvoice.invoice_id,
          amount: activeInvoice.amount,
          asset: activeInvoice.asset,
          verifiedAt: new Date().toISOString()
        });
        await saveDeviceProfile(updatedProfile);

        // 3. Supabase Cloud Sync (Auth user_metadata + profiles table)
        const cloudUserId = targetUserId || deviceId;
        try {
          await saveUserCloudData(cloudUserId, {
            isVip: true,
            vipInvoiceId: activeInvoice.invoice_id,
            vipAmount: activeInvoice.amount,
            vipAsset: activeInvoice.asset,
            vipVerifiedAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('saveUserCloudData error:', err);
        }

        try {
          await supabase.auth.updateUser({
            data: {
              is_vip: true,
              vip_active: true,
              vip_invoice_id: activeInvoice.invoice_id,
              vip_amount: activeInvoice.amount,
              vip_asset: activeInvoice.asset,
              vip_verified_at: new Date().toISOString()
            }
          });
        } catch {
          // ignore
        }

        setInvoiceFeedback({
          status: 'paid',
          message: 'Транзакция 2.99 USDT подтверждена! Пожизненный VIP Pass успешно активирован.'
        });
        showToast('Оплата подтверждена! Пожизненный VIP Pass активирован!');
        setPendingOrder(null);
        await savePendingVipOrder(null);
        setTimeout(() => setActiveInvoice(null), 2500);
      } else {
        const timeNow = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (pendingOrder) {
          const updated: PendingVipOrder = {
            ...pendingOrder,
            status: 'unpaid',
            lastCheckedAt: timeNow
          };
          setPendingOrder(updated);
          await savePendingVipOrder(updated);
        }
        setInvoiceFeedback({
          status: 'unpaid',
          message: `Оплата не поступила! Завершите перевод 2.99 USDT через шлюз Crypto Pay.`
        });
        showToast('Оплата пока не обнаружена в Crypto Pay');
      }
    } catch {
      setInvoiceFeedback({
        status: 'error',
        message: 'Не удалось проверить статус счета. Проверьте интернет или повторите позже.'
      });
      showToast('Ошибка проверки счета');
    } finally {
      setIsCheckingInvoice(false);
    }
  };

  // Profile Action: Verify status of pending order directly
  const handleCheckPendingOrder = async () => {
    if (!pendingOrder) return;
    setIsCheckingInvoice(true);
    setPendingOrder((prev) => (prev ? { ...prev, status: 'checking' } : null));

    try {
      const targetUserId = currentUser?.id || currentUser?.uid;
      const verifyRes = await safeFetchJson<{
        ok: boolean;
        isPaid?: boolean;
        message?: string;
        record?: any;
      }>('/api/vip/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_id: pendingOrder.invoiceId,
          userId: targetUserId,
          deviceId
        })
      });

      let isPaid = false;
      if (verifyRes.ok && verifyRes.data?.isPaid) {
        isPaid = true;
      } else {
        const res = await safeFetchJson(`/api/cryptobot/getInvoices?invoice_ids=${pendingOrder.invoiceId}`);
        if (res.ok && res.data?.ok && Array.isArray(res.data.result?.items) && res.data.result.items.length > 0) {
          if (res.data.result.items[0].status === 'paid') {
            isPaid = true;
          }
        }
      }

      if (isPaid) {
        setIsVip(true);
        const updatedProfile: DeviceProfile = {
          ...userProfile,
          isVip: true,
          statusText: 'VIP Игрок ⚡',
          vipInvoiceId: pendingOrder.invoiceId,
          vipAmount: pendingOrder.amount,
          vipAsset: pendingOrder.asset,
          vipVerifiedAt: new Date().toISOString()
        };
        setUserProfile(updatedProfile);

        await saveVipStatus(true, {
          invoiceId: pendingOrder.invoiceId,
          amount: pendingOrder.amount,
          asset: pendingOrder.asset,
          verifiedAt: new Date().toISOString()
        });
        await saveDeviceProfile(updatedProfile);
        await savePendingVipOrder(null);
        setPendingOrder(null);
        showToast('Оплата подтверждена! Пожизненный VIP Pass активирован!');
      } else {
        const timeNow = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const updated: PendingVipOrder = {
          ...pendingOrder,
          status: 'unpaid',
          lastCheckedAt: timeNow
        };
        setPendingOrder(updated);
        await savePendingVipOrder(updated);
        showToast(`Платеж не найден (${timeNow}). Подождите подтверждения сети.`);
      }
    } catch {
      showToast('Ошибка при проверке счета');
    } finally {
      setIsCheckingInvoice(false);
    }
  };

  const handleCancelPendingOrder = async () => {
    setPendingOrder(null);
    await savePendingVipOrder(null);
    showToast('Счет сброшен. Вы можете сформировать новый.');
  };

  // Automatic live polling for payment confirmation (for open modal OR pending profile order)
  useEffect(() => {
    const targetInvoiceId = activeInvoice?.invoice_id || pendingOrder?.invoiceId;
    if (!targetInvoiceId || isVip) return;

    const interval = setInterval(async () => {
      try {
        const res = await safeFetchJson<{
          ok: boolean;
          result?: { items?: Array<{ status: string }> };
        }>(`/api/cryptobot/getInvoices?invoice_ids=${targetInvoiceId}`);

        if (res.ok && res.data?.result?.items?.[0]?.status === 'paid') {
          handleVerifyAndActivateInvoice();
        }
      } catch {
        // silent polling catch
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [activeInvoice?.invoice_id, pendingOrder?.invoiceId, isVip]);

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
  // FILTERED CHEATS & NEWS
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

  const filteredNews = useMemo(() => {
    return newsList.filter((item) => {
      if (newsCategory !== 'Все' && item.tag !== newsCategory) {
        return false;
      }

      if (newsSearch.trim()) {
        const query = newsSearch.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSummary = item.summary.toLowerCase().includes(query);
        return matchesTitle || matchesSummary;
      }

      return true;
    });
  }, [newsCategory, newsSearch, newsList]);

  const totalNewsPages = Math.ceil(filteredNews.length / NEWS_PER_PAGE);
  const pagedNews = filteredNews.slice((newsPage - 1) * NEWS_PER_PAGE, newsPage * NEWS_PER_PAGE);

  const savedCheatItems = useMemo(() => {
    return GTA_CHEATS.filter((c) => favoriteCheats.includes(c.id));
  }, [favoriteCheats]);

  const savedNewsItems = useMemo(() => {
    return newsList.filter((n) => favoriteNews.includes(n.id));
  }, [favoriteNews, newsList]);

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
                <span>Штат Леонида • Вайс-Сити</span>
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
        {/* TAB 1: ТАЙМЕР РЕЛИЗА (COUNTDOWN) */}
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

                {/* Animated Countdown Slots */}
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
                  {isVip ? 'Все коды открыты' : 'Только в Leonida VIP'}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('news')}
                className="p-3.5 rounded-2xl bg-[#121217] border border-white/[0.08] hover:border-[#D4FF00]/40 transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-bold text-[#D4FF00] mb-0.5">
                  <div className="flex items-center space-x-1.5">
                    <Play className="w-4 h-4 fill-[#D4FF00]" />
                    <span>Новости</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </div>
                <p className="text-[11px] text-neutral-400">
                  4K Видео и статьи
                </p>
              </button>
            </div>
          </main>
        )}

        {/* ================================================================== */}
        {/* TAB 2: ЧИТ-КОДЫ (ОТКРЫТЫ ТОЛЬКО ПОСЛЕ VIP) */}
        {/* ================================================================== */}
        {activeTab === 'cheats' && (
          <main className="flex-1 p-4 space-y-4 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-display font-black text-white">
                  Чит-коды GTA VI
                </h1>
                {isVip && (
                  <span className="text-[10px] font-extrabold uppercase bg-[#D4FF00] text-black px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(212,255,0,0.3)]">
                    VIP Открыто
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {isVip
                  ? 'Все читы разблокированы в вашем Leonida VIP Pass'
                  : 'Читы заблокированы и видны только владельцам Leonida VIP Pass'}
              </p>
            </div>

            {/* VIP Lock Banner when not VIP */}
            {!isVip && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#161a10] to-[#0e100c] border border-[#D4FF00]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(212,255,0,0.1)] relative overflow-hidden">
                <div className="flex items-center space-x-3 relative z-10">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#D4FF00] to-[#A3E635] flex items-center justify-center text-black shadow-[0_0_15px_rgba(212,255,0,0.35)] shrink-0">
                    <Lock className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-black text-white flex items-center space-x-2">
                      <span>Доступ закрыт</span>
                      <span className="text-[10px] bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40 px-2 py-0.5 rounded-full font-bold">
                        Требуется VIP
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Чит-коды видны только после активации Leonida VIP Pass
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleInitiateVipPurchase}
                  className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] hover:from-[#e5ff4d] hover:to-[#bbf746] text-black font-display font-extrabold text-xs flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(212,255,0,0.35)] transition-all shrink-0 cursor-pointer relative z-10"
                >
                  <Crown className="w-4 h-4 fill-black text-black" />
                  <span>Купить VIP за $2.99</span>
                </button>
              </div>
            )}

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
                      ? 'Нажмите на значок закладки у любого чита, чтобы добавить его сюда.'
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
                        {isVip ? (
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
                          <div
                            onClick={handleInitiateVipPurchase}
                            className="bg-[#09090d] border border-white/[0.06] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-[#D4FF00]/40 transition-colors group"
                            title="Нажмите, чтобы разблокировать в VIP"
                          >
                            <div className="flex items-center space-x-2">
                              <Lock className="w-4 h-4 text-neutral-500 group-hover:text-[#D4FF00] transition-colors" />
                              <span className="font-mono text-xs text-neutral-500 tracking-widest select-none">
                                • • • • • • • • • •
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-[#D4FF00] group-hover:underline flex items-center space-x-1">
                              <span>Только в VIP</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Copy or Unlock Action Button */}
                      <div className="flex justify-end pt-0.5">
                        {isVip ? (
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
                        ) : (
                          <button
                            type="button"
                            onClick={handleInitiateVipPurchase}
                            className="text-[11px] font-bold py-1.5 px-3 rounded-xl bg-[#D4FF00]/10 hover:bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/30 flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm hover:border-[#D4FF00]/60"
                          >
                            <Crown className="w-3.5 h-3.5 fill-[#D4FF00]" />
                            <span>Разблокировать чит</span>
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
        {/* TAB 3: НОВОСТИ И 4K ВИДЕО */}
        {/* ================================================================== */}
        {activeTab === 'news' && (
          <main className="flex-1 p-4 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display font-black text-white">
                  Новости GTA VI
                </h1>
                <div className="flex items-center space-x-1.5 text-xs text-neutral-400 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF00]" />
                  <span>{lastNewsSyncText}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => syncNewsFromNetwork(true)}
                disabled={isSyncingNews}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                title="Обновить ленту"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#D4FF00] ${isSyncingNews ? 'animate-spin' : ''}`} />
                <span>{isSyncingNews ? 'Синхронизация...' : 'Обновить'}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={newsSearch}
                onChange={(e) => {
                  setCheatNewsSearch(e.target.value);
                  setNewsPage(1);
                }}
                placeholder="Поиск по статьям и трейлерам..."
                className="w-full bg-[#121217] border border-white/[0.08] focus:border-[#D4FF00]/50 rounded-2xl pl-10 pr-9 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
              />
              {newsSearch && (
                <button
                  type="button"
                  onClick={() => setCheatNewsSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
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
        {/* TAB 4: ЧИСТЫЙ И МИНИМАЛИСТИЧНЫЙ ПРОФИЛЬ */}
        {/* 1) Шапка профиля: Аватар "Игрок Leonida" и статус */}
        {/* 2) Карточка VIP Pass (рабочая) */}
        {/* 3) Блок "Сохраненные читы" */}
        {/* 4) Блок "Избранные новости" */}
        {/* ================================================================== */}
        {activeTab === 'profile' && (
          <main className="flex-1 p-4 space-y-5 animate-in fade-in duration-150">
            {/* 1. ШАПКА ПРОФИЛЯ */}
            <div className="p-5 rounded-3xl bg-[#121217] border border-white/[0.08] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4 min-w-0">
                <img
                  src={userProfile.avatarUrl || DEFAULT_AVATAR}
                  alt={userProfile.displayName || 'Игрок Leonida'}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4FF00] shadow-[0_0_15px_rgba(212,255,0,0.25)] shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-display font-bold text-white truncate">
                      {currentUser?.displayName || userProfile.displayName || 'Игрок Leonida'}
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
                      {currentUser
                        ? currentUser.email || 'Анонимный аккаунт Supabase'
                        : isVip ? 'Пожизненный VIP Pass (Гость)' : 'Гостевой режим'}
                    </p>
                  </div>

                  {currentUser ? (
                    <div className="text-[10px] text-neutral-500 font-mono mt-1 truncate">
                      UUID: {currentUser.id.slice(0, 18)}...
                    </div>
                  ) : deviceId ? (
                    <div className="text-[10px] text-neutral-500 font-mono mt-1 truncate flex items-center space-x-1">
                      <Cpu className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">Device ID: {deviceId.slice(0, 16)}...</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Auth Action Button */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                {currentUser ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="px-3.5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-400" />
                    <span>Выйти</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] hover:from-[#e5ff4d] hover:to-[#bbf746] text-black font-display font-extrabold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-black" />
                    <span>Войти / Регистрация</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2. КАРТОЧКА VIP PASS */}
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
                        ? 'Пожизненный статус привязан к вашему аккаунту и Supabase'
                        : 'Эксклюзивный доступ ко всем читам и поддержка разработки'}
                    </p>
                  </div>
                </div>
              </div>

              {isVip ? (
                <div className="space-y-2.5 relative z-10">
                  <div className="p-3.5 rounded-2xl bg-[#D4FF00]/10 border border-[#D4FF00]/30 flex items-center space-x-3">
                    <ShieldCheck className="w-5 h-5 text-[#D4FF00] shrink-0" />
                    <div className="text-xs text-neutral-200">
                      <span className="font-bold text-[#D4FF00]">VIP Pass Активен:</span> Лицензия подтверждена через базу данных Supabase и сохранена на устройстве.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCheckSupabaseVip(true)}
                    disabled={isCheckingSupabaseVip}
                    className="w-full py-2 px-3 rounded-xl bg-black/40 hover:bg-black/60 border border-white/[0.08] text-neutral-400 hover:text-neutral-200 text-[11px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingSupabaseVip ? 'animate-spin text-[#D4FF00]' : ''}`} />
                    <span>{isCheckingSupabaseVip ? 'Синхронизация...' : 'Синхронизировать статус с Supabase'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1 relative z-10">
                  {/* ВИЗУАЛЬНЫЙ ИНДИКАТОР СТАТУСА ПЛАТЕЖА */}
                  {pendingOrder && (
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        pendingOrder.status === 'unpaid'
                          ? 'bg-[#181112] border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
                          : 'bg-[#151910] border-[#D4FF00]/40 shadow-[0_0_25px_rgba(212,255,0,0.12)]'
                      } space-y-3`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              pendingOrder.status === 'unpaid'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40 shadow-[0_0_12px_rgba(212,255,0,0.2)]'
                            }`}
                          >
                            {pendingOrder.status === 'checking' || isCheckingInvoice ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-[#D4FF00]" />
                            ) : pendingOrder.status === 'unpaid' ? (
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Clock className="w-4 h-4 text-[#D4FF00] animate-pulse" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-display font-extrabold text-white">
                                {pendingOrder.status === 'unpaid'
                                  ? 'Платеж не найден'
                                  : 'Ожидает подтверждения'}
                              </span>
                              <span
                                className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full ${
                                  pendingOrder.status === 'unpaid'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/40 animate-pulse'
                                }`}
                              >
                                {pendingOrder.status === 'unpaid' ? 'Требует проверки' : 'В обработке'}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-400 mt-0.5">
                              Счет #{pendingOrder.invoiceId} • {pendingOrder.amount} {pendingOrder.asset}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-black text-[#D4FF00]">
                            {pendingOrder.amount} {pendingOrder.asset}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-300 leading-relaxed">
                        {pendingOrder.status === 'unpaid'
                          ? `Crypto Pay пока не зафиксировал перевод средств по счету #${pendingOrder.invoiceId}. Если вы уже отправили перевод, дождитесь 1-2 подтверждений сети (15-60 сек) и нажмите «Проверить платеж».`
                          : 'Счет сформирован в платежном шлюзе Crypto Pay. Перейдите к оплате или проверьте статус счета.'}
                      </p>

                      {pendingOrder.lastCheckedAt && (
                        <div className="text-[10px] text-neutral-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          <span>Время последней проверки: {pendingOrder.lastCheckedAt}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (pendingOrder.payUrl) openExternalUrl(pendingOrder.payUrl);
                          }}
                          className="flex-1 min-w-[140px] py-2 px-3 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] hover:from-[#e5ff4d] hover:to-[#bbf746] text-black font-display font-extrabold text-[11px] flex items-center justify-center space-x-1.5 transition-all shadow-md cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 fill-black text-black" />
                          <span>Оплатить в Crypto Pay</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </button>

                        <button
                          type="button"
                          onClick={handleCheckPendingOrder}
                          disabled={isCheckingInvoice}
                          className="py-2 px-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white font-display font-semibold text-[11px] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isCheckingInvoice ? 'animate-spin text-[#D4FF00]' : 'text-neutral-400'}`}
                          />
                          <span>Проверить платеж</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelPendingOrder}
                          className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-white transition-colors cursor-pointer"
                          title="Сбросить счет"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <Crown className="w-3.5 h-3.5 text-[#D4FF00]" />
                        <span>Пожизненный VIP статус</span>
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Прямая оплата через официальный шлюз Crypto Pay
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleInitiateVipPurchase}
                      disabled={isProcessingPayment}
                      className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] hover:from-[#e5ff4d] hover:to-[#bbf746] text-black font-display font-extrabold text-xs flex items-center justify-center space-x-2 shadow-[0_0_18px_rgba(212,255,0,0.3)] transition-all shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 fill-black text-black" />
                      <span>{isProcessingPayment ? 'Создание счета...' : 'Купить VIP за $2.99'}</span>
                    </button>
                  </div>

                  {/* Облачная проверка статуса через Supabase */}
                  <div className="p-3.5 rounded-2xl bg-black/30 border border-white/[0.06] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-200">
                        <Cloud className="w-3.5 h-3.5 text-[#D4FF00]" />
                        <span>Облачная проверка Supabase</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyDeviceId}
                        className="text-[10px] text-[#D4FF00] hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Скопировать Device ID</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      После подтверждения транзакции в Crypto Pay статус автоматически фиксируется в профиле Supabase. Нажмите для синхронизации:
                    </p>

                    <button
                      type="button"
                      onClick={() => handleCheckSupabaseVip(true)}
                      disabled={isCheckingSupabaseVip}
                      className="w-full py-2.5 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-neutral-200 font-display font-semibold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSupabaseVip ? 'animate-spin text-[#D4FF00]' : 'text-neutral-400'}`} />
                      <span>{isCheckingSupabaseVip ? 'Проверка в Supabase...' : 'Проверить оплату в Supabase / Crypto Pay'}</span>
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
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[#09090d]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 z-40 flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'timer' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clock className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Таймер</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cheats')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'cheats' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Gamepad2 className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Читы</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'news' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Play className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Новости</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'profile' ? 'text-[#D4FF00]' : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-[11px] font-bold">Профиль</span>
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

                {/* Video Player */}
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
                          src={activeModalNews.image}
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

                {/* Content Paragraphs */}
                <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
                  {activeModalNews.content.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>

                {/* Key Facts */}
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
        {/* MODAL: SUPABASE AUTHENTICATION (LOGIN / REGISTER / GUEST) */}
        {/* ================================================================== */}
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4">
            <div className="w-full max-w-sm bg-[#0e110d] border border-white/[0.12] rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4FF00] to-[#A3E635] flex items-center justify-center text-black shadow-md">
                    {authMode === 'login' ? <LogIn className="w-4 h-4 text-black" /> : <UserPlus className="w-4 h-4 text-black" />}
                  </div>
                  <div>
                    <div className="font-display font-bold text-xs tracking-wider text-white">
                      {authMode === 'login' ? 'Вход в аккаунт' : 'Регистрация'}
                    </div>
                    <p className="text-[10px] text-neutral-400">Облачный профиль Supabase Auth</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs Switcher */}
              <div className="flex p-1 bg-black/50 border border-white/[0.08] rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-[#D4FF00] text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Вход
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setAuthError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-[#D4FF00] text-black shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Регистрация
                </button>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start space-x-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {authMode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Позывной / Имя</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Например: Tommy_Leonida"
                        value={authDisplayName}
                        onChange={(e) => setAuthDisplayName(e.target.value)}
                        className="w-full bg-black/60 border border-white/[0.12] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Email адрес</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="player@leonida.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-black/60 border border-white/[0.12] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Пароль (от 6 символов)</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-black/60 border border-white/[0.12] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D4FF00]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAuthProcessing}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] text-black font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isAuthProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  ) : authMode === 'login' ? (
                    <>
                      <LogIn className="w-4 h-4 text-black" />
                      <span>Войти в аккаунт</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-black" />
                      <span>Создать аккаунт</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-white/[0.08]" />
                <span className="flex-shrink mx-2 text-[10px] text-neutral-500 uppercase font-bold">или</span>
                <div className="flex-grow border-t border-white/[0.08]" />
              </div>

              <button
                type="button"
                onClick={handleGuestSignIn}
                disabled={isAuthProcessing}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Smartphone className="w-3.5 h-3.5 text-neutral-400" />
                <span>Продолжить в гостевом режиме</span>
              </button>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: CRYPTO PAY INVOICE (DIRECT CRYPTO BOT GATEWAY) */}
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
                      Crypto Pay (Crypto Bot)
                    </div>
                    <p className="text-[10px] text-neutral-400">Прямой платежный шлюз Crypto Pay API</p>
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

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => openExternalUrl(activeInvoice.bot_invoice_url || activeInvoice.pay_url)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4FF00] to-[#A3E635] text-black font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4 fill-black text-black shrink-0" />
                  <span>1. Перейти к оплате в Crypto Pay</span>
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
