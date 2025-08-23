import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ArrowDownLeft, ArrowUpRight, Repeat, Pencil, Trash2, Receipt, ArrowLeft, CircleCheck as CheckCircle2, Clock, Calendar, CreditCard, Tag, Type, RotateCcw } from 'lucide-react-native';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';
import { useState } from 'react';

export default function TransactionDetails() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { transactions, accounts, categories, currencies, mainCurrencyCode, getExchangeRate, deleteTransaction, toggleTransactionPaidStatus } = useData();
  const router = useRouter();
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  
  const transaction = transactions.find(t => t.id === id);
  const account = transaction ? accounts.find(a => a.id === transaction.accountId) : null;
  const toAccount = transaction?.toAccountId ? accounts.find(a => a.id === transaction.toAccountId) : null;
  const category = transaction?.category ? categories.find(c => c.name === transaction.category) : null;
  
  // Get main currency and convert amount
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);
  const exchangeRate = getExchangeRate(account?.currency || 'USD', mainCurrencyCode);
  const convertedAmount = transaction ? transaction.amount * exchangeRate : 0;
  
  if (!transaction || !account) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Transaction</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>Transaction not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const handleDelete = () => {
    setCustomAlertTitle("Delete Transaction");
    setCustomAlertMessage("Are you sure you want to delete this transaction?");
    setCustomAlertType('warning');
    setCustomAlertButtons([
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteTransaction(transaction.id);
          router.back();
        }
      }
    ]);
    setShowCustomAlert(true);
  };

  const handleTogglePaymentStatus = () => {
    const newStatus = !transaction.isPaid;
    const statusText = newStatus ? 'paid' : (transaction.type === 'income' ? 'pending' : 'due');
    
    setCustomAlertTitle(`Mark as ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`);
    setCustomAlertMessage(`Are you sure you want to mark this transaction as ${statusText}?`);
    setCustomAlertType('info');
    setCustomAlertButtons([
      {
        text: "Cancel",
        style: "cancel"
      },
      {
        text: "Confirm",
        onPress: () => toggleTransactionPaidStatus(transaction.id)
      }
    ]);
    setShowCustomAlert(true);
  };

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'income':
        return (
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.success}20` }]}>
            <ArrowDownLeft size={32} color={theme.colors.success} />
          </View>
        );
      case 'expense':
        return (
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.error}20` }]}>
            <ArrowUpRight size={32} color={theme.colors.error} />
          </View>
        );
      case 'transfer':
        return (
          <View style={[styles.iconContainer, { backgroundColor: `${theme.colors.primary}20` }]}>
            <Repeat size={32} color={theme.colors.primary} />
          </View>
        );
    }
  };

  // Get the display title based on the requirements
  const getDisplayTitle = () => {
    // 1. If transaction has a description, use it as the title
    if (transaction.description && transaction.description.trim()) {
      return transaction.description;
    }
    
    // 2. For transfers, always show "Transfer"
    if (transaction.type === 'transfer') {
      return 'Transfer';
    }
    
    // 3. For income/expense, show category with subcategory if available
    if (transaction.category && transaction.subcategory) {
      return `${transaction.category} • ${transaction.subcategory}`;
    } else if (transaction.category) {
      return transaction.category;
    } else {
      return 'Uncategorized';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(transaction.date);

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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Transaction Details</Text>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push(`/transaction/add?id=${transaction.id}`)}
          >
            <Pencil size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Transaction Header */}
          <View style={[styles.transactionHeader, { backgroundColor: theme.colors.card }]}>
            {getTransactionIcon()}
            <View style={styles.headerInfo}>
              <Text style={[styles.transactionTitle, { color: theme.colors.text }]}>
                {getDisplayTitle()}
              </Text>
              <View style={styles.statusContainer}>
                <View style={styles.paymentStatus}>
                  {transaction.isPaid ? (
                    <CheckCircle2 size={16} color={theme.colors.success} />
                  ) : (
                    <Clock size={16} color={theme.colors.warning} />
                  )}
                  <Text style={[
                    styles.statusText, 
                    { color: transaction.isPaid ? theme.colors.success : theme.colors.warning }
                  ]}>
                    {transaction.isPaid ? 'Paid' : transaction.type === 'income' ? 'Pending' : 'Due'}
                  </Text>
                </View>
                {transaction.isRecurring && (
                  <View style={[styles.recurringBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                    <RotateCcw size={12} color={theme.colors.primary} />
                    <Text style={[styles.recurringText, { color: theme.colors.primary }]}>
                      {transaction.recurringValue && transaction.recurringUnit 
                        ? `Every ${transaction.recurringValue > 1 ? transaction.recurringValue + ' ' : ''}${transaction.recurringUnit}${transaction.recurringValue > 1 ? 's' : ''}`
                        : 'Recurring'
                      }
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <Text 
              style={[
                styles.amount, 
                { 
                  color: transaction.type === 'income' 
                    ? theme.colors.success 
                    : transaction.type === 'expense'
                    ? theme.colors.error
                    : theme.colors.text
                }
              ]}
            >
              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
              {mainCurrency?.symbol}{convertedAmount.toFixed(2)}
            </Text>
          </View>

          {/* Transaction Details */}
          <View style={styles.detailsSection}>
            <View style={[styles.detailCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Transaction Information
              </Text>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Calendar size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    Date & Time
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {dateStr}
                  </Text>
                  <Text style={[styles.detailSubValue, { color: theme.colors.textSecondary }]}>
                    {timeStr}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <CreditCard size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                    {transaction.type === 'transfer' ? 'From Account' : 'Account'}
                  </Text>
                  <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                    {account.name}
                  </Text>
                  <Text style={[styles.detailSubValue, { color: theme.colors.textSecondary }]}>
                    {account.type.charAt(0).toUpperCase() + account.type.slice(1)} • {account.currency}
                  </Text>
                </View>
              </View>

              {transaction.type === 'transfer' && toAccount && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <CreditCard size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      To Account
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {toAccount.name}
                    </Text>
                    <Text style={[styles.detailSubValue, { color: theme.colors.textSecondary }]}>
                      {toAccount.type.charAt(0).toUpperCase() + toAccount.type.slice(1)} • {toAccount.currency}
                    </Text>
                  </View>
                </View>
              )}

              {transaction.category && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Tag size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      Category
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {transaction.category}
                    </Text>
                    {transaction.subcategory && (
                      <Text style={[styles.detailSubValue, { color: theme.colors.textSecondary }]}>
                        {transaction.subcategory}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {transaction.description && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Type size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      Description
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                      {transaction.description}
                    </Text>
                  </View>
                </View>
              )}

              {transaction.receiptImage && (
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Receipt size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                      Receipt
                    </Text>
                    <TouchableOpacity style={styles.receiptButton}>
                      <Text style={[styles.receiptButtonText, { color: theme.colors.primary }]}>
                        View Receipt
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Payment Status Card */}
            <View style={[styles.detailCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                Payment Status
              </Text>
              
              <View style={styles.paymentStatusCard}>
                <View style={styles.paymentStatusInfo}>
                  {transaction.isPaid ? (
                    <CheckCircle2 size={24} color={theme.colors.success} />
                  ) : (
                    <Clock size={24} color={theme.colors.warning} />
                  )}
                  <View style={styles.paymentStatusText}>
                    <Text style={[
                      styles.paymentStatusTitle, 
                      { color: transaction.isPaid ? theme.colors.success : theme.colors.warning }
                    ]}>
                      {transaction.isPaid ? 'Paid' : transaction.type === 'income' ? 'Pending' : 'Due'}
                    </Text>
                    <Text style={[styles.paymentStatusDescription, { color: theme.colors.textSecondary }]}>
                      {transaction.isPaid 
                        ? 'This transaction has been completed and affects account balances'
                        : transaction.type === 'income'
                          ? 'This income is expected but not yet received'
                          : 'This expense is due but not yet paid'
                      }
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[
                    styles.toggleStatusButton,
                    { 
                      backgroundColor: transaction.isPaid 
                        ? theme.colors.warning + '20' 
                        : theme.colors.success + '20' 
                    }
                  ]}
                  onPress={handleTogglePaymentStatus}
                >
                  <Text style={[
                    styles.toggleStatusText,
                    { 
                      color: transaction.isPaid 
                        ? theme.colors.warning 
                        : theme.colors.success 
                    }
                  ]}>
                    Mark as {transaction.isPaid ? (transaction.type === 'income' ? 'Pending' : 'Due') : 'Paid'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.card }]}
            onPress={() => router.push(`/transaction/add?id=${transaction.id}`)}
          >
            <Pencil size={20} color={theme.colors.primary} />
            <Text style={[styles.actionText, { color: theme.colors.primary }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: `${theme.colors.error}20` }]}
            onPress={handleDelete}
          >
            <Trash2 size={20} color={theme.colors.error} />
            <Text style={[styles.actionText, { color: theme.colors.error }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

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
  editButton: {
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
  placeholder: {
    width: 40,
  },
  transactionHeader: {
    padding: 24,
    alignItems: 'center',
    margin: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recurringText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
  },
  detailsSection: {
    paddingHorizontal: 16,
  },
  detailCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailSubValue: {
    fontSize: 14,
  },
  receiptButton: {
    marginTop: 4,
  },
  receiptButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentStatusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentStatusText: {
    marginLeft: 16,
    flex: 1,
  },
  paymentStatusTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentStatusDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  toggleStatusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  toggleStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});