import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';

interface BarChartProps {
  month?: number;
  year?: number;
  account?: string | null;
  category?: string | null;
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
}

export function BarChart({ month, year, account, category, currencies, mainCurrencyCode, getExchangeRate }: BarChartProps) {
  const { theme } = useTheme();
  const { transactions } = useData();
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);
  
  // Get the current month and year if not provided
  const currentDate = new Date();
  const currentMonth = month || currentDate.getMonth() + 1;
  const currentYear = year || currentDate.getFullYear();
  
  // Calculate income and expenses for each day of the month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  
  const dailyTotals = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    const dayTransactions = transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      let passesDateFilter = (
        transactionDate.getDate() === day &&
        transactionDate.getMonth() + 1 === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
      
      let passesAccountFilter = true;
      if (account) {
        passesAccountFilter = (
          transaction.accountId === account || 
          transaction.toAccountId === account
        );
      }
      
      let passesCategoryFilter = true;
      if (category) {
        passesCategoryFilter = (
          transaction.category === category ||
          transaction.subcategory === category
        );
      }
      
      return passesDateFilter && passesAccountFilter && passesCategoryFilter;
    });
    
    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => {
        const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
        return sum + convertedAmount;
      }, 0);
      
    const expense = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => {
        const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
        return sum + convertedAmount;
      }, 0);
      
    return { day, income, expense };
  });
  
  // Generate beautiful demo data with wave patterns
  const demoData = Array.from({ length: 30 }, (_, index) => {
    const day = index + 1;
    const t = day / 30;
    
    // Create flowing wave patterns
    const incomeWave1 = Math.sin(t * Math.PI * 2) * 80;
    const incomeWave2 = Math.sin(t * Math.PI * 4 + 1) * 40;
    const incomeWave3 = Math.sin(t * Math.PI * 6 + 2) * 20;
    
    const expenseWave1 = Math.cos(t * Math.PI * 2.5 + 0.5) * 60;
    const expenseWave2 = Math.cos(t * Math.PI * 3.5 + 1.5) * 30;
    const expenseWave3 = Math.cos(t * Math.PI * 5 + 2.5) * 15;
    
    return {
      day,
      income: Math.max(20, 150 + incomeWave1 + incomeWave2 + incomeWave3),
      expense: Math.max(15, 120 + expenseWave1 + expenseWave2 + expenseWave3),
    };
  });
  
  const data = dailyTotals.some(d => d.income > 0 || d.expense > 0) 
    ? dailyTotals 
    : demoData;
  
  // Calculate the maximum value for scaling
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expense)),
    300 // Minimum scale for better visualization
  );
  
  // Calculate monthly totals
  const monthlyIncome = data.reduce((sum, day) => sum + day.income, 0);
  const monthlyExpense = data.reduce((sum, day) => sum + day.expense, 0);
  const monthlyBalance = monthlyIncome - monthlyExpense;

  // Chart dimensions
  const chartWidth = Dimensions.get('window').width - 32;
  const chartHeight = 200;
  const padding = 20;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  // Create ultra-smooth curve using cubic bezier
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
      
      // Calculate smooth control points
      const tension = 0.4;
      let cp1x, cp1y, cp2x, cp2y;
      
      if (i === 1) {
        // First curve
        cp1x = prev.x + (curr.x - prev.x) * tension;
        cp1y = prev.y;
      } else {
        const prevPrev = points[i - 2];
        cp1x = prev.x + (curr.x - prevPrev.x) * tension * 0.5;
        cp1y = prev.y + (curr.y - prevPrev.y) * tension * 0.5;
      }
      
      if (i === points.length - 1) {
        // Last curve
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

  const incomeValues = data.map(d => d.income);
  const expenseValues = data.map(d => d.expense);

  const incomePath = createSmoothPath(incomeValues);
  const expensePath = createSmoothPath(expenseValues);

  // Month names for x-axis
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const currentMonthName = monthNames[currentMonth - 1];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Income vs Expenses</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          {currentMonthName} {currentYear}
        </Text>
      </View>

      <View style={styles.totalsContainer}>
        <View style={styles.totalItem}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
            Income
          </Text>
          <Text style={[styles.totalValue, { color: theme.colors.success }]}>
            {mainCurrency?.symbol}{monthlyIncome.toFixed(0)}
          </Text>
        </View>
        
        <View style={styles.totalItem}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
            Expenses
          </Text>
          <Text style={[styles.totalValue, { color: theme.colors.error }]}>
            {mainCurrency?.symbol}{monthlyExpense.toFixed(0)}
          </Text>
        </View>
        
        <View style={styles.totalItem}>
          <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
            Balance
          </Text>
          <Text 
            style={[
              styles.totalValue, 
              { 
                color: monthlyBalance >= 0 
                  ? theme.colors.success 
                  : theme.colors.error 
              }
            ]}
          >
            {mainCurrency?.symbol}{monthlyBalance.toFixed(0)}
          </Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Defs>
            {/* Income gradient */}
            <LinearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#22C55E" stopOpacity="0.4" />
              <Stop offset="50%" stopColor="#22C55E" stopOpacity="0.2" />
              <Stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
            </LinearGradient>
            
            {/* Expense gradient */}
            <LinearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#EF4444" stopOpacity="0.4" />
              <Stop offset="50%" stopColor="#EF4444" stopOpacity="0.2" />
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
          
          {/* Background grid lines */}
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
                fill="url(#incomeGradient)"
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
                fill="url(#expenseGradient)"
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

          {/* Glowing data points */}
          {data.filter((_, index) => index % 5 === 0).map((dataPoint, index) => {
            const actualIndex = index * 5;
            const x = padding + (actualIndex / (data.length - 1)) * innerWidth;
            const incomeY = padding + innerHeight - (dataPoint.income / maxValue) * innerHeight;
            const expenseY = padding + innerHeight - (dataPoint.expense / maxValue) * innerHeight;
            
            return (
              <G key={index}>
                {dataPoint.income > 0 && (
                  <G>
                    <Circle
                      cx={x}
                      cy={incomeY}
                      r="6"
                      fill="#22C55E"
                      opacity="0.3"
                    />
                    <Circle
                      cx={x}
                      cy={incomeY}
                      r="3"
                      fill="#22C55E"
                    />
                  </G>
                )}
                {dataPoint.expense > 0 && (
                  <G>
                    <Circle
                      cx={x}
                      cy={expenseY}
                      r="6"
                      fill="#EF4444"
                      opacity="0.3"
                    />
                    <Circle
                      cx={x}
                      cy={expenseY}
                      r="3"
                      fill="#EF4444"
                    />
                  </G>
                )}
              </G>
            );
          })}

          {/* X-axis labels */}
          {[1, Math.floor(data.length / 3), Math.floor(2 * data.length / 3), data.length].map((day, index) => {
            const x = padding + ((day - 1) / (data.length - 1)) * innerWidth;
            
            return (
              <SvgText
                key={`label-${index}`}
                x={x}
                y={chartHeight - 5}
                fontSize="11"
                fill={theme.colors.textSecondary}
                textAnchor="middle"
                fontWeight="500"
              >
                {day}
              </SvgText>
            );
          })}
        </Svg>
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
          <Text style={[styles.legendText, { color: theme.colors.text }]}>
            Income
          </Text>
        </View>
        
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: theme.colors.text }]}>
            Expenses
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    marginBottom: 20,
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
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  totalItem: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  chartContainer: {
    height: 200,
    marginBottom: 16,
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});