import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, G, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { Transaction, Category, Currency } from '@/types';

interface CashFlowChartProps {
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
}

const { width: screenWidth } = Dimensions.get('window');

export function CashFlowChart({ 
  transactions, 
  categories, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate 
}: CashFlowChartProps) {
  const { theme } = useTheme();
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Calculate category flows
  const incomeFlows: { [key: string]: { amount: number; color: string } } = {};
  const expenseFlows: { [key: string]: { amount: number; color: string } } = {};
  
  transactions.forEach(transaction => {
    const convertedAmount = transaction.amount * getExchangeRate(transaction.currency || mainCurrencyCode, mainCurrencyCode);
    const categoryName = transaction.category || 'Uncategorized';
    const categoryInfo = categories.find(c => c.name === categoryName);
    const color = categoryInfo?.color || '#8E8E93';
    
    if (transaction.type === 'income') {
      if (!incomeFlows[categoryName]) {
        incomeFlows[categoryName] = { amount: 0, color };
      }
      incomeFlows[categoryName].amount += convertedAmount;
    } else if (transaction.type === 'expense') {
      if (!expenseFlows[categoryName]) {
        expenseFlows[categoryName] = { amount: 0, color };
      }
      expenseFlows[categoryName].amount += convertedAmount;
    }
  });

  // Sort and limit to top 5 for better visualization
  const topIncomeFlows = Object.entries(incomeFlows)
    .sort(([,a], [,b]) => b.amount - a.amount)
    .slice(0, 5);
  
  const topExpenseFlows = Object.entries(expenseFlows)
    .sort(([,a], [,b]) => b.amount - a.amount)
    .slice(0, 5);

  // Demo data if no transactions
  const demoIncomeFlows = [
    ['Salary', { amount: 2000, color: '#30D158' }],
    ['Freelance', { amount: 450, color: '#5E5CE6' }],
    ['Investments', { amount: 320, color: '#FF9F0A' }],
  ];

  const demoExpenseFlows = [
    ['Food', { amount: 450, color: '#FF9F0A' }],
    ['Housing', { amount: 350, color: '#0A84FF' }],
    ['Transport', { amount: 220, color: '#5E5CE6' }],
    ['Entertainment', { amount: 180, color: '#BF5AF2' }],
  ];

  const incomeData = topIncomeFlows.length > 0 ? topIncomeFlows : demoIncomeFlows;
  const expenseData = topExpenseFlows.length > 0 ? topExpenseFlows : demoExpenseFlows;

  // Chart dimensions
  const chartWidth = screenWidth - 32;
  const chartHeight = 300;
  const centerX = chartWidth / 2;
  const centerY = chartHeight / 2;
  const flowWidth = 120;
  const categoryHeight = 40;

  // Calculate total amounts
  const totalIncome = incomeData.reduce((sum, [, data]) => sum + data.amount, 0);
  const totalExpenses = expenseData.reduce((sum, [, data]) => sum + data.amount, 0);
  const netFlow = totalIncome - totalExpenses;

  // Generate flow arrows
  const generateFlowArrows = () => {
    const arrows = [];
    
    // Income flows (left side)
    incomeData.forEach(([categoryName, data], index) => {
      const y = centerY - (incomeData.length * categoryHeight) / 2 + index * categoryHeight + categoryHeight / 2;
      const startX = 40;
      const endX = centerX - 60;
      
      // Flow line thickness based on amount
      const thickness = Math.max(2, (data.amount / totalIncome) * 20);
      
      // Arrow path
      const arrowPath = `M ${startX} ${y} L ${endX - 10} ${y} L ${endX - 15} ${y - 5} M ${endX - 10} ${y} L ${endX - 15} ${y + 5}`;
      
      arrows.push(
        <G key={`income-${index}`}>
          <Path
            d={`M ${startX} ${y} L ${endX} ${y}`}
            stroke={data.color}
            strokeWidth={thickness}
            opacity={0.7}
          />
          <Path
            d={arrowPath}
            stroke={data.color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </G>
      );
    });

    // Expense flows (right side)
    expenseData.forEach(([categoryName, data], index) => {
      const y = centerY - (expenseData.length * categoryHeight) / 2 + index * categoryHeight + categoryHeight / 2;
      const startX = centerX + 60;
      const endX = chartWidth - 40;
      
      // Flow line thickness based on amount
      const thickness = Math.max(2, (data.amount / totalExpenses) * 20);
      
      // Arrow path
      const arrowPath = `M ${startX} ${y} L ${endX - 10} ${y} L ${endX - 15} ${y - 5} M ${endX - 10} ${y} L ${endX - 15} ${y + 5}`;
      
      arrows.push(
        <G key={`expense-${index}`}>
          <Path
            d={`M ${startX} ${y} L ${endX} ${y}`}
            stroke={data.color}
            strokeWidth={thickness}
            opacity={0.7}
          />
          <Path
            d={arrowPath}
            stroke={data.color}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </G>
      );
    });

    return arrows;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Cash Flow Analysis
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Money in and out by category
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Defs>
            <LinearGradient id="centerBoxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="0.2" />
            </LinearGradient>
          </Defs>
          
          {/* Central balance box */}
          <G>
            <Circle 
              cx={centerX} 
              cy={centerY} 
              r="50" 
              fill="url(#centerBoxGradient)" 
              stroke={netFlow >= 0 ? theme.colors.success : theme.colors.error}
              strokeWidth="3"
            />
            <SvgText
              x={centerX}
              y={centerY - 8}
              fontSize="16"
              fontWeight="bold"
              fill={theme.colors.text}
              textAnchor="middle"
            >
              {netFlow >= 0 ? '+' : ''}{mainCurrency?.symbol}{netFlow.toFixed(0)}
            </SvgText>
            <SvgText
              x={centerX}
              y={centerY + 12}
              fontSize="10"
              fill={theme.colors.textSecondary}
              textAnchor="middle"
            >
              Net Flow
            </SvgText>
          </G>
          
          {/* Flow arrows */}
          {generateFlowArrows()}
          
          {/* Income categories (left side) */}
          {incomeData.map(([categoryName, data], index) => {
            const y = centerY - (incomeData.length * categoryHeight) / 2 + index * categoryHeight;
            
            return (
              <G key={`income-label-${index}`}>
                <Circle cx="20" cy={y + categoryHeight / 2} r="8" fill={data.color} />
                <SvgText
                  x="35"
                  y={y + categoryHeight / 2 - 5}
                  fontSize="11"
                  fontWeight="600"
                  fill={theme.colors.text}
                >
                  {categoryName}
                </SvgText>
                <SvgText
                  x="35"
                  y={y + categoryHeight / 2 + 8}
                  fontSize="10"
                  fill={theme.colors.textSecondary}
                >
                  {mainCurrency?.symbol}{data.amount.toFixed(0)}
                </SvgText>
              </G>
            );
          })}
          
          {/* Expense categories (right side) */}
          {expenseData.map(([categoryName, data], index) => {
            const y = centerY - (expenseData.length * categoryHeight) / 2 + index * categoryHeight;
            
            return (
              <G key={`expense-label-${index}`}>
                <Circle cx={chartWidth - 20} cy={y + categoryHeight / 2} r="8" fill={data.color} />
                <SvgText
                  x={chartWidth - 35}
                  y={y + categoryHeight / 2 - 5}
                  fontSize="11"
                  fontWeight="600"
                  fill={theme.colors.text}
                  textAnchor="end"
                >
                  {categoryName}
                </SvgText>
                <SvgText
                  x={chartWidth - 35}
                  y={y + categoryHeight / 2 + 8}
                  fontSize="10"
                  fill={theme.colors.textSecondary}
                  textAnchor="end"
                >
                  {mainCurrency?.symbol}{data.amount.toFixed(0)}
                </SvgText>
              </G>
            );
          })}
          
          {/* Labels */}
          <SvgText
            x="20"
            y="30"
            fontSize="14"
            fontWeight="bold"
            fill={theme.colors.success}
            textAnchor="start"
          >
            Income Sources
          </SvgText>
          
          <SvgText
            x={chartWidth - 20}
            y="30"
            fontSize="14"
            fontWeight="bold"
            fill={theme.colors.error}
            textAnchor="end"
          >
            Expense Categories
          </SvgText>
        </Svg>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Money In
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.success }]}>
            {mainCurrency?.symbol}{totalIncome.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Money Out
          </Text>
          <Text style={[styles.summaryValue, { color: theme.colors.error }]}>
            {mainCurrency?.symbol}{totalExpenses.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
            Net Flow
          </Text>
          <Text style={[
            styles.summaryValue, 
            { color: netFlow >= 0 ? theme.colors.success : theme.colors.error }
          ]}>
            {netFlow >= 0 ? '+' : ''}{mainCurrency?.symbol}{netFlow.toFixed(0)}
          </Text>
        </View>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});