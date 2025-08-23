import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { TransactionListItem } from '@/components/TransactionListItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CreditCard, Wallet, Landmark, Banknote, Bitcoin, PiggyBank, Briefcase, Building, Repeat, DollarSign, CreditCard as Edit3, ArrowLeft, Trash2 } from 'lucide-react-native';
import { createElement } from 'react';
import { LucideIconMap } from '@/components/IconColorPicker';
import { AccountSelector } from '@/components/AccountSelector';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';
import { useState } from 'react';

export default function AccountDetails() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const { accounts, transactions, deleteAccount } = useData();
  const router = useRouter();
  const [showDeleteOptionsModal, setShowDeleteOptionsModal] = useState(false);
  const [showAccountSelectorModal, setShowAccountSelectorModal] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  
  const account = accounts.find(a => a.id === id);
  const accountTransactions = transactions.filter(t => 
    t.accountId === id || t.toAccountId === id
  );
  
  if (!account) {
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
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Account</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>Account not found</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const getAccountIcon = () => {
    // First check for custom image icon
    if (account.icon) {
      return (
        <Image 
          key={account.icon}
          source={{ uri: account.icon }} 
          style={styles.customIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Then check for Lucide icon
    if (account.lucideIconName && LucideIconMap[account.lucideIconName]) {
      const IconComponent = LucideIconMap[account.lucideIconName];
      return createElement(IconComponent, { size: 32, color: account.color });
    }
    
    // Fallback based on account type
    switch (account.type) {
      case 'bank':
      case 'checking':
        return <Landmark size={32} color={account.color} />;
      case 'cash':
        return <Wallet size={32} color={account.color} />;
      case 'credit':
        return <CreditCard size={32} color={account.color} />;
      case 'investment':
        return <Banknote size={32} color={account.color} />;
      case 'crypto':
        return <Bitcoin size={32} color={account.color} />;
      case 'wallet':
        return <Wallet size={32} color={account.color} />;
      case 'loan':
        return <Building size={32} color={account.color} />;
      case 'savings':
        return <PiggyBank size={32} color={account.color} />;
      case 'business':
        return <Briefcase size={32} color={account.color} />;
      case 'other':
        return <DollarSign size={32} color={account.color} />;
      default:
        return <CreditCard size={32} color={account.color} />;
    }
  };

  const handleEditAccount = () => {
    router.push(`/account/add?id=${account.id}`);
  };

  const handleDeleteAccount = () => {
    if (accountTransactions.length === 0) {
      // No transactions, direct deletion
      setCustomAlertTitle("Delete Account");
      setCustomAlertMessage(`Are you sure you want to delete "${account.name}"? This action cannot be undone.`);
      setCustomAlertType('warning');
      setCustomAlertButtons([
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteAccount(account.id, 'delete');
            router.back();
          }
        }
      ]);
      setShowCustomAlert(true);
    } else {
      // Has transactions, show options
      setShowDeleteOptionsModal(true);
    }
  };

  const handleDeleteWithTransactions = () => {
    setCustomAlertTitle("Delete Account & Transactions");
    setCustomAlertMessage(`This will permanently delete "${account.name}" and all ${accountTransactions.length} associated transactions. This action cannot be undone.`);
    setCustomAlertType('error');
    setCustomAlertButtons([
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete All",
        style: "destructive",
        onPress: () => {
          deleteAccount(account.id, 'delete');
          router.back();
        }
      }
    ]);
    setShowCustomAlert(true);
  };

  const handleMoveTransactions = () => {
    const otherAccounts = accounts.filter(a => a.id !== account.id);
    if (otherAccounts.length === 0) {
      setCustomAlertTitle("No Other Accounts");
      setCustomAlertMessage("You need at least one other account to move transactions to. Please create another account first.");
      setCustomAlertType('warning');
      setCustomAlertButtons([{ text: "OK" }]);
      setShowCustomAlert(true);
      return;
    }
    setShowAccountSelectorModal(true);
  };

  const handleAccountSelected = (targetAccountId: string) => {
    const targetAccount = accounts.find(a => a.id === targetAccountId);
    if (!targetAccount) return;

    setCustomAlertTitle("Move Transactions");
    setCustomAlertMessage(`Move all ${accountTransactions.length} transactions from "${account.name}" to "${targetAccount.name}" and then delete the account?`);
    setCustomAlertType('warning');
    setCustomAlertButtons([
      { text: "Cancel", style: "cancel" },
      {
        text: "Move & Delete",
        style: "destructive",
        onPress: () => {
          deleteAccount(account.id, 'move', targetAccountId);
          router.back();
        }
      }
    ]);
    setShowCustomAlert(true);
    setShowAccountSelectorModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header with Edit Button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Account Details</Text>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleEditAccount}
          >
            <Edit3 size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.accountCard, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${account.color}20` }]}>
              {getAccountIcon()}
            </View>
            <Text style={[styles.accountName, { color: theme.colors.text }]}>
              {account.name}
            </Text>
            <Text style={[styles.accountType, { color: theme.colors.textSecondary }]}>
              {account.type.charAt(0).toUpperCase() + account.type.slice(1)} Account
            </Text>
            <Text 
              style={[
                styles.balance, 
                { color: account.balance >= 0 ? theme.colors.success : theme.colors.error }
              ]}
            >
              {account.currency === 'USD' ? '$' : 
               account.currency === 'EUR' ? '€' : 
               account.currency === 'GBP' ? '£' : 
               account.currency === 'JPY' ? '¥' : 
               account.currency === 'CAD' ? 'C$' : 
               account.currency === 'AUD' ? 'A$' : 
               account.currency === 'CHF' ? 'CHF' : 
               account.currency === 'CNY' ? '¥' : 
               account.currency === 'INR' ? '₹' : 
               account.currency === 'LKR' ? 'Rs' : 
               account.currency}{Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.currency, { color: theme.colors.textSecondary }]}>
              {account.currency}
            </Text>
            {account.balance < 0 && (
              <Text style={[styles.balanceNote, { color: theme.colors.error }]}>
                Amount Owed
              </Text>
            )}
            
            {/* Action Buttons */}
            <View style={styles.accountActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.primary + '15' }]}
                onPress={handleEditAccount}
              >
                <Edit3 size={18} color={theme.colors.primary} />
                <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                  Edit
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.colors.error + '15' }]}
                onPress={handleDeleteAccount}
              >
                <Trash2 size={18} color={theme.colors.error} />
                <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Stats */}
          <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
              Account Statistics
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.success }]}>
                  {accountTransactions.filter(t => t.type === 'income' || (t.type === 'transfer' && t.toAccountId === id)).length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Money In
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.error }]}>
                  {accountTransactions.filter(t => t.type === 'expense' || (t.type === 'transfer' && t.accountId === id)).length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Money Out
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.text }]}>
                  {accountTransactions.length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                  Total Transactions
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.transactionsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recent Transactions
            </Text>
            <View style={styles.transactionsList}>
              {accountTransactions.length > 0 ? (
                accountTransactions.slice(0, 10).map((transaction) => (
                  <TransactionListItem key={transaction.id} transaction={transaction} />
                ))
              ) : (
                <View style={[styles.emptyState, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    No transactions for this account yet
                  </Text>
                  <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                    Start by adding your first transaction
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Delete Options Modal */}
      {showDeleteOptionsModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Delete Account with Transactions
            </Text>
            <Text style={[styles.modalMessage, { color: theme.colors.textSecondary }]}>
              This account has {accountTransactions.length} transaction{accountTransactions.length !== 1 ? 's' : ''}. What would you like to do?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.background }]}
                onPress={() => setShowDeleteOptionsModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  setShowDeleteOptionsModal(false);
                  handleMoveTransactions();
                }}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  Move Transactions
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
                onPress={() => {
                  setShowDeleteOptionsModal(false);
                  handleDeleteWithTransactions();
                }}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  Delete All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Account Selector Modal */}
      {showAccountSelectorModal && (
        <AccountSelector
          visible={showAccountSelectorModal}
          onClose={() => setShowAccountSelectorModal(false)}
          onSelect={handleAccountSelected}
          excludeAccountId={account.id}
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
  accountCard: {
    padding: 32,
    alignItems: 'center',
    margin: 20,
    borderRadius: 24,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  customIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  accountName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  accountType: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  balance: {
    fontSize: 42,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  currency: {
    fontSize: 18,
    textAlign: 'center',
  },
  balanceNote: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  accountActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  transactionsSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  transactionsList: {
    gap: 8,
  },
  emptyState: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  bottomSpacer: {
    height: 100,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});