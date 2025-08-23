import { View, StyleSheet, Text, TouchableOpacity, SectionList, Platform, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { useData } from '@/context/DataContext';
import { TransactionListItem } from '@/components/TransactionListItem';
import { useState, useMemo } from 'react';
import { Filter, Calendar, Download, TrendingUp, ChartBar as BarChart3, List, Search } from 'lucide-react-native';
import { SimpleDateFilter } from '@/components/SimpleDateFilter';
import { FiltersPanel } from '@/components/FiltersPanel';
import { Transaction, TransactionType } from '@/types';
import { BlurView } from 'expo-blur';
import { ExportModal } from '@/components/ExportModal';
import { ExportData } from '@/utils/exportUtils';
import { TransactionCalendarView } from '@/components/TransactionCalendarView';

interface TransactionSection {
  title: string;
  data: Transaction[];
  groupIncome: number;
  groupExpenses: number;
}

export default function Transactions() {
  const { theme } = useTheme();
  const { transactions, accounts, categories, currencies, mainCurrencyCode, getExchangeRate } = useData();
  
  // Get main currency for display
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);
  
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  const [filters, setFilters] = useState<{
    transactionTypes: TransactionType[];
    accountIds: string[];
    categoryNames: string[];
    startDate: Date | null;
    endDate: Date | null;
    dateLabel: string;
    showPaid: boolean;
    showPending: boolean;
    viewMode: 'daily' | 'monthly' | 'yearly';
  }>({
    transactionTypes: [],
    accountIds: [],
    categoryNames: [],
    startDate: null,
    endDate: null,
    dateLabel: 'All Time',
    showPaid: true,
    showPending: true,
    viewMode: 'yearly',
  });

  // Filter transactions and calculate totals
  const { sections, totalIncome, totalExpenses, netBalance, filteredTransactions } = useMemo(() => {
    // Filter transactions
    const filtered = transactions.filter((transaction) => {
      // Filter by transaction type
      if (filters.transactionTypes.length > 0) {
        const hasMatch = filters.transactionTypes.some(filterType => {
          switch (filterType) {
            case 'income':
              return transaction.type === 'income';
            case 'paid_income':
              return transaction.type === 'income' && transaction.isPaid;
            case 'pending_income':
              return transaction.type === 'income' && !transaction.isPaid;
            case 'expense':
              return transaction.type === 'expense';
            case 'paid_expense':
              return transaction.type === 'expense' && transaction.isPaid;
            case 'due_expense':
              return transaction.type === 'expense' && !transaction.isPaid;
            case 'transfer':
              return transaction.type === 'transfer';
            default:
              return false;
          }
        });
        if (!hasMatch) return false;
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
      
      // Filter by date range
      if (filters.startDate || filters.endDate) {
        const transactionDate = new Date(transaction.date);
        if (filters.startDate && transactionDate < filters.startDate) return false;
        if (filters.endDate && transactionDate > filters.endDate) return false;
      }
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDescription = transaction.description?.toLowerCase().includes(query);
        const matchesCategory = transaction.category?.toLowerCase().includes(query);
        const matchesSubcategory = transaction.subcategory?.toLowerCase().includes(query);
        const matchesAmount = transaction.amount.toString().includes(query);
        
        if (!matchesDescription && !matchesCategory && !matchesSubcategory && !matchesAmount) {
          return false;
        }
      }
      
      return true;
    });

    // Calculate totals
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

    // Group transactions by date based on view mode and create sections
    const groupedTransactions: { [key: string]: Transaction[] } = {};
    const sortedTransactions = [...filtered].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      let key = '';
      
      switch (filters.viewMode) {
        case 'daily':
          key = date.toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
          break;
        case 'monthly':
          key = date.toLocaleDateString(undefined, { 
            year: 'numeric', 
            month: 'long' 
          });
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
      }
      
      if (!groupedTransactions[key]) {
        groupedTransactions[key] = [];
      }
      groupedTransactions[key].push(transaction);
    });

    // Convert grouped transactions to sections array
    const sectionsArray: TransactionSection[] = Object.entries(groupedTransactions).map(([groupKey, groupTransactions]) => {
      // Calculate group totals
      const groupIncome = groupTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);
      
      const groupExpenses = groupTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);

      return {
        title: groupKey,
        data: groupTransactions,
        groupIncome,
        groupExpenses,
      };
    });

    return {
      sections: sectionsArray,
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      filteredTransactions: filtered
    };
  }, [transactions, filters, getExchangeRate, mainCurrencyCode, searchQuery]);

  const hasActiveFilters = () => {
    return filters.transactionTypes.length > 0 ||
           filters.accountIds.length > 0 ||
           filters.categoryNames.length > 0 ||
           filters.startDate !== null ||
           filters.endDate !== null;
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

  // Render section header (sticky)
  const renderSectionHeader = ({ section }: { section: TransactionSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {section.title}
      </Text>
      <View style={styles.sectionTotals}>
        {section.groupIncome > 0 && (
          <Text style={[styles.sectionIncome, { color: theme.colors.success }]}>
            +{mainCurrency?.symbol}{section.groupIncome.toFixed(2)}
          </Text>
        )}
        {section.groupExpenses > 0 && (
          <Text style={[styles.sectionExpense, { color: theme.colors.error }]}>
            -{mainCurrency?.symbol}{section.groupExpenses.toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  );

  // Render individual transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TransactionListItem 
      transaction={item} 
    />
  );

  // Render footer component
  const renderFooter = () => (
    <View style={styles.footerSpacer} />
  );

  // Render empty state
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
        No transactions found for the selected filters
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Transactions</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.colors.card }]}
              onPress={() => setShowDateFilter(true)}
            >
              <Calendar size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.colors.card }]}
              onPress={() => setShowSearchBar(!showSearchBar)}
            >
              <Search size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.headerButton, { backgroundColor: theme.colors.card }]}
              onPress={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
            >
              {viewMode === 'list' ? (
                <Calendar size={20} color={theme.colors.primary} />
              ) : (
                <List size={20} color={theme.colors.primary} />
              )}
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

        {/* Summary Header */}
        <View style={[styles.summaryHeader, { backgroundColor: theme.colors.card }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Income
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                +{mainCurrency?.symbol}{totalIncome.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Expenses
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                -{mainCurrency?.symbol}{totalExpenses.toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                Balance
              </Text>
              <Text style={[
                styles.summaryValue, 
                { color: netBalance >= 0 ? theme.colors.success : theme.colors.error }
              ]}>
                {netBalance >= 0 ? '+' : ''}{mainCurrency?.symbol}{netBalance.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        {showSearchBar && (
          <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={theme.colors.textSecondary} />
              <TextInput
                style={[
                  styles.searchInput,
                  { 
                    color: theme.colors.text,
                    backgroundColor: 'transparent'
                  }
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search transactions..."
                placeholderTextColor={theme.colors.textSecondary}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                >
                  <Text style={[styles.clearSearchText, { color: theme.colors.primary }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Conditional View Rendering */}
        {viewMode === 'list' ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderTransactionItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={true}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sectionListContent}
            style={styles.sectionList}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderFooter}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />
        ) : (
          <TransactionCalendarView
            transactions={filteredTransactions}
            accounts={accounts}
            categories={categories}
            currencies={currencies}
            mainCurrencyCode={mainCurrencyCode}
            getExchangeRate={getExchangeRate}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        )}
        
        {/* Filter Modals */}
        <SimpleDateFilter
          visible={showDateFilter}
          onClose={() => setShowDateFilter(false)}
          onSelect={(startDate, endDate, label, viewMode) => {
            setFilters(prev => ({ ...prev, startDate, endDate, dateLabel: label, viewMode }));
            setShowDateFilter(false);
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
  summaryHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearSearchButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearSearchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionListContent: {
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTotals: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionIncome: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionExpense: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemSeparator: {
    height: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footerSpacer: {
    height: 100,
  },
});