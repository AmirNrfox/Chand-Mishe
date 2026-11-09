import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Currency } from '../types/currency';

export interface CurrencySelectorProps {
  currencies: Currency[];
  activeCurrencyId: string;
  onSelectCurrency: (currency: Currency) => void;
  onAddCurrency: () => void;
  onEditCurrency?: (currency: Currency) => void;
  theme: any;
  isDark: boolean;
  isRTL: boolean;
  fontBold: any;
  fontSemiBold: any;
  fontRegular: any;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currencies,
  activeCurrencyId,
  onSelectCurrency,
  onAddCurrency,
  onEditCurrency,
  theme,
  isDark,
  isRTL,
  fontBold,
  fontSemiBold,
  fontRegular,
}) => {
  const scrollViewRef = useRef<any>(null);

  const scrollToInitial = () => {
    if (isRTL) {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    } else {
      scrollViewRef.current?.scrollTo({ x: 0, animated: false });
    }
  };

  useEffect(() => {
    const timer = setTimeout(scrollToInitial, 30);
    return () => clearTimeout(timer);
  }, [isRTL]);

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.titleWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Ionicons
            name="wallet-outline"
            size={13}
            color={isDark ? '#38BDF8' : theme.primary}
          />
          <Text style={[styles.headerTitle, { color: theme.textSub }, fontSemiBold]}>
            {isRTL ? 'انتخاب ارز' : 'Select Currency'}
          </Text>
        </View>

        <View style={[styles.hintArrowsContainer, { flexDirection: 'row' }]}>
          <Ionicons name="caret-back" size={11} color={theme.textMuted} />
          <Text style={[styles.chipsHintScroll, { color: theme.textMuted }, fontRegular]}>
            {isRTL ? 'ورق بزنید' : 'swipe'}
          </Text>
          <Ionicons name="caret-forward" size={11} color={theme.textMuted} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onContentSizeChange={scrollToInitial}
        contentContainerStyle={[
          styles.scrollContent,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        {currencies.map((currency) => {
          const isActive = currency.id === activeCurrencyId;

          return (
            <TouchableOpacity
              key={currency.id}
              activeOpacity={0.7}
              onPress={() => onSelectCurrency(currency)}
              onLongPress={() => {
                if (currency.isCustom && onEditCurrency) {
                  onEditCurrency(currency);
                }
              }}
              delayLongPress={400}
              style={[
                styles.currencyPill,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  backgroundColor: isActive
                    ? isDark
                      ? '#162235'
                      : '#EEF2FF'
                    : isDark
                    ? '#111827'
                    : '#FFFFFF',
                  borderColor: isActive
                    ? isDark
                      ? '#38BDF8'
                      : theme.activeBorder
                    : isDark
                    ? '#1F2937'
                    : theme.cardBorder,
                  borderWidth: isActive ? 1.5 : 1,
                },
              ]}
            >
              {/* Currency Symbol Icon Badge */}
              <View
                style={[
                  styles.symbolCircle,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? '#1E3A5F'
                        : 'rgba(79, 70, 229, 0.15)'
                      : theme.chipBg,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.symbolText,
                    {
                      color: isActive
                        ? isDark
                          ? '#38BDF8'
                          : theme.primary
                        : theme.textSub,
                    },
                    fontBold,
                  ]}
                >
                  {currency.symbol}
                </Text>
              </View>

              {/* Currency Code & Name */}
              <View style={[styles.codeWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.codeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text
                    style={[
                      styles.codeText,
                      {
                        color: isActive ? theme.textMain : theme.textSub,
                      },
                      isActive ? fontBold : fontSemiBold,
                    ]}
                  >
                    {currency.code}
                  </Text>
                  {currency.isCustom && onEditCurrency && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        onEditCurrency(currency);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.customEditIcon}
                    >
                      <Ionicons
                        name="pencil"
                        size={10}
                        color={isActive ? (isDark ? '#38BDF8' : theme.primary) : theme.textMuted}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.subNameText,
                    {
                      color: isActive ? (isDark ? '#94A3B8' : '#475569') : theme.textMuted,
                    },
                    fontRegular,
                  ]}
                >
                  {isRTL ? currency.name.fa : currency.name.en}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Add Custom Currency Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAddCurrency}
          style={[
            styles.addPill,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#CBD5E1',
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
          <View
            style={[
              styles.addIconCircle,
              {
                backgroundColor: isDark
                  ? 'rgba(56, 189, 248, 0.15)'
                  : 'rgba(79, 70, 229, 0.10)',
              },
            ]}
          >
            <Ionicons
              name="add"
              size={15}
              color={isDark ? '#38BDF8' : theme.primary}
            />
          </View>
          <Text
            style={[
              styles.addText,
              {
                color: isDark ? '#38BDF8' : theme.primary,
              },
              fontSemiBold,
            ]}
          >
            {isRTL ? 'ارز جدید' : 'New'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 10,
    marginTop: 2,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 7,
  },
  titleWrap: {
    alignItems: 'center',
    gap: 5,
  },
  headerTitle: {
    fontSize: 12,
  },
  hintArrowsContainer: {
    alignItems: 'center',
    gap: 3,
  },
  chipsHintScroll: {
    fontSize: 11,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 7,
    flexDirection: 'row',
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 10,
    gap: 7,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  symbolCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 11,
  },
  codeWrap: {
    justifyContent: 'center',
  },
  codeRow: {
    alignItems: 'center',
    gap: 3,
  },
  codeText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  subNameText: {
    fontSize: 9.5,
    marginTop: -1,
    maxWidth: 70,
  },
  customEditIcon: {
    padding: 1,
  },
  addPill: {
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 5,
  },
  addIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 11,
  },
});
