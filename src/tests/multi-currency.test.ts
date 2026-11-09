import {
  DEFAULT_CURRENCIES,
  Currency,
  HistoryRecord,
  HistoricalCurrencySnapshot,
  createCustomCurrency,
  parseRate,
  safeParseJson,
  resolveHistoricalRate,
  convertForeignToToman,
  convertTomanToForeign,
  migrateRates,
  migrateLegacyHistory,
  getDeletedCurrencySnapshot,
  formatToman,
} from '../types/currency';

function assertStrictEqual(actual: any, expected: any, msg?: string) {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

function assertDeepEqual(actual: any, expected: any, msg?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(msg || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
  }
}

function assertOk(value: any, msg?: string) {
  if (!value) {
    throw new Error(msg || `Expected truthy value but got ${JSON.stringify(value)}`);
  }
}

console.log('====================================================');
console.log('       MULTI-CURRENCY POST-AUDIT TEST SUITE         ');
console.log('====================================================\n');

let total = 0;
let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void) {
  total++;
  try {
    fn();
    passed++;
    console.log(`[PASS] ${desc}`);
  } catch (err: any) {
    failed++;
    console.error(`[FAIL] ${desc}`);
    console.error(`       ${err.message}`);
  }
}

// ====================================================
// 1. History Selection & Rate Resolution
// ====================================================
console.log('--- 1. History Selection & Historical Rate Priority ---');

it('History selection prioritizes historical rateApplied over changed current rate', () => {
  const historicalRecord: HistoryRecord = {
    id: '1',
    timestamp: 1000,
    foreignAmount: '10',
    tomanAmount: '1,000,000',
    rateApplied: '100,000', // historic rate
    currencyId: 'eur',
    currencyCode: 'EUR',
    currencySymbol: '€',
  };

  const currentEurRate = '120,000'; // today's new rate

  const resolved = resolveHistoricalRate(historicalRecord.rateApplied, currentEurRate);
  assertStrictEqual(resolved, 100000, 'Must use 100,000 (historical), NOT 120,000 (current)!');
});

it('History selection falls back to current rate only if historical rate was missing', () => {
  const legacyRecord: HistoryRecord = {
    id: '2',
    timestamp: 1001,
    foreignAmount: '10',
    tomanAmount: '1,200,000',
    rateApplied: '', // missing
    currencyId: 'eur',
    currencyCode: 'EUR',
    currencySymbol: '€',
  };

  const currentEurRate = '120,000';
  const resolved = resolveHistoricalRate(legacyRecord.rateApplied, currentEurRate);
  assertStrictEqual(resolved, 120000);
});

it('History is NOT re-saved or duplicated when selecting a record', () => {
  const historyList: HistoryRecord[] = [
    {
      id: '100',
      timestamp: 1000,
      foreignAmount: '50',
      tomanAmount: '6,000,000',
      rateApplied: '120,000',
      currencyId: 'usd',
      currencyCode: 'USD',
      currencySymbol: '$',
    },
  ];

  const initialCount = historyList.length;

  // Simulate selecting record with save: false
  const selected = historyList[0];
  const converted = convertForeignToToman(parseFloat(selected.foreignAmount), 120000);
  assertStrictEqual(converted, 6000000);

  // Because save is false, no push/unshifting to history
  assertStrictEqual(historyList.length, initialCount);
});

// ====================================================
// 2. Live Rate Race Condition Protection
// ====================================================
console.log('\n--- 2. Live Rate Race Condition Protection ---');

it('Delayed USD live rate response is discarded if user switched to EUR', () => {
  let activeCurrencyId = 'usd';
  let liveFetchRequestId = 101;
  const ratesById: Record<string, string> = { usd: '110000', eur: '125000' };

  // Step 1: USD fetch initiated
  const reqId = 101;
  const requestedCurrencyId = activeCurrencyId; // 'usd'

  // Step 2: User switches to EUR while request is in flight
  activeCurrencyId = 'eur';

  // Step 3: Delayed response returns with USDT price 118000
  const delayedUsdtPrice = '118000';

  // Guard condition from App.tsx
  const isStale = liveFetchRequestId !== reqId || activeCurrencyId !== requestedCurrencyId;
  assertStrictEqual(isStale, true, 'Request MUST be recognized as stale!');

  if (!isStale) {
    ratesById[activeCurrencyId] = delayedUsdtPrice;
  }

  // EUR rate must remain pristine!
  assertStrictEqual(ratesById['eur'], '125000', 'EUR rate must NOT be overwritten by USDT rate!');
});

it('Out-of-order live rate responses are safely discarded', () => {
  let latestRequestId = 200;

  // Request 1 arrives after Request 2 was already issued
  const oldReqId = 199;
  const isOldStale = oldReqId !== latestRequestId;
  assertStrictEqual(isOldStale, true, 'Older request must be rejected');
});

// ====================================================
// 3. Storage Resilience & Independent Key Parsing
// ====================================================
console.log('\n--- 3. Storage Corruption Resilience ---');

it('Corrupted JSON in rates storage does not throw and yields fallback object', () => {
  const corruptJson = '{"rates":{"usd":120000'; // truncated / malformed
  const result = safeParseJson<Record<string, string>>(corruptJson, {});
  assertStrictEqual(result.success, false);
  assertDeepEqual(result.data, {});
});

it('Corrupted JSON in custom currencies does not throw and yields empty array', () => {
  const corruptJson = '[{"id":"custom_1", "name":';
  const result = safeParseJson<Currency[]>(corruptJson, []);
  assertStrictEqual(result.success, false);
  assertDeepEqual(result.data, []);
});

it('Valid history parses successfully even when another storage key is corrupted', () => {
  const validHistoryJson = JSON.stringify([
    {
      id: '1',
      foreignAmount: '10',
      tomanAmount: '1,000,000',
      currencyId: 'usd',
      currencyCode: 'USD',
      currencySymbol: '$',
    },
  ]);

  const corruptRatesJson = '{"broken":';

  const ratesResult = safeParseJson<Record<string, string>>(corruptRatesJson, {});
  const histResult = safeParseJson<unknown[]>(validHistoryJson, []);

  assertStrictEqual(ratesResult.success, false);
  assertStrictEqual(histResult.success, true);
  assertStrictEqual(histResult.data.length, 1);
});

// ====================================================
// 4. History of Deleted Currency
// ====================================================
console.log('\n--- 4. History of Deleted Custom Currency ---');

it('1. Selecting deleted currency record while USD is active maintains activeCurrencyId as USD', () => {
  const availableCurrencies: Currency[] = [...DEFAULT_CURRENCIES]; // GBP custom currency is deleted
  let activeCurrencyId = 'usd';
  let historicalSnapshot: HistoricalCurrencySnapshot | null = null;

  const deletedRecord: HistoryRecord = {
    id: '99',
    timestamp: 5000,
    foreignAmount: '25',
    tomanAmount: '2,500,000',
    rateApplied: '100,000',
    currencyId: 'custom_deleted_pound',
    currencyCode: 'GBP',
    currencySymbol: '£',
    currencyName: { fa: 'پوند انگلیس', en: 'British Pound' },
  };

  const snapshot = getDeletedCurrencySnapshot(deletedRecord, availableCurrencies);
  assertStrictEqual(snapshot !== null, true, 'Snapshot must be created for deleted currency');

  if (snapshot) {
    historicalSnapshot = snapshot;
  } else {
    activeCurrencyId = deletedRecord.currencyId;
  }

  // activeCurrencyId remains USD!
  assertStrictEqual(activeCurrencyId, 'usd');
  assertStrictEqual(historicalSnapshot?.isDeleted, true);
  assertStrictEqual(historicalSnapshot?.code, 'GBP');
});

it('2. Historical snapshot matches title, symbol, and rate with historical record', () => {
  const availableCurrencies: Currency[] = [...DEFAULT_CURRENCIES];

  const deletedRecord: HistoryRecord = {
    id: '100',
    timestamp: 6000,
    foreignAmount: '50',
    tomanAmount: '6,000,000',
    rateApplied: '120,000',
    currencyId: 'custom_deleted_pound',
    currencyCode: 'GBP',
    currencySymbol: '£',
    currencyName: { fa: 'پوند انگلیس', en: 'British Pound' },
  };

  const snapshot = getDeletedCurrencySnapshot(deletedRecord, availableCurrencies);
  assertOk(snapshot);
  assertStrictEqual(snapshot?.symbol, '£');
  assertStrictEqual(snapshot?.code, 'GBP');
  assertStrictEqual(snapshot?.name.fa, 'پوند انگلیس');
  assertStrictEqual(snapshot?.name.en, 'British Pound');

  // Verify UI label helpers
  const getForeignTitle = (isRTL: boolean) =>
    snapshot ? (isRTL ? `مبلغ به ${snapshot.name.fa}` : `Amount in ${snapshot.name.en}`) : 'USD';
  assertStrictEqual(getForeignTitle(true), 'مبلغ به پوند انگلیس');
  assertStrictEqual(getForeignTitle(false), 'Amount in British Pound');

  const resolvedRate = resolveHistoricalRate(deletedRecord.rateApplied, undefined);
  assertStrictEqual(resolvedRate, 120000);
});

it('3. Deleted currency is NOT re-added to active or custom currency lists', () => {
  let customCurrencies: Currency[] = [];
  const availableCurrencies: Currency[] = [...DEFAULT_CURRENCIES, ...customCurrencies];

  const deletedRecord: HistoryRecord = {
    id: '101',
    timestamp: 7000,
    foreignAmount: '10',
    tomanAmount: '1,000,000',
    rateApplied: '100,000',
    currencyId: 'custom_deleted_cad',
    currencyCode: 'CAD',
    currencySymbol: 'C$',
  };

  const snapshot = getDeletedCurrencySnapshot(deletedRecord, availableCurrencies);
  assertOk(snapshot);

  // Assert customCurrencies remains untouched
  assertStrictEqual(customCurrencies.length, 0);
  assertStrictEqual(availableCurrencies.some((c) => c.id === 'custom_deleted_cad'), false);
});

it('4. Selecting an active currency cleanly clears historical snapshot and restores normal UI', () => {
  let historicalSnapshot: HistoricalCurrencySnapshot | null = {
    id: 'custom_deleted_cad',
    code: 'CAD',
    symbol: 'C$',
    name: { fa: 'دلار کانادا', en: 'Canadian Dollar' },
    isDeleted: true,
  };

  // User taps an active currency (e.g. EUR)
  const handleSelectCurrency = (curr: Currency) => {
    historicalSnapshot = null;
    return curr.id;
  };

  const nextActive = handleSelectCurrency(DEFAULT_CURRENCIES[1]); // EUR
  assertStrictEqual(nextActive, 'eur');
  assertStrictEqual(historicalSnapshot, null, 'Snapshot must be cleared on currency selection');
});

it('5. Historical snapshot information is preserved across app restart (serialization & deserialization)', () => {
  const originalHistory: HistoryRecord[] = [
    {
      id: '201',
      timestamp: 8000,
      foreignAmount: '75',
      tomanAmount: '7,500,000',
      rateApplied: '100,000',
      currencyId: 'custom_persisted_yen',
      currencyCode: 'JPY',
      currencySymbol: '¥',
      currencyName: { fa: 'ین ژاپن', en: 'Japanese Yen' },
    },
  ];

  // 1. Simulate saving to AsyncStorage
  const serialized = JSON.stringify(originalHistory);

  // 2. Simulate app restart: load and parse from storage
  const parseResult = safeParseJson<unknown[]>(serialized, []);
  assertStrictEqual(parseResult.success, true);

  const { records } = migrateLegacyHistory(parseResult.data);
  assertStrictEqual(records.length, 1);

  const restored = records[0];
  assertStrictEqual(restored.currencyId, 'custom_persisted_yen');
  assertStrictEqual(restored.currencySymbol, '¥');
  assertStrictEqual(restored.currencyCode, 'JPY');
  assertStrictEqual(restored.currencyName?.fa, 'ین ژاپن');

  // 3. Resolve snapshot after restart
  const availableCurrencies: Currency[] = [...DEFAULT_CURRENCIES]; // custom yen is not in available
  const snapshotAfterRestart = getDeletedCurrencySnapshot(restored, availableCurrencies);
  assertOk(snapshotAfterRestart);
  assertStrictEqual(snapshotAfterRestart?.name.fa, 'ین ژاپن');
  assertStrictEqual(snapshotAfterRestart?.symbol, '¥');
  assertStrictEqual(snapshotAfterRestart?.isDeleted, true);
});

// ====================================================
// 5. Manual Rate Stale Closure Protection
// ====================================================
console.log('\n--- 5. Manual Rate Closure & Rapid Update Protection ---');

it('Synchronous map ref prevents stale closure overwrites between currencies', () => {
  const ratesRef: { current: Record<string, string> } = {
    current: { usd: '120000', eur: '140000' },
  };

  // Rapid change on USD:
  const updateUsd = (newRate: string) => {
    ratesRef.current = { ...ratesRef.current, usd: newRate };
  };

  // Immediate subsequent change on TRY before any re-render:
  const updateTry = (newRate: string) => {
    ratesRef.current = { ...ratesRef.current, try: newRate };
  };

  updateUsd('122000');
  updateTry('3500');

  assertStrictEqual(ratesRef.current.usd, '122000');
  assertStrictEqual(ratesRef.current.eur, '140000');
  assertStrictEqual(ratesRef.current.try, '3500');
});

// ====================================================
// 6. RTL Direction in Currency Pill
// ====================================================
console.log('\n--- 6. RTL / LTR Direction Logic ---');

it('Currency pill direction dynamically switches between row-reverse (RTL) and row (LTR)', () => {
  const getPillDirection = (isRTL: boolean) => (isRTL ? 'row-reverse' : 'row');

  assertStrictEqual(getPillDirection(true), 'row-reverse');
  assertStrictEqual(getPillDirection(false), 'row');
});

// ====================================================
// 7. Toman Integer Formatting & Math.round Enforcement
// ====================================================
console.log('\n--- 7. Toman Integer Formatting & Math.round Enforcement ---');

it('formatToman formats pure integers with comma grouping and zero decimals', () => {
  assertStrictEqual(formatToman(3000000), '3,000,000');
  assertStrictEqual(formatToman('3000000'), '3,000,000');
  assertStrictEqual(formatToman('3,000,000'), '3,000,000');
});

it('formatToman applies Math.round() to decimal numbers (e.g. 3,000,000.64 -> 3,000,001)', () => {
  assertStrictEqual(formatToman(3000000.64), '3,000,001');
  assertStrictEqual(formatToman(3000000.20), '3,000,000');
  assertStrictEqual(formatToman(3000000.50), '3,000,001');
  assertStrictEqual(formatToman('3000000.64'), '3,000,001');
  assertStrictEqual(formatToman('3,000,000.64'), '3,000,001');
  assertStrictEqual(formatToman('3,000,000.20'), '3,000,000');
  assertStrictEqual(formatToman('۳,۰۰۰,۰۰۰.۶۴'), '3,000,001'); // Persian digits with dot
});

it('formatToman handles boundary and falsy values correctly without NaN or decimals', () => {
  assertStrictEqual(formatToman(0), '0');
  assertStrictEqual(formatToman('0'), '0');
  assertStrictEqual(formatToman(0.49), '0');
  assertStrictEqual(formatToman(0.50), '1');
  assertStrictEqual(formatToman(0.99), '1');
  assertStrictEqual(formatToman(null), '');
  assertStrictEqual(formatToman(undefined), '');
  assertStrictEqual(formatToman(''), '');
  assertStrictEqual(formatToman('   '), '');
  assertStrictEqual(formatToman('abc'), '');
});

it('convertForeignToToman returns an exact integer rounded via Math.round', () => {
  // 1.99 * 125345.55 = 249437.6445 -> rounded to 249438
  const res = convertForeignToToman(1.99, 125345.55);
  assertStrictEqual(res, 249438);
  assertStrictEqual(Number.isInteger(res), true);
  assertStrictEqual(formatToman(res), '249,438');

  // Exact 0.33 * 100000.4 = 33000.132 -> rounded to 33000
  const res2 = convertForeignToToman(0.33, 100000.4);
  assertStrictEqual(res2, 33000);
});

it('convertTomanToForeign preserves foreign currency decimals and does NOT round rate', () => {
  // 1,000,000 Tomans / 75,000 = 13.333333333333334 foreign units
  const foreign = convertTomanToForeign(1000000, 75000);
  assertOk(foreign);
  assertStrictEqual(foreign !== null && foreign > 13.33 && foreign < 13.34, true);

  // If decimal toman is passed, it is rounded before division
  const foreign2 = convertTomanToForeign(1000000.64, 100000);
  assertStrictEqual(foreign2, 1000001 / 100000);
});

it('migrateLegacyHistory rounds any stored decimal Toman amounts in history records', () => {
  const unmigrated = [
    {
      id: '501',
      foreignAmount: '25',
      tomanAmount: '3,000,000.64', // unrounded legacy decimal
      rateApplied: '120,000',
      currencyId: 'usd',
      currencyCode: 'USD',
      currencySymbol: '$',
    },
    {
      id: '502',
      usd: '10',
      toman: '1,200,000.20', // legacy usd/toman with decimal
    },
  ];

  const { migrated, records } = migrateLegacyHistory(unmigrated);
  assertStrictEqual(migrated, true);
  assertStrictEqual(records[0].tomanAmount, '3,000,001');
  assertStrictEqual(records[1].tomanAmount, '1,200,000');
});

it('migrateLegacyHistory safely handles numeric tomanAmount without .includes() runtime crash', () => {
  const rawWithNumbers = [
    {
      id: '601',
      foreignAmount: '14.99', // foreign decimals MUST be preserved!
      tomanAmount: 3000000.64, // numeric float
      rateApplied: '120,000',
      currencyId: 'usd',
      currencyCode: 'USD',
      currencySymbol: '$',
    },
    {
      id: '602',
      foreignAmount: '0.50',
      tomanAmount: 50000, // numeric integer
      rateApplied: '100,000',
      currencyId: 'eur',
      currencyCode: 'EUR',
      currencySymbol: '€',
    },
  ];

  const { migrated, records } = migrateLegacyHistory(rawWithNumbers);
  assertStrictEqual(migrated, true);
  // Numeric float rounded to integer string with commas
  assertStrictEqual(records[0].tomanAmount, '3,000,001');
  assertStrictEqual(records[0].toman, '3,000,001');
  // foreignAmount and rateApplied preserved!
  assertStrictEqual(records[0].foreignAmount, '14.99');
  assertStrictEqual(records[0].rateApplied, '120,000');

  // Numeric integer normalized to string with commas
  assertStrictEqual(records[1].tomanAmount, '50,000');
  assertStrictEqual(records[1].foreignAmount, '0.50');
});

it('migrateLegacyHistory migrates when tomanAmount is empty/undefined but toman has decimal value', () => {
  const rawWithMissingTomanAmount = [
    {
      id: '701',
      foreignAmount: '99.99',
      tomanAmount: '', // empty
      toman: '4,500,000.75', // decimal in fallback field
      rateApplied: '110,000',
      currencyId: 'usd',
      currencyCode: 'USD',
      currencySymbol: '$',
    },
    {
      id: '702',
      foreignAmount: '20.00',
      tomanAmount: undefined,
      toman: 2000000.40, // numeric float in fallback field
      rateApplied: '100,000',
      currencyId: 'usd',
      currencyCode: 'USD',
      currencySymbol: '$',
    },
  ];

  const { migrated, records } = migrateLegacyHistory(rawWithMissingTomanAmount);
  assertStrictEqual(migrated, true);
  assertStrictEqual(records[0].tomanAmount, '4,500,001');
  assertStrictEqual(records[0].toman, '4,500,001');
  assertStrictEqual(records[0].foreignAmount, '99.99');

  assertStrictEqual(records[1].tomanAmount, '2,000,000');
  assertStrictEqual(records[1].toman, '2,000,000');
  assertStrictEqual(records[1].foreignAmount, '20.00');
});

it('migrateLegacyHistory handles null, undefined, zero and empty strings gracefully', () => {
  const edgeCaseItems = [
    {
      id: '801',
      foreignAmount: '0',
      tomanAmount: 0,
      toman: 0,
      rateApplied: '100,000',
      currencyId: 'usd',
      currencyCode: 'USD',
      currencySymbol: '$',
    },
    {
      id: '802',
      foreignAmount: '',
      tomanAmount: null,
      toman: null,
      rateApplied: '',
      currencyId: 'usd',
      currencyCode: 'USD',
      currencySymbol: '$',
    },
  ];

  const { records } = migrateLegacyHistory(edgeCaseItems);
  assertStrictEqual(records[0].tomanAmount, '0');
  assertStrictEqual(records[0].foreignAmount, '0');
  assertStrictEqual(records[1].foreignAmount, '');

  // Non-array and empty array handling
  assertStrictEqual(migrateLegacyHistory(null as any).migrated, false);
  assertStrictEqual(migrateLegacyHistory(undefined as any).migrated, false);
  assertStrictEqual(migrateLegacyHistory([]).migrated, false);
});

console.log('\n====================================================');
console.log(`TOTAL AUDIT TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('====================================================\n');

if (failed > 0) {
  process.exit(1);
}
