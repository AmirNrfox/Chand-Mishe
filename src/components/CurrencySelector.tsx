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

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
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
                  backgroundColor: isActive
                    ? isDark
                      ? 'rgba(56, 189, 248, 0.16)'
                      : '#EEF2FF'
                    : isDark
                    ? '#111827'
                    : '#FFFFFF',
                  borderColor: isActive
                    ? theme.activeBorder
                    : theme.cardBorder,
                  borderWidth: isActive ? 1.5 : 1,
                  shadowColor: isActive ? theme.primary : '#000',
                  shadowOpacity: isActive ? 0.2 : 0.04,
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
                        ? 'rgba(56, 189, 248, 0.25)'
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
                        size={11}
                        color={isActive ? theme.primary : theme.textMuted}
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

              {/* Active Indicator Pip */}
              {isActive && (
                <View
                  style={[
                    styles.activePip,
                    {
                      backgroundColor: isDark ? '#38BDF8' : theme.primary,
                    },
                  ]}
                />
              )}
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
    marginVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  currencyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 14,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
    position: 'relative',
  },
  symbolCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbolText: {
    fontSize: 13,
  },
  codeWrap: {
    justifyContent: 'center',
  },
  codeRow: {
    alignItems: 'center',
    gap: 4,
  },
  codeText: {
    fontSize: 13,
    letterSpacing: 0.3,
  },
  subNameText: {
    fontSize: 10,
    marginTop: -1,
    maxWidth: 75,
  },
  customEditIcon: {
    padding: 2,
  },
  activePip: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 2,
  },
  addPill: {
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  addIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontSize: 12,
  },
});
