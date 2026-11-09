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
  currencyName?: {
    fa: string;
    en: string;
  };
  /** Preserved for structural backward compatibility */
  usd?: string;
  toman?: string;
}

export interface HistoricalCurrencySnapshot {
  id: CurrencyId;
  code: string;
  symbol: string;
  name: {
    fa: string;
    en: string;
  };
  isDeleted: boolean;
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
 * Safely parses JSON strings from storage without throwing exceptions.
 */
export function safeParseJson<T>(raw: string | null, fallback: T): { success: boolean; data: T } {
  if (!raw) return { success: true, data: fallback };
  try {
    const parsed = JSON.parse(raw);
    return { success: true, data: parsed };
  } catch {
    return { success: false, data: fallback };
  }
}

/**
 * Resolves the appropriate rate to apply when restoring a history record.
 * Prioritizes the historical rate applied during that calculation,
 * falling back to current rate only if historical rate is absent or invalid.
 */
export function resolveHistoricalRate(
  historicalRateApplied: string | undefined,
  currentRate: string | undefined
): number | null {
  const fromHistory = parseRate(historicalRateApplied || '');
  if (fromHistory !== null && fromHistory > 0) {
    return fromHistory;
  }
  const fromCurrent = parseRate(currentRate || '');
  if (fromCurrent !== null && fromCurrent > 0) {
    return fromCurrent;
  }
  return null;
}

/**
 * Formats a Toman amount as an integer string with comma grouping.
 * ALWAYS applies Math.round() on numeric values to ensure zero decimals under all circumstances.
 * Accepts numbers or strings (including strings with existing commas or Persian/Arabic digits).
 *
 * Examples:
 *  formatToman(3000000.64) -> "3,000,001"
 *  formatToman(3000000.20) -> "3,000,000"
 *  formatToman("3,000,000.64") -> "3,000,001"
 *  formatToman(0) -> "0"
 *  formatToman("") -> ""
 */
export function formatToman(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' && value.trim() === '') return '';

  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else {
    const clean = String(value)
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/٫/g, '.')
      .replace(/,/g, '')
      .trim();
    num = parseFloat(clean);
  }

  if (isNaN(num) || !Number.isFinite(num)) return '';

  const rounded = Math.round(num);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Standard Conversion: 1 Foreign Unit = Rate Tomans
 * Amount * Rate = Toman (ALWAYS rounded to nearest integer via Math.round)
 */
export function convertForeignToToman(foreignAmount: number, rate: number): number | null {
  if (!isValidRate(rate) || isNaN(foreignAmount) || foreignAmount < 0) return null;
  return Math.round(foreignAmount * rate);
}

/**
 * Standard Inverse Conversion:
 * Toman / Rate = Foreign Amount
 * (Foreign currency amounts preserve decimals, rate is NOT rounded)
 */
export function convertTomanToForeign(tomanAmount: number, rate: number): number | null {
  if (!isValidRate(rate) || isNaN(tomanAmount) || tomanAmount < 0) return null;
  return Math.round(tomanAmount) / rate;
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
/**
 * Checks whether a raw history value contains a decimal component.
 * Supports both number (e.g. 3000000.64) and string (e.g. "3,000,000.64" or "۳,۰۰۰,۰۰۰٫۶۴").
 */
function hasDecimalPart(val: unknown): boolean {
  if (val === null || val === undefined || val === '') return false;
  if (typeof val === 'number') {
    return !Number.isInteger(val);
  }
  const str = String(val);
  return str.includes('.') || str.includes('٫');
}

/**
 * Migrates an array of history items from legacy or mixed formats.
 * Explicitly maps legacy usd/toman items to standard HistoryRecord.
 * Safely normalizes both string and number representations of Toman amounts to rounded integer strings.
 * Preserves all other fields (foreignAmount, rateApplied, etc.) completely intact.
 */
export function migrateLegacyHistory(rawItems: unknown[]): { migrated: boolean; records: HistoryRecord[] } {
  let hasMigrated = false;
  if (!Array.isArray(rawItems)) return { migrated: false, records: [] };

  const records: HistoryRecord[] = rawItems.map((raw) => {
    if (isLegacyHistoryRecord(raw)) {
      hasMigrated = true;
      const legacy = raw as { id?: string | number; usd?: string | number; toman?: string | number };
      const idStr = String(legacy.id ?? Date.now());
      const ts = Number(idStr) || Date.now();
      const rawToman = legacy.toman !== undefined && legacy.toman !== null ? legacy.toman : '';
      const roundedToman = formatToman(rawToman as number | string);
      const foreignStr = String(legacy.usd ?? '');
      return {
        id: idStr,
        timestamp: ts,
        foreignAmount: foreignStr,
        tomanAmount: roundedToman,
        rateApplied: '',
        currencyId: 'usd',
        currencyCode: 'USD',
        currencySymbol: '$',
        currencyName: { fa: 'دلار / تتر', en: 'USD / USDT' },
        usd: foreignStr,
        toman: roundedToman,
      };
    }

    if (typeof raw !== 'object' || raw === null) return raw as HistoryRecord;

    const item = raw as Record<string, unknown>;
    const rawTomanAmount = item.tomanAmount;
    const rawToman = item.toman;

    const hasDecimals = hasDecimalPart(rawTomanAmount) || hasDecimalPart(rawToman);
    const hasNumericToman = typeof rawTomanAmount === 'number' || typeof rawToman === 'number';
    const isMissingTomanAmount =
      (rawTomanAmount === undefined || rawTomanAmount === null || rawTomanAmount === '') &&
      rawToman !== undefined &&
      rawToman !== null &&
      rawToman !== '';

    if (hasDecimals || hasNumericToman || isMissingTomanAmount) {
      hasMigrated = true;
      const targetVal =
        rawTomanAmount !== undefined && rawTomanAmount !== null && rawTomanAmount !== ''
          ? rawTomanAmount
          : rawToman;
      const rounded = formatToman(targetVal as number | string);
      return {
        ...item,
        tomanAmount: rounded,
        toman: rounded,
      } as HistoryRecord;
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

/**
 * Resolves a snapshot for a historical record if the currency no longer exists in available currencies.
 * Returns null if the currency is still available in availableCurrencies.
 */
export function getDeletedCurrencySnapshot(
  record: HistoryRecord,
  availableCurrencies: Currency[]
): HistoricalCurrencySnapshot | null {
  const isAvailable = availableCurrencies.some((c) => c.id === record.currencyId);
  if (isAvailable) return null;

  return {
    id: record.currencyId,
    code: record.currencyCode || 'CUSTOM',
    symbol: record.currencySymbol || '$',
    name: record.currencyName || {
      fa: record.currencyCode || 'ارز حذف شده',
      en: record.currencyCode || 'Deleted Currency',
    },
    isDeleted: true,
  };
}
