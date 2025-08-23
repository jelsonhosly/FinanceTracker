import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { ArrowLeft, ArrowUp, ArrowDown, Repeat, X, Check, Calendar, Clock, Type, Receipt, RotateCcw, ChevronLeft, ChevronRight, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, ChevronDown } from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useCameraPermissions } from 'expo-camera';
import { CameraInput } from '@/components/CameraInput';
import { DatePicker } from '@/components/DatePicker';
import { TimePicker } from '@/components/TimePicker';
import AccountHorizontalSelector from '@/components/AccountHorizontalSelector';
import { CategoryHorizontalSelector } from '@/components/CategoryHorizontalSelector';
import { DocumentPickerComponent } from '@/components/DocumentPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';
import { BlurView } from 'expo-blur';

// Storage keys for defaults
const STORAGE_KEYS = {
  LAST_TRANSACTION_TYPE: 'lastTransactionType',
  LAST_ACCOUNT_ID: 'lastAccountId',
  LAST_CATEGORY: 'lastCategory',
  LAST_CURRENCY: 'lastCurrency',
};

export default function AddTransaction() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { transactions, updateTransaction, addTransaction, accounts, currencies } = useData();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const amountInputRef = useRef<TextInput>(null);
  
  // Check if we're editing an existing transaction
  const isEditing = !!id;
  const existingTransaction = isEditing ? transactions.find(t => t.id === id) : null;
  
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState({ hour: new Date().getHours(), minute: new Date().getMinutes() });
  const [showCamera, setShowCamera] = useState(false);
  const [receipt, setReceipt] = useState<{ uri: string; type: 'image' | 'pdf' } | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringUnit, setRecurringUnit] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [recurringValue, setRecurringValue] = useState('1');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  // Load defaults and existing transaction data
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        if (isEditing && existingTransaction) {
          // Load existing transaction data
          setType(existingTransaction.type);
          setAmount(existingTransaction.amount.toString());
          setSelectedCurrency(existingTransaction.currency || 'USD');
          setDescription(existingTransaction.description || '');
          
          const transactionDate = new Date(existingTransaction.date);
          setDate(transactionDate);
          setTime({ hour: transactionDate.getHours(), minute: transactionDate.getMinutes() });
          
          if (existingTransaction.receiptImage) {
            setReceipt({ uri: existingTransaction.receiptImage, type: 'image' });
          }
          
          setAccountId(existingTransaction.accountId);
          setToAccountId(existingTransaction.toAccountId || null);
          setCategory(existingTransaction.category || null);
          setSubcategory(existingTransaction.subcategory || null);
          setIsPaid(existingTransaction.isPaid);
          setIsRecurring(existingTransaction.isRecurring || false);
          setRecurringUnit(existingTransaction.recurringUnit || 'month');
          setRecurringValue((existingTransaction.recurringValue || 1).toString());
        } else {
          // Load defaults for new transaction
          const [lastType, lastAccountId, lastCategory, lastCurrency] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.LAST_TRANSACTION_TYPE),
            AsyncStorage.getItem(STORAGE_KEYS.LAST_ACCOUNT_ID),
            AsyncStorage.getItem(STORAGE_KEYS.LAST_CATEGORY),
            AsyncStorage.getItem(STORAGE_KEYS.LAST_CURRENCY),
          ]);

          if (lastType) setType(lastType as 'income' | 'expense' | 'transfer');
          if (lastAccountId && accounts.find(a => a.id === lastAccountId)) setAccountId(lastAccountId);
          if (lastCategory) setCategory(lastCategory);
          if (lastCurrency && currencies.find(c => c.code === lastCurrency)) setSelectedCurrency(lastCurrency);

          // Focus on amount field after a short delay
          setTimeout(() => {
            amountInputRef.current?.focus();
          }, 500);
        }
      } catch (error) {
        console.error('Error loading defaults:', error);
      }
    };

    loadDefaults();
  }, [isEditing, existingTransaction, accounts, currencies]);

  // Save defaults when values change (for new transactions only)
  useEffect(() => {
    if (!isEditing) {
      const saveDefaults = async () => {
        try {
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.LAST_TRANSACTION_TYPE, type),
            accountId ? AsyncStorage.setItem(STORAGE_KEYS.LAST_ACCOUNT_ID, accountId) : Promise.resolve(),
            category ? AsyncStorage.setItem(STORAGE_KEYS.LAST_CATEGORY, category) : Promise.resolve(),
            AsyncStorage.setItem(STORAGE_KEYS.LAST_CURRENCY, selectedCurrency),
          ]);
        } catch (error) {
          console.error('Error saving defaults:', error);
        }
      };

      saveDefaults();
    }
  }, [type, accountId, category, selectedCurrency, isEditing]);

  // Track changes for editing mode
  useEffect(() => {
    if (isEditing && existingTransaction) {
      const transactionDateTime = new Date(existingTransaction.date);
      const currentDateTime = new Date(date);
      currentDateTime.setHours(time.hour, time.minute);
      
      const hasChanged = (
        type !== existingTransaction.type ||
        amount !== existingTransaction.amount.toString() ||
        selectedCurrency !== (existingTransaction.currency || 'USD') ||
        description !== (existingTransaction.description || '') ||
        currentDateTime.getTime() !== transactionDateTime.getTime() ||
        (receipt?.uri || null) !== (existingTransaction.receiptImage || null) ||
        accountId !== existingTransaction.accountId ||
        toAccountId !== (existingTransaction.toAccountId || null) ||
        category !== (existingTransaction.category || null) ||
        subcategory !== (existingTransaction.subcategory || null) ||
        isPaid !== existingTransaction.isPaid ||
        isRecurring !== (existingTransaction.isRecurring || false) ||
        recurringUnit !== (existingTransaction.recurringUnit || 'month') ||
        recurringValue !== ((existingTransaction.recurringValue || 1).toString())
      );
      setHasChanges(hasChanged);
    } else if (!isEditing) {
      const hasData = amount || description || accountId || category;
      setHasChanges(!!hasData);
    }
  }, [isEditing, existingTransaction, type, amount, selectedCurrency, description, date, time, receipt, accountId, toAccountId, category, subcategory, isPaid, isRecurring, recurringUnit, recurringValue]);

  const handleSave = () => {
    if (!amount || !accountId || (type === 'transfer' && !toAccountId)) {
      setCustomAlertTitle('Missing Information');
      setCustomAlertMessage('Please fill in all required fields');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    const amountValue = parseFloat(amount);
    const recurringValueNumber = parseInt(recurringValue) || 1;
    
    if (isNaN(amountValue) || amountValue <= 0) {
      setCustomAlertTitle('Invalid Amount');
      setCustomAlertMessage('Please enter a valid amount');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    if (isRecurring && (isNaN(recurringValueNumber) || recurringValueNumber <= 0)) {
      setCustomAlertTitle('Invalid Recurring Value');
      setCustomAlertMessage('Please enter a valid recurring interval');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }

    // Combine date and time
    const transactionDateTime = new Date(date);
    transactionDateTime.setHours(time.hour, time.minute);


    const transactionData = {
      type,
      amount: amountValue,
      currency: selectedCurrency,
      description,
      accountId,
      toAccountId: type === 'transfer' ? (toAccountId ?? undefined) : undefined,
      category: type !== 'transfer' ? (category ?? undefined) : undefined,
      subcategory: type !== 'transfer' ? (subcategory ?? undefined) : undefined,
      date: transactionDateTime.toISOString(),
      receiptImage: receipt?.uri || undefined,
      isPaid,
      isRecurring,
      recurringUnit: isRecurring ? recurringUnit : undefined,
      recurringValue: isRecurring ? recurringValueNumber : undefined,
    };

    if (isEditing && existingTransaction) {
      updateTransaction({
        ...existingTransaction,
        ...transactionData,
      });
    } else {
      addTransaction(transactionData);
    }

    router.back();
  };

  const handleDiscard = () => {
    if (hasChanges) {
      setCustomAlertTitle("Discard Changes");
      setCustomAlertMessage("You have unsaved changes. Are you sure you want to discard them?");
      setCustomAlertType('warning');
      setCustomAlertButtons([
        {
          text: "Keep Editing",
          style: "cancel"
        },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => router.back()
        }
      ]);
      setShowCustomAlert(true);
    } else {
      router.back();
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      setCustomAlertTitle('Camera Not Available');
      setCustomAlertMessage('Camera is not available on web platform');
      setCustomAlertType('warning');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      return;
    }
    
    if (!cameraPermission?.granted) {
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        return;
      }
    }
    
    setShowCamera(true);
  };

  const getTypeColor = (transactionType: 'income' | 'expense' | 'transfer') => {
    switch (transactionType) {
      case 'income':
        return theme.colors.success;
      case 'expense':
        return theme.colors.error;
      case 'transfer':
        return theme.colors.primary;
    }
  };

  const getTypeIcon = (transactionType: 'income' | 'expense' | 'transfer') => {
    switch (transactionType) {
      case 'income':
        return <ArrowDown size={20} color="white" />;
      case 'expense':
        return <ArrowUp size={20} color="white" />;
      case 'transfer':
        return <Repeat size={20} color="white" />;
    }
  };

  const formatDateTime = (date: Date, time: { hour: number; minute: number }) => {
    const dateStr = date.toLocaleDateString();
    const timeStr = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
    return { dateStr, timeStr };
  };

  const getRecurringDisplayText = () => {
    const value = parseInt(recurringValue) || 1;
    
    if (value === 1) {
      switch (recurringUnit) {
        case 'day': return 'Daily';
        case 'week': return 'Weekly';
        case 'month': return 'Monthly';
        case 'year': return 'Yearly';
        default: return 'Monthly';
      }
    } else {
      switch (recurringUnit) {
        case 'day': return `Every ${value} days`;
        case 'week': return `Every ${value} weeks`;
        case 'month': return `Every ${value} months`;
        case 'year': return `Every ${value} years`;
        default: return `Every ${value} months`;
      }
    }
  };

  const goToPreviousDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 1);
    setDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    setDate(newDate);
  };

  const adjustTime = (increment: number) => {
    const totalMinutes = time.hour * 60 + time.minute + increment;
    const newHour = Math.floor(totalMinutes / 60) % 24;
    const newMinute = totalMinutes % 60;
    
    setTime({
      hour: newHour < 0 ? 24 + newHour : newHour,
      minute: newMinute < 0 ? 60 + newMinute : newMinute
    });
  };

  // Get selected currency object
  const selectedCurrencyObj = currencies.find(c => c.code === selectedCurrency);
  const { dateStr, timeStr } = formatDateTime(date, time);

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
              onPress={handleDiscard}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                {isEditing ? 'Edit Transaction' : 'New Transaction'}
              </Text>
              {hasChanges && (
                <View style={[styles.changeIndicator, { backgroundColor: theme.colors.primary }]} />
              )}
            </View>
            <TouchableOpacity 
              style={[
                styles.headerButton,
                styles.saveButton,
                { backgroundColor: hasChanges ? theme.colors.primary : theme.colors.border }
              ]}
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <Check size={20} color={hasChanges ? 'white' : theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Transaction Type Selector */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Transaction Type</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeCard,
                    { backgroundColor: theme.colors.background },
                    type === 'income' && { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success }
                  ]}
                  onPress={() => setType('income')}
                >
                  <View style={[
                    styles.typeIconContainer,
                    { backgroundColor: type === 'income' ? theme.colors.success + '20' : theme.colors.background }
                  ]}>
                    <ArrowDown size={20} color={type === 'income' ? theme.colors.success : theme.colors.textSecondary} />
                  </View>
                  <Text style={[
                    styles.typeTitle,
                    { color: type === 'income' ? theme.colors.success : theme.colors.text }
                  ]}>
                    Income
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeCard,
                    { backgroundColor: theme.colors.background },
                    type === 'expense' && { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error }
                  ]}
                  onPress={() => setType('expense')}
                >
                  <View style={[
                    styles.typeIconContainer,
                    { backgroundColor: type === 'expense' ? theme.colors.error + '20' : theme.colors.background }
                  ]}>
                    <ArrowUp size={20} color={type === 'expense' ? theme.colors.error : theme.colors.textSecondary} />
                  </View>
                  <Text style={[
                    styles.typeTitle,
                    { color: type === 'expense' ? theme.colors.error : theme.colors.text }
                  ]}>
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeCard,
                    { backgroundColor: theme.colors.background },
                    type === 'transfer' && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
                  ]}
                  onPress={() => setType('transfer')}
                >
                  <View style={[
                    styles.typeIconContainer,
                    { backgroundColor: type === 'transfer' ? theme.colors.primary + '20' : theme.colors.background }
                  ]}>
                    <Repeat size={20} color={type === 'transfer' ? theme.colors.primary : theme.colors.textSecondary} />
                  </View>
                  <Text style={[
                    styles.typeTitle,
                    { color: type === 'transfer' ? theme.colors.primary : theme.colors.text }
                  ]}>
                    Transfer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date & Time Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Date & Time</Text>
              
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeItem}>
                  <View style={styles.inputLabelContainer}>
                    <Calendar size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Date</Text>
                  </View>
                  <View style={styles.dateTimeControls}>
                    <TouchableOpacity
                      style={[styles.arrowButton, { backgroundColor: theme.colors.background }]}
                      onPress={goToPreviousDay}
                    >
                      <ChevronLeft size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dateTimeDisplay, { backgroundColor: theme.colors.background }]}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                        {dateStr}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.arrowButton, { backgroundColor: theme.colors.background }]}
                      onPress={goToNextDay}
                    >
                      <ChevronRight size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.dateTimeItem}>
                  <View style={styles.inputLabelContainer}>
                    <Clock size={16} color={theme.colors.textSecondary} />
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Time</Text>
                  </View>
                  <View style={styles.dateTimeControls}>
                    <TouchableOpacity
                      style={[styles.arrowButton, { backgroundColor: theme.colors.background }]}
                      onPress={() => adjustTime(-15)}
                    >
                      <ChevronLeft size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dateTimeDisplay, { backgroundColor: theme.colors.background }]}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={[styles.dateTimeText, { color: theme.colors.text }]}>
                        {timeStr}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.arrowButton, { backgroundColor: theme.colors.background }]}
                      onPress={() => adjustTime(15)}
                    >
                      <ChevronRight size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Account Selection */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <AccountHorizontalSelector
                accounts={accounts}
                selectedAccountId={accountId ?? undefined}
                onAccountSelect={(id) => setAccountId(id)}
                excludeAccountId={type === 'transfer' ? toAccountId ?? undefined : undefined}
                title={type === 'transfer' ? 'From Account *' : 'Account *'}
              />
              
              {type === 'transfer' && (
                <AccountHorizontalSelector
                  accounts={accounts}
                  selectedAccountId={toAccountId || undefined}
                  onAccountSelect={(id) => setToAccountId(id)}
                  excludeAccountId={accountId ?? undefined}
                  title="To Account *"
                />
              )}
            </View>

            {/* Amount Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <View style={styles.inputHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Amount</Text>
                <Text style={[styles.requiredIndicator, { color: theme.colors.error }]}>*</Text>
              </View>
              <View style={styles.amountInputContainer}>
                <TouchableOpacity
                  style={[styles.currencySelector, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
                  onPress={() => setShowCurrencyPicker(true)}
                >
                  <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>
                    {selectedCurrencyObj?.symbol || '$'}
                  </Text>
                  <Text style={[styles.currencyCode, { color: theme.colors.textSecondary }]}>
                    {selectedCurrency}
                  </Text>
                  <ChevronDown size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TextInput
                  ref={amountInputRef}
                  style={[
                    styles.amountInput,
                    {
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Category Selection */}
            {type !== 'transfer' && (
              <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
                <CategoryHorizontalSelector
                  selectedCategory={category}
                  selectedSubcategory={subcategory}
                  onSelectCategory={setCategory}
                  onSelectSubcategory={setSubcategory}
                  transactionType={type as 'income' | 'expense'}
                  title="Category"
                />
              </View>
            )}

            {/* Payment Status Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Payment Status</Text>
              
              <View style={styles.paymentStatusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusCard,
                    { backgroundColor: theme.colors.background },
                    isPaid && { backgroundColor: theme.colors.success + '20', borderColor: theme.colors.success }
                  ]}
                  onPress={() => setIsPaid(true)}
                >
                  <CheckCircle2 size={24} color={isPaid ? theme.colors.success : theme.colors.textSecondary} />
                  <Text style={[
                    styles.statusCardText,
                    { color: isPaid ? theme.colors.success : theme.colors.text }
                  ]}>
                    Paid
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusCard,
                    { backgroundColor: theme.colors.background },
                    !isPaid && { backgroundColor: theme.colors.warning + '20', borderColor: theme.colors.warning }
                  ]}
                  onPress={() => setIsPaid(false)}
                >
                  <AlertCircle size={24} color={!isPaid ? theme.colors.warning : theme.colors.textSecondary} />
                  <Text style={[
                    styles.statusCardText,
                    { color: !isPaid ? theme.colors.warning : theme.colors.text }
                  ]}>
                    {type === 'income' ? 'Pending' : 'Due'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.paymentStatusHint, { color: theme.colors.textSecondary }]}>
                {isPaid 
                  ? 'This transaction has been completed and will affect account balances'
                  : type === 'income'
                    ? 'This income is expected but not yet received'
                    : 'This expense is due but not yet paid'
                }
              </Text>
            </View>

            {/* Description Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <View style={styles.inputLabelContainer}>
                <Type size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Description</Text>
              </View>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border
                }]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's this transaction for?"
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Receipt Section */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <View style={styles.inputLabelContainer}>
                <Receipt size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Receipt</Text>
              </View>
              <DocumentPickerComponent
                onDocumentPicked={(uri, type) => setReceipt({ uri, type })}
                currentDocument={receipt}
                onRemoveDocument={() => setReceipt(null)}
                onTakePhoto={handleTakePhoto}
              />
            </View>

            {/* Advanced Options */}
            <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Advanced Options</Text>
              
              <View style={styles.switchGroup}>
                <View style={styles.switchLabelContainer}>
                  <RotateCcw size={16} color={theme.colors.textSecondary} />
                  <View style={styles.switchTextContainer}>
                    <Text style={[styles.switchLabel, { color: theme.colors.text }]}>Recurring Transaction</Text>
                    <Text style={[styles.switchDescription, { color: theme.colors.textSecondary }]}>
                      This transaction repeats automatically
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isRecurring}
                  onValueChange={setIsRecurring}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor={isRecurring ? 'white' : theme.colors.textSecondary}
                />
              </View>

              {isRecurring && (
                <View style={styles.recurringOptions}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Repeat Every</Text>
                    <View style={styles.recurringInputContainer}>
                      <TextInput
                        style={[
                          styles.recurringValueInput,
                          {
                            backgroundColor: theme.colors.background,
                            color: theme.colors.text,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        value={recurringValue}
                        onChangeText={setRecurringValue}
                        keyboardType="number-pad"
                        placeholder="1"
                        placeholderTextColor={theme.colors.textSecondary}
                      />
                      <View style={styles.recurringUnitSelector}>
                        {(['day', 'week', 'month', 'year'] as const).map((unit) => (
                          <TouchableOpacity
                            key={unit}
                            style={[
                              styles.unitOption,
                              { backgroundColor: theme.colors.background },
                              recurringUnit === unit && { 
                                backgroundColor: theme.colors.primary + '20', 
                                borderColor: theme.colors.primary 
                              }
                            ]}
                            onPress={() => setRecurringUnit(unit)}
                          >
                            <Text style={[
                              styles.unitText,
                              { color: recurringUnit === unit ? theme.colors.primary : theme.colors.text }
                            ]}>
                              {unit.charAt(0).toUpperCase() + unit.slice(1)}{parseInt(recurringValue) > 1 ? 's' : ''}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={[styles.recurringPreview, { backgroundColor: theme.colors.background }]}>
                    <RotateCcw size={16} color={theme.colors.primary} />
                    <Text style={[styles.recurringPreviewText, { color: theme.colors.text }]}>
                      {getRecurringDisplayText()}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modals */}
      {showCamera && (
        <CameraInput
          onClose={() => setShowCamera(false)}
          onCapture={(uri) => {
            setReceipt({ uri, type: 'image' });
            setShowCamera(false);
          }}
        />
      )}

      {showDatePicker && (
        <DatePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          onSelect={(selectedDate) => {
            setDate(selectedDate);
            setShowDatePicker(false);
          }}
          currentDate={date}
        />
      )}

      {showTimePicker && (
        <TimePicker
          visible={showTimePicker}
          onClose={() => setShowTimePicker(false)}
          onSelect={(selectedTime) => {
            setTime(selectedTime);
            setShowTimePicker(false);
          }}
          currentTime={time}
        />
      )}

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
                Select Currency
              </Text>
              <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.currencyList}>
              {currencies.map((currency) => (
                <TouchableOpacity
                  key={currency.code}
                  style={[
                    styles.currencyItem,
                    { backgroundColor: theme.colors.background },
                    selectedCurrency === currency.code && { backgroundColor: theme.colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setSelectedCurrency(currency.code);
                    setShowCurrencyPicker(false);
                  }}
                >
                  <View style={styles.currencyInfo}>
                    <Text style={[styles.currencySymbolText, { color: theme.colors.text }]}>
                      {currency.symbol}
                    </Text>
                    <View style={styles.currencyDetails}>
                      <Text style={[styles.currencyCodeText, { color: theme.colors.text }]}>
                        {currency.code}
                      </Text>
                      <Text style={[styles.currencyNameText, { color: theme.colors.textSecondary }]}>
                        {currency.name}
                      </Text>
                    </View>
                  </View>
                  {selectedCurrency === currency.code && (
                    <Check size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
    paddingVertical: 12,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  changeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: -8,
    right: -8,
  },
  form: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requiredIndicator: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeItem: {
    flex: 1,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
  },
  dateTimeDisplay: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.2)',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  statusCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  statusCardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentStatusHint: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 11,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    minWidth: 80,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '500',
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '300',
    textAlign: 'center',
    flex: 1,
    minWidth: 120,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  recurringOptions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  recurringInputContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  recurringValueInput: {
    width: 60,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    textAlign: 'center',
  },
  recurringUnitSelector: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  unitOption: {
    flex: 1,
    minWidth: 60,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  unitText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recurringPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  recurringPreviewText: {
    fontSize: 12,
    fontWeight: '500',
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
    maxHeight: '70%',
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
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 2,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  currencySymbolText: {
    fontSize: 24,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  currencyDetails: {
    flex: 1,
  },
  currencyCodeText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  currencyNameText: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 20,
  },
});