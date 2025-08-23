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

  // Setup notifications when app loads
  useEffect(() => {
    setupNotifications();
  }, []);

  // Calculate net balance from paid transactions only
  const netBalance = paidIncome - paidExpenses;

  // Get unpaid transactions count
  const unpaidTransactions = transactions.filter(t => !t.isPaid);
  const unpaidCount = unpaidTransactions.length;
  
  // Get main currency for display
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Calculate previous period data for Smart Insights
  const previousPeriodData = {
    income: 0, // This would be calculated based on previous period
    expenses: 0,
    net: 0,
  };

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
          <SmartInsights 
            transactions={transactions}
            categories={categories}
            accounts={accounts}
            currencies={currencies}
            mainCurrencyCode={mainCurrencyCode}
            getExchangeRate={getExchangeRate}
            dateLabel="This Month"
            previousPeriodData={previousPeriodData}
          />

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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.accountsContainer}
          >
            {accounts.slice(0, 3).map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </ScrollView>

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
                  currencies={currencies}
                  mainCurrencyCode={mainCurrencyCode}
                  getExchangeRate={getExchangeRate}
                />
              ))
            ) : (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No recent transactions
              </Text>
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
});