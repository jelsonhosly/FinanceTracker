import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { DashboardHeader } from '@/components/DashboardHeader';
import { AccountCard } from '@/components/AccountCard';
import { TransactionListItem } from '@/components/TransactionListItem';
import { useData } from '@/context/DataContext';
import { ArrowRight, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Clock } from 'lucide-react-native';
import { useEffect } from 'react';
import { setupNotifications } from '@/utils/notifications';
import { ExpensePieChart } from '@/components/ExpensePieChart';
import { SmartInsights } from '@/components/SmartInsights';

export default function Dashboard() {
  const { theme } = useTheme();
  const { accounts, transactions, totalBalance, getRecentTransactions, paidIncome, paidExpenses, unpaidIncome, unpaidExpenses, currencies, mainCurrencyCode, getExchangeRate, categories } = useData();
  const router = useRouter();
  const recentTransactions = getRecentTransactions(5);

  // Calculate net balance from paid transactions only
  const netBalance = paidIncome - paidExpenses;

  // Get unpaid transactions count
  const unpaidTransactions = transactions.filter(t => !t.isPaid);
  const unpaidCount = unpaidTransactions.length;
  
  // Get main currency for display
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Show welcome message for new users
  const showWelcomeMessage = transactions.length === 0 && accounts.length === 0;

  if (showWelcomeMessage) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar style={theme.dark ? 'light' : 'dark'} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <DashboardHeader />
          
          <View style={styles.welcomeContainer}>
            <View style={[styles.welcomeCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
                Welcome to FinanceTracker! 🎉
              </Text>
              <Text style={[styles.welcomeMessage, { color: theme.colors.textSecondary }]}>
                You're all set up and ready to start tracking your finances. Use the + button below to add your first real transaction, or explore the different tabs to familiarize yourself with the app.
              </Text>
              
              <View style={styles.quickActions}>
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => router.push('/transaction/add')}
                >
                  <Text style={styles.quickActionText}>Add Transaction</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.quickActionButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={() => router.push('/account/add')}
                >
                  <Text style={styles.quickActionText}>Add Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <DashboardHeader />
          
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <BlurView intensity={20} tint="light" style={styles.blurOverlay}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>{mainCurrency?.symbol}{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.balanceCurrency}>{mainCurrency?.code}</Text>
            </BlurView>
          </LinearGradient>

          {/* Financial Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <CheckCircle2 size={16} color={theme.colors.success} />
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Paid Income
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                    {mainCurrency?.symbol}{paidIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <CheckCircle2 size={16} color={theme.colors.error} />
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Paid Expenses
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                    {mainCurrency?.symbol}{paidExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Clock size={16} color={theme.colors.warning} />
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Pending Income
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.warning }]}>
                    {mainCurrency?.symbol}{unpaidIncome.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <AlertTriangle size={16} color={theme.colors.error} />
                  <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                    Due Expenses
                  </Text>
                  <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                    {mainCurrency?.symbol}{unpaidExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Unpaid Transactions Alert */}
          {unpaidCount > 0 && (
            <TouchableOpacity 
              style={[styles.alertCard, { backgroundColor: theme.colors.warning + '15', borderColor: theme.colors.warning }]}
              onPress={() => router.push('/transactions')}
            >
              <View style={styles.alertContent}>
                <AlertTriangle size={24} color={theme.colors.warning} />
                <View style={styles.alertText}>
                  <Text style={[styles.alertTitle, { color: theme.colors.text }]}>
                    {unpaidCount} Unpaid Transaction{unpaidCount > 1 ? 's' : ''}
                  </Text>
                  <Text style={[styles.alertSubtitle, { color: theme.colors.textSecondary }]}>
                    Tap to review pending payments and bills
                  </Text>
                </View>
                <ArrowRight size={20} color={theme.colors.warning} />
              </View>
            </TouchableOpacity>
          )}

          {/* Smart Insights */}
          {transactions.length > 0 && (
            <SmartInsights 
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              currencies={currencies}
              mainCurrencyCode={mainCurrencyCode}
              getExchangeRate={getExchangeRate}
              dateLabel="This Month"
              previousPeriodData={{
                income: 0,
                expenses: 0,
                net: 0,
              }}
            />
          )}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Your Accounts</Text>
            <TouchableOpacity 
              onPress={() => router.push('/accounts')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
              <ArrowRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {accounts.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.accountsContainer}
            >
              {accounts.slice(0, 3).map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.emptyAccountsCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.emptyAccountsText, { color: theme.colors.textSecondary }]}>
                No accounts yet. Add your first account to get started.
              </Text>
              <TouchableOpacity 
                style={[styles.addAccountButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push('/account/add')}
              >
                <Text style={styles.addAccountButtonText}>Add Account</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity 
              onPress={() => router.push('/transactions')}
              style={styles.seeAllButton}
            >
              <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See All</Text>
              <ArrowRight size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.transactionsContainer}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <TransactionListItem 
                  key={transaction.id} 
                  transaction={transaction} 
                />
              ))
            ) : (
              <View style={[styles.emptyTransactionsCard, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.emptyTransactionsText, { color: theme.colors.textSecondary }]}>
                  No transactions yet. Start by adding your first transaction.
                </Text>
                <TouchableOpacity 
                  style={[styles.addTransactionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => router.push('/transaction/add')}
                >
                  <Text style={styles.addTransactionButtonText}>Add Transaction</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
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
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    height: 150,
    overflow: 'hidden',
  },
  blurOverlay: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
  },
  balanceCurrency: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  alertCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    marginRight: 4,
  },
  accountsContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  transactionsContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
  },
  spacer: {
    height: 100,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  welcomeCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  welcomeMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  quickActionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyAccountsCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyAccountsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  addAccountButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addAccountButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyTransactionsCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyTransactionsText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  addTransactionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addTransactionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});