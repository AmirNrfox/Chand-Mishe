import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

type Language = 'fa' | 'en';

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
    footerMadeWith: 'ساخته شده با',
    footerBy: 'توسط',
    authorName: 'امیرعلی نظری',
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
    footerMadeWith: 'Made with',
    footerBy: 'by',
    authorName: 'AmirAli Nazari',
  },
};

const themes = {
  dark: {
    bg: '#080C14',
    headerGradients: ['#1E1B4B', '#0F172A', '#080C14'] as const, // گرادیانت شبانگاهی نیل‌گون تا سرمه‌ای
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
    headerGradients: ['#E0E7FF', '#EEF2FF', '#F1F5F9'] as const, // گرادیانت شاداب صبحگاهی با حفظ کنتراست
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

export default function App() {
  const [fontsLoaded] = useFonts({
    VazirRegular: Vazirmatn_400Regular,
    VazirSemiBold: Vazirmatn_600SemiBold,
    VazirBold: Vazirmatn_700Bold,
    VazirBlack: Vazirmatn_800ExtraBold,
  });

  const [isDark, setIsDark] = useState<boolean>(true);
  const [lang, setLang] = useState<Language>('fa');
  const [rateText, setRateText] = useState<string>('200,000');
  const [usdInput, setUsdInput] = useState<string>('');
  const [tomanInput, setTomanInput] = useState<string>('');
  const [direction, setDirection] = useState<'USD_TO_TOMAN' | 'TOMAN_TO_USD'>('USD_TO_TOMAN');
  const [history, setHistory] = useState<Array<{ id: string; usd: string; toman: string }>>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [rateStatusMessage, setRateStatusMessage] = useState<string>('');
  const [rateStatusType, setRateStatusType] = useState<'success' | 'error'>('success');

  const t = isDark ? themes.dark : themes.light;
  const tr = translations[lang];
  const isRTL = lang === 'fa';

  // استایل خانواده فونت وزیرمتن
  const fontRegular = fontsLoaded ? { fontFamily: 'VazirRegular' } : {};
  const fontSemiBold = fontsLoaded ? { fontFamily: 'VazirSemiBold' } : {};
  const fontBold = fontsLoaded ? { fontFamily: 'VazirBold' } : {};
  const fontBlack = fontsLoaded ? { fontFamily: 'VazirBlack' } : {};

  useEffect(() => {
    loadSavedData();
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
    if (raw) await AsyncStorage.setItem(RATE_STORAGE_KEY, raw);

    const r = parseFloat(raw);
    if (!isNaN(r) && r > 0) {
      if (direction === 'USD_TO_TOMAN' && usdInput) {
        calcFromUsd(usdInput, r);
      } else if (direction === 'TOMAN_TO_USD' && tomanInput) {
        calcFromToman(tomanInput, r);
      }
    }
  };

  const fetchLiveRate = async () => {
    if (isLoadingRate || cooldownSeconds > 0) return;

    setIsLoadingRate(true);
    setRateStatusMessage('');
    try {
      let price: number | null = null;

      // 1. Try Tetherland API (تایم‌اوت ۶ ثانیه برای جلوگیری از فریز)
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

      // 2. Fallback to Wallex API if Tetherland failed (تایم‌اوت ۶ ثانیه)
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
        setCooldownSeconds(30); // تایم‌اوت ۳۰ ثانیه‌ای بین هر درخواست جهت جلوگیری از بلاک شدن آی‌پی
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
        setCooldownSeconds(10); // تایم‌اوت ۱۰ ثانیه در صورت خطا
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

  const calcFromUsd = (val: string, customRate?: number) => {
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
      saveHistory(clean, res);
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

  const calcFromToman = (val: string, customRate?: number) => {
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
      saveHistory(res, formatIntegerWithCommas(clean));
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
    setDirection((prev) => (prev === 'USD_TO_TOMAN' ? 'TOMAN_TO_USD' : 'USD_TO_TOMAN'));
  };

  const handleClear = () => {
    setUsdInput('');
    setTomanInput('');
  };

  const saveHistory = (usd: string, toman: string) => {
    if (!usd || !toman) return;
    const item = { id: Date.now().toString(), usd, toman };
    setHistory((prev) => {
      // ذخیره تا 30 تبدیل آخر به جای 5 تا
      const filtered = prev.filter((i) => i.usd !== usd).slice(0, 29);
      const updated = [item, ...filtered];
      AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
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
        {/* هدر بالایی فیکس‌شده با گرادیانت چشم‌نواز و اختصاصی */}
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
                {/* لوگوی اختصاصی با گرادیانت نئونی */}
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

            {/* کنترل‌های سریع تم و زبان با استایل شیشه‌ای (Glassmorphism) */}
            <View style={[styles.headerActions, { flexDirection }]}>
              <TouchableOpacity
                style={[
                  styles.actionIconBtn,
                  { backgroundColor: t.headerBtnBg, borderColor: t.headerBtnBorder },
                ]}
                onPress={toggleLang}
                activeOpacity={0.7}
              >
                <Text style={[styles.langText, { color: t.primary }, fontBold]}>
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
          {/* کارت تنظیم نرخ دلار */}
          <View style={[styles.rateCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <View style={[styles.rateHeaderRow, { flexDirection }]}>
              <View style={[styles.rateHeaderTitleWrap, { flexDirection }]}>
                <Ionicons name="trending-up-outline" size={16} color={t.primary} />
                <Text style={[styles.rateLabelText, { color: t.textSub }, fontSemiBold]}>
                  {tr.rateLabel}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.fetchRateBtn,
                  {
                    backgroundColor: cooldownSeconds > 0 ? t.chipBg : t.primaryBg,
                    borderColor: cooldownSeconds > 0 ? t.chipBorder : t.primary,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                  },
                  (isLoadingRate || cooldownSeconds > 0) && { opacity: 0.8 },
                ]}
                onPress={fetchLiveRate}
                disabled={isLoadingRate || cooldownSeconds > 0}
                activeOpacity={0.7}
              >
                {isLoadingRate ? (
                  <ActivityIndicator size="small" color={t.primary} />
                ) : (
                  <Ionicons
                    name={cooldownSeconds > 0 ? 'time-outline' : 'cloud-download-outline'}
                    size={14}
                    color={cooldownSeconds > 0 ? t.textMuted : t.primary}
                  />
                )}
                <Text
                  style={[
                    styles.fetchRateBtnText,
                    { color: cooldownSeconds > 0 ? t.textMuted : t.primary },
                    fontSemiBold,
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
                placeholder="200,000"
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

          {/* کارت اصلی تبدیل مبالغ */}
          <View style={[styles.mainCard, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            {/* ردیف ورودی فعال */}
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
                />

                {(isUsdSource ? usdInput : tomanInput) !== '' && (
                  <TouchableOpacity onPress={handleClear} style={styles.clearMiniBtn}>
                    <Ionicons name="close-circle" size={20} color={t.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* کلید جابجایی دوطرفه با آیکون اصلی و کلاسیک همراه گرادیانت */}
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

            {/* ردیف نتیجه محاسبه‌شده */}
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

          {/* کلیدهای سریع مبالغ خرد دلاری با جهت صحیح فلش‌ها */}
          <View style={[styles.chipsContainer, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
            <View style={[styles.chipsHeadingRow, { flexDirection }]}>
              <View style={[styles.chipsTitleWrap, { flexDirection }]}>
                <Ionicons name="flash" size={15} color={t.accentGreen} />
                <Text style={[styles.chipsHeading, { color: t.textMain }, fontBold]}>
                  {' '}{tr.quickTitle}
                </Text>
              </View>

              {/* جهت فیزیکی چپ‌به‌راست قطعی (LTR) بدون تأثیر موتور BiDi */}
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
                    calcFromUsd(chip);
                  }}
                >
                  <Text style={[styles.chipSymbol, { color: t.accentGreen }, fontBold]}>$</Text>
                  <Text style={[styles.chipTextModern, { color: t.textMain }, fontBold]}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* تاریخچه محاسبات اخیر به همراه آیکون سطل آشغال قرمز */}
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
                  {/* آیکون سطل آشغال قرمز با فاصله امن و دکمه اختصاصی */}
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

                  {/* دکمه باز و بسته کردن شیک، دایره‌ای با انیمیشن لمسی */}
                  <View style={[styles.chevronPill, { backgroundColor: t.chipBg }]}>
                    <Ionicons
                      name={isHistoryOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={t.primary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {/* محتوای بازشونده تاریخچه به همراه اسکرول داخلی */}
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

          {/* فوتر اختصاصی سازنده با فونت وزیرمتن */}
          <View style={[styles.footerContainer, { flexDirection }]}>
            <Text style={[styles.footerTextMuted, { color: t.textMuted }, fontRegular]}>
              {tr.footerMadeWith}
            </Text>
            <Ionicons name="heart" size={14} color="#EF4444" style={styles.heartIcon} />
            <Text style={[styles.footerTextMuted, { color: t.textMuted }, fontRegular]}>
              {tr.footerBy}
            </Text>
            <Text style={[styles.footerAuthor, { color: t.textMain }, fontBold]}>
              {tr.authorName}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  },
  rateLabelText: {
    fontSize: 13,
  },
  rateSubInfo: {
    fontSize: 11,
  },
  fetchRateBtn: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  fetchRateBtnText: {
    fontSize: 11,
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
    marginVertical: 2,
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
    marginVertical: 10,
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
    gap: 14, // فاصله امن بیشتر بین دکمه سطل آشغال و دکمه باز و بسته
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
    paddingRight: 10, // ایجاد فاصله ایمن در سمت راست/چپ تا نوار اسکرول روی متن نیفتد
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
    marginTop: 14,
    marginBottom: 6,
    gap: 5,
  },
  footerTextMuted: {
    fontSize: 12,
  },
  heartIcon: {
    marginHorizontal: 1,
  },
  footerAuthor: {
    fontSize: 12,
  },
});
