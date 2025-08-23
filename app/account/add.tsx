import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, createElement } from 'react';
import { X, Check, Palette, ChevronRight, CreditCard, Landmark, ArrowLeft } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { IconColorPicker, LucideIconMap } from '@/components/IconColorPicker';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs' },
];

const ACCOUNT_COLORS = [
  '#0A84FF', '#5E5CE6', '#30D158', '#FF9F0A', '#FF375F', '#BF5AF2',
  '#64D2FF', '#5856D6', '#34C759', '#FFCC02', '#FF3B30', '#A855F7',
  '#007AFF', '#5AC8FA', '#32D74B', '#FFCC02', '#FF2D55', '#AF52DE',
];

export default function AddAccount() {
  const { theme } = useTheme();
  const { addAccount, updateAccount, accounts, currencies } = useData();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // Determine if we're editing an existing account
  const isEditing = !!id;
  const existingAccount = isEditing ? accounts.find(a => a.id === id) : null;

  const [name, setName] = useState('');
  const [isCreditAccount, setIsCreditAccount] = useState(false);
  const [initialAmount, setInitialAmount] = useState('0.00');
  const [currency, setCurrency] = useState('USD');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [selectedLucideIconName, setSelectedLucideIconName] = useState<string>('Landmark');
  const [selectedCustomIconUri, setSelectedCustomIconUri] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState('0.00');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showIconColorPicker, setShowIconColorPicker] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  // Load existing account data when editing
  useEffect(() => {
    if (isEditing && existingAccount) {
      setName(existingAccount.name);
      setIsCreditAccount(existingAccount.type === 'credit');
      setCurrentBalance(existingAccount.balance.toString());
      setCurrency(existingAccount.currency);
      setSelectedColor(existingAccount.color);
      setSelectedLucideIconName(existingAccount.lucideIconName || 'Landmark');
      setSelectedCustomIconUri(existingAccount.icon || null);
    }
  }, [isEditing, existingAccount]);

  // Update icon based on account type when no custom icon is selected (only for new accounts)
  useEffect(() => {
    if (!isEditing && !selectedCustomIconUri) {
      setSelectedLucideIconName(isCreditAccount ? 'CreditCard' : 'Landmark');
    }
  }, [isCreditAccount, selectedCustomIconUri, isEditing]);

  const handleSave = () => {
    if (!name.trim()) {
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Please enter an account name');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    if (isEditing && existingAccount) {
      // Update existing account
      const updatedAccount = {
        ...existingAccount,
        name: name.trim(),
        type: isCreditAccount ? 'credit' : 'checking',
        balance: parseFloat(currentBalance) || 0,
        currency: currency,
        color: selectedColor,
        lucideIconName: selectedCustomIconUri ? undefined : selectedLucideIconName,
        icon: selectedCustomIconUri || undefined,
      };
      updateAccount(updatedAccount);
    } else {
      // Create new account
      const initialAmountValue = parseFloat(initialAmount) || 0;
      const calculatedBalance = parseFloat(currentBalance) || (isCreditAccount ? -Math.abs(initialAmountValue) : initialAmountValue);

      addAccount({
        name: name.trim(),
        type: isCreditAccount ? 'credit' : 'checking',
        balance: calculatedBalance,
        currency: currency,
        color: selectedColor,
        lucideIconName: selectedCustomIconUri ? undefined : selectedLucideIconName,
        icon: selectedCustomIconUri || undefined,
      });
    }

    router.back();
  };

  const selectedCurrency = currencies.find(curr => curr.code === currency);

  const renderAccountIconPreview = () => {
    if (selectedCustomIconUri) {
      return (
        <Image
          key={selectedCustomIconUri}
          source={{ uri: selectedCustomIconUri }}
          style={styles.customIconPreview}
          resizeMode="contain"
        />
      );
    }
    if (selectedLucideIconName && LucideIconMap[selectedLucideIconName]) {
      const IconComponent = LucideIconMap[selectedLucideIconName];
      return createElement(IconComponent, { size: 32, color: 'white' });
    }
    return (
      <Text style={styles.iconPreviewText}>
        {name.charAt(0).toUpperCase() || '?'}
      </Text>
    );
  };

  const getCalculatedBalance = () => {
    return parseFloat(currentBalance) || 0;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={[styles.header, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity 
              style={styles.headerButton} 
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
              {isEditing ? 'Edit Account' : 'New Account'}
            </Text>
            <TouchableOpacity 
              style={[
                styles.headerButton,
                styles.saveButton,
                { backgroundColor: name.trim() ? theme.colors.primary : theme.colors.border }
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <Check size={20} color={name.trim() ? 'white' : theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Account Preview */}
            <View style={[styles.previewCard, { backgroundColor: theme.colors.card }]}>
              <View style={[styles.accountIcon, { backgroundColor: selectedColor }]}>
                {renderAccountIconPreview()}
              </View>
              <View style={styles.previewInfo}>
                <Text style={[styles.previewName, { color: theme.colors.text }]}>
                  {name || 'Account Name'}
                </Text>
                <Text style={[styles.previewType, { color: theme.colors.textSecondary }]}>
                  {isCreditAccount ? 'Credit Account' : 'Regular Account'}
                </Text>
                <Text style={[styles.previewBalance, { color: theme.colors.text }]}>
                  {selectedCurrency?.symbol}{Math.abs(getCalculatedBalance()).toFixed(2)}
                </Text>
                {isEditing && existingAccount && existingAccount.balance < 0 && (
                  <Text style={[styles.balanceNote, { color: theme.colors.error }]}>
                    Amount Owed
                  </Text>
                )}
              </View>
            </View>

            {/* Account Type Selection - Only show for new accounts */}
            {!isEditing && (
              <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Type</Text>
                <View style={styles.accountTypeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.accountTypeCard,
                      { backgroundColor: theme.colors.background },
                      !isCreditAccount && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
                    ]}
                    onPress={() => setIsCreditAccount(false)}
                  >
                    <View style={[
                      styles.accountTypeIcon,
                      { backgroundColor: !isCreditAccount ? theme.colors.primary + '20' : theme.colors.background }
                    ]}>
                      <Landmark size={24} color={!isCreditAccount ? theme.colors.primary : theme.colors.textSecondary} />
                    </View>
                    <View style={styles.accountTypeInfo}>
                      <Text style={[
                        styles.accountTypeTitle,
                        { color: !isCreditAccount ? theme.colors.primary : theme.colors.text }
                      ]}>
                        Regular Account
                      </Text>
                      <Text style={[
                        styles.accountTypeDescription,
                        { color: !isCreditAccount ? theme.colors.primary + 'CC' : theme.colors.textSecondary }
                      ]}>
                        Checking, savings, cash accounts
                      </Text>
                    </View>
                    {!isCreditAccount && (
                      <Check size={20} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.accountTypeCard,
                      { backgroundColor: theme.colors.background },
                      isCreditAccount && { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error }
                    ]}
                    onPress={() => setIsCreditAccount(true)}
                  >
                    <View style={[
                      styles.accountTypeIcon,
                      { backgroundColor: isCreditAccount ? theme.colors.error + '20' : theme.colors.background }
                    ]}>
                      <CreditCard size={24} color={isCreditAccount ? theme.colors.error : theme.colors.textSecondary} />
                    </View>
                    <View style={styles.accountTypeInfo}>
                      <Text style={[
                        styles.accountTypeTitle,
                        { color: isCreditAccount ? theme.colors.error : theme.colors.text }
                      ]}>
                        Credit Account
                      </Text>
                      <Text style={[
                        styles.accountTypeDescription,
                        { color: isCreditAccount ? theme.colors.error + 'CC' : theme.colors.textSecondary }
                      ]}>
                        Credit cards, lines of credit
                      </Text>
                    </View>
                    {isCreditAccount && (
                      <Check size={20} color={theme.colors.error} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Account Details */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account Details</Text>
              
              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Name</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter account name"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              {/* Currency Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Currency</Text>
                <TouchableOpacity
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border,
                      justifyContent: 'space-between',
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                  ]}
                  onPress={() => setShowCurrencyPicker(true)}
                >
                  <Text style={[styles.inputText, { color: theme.colors.text }]}>
                    {selectedCurrency?.code} {selectedCurrency?.name}
                  </Text>
                  <ChevronRight size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Initial Amount Input - Only show for new accounts */}
              {!isEditing && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Initial Amount</Text>
                  <View style={styles.balanceInputContainer}>
                    <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>
                      {selectedCurrency?.symbol}
                    </Text>
                    <TextInput
                      style={[
                        styles.balanceInput,
                        {
                          backgroundColor: theme.colors.background,
                          color: theme.colors.text,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      value={initialAmount}
                      onChangeText={setInitialAmount}
                      placeholder="0.00"
                      placeholderTextColor={theme.colors.textSecondary}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              )}

              {/* Current Balance Display */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                  Current Balance
                </Text>
                <View style={styles.balanceInputContainer}>
                  <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>
                    {selectedCurrency?.symbol}
                  </Text>
                  <TextInput
                    style={[
                      styles.balanceInput,
                      {
                        backgroundColor: theme.colors.background,
                        color: getCalculatedBalance() >= 0 ? theme.colors.success : theme.colors.error,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={currentBalance}
                    onChangeText={setCurrentBalance}
                    placeholder="0.00"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={[styles.balanceHint, { color: theme.colors.textSecondary }]}>
                  {isCreditAccount 
                    ? 'Enter the amount owed (will be shown as negative)'
                    : 'Enter the current account balance'
                  }
                </Text>
              </View>
            </View>

            {/* Icon & Color Selection */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
              
              <TouchableOpacity
                style={[styles.iconColorButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setShowIconColorPicker(true)}
              >
                <View style={styles.iconColorContent}>
                  <View style={styles.iconColorLeft}>
                    <Palette size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.iconColorLabel, { color: theme.colors.textSecondary }]}>Icon & Color</Text>
                  </View>
                  <View style={styles.iconColorPreview}>
                    <View style={[styles.colorPreview, { backgroundColor: selectedColor }]} />
                    <Text style={[styles.iconColorText, { color: theme.colors.text }]}>
                      {selectedCustomIconUri ? 'Custom Icon' : selectedLucideIconName}
                    </Text>
                    <ChevronRight size={16} color={theme.colors.textSecondary} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Currency Picker Modal */}
      {showCurrencyPicker && (
        <View style={styles.modalContainer}>
          <BlurView 
            intensity={Platform.OS === 'ios' ? 20 : 15}
            tint={theme.dark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {selectedCurrency?.symbol}{Math.abs(getCalculatedBalance()).toFixed(2)}
              </Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.currencyList}>
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  style={[
                    styles.currencyItem,
                    { backgroundColor: theme.colors.background },
                    currency === curr.code && { backgroundColor: theme.colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setCurrency(curr.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <View style={styles.currencyInfo}>
                    <Text style={[styles.currencyCode, { color: theme.colors.text }]}>
                      {curr.code}
                    </Text>
                    <Text style={[styles.currencyName, { color: theme.colors.textSecondary }]}>
                      {curr.name}
                    </Text>
                  </View>
                  <Text style={[styles.currencySymbolText, { color: theme.colors.textSecondary }]}>
                    {curr.symbol}
                  </Text>
                  {currency === curr.code && (
                    <Check size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Icon & Color Picker Modal */}
      {showIconColorPicker && (
        <IconColorPicker
          visible={showIconColorPicker}
          onClose={() => setShowIconColorPicker(false)}
          currentColor={selectedColor}
          currentIcon={selectedCustomIconUri || selectedLucideIconName}
          onSave={(color, iconNameOrUri) => {
            setSelectedColor(color);
            if (iconNameOrUri.startsWith('http') || iconNameOrUri.startsWith('file') || iconNameOrUri.startsWith('data:')) {
              setSelectedCustomIconUri(iconNameOrUri);
              setSelectedLucideIconName(isCreditAccount ? 'CreditCard' : 'Landmark');
            } else {
              setSelectedLucideIconName(iconNameOrUri);
              setSelectedCustomIconUri(null);
            }
            setShowIconColorPicker(false);
          }}
        />
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={showCustomAlert}
        title={customAlertTitle}
        message={customAlertMessage}
        buttons={customAlertButtons}
        type={customAlertType}
        onClose={() => setShowCustomAlert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    // Additional styles applied inline
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  customIconPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  iconPreviewText: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  previewType: {
    fontSize: 14,
    marginBottom: 8,
  },
  previewBalance: {
    fontSize: 18,
    fontWeight: '600',
  },
  balanceNote: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  accountTypeSelector: {
    gap: 12,
  },
  accountTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  accountTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accountTypeInfo: {
    flex: 1,
  },
  accountTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountTypeDescription: {
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  inputText: {
    fontSize: 16,
  },
  balanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  balanceInput: {
    flex: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  balanceDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
  },
  balanceDisplayText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  balanceHint: {
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  iconColorButton: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  iconColorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconColorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconColorLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  iconColorPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  iconColorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 40,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 14,
  },
  currencySymbolText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
  },
});