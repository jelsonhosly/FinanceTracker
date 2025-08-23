import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Image } from 'react-native';
import { Svg, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Transaction, Account, Currency } from '@/types';
import { CreditCard, Wallet, Landmark, Banknote, Bitcoin, PiggyBank, Briefcase, Building, DollarSign } from 'lucide-react-native';
import { createElement } from 'react';
import { LucideIconMap } from '@/components/IconColorPicker';

interface AccountPerformanceChartProps {
  transactions: Transaction[];
  accounts: Account[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  selectedAccountId: string | null;
}

const { width: screenWidth } = Dimensions.get('window');

export function AccountPerformanceChart({ 
  transactions, 
  accounts, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate,
  selectedAccountId 
}: AccountPerformanceChartProps) {
  const { theme } = useTheme();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(selectedAccountId);
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

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
      return createElement(IconComponent, { size: 16, color: account.color });
    }
    
    // Fallback based on account type
    switch (account.type) {
      case 'bank':
      case 'checking':
        return <Landmark size={16} color={account.color} />;
      case 'cash':
        return <Wallet size={16} color={account.color} />;
      case 'credit':
        return <CreditCard size={16} color={account.color} />;
      case 'investment':
        return <Banknote size={16} color={account.color} />;
      case 'crypto':
        return <Bitcoin size={16} color={account.color} />;
      case 'wallet':
        return <Wallet size={16} color={account.color} />;
      case 'loan':
        return <Building size={16} color={account.color} />;
      case 'savings':
        return <PiggyBank size={16} color={account.color} />;
      case 'business':
        return <Briefcase size={16} color={account.color} />;
      case 'other':
        return <DollarSign size={16} color={account.color} />;
      default:
        return <CreditCard size={16} color={account.color} />;
    }
  };

  // Calculate account performance metrics
  const getAccountMetrics = () => {
    return accounts.map(account => {
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

      const netFlow = income - expenses;
      const transactionCount = accountTransactions.length;
      const avgTransactionSize = transactionCount > 0 ? (income + expenses) / transactionCount : 0;

      return {
        account,
        income,
        expenses,
        netFlow,
        transactionCount,
        avgTransactionSize,
      };
    }).sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow));
  };

  const accountMetrics = getAccountMetrics();
  const maxNetFlow = Math.max(...accountMetrics.map(m => Math.abs(m.netFlow)));

  // Chart dimensions
  const chartWidth = screenWidth - 72;
  const chartHeight = 250;
  const barHeight = 30;
  const barSpacing = 40;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Account Performance
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Net flow by account
        </Text>
      </View>

      {/* Account Performance Bars */}
      <ScrollView style={styles.chartContainer} showsVerticalScrollIndicator={false}>
        <Svg width={chartWidth} height={accountMetrics.length * barSpacing + 40}>
          <Defs>
            <LinearGradient id="positiveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#16A34A" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="negativeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#DC2626" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          
          {/* Center line */}
          <Path
            d={`M ${chartWidth / 2} 20 L ${chartWidth / 2} ${accountMetrics.length * barSpacing + 20}`}
            stroke={theme.colors.border}
            strokeWidth="2"
            strokeDasharray="4,4"
          />
          
          {accountMetrics.map((metric, index) => {
            const y = 30 + index * barSpacing;
            const barWidth = maxNetFlow > 0 ? (Math.abs(metric.netFlow) / maxNetFlow) * (chartWidth / 2 - 40) : 0;
            const isPositive = metric.netFlow >= 0;
            const startX = chartWidth / 2;
            const endX = isPositive ? startX + barWidth : startX - barWidth;
            
            return (
              <G key={metric.account.id}>
                {/* Performance bar */}
                <Path
                  d={`M ${Math.min(startX, endX)} ${y} L ${Math.max(startX, endX)} ${y} L ${Math.max(startX, endX)} ${y + barHeight} L ${Math.min(startX, endX)} ${y + barHeight} Z`}
                  fill={isPositive ? "url(#positiveGradient)" : "url(#negativeGradient)"}
                  opacity={selectedAccount === metric.account.id || selectedAccount === null ? 1 : 0.5}
                />
                
                {/* Account name */}
                <SvgText
                  x="10"
                  y={y + barHeight / 2 + 4}
                  fontSize="12"
                  fontWeight="600"
                  fill={theme.colors.text}
                >
                  {metric.account.name}
                </SvgText>
                
                {/* Net flow amount */}
                <SvgText
                  x={chartWidth - 10}
                  y={y + barHeight / 2 + 4}
                  fontSize="12"
                  fontWeight="700"
                  fill={isPositive ? '#22C55E' : '#EF4444'}
                  textAnchor="end"
                >
                  {isPositive ? '+' : ''}{mainCurrency?.symbol}{metric.netFlow.toFixed(0)}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>

      {/* Account Details */}
      <View style={styles.accountsList}>
        {accountMetrics.map((metric) => {
          const isSelected = selectedAccount === metric.account.id;
          
          return (
            <TouchableOpacity
              key={metric.account.id}
              style={[
                styles.accountCard,
                { backgroundColor: theme.colors.background },
                isSelected && { backgroundColor: metric.account.color + '15', borderColor: metric.account.color }
              ]}
              onPress={() => setSelectedAccount(isSelected ? null : metric.account.id)}
            >
              <View style={styles.accountCardHeader}>
                <View style={[styles.accountIconContainer, { backgroundColor: metric.account.color + '20' }]}>
                  {renderAccountIcon(metric.account)}
                </View>
                <View style={styles.accountCardInfo}>
                  <Text style={[
                    styles.accountCardName, 
                    { color: isSelected ? metric.account.color : theme.colors.text }
                  ]}>
                    {metric.account.name}
                  </Text>
                  <Text style={[styles.accountCardType, { color: theme.colors.textSecondary }]}>
                    {metric.account.type.charAt(0).toUpperCase() + metric.account.type.slice(1)}
                  </Text>
                </View>
                <Text style={[
                  styles.accountCardBalance,
                  { color: metric.account.balance >= 0 ? theme.colors.success : theme.colors.error }
                ]}>
                  {mainCurrency?.symbol}{Math.abs(metric.account.balance).toFixed(0)}
                </Text>
              </View>
              
              <View style={styles.accountCardStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Money In
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.success }]}>
                    {mainCurrency?.symbol}{metric.income.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Money Out
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.error }]}>
                    {mainCurrency?.symbol}{metric.expenses.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    Transactions
                  </Text>
                  <Text style={[styles.statValue, { color: theme.colors.text }]}>
                    {metric.transactionCount}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    maxHeight: 300,
    marginBottom: 20,
  },
  accountsList: {
    gap: 12,
  },
  accountCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  accountCardInfo: {
    flex: 1,
  },
  accountCardName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  accountCardType: {
    fontSize: 12,
  },
  accountCardBalance: {
    fontSize: 16,
    fontWeight: '700',
  },
  accountCardStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});