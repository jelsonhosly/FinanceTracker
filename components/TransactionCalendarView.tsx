import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useState, useMemo, useRef, useEffect } from 'react';
import { Transaction, Account, Category, Currency } from '@/types';
import { ChevronLeft, ChevronRight, Search, X, ArrowDownLeft, ArrowUpRight, Repeat, Clock, CircleCheck as CheckCircle2 } from 'lucide-react-native';
import { TransactionListItem } from '@/components/TransactionListItem';

interface TransactionCalendarViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  transactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  hasUnpaid: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export function TransactionCalendarView({
  transactions,
  accounts,
  categories,
  currencies,
  mainCurrencyCode,
  getExchangeRate,
  searchQuery,
  onSearchQueryChange,
}: TransactionCalendarViewProps) {
  const { theme } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Filter transactions based on search query
  const searchFilteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    
    const query = searchQuery.toLowerCase();
    return transactions.filter(transaction => {
      const matchesDescription = transaction.description?.toLowerCase().includes(query);
      const matchesCategory = transaction.category?.toLowerCase().includes(query);
      const matchesSubcategory = transaction.subcategory?.toLowerCase().includes(query);
      const matchesAmount = transaction.amount.toString().includes(query);
      const matchesAccount = accounts.find(a => a.id === transaction.accountId)?.name.toLowerCase().includes(query);
      
      return matchesDescription || matchesCategory || matchesSubcategory || matchesAmount || matchesAccount;
    });
  }, [transactions, searchQuery, accounts]);

  // Generate search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const suggestions = new Set<string>();
    const query = searchQuery.toLowerCase();
    
    // Add matching descriptions
    transactions.forEach(transaction => {
      if (transaction.description?.toLowerCase().includes(query)) {
        suggestions.add(transaction.description);
      }
      if (transaction.category?.toLowerCase().includes(query)) {
        suggestions.add(transaction.category);
      }
      if (transaction.subcategory?.toLowerCase().includes(query)) {
        suggestions.add(transaction.subcategory);
      }
    });

    // Add matching account names
    accounts.forEach(account => {
      if (account.name.toLowerCase().includes(query)) {
        suggestions.add(account.name);
      }
    });

    return Array.from(suggestions).slice(0, 5);
  }, [searchQuery, transactions, accounts]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month and calculate starting date
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    const days: CalendarDay[] = [];
    const currentDay = new Date(startDate);
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const dayTransactions = searchFilteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getDate() === currentDay.getDate() &&
          transactionDate.getMonth() === currentDay.getMonth() &&
          transactionDate.getFullYear() === currentDay.getFullYear()
        );
      });

      const totalIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);

      const totalExpenses = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);

      const hasUnpaid = dayTransactions.some(t => !t.isPaid);

      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        transactions: dayTransactions,
        totalIncome,
        totalExpenses,
        hasUnpaid,
      });

      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  }, [currentDate, searchFilteredTransactions, getExchangeRate, mainCurrencyCode]);

  // Get selected day transactions
  const selectedDayTransactions = useMemo(() => {
    if (!selectedDate) return [];
    
    return searchFilteredTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return (
        transactionDate.getDate() === selectedDate.getDate() &&
        transactionDate.getMonth() === selectedDate.getMonth() &&
        transactionDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [selectedDate, searchFilteredTransactions]);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDayPress = (day: CalendarDay) => {
    if (day.transactions.length > 0) {
      setSelectedDate(selectedDate?.getTime() === day.date.getTime() ? null : day.date);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    onSearchQueryChange(suggestion);
    setShowSearchSuggestions(false);
    searchInputRef.current?.blur();
  };

  const clearSearch = () => {
    onSearchQueryChange('');
    setShowSearchSuggestions(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const renderCalendarDay = (day: CalendarDay, index: number) => {
    const isToday = day.date.toDateString() === new Date().toDateString();
    const isSelected = selectedDate?.getTime() === day.date.getTime();
    const hasTransactions = day.transactions.length > 0;
    const hasHighActivity = day.transactions.length >= 3;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.calendarDay,
          !day.isCurrentMonth && styles.calendarDayInactive,
          isToday && { borderColor: theme.colors.primary, borderWidth: 2 },
          isSelected && { backgroundColor: theme.colors.primary + '30' },
          hasTransactions && { backgroundColor: theme.colors.card },
        ]}
        onPress={() => handleDayPress(day)}
        disabled={!hasTransactions}
      >
        <Text
          style={[
            styles.calendarDayText,
            { color: day.isCurrentMonth ? theme.colors.text : theme.colors.textSecondary },
            isToday && { color: theme.colors.primary, fontWeight: '700' },
            isSelected && { color: theme.colors.primary, fontWeight: '700' },
          ]}
        >
          {day.date.getDate()}
        </Text>

        {/* Transaction indicators */}
        {hasTransactions && (
          <View style={styles.transactionIndicators}>
            {day.totalIncome > 0 && (
              <View style={[styles.incomeIndicator, { backgroundColor: theme.colors.success }]} />
            )}
            {day.totalExpenses > 0 && (
              <View style={[styles.expenseIndicator, { backgroundColor: theme.colors.error }]} />
            )}
            {day.hasUnpaid && (
              <View style={[styles.unpaidIndicator, { backgroundColor: theme.colors.warning }]} />
            )}
          </View>
        )}

        {/* Transaction count for high activity days */}
        {hasHighActivity && (
          <View style={[styles.activityBadge, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.activityBadgeText}>{day.transactions.length}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSuggestionItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { backgroundColor: theme.colors.card }]}
      onPress={() => handleSuggestionPress(item)}
    >
      <Search size={16} color={theme.colors.textSecondary} />
      <Text style={[styles.suggestionText, { color: theme.colors.text }]}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>

      {/* Calendar Header */}
      <View style={[styles.calendarHeader, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
          <ChevronLeft size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <View style={styles.monthYearContainer}>
          <Text style={[styles.monthYearText, { color: theme.colors.text }]}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={[styles.todayButtonText, { color: theme.colors.primary }]}>Today</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
          <ChevronRight size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Week Days Header */}
      <View style={[styles.weekDaysHeader, { backgroundColor: theme.colors.card }]}>
        {weekDays.map((day, index) => (
          <Text 
            key={index}
            style={[styles.weekDayText, { color: theme.colors.textSecondary }]}
          >
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <ScrollView style={styles.calendarContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => renderCalendarDay(day, index))}
        </View>

        {/* Selected Day Transactions */}
        {selectedDate && selectedDayTransactions.length > 0 && (
          <View style={[styles.selectedDayContainer, { backgroundColor: theme.colors.card }]}>
            <View style={styles.selectedDayHeader}>
              <Text style={[styles.selectedDayTitle, { color: theme.colors.text }]}>
                {selectedDate.toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <TouchableOpacity 
                style={styles.closeDayButton}
                onPress={() => setSelectedDate(null)}
              >
                <X size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Day Summary */}
            <View style={styles.daySummary}>
              <View style={styles.summaryItem}>
                <ArrowDownLeft size={16} color={theme.colors.success} />
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Income</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
                  +{mainCurrency?.symbol}{selectedDayTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + (t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode)), 0)
                    .toFixed(2)}
                </Text>
              </View>
              
              <View style={styles.summaryItem}>
                <ArrowUpRight size={16} color={theme.colors.error} />
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Expenses</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
                  -{mainCurrency?.symbol}{selectedDayTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + (t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode)), 0)
                    .toFixed(2)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Repeat size={16} color={theme.colors.primary} />
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Transfers</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {selectedDayTransactions.filter(t => t.type === 'transfer').length}
                </Text>
              </View>
            </View>

            {/* Selected Day Transactions List */}
            <View style={styles.dayTransactionsList}>
              {selectedDayTransactions.map((t) => (
                <TransactionListItem key={t.id} transaction={t} />
              ))}
            </View>

            {/* Legend */}
            <View style={[styles.legend, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.legendTitle, { color: theme.colors.text }]}>Legend</Text>
              <View style={styles.legendItems}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.success }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Income</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.error }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Expenses</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.colors.warning }]} />
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>Unpaid</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendBadge, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.legendBadgeText}>3+</Text>
                  </View>
                  <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>High Activity</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearSearchButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearContainer: {
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekDaysHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  calendarDay: {
    width: (screenWidth - 32) / 7,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
    position: 'relative',
  },
  calendarDayInactive: {
    opacity: 0.4,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionIndicators: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
  },
  incomeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  expenseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  unpaidIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  selectedDayContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDayTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeDayButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daySummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayTransactionsList: {
    gap: 8,
  },
  legend: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: 'white',
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
});