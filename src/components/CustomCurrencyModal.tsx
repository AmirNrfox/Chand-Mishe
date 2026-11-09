import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Currency, createCustomCurrency, parseRate } from '../types/currency';

export interface CustomCurrencyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (currency: Currency, rate: string) => void;
  onDelete?: (currencyId: string) => void;
  currencyToEdit?: Currency | null;
  currentRate?: string;
  theme: any;
  isDark: boolean;
  isRTL: boolean;
  fontBold: any;
  fontSemiBold: any;
  fontRegular: any;
}

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

export const CustomCurrencyModal: React.FC<CustomCurrencyModalProps> = ({
  visible,
  onClose,
  onSave,
  onDelete,
  currencyToEdit,
  currentRate,
  theme,
  isDark,
  isRTL,
  fontBold,
  fontSemiBold,
  fontRegular,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [symbol, setSymbol] = useState('');
  const [rateText, setRateText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const isEditing = !!currencyToEdit;

  useEffect(() => {
    if (visible) {
      if (currencyToEdit) {
        setName(isRTL ? currencyToEdit.name.fa : currencyToEdit.name.en);
        setCode(currencyToEdit.code);
        setSymbol(currencyToEdit.symbol);
        setRateText(currentRate ? formatIntegerWithCommas(currentRate) : '');
      } else {
        setName('');
        setCode('');
        setSymbol('');
        setRateText('');
      }
      setErrorMsg('');
      setShowConfirmDelete(false);
    }
  }, [visible, currencyToEdit, currentRate, isRTL]);

  const handleRateChange = (text: string) => {
    const raw = cleanDigits(text).replace(/[^0-9]/g, '');
    setRateText(formatIntegerWithCommas(raw));
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg(isRTL ? 'لطفاً نام ارز را وارد کنید.' : 'Please enter currency name.');
      return;
    }

    const trimmedCode = (code.trim() || trimmedName.slice(0, 4)).toUpperCase();
    const trimmedSymbol = symbol.trim() || trimmedCode.slice(0, 3);

    const currency = createCustomCurrency({
      id: currencyToEdit?.id,
      name: trimmedName,
      code: trimmedCode,
      symbol: trimmedSymbol,
      quickAmounts: currencyToEdit?.quickAmounts,
    });

    const parsed = parseRate(rateText);
    const cleanRate = parsed !== null ? parsed.toString() : '';

    onSave(currency, cleanRate);
    onClose();
  };

  const handleDeleteTrigger = () => {
    if (!currencyToEdit || !onDelete) return;

    if (Platform.OS === 'web') {
      setShowConfirmDelete(true);
    } else {
      Alert.alert(
        isRTL ? 'حذف ارز دلخواه' : 'Delete Custom Currency',
        isRTL
          ? `آیا از حذف ارز «${currencyToEdit.name.fa || currencyToEdit.code}» مطمئن هستید؟`
          : `Are you sure you want to delete "${currencyToEdit.code}"?`,
        [
          { text: isRTL ? 'انصراف' : 'Cancel', style: 'cancel' },
          {
            text: isRTL ? 'حذف' : 'Delete',
            style: 'destructive',
            onPress: () => {
              onDelete(currencyToEdit.id);
              onClose();
            },
          },
        ]
      );
    }
  };

  const confirmWebDelete = () => {
    if (currencyToEdit && onDelete) {
      onDelete(currencyToEdit.id);
      onClose();
    }
  };

  const flexDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.cardBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { flexDirection }]}>
            <View style={[styles.titleRow, { flexDirection }]}>
              <View
                style={[
                  styles.headerIconCircle,
                  {
                    backgroundColor: isEditing
                      ? isDark
                        ? 'rgba(96, 165, 250, 0.18)'
                        : '#EEF2FF'
                      : isDark
                      ? 'rgba(52, 211, 153, 0.18)'
                      : '#CCFBF1',
                  },
                ]}
              >
                <Ionicons
                  name={isEditing ? 'create-outline' : 'add-circle-outline'}
                  size={20}
                  color={isEditing ? theme.primary : theme.accentGreen}
                />
              </View>
              <Text style={[styles.modalTitle, { color: theme.textMain }, fontBold]}>
                {isEditing
                  ? isRTL
                    ? 'ویرایش ارز دلخواه'
                    : 'Edit Custom Currency'
                  : isRTL
                  ? 'افزودن ارز دلخواه'
                  : 'Add Custom Currency'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.chipBg }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={theme.textSub} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollBody}
          >
            {/* Currency Name Field */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.textSub, textAlign: isRTL ? 'right' : 'left' },
                  fontSemiBold,
                ]}
              >
                {isRTL ? 'نام ارز' : 'Currency Name'}{' '}
                <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: theme.cardInner,
                    borderColor: theme.inputBorder,
                    flexDirection,
                  },
                ]}
              >
                <Ionicons
                  name="text-outline"
                  size={16}
                  color={theme.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.textMain,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                    fontRegular,
                  ]}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={
                    isRTL ? 'مثلاً: پوند انگلیس یا دلار کانادا' : 'e.g. British Pound'
                  }
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* Code and Symbol Row */}
            <View style={[styles.rowTwoCols, { flexDirection }]}>
              {/* Currency Code */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.textSub, textAlign: isRTL ? 'right' : 'left' },
                    fontSemiBold,
                  ]}
                >
                  {isRTL ? 'کد ارز (اختیاری)' : 'Code (Optional)'}
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: theme.cardInner,
                      borderColor: theme.inputBorder,
                      flexDirection,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: theme.textMain,
                        textAlign: isRTL ? 'right' : 'left',
                        textTransform: 'uppercase',
                      },
                      fontBold,
                    ]}
                    value={code}
                    onChangeText={(val) => setCode(val.toUpperCase())}
                    maxLength={6}
                    placeholder="GBP"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>

              {/* Currency Symbol */}
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text
                  style={[
                    styles.fieldLabel,
                    { color: theme.textSub, textAlign: isRTL ? 'right' : 'left' },
                    fontSemiBold,
                  ]}
                >
                  {isRTL ? 'نماد' : 'Symbol'}
                </Text>
                <View
                  style={[
                    styles.inputWrap,
                    {
                      backgroundColor: theme.cardInner,
                      borderColor: theme.inputBorder,
                      flexDirection,
                    },
                  ]}
                >
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        color: theme.textMain,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                      fontBold,
                    ]}
                    value={symbol}
                    onChangeText={setSymbol}
                    maxLength={6}
                    placeholder="£"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              </View>
            </View>

            {/* Rate in Tomans Field */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.fieldLabel,
                  { color: theme.textSub, textAlign: isRTL ? 'right' : 'left' },
                  fontSemiBold,
                ]}
              >
                {isRTL ? 'نرخ تبدیل به تومان' : 'Exchange Rate to Toman'}
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: theme.cardInner,
                    borderColor: theme.inputBorder,
                    flexDirection,
                  },
                ]}
              >
                <Ionicons
                  name="calculator-outline"
                  size={16}
                  color={theme.textMuted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: theme.textMain,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                    fontBold,
                  ]}
                  keyboardType="numeric"
                  value={rateText}
                  onChangeText={handleRateChange}
                  placeholder={isRTL ? 'مثلاً: ۱۱۵,۰۰۰' : 'e.g. 115,000'}
                  placeholderTextColor={theme.textMuted}
                />
                <View style={[styles.tomanBadge, { backgroundColor: theme.chipBg }]}>
                  <Text style={[styles.tomanBadgeText, { color: theme.textSub }, fontSemiBold]}>
                    {isRTL ? 'تومان' : 'Toman'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Error Message */}
            {errorMsg !== '' && (
              <View style={[styles.errorRow, { flexDirection }]}>
                <Ionicons name="alert-circle" size={14} color="#EF4444" />
                <Text style={[styles.errorText, fontRegular]}>{errorMsg}</Text>
              </View>
            )}

            {/* In-Modal Delete Confirmation for Web */}
            {showConfirmDelete && (
              <View
                style={[
                  styles.confirmDeleteCard,
                  {
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.confirmDeleteText,
                    { color: isDark ? '#FCA5A5' : '#DC2626' },
                    fontSemiBold,
                  ]}
                >
                  {isRTL
                    ? 'آیا از حذف این ارز اطمینان دارید؟ تمام نرخ‌ها پاک خواهند شد.'
                    : 'Are you sure you want to delete this currency?'}
                </Text>
                <View style={[styles.confirmDeleteBtns, { flexDirection }]}>
                  <TouchableOpacity
                    onPress={confirmWebDelete}
                    style={[styles.confirmDeleteBtn, { backgroundColor: '#EF4444' }]}
                  >
                    <Text style={[styles.confirmBtnText, fontBold]}>
                      {isRTL ? 'بله، حذف کن' : 'Yes, Delete'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setShowConfirmDelete(false)}
                    style={[styles.cancelDeleteBtn, { backgroundColor: theme.chipBg }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.textSub }, fontSemiBold]}>
                      {isRTL ? 'انصراف' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={[styles.actionsRow, { flexDirection }]}>
              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveBtn,
                  {
                    backgroundColor: isDark ? '#38BDF8' : theme.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-sharp" size={18} color="#FFFFFF" />
                <Text style={[styles.saveBtnText, fontBold]}>
                  {isRTL ? 'ذخیره ارز' : 'Save Currency'}
                </Text>
              </TouchableOpacity>

              {isEditing && onDelete && (
                <TouchableOpacity
                  onPress={handleDeleteTrigger}
                  style={[
                    styles.deleteBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(239, 68, 68, 0.15)'
                        : '#FEE2E2',
                      borderColor: isDark
                        ? 'rgba(239, 68, 68, 0.35)'
                        : '#FCA5A5',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={[styles.deleteBtnText, fontBold]}>
                    {isRTL ? 'حذف' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    maxHeight: '85%',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    alignItems: 'center',
    gap: 10,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  rowTwoCols: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
  },
  inputWrap: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  fieldIcon: {
    marginRight: 6,
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 10,
  },
  tomanBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
    marginRight: 6,
  },
  tomanBadgeText: {
    fontSize: 11,
  },
  errorRow: {
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  confirmDeleteCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  confirmDeleteText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  confirmDeleteBtns: {
    justifyContent: 'center',
    gap: 10,
  },
  confirmDeleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  cancelDeleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cancelBtnText: {
    fontSize: 12,
  },
  actionsRow: {
    gap: 10,
    marginTop: 6,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 14,
  },
});
