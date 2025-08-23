import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useMemo } from 'react';
import { Transaction, Account, Category, Currency } from '@/types';
import { TrendingUp, TrendingDown, TriangleAlert as AlertTriangle, Target, Lightbulb, Star } from 'lucide-react-native';

interface SmartInsightsProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  dateLabel: string;
  previousPeriodData: {
    income: number;
    expenses: number;
    net: number;
  };
}

export function SmartInsights({
  transactions,
  categories,
  accounts,
  currencies,
  mainCurrencyCode,
  getExchangeRate,
  dateLabel,
  previousPeriodData,
}: SmartInsightsProps) {
  const { theme } = useTheme();
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  const insights = useMemo(() => {
    const insights: Array<{
      type: 'positive' | 'negative' | 'neutral' | 'warning';
      icon: any;
      title: string;
      description: string;
    }> = [];

    // Calculate category totals for expenses
    const expenseCategoryTotals: { [key: string]: number } = {};
    const incomeCategoryTotals: { [key: string]: number } = {};
    
    transactions.forEach(transaction => {
      const convertedAmount = transaction.amount * getExchangeRate(transaction.currency || mainCurrencyCode, mainCurrencyCode);
      const categoryName = transaction.category || 'Uncategorized';
      
      if (transaction.type === 'expense') {
        expenseCategoryTotals[categoryName] = (expenseCategoryTotals[categoryName] || 0) + convertedAmount;
      } else if (transaction.type === 'income') {
        incomeCategoryTotals[categoryName] = (incomeCategoryTotals[categoryName] || 0) + convertedAmount;
      }
    });

    // Top expense category insight
    const topExpenseCategory = Object.entries(expenseCategoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topExpenseCategory) {
      const [categoryName, amount] = topExpenseCategory;
      const previousAmount = previousPeriodData.expenses > 0 
        ? (amount / Object.values(expenseCategoryTotals).reduce((sum, val) => sum + val, 0)) * previousPeriodData.expenses
        : 0;
      
      const change = previousAmount > 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;
      
      insights.push({
        type: change > 15 ? 'warning' : change > 0 ? 'negative' : 'positive',
        icon: change > 15 ? AlertTriangle : change > 0 ? TrendingUp : TrendingDown,
        title: `Top Expense: ${categoryName}`,
        description: `${mainCurrency?.symbol}${amount.toFixed(0)} spent${change !== 0 ? `, ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(0)}% from last period` : ''}.`
      });
    }

    // Top income category insight
    const topIncomeCategory = Object.entries(incomeCategoryTotals)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topIncomeCategory) {
      const [categoryName, amount] = topIncomeCategory;
      insights.push({
        type: 'positive',
        icon: Star,
        title: `Top Income: ${categoryName}`,
        description: `${mainCurrency?.symbol}${amount.toFixed(0)} earned from ${categoryName.toLowerCase()}.`
      });
    }

    // Savings rate insight
    const totalIncome = Object.values(incomeCategoryTotals).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(expenseCategoryTotals).reduce((sum, val) => sum + val, 0);
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    if (totalIncome > 0) {
      insights.push({
        type: savingsRate >= 20 ? 'positive' : savingsRate >= 10 ? 'neutral' : 'warning',
        icon: Target,
        title: `Savings Rate: ${savingsRate.toFixed(1)}%`,
        description: savingsRate >= 20 
          ? 'Excellent! You\'re saving more than 20% of your income.'
          : savingsRate >= 10 
            ? 'Good savings rate. Consider increasing to 20% for better financial health.'
            : 'Low savings rate. Try to reduce expenses or increase income.'
      });
    }

    // Account balance insights
    const negativeBalanceAccounts = accounts.filter(acc => acc.balance < 0);
    if (negativeBalanceAccounts.length > 0) {
      const totalOwed = negativeBalanceAccounts.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: `${negativeBalanceAccounts.length} Account${negativeBalanceAccounts.length > 1 ? 's' : ''} with Negative Balance`,
        description: `Total amount owed: ${mainCurrency?.symbol}${totalOwed.toFixed(0)}. Consider paying down these balances.`
      });
    }

    // Transaction frequency insight
    const transactionCount = transactions.length;
    const daysInPeriod = dateLabel === 'This Month' ? new Date().getDate() : 30;
    const avgTransactionsPerDay = transactionCount / daysInPeriod;
    
    if (avgTransactionsPerDay < 1) {
      insights.push({
        type: 'neutral',
        icon: Lightbulb,
        title: 'Low Transaction Activity',
        description: `Only ${avgTransactionsPerDay.toFixed(1)} transactions per day. Consider tracking smaller expenses for better insights.`
      });
    }

    return insights;
  }, [transactions, categories, accounts, currencies, mainCurrencyCode, getExchangeRate, dateLabel, previousPeriodData]);

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive':
        return theme.colors.success;
      case 'negative':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      default:
        return theme.colors.primary;
    }
  };

  const getInsightBackgroundColor = (type: string) => {
    switch (type) {
      case 'positive':
        return theme.colors.success + '15';
      case 'negative':
        return theme.colors.error + '15';
      case 'warning':
        return theme.colors.warning + '15';
      default:
        return theme.colors.primary + '15';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Lightbulb size={20} color={theme.colors.primary} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Smart Insights
        </Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.insightsContainer}
      >
        {insights.map((insight, index) => {
          const IconComponent = insight.icon;
          const insightColor = getInsightColor(insight.type);
          const backgroundColor = getInsightBackgroundColor(insight.type);
          
          return (
            <View 
              key={index}
              style={[
                styles.insightCard,
                { backgroundColor }
              ]}
            >
              <View style={styles.insightHeader}>
                <View style={[styles.insightIcon, { backgroundColor: insightColor + '20' }]}>
                  <IconComponent size={16} color={insightColor} />
                </View>
              </View>
              <Text style={[styles.insightTitle, { color: theme.colors.text }]}>
                {insight.title}
              </Text>
              <Text style={[styles.insightDescription, { color: theme.colors.textSecondary }]}>
                {insight.description}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  insightsContainer: {
    paddingHorizontal: 4,
    gap: 16,
  },
  insightCard: {
    width: 280,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  insightHeader: {
    marginBottom: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});