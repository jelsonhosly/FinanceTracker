import { View, Text, StyleSheet } from 'react-native';
import { Svg, G, Path, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';

interface ExpensePieChartProps {
  month?: number;
  year?: number;
  account?: string | null;
  category?: string | null;
}

export function ExpensePieChart({ month, year, account, category }: ExpensePieChartProps) {
  const { theme } = useTheme();
  const { transactions, categories, currencies, mainCurrencyCode, getExchangeRate } = useData();

  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Filter transactions for expenses only
  const expenseTransactions = transactions.filter(transaction => {
    // Filter by transaction type
    if (transaction.type !== 'expense') return false;
    
    // Filter by month and year if provided
    if (month !== undefined && year !== undefined) {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getMonth() + 1 !== month || transactionDate.getFullYear() !== year) {
        return false;
      }
    }
    
    // Filter by account if provided
    if (account) {
      if (transaction.accountId !== account && transaction.toAccountId !== account) {
        return false;
      }
    }
    
    // Filter by category if provided
    if (category) {
      if (transaction.category !== category && transaction.subcategory !== category) {
        return false;
      }
    }
    
    return true;
  });

  // Calculate category totals
  const categoryTotals: { [key: string]: number } = {};
  expenseTransactions.forEach(transaction => {
    const categoryName = transaction.category || 'Uncategorized';
    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = 0;
    }
    categoryTotals[categoryName] += transaction.amount;
  });

  // Prepare data for pie chart
  const pieData = Object.entries(categoryTotals).map(([categoryName, amount]) => {
    const categoryInfo = categories.find(c => c.name === categoryName) || {
      name: categoryName,
      color: '#8E8E93',
      type: 'expense',
      id: '0'
    };
    
    return {
      name: categoryName,
      amount,
      color: categoryInfo.color,
    };
  });

  // Sort by amount in descending order
  pieData.sort((a, b) => b.amount - a.amount);

  // Demo data if no transactions
  const demoData = [
    { name: 'Food', amount: 450, color: '#FF9F0A' },
    { name: 'Housing', amount: 850, color: '#0A84FF' },
    { name: 'Transport', amount: 220, color: '#5E5CE6' },
    { name: 'Entertainment', amount: 180, color: '#BF5AF2' },
    { name: 'Other', amount: 130, color: '#8E8E93' },
  ];

  const data = pieData.length > 0 ? pieData : demoData;
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Calculate pie chart segments
  const generatePieChart = () => {
    // Return empty array if total is 0 to prevent NaN calculations
    if (total === 0) {
      return [];
    }
    
    const radius = 80;
    const centerX = 100;
    const centerY = 100;
    
    let startAngle = 0;
    
    return data.map((item, index) => {
      const percentage = item.amount / total;
      const endAngle = startAngle + percentage * 2 * Math.PI;
      
      // Calculate the SVG path
      const x1 = centerX + radius * Math.cos(startAngle);
      const y1 = centerY + radius * Math.sin(startAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      // Create the arc path
      const largeArcFlag = percentage > 0.5 ? 1 : 0;
      const pathData = `M ${centerX},${centerY} L ${x1},${y1} A ${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
      
      // Calculate position for label
      const labelAngle = startAngle + (endAngle - startAngle) / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos(labelAngle);
      const labelY = centerY + labelRadius * Math.sin(labelAngle);
      
      const path = (
        <G key={index}>
          <Path d={pathData} fill={item.color} />
          {percentage > 0.08 && (
            <SvgText
              x={labelX}
              y={labelY}
              fontSize="12"
              fontWeight="bold"
              fill="white"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {isNaN(percentage) ? '0%' : `${Math.round(percentage * 100)}%`}
            </SvgText>
          )}
        </G>
      );
      
      startAngle = endAngle;
      return path;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg height="200" width="200" viewBox="0 0 200 200">
          {generatePieChart()}
          <Circle cx="100" cy="100" r="40" fill={theme.colors.card} />
          <SvgText
            x="100"
            y="95"
            fontSize="18"
            fontWeight="bold"
            fill={theme.colors.text}
            textAnchor="middle"
          >
            {mainCurrency?.symbol}{total.toFixed(0)}
          </SvgText>
          <SvgText
            x="100"
            y="115"
            fontSize="12"
            fill={theme.colors.textSecondary}
            textAnchor="middle"
          >
            Total
          </SvgText>
        </Svg>
      </View>
      
      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.legendAmount, { color: theme.colors.textSecondary }]}>
              {mainCurrency?.symbol}{item.amount.toFixed(0)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    marginBottom: 20,
  },
  legendContainer: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
});