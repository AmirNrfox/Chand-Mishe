/**
 * Chand-Mishe: Multi-Currency Types, Defaults & Core Business Logic
 * Independent of React components and UI rendering.
 */

export type CurrencyId = 'usd' | 'eur' | 'aed' | 'try' | 'iqd' | string;

export interface Currency {
  id: CurrencyId;
  code: string;
  name: {
    fa: string;
    en: string;
  };
  symbol: string;
  isCustom: boolean;
  hasLiveRate: boolean;
  quickAmounts: string[];
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  foreignAmount: string;
  tomanAmount: string;
  rateApplied: string;
  currencyId: CurrencyId;
  currencyCode: string;
  currencySymbol: string;
  /** Preserved for structural backward compatibility */
  usd?: string;
  toman?: string;
}

export const STORAGE_KEYS = {
  ACTIVE_CURRENCY_ID: '@chand_mishe_active_currency_id',
  RATES_BY_ID: '@chand_mishe_rates_by_id',
  CUSTOM_CURRENCIES: '@chand_mishe_custom_currencies',
  MIGRATION_VERSION: '@chand_mishe_migration_version',
  HISTORY: '@chand_mishe_history',
  LEGACY_USD_RATE: '@chand_mishe_usd_rate',
  THEME: '@chand_mishe_theme',
  LANG: '@chand_mishe_lang',
} as const;

export const CURRENT_MIGRATION_VERSION = 1;

export const DEFAULT_CURRENCIES: Currency[] = [
  {
    id: 'usd',
    code: 'USD',
    name: { fa: 'دلار / تتر', en: 'USD / USDT' },
    symbol: '$',
    isCustom: false,
    hasLiveRate: true,
    quickAmounts: ['0.1', '0.5', '0.99', '1', '1.99', '2.5', '4.99', '9.99', '14.99', '20', '49.99', '99.99'],
  },
  {
    id: 'eur',
    code: 'EUR',
    name: { fa: 'یورو', en: 'Euro' },
    symbol: '€',
    isCustom: false,
    hasLiveRate: false,
    quickAmounts: ['1', '5', '10', '20', '50', '100', '250', '500'],
  },
  {
    id: 'aed',
    code: 'AED',
    name: { fa: 'درهم امارات', en: 'UAE Dirham' },
    symbol: 'د.إ',
    isCustom: false,
    hasLiveRate: false,
    quickAmounts: ['10', '25', '50', '100', '200', '500', '1000'],
  },
  {
    id: 'try',
    code: 'TRY',
    name: { fa: 'لیر ترکیه', en: 'Turkish Lira' },
    symbol: '₺',
    isCustom: false,
    hasLiveRate: false,
    quickAmounts: ['20', '50', '100', '250', '500', '1000', '2500'],
  },
  {
    id: 'iqd',
    code: 'IQD',
    name: { fa: 'دینار عراق', en: 'Iraqi Dinar' },
    symbol: 'د.ع',
    isCustom: false,
    hasLiveRate: false,
    quickAmounts: ['250', '500', '1000', '5000', '10000', '25000', '50000'],
  },
];

let customCurrencyCounter = 0;

/**
 * Generates a collision-resistant unique ID for custom currencies
 * without requiring external UUID libraries. Compatible with Hermes and React Native.
 */
export function generateCustomCurrencyId(): string {
  customCurrencyCounter += 1;
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `custom_${crypto.randomUUID().replace(/-/g, '')}`;
    }
  } catch {
    // Fallback to high-entropy generator
  }
  const timestampPart = Date.now().toString(36);
  const counterPart = customCurrencyCounter.toString(36);
  const randomPart1 = Math.random().toString(36).substring(2, 10);
  const randomPart2 = Math.random().toString(36).substring(2, 6);
  return `custom_${timestampPart}_${counterPart}_${randomPart1}${randomPart2}`;
}

/**
 * Creates or updates a custom currency model with valid defaults.
 */
export function createCustomCurrency(params: {
  id?: string;
  name: string;
  code?: string;
  symbol: string;
  quickAmounts?: string[];
}): Currency {
  const id = params.id || generateCustomCurrencyId();
  const trimmedName = params.name.trim();
  const code = (
    params.code?.trim() ||
    params.symbol?.trim() ||
    trimmedName.slice(0, 4) ||
    'CUSTOM'
  ).toUpperCase().slice(0, 6);
  const symbol = params.symbol.trim() || code;
  return {
    id,
    code,
    name: {
      fa: trimmedName,
      en: trimmedName,
    },
    symbol,
    isCustom: true,
    hasLiveRate: false,
    quickAmounts:
      params.quickAmounts && params.quickAmounts.length > 0
        ? params.quickAmounts
        : ['1', '5', '10', '25', '50', '100', '250', '500'],
  };
}

/**
 * Validates whether a rate is a strictly positive finite number.
 */
export function isValidRate(rate: unknown): boolean {
  if (rate === null || rate === undefined || rate === '') return false;
  const num = typeof rate === 'number' ? rate : Number(String(rate).replace(/,/g, '').trim());
  return Number.isFinite(num) && num > 0;
}

/**
 * Parses raw rate string (clearing commas and non-standard digits) to number.
 * Returns null if invalid or <= 0.
 */
export function parseRate(rawRate: string): number | null {
  if (!rawRate) return null;
  const clean = rawRate
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/٫/g, '.')
    .replace(/,/g, '')
    .trim();
  const num = parseFloat(clean);
  if (isNaN(num) || !Number.isFinite(num) || num <= 0) return null;
  return num;
}

/**
 * Standard Conversion: 1 Foreign Unit = Rate Tomans
 * Amount * Rate = Toman
 */
export function convertForeignToToman(foreignAmount: number, rate: number): number | null {
  if (!isValidRate(rate) || isNaN(foreignAmount) || foreignAmount < 0) return null;
  return foreignAmount * rate;
}

/**
 * Standard Inverse Conversion:
 * Toman / Rate = Foreign Amount
 */
export function convertTomanToForeign(tomanAmount: number, rate: number): number | null {
  if (!isValidRate(rate) || isNaN(tomanAmount) || tomanAmount < 0) return null;
  return tomanAmount / rate;
}

/**
 * Checks whether a raw history object from storage belongs to the legacy structure
 * (i.e. has 'usd' property as primary foreign field, but lacks 'foreignAmount').
 */
export function isLegacyHistoryRecord(item: unknown): boolean {
  if (typeof item !== 'object' || item === null) return false;
  const record = item as Record<string, unknown>;
  return 'usd' in record && !('foreignAmount' in record);
}

/**
 * Migrates an array of history items from legacy or mixed formats.
 * Explicitly maps legacy usd/toman items to standard HistoryRecord.
 * Idempotent: already migrated items remain unchanged.
 */
export function migrateLegacyHistory(rawItems: unknown[]): { migrated: boolean; records: HistoryRecord[] } {
  let hasMigrated = false;
  if (!Array.isArray(rawItems)) return { migrated: false, records: [] };

  const records: HistoryRecord[] = rawItems.map((raw) => {
    if (isLegacyHistoryRecord(raw)) {
      hasMigrated = true;
      const legacy = raw as { id?: string; usd?: string; toman?: string };
      const idStr = String(legacy.id ?? Date.now());
      const ts = Number(idStr) || Date.now();
      return {
        id: idStr,
        timestamp: ts,
        foreignAmount: String(legacy.usd ?? ''),
        tomanAmount: String(legacy.toman ?? ''),
        rateApplied: '',
        currencyId: 'usd',
        currencyCode: 'USD',
        currencySymbol: '$',
        usd: String(legacy.usd ?? ''),
        toman: String(legacy.toman ?? ''),
      };
    }
    return raw as HistoryRecord;
  });

  return { migrated: hasMigrated, records };
}

/**
 * Merges legacy USD rate into the rates map without overwriting
 * an existing new USD rate.
 */
export function migrateRates(
  legacyUsdRate: string | null,
  existingRatesById: Record<string, string> | null
): { migrated: boolean; rates: Record<string, string> } {
  const currentRates: Record<string, string> = existingRatesById ? { ...existingRatesById } : {};
  let migrated = false;

  // Rule 4: If new USD rate already exists, preserve it! Do NOT overwrite with legacy.
  if (currentRates.usd && currentRates.usd.trim() !== '') {
    return { migrated: false, rates: currentRates };
  }

  // If new USD rate is missing, but legacy USD rate exists, migrate it
  if (legacyUsdRate && legacyUsdRate.trim() !== '') {
    currentRates.usd = legacyUsdRate.trim();
    migrated = true;
  }

  return { migrated, rates: currentRates };
}
