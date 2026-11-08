import React, { useState, useEffect, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  useFonts,
  Vazirmatn_400Regular,
  Vazirmatn_600SemiBold,
  Vazirmatn_700Bold,
  Vazirmatn_800ExtraBold,
} from '@expo-google-fonts/vazirmatn';

const RATE_STORAGE_KEY = '@chand_mishe_usd_rate';
const THEME_STORAGE_KEY = '@chand_mishe_theme';
const LANG_STORAGE_KEY = '@chand_mishe_lang';
const HISTORY_STORAGE_KEY = '@chand_mishe_history';

const CURRENT_APP_VERSION = '1.0.1';
const UPDATE_CHECK_URL = 'https://raw.githubusercontent.com/AmirNrfox/Chand-Mishe/main/version.json';
const GITHUB_RELEASES_API = 'https://api.github.com/repos/AmirNrfox/Chand-Mishe/releases/latest';

type Language = 'fa' | 'en';

type UpdateInfo = {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  directApkUrl?: string;
};

const translations = {
  fa: {
    appTitle: 'چند میشه؟',
    appSubtitle: 'محاسبه گر قیمت دلار و تومان',
    rateLabel: 'نرخ ۱ دلار یا تتر:',
    rateUnit: 'تومان',
    fetchLiveRate: 'دریافت نرخ تتر',
    fetchingRate: 'در حال دریافت...',
    rateFetchError: 'خطا در دریافت نرخ تتر',
    cooldownWait: 'ثانیه صبر',
    inputTag: 'ورودی',
    usdTitle: 'مبلغ به دلار',
    tomanTitle: 'مبلغ به تومان',
    usdPlaceholder: '0.5 یا 19.99',
    tomanPlaceholder: '1,000,000',
    copiedText: 'کپی شد!',
    copyBtn: 'کپی',
    quickTitle: 'مبالغ خرد و پرکاربرد:',
    historyTitle: 'آخرین محاسبات:',
    symbolToman: 'ت',
    usdUnit: 'دلار',
    appVersion: 'نسخه ۱.۰.۱',
    aboutTitle: 'درباره برنامه',
    aboutDesc: 'ابزاری سبک و سریع برای محاسبه قیمت خرید های دلاری شما به تومان یا بالعکس بر اساس نرخ آنلاین یا دستی',
    devBy: 'طراحی و توسعه توسط امیرعلی نظری',
    footerDevPrefix: 'طراحی و توسعه توسط',
    authorName: 'امیرعلی نظری',
    githubBtn: 'گیت هاب',
    telegramBtn: 'تلگرام',
    emailBtn: 'ایمیل',
    closeModal: 'بستن',
    checkUpdateBtn: 'بررسی نسخه جدید',
    checkingUpdate: 'در حال بررسی...',
    upToDateMsg: 'شما از آخرین نسخه برنامه استفاده می کنید.',
    updateDialogTitle: 'نسخه جدید موجود است!',
    updateAvailableDesc: 'نسخه جدیدی از برنامه منتشر شده است. آیا مایلید آن را دانلود و نصب کنید؟',
    updateNotesLabel: 'تغییرات نسخه جدید:',
    downloadUpdateBtn: 'دانلود و نصب مستقیم',
    downloadingUpdate: 'در حال دانلود فایل نصب...',
    downloadCompleteMsg: 'فایل نصب با موفقیت دانلود شد. برای شروع، روی دکمه نصب ضربه بزنید.',
    installUpdateBtn: 'نصب نسخه جدید',
    downloadViaBrowserBtn: 'دانلود از طریق مرورگر',
    downloadFailedMsg: 'خطا در دانلود خودکار. می‌توانید فایل را مستقیم از مرورگر دانلود کنید.',
    cancelDownload: 'انصراف',
    retryDownload: 'تلاش مجدد',
    updateLaterBtn: 'بعداً',
    newVersionBadge: 'جدید',
  },
  en: {
    appTitle: 'Chand Mishe?',
    appSubtitle: 'USD & Toman Price Converter',
    rateLabel: '1 USD / USDT Rate:',
    rateUnit: 'Toman',
    fetchLiveRate: 'Get USDT Rate',
    fetchingRate: 'Fetching...',
    rateFetchError: 'Failed to fetch USDT rate',
    cooldownWait: 's wait',
    inputTag: 'INPUT',
    usdTitle: 'Amount in USD',
    tomanTitle: 'Amount in Toman',
    usdPlaceholder: '0.5 or 19.99',
    tomanPlaceholder: '1,000,000',
    copiedText: 'Copied!',
    copyBtn: 'Copy',
    quickTitle: 'Quick Micro-Amounts:',
    historyTitle: 'Recent Conversions:',
    symbolToman: 'TM',
    usdUnit: 'USD',
    appVersion: 'Version 1.0.1',
    aboutTitle: 'About App',
    aboutDesc: 'A lightweight and fast tool to calculate your USD purchase prices in Toman or vice versa based on live or custom rates',
    devBy: 'Designed and Developed by AmirAli Nazari',
    footerDevPrefix: 'Designed and developed by',
    authorName: 'AmirAli Nazari',
    githubBtn: 'GitHub',
    telegramBtn: 'Telegram',
    emailBtn: 'Email',
    closeModal: 'Close',
    checkUpdateBtn: 'Check for Updates',
    checkingUpdate: 'Checking...',
    upToDateMsg: 'You are using the latest version.',
    updateDialogTitle: 'Update Available!',
    updateAvailableDesc: 'A newer version of Chand Mishe is available. Would you like to download and install it?',
    updateNotesLabel: 'Release Notes:',
    downloadUpdateBtn: 'Download & Install',
    downloadingUpdate: 'Downloading update file...',
    downloadCompleteMsg: 'Download complete! Tap Install to continue.',
    installUpdateBtn: 'Install Update Now',
    downloadViaBrowserBtn: 'Download via Browser',
    downloadFailedMsg: 'Direct download failed. You can download via your browser.',
    cancelDownload: 'Cancel',
    retryDownload: 'Retry',
    updateLaterBtn: 'Later',
    newVersionBadge: 'NEW',
  },
};

const themes = {
  dark: {
    bg: '#080C14',
    headerGradients: ['#1E1B4B', '#0F172A', '#080C14'] as const,
    headerBorder: '#1E293B',
    logoGradients: ['#38BDF8', '#6366F1'] as const,
    swapGradients: ['#38BDF8', '#6366F1'] as const,
    card: '#111827',
    cardBorder: '#1F2937',
    cardInner: '#0D1320',
    textMain: '#F9FAFB',
    textSub: '#9CA3AF',
    textMuted: '#6B7280',
    primary: '#60A5FA',
    primaryBg: 'rgba(96, 165, 250, 0.16)',
    accentGreen: '#34D399',
    accentGreenBg: 'rgba(52, 211, 153, 0.16)',
    inputBorder: '#374151',
    activeBorder: '#60A5FA',
    chipBg: '#1E293B',
    chipBorder: '#334155',
    chipText: '#F3F4F6',
    divider: '#1F2937',
    iconBtnBg: '#1E293B',
    headerBtnBg: 'rgba(255, 255, 255, 0.08)',
    headerBtnBorder: 'rgba(255, 255, 255, 0.15)',
    statusBar: 'light' as const,
  },
  light: {
    bg: '#EEF2F6',
    headerGradients: ['#E0E7FF', '#EEF2FF', '#F1F5F9'] as const,
    headerBorder: '#CBD5E1',
    logoGradients: ['#4F46E5', '#06B6D4'] as const,
    swapGradients: ['#4F46E5', '#0284C7'] as const,
    card: '#FFFFFF',
    cardBorder: '#D8E2EC',
    cardInner: '#F8FAFC',
    textMain: '#0F172A',
    textSub: '#334155',
    textMuted: '#64748B',
    primary: '#4F46E5',
    primaryBg: '#EEF2FF',
    accentGreen: '#0D9488',
    accentGreenBg: '#CCFBF1',
    inputBorder: '#CBD5E1',
    activeBorder: '#4F46E5',
    chipBg: '#F1F5F9',
    chipBorder: '#E2E8F0',
    chipText: '#1E293B',
    divider: '#E2E8F0',
    iconBtnBg: '#F1F5F9',
    headerBtnBg: 'rgba(255, 255, 255, 0.65)',
    headerBtnBorder: 'rgba(148, 163, 184, 0.35)',
    statusBar: 'dark' as const,
  },
};

const cleanDigits = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/٫/g, '.')
    .replace(/,/g, '');
};

const formatIntegerWithCommas = (str: string): string => {
  const digits = cleanDigits(str).replace(/[^0-9]/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const formatWithCommas = (num: number, maxDecimals: number = 2): string => {
  if (isNaN(num)) return '';
  const parts = num.toFixed(maxDecimals).replace(/\.?0+$/, '').split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const fetchWithTimeout = async (url: string, timeoutMs: number = 6000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
};

const isNewerVersion = (latest: string, current: string): boolean => {
  const lParts = latest.replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
  const cParts = current.replace(/[^0-9.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(lParts.length, cParts.length);
  for (let i = 0; i < maxLen; i++) {
    const l = lParts[i] || 0;
    const c = cParts[i] || 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
};

const toFaDigits = (str: string | number): string => {
  return String(str).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
};

const getTargetArch = (): string => {
  if (Platform.OS !== 'android') return 'universal';
  try {
    const abis: string[] = (Platform.constants as any)?.SupportedABIs || [];
    if (abis.some((a) => a.includes('arm64'))) return 'arm64-v8a';
    if (abis.some((a) => a.includes('v7a') || a.includes('armeabi'))) return 'armeabi-v7a';
  } catch (e) {}
  return 'arm64-v8a';
};

export default function App() {
  const [fontsLoaded] = useFonts({
    VazirRegular: Vazirmatn_400Regular,
    VazirSemiBold: Vazirmatn_600SemiBold,
    VazirBold: Vazirmatn_700Bold,
    VazirBlack: Vazirmatn_800ExtraBold,
  });

  const [isDark, setIsDark] = useState<boolean>(true);
  const [lang, setLang] = useState<Language>('fa');
  const [rateText, setRateText] = useState<string>('');
  const [usdInput, setUsdInput] = useState<string>('');
  const [tomanInput, setTomanInput] = useState<string>('');
  const [direction, setDirection] = useState<'USD_TO_TOMAN' | 'TOMAN_TO_USD'>('USD_TO_TOMAN');
  const [history, setHistory] = useState<Array<{ id: string; usd: string; toman: string }>>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [rateStatusMessage, setRateStatusMessage] = useState<string>('');
  const [rateStatusType, setRateStatusType] = useState<'success' | 'error'>('success');

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState<boolean>(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState<boolean>(false);
  const [updateStatusFeedback, setUpdateStatusFeedback] = useState<string>('');

  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed' | 'error'>('idle');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadedSizeStr, setDownloadedSizeStr] = useState<string>('0 MB');
  const [totalSizeStr, setTotalSizeStr] = useState<string>('13.8 MB');
  const [downloadedApkUri, setDownloadedApkUri] = useState<string | null>(null);
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(null);

  const t = isDark ? themes.dark : themes.light;
  const tr = translations[lang];
  const isRTL = lang === 'fa';
  const fontRegular = fontsLoaded ? { fontFamily: 'VazirRegular' } : {};
  const fontSemiBold = fontsLoaded ? { fontFamily: 'VazirSemiBold' } : {};
  const fontBold = fontsLoaded ? { fontFamily: 'VazirBold' } : {};
  const fontBlack = fontsLoaded ? { fontFamily: 'VazirBlack' } : {};

  useEffect(() => {
    loadSavedData();
    const updateTimer = setTimeout(() => {
      checkForUpdates(false);
    }, 1500);
    return () => clearTimeout(updateTimer);
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const loadSavedData = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) setIsDark(savedTheme === 'dark');

      const savedLang = (await AsyncStorage.getItem(LANG_STORAGE_KEY)) as Language | null;
      if (savedLang) setLang(savedLang);

      const savedRate = await AsyncStorage.getItem(RATE_STORAGE_KEY);
      if (savedRate) {
        setRateText(formatIntegerWithCommas(savedRate));
      }

      const savedHist = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHist) setHistory(JSON.parse(savedHist));
    } catch (e) {
      console.error('Error loading data', e);
    }
  };

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
  };

  const toggleLang = async () => {
    const next: Language = lang === 'fa' ? 'en' : 'fa';
    setLang(next);
    await AsyncStorage.setItem(LANG_STORAGE_KEY, next);
  };

  const getRateNumber = (): number => {
    const n = parseFloat(cleanDigits(rateText));
    return isNaN(n) || n <= 0 ? 0 : n;
  };

  const handleRateChange = async (val: string) => {
    const raw = cleanDigits(val).replace(/[^0-9]/g, '');
    const formatted = formatIntegerWithCommas(raw);
    setRateText(formatted);
    if (raw) {
      await AsyncStorage.setItem(RATE_STORAGE_KEY, raw);
    } else {
      await AsyncStorage.removeItem(RATE_STORAGE_KEY);
    }

    const r = parseFloat(raw);
    if (!isNaN(r) && r > 0) {
      if (direction === 'USD_TO_TOMAN' && usdInput) {
        calcFromUsd(usdInput, r, false);
      } else if (direction === 'TOMAN_TO_USD' && tomanInput) {
        calcFromToman(tomanInput, r, false);
      }
    } else {
      if (direction === 'USD_TO_TOMAN') {
        setTomanInput('');
      } else {
        setUsdInput('');
      }
    }
  };

  const fetchLiveRate = async () => {
    if (isLoadingRate || cooldownSeconds > 0) return;

    setIsLoadingRate(true);
    setRateStatusMessage('');
    try {
      let price: number | null = null;

      // 1. Try Tetherland API
      try {
        const response = await fetchWithTimeout('https://api.tetherland.com/currencies', 6000);
        if (response.ok) {
          const json = await response.json();
          const p = json?.data?.currencies?.USDT?.price;
          if (p && typeof p === 'number' && p > 0) {
            price = p;
          }
        }
      } catch (e) {
        console.log('Tetherland fetch error / timeout:', e);
      }

      // 2. Fallback: Wallex API
      if (!price) {
        try {
          const response = await fetchWithTimeout('https://api.wallex.ir/v1/markets', 6000);
          if (response.ok) {
            const json = await response.json();
            const p = parseFloat(json?.result?.symbols?.USDTTMN?.stats?.lastPrice);
            if (!isNaN(p) && p > 0) {
              price = Math.round(p);
            }
          }
        } catch (e) {
          console.log('Wallex fetch error / timeout:', e);
        }
      }

      if (price && price > 0) {
        const priceStr = price.toString();
        await handleRateChange(priceStr);
        setRateStatusType('success');
        setCooldownSeconds(30);
        const timeStr = new Date().toLocaleTimeString(lang === 'fa' ? 'fa-IR' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        setRateStatusMessage(
          lang === 'fa'
            ? `بروزرسانی آنلاین (نرخ تتر) در ${timeStr}`
            : `Live updated (USDT rate) at ${timeStr}`
        );
      } else {
        setRateStatusType('error');
        setCooldownSeconds(10);
        setRateStatusMessage(tr.rateFetchError);
      }
    } catch (err) {
      setRateStatusType('error');
      setCooldownSeconds(10);
      setRateStatusMessage(tr.rateFetchError);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const checkForUpdates = async (manual: boolean = false) => {
    if (manual) {
      setIsCheckingUpdate(true);
      setUpdateStatusFeedback('');
    }
    try {
      let remoteVersion = '';
      let notes = '';
      let downloadUrl = 'https://github.com/AmirNrfox/Chand-Mishe/releases/latest';
      try {
        const res = await fetchWithTimeout(`${UPDATE_CHECK_URL}?t=${Date.now()}`, 5000);
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            remoteVersion = data.version;
            notes = lang === 'fa' ? (data.releaseNotes || '') : (data.releaseNotesEn || data.releaseNotes || '');
            if (data.downloadUrl) downloadUrl = data.downloadUrl;
          }
        }
      } catch (e) {
        console.log('version.json fetch error:', e);
      }
      if (!remoteVersion) {
        try {
          const res = await fetchWithTimeout(GITHUB_RELEASES_API, 5000);
          if (res.ok) {
            const data = await res.json();
            if (data && data.tag_name) {
              remoteVersion = data.tag_name.replace(/^v/, '');
              notes = data.body || '';
              if (data.assets && data.assets.length > 0 && data.assets[0].browser_download_url) {
                downloadUrl = data.assets[0].browser_download_url;
              } else if (data.html_url) {
                downloadUrl = data.html_url;
              }
            }
          }
        } catch (e) {
          console.log('GitHub releases fetch error:', e);
        }
      }

      if (remoteVersion && isNewerVersion(remoteVersion, CURRENT_APP_VERSION)) {
        const vClean = remoteVersion.replace(/^v/, '');
        const targetArch = getTargetArch();
        const directApk = `https://github.com/AmirNrfox/Chand-Mishe/releases/download/v${vClean}/Chand-Mishe-v${vClean}-${targetArch}.apk`;
        setUpdateInfo({
          version: remoteVersion,
          releaseNotes: notes,
          downloadUrl: downloadUrl || `https://github.com/AmirNrfox/Chand-Mishe/releases/tag/v${vClean}`,
          directApkUrl: directApk,
        });
        setDownloadState('idle');
        setDownloadProgress(0);
        setIsUpdateDialogOpen(true);
        if (manual) setUpdateStatusFeedback('');
      } else {
        if (manual) {
          setUpdateStatusFeedback(tr.upToDateMsg);
        }
      }
    } catch (err) {
      if (manual) {
        setUpdateStatusFeedback(tr.upToDateMsg);
      }
    } finally {
      if (manual) {
        setIsCheckingUpdate(false);
      }
    }
  };

  const handleStartDownloadOrInstall = async () => {
    if (downloadState === 'completed' && downloadedApkUri) {
      await installApk(downloadedApkUri);
      return;
    }

    if (Platform.OS !== 'android') {
      if (updateInfo?.downloadUrl) {
        Linking.openURL(updateInfo.downloadUrl);
      }
      return;
    }

    const targetVersion = updateInfo?.version || '';
    const targetArch = getTargetArch();
    const directUrl =
      updateInfo?.directApkUrl ||
      `https://github.com/AmirNrfox/Chand-Mishe/releases/download/v${targetVersion}/Chand-Mishe-v${targetVersion}-${targetArch}.apk`;
    const localFileUri = `${FileSystem.cacheDirectory}Chand-Mishe-v${targetVersion}-${targetArch}.apk`;

    try {
      const existing = await FileSystem.getInfoAsync(localFileUri);
      if (existing.exists && existing.size && existing.size > 10 * 1024 * 1024) {
        setDownloadedApkUri(localFileUri);
        setDownloadState('completed');
        await installApk(localFileUri);
        return;
      }

      setDownloadState('downloading');
      setDownloadProgress(0);
      setDownloadedSizeStr('0 MB');
      setTotalSizeStr(targetArch === 'universal' ? '18.8 MB' : '13.8 MB');

      const downloadResumable = FileSystem.createDownloadResumable(
        directUrl,
        localFileUri,
        {},
        (progressData) => {
          const total = progressData.totalBytesExpectedToWrite;
          const written = progressData.totalBytesWritten;
          if (total > 0) {
            const ratio = written / total;
            setDownloadProgress(Math.min(1, Math.max(0, ratio)));
            setDownloadedSizeStr(`${(written / (1024 * 1024)).toFixed(1)} MB`);
            setTotalSizeStr(`${(total / (1024 * 1024)).toFixed(1)} MB`);
          } else {
            setDownloadedSizeStr(`${(written / (1024 * 1024)).toFixed(1)} MB`);
          }
        }
      );
      downloadResumableRef.current = downloadResumable;

      const downloadResult = await downloadResumable.downloadAsync();
      if (downloadResult && downloadResult.uri) {
        setDownloadedApkUri(downloadResult.uri);
        setDownloadState('completed');
        setDownloadProgress(1);
        await installApk(downloadResult.uri);
      } else {
        setDownloadState('error');
      }
    } catch (err) {
      console.log('In-app download error:', err);
      setDownloadState('error');
    }
  };

  const installApk = async (apkFileUri: string) => {
    if (Platform.OS !== 'android') {
      if (updateInfo?.downloadUrl) {
        Linking.openURL(updateInfo.downloadUrl);
      }
      return;
    }
    try {
      const contentUri = await FileSystem.getContentUriAsync(apkFileUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 268435457,
        type: 'application/vnd.android.package-archive',
      });
    } catch (error) {
      console.log('Failed to start package installer intent:', error);
      if (updateInfo?.downloadUrl) {
        Linking.openURL(updateInfo.downloadUrl);
      }
    }
  };

  const handleCancelDownload = async () => {
    if (downloadResumableRef.current) {
      try {
        await downloadResumableRef.current.cancelAsync();
      } catch (e) {}
      downloadResumableRef.current = null;
    }
    setDownloadState('idle');
    setDownloadProgress(0);
  };

  const handleCloseUpdateDialog = () => {
    handleCancelDownload();
    setIsUpdateDialogOpen(false);
  };

  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commitSaveHistory = (usd: string, toman: string) => {
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }

    const cleanUsd = cleanDigits(usd).trim();
    const cleanToman = cleanDigits(toman).replace(/,/g, '').trim();

    if (!cleanUsd || !cleanToman || cleanUsd.endsWith('.')) return;

    const numUsd = parseFloat(cleanUsd);
    const numToman = parseFloat(cleanToman);

    if (isNaN(numUsd) || numUsd <= 0 || isNaN(numToman) || numToman <= 0) return;

    const formattedToman = formatWithCommas(numToman, 2);
    const item = { id: Date.now().toString(), usd: cleanUsd, toman: formattedToman };

    setHistory((prev) => {
      const filtered = prev.filter((i) => {
        const prevUsd = parseFloat(cleanDigits(i.usd));
        return Math.abs(prevUsd - numUsd) > 0.000001 && i.usd !== cleanUsd;
      }).slice(0, 29);
      const updated = [item, ...filtered];
      AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const scheduleSaveHistory = (usd: string, toman: string) => {
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }

    const cleanUsd = cleanDigits(usd).trim();
    const cleanToman = cleanDigits(toman).replace(/,/g, '').trim();

    if (
      !cleanUsd ||
      !cleanToman ||
      cleanUsd.endsWith('.') ||
      isNaN(parseFloat(cleanUsd)) ||
      parseFloat(cleanUsd) <= 0 ||
      isNaN(parseFloat(cleanToman)) ||
      parseFloat(cleanToman) <= 0
    ) {
      return;
    }

    historyDebounceRef.current = setTimeout(() => {
      commitSaveHistory(cleanUsd, cleanToman);
    }, 1000);
  };

  const calcFromUsd = (val: string, customRate?: number, save: boolean = true) => {
    const clean = cleanDigits(val);
    const rate = customRate || getRateNumber();

    if (!clean || clean === '.') {
      setTomanInput('');
      return;
    }

    const usd = parseFloat(clean);
    if (!isNaN(usd) && rate > 0) {
      const toman = usd * rate;
      const res = formatWithCommas(toman, 2);
      setTomanInput(res);
      if (save) {
        scheduleSaveHistory(clean, res);
      }
    } else {
      setTomanInput('');
    }
  };

  const handleUsdChange = (text: string) => {
    const cleaned = text
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/٫/g, '.')
      .replace(/[^0-9.]/g, '');

    const parts = cleaned.split('.');
    const val = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;

    setUsdInput(val);
    calcFromUsd(val);
  };

  const calcFromToman = (val: string, customRate?: number, save: boolean = true) => {
    const clean = cleanDigits(val);
    const rate = customRate || getRateNumber();

    if (!clean || clean === '.') {
      setUsdInput('');
      return;
    }

    const toman = parseFloat(clean);
    if (!isNaN(toman) && rate > 0) {
      const usd = toman / rate;
      const res = usd < 1 ? usd.toFixed(4).replace(/\.?0+$/, '') : usd.toFixed(2);
      setUsdInput(res);
      if (save) {
        scheduleSaveHistory(res, formatIntegerWithCommas(clean));
      }
    } else {
      setUsdInput('');
    }
  };

  const handleTomanChange = (text: string) => {
    const raw = cleanDigits(text).replace(/[^0-9]/g, '');
    const formatted = formatIntegerWithCommas(raw);
    setTomanInput(formatted);
    calcFromToman(raw);
  };

  const handleSwapDirection = () => {
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }
    setDirection((prev) => (prev === 'USD_TO_TOMAN' ? 'TOMAN_TO_USD' : 'USD_TO_TOMAN'));
  };

  const handleClear = () => {
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }
    setUsdInput('');
    setTomanInput('');
  };

  const copyResult = async (val: string, tag: string) => {
    const clean = cleanDigits(val);
    if (!clean) return;
    await Clipboard.setStringAsync(clean);
    setCopied(tag);
    setTimeout(() => setCopied(null), 1500);
  };

  const isUsdSource = direction === 'USD_TO_TOMAN';
  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]}>
      <StatusBar style={t.statusBar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <LinearGradient
          colors={t.headerGradients}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.stickyHeaderWrapper,
            { borderBottomColor: t.headerBorder },
          ]}
        >
          <View style={[styles.topBar, { flexDirection }]}>
            <View style={[styles.brandContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <View style={[styles.titleRow, { flexDirection }]}>
                <LinearGradient
                  colors={t.logoGradients}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modernAppLogoWrap}
                >
                  <MaterialCommunityIcons name="swap-horizontal-bold" size={20} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.appTitle, { color: t.textMain }, fontBlack]}>
                  {tr.appTitle}
                </Text>
              </View>
              <Text style={[styles.appSubtitle, { color: t.textSub }, fontRegular]}>
                {tr.appSubtitle}
              </Text>
            </View>
            <View style={[styles.headerActions, { flexDirection }]}>
              <TouchableOpacity
                style={[
                  styles.actionIconBtn,
                  { backgroundColor: t.headerBtnBg, borderColor: t.headerBtnBorder },
                ]}
                onPress={() => setIsAboutOpen(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={isDark ? '#A78BFA' : '#7C3AED'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionIconBtn,
                  { backgroundColor: t.headerBtnBg, borderColor: t.headerBtnBorder },
                ]}
                onPress={toggleLang}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.langText,
                    { color: isDark ? '#FFFFFF' : t.primary },
                    fontBold,
                  ]}
                >
                  {lang === 'fa' ? 'EN' : 'فا'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionIconBtn,
                  { backgroundColor: t.headerBtnBg, borderColor: t.headerBtnBorder },
                ]}
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isDark ? 'sunny' : 'moon'}
                  size={19}
                  color={isDark ? '#FACC15' : '#6366F1'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.rateCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <View style={[styles.rateHeaderRow, { flexDirection }]}>
              <View style={[styles.rateHeaderTitleWrap, { flexDirection }]}>
                <Ionicons name="trending-up-outline" size={16} color={t.primary} />
                <Text style={[styles.rateLabelText, { color: t.textSub }, fontSemiBold]}>
                  {tr.rateLabel}
                </Text>
              </View>

              <TouchableOpacity
                onPress={fetchLiveRate}
                disabled={isLoadingRate || cooldownSeconds > 0}
                activeOpacity={0.7}
                style={[
                  styles.fetchRatePill,
                  {
                    backgroundColor:
                      cooldownSeconds > 0
                        ? isDark ? 'rgba(255, 255, 255, 0.05)' : '#F1F5F9'
                        : isDark ? 'rgba(56, 189, 248, 0.12)' : '#EEF2FF',
                    borderColor:
                      cooldownSeconds > 0
                        ? isDark ? 'rgba(255, 255, 255, 0.10)' : '#E2E8F0'
                        : isDark ? 'rgba(56, 189, 248, 0.35)' : '#C7D2FE',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                {isLoadingRate ? (
                  <ActivityIndicator size="small" color={isDark ? '#38BDF8' : '#4F46E5'} />
                ) : cooldownSeconds > 0 ? (
                  <Ionicons name="time-outline" size={14} color={t.textMuted} />
                ) : (
                  <Ionicons name="cloud-download-outline" size={14} color={isDark ? '#38BDF8' : '#4F46E5'} />
                )}

                <Text
                  numberOfLines={1}
                  style={[
                    styles.fetchRateText,
                    {
                      color:
                        cooldownSeconds > 0
                          ? t.textMuted
                          : isDark
                          ? '#38BDF8'
                          : '#4F46E5',
                    },
                    fontBold,
                  ]}
                >
                  {isLoadingRate
                    ? tr.fetchingRate
                    : cooldownSeconds > 0
                    ? `${cooldownSeconds} ${tr.cooldownWait}`
                    : tr.fetchLiveRate}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.rateInputContainer,
                {
                  backgroundColor: t.cardInner,
                  borderColor: t.inputBorder,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
            >
              <View style={[styles.rateBadge, { backgroundColor: t.primaryBg }]}>
                <Text style={[styles.rateBadgeText, { color: t.primary }, fontBold]}>
                  {isRTL ? '$ ۱ / تتر' : '$ 1 / USDT'}
                </Text>
              </View>

              <Text style={[styles.rateEqualsSign, { color: t.textMuted }, fontBold]}>=</Text>

              <TextInput
                style={[
                  styles.rateInputField,
                  {
                    color: t.textMain,
                    textAlign: isRTL ? 'right' : 'left',
                  },
                  fontBold,
                ]}
                keyboardType="numeric"
                value={rateText}
                onChangeText={handleRateChange}
                placeholder="250,000"
                placeholderTextColor={t.textMuted}
              />

              {rateText !== '' && (
                <TouchableOpacity
                  onPress={() => handleRateChange('')}
                  style={styles.rateClearBtnModern}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}

              <View style={[styles.rateUnitBadge, { backgroundColor: t.chipBg }]}>
                <Text style={[styles.rateUnitTag, { color: t.textMain }, fontBold]}>
                  {tr.rateUnit}
                </Text>
              </View>
            </View>

            {rateStatusMessage !== '' && (
              <View style={[styles.rateStatusRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Ionicons
                  name={rateStatusType === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                  size={14}
                  color={rateStatusType === 'success' ? t.accentGreen : '#EF4444'}
                />
                <Text
                  style={[
                    styles.rateStatusText,
                    { color: rateStatusType === 'success' ? t.accentGreen : '#EF4444' },
                    fontRegular,
                  ]}
                >
                  {rateStatusMessage}
                </Text>
              </View>
            )}
          </View>
          <View style={[styles.mainCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <View style={styles.fieldBlock}>
              <View style={[styles.fieldHeader, { flexDirection }]}>
                <Text
                  style={[
                    styles.fieldTitle,
                    { color: isUsdSource ? t.accentGreen : t.primary },
                    fontBold,
                  ]}
                >
                  {isUsdSource ? tr.usdTitle : tr.tomanTitle}
                </Text>
                <View style={[styles.badgeSource, { backgroundColor: t.primaryBg }]}>
                  <Text style={[styles.badgeSourceText, { color: t.primary }, fontBold]}>
                    {tr.inputTag}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.fieldBox,
                  {
                    backgroundColor: t.cardInner,
                    borderColor: t.activeBorder,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <View
                  style={[
                    styles.currencyPill,
                    {
                      backgroundColor: isUsdSource ? t.accentGreenBg : t.primaryBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyPillText,
                      { color: isUsdSource ? t.accentGreen : t.primary },
                      fontBold,
                    ]}
                  >
                    {isUsdSource ? '$' : tr.symbolToman}
                  </Text>
                </View>

                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      color: t.textMain,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                    fontBold,
                  ]}
                  keyboardType={isUsdSource ? 'decimal-pad' : 'numeric'}
                  placeholder={isUsdSource ? tr.usdPlaceholder : tr.tomanPlaceholder}
                  placeholderTextColor={t.textMuted}
                  value={isUsdSource ? usdInput : tomanInput}
                  onChangeText={isUsdSource ? handleUsdChange : handleTomanChange}
                  onBlur={() => {
                    if (usdInput && tomanInput) {
                      commitSaveHistory(usdInput, tomanInput);
                    }
                  }}
                />

                {(isUsdSource ? usdInput : tomanInput) !== '' && (
                  <TouchableOpacity onPress={handleClear} style={styles.clearMiniBtn}>
                    <Ionicons name="close-circle" size={20} color={t.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={styles.swapSection}>
              <View style={[styles.swapLine, { backgroundColor: t.divider }]} />
              <TouchableOpacity
                onPress={handleSwapDirection}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={t.swapGradients}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.swapButton}
                >
                  <Ionicons name="swap-vertical" size={20} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
              <View style={[styles.swapLine, { backgroundColor: t.divider }]} />
            </View>
            <View style={styles.fieldBlock}>
              <View style={[styles.fieldHeader, { flexDirection }]}>
                <Text
                  style={[
                    styles.fieldTitle,
                    { color: !isUsdSource ? t.accentGreen : t.primary },
                    fontBold,
                  ]}
                >
                  {!isUsdSource ? tr.usdTitle : tr.tomanTitle}
                </Text>
                {(isUsdSource ? tomanInput : usdInput) !== '' && (
                  <TouchableOpacity
                    onPress={() => copyResult(isUsdSource ? tomanInput : usdInput, 'result')}
                    style={[styles.copyBtnPill, { backgroundColor: t.primaryBg, flexDirection }]}
                  >
                    <Ionicons
                      name={copied === 'result' ? 'checkmark' : 'copy-outline'}
                      size={13}
                      color={t.primary}
                    />
                    <Text style={[styles.copyPillText, { color: t.primary }, fontBold]}>
                      {copied === 'result' ? tr.copiedText : tr.copyBtn}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View
                style={[
                  styles.fieldBox,
                  styles.resultBox,
                  {
                    backgroundColor: t.cardInner,
                    borderColor: t.cardBorder,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <View
                  style={[
                    styles.currencyPill,
                    {
                      backgroundColor: !isUsdSource ? t.accentGreenBg : t.primaryBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.currencyPillText,
                      { color: !isUsdSource ? t.accentGreen : t.primary },
                      fontBold,
                    ]}
                  >
                    {!isUsdSource ? '$' : tr.symbolToman}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.resultValueText,
                    {
                      color:
                        (isUsdSource ? tomanInput : usdInput) !== '' ? t.textMain : t.textMuted,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                    fontBold,
                  ]}
                  selectable={true}
                >
                  {(isUsdSource ? tomanInput : usdInput) || '0'}
                </Text>

                <Text style={[styles.unitLabel, { color: t.textSub }, fontSemiBold]}>
                  {!isUsdSource ? tr.usdUnit : tr.rateUnit}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.chipsContainer, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <View style={[styles.chipsHeadingRow, { flexDirection }]}>
              <View style={[styles.chipsTitleWrap, { flexDirection }]}>
                <Ionicons name="flash" size={15} color={t.accentGreen} />
                <Text style={[styles.chipsHeading, { color: t.textMain }, fontBold]}>
                  {' '}{tr.quickTitle}
                </Text>
              </View>
              <View style={[styles.hintArrowsContainer, { flexDirection: 'row' }]}>
                <Ionicons name="caret-back" size={12} color={t.textMuted} />
                <Text style={[styles.chipsHintScroll, { color: t.textMuted }, fontRegular]}>
                  {isRTL ? 'ورق بزنید' : 'swipe'}
                </Text>
                <Ionicons name="caret-forward" size={12} color={t.textMuted} />
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[
                styles.chipsScrollRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              {['0.1', '0.5', '0.99', '1', '1.99', '2.5', '4.99', '9.99', '14.99', '20', '49.99', '99.99'].map((chip) => (
                <TouchableOpacity
                  key={chip}
                  style={[
                    styles.chipItemModern,
                    { backgroundColor: t.chipBg, borderColor: t.chipBorder },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setDirection('USD_TO_TOMAN');
                    setUsdInput(chip);
                    const rate = getRateNumber();
                    if (rate > 0) {
                      const toman = parseFloat(chip) * rate;
                      const res = formatWithCommas(toman, 2);
                      setTomanInput(res);
                      commitSaveHistory(chip, res);
                    } else {
                      setTomanInput('');
                    }
                  }}
                >
                  <Text style={[styles.chipSymbol, { color: t.accentGreen }, fontBold]}>$</Text>
                  <Text style={[styles.chipTextModern, { color: t.textMain }, fontBold]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {history.length > 0 && (
            <View style={[styles.histCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              <TouchableOpacity
                style={[styles.histHeaderToggle, { flexDirection }]}
                activeOpacity={0.7}
                onPress={() => setIsHistoryOpen(!isHistoryOpen)}
              >
                <View style={[styles.histTitleGroup, { flexDirection }]}>
                  <Ionicons name="time-outline" size={16} color={t.textSub} />
                  <Text style={[styles.histTitle, { color: t.textMain }, fontBold]}>
                    {' '}{tr.historyTitle}
                  </Text>
                  <View style={[styles.histBadgeCount, { backgroundColor: t.primaryBg }]}>
                    <Text style={[styles.histBadgeCountText, { color: t.primary }, fontBold]}>
                      {history.length}
                    </Text>
                  </View>
                </View>

                <View style={[styles.histHeaderRightControls, { flexDirection }]}>
                  {isHistoryOpen && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        setHistory([]);
                        AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
                      }}
                      style={styles.trashBtn}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="trash-outline" size={17} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                  <View style={[styles.chevronPill, { backgroundColor: t.chipBg }]}>
                    <Ionicons
                      name={isHistoryOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={t.primary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
              {isHistoryOpen && (
                <View style={styles.histBody}>
                  <ScrollView
                    style={styles.histScrollContainer}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                  >
                    {history.map((h) => (
                      <TouchableOpacity
                        key={h.id}
                        style={[
                          styles.histRow,
                          { borderBottomColor: t.divider, flexDirection },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setDirection('USD_TO_TOMAN');
                          setUsdInput(h.usd);
                          calcFromUsd(h.usd);
                        }}
                      >
                        <View style={[styles.histUsdCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <Text style={[styles.histUsd, { color: t.accentGreen }, fontBold]}>${h.usd}</Text>
                        </View>

                        <View style={styles.histArrowCol}>
                          <Ionicons
                            name={isRTL ? 'arrow-back' : 'arrow-forward'}
                            size={14}
                            color={t.textMuted}
                          />
                        </View>

                        <View style={[styles.histTomanCol, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                          <Text style={[styles.histToman, { color: t.primary }, fontBold]}>
                            {h.toman} {tr.rateUnit}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          )}
          <View style={[styles.footerContainer, { flexDirection }]}>
            <Text style={[styles.footerTextMuted, { color: t.textMuted }, fontRegular]}>
              {tr.footerDevPrefix}{' '}
            </Text>
            <Text style={[styles.footerAuthor, { color: t.textMain }, fontBold]}>
              {tr.authorName}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={isAboutOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAboutOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsAboutOpen(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.modalCard,
              { backgroundColor: t.card, borderColor: t.cardBorder },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.modalHeaderRow, { flexDirection }]}>
              <Text style={[styles.modalTitleText, { color: t.textMain }, fontBold]}>
                {tr.aboutTitle}
              </Text>
              <TouchableOpacity
                onPress={() => setIsAboutOpen(false)}
                style={[styles.modalCloseBtn, { backgroundColor: t.chipBg }]}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color={t.textSub} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalHero}>
              <LinearGradient
                colors={t.logoGradients}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalLogo}
              >
                <MaterialCommunityIcons name="swap-horizontal-bold" size={28} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.modalAppName, { color: t.textMain }, fontBlack]}>
                {tr.appTitle}
              </Text>
              <View style={[styles.modalVersionBadge, { backgroundColor: t.primaryBg }]}>
                <Text style={[styles.modalVersionBadgeText, { color: t.primary }, fontBold]}>
                  {tr.appVersion}
                </Text>
              </View>
            </View>

            <Text style={[styles.modalDescText, { color: t.textSub }, fontRegular]}>
              {tr.aboutDesc}
            </Text>
            <TouchableOpacity
              style={[
                styles.modalCheckUpdateBtn,
                {
                  backgroundColor: t.primaryBg,
                  borderColor: t.primary,
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                },
              ]}
              onPress={() => checkForUpdates(true)}
              disabled={isCheckingUpdate}
              activeOpacity={0.7}
            >
              {isCheckingUpdate ? (
                <ActivityIndicator size="small" color={t.primary} />
              ) : (
                <Ionicons name="refresh-circle-outline" size={17} color={t.primary} />
              )}
              <Text style={[styles.modalCheckUpdateText, { color: t.primary }, fontSemiBold]}>
                {isCheckingUpdate ? tr.checkingUpdate : tr.checkUpdateBtn}
              </Text>
            </TouchableOpacity>

            {updateStatusFeedback !== '' && (
              <Text style={[styles.updateStatusFeedbackText, { color: t.accentGreen }, fontRegular]}>
                {updateStatusFeedback}
              </Text>
            )}

            <View style={[styles.modalDivider, { backgroundColor: t.divider }]} />
            <View style={[styles.devCard, { backgroundColor: t.cardInner, borderColor: t.inputBorder }]}>
              <View style={[styles.devIconWrap, { backgroundColor: t.primaryBg }]}>
                <Ionicons name="code-slash" size={17} color={t.primary} />
              </View>
              <Text style={[styles.devLabel, { color: t.textMain }, fontBold]}>
                {tr.devBy}
              </Text>
              <View style={[styles.modalSocialRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={[
                    styles.modalSocialBtn,
                    {
                      backgroundColor: t.chipBg,
                      borderColor: t.chipBorder,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('https://github.com/AmirNrfox')}
                >
                  <Ionicons name="logo-github" size={16} color={t.textMain} />
                  <Text style={[styles.modalSocialText, { color: t.textMain }, fontSemiBold]}>
                    {tr.githubBtn}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSocialBtn,
                    {
                      backgroundColor: t.chipBg,
                      borderColor: t.chipBorder,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('https://t.me/AmirAliNazari2001')}
                >
                  <FontAwesome name="telegram" size={17} color="#229ED9" />
                  <Text style={[styles.modalSocialText, { color: t.textMain }, fontSemiBold]}>
                    {tr.telegramBtn}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSocialBtn,
                    {
                      backgroundColor: t.chipBg,
                      borderColor: t.chipBorder,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('mailto:amirnrfox@gmail.com')}
                >
                  <Ionicons name="mail-outline" size={16} color={t.textMain} />
                  <Text style={[styles.modalSocialText, { color: t.textMain }, fontSemiBold]}>
                    {tr.emailBtn}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={isUpdateDialogOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseUpdateDialog}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.updateDialogCard,
              { backgroundColor: t.card, borderColor: t.cardBorder },
            ]}
          >
            {/* Header */}
            <View style={[styles.updateHeroRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.updateIconBadge, { backgroundColor: 'rgba(52, 211, 153, 0.16)' }]}>
                <Ionicons name="sparkles" size={24} color="#34D399" />
              </View>
              <View style={[styles.updateTitleWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text
                  style={[
                    styles.updateDialogTitle,
                    {
                      color: t.textMain,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                    fontBold,
                  ]}
                >
                  {tr.updateDialogTitle}
                </Text>
                <Text
                  style={[
                    styles.updateVersionSubtitle,
                    {
                      color: t.primary,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                    fontSemiBold,
                  ]}
                >
                  v{updateInfo?.version || ''} ({tr.newVersionBadge})
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text
              style={[
                styles.updateDialogDesc,
                {
                  color: t.textSub,
                  textAlign: isRTL ? 'right' : 'left',
                  writingDirection: isRTL ? 'rtl' : 'ltr',
                },
                fontRegular,
              ]}
            >
              {tr.updateAvailableDesc}
            </Text>

            {/* Release Notes */}
            {updateInfo?.releaseNotes ? (
              <View
                style={[
                  styles.releaseNotesBox,
                  { backgroundColor: t.cardInner, borderColor: t.inputBorder },
                ]}
              >
                <Text
                  style={[
                    styles.releaseNotesTitle,
                    {
                      color: t.textMuted,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                    fontSemiBold,
                  ]}
                >
                  {tr.updateNotesLabel}
                </Text>
                <Text
                  style={[
                    styles.releaseNotesContent,
                    {
                      color: t.textMain,
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                    fontRegular,
                  ]}
                >
                  {updateInfo.releaseNotes}
                </Text>
              </View>
            ) : null}

            {/* In-App Download Progress Container */}
            {downloadState === 'downloading' && (
              <View style={[styles.downloadProgressCard, { backgroundColor: t.cardInner, borderColor: t.inputBorder }]}>
                <View style={[styles.downloadProgressHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.downloadingStatusText, { color: t.textMain }, fontSemiBold]}>
                    {tr.downloadingUpdate}
                  </Text>
                  <Text style={[styles.downloadPercentText, { color: t.primary }, fontBold]}>
                    {isRTL ? `${toFaDigits(Math.round(downloadProgress * 100))}٪` : `${Math.round(downloadProgress * 100)}%`}
                  </Text>
                </View>

                {/* Progress Bar Track */}
                <View style={[styles.progressBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0' }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: t.primary,
                        width: `${Math.round(downloadProgress * 100)}%`,
                        alignSelf: isRTL ? 'flex-end' : 'flex-start',
                      },
                    ]}
                  />
                </View>

                {/* Size stats & Cancel */}
                <View style={[styles.downloadSizeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.downloadSizeText, { color: t.textMuted }, fontRegular]}>
                    {downloadedSizeStr} / {totalSizeStr}
                  </Text>
                  <TouchableOpacity
                    onPress={handleCancelDownload}
                    activeOpacity={0.7}
                    style={styles.cancelDownloadBtn}
                  >
                    <Text style={[styles.cancelDownloadText, { color: '#EF4444' }, fontSemiBold]}>
                      {tr.cancelDownload}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Completed state notice */}
            {downloadState === 'completed' && (
              <View
                style={[
                  styles.downloadCompleteCard,
                  {
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text
                  style={[
                    styles.downloadCompleteText,
                    {
                      color: '#10B981',
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                    fontRegular,
                  ]}
                >
                  {tr.downloadCompleteMsg}
                </Text>
              </View>
            )}

            {/* Error state notice */}
            {downloadState === 'error' && (
              <View
                style={[
                  styles.downloadErrorCard,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                ]}
              >
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text
                  style={[
                    styles.downloadErrorText,
                    {
                      color: '#EF4444',
                      textAlign: isRTL ? 'right' : 'left',
                      writingDirection: isRTL ? 'rtl' : 'ltr',
                    },
                    fontRegular,
                  ]}
                >
                  {tr.downloadFailedMsg}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.updateActionsCol}>
              {downloadState === 'idle' && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.downloadUpdateBtn,
                      {
                        backgroundColor: t.primary,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={handleStartDownloadOrInstall}
                  >
                    <Ionicons name="cloud-download" size={18} color="#FFFFFF" />
                    <Text style={[styles.downloadUpdateBtnText, fontBold]}>
                      {tr.downloadUpdateBtn}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.updateLaterBtn, { borderColor: t.chipBorder }]}
                    activeOpacity={0.7}
                    onPress={handleCloseUpdateDialog}
                  >
                    <Text style={[styles.updateLaterBtnText, { color: t.textMuted }, fontRegular]}>
                      {tr.updateLaterBtn}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {downloadState === 'downloading' && (
                <TouchableOpacity
                  style={[styles.updateLaterBtn, { borderColor: t.chipBorder }]}
                  activeOpacity={0.7}
                  onPress={handleCloseUpdateDialog}
                >
                  <Text style={[styles.updateLaterBtnText, { color: t.textMuted }, fontRegular]}>
                    {tr.updateLaterBtn}
                  </Text>
                </TouchableOpacity>
              )}

              {downloadState === 'completed' && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.downloadUpdateBtn,
                      {
                        backgroundColor: '#10B981',
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => downloadedApkUri && installApk(downloadedApkUri)}
                  >
                    <Ionicons name="arrow-redo-circle" size={20} color="#FFFFFF" />
                    <Text style={[styles.downloadUpdateBtnText, fontBold]}>
                      {tr.installUpdateBtn}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.updateLaterBtn, { borderColor: t.chipBorder }]}
                    activeOpacity={0.7}
                    onPress={handleCloseUpdateDialog}
                  >
                    <Text style={[styles.updateLaterBtnText, { color: t.textMuted }, fontRegular]}>
                      {tr.closeModal}
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {downloadState === 'error' && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.downloadUpdateBtn,
                      {
                        backgroundColor: t.primary,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (updateInfo?.downloadUrl) {
                        Linking.openURL(updateInfo.downloadUrl);
                      }
                      handleCloseUpdateDialog();
                    }}
                  >
                    <Ionicons name="open-outline" size={18} color="#FFFFFF" />
                    <Text style={[styles.downloadUpdateBtnText, fontBold]}>
                      {tr.downloadViaBrowserBtn}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.updateLaterBtn, { borderColor: t.chipBorder }]}
                    activeOpacity={0.7}
                    onPress={handleStartDownloadOrInstall}
                  >
                    <Text style={[styles.updateLaterBtnText, { color: t.primary }, fontSemiBold]}>
                      {tr.retryDownload}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  stickyHeaderWrapper: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 38 : 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 25,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  brandContainer: {
    flexShrink: 1,
  },
  titleRow: {
    alignItems: 'center',
    gap: 8,
    flexWrap: 'nowrap',
  },
  modernAppLogoWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  appTitle: {
    fontSize: 22,
    flexShrink: 1,
  },
  appSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  langText: {
    fontSize: 13,
  },
  rateCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  rateHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rateHeaderTitleWrap: {
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  rateLabelText: {
    fontSize: 13,
  },
  rateSubInfo: {
    fontSize: 11,
  },
  fetchRatePill: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    flexShrink: 0,
  },
  fetchRateText: {
    fontSize: 11,
    flexShrink: 0,
  },
  rateStatusRow: {
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  rateStatusText: {
    fontSize: 11,
  },
  rateInputContainer: {
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    gap: 6,
    overflow: 'hidden',
  },
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  rateBadgeText: {
    fontSize: 13,
  },
  rateEqualsSign: {
    fontSize: 14,
  },
  rateInputField: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 4,
    paddingHorizontal: 4,
    minWidth: 60,
  },
  rateClearBtnModern: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  rateUnitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rateUnitTag: {
    fontSize: 12,
  },
  mainCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  fieldBlock: {
    marginVertical: 0,
  },
  fieldHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldTitle: {
    fontSize: 13,
  },
  badgeSource: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeSourceText: {
    fontSize: 10,
  },
  copyBtnPill: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  copyPillText: {
    fontSize: 11,
  },
  fieldBox: {
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    gap: 10,
  },
  resultBox: {
    borderWidth: 1,
  },
  currencyPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyPillText: {
    fontSize: 14,
  },
  fieldInput: {
    flex: 1,
    fontSize: 20,
    paddingVertical: 4,
  },
  clearMiniBtn: {
    padding: 2,
  },
  resultValueText: {
    flex: 1,
    fontSize: 20,
  },
  unitLabel: {
    fontSize: 12,
  },
  swapSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 2,
  },
  swapLine: {
    flex: 1,
    height: 1,
  },
  swapButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  chipsContainer: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  chipsHeadingRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chipsTitleWrap: {
    alignItems: 'center',
    gap: 4,
  },
  chipsHeading: {
    fontSize: 12,
  },
  hintArrowsContainer: {
    alignItems: 'center',
    gap: 4,
  },
  arrowSymbol: {
    fontSize: 10,
  },
  chipsHintScroll: {
    fontSize: 11,
  },
  chipsScrollRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chipItemModern: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  chipSymbol: {
    fontSize: 13,
  },
  chipTextModern: {
    fontSize: 13,
  },
  histCard: {
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  histHeaderToggle: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  histTitleGroup: {
    alignItems: 'center',
    gap: 6,
  },
  histTitle: {
    fontSize: 13,
  },
  histBadgeCount: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  histBadgeCountText: {
    fontSize: 11,
  },
  histHeaderRightControls: {
    alignItems: 'center',
    gap: 14,
  },
  trashBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  histBody: {
    marginTop: 6,
    paddingTop: 2,
  },
  histScrollContainer: {
    maxHeight: 180,
    paddingRight: 10,
    paddingLeft: 6,
  },
  histRow: {
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    width: '100%',
  },
  histUsdCol: {
    flex: 1,
  },
  histArrowCol: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  histTomanCol: {
    flex: 1,
  },
  histUsd: {
    fontSize: 13,
  },
  histToman: {
    fontSize: 13,
  },
  footerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  footerTextMuted: {
    fontSize: 12,
  },
  footerAuthor: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitleText: {
    fontSize: 15,
  },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHero: {
    alignItems: 'center',
    marginBottom: 10,
  },
  modalLogo: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalAppName: {
    fontSize: 20,
    marginBottom: 4,
  },
  modalVersionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  modalVersionBadgeText: {
    fontSize: 11,
  },
  modalDescText: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalCheckUpdateBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    alignSelf: 'center',
  },
  modalCheckUpdateText: {
    fontSize: 12,
  },
  updateStatusFeedbackText: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDivider: {
    height: 1,
    width: '100%',
    marginBottom: 14,
  },
  devCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    width: '100%',
  },
  devIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  devLabel: {
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSocialRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  modalSocialBtn: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  modalSocialText: {
    fontSize: 11,
  },
  updateDialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  updateHeroRow: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  updateTitleWrap: {
    flex: 1,
  },
  updateIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateDialogTitle: {
    fontSize: 17,
  },
  updateVersionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  updateDialogDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  releaseNotesBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  releaseNotesTitle: {
    fontSize: 11,
    marginBottom: 4,
  },
  releaseNotesContent: {
    fontSize: 12,
    lineHeight: 18,
  },
  downloadProgressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  downloadProgressHeaderRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  downloadingStatusText: {
    fontSize: 12,
  },
  downloadPercentText: {
    fontSize: 13,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  downloadSizeRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloadSizeText: {
    fontSize: 11,
  },
  cancelDownloadBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  cancelDownloadText: {
    fontSize: 12,
  },
  downloadCompleteCard: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  downloadCompleteText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  downloadErrorCard: {
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  downloadErrorText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  updateActionsCol: {
    gap: 8,
  },
  downloadUpdateBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  downloadUpdateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  updateLaterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  updateLaterBtnText: {
    fontSize: 13,
  },
});
