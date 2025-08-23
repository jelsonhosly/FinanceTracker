import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useState } from 'react';
import { CreditCard, Landmark, Wallet, Check, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

const ACCOUNT_TYPES = [
  {
    id: 'checking',
    title: 'Checking Account',
    description: 'Your primary bank account for daily transactions',
    icon: Landmark,
    color: '#0A84FF',
  },
  {
    id: 'savings',
    title: 'Savings Account',
    description: 'Money set aside for future goals',
    icon: Wallet,
    color: '#30D158',
  },
  {
    id: 'credit',
    title: 'Credit Card',
    description: 'Track credit card spending and balances',
    icon: CreditCard,
    color: '#FF375F',
  },
  {
    id: 'cash',
    title: 'Cash Wallet',
    description: 'Physical cash you carry',
    icon: Wallet,
    color: '#FF9F0A',
  },
];

const SetupAccountScreen = () => {
  const { theme } = useTheme();
  const { addAccount, currencies, mainCurrencyCode } = useData();
  
  const [accountName, setAccountName] = useState('');
  const [selectedType, setSelectedType] = useState('checking');
  const [initialBalance, setInitialBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);
  const selectedAccountType = ACCOUNT_TYPES.find(type => type.id === selectedType);

  const handleContinue = async () => {
    if (!accountName.trim()) {
      setCustomAlertTitle('Account Name Required');
      setCustomAlertMessage('Please enter a name for your account');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    const balance = parseFloat(initialBalance) || 0;
    
    setIsSubmitting(true);
    try {
      // Create the account
      addAccount({
        name: accountName.trim(),
        type: selectedType,
        balance: selectedType === 'credit' ? -Math.abs(balance) : balance,
        currency: mainCurrencyCode,
        color: selectedAccountType?.color || '#0A84FF',
        lucideIconName: selectedAccountType?.icon.name || 'Landmark',
      });

      // Navigate to category setup
      router.push('/onboarding/setup-categories');
    } catch (error) {
      console.error('Error creating account:', error);
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Failed to create account. Please try again.');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Create Your First Account</Text>
            <Text style={styles.subtitle}>
              Let's start by setting up your primary account to track your finances
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Account Type Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Account Type</Text>
              <View style={styles.accountTypes}>
                {ACCOUNT_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = selectedType === type.id;
                  
                  return (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.accountTypeCard,
                        { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                        isSelected && { 
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                          borderWidth: 2,
                        }
                      ]}
                      onPress={() => setSelectedType(type.id)}
                    >
                      <View style={[styles.accountTypeIcon, { backgroundColor: type.color + '40' }]}>
                        <IconComponent size={24} color="white" />
                      </View>
                      <View style={styles.accountTypeInfo}>
                        <Text style={styles.accountTypeTitle}>{type.title}</Text>
                        <Text style={styles.accountTypeDescription}>{type.description}</Text>
                      </View>
                      {isSelected && (
                        <Check size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Account Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Name</Text>
                <TextInput
                  style={styles.input}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="e.g., Main Checking, Savings, etc."
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {selectedType === 'credit' ? 'Current Balance Owed' : 'Current Balance'}
                </Text>
                <View style={styles.balanceInputContainer}>
                  <Text style={styles.currencySymbol}>{mainCurrency?.symbol}</Text>
                  <TextInput
                    style={styles.balanceInput}
                    value={initialBalance}
                    onChangeText={setInitialBalance}
                    placeholder="0.00"
                    placeholderTextColor="rgba(255, 255, 255, 0.6)"
                    keyboardType="decimal-pad"
                  />
                </View>
                <Text style={styles.balanceHint}>
                  {selectedType === 'credit' 
                    ? 'Enter the amount you currently owe on this card'
                    : 'Enter your current account balance'
                  }
                </Text>
              </View>
            </View>

            {/* Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.sectionTitle}>Preview</Text>
              <View style={styles.accountPreview}>
                <View style={[styles.previewIcon, { backgroundColor: selectedAccountType?.color || '#0A84FF' }]}>
                  {selectedAccountType && <selectedAccountType.icon size={24} color="white" />}
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>
                    {accountName || 'Account Name'}
                  </Text>
                  <Text style={styles.previewType}>
                    {selectedAccountType?.title}
                  </Text>
                  <Text style={styles.previewBalance}>
                    {mainCurrency?.symbol}{Math.abs(parseFloat(initialBalance) || 0).toFixed(2)}
                    {selectedType === 'credit' && parseFloat(initialBalance) > 0 && (
                      <Text style={styles.owedText}> owed</Text>
                    )}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.continueButton,
                { opacity: accountName.trim() && !isSubmitting ? 1 : 0.6 }
              ]}
              onPress={handleContinue}
              disabled={!accountName.trim() || isSubmitting}
            >
              <Text style={styles.continueButtonText}>
                {isSubmitting ? 'Creating Account...' : 'Continue'}
              </Text>
              {!isSubmitting && <ChevronRight size={20} color="white" />}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

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
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  accountTypes: {
    gap: 12,
  },
  accountTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
    color: 'white',
    marginBottom: 4,
  },
  accountTypeDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    paddingLeft: 16,
    paddingRight: 8,
  },
  balanceInput: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: 'white',
  },
  balanceHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 8,
    fontStyle: 'italic',
  },
  previewSection: {
    marginBottom: 20,
  },
  accountPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  previewType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  previewBalance: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  owedText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    padding: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default SetupAccountScreen;