import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Svg, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, G, Rect } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { useState, useMemo } from 'react';
import { Transaction, Currency } from '@/types';

interface MonthlyTrendChartProps {
  transactions: Transaction[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  // Filter props
  accountIds?: string[];
  categoryNames?: string[];
  startDate?: Date | null;
  endDate?: Date | null;
}

const { width: screenWidth } = Dimensions.get('window');

export function MonthlyTrendChart({ 
  transactions, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate,
  accountIds = [],
  categoryNames = [],
  startDate = null,
  endDate = null
}: MonthlyTrendChartProps) {
  const { theme } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Filter transactions based on provided filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filter by account
      if (accountIds.length > 0) {
        const matchesAccount = accountIds.includes(transaction.accountId) || 
                              (transaction.toAccountId && accountIds.includes(transaction.toAccountId));
        if (!matchesAccount) return false;
      }
      
      // Filter by category
      if (categoryNames.length > 0) {
        const matchesCategory = categoryNames.includes(transaction.category || '') ||
                               categoryNames.includes(transaction.subcategory || '');
        if (!matchesCategory) return false;
      }
      
      // Filter by date range
      if (startDate || endDate) {
        const transactionDate = new Date(transaction.date);
        if (startDate && transactionDate < startDate) return false;
        if (endDate && transactionDate > endDate) return false;
      }
      
      return true;
    });
  }, [transactions, accountIds, categoryNames, startDate, endDate]);

  // Calculate monthly data for the last 12 months using filtered transactions
  const monthlyData = useMemo(() => {
    const currentDate = new Date();
    const data = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (11 - index), 1);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();
      
      const monthTransactions = filteredTransactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === month && transactionDate.getFullYear() === year;
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);
        
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => {
          const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
          return sum + convertedAmount;
        }, 0);
      
      return {
        month: monthDate.toLocaleDateString(undefined, { month: 'short' }),
        fullMonth: monthDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        income,
        expenses,
        net: income - expenses,
        index,
        transactionCount: monthTransactions.length
      };
    });

    // Demo data if no real data exists
    const demoMonthlyData = [
      { month: 'Jan', fullMonth: 'January 2025', income: 2800, expenses: 2200, net: 600, index: 0, transactionCount: 15 },
      { month: 'Feb', fullMonth: 'February 2025', income: 3200, expenses: 2400, net: 800, index: 1, transactionCount: 18 },
      { month: 'Mar', fullMonth: 'March 2025', income: 2900, expenses: 2600, net: 300, index: 2, transactionCount: 22 },
      { month: 'Apr', fullMonth: 'April 2025', income: 3100, expenses: 2300, net: 800, index: 3, transactionCount: 16 },
      { month: 'May', fullMonth: 'May 2025', income: 3300, expenses: 2800, net: 500, index: 4, transactionCount: 20 },
      { month: 'Jun', fullMonth: 'June 2025', income: 3000, expenses: 2500, net: 500, index: 5, transactionCount: 19 },
      { month: 'Jul', fullMonth: 'July 2025', income: 3400, expenses: 2700, net: 700, index: 6, transactionCount: 24 },
      { month: 'Aug', fullMonth: 'August 2025', income: 3200, expenses: 2900, net: 300, index: 7, transactionCount: 21 },
      { month: 'Sep', fullMonth: 'September 2025', income: 3100, expenses: 2400, net: 700, index: 8, transactionCount: 17 },
      { month: 'Oct', fullMonth: 'October 2025', income: 3300, expenses: 2600, net: 700, index: 9, transactionCount: 23 },
      { month: 'Nov', fullMonth: 'November 2025', income: 3500, expenses: 2800, net: 700, index: 10, transactionCount: 25 },
      { month: 'Dec', fullMonth: 'December 2025', income: 3200, expenses: 3100, net: 100, index: 11, transactionCount: 28 },
    ];

    return data.some(d => d.income > 0 || d.expenses > 0) ? data : demoMonthlyData;
  }, [filteredTransactions, getExchangeRate, mainCurrencyCode]);
  
  // Calculate max values for scaling
  const maxIncome = Math.max(...monthlyData.map(d => d.income));
  const maxExpenses = Math.max(...monthlyData.map(d => d.expenses));
  const maxValue = Math.max(maxIncome, maxExpenses, 1000);

  // Chart dimensions
  const chartWidth = screenWidth - 72;
  const chartHeight = 200;
  const padding = 20;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  // Create smooth paths
  const createSmoothPath = (values: number[]) => {
    if (values.length === 0) return '';
    
    const points = values.map((value, index) => ({
      x: padding + (index / (values.length - 1)) * innerWidth,
      y: padding + innerHeight - (value / maxValue) * innerHeight
    }));

    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const tension = 0.4;
      let cp1x, cp1y, cp2x, cp2y;
      
      if (i === 1) {
        cp1x = prev.x + (curr.x - prev.x) * tension;
        cp1y = prev.y;
      } else {
        const prevPrev = points[i - 2];
        cp1x = prev.x + (curr.x - prevPrev.x) * tension * 0.5;
        cp1y = prev.y + (curr.y - prevPrev.y) * tension * 0.5;
      }
      
      if (i === points.length - 1) {
        cp2x = curr.x - (curr.x - prev.x) * tension;
        cp2y = curr.y;
      } else {
        cp2x = curr.x - (next.x - prev.x) * tension * 0.5;
        cp2y = curr.y - (next.y - prev.y) * tension * 0.5;
      }
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  const incomeValues = monthlyData.map(d => d.income);
  const expenseValues = monthlyData.map(d => d.expenses);
  const incomePath = createSmoothPath(incomeValues);
  const expensePath = createSmoothPath(expenseValues);

  // Handle month selection
  const handleMonthPress = (monthIndex: number) => {
    setSelectedMonth(selectedMonth === monthIndex ? null : monthIndex);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            12-Month Trend
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Income vs Expenses Over Time
          </Text>
        </View>
        
      </View>

      {/* Filter indicator */}
      {(accountIds.length > 0 || categoryNames.length > 0 || startDate || endDate) && (
        <View style={[styles.filterIndicator, { backgroundColor: theme.colors.primary + '15' }]}>
          <Text style={[styles.filterText, { color: theme.colors.primary }]}>
            Filtered data • {filteredTransactions.length} transactions
          </Text>
        </View>
      )}

      {/* Interactive Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                  <Defs>
                    {/* Income gradient */}
                    <LinearGradient id="incomeAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
                    </LinearGradient>
                    
                    {/* Expense gradient */}
                    <LinearGradient id="expenseAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                      <Stop offset="100%" stopColor="#EF4444" stopOpacity="0.05" />
                    </LinearGradient>

                    {/* Glow effects */}
                    <LinearGradient id="incomeGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.8" />
                      <Stop offset="100%" stopColor="#22C55E" stopOpacity="0.2" />
                    </LinearGradient>
                    
                    <LinearGradient id="expenseGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.8" />
                      <Stop offset="100%" stopColor="#EF4444" stopOpacity="0.2" />
                    </LinearGradient>
                  </Defs>
                  
                  {/* Background grid */}
                  <G opacity="0.1">
                    {[0.25, 0.5, 0.75].map((ratio, index) => (
                      <Path
                        key={index}
                        d={`M ${padding} ${padding + innerHeight * ratio} L ${padding + innerWidth} ${padding + innerHeight * ratio}`}
                        stroke={theme.colors.textSecondary}
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                    ))}
                  </G>
                  
                  {/* Income area and line */}
                  {incomePath && (
                    <G>
                      <Path
                        d={`${incomePath} L ${padding + innerWidth} ${padding + innerHeight} L ${padding} ${padding + innerHeight} Z`}
                        fill="url(#incomeAreaGradient)"
                      />
                      <Path
                        d={incomePath}
                        stroke="url(#incomeGlow)"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d={incomePath}
                        stroke="#22C55E"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </G>
                  )}
                  
                  {/* Expense area and line */}
                  {expensePath && (
                    <G>
                      <Path
                        d={`${expensePath} L ${padding + innerWidth} ${padding + innerHeight} L ${padding} ${padding + innerHeight} Z`}
                        fill="url(#expenseAreaGradient)"
                      />
                      <Path
                        d={expensePath}
                        stroke="url(#expenseGlow)"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <Path
                        d={expensePath}
                        stroke="#EF4444"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </G>
                  )}

                  {/* Interactive data points */}
                  {monthlyData.map((dataPoint, index) => {
                    const x = padding + (index / (monthlyData.length - 1)) * innerWidth;
                    const incomeY = padding + innerHeight - (dataPoint.income / maxValue) * innerHeight;
                    const expenseY = padding + innerHeight - (dataPoint.expenses / maxValue) * innerHeight;
                    const isSelected = selectedMonth === index;
                    
                    return (
                      <G key={index}>
                        {/* Income point */}
                        {dataPoint.income > 0 && (
                          <G>
                            <Circle
                              cx={x}
                              cy={incomeY}
                              r={isSelected ? "10" : "6"}
                              fill="#22C55E"
                              opacity={isSelected ? 1 : 0.8}
                              onPress={() => handleMonthPress(index)}
                            />
                            {isSelected && (
                              <Circle
                                cx={x}
                                cy={incomeY}
                                r="15"
                                fill="none"
                                stroke="#22C55E"
                                strokeWidth="2"
                                opacity="0.5"
                              />
                            )}
                          </G>
                        )}
                        
                        {/* Expense point */}
                        {dataPoint.expenses > 0 && (
                          <G>
                            <Circle
                              cx={x}
                              cy={expenseY}
                              r={isSelected ? "10" : "6"}
                              fill="#EF4444"
                              opacity={isSelected ? 1 : 0.8}
                              onPress={() => handleMonthPress(index)}
                            />
                            {isSelected && (
                              <Circle
                                cx={x}
                                cy={expenseY}
                                r="15"
                                fill="none"
                                stroke="#EF4444"
                                strokeWidth="2"
                                opacity="0.5"
                              />
                            )}
                          </G>
                        )}

                        {/* Month label */}
                        <SvgText
                          x={x}
                          y={chartHeight - 5}
                          fontSize="11"
                          fill={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                          textAnchor="middle"
                          fontWeight={isSelected ? "bold" : "normal"}
                        >
                          {dataPoint.month}
                        </SvgText>

                        {/* Selection indicator */}
                        {isSelected && (
                          <Rect
                            x={x - 15}
                            y={padding}
                            width="30"
                            height={innerHeight}
                            fill={theme.colors.primary}
                            opacity="0.1"
                          />
                        )}
                      </G>
                    );
                  })}

                  {/* Y-axis labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const value = maxValue * (1 - ratio);
                    const y = padding + innerHeight * ratio;
                    
                    return (
                      <SvgText
                        key={`y-label-${index}`}
                        x={padding - 5}
                        y={y + 3}
                        fontSize="10"
                        fill={theme.colors.textSecondary}
                        textAnchor="end"
                        fontWeight="500"
                      >
                        {mainCurrency?.symbol}{(value / 1000).toFixed(0)}k
                      </SvgText>
                    );
                  })}
                </Svg>
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={[styles.legendText, { color: theme.colors.text }]}>Income</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: theme.colors.text }]}>Expenses</Text>
        </View>
      </View>

      {/* Selected Month Details */}
      {selectedMonth !== null && (
        <View style={[styles.monthDetails, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.monthDetailsTitle, { color: theme.colors.text }]}>
            {monthlyData[selectedMonth].fullMonth}
          </Text>
          <View style={styles.monthDetailsGrid}>
            <View style={styles.monthDetailItem}>
              <Text style={[styles.monthDetailLabel, { color: theme.colors.textSecondary }]}>Income</Text>
              <Text style={[styles.monthDetailValue, { color: theme.colors.success }]}>
                {mainCurrency?.symbol}{monthlyData[selectedMonth].income.toFixed(0)}
              </Text>
            </View>
            <View style={styles.monthDetailItem}>
              <Text style={[styles.monthDetailLabel, { color: theme.colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.monthDetailValue, { color: theme.colors.error }]}>
                {mainCurrency?.symbol}{monthlyData[selectedMonth].expenses.toFixed(0)}
              </Text>
            </View>
            <View style={styles.monthDetailItem}>
              <Text style={[styles.monthDetailLabel, { color: theme.colors.textSecondary }]}>Net</Text>
              <Text style={[
                styles.monthDetailValue, 
                { color: monthlyData[selectedMonth].net >= 0 ? theme.colors.success : theme.colors.error }
              ]}>
                {monthlyData[selectedMonth].net >= 0 ? '+' : ''}{mainCurrency?.symbol}{monthlyData[selectedMonth].net.toFixed(0)}
              </Text>
            </View>
            <View style={styles.monthDetailItem}>
              <Text style={[styles.monthDetailLabel, { color: theme.colors.textSecondary }]}>Transactions</Text>
              <Text style={[styles.monthDetailValue, { color: theme.colors.text }]}>
                {monthlyData[selectedMonth].transactionCount}
              </Text>
            </View>
          </View>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
    alignSelf: 'center',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '600',
  },
  monthDetails: {
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  monthDetailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  monthDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthDetailItem: {
    alignItems: 'center',
  },
  monthDetailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  monthDetailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});