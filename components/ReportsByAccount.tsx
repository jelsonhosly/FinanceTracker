import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Transaction, Account, Category, Currency } from '@/types';
import { AccountPerformanceChart } from '@/components/AccountPerformanceChart';
import { AccountBalanceChart } from '@/components/AccountBalanceChart';
import { CreditCard, Wallet, Landmark, TrendingUp, ChartBar as BarChart3, ChartPie as PieChart, Banknote, Bitcoin, PiggyBank, Briefcase, Building, DollarSign } from 'lucide-react-native';
import { createElement } from 'react';
import { LucideIconMap } from '@/components/IconColorPicker';

interface ReportsByAccountProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  filters: any;
}

export function ReportsByAccount({
  transactions,
  accounts,
  categories,
  currencies,
  mainCurrencyCode,
  getExchangeRate,
  filters,
}: ReportsByAccountProps) {
  const { theme } = useTheme();
  const [selectedView, setSelectedView] = useState<'performance' | 'balances' | 'comparison'>('performance');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  const viewOptions = [
    { id: 'performance', title: 'Performance', icon: TrendingUp },
    { id: 'balances', title: 'Balances', icon: PieChart },
    { id: 'comparison', title: 'Compare', icon: BarChart3 },
  ];

  const renderAccountIcon = (account: Account) => {
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
      return createElement(IconComponent, { size: 20, color: account.color });
    }
    
    // Fallback based on account type
    switch (account.type) {
      case 'bank':
      case 'checking':
        return <Landmark size={20} color={account.color} />;
      case 'cash':
        return <Wallet size={20} color={account.color} />;
      case 'credit':
        return <CreditCard size={20} color={account.color} />;
      case 'investment':
        return <Banknote size={20} color={account.color} />;
      case 'crypto':
        return <Bitcoin size={20} color={account.color} />;
      case 'wallet':
        return <Wallet size={20} color={account.color} />;
      case 'loan':
        return <Building size={20} color={account.color} />;
      case 'savings':
        return <PiggyBank size={20} color={account.color} />;
      case 'business':
        return <Briefcase size={20} color={account.color} />;
      case 'other':
        return <DollarSign size={20} color={account.color} />;
      default:
        return <CreditCard size={20} color={account.color} />;
    }
  };

  const renderContent = () => {
    switch (selectedView) {
      case 'performance':
        return (
          <AccountPerformanceChart 
            transactions={transactions}
            accounts={accounts}
            currencies={currencies}
            mainCurrencyCode={mainCurrencyCode}
            getExchangeRate={getExchangeRate}
            selectedAccountId={selectedAccountId}
          />
        );
      case 'balances':
        return (
          <AccountBalanceChart 
            accounts={accounts}
            currencies={currencies}
            mainCurrencyCode={mainCurrencyCode}
            getExchangeRate={getExchangeRate}
          />
        );
      case 'comparison':
        return (
          <View style={[styles.comparisonContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.comparisonTitle, { color: theme.colors.text }]}>
              Account Comparison
            </Text>
            <View style={styles.accountsList}>
              {accounts.map((account) => {
                const accountTransactions = transactions.filter(t => 
                  t.accountId === account.id || t.toAccountId === account.id
                );
                
                const income = accountTransactions
                  .filter(t => t.type === 'income' || (t.type === 'transfer' && t.toAccountId === account.id))
                  .reduce((sum, t) => {
                    const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
                    return sum + convertedAmount;
                  }, 0);
                
                const expenses = accountTransactions
                  .filter(t => t.type === 'expense' || (t.type === 'transfer' && t.accountId === account.id))
                  .reduce((sum, t) => {
                    const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
                    return sum + convertedAmount;
                  }, 0);

                return (
                  <View key={account.id} style={[styles.accountComparisonCard, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.accountComparisonHeader}>
                      <View style={[styles.accountIconContainer, { backgroundColor: `${account.color}20` }]}>
                        {renderAccountIcon(account)}
                      </View>
                      <View style={styles.accountComparisonInfo}>
                        <Text style={[styles.accountComparisonName, { color: theme.colors.text }]}>
                          {account.name}
                        </Text>
                        <Text style={[styles.accountComparisonType, { color: theme.colors.textSecondary }]}>
                          {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                        </Text>
                      </View>
                      <Text style={[
                        styles.accountComparisonBalance,
                        { color: account.balance >= 0 ? theme.colors.success : theme.colors.error }
                      ]}>
                        {mainCurrency?.symbol}{Math.abs(account.balance).toFixed(0)}
                      </Text>
                    </View>
                    
                    <View style={styles.accountComparisonStats}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                          Money In
                        </Text>
                        <Text style={[styles.statValue, { color: theme.colors.success }]}>
                          {mainCurrency?.symbol}{income.toFixed(0)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                          Money Out
                        </Text>
                        <Text style={[styles.statValue, { color: theme.colors.error }]}>
                          {mainCurrency?.symbol}{expenses.toFixed(0)}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                          Transactions
                        </Text>
                        <Text style={[styles.statValue, { color: theme.colors.text }]}>
                          {accountTransactions.length}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* View Selector */}
      <View style={styles.viewSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.viewScrollContent}
        >
          {viewOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = selectedView === option.id;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.viewOption,
                  { backgroundColor: theme.colors.card },
                  isSelected && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedView(option.id as any)}
              >
                <IconComponent 
                  size={18} 
                  color={isSelected ? 'white' : theme.colors.primary} 
                />
                <Text style={[
                  styles.viewOptionText,
                  { color: isSelected ? 'white' : theme.colors.text }
                ]}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentPadding}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewSelector: {
    marginBottom: 16,
  },
  viewScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  viewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: 100,
  },
  comparisonContainer: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  comparisonTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  accountsList: {
    gap: 16,
  },
  accountComparisonCard: {
    padding: 16,
    borderRadius: 16,
  },
  accountComparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  accountComparisonInfo: {
    flex: 1,
  },
  accountComparisonName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountComparisonType: {
    fontSize: 14,
  },
  accountComparisonBalance: {
    fontSize: 18,
    fontWeight: '700',
  },
  accountComparisonStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});