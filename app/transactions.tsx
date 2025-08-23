import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useData } from '@/context/DataContext';
import { TransactionListItem } from '@/components/TransactionListItem';
import { useState, useMemo } from 'react';
import { Filter, Calendar, RefreshCw, Tag, CreditCard, ChevronDown, X } from 'lucide-react-native';
import { AccountFilter } from '@/components/AccountFilter';
import { CategoryFilter } from '../components/CategoryFilter';
import { Transaction } from '@/types';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import TransactionsYearView from '@/components/TransactionsYearView';
import TransactionsMonthView from '@/components/TransactionsMonthView';

interface GroupedTransactions {
  [key: string]: Transaction[];
}

export default function Transactions() {
  const { theme } = useTheme();
  const { transactions, accounts, categories, currencies, mainCurrencyCode, getExchangeRate } = useData();
  
  // Get current date for defaults
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const [viewMode, setViewMode] = useState<'year' | 'month' | 'day'>('day');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [accountFilter, setAccountFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showAccountFilter, setShowAccountFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate years (current year ± 5 years)
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // Filter and group transactions
  const { filteredTransactions, groupedTransactions, totalIncome, totalExpenses, netBalance } = useMemo(() => {
    // Filter transactions
    const filtered = transactions.filter((transaction) => {
      let passesMonthFilter = true;
      let passesYearFilter = true;
      let passesAccountFilter = true;
      let passesCategoryFilter = true;
      
      const transactionDate = new Date(transaction.date);
      
      if (selectedMonth !== null) {
        passesMonthFilter = transactionDate.getMonth() + 1 === selectedMonth;
      }
      
      if (selectedYear !== null) {
        passesYearFilter = transactionDate.getFullYear() === selectedYear;
      }
      
      if (accountFilter) {
        passesAccountFilter = (
          transaction.accountId === accountFilter || 
          transaction.toAccountId === accountFilter
        );
      }

      if (categoryFilter) {
        passesCategoryFilter = (
          transaction.category === categoryFilter ||
          transaction.subcategory === categoryFilter
        );
      }
      
      return passesMonthFilter && passesYearFilter && passesAccountFilter && passesCategoryFilter;
    });

    // Calculate totals
    const income = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Group transactions by date
    const grouped: GroupedTransactions = {};
    const sortedTransactions = [...filtered].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    sortedTransactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const key = (selectedMonth !== null && selectedYear !== null)
        ? date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
        : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(transaction);
    });

    return {
      filteredTransactions: filtered,
      groupedTransactions: grouped,
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses
    };
  }, [transactions, selectedMonth, selectedYear, accountFilter, categoryFilter]);

  const renderTransactionGroup = (groupKey: string, groupTransactions: Transaction[]) => {
    // Calculate group totals
    const groupIncome = groupTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const groupExpenses = groupTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return (
      <View key={groupKey} style={styles.transactionGroup}>
        {/* Group Header */}
        <View style={[styles.groupHeader, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.groupTitle, { color: theme.colors.text }]}>
            {groupKey}
          </Text>
          <View style={styles.groupTotals}>
            {groupIncome > 0 && (
              <Text style={[styles.groupIncome, { color: theme.colors.success }]}>
                +${groupIncome.toFixed(2)}
              </Text>
            )}
            {groupExpenses > 0 && (
              <Text style={[styles.groupExpense, { color: theme.colors.error }]}>
                -${groupExpenses.toFixed(2)}
              </Text>
            )}
          </View>
        </View>

        {/* Group Transactions */}
        <View style={styles.groupTransactions}>
          {groupTransactions.map((transaction) => (
            <TransactionListItem 
              key={transaction.id} 
              transaction={transaction}
            />
          ))}
        </View>
      </View>
    );
  };

  const getCategoryDisplayName = () => {
    if (!categoryFilter) return 'All Categories';
    
    // Check if it's a main category
    const mainCategory = categories.find(c => c.name === categoryFilter);
    if (mainCategory) return mainCategory.name;
    
    // Check if it's a subcategory
    for (const category of categories) {
      const subcategory = category.subcategories?.find(sub => sub.name === categoryFilter);
      if (subcategory) return `${category.name} • ${subcategory.name}`;
    }
    
    return categoryFilter;
  };

  const handleClearFilters = () => {
    setSelectedMonth(null);
    setSelectedYear(null);
    setAccountFilter(null);
    setCategoryFilter(null);
  };

  const hasActiveFilters = () => {
    return selectedMonth !== null || selectedYear !== null || accountFilter !== null || categoryFilter !== null;
  };

  const renderMonthItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedMonth === index + 1 && { backgroundColor: theme.colors.primary + '20' }
      ]}
      onPress={() => {
        setSelectedMonth(index + 1);
        setShowMonthDropdown(false);
      }}
    >
      <Text style={[
        styles.dropdownItemText,
        { color: selectedMonth === index + 1 ? theme.colors.primary : theme.colors.text }
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderYearItem = ({ item }: { item: number }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedYear === item && { backgroundColor: theme.colors.primary + '20' }
      ]}
      onPress={() => {
        setSelectedYear(item);
        setShowYearDropdown(false);
      }}
    >
      <Text style={[
        styles.dropdownItemText,
        { color: selectedYear === item ? theme.colors.primary : theme.colors.text }
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView style={styles.safeArea}>
        <ScreenHeader 
          title="Transactions" 
        />

        {/* Summary KPIs */}
        <View style={[styles.summaryHeader, { backgroundColor: theme.colors.card }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.success }]}>+${totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: theme.colors.error }]}>-${totalExpenses.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Balance</Text>
              <Text style={[styles.summaryValue, { color: netBalance >= 0 ? theme.colors.success : theme.colors.error }]}>
                {netBalance >= 0 ? '+' : ''}${netBalance.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* View Tabs */}
        <View style={[styles.tabRow, { paddingHorizontal: 16 }]}>
          <TouchableOpacity
            style={[styles.tabBtn, { backgroundColor: theme.colors.card }, viewMode === 'year' && { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              setViewMode('year');
              setSelectedMonth(null);
              setSelectedYear(null);
            }}
          >
            <Text style={[styles.tabText, { color: viewMode === 'year' ? 'white' : theme.colors.text }]}>Year</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, { backgroundColor: theme.colors.card }, viewMode === 'month' && { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              setViewMode('month');
              if (selectedYear === null) setSelectedYear(currentYear);
              if (selectedMonth === null) setSelectedMonth(currentMonth);
            }}
          >
            <Text style={[styles.tabText, { color: viewMode === 'month' ? 'white' : theme.colors.text }]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, { backgroundColor: theme.colors.card }, viewMode === 'day' && { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              setViewMode('day');
              if (selectedYear === null) setSelectedYear(currentYear);
              if (selectedMonth === null) setSelectedMonth(currentMonth);
            }}
          >
            <Text style={[styles.tabText, { color: viewMode === 'day' ? 'white' : theme.colors.text }]}>Day</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {/* Month Dropdown */}
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { backgroundColor: theme.colors.card },
              selectedMonth !== null && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
            ]}
            onPress={() => setShowMonthDropdown(true)}
          >
            <Calendar size={16} color={selectedMonth ? theme.colors.primary : theme.colors.text} />
            <Text style={[
              styles.filterButtonText, 
              { color: selectedMonth ? theme.colors.primary : theme.colors.text }
            ]}>
              {selectedMonth ? monthNames[selectedMonth - 1] : 'Month'}
            </Text>
            <ChevronDown size={14} color={selectedMonth ? theme.colors.primary : theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* Year Dropdown */}
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { backgroundColor: theme.colors.card },
              selectedYear !== null && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
            ]}
            onPress={() => setShowYearDropdown(true)}
          >
            <Calendar size={16} color={selectedYear ? theme.colors.primary : theme.colors.text} />
            <Text style={[
              styles.filterButtonText, 
              { color: selectedYear ? theme.colors.primary : theme.colors.text }
            ]}>
              {selectedYear || 'Year'}
            </Text>
            <ChevronDown size={14} color={selectedYear ? theme.colors.primary : theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton, 
              { backgroundColor: theme.colors.card },
              accountFilter && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
            ]}
            onPress={() => setShowAccountFilter(true)}
          >
            <CreditCard size={16} color={accountFilter ? theme.colors.primary : theme.colors.text} />
            <Text style={[
              styles.filterButtonText, 
              { color: accountFilter ? theme.colors.primary : theme.colors.text }
            ]}>
              {accountFilter ? accounts.find(a => a.id === accountFilter)?.name || 'Account' : 'All Accounts'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton, 
              { backgroundColor: theme.colors.card },
              categoryFilter && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
            ]}
            onPress={() => setShowCategoryFilter(true)}
          >
            <Tag size={16} color={categoryFilter ? theme.colors.primary : theme.colors.text} />
            <Text style={[
              styles.filterButtonText, 
              { color: categoryFilter ? theme.colors.primary : theme.colors.text }
            ]}>
              {getCategoryDisplayName()}
            </Text>
          </TouchableOpacity>
          
          {hasActiveFilters() && (
            <TouchableOpacity
              style={[styles.resetButton, { backgroundColor: theme.colors.card }]}
              onPress={handleClearFilters}
            >
              <RefreshCw size={16} color={theme.colors.primary} />
              <Text style={[styles.resetButtonText, { color: theme.colors.primary }]}>Reset</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Hierarchical Views */}
        {viewMode === 'year' && (
          <TransactionsYearView
            transactions={transactions}
            currentYear={currentYear}
            onSelectMonth={(year, monthIdx) => {
              setSelectedYear(year);
              setSelectedMonth(monthIdx + 1);
              setViewMode('month');
            }}
          />
        )}
        {viewMode === 'month' && selectedYear !== null && selectedMonth !== null && (
          <TransactionsMonthView
            transactions={transactions}
            year={selectedYear}
            month={selectedMonth - 1}
            onSelectDay={() => {
              setViewMode('day');
            }}
          />
        )}
        {viewMode === 'day' && (
          Object.keys(groupedTransactions).length > 0 ? (
            <ScrollView 
              style={styles.transactionsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.transactionsContent}
            >
              {Object.entries(groupedTransactions).map(([groupKey, groupTransactions]) =>
                renderTransactionGroup(groupKey, groupTransactions)
              )}
              <View style={styles.bottomSpacer} />
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No transactions found for the selected filters</Text>
            </View>
          )
        )}

        {/* Month Dropdown Modal */}
        <Modal
          transparent
          visible={showMonthDropdown}
          animationType="fade"
          onRequestClose={() => setShowMonthDropdown(false)}
        >
          <View style={styles.modalContainer}>
            <BlurView 
              intensity={Platform.OS === 'ios' ? 20 : 15}
              tint={theme.dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.dropdownModal, { backgroundColor: theme.colors.card }]}>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.dropdownTitle, { color: theme.colors.text }]}>Select Month</Text>
                <TouchableOpacity onPress={() => setShowMonthDropdown(false)}>
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.dropdownActions}>
                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: theme.colors.background }]}
                  onPress={() => {
                    setSelectedMonth(null);
                    setShowMonthDropdown(false);
                  }}
                >
                  <Text style={[styles.clearButtonText, { color: theme.colors.text }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={monthNames}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderMonthItem}
                style={styles.dropdownList}
              />
            </View>
          </View>
        </Modal>

        {/* Year Dropdown Modal */}
        <Modal
          transparent
          visible={showYearDropdown}
          animationType="fade"
          onRequestClose={() => setShowYearDropdown(false)}
        >
          <View style={styles.modalContainer}>
            <BlurView 
              intensity={Platform.OS === 'ios' ? 20 : 15}
              tint={theme.dark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.dropdownModal, { backgroundColor: theme.colors.card }]}>
              <View style={styles.dropdownHeader}>
                <Text style={[styles.dropdownTitle, { color: theme.colors.text }]}>Select Year</Text>
                <TouchableOpacity onPress={() => setShowYearDropdown(false)}>
                  <X size={24} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.dropdownActions}>
                <TouchableOpacity
                  style={[styles.clearButton, { backgroundColor: theme.colors.background }]}
                  onPress={() => {
                    setSelectedYear(null);
                    setShowYearDropdown(false);
                  }}
                >
                  <Text style={[styles.clearButtonText, { color: theme.colors.text }]}>Clear</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={years}
                keyExtractor={(item) => item.toString()}
                renderItem={renderYearItem}
                style={styles.dropdownList}
              />
            </View>
          </View>
        </Modal>
        
        {/* Filter Modals */}
        {showAccountFilter && (
          <AccountFilter
            visible={showAccountFilter}
            onClose={() => setShowAccountFilter(false)}
            onSelect={(accountIds) => {
              setAccountFilter(accountIds[0] ?? null);
              setShowAccountFilter(false);
            }}
            selectedAccountIds={accountFilter ? [accountFilter] : []}
          />
        )}

        {showCategoryFilter && (
          <CategoryFilter
            visible={showCategoryFilter}
            onClose={() => setShowCategoryFilter(false)}
            onSelect={(categoryNames) => {
              setCategoryFilter(categoryNames[0] ?? null);
              setShowCategoryFilter(false);
            }}
            selectedCategories={categoryFilter ? [categoryFilter] : []}
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
  summaryHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
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
  filtersContainer: {
    maxHeight: 50,
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 36,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionsList: {
    flex: 1,
  },
  transactionsContent: {
    paddingHorizontal: 16,
  },
  transactionGroup: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  groupTotals: {
    flexDirection: 'row',
    gap: 12,
  },
  groupIncome: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupExpense: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupTransactions: {
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 100,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    width: '100%',
    maxWidth: 300,
    maxHeight: '70%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  dropdownActions: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  tabBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});