import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { useState, useMemo } from 'react';
import { ListFilter as Filter, Calendar, Download, TrendingUp, DollarSign, ArrowUpRight, ArrowDownLeft, Target, Search, ChartBar as BarChart3, ChartPie as PieChart, Users, Clock } from 'lucide-react-native';
import { useData } from '@/context/DataContext';
import { Transaction, TransactionType } from '@/types';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ExportModal } from '@/components/ExportModal';
import { ExportData } from '@/utils/exportUtils';
import { FiltersPanel } from '@/components/FiltersPanel';
import { SimpleDateFilter } from '@/components/SimpleDateFilter';
import { ReportsOverview } from '@/components/ReportsOverview';
import { ReportsByCategory } from '@/components/ReportsByCategory';
import { ReportsByAccount } from '@/components/ReportsByAccount';


const { width: screenWidth } = Dimensions.get('window');

type ReportTab = 'overview' | 'category' | 'account' | 'time' | 'forecast';

export default function Reports() {
  const { theme } = useTheme();
  const { transactions, accounts, categories, currencies, mainCurrencyCode, getExchangeRate } = useData();
  
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<{
    transactionTypes: TransactionType[];
    accountIds: string[];
    categoryNames: string[];
    startDate: Date | null;
    endDate: Date | null;
    dateLabel: string;
    showPaid: boolean;
    showPending: boolean;
  }>({
    transactionTypes: [],
    accountIds: [],
    categoryNames: [],
    startDate: (() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    })(),
    endDate: new Date(),
    dateLabel: 'This Month',
    showPaid: true,
    showPending: true,
  });

  // Get main currency for display
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Filter transactions and calculate totals
  const { filteredTransactions, totalIncome, totalExpenses, netBalance, previousPeriodData } = useMemo(() => {
    // First apply filters
    let filtered = transactions.filter((transaction) => {
      // Filter by transaction type
      if (filters.transactionTypes.length > 0) {
        const typeMatch = filters.transactionTypes.includes(transaction.type);
        if (!typeMatch) return false;
      }
      
      // Filter by account
      if (filters.accountIds.length > 0) {
        const matchesAccount = filters.accountIds.includes(transaction.accountId) || 
                              (transaction.toAccountId && filters.accountIds.includes(transaction.toAccountId));
        if (!matchesAccount) return false;
      }
      
      // Filter by category
      if (filters.categoryNames.length > 0) {
        const matchesCategory = filters.categoryNames.includes(transaction.category || '') ||
                               filters.categoryNames.includes(transaction.subcategory || '');
        if (!matchesCategory) return false;
      }
      
      // Filter by payment status (always apply for income/expense)
      if (transaction.type === 'income' || transaction.type === 'expense') {
        if (transaction.isPaid && !filters.showPaid) return false;
        if (!transaction.isPaid && !filters.showPending) return false;
      }
      
      // Filter by date range
      if (filters.startDate || filters.endDate) {
        const transactionDate = new Date(transaction.date);
        if (filters.startDate && transactionDate < filters.startDate) return false;
        if (filters.endDate && transactionDate > filters.endDate) return false;
      }
      
      return true;
    });

    // Then apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(transaction => {
        const description = (transaction.description || '').toLowerCase();
        const category = (transaction.category || '').toLowerCase();
        const subcategory = (transaction.subcategory || '').toLowerCase();
        const accountName = accounts.find(a => a.id === transaction.accountId)?.name.toLowerCase() || '';
        const amount = transaction.amount.toString();
        
        return description.includes(query) ||
               category.includes(query) ||
               subcategory.includes(query) ||
               accountName.includes(query) ||
               amount.includes(query);
      });
    }

    // Calculate totals from filtered transactions
    const income = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
        return sum + convertedAmount;
      }, 0);
    
    const expenses = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
        return sum + convertedAmount;
      }, 0);

    // Calculate previous period data for comparison
    let previousIncome = 0;
    let previousExpenses = 0;
    
    if (filters.startDate && filters.endDate) {
      const periodLength = filters.endDate.getTime() - filters.startDate.getTime();
      const previousStartDate = new Date(filters.startDate.getTime() - periodLength);
      const previousEndDate = new Date(filters.startDate.getTime() - 1);
      
      const previousTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= previousStartDate && transactionDate <= previousEndDate;
      });
      
      previousIncome = previousTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);
      
      previousExpenses = previousTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);
    }

    return {
      filteredTransactions: filtered,
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      previousPeriodData: {
        income: previousIncome,
        expenses: previousExpenses,
        net: previousIncome - previousExpenses,
      }
    };
  }, [transactions, filters, searchQuery, getExchangeRate, mainCurrencyCode, accounts]);

  // Calculate percentage changes
  const incomeChange = previousPeriodData.income > 0 
    ? ((totalIncome - previousPeriodData.income) / previousPeriodData.income) * 100 
    : 0;
  const expenseChange = previousPeriodData.expenses > 0 
    ? ((totalExpenses - previousPeriodData.expenses) / previousPeriodData.expenses) * 100 
    : 0;
  const netChange = previousPeriodData.net !== 0 
    ? ((netBalance - previousPeriodData.net) / Math.abs(previousPeriodData.net)) * 100 
    : 0;

  const hasActiveFilters = () => {
    return filters.transactionTypes.length > 0 ||
           filters.accountIds.length > 0 ||
           filters.categoryNames.length > 0 ||
           !filters.showPaid ||
           !filters.showPending ||
           searchQuery.trim() !== '';
  };

  // Prepare export data with current filters
  const prepareExportData = (): ExportData => {
    const accountNames = filters.accountIds.map(id => {
      const account = accounts.find(a => a.id === id);
      return account?.name || 'Unknown Account';
    });

    const transactionTypeNames = filters.transactionTypes.map(type => {
      switch (type) {
        case 'income': return 'All Income';
        case 'paid_income': return 'Paid Income';
        case 'pending_income': return 'Pending Income';
        case 'expense': return 'All Expenses';
        case 'paid_expense': return 'Paid Expenses';
        case 'due_expense': return 'Due Expenses';
        case 'transfer': return 'Transfers';
        default: return type;
      }
    });

    return {
      transactions: filteredTransactions,
      accounts: filters.accountIds.length > 0 
        ? accounts.filter(a => filters.accountIds.includes(a.id))
        : accounts,
      categories: filters.categoryNames.length > 0
        ? categories.filter(c => 
            filters.categoryNames.includes(c.name) ||
            c.subcategories?.some(sub => filters.categoryNames.includes(sub.name))
          )
        : categories,
      filters: {
        dateRange: filters.dateLabel,
        accountNames,
        categoryNames: filters.categoryNames,
        transactionTypes: transactionTypeNames,
      },
      totals: {
        income: totalIncome,
        expenses: totalExpenses,
        balance: netBalance,
      },
    };
  };

  const tabs = [
    { id: 'overview', title: 'Overview', icon: TrendingUp },
    { id: 'category', title: 'By Category', icon: PieChart },
    { id: 'account', title: 'By Account', icon: Users },
    { id: 'time', title: 'By Time', icon: Clock },
    { id: 'forecast', title: 'Forecast', icon: Target },
  ];

  const renderTabContent = () => {
    const commonProps = {
      transactions: filteredTransactions,
      accounts,
      categories,
      currencies,
      mainCurrencyCode,
      getExchangeRate,
      filters,
    };

    switch (activeTab) {
      case 'overview':
        return (
          <ReportsOverview 
            {...commonProps}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            netBalance={netBalance}
            previousPeriodData={previousPeriodData}
            incomeChange={incomeChange}
            expenseChange={expenseChange}
            netChange={netChange}
          />
        );
      case 'category':
        return <ReportsByCategory {...commonProps} />;
      case 'account':
        return <ReportsByAccount {...commonProps} />;
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Modern Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Reports & Analytics</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {filters.dateLabel} • {filteredTransactions.length} transactions
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.colors.card }]}
              onPress={() => setShowDateSelector(true)}
            >
              <Calendar size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.headerButton, 
                { backgroundColor: theme.colors.card },
                hasActiveFilters() && { backgroundColor: theme.colors.primary }
              ]}
              onPress={() => setShowFiltersPanel(true)}
            >
              <Filter size={20} color={hasActiveFilters() ? 'white' : theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowExportModal(true)}
            >
              <Download size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          <LinearGradient
            colors={[theme.colors.success, '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.kpiCard]}
          >
            <BlurView intensity={20} tint="light" style={styles.kpiBlur}>
              <View style={styles.kpiHeader}>
                <ArrowDownLeft size={24} color="white" />
                <View style={styles.kpiChange}>
                  <Text style={styles.kpiChangeText}>
                    {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>{mainCurrency?.symbol}{totalIncome.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              <Text style={styles.kpiLabel}>Total Income</Text>
            </BlurView>
          </LinearGradient>

          <LinearGradient
            colors={[theme.colors.error, '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.kpiCard]}
          >
            <BlurView intensity={20} tint="light" style={styles.kpiBlur}>
              <View style={styles.kpiHeader}>
                <ArrowUpRight size={24} color="white" />
                <View style={styles.kpiChange}>
                  <Text style={styles.kpiChangeText}>
                    {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>{mainCurrency?.symbol}{totalExpenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              <Text style={styles.kpiLabel}>Total Expenses</Text>
            </BlurView>
          </LinearGradient>

          <LinearGradient
            colors={netBalance >= 0 ? [theme.colors.primary, '#7C3AED'] : [theme.colors.error, '#EF4444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.kpiCard]}
          >
            <BlurView intensity={20} tint="light" style={styles.kpiBlur}>
              <View style={styles.kpiHeader}>
                <DollarSign size={24} color="white" />
                <View style={styles.kpiChange}>
                  <Text style={styles.kpiChangeText}>
                    {netChange >= 0 ? '+' : ''}{netChange.toFixed(1)}%
                  </Text>
                </View>
              </View>
              <Text style={styles.kpiValue}>{mainCurrency?.symbol}{Math.abs(netBalance).toLocaleString('en-US', { maximumFractionDigits: 2 })}</Text>
              <Text style={styles.kpiLabel}>{netBalance >= 0 ? 'Net Profit' : 'Net Loss'}</Text>
            </BlurView>
          </LinearGradient>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[
                    styles.tab,
                    { backgroundColor: theme.colors.card },
                    isActive && { backgroundColor: theme.colors.primary }
                  ]}
                  onPress={() => setActiveTab(tab.id as ReportTab)}
                >
                  <IconComponent 
                    size={18} 
                    color={isActive ? 'white' : theme.colors.primary} 
                  />
                  <Text style={[
                    styles.tabText,
                    { color: isActive ? 'white' : theme.colors.text }
                  ]}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>
      </SafeAreaView>

      {/* Date Selector Modal */}
      <SimpleDateFilter
        visible={showDateSelector}
        onClose={() => setShowDateSelector(false)}
        onSelect={(startDate, endDate, label) => {
          setFilters(prev => ({ ...prev, startDate, endDate, dateLabel: label }));
          setShowDateSelector(false);
        }}
        currentStartDate={filters.startDate}
        currentEndDate={filters.endDate}
      />

      {/* Filters Panel */}
      <FiltersPanel
        visible={showFiltersPanel}
        onClose={() => setShowFiltersPanel(false)}
        filters={filters}
        onFiltersChange={setFilters}
        accounts={accounts}
        categories={categories}
      />

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          visible={showExportModal}
          onClose={() => setShowExportModal(false)}
          exportData={prepareExportData()}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  kpiBlur: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  kpiChange: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  kpiChangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  clearSearch: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    marginBottom: 16,
  },
  tabScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
});