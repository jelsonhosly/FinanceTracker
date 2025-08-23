import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Svg, G, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Transaction, Category, Currency } from '@/types';

interface InteractiveSpendingChartProps {
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  hideSmallAmounts?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export function InteractiveSpendingChart({ 
  transactions, 
  categories, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate,
  hideSmallAmounts = false 
}: InteractiveSpendingChartProps) {
  const { theme } = useTheme();
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Calculate category totals for expenses only
  const categoryTotals: { [key: string]: number } = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const categoryName = transaction.category || 'Uncategorized';
      const convertedAmount = transaction.amount * getExchangeRate(transaction.currency || mainCurrencyCode, mainCurrencyCode);
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + convertedAmount;
    });

  // Prepare data for pie chart
  let pieData = Object.entries(categoryTotals).map(([categoryName, amount]) => {
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
      percentage: 0, // Will be calculated below
    };
  });

  // Sort by amount and calculate percentages
  pieData.sort((a, b) => b.amount - a.amount);
  const total = pieData.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate percentages and filter small amounts if needed
  pieData = pieData.map(item => ({
    ...item,
    percentage: total > 0 ? (item.amount / total) * 100 : 0
  }));

  if (hideSmallAmounts) {
    const significantData = pieData.filter(item => item.percentage >= 5);
    const smallAmountsTotal = pieData
      .filter(item => item.percentage < 5)
      .reduce((sum, item) => sum + item.amount, 0);
    
    if (smallAmountsTotal > 0) {
      significantData.push({
        name: 'Other',
        amount: smallAmountsTotal,
        color: '#8E8E93',
        percentage: (smallAmountsTotal / total) * 100
      });
    }
    
    pieData = significantData;
  }

  // Demo data if no transactions
  const demoData = [
    { name: 'Food & Dining', amount: 450, color: '#FF9F0A', percentage: 32.1 },
    { name: 'Housing', amount: 350, color: '#0A84FF', percentage: 25.0 },
    { name: 'Transportation', amount: 220, color: '#5E5CE6', percentage: 15.7 },
    { name: 'Entertainment', amount: 180, color: '#BF5AF2', percentage: 12.9 },
    { name: 'Shopping', amount: 130, color: '#30D158', percentage: 9.3 },
    { name: 'Other', amount: 70, color: '#8E8E93', percentage: 5.0 },
  ];

  const data = pieData.length > 0 ? pieData : demoData;
  const displayTotal = data.reduce((sum, item) => sum + item.amount, 0);

  // Chart dimensions
  const chartSize = Math.min(screenWidth - 80, 280);
  const radius = chartSize / 2 - 40;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  // Generate interactive pie chart
  const generateInteractivePieChart = () => {
    if (displayTotal === 0) return [];
    
    let startAngle = -Math.PI / 2; // Start from top
    
    return data.map((item, index) => {
      const percentage = item.amount / displayTotal;
      const endAngle = startAngle + percentage * 2 * Math.PI;
      
      // Calculate the SVG path with hover effect
      const isSelected = selectedSegment === item.name || hoveredSegment === item.name;
      const currentRadius = isSelected ? radius + 10 : radius;
      
      const x1 = centerX + currentRadius * Math.cos(startAngle);
      const y1 = centerY + currentRadius * Math.sin(startAngle);
      const x2 = centerX + currentRadius * Math.cos(endAngle);
      const y2 = centerY + currentRadius * Math.sin(endAngle);
      
      const largeArcFlag = percentage > 0.5 ? 1 : 0;
      const pathData = `M ${centerX},${centerY} L ${x1},${y1} A ${currentRadius},${currentRadius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
      
      // Calculate label position
      const labelAngle = startAngle + (endAngle - startAngle) / 2;
      const labelRadius = currentRadius * 0.75;
      const labelX = centerX + labelRadius * Math.cos(labelAngle);
      const labelY = centerY + labelRadius * Math.sin(labelAngle);
      
      const segment = (
        <G key={index}>
          <Path 
            d={pathData} 
            fill={item.color}
            opacity={isSelected ? 1 : 0.9}
            onPress={() => {
              setSelectedSegment(selectedSegment === item.name ? null : item.name);
            }}
          />
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
              {item.percentage.toFixed(0)}%
            </SvgText>
          )}
        </G>
      );
      
      startAngle = endAngle;
      return segment;
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Spending Breakdown
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Tap segments to explore
          </Text>
        </View>
        
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
                  <Defs>
                    <LinearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.1" />
                      <Stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="0.1" />
                    </LinearGradient>
                  </Defs>
                  
                  {generateInteractivePieChart()}
                  
                  {/* Center circle with total */}
                  <Circle cx={centerX} cy={centerY} r="50" fill="url(#centerGradient)" />
                  <Circle cx={centerX} cy={centerY} r="50" fill={theme.colors.card} opacity="0.9" />
                  
                  <SvgText
                    x={centerX}
                    y={centerY - 8}
                    fontSize="20"
                    fontWeight="bold"
                    fill={theme.colors.text}
                    textAnchor="middle"
                  >
                    {mainCurrency?.symbol}{displayTotal.toFixed(0)}
                  </SvgText>
                  <SvgText
                    x={centerX}
                    y={centerY + 12}
                    fontSize="12"
                    fill={theme.colors.textSecondary}
                    textAnchor="middle"
                  >
                    Total Spent
                  </SvgText>
                </Svg>
      </View>
      
      {/* Interactive Legend */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => {
          const isSelected = selectedSegment === item.name;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.legendItem,
                { backgroundColor: theme.colors.background },
                isSelected && { 
                  backgroundColor: item.color + '20',
                  borderColor: item.color,
                  borderWidth: 2,
                  transform: [{ scale: 1.02 }]
                }
              ]}
              onPress={() => setSelectedSegment(selectedSegment === item.name ? null : item.name)}
            >
              <View style={styles.legendLeft}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <View style={styles.legendText}>
                  <Text style={[
                    styles.legendName, 
                    { color: isSelected ? item.color : theme.colors.text }
                  ]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.legendPercentage, { color: theme.colors.textSecondary }]}>
                    {item.percentage.toFixed(1)}% of spending
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.legendAmount, 
                { color: isSelected ? item.color : theme.colors.text }
              ]}>
                {mainCurrency?.symbol}{item.amount.toFixed(0)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Category Details */}
      {selectedSegment && (
        <View style={[styles.detailsCard, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.detailsTitle, { color: theme.colors.text }]}>
            {selectedSegment} Details
          </Text>
          <View style={styles.detailsContent}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Total Spent
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {mainCurrency?.symbol}{data.find(d => d.name === selectedSegment)?.amount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Percentage
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {data.find(d => d.name === selectedSegment)?.percentage.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                Transactions
              </Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {transactions.filter(t => t.type === 'expense' && t.category === selectedSegment).length}
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
    marginBottom: 24,
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  legendText: {
    flex: 1,
  },
  legendName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  legendPercentage: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  detailsCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  detailsContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});