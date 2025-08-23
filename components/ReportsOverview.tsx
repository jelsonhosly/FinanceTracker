import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Transaction, Account, Category, Currency } from '@/types';
import { MonthlyTrendChart } from '@/components/MonthlyTrendChart';
import { InteractiveSpendingChart } from '@/components/InteractiveSpendingChart';
import { CashFlowChart } from '@/components/CashFlowChart';

interface ReportsOverviewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  filters: any;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  previousPeriodData: {
    income: number;
    expenses: number;
    net: number;
  };
  incomeChange: number;
  expenseChange: number;
  netChange: number;
}

export function ReportsOverview({
  transactions,
  accounts,
  categories,
  currencies,
  mainCurrencyCode,
  getExchangeRate,
  filters,
  totalIncome,
  totalExpenses,
  netBalance,
  previousPeriodData,
  incomeChange,
  expenseChange,
  netChange,
}: ReportsOverviewProps) {
  const { theme } = useTheme();

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentPadding}
    >
      {/* Monthly Trend Chart */}
      <MonthlyTrendChart 
        transactions={transactions}
        currencies={currencies}
        mainCurrencyCode={mainCurrencyCode}
        getExchangeRate={getExchangeRate}
        accountIds={filters.accountIds}
        categoryNames={filters.categoryNames}
        startDate={filters.startDate}
        endDate={filters.endDate}
      />

      {/* Spending Breakdown */}
      <InteractiveSpendingChart 
        transactions={transactions}
        categories={categories}
        currencies={currencies}
        mainCurrencyCode={mainCurrencyCode}
        getExchangeRate={getExchangeRate}
        hideSmallAmounts={false}
      />

      {/* Cash Flow Chart */}
      <CashFlowChart 
        transactions={transactions}
        categories={categories}
        currencies={currencies}
        mainCurrencyCode={mainCurrencyCode}
        getExchangeRate={getExchangeRate}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: 100,
  },
});