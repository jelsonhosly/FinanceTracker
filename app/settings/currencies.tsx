import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, DollarSign, Check, Plus, Trash2, CreditCard as Edit3, Globe, Star, ChevronRight, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { BlurView } from 'expo-blur';
import { Currency } from '@/types';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

export default function CurrenciesSettings() {
  const { theme } = useTheme();
  const router = useRouter();
  const { currencies, mainCurrencyCode, setMainCurrency, addCurrency, updateCurrency, deleteCurrency } = useData();
  
  const [showAddCurrency, setShowAddCurrency] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [newCurrencyCode, setNewCurrencyCode] = useState('');
  const [newCurrencyName, setNewCurrencyName] = useState('');
  const [newCurrencySymbol, setNewCurrencySymbol] = useState('');
  const [newCurrencyRate, setNewCurrencyRate] = useState('');
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  const handleSetMainCurrency = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return;

    setCustomAlertTitle('Change Main Currency');
    setCustomAlertMessage(`Set ${currency.name} (${currency.code}) as your main currency? This will affect how balances are displayed throughout the app.`);
    setCustomAlertType('info');
    setCustomAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change',
        onPress: () => setMainCurrency(currencyCode),
      },
    ]);
    setShowCustomAlert(true);
  };

  const handleDeleteCurrency = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    if (!currency) return;

    if (currency.isMain) {
      setCustomAlertTitle('Cannot Delete');
      setCustomAlertMessage('You cannot delete the main currency. Please set another currency as main first.');
      setCustomAlertType('warning');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    setCustomAlertTitle('Delete Currency');
    setCustomAlertMessage(`Are you sure you want to delete ${currency.name} (${currency.code})?`);
    setCustomAlertType('warning');
    setCustomAlertButtons([
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteCurrency(currencyCode),
      },
    ]);
    setShowCustomAlert(true);
  };

  const handleEditCurrency = (currency: Currency) => {
    setEditingCurrency(currency);
    setNewCurrencyCode(currency.code);
    setNewCurrencyName(currency.name);
    setNewCurrencySymbol(currency.symbol);
    setNewCurrencyRate(currency.rate.toString());
    setShowAddCurrency(true);
  };

  const handleSaveCurrency = () => {
    if (!newCurrencyCode.trim() || !newCurrencyName.trim() || !newCurrencySymbol.trim() || !newCurrencyRate.trim()) {
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Please fill in all fields');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    const rate = parseFloat(newCurrencyRate);
    if (isNaN(rate) || rate <= 0) {
      setCustomAlertTitle('Error');
      setCustomAlertMessage('Please enter a valid exchange rate');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    const currencyData: Currency = {
      code: newCurrencyCode.toUpperCase().trim(),
      name: newCurrencyName.trim(),
      symbol: newCurrencySymbol.trim(),
      rate,
      isMain: editingCurrency?.isMain || false,
    };

    if (editingCurrency) {
      updateCurrency(currencyData);
    } else {
      // Check if currency already exists
      if (currencies.find(c => c.code === currencyData.code)) {
        setCustomAlertTitle('Error');
        setCustomAlertMessage('A currency with this code already exists');
        setCustomAlertType('error');
        setCustomAlertButtons([{ text: 'OK' }]);
        setShowCustomAlert(true);
        return;
      }
      addCurrency(currencyData);
    }

    setShowAddCurrency(false);
    setEditingCurrency(null);
    setNewCurrencyCode('');
    setNewCurrencyName('');
    setNewCurrencySymbol('');
    setNewCurrencyRate('');
  };

  const resetForm = () => {
    setEditingCurrency(null);
    setNewCurrencyCode('');
    setNewCurrencyName('');
    setNewCurrencySymbol('');
    setNewCurrencyRate('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Currencies
          </Text>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              resetForm();
              setShowAddCurrency(true);
            }}
          >
            <Plus size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Main Currency Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <View style={styles.sectionHeader}>
              <Star size={24} color={theme.colors.warning} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Main Currency
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              This currency is used for displaying total balances and as the base for exchange rates.
            </Text>
            
            {mainCurrency && (
              <View style={[styles.mainCurrencyCard, { backgroundColor: theme.colors.primary + '15' }]}>
                <View style={styles.currencyInfo}>
                  <View style={[styles.currencyIcon, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.currencySymbol}>{mainCurrency.symbol}</Text>
                  </View>
                  <View style={styles.currencyDetails}>
                    <Text style={[styles.currencyName, { color: theme.colors.text }]}>
                      {mainCurrency.name}
                    </Text>
                    <Text style={[styles.currencyCode, { color: theme.colors.textSecondary }]}>
                      {mainCurrency.code}
                    </Text>
                  </View>
                </View>
                <View style={[styles.mainBadge, { backgroundColor: theme.colors.primary }]}>
                  <Star size={12} color="white" />
                  <Text style={styles.mainBadgeText}>Main</Text>
                </View>
              </View>
            )}
          </View>

          {/* All Currencies Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <View style={styles.sectionHeader}>
              <Globe size={24} color={theme.colors.secondary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Available Currencies
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Manage your currencies and exchange rates. Tap to set as main currency.
            </Text>

            <View style={styles.currenciesList}>
              {currencies.map((currency) => (
                <View key={currency.code} style={[styles.currencyItem, { backgroundColor: theme.colors.background }]}>
                  <TouchableOpacity
                    style={styles.currencyMainContent}
                    onPress={() => handleSetMainCurrency(currency.code)}
                    disabled={currency.isMain}
                  >
                    <View style={styles.currencyInfo}>
                      <View style={[
                        styles.currencyIcon, 
                        { backgroundColor: currency.isMain ? theme.colors.primary : theme.colors.textSecondary }
                      ]}>
                        <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                      </View>
                      <View style={styles.currencyDetails}>
                        <View style={styles.currencyNameRow}>
                          <Text style={[styles.currencyName, { color: theme.colors.text }]}>
                            {currency.name}
                          </Text>
                          {currency.isMain && (
                            <View style={[styles.mainIndicator, { backgroundColor: theme.colors.primary }]}>
                              <Star size={10} color="white" />
                            </View>
                          )}
                        </View>
                        <Text style={[styles.currencyCode, { color: theme.colors.textSecondary }]}>
                          {currency.code}
                        </Text>
                        <Text style={[styles.exchangeRate, { color: theme.colors.textSecondary }]}>
                          1 USD = {currency.rate.toFixed(4)} {currency.code}
                        </Text>
                      </View>
                    </View>
                    {!currency.isMain && (
                      <ChevronRight size={16} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.currencyActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.colors.primary + '15' }]}
                      onPress={() => handleEditCurrency(currency)}
                    >
                      <Edit3 size={14} color={theme.colors.primary} />
                    </TouchableOpacity>
                    
                    {!currency.isMain && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.error + '15' }]}
                        onPress={() => handleDeleteCurrency(currency.code)}
                      >
                        <Trash2 size={14} color={theme.colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Exchange Rate Info */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Exchange Rate Information
            </Text>
            <View style={styles.infoList}>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • Exchange rates are relative to USD as the base currency
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • Rates are used to convert balances for display purposes
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • Update rates regularly for accurate conversions
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • The main currency determines how totals are displayed
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Add/Edit Currency Modal */}
      {showAddCurrency && (
        <Modal
          transparent
          visible={showAddCurrency}
          animationType="fade"
          onRequestClose={() => setShowAddCurrency(false)}
        >
          <View style={styles.modalContainer}>
            <BlurView 
              intensity={Platform.OS === 'ios' ? 20 : 15}
              tint={theme.dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {editingCurrency ? 'Edit Currency' : 'Add Currency'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddCurrency(false)}>
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Currency Code (e.g., USD, EUR)
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={newCurrencyCode}
                    onChangeText={setNewCurrencyCode}
                    placeholder="USD"
                    placeholderTextColor={theme.colors.textSecondary}
                    autoCapitalize="characters"
                    maxLength={3}
                    editable={!editingCurrency} // Don't allow editing code for existing currencies
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Currency Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={newCurrencyName}
                    onChangeText={setNewCurrencyName}
                    placeholder="US Dollar"
                    placeholderTextColor={theme.colors.textSecondary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Currency Symbol
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={newCurrencySymbol}
                    onChangeText={setNewCurrencySymbol}
                    placeholder="$"
                    placeholderTextColor={theme.colors.textSecondary}
                    maxLength={5}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                    Exchange Rate (1 USD = ? {newCurrencyCode || 'XXX'})
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    value={newCurrencyRate}
                    onChangeText={setNewCurrencyRate}
                    placeholder="1.0"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                  onPress={() => setShowAddCurrency(false)}
                >
                  <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleSaveCurrency}
                >
                  <Text style={[styles.modalButtonText, { color: 'white' }]}>
                    {editingCurrency ? 'Save Changes' : 'Add Currency'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  mainCurrencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  currenciesList: {
    gap: 8,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  currencyMainContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  currencyDetails: {
    flex: 1,
  },
  currencyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 14,
    marginTop: 2,
  },
  exchangeRate: {
    fontSize: 12,
    marginTop: 2,
  },
  mainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mainBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  currencyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoList: {
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
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
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});