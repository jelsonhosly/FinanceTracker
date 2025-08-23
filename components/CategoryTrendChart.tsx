import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Svg, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Transaction, Category, Currency } from '@/types';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface CategoryTrendChartProps {
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
}

const { width: screenWidth } = Dimensions.get('window');

export function CategoryTrendChart({ 
  transactions, 
  categories, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate 
}: CategoryTrendChartProps) {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Calculate monthly trends for each category (last 6 months)
  const getMonthlyTrends = () => {
    const trends: { [category: string]: { [month: string]: number } } = {};
    const months: string[] = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString(undefined, { month: 'short' });
      months.push(monthKey);
    }
    
    // Calculate category totals for each month
    transactions
      .filter(t => t.type === 'expense')
      .forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const monthKey = transactionDate.toLocaleDateString(undefined, { month: 'short' });
        
        if (months.includes(monthKey)) {
          const categoryName = transaction.category || 'Uncategorized';
          const convertedAmount = transaction.amount * getExchangeRate(transaction.currency || mainCurrencyCode, mainCurrencyCode);
          
          if (!trends[categoryName]) {
            trends[categoryName] = {};
            months.forEach(month => {
              trends[categoryName][month] = 0;
            });
          }
          
          trends[categoryName][monthKey] += convertedAmount;
        }
      });

    return { trends, months };
  };

  const { trends, months } = getMonthlyTrends();

  // Get top categories by total amount
  const topCategories = Object.entries(trends)
    .map(([categoryName, monthlyData]) => {
      const total = Object.values(monthlyData).reduce((sum, amount) => sum + amount, 0);
      const categoryInfo = categories.find(c => c.name === categoryName);
      return {
        name: categoryName,
        total,
        color: categoryInfo?.color || '#8E8E93',
        monthlyData,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  // Demo data if no transactions
  const demoCategories = [
    {
      name: 'Food',
      total: 1200,
      color: '#FF9F0A',
      monthlyData: { 'Aug': 180, 'Sep': 220, 'Oct': 200, 'Nov': 240, 'Dec': 180, 'Jan': 180 },
    },
    {
      name: 'Housing',
      total: 2100,
      color: '#0A84FF',
      monthlyData: { 'Aug': 350, 'Sep': 350, 'Oct': 350, 'Nov': 350, 'Dec': 350, 'Jan': 350 },
    },
    {
      name: 'Transport',
      total: 800,
      color: '#5E5CE6',
      monthlyData: { 'Aug': 120, 'Sep': 140, 'Oct': 130, 'Nov': 160, 'Dec': 120, 'Jan': 130 },
    },
  ];

  const categoryData = topCategories.length > 0 ? topCategories : demoCategories;
  const maxValue = Math.max(...categoryData.flatMap(cat => Object.values(cat.monthlyData)));

  // Chart dimensions
  const chartWidth = screenWidth - 72;
  const chartHeight = 200;
  const padding = 20;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  // Create smooth path for category
  const createCategoryPath = (monthlyData: { [month: string]: number }) => {
    const values = months.map(month => monthlyData[month] || 0);
    
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Category Trends
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          6-month spending patterns
        </Text>
      </View>

      {/* Category Selector */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categorySelector}
        contentContainerStyle={styles.categorySelectorContent}
      >
        {categoryData.map((category) => {
          const isSelected = selectedCategory === category.name;
          
          return (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.categoryChip,
                { backgroundColor: theme.colors.background },
                isSelected && { backgroundColor: category.color + '20', borderColor: category.color }
              ]}
              onPress={() => setSelectedCategory(isSelected ? null : category.name)}
            >
              <View style={[styles.categoryChipDot, { backgroundColor: category.color }]} />
              <Text style={[
                styles.categoryChipText,
                { color: isSelected ? category.color : theme.colors.text }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          <Defs>
            {categoryData.map((category, index) => (
              <LinearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={category.color} stopOpacity="0.3" />
                <Stop offset="100%" stopColor={category.color} stopOpacity="0.05" />
              </LinearGradient>
            ))}
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
          
          {/* Category lines */}
          {categoryData.map((category, index) => {
            const isHighlighted = selectedCategory === category.name || selectedCategory === null;
            const opacity = isHighlighted ? 1 : 0.3;
            const strokeWidth = isHighlighted ? 3 : 2;
            
            const path = createCategoryPath(category.monthlyData);
            
            return (
              <G key={index} opacity={opacity}>
                {/* Area fill */}
                <Path
                  d={`${path} L ${padding + innerWidth} ${padding + innerHeight} L ${padding} ${padding + innerHeight} Z`}
                  fill={`url(#gradient-${index})`}
                />
                {/* Line */}
                <Path
                  d={path}
                  stroke={category.color}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data points */}
                {months.map((month, monthIndex) => {
                  const value = category.monthlyData[month] || 0;
                  const x = padding + (monthIndex / (months.length - 1)) * innerWidth;
                  const y = padding + innerHeight - (value / maxValue) * innerHeight;
                  
                  return (
                    <Circle
                      key={`${index}-${monthIndex}`}
                      cx={x}
                      cy={y}
                      r={isHighlighted ? "4" : "2"}
                      fill={category.color}
                    />
                  );
                })}
              </G>
            );
          })}

          {/* X-axis labels */}
          {months.map((month, index) => {
            const x = padding + (index / (months.length - 1)) * innerWidth;
            
            return (
              <SvgText
                key={`month-${index}`}
                x={x}
                y={chartHeight - 5}
                fontSize="11"
                fill={theme.colors.textSecondary}
                textAnchor="middle"
                fontWeight="500"
              >
                {month}
              </SvgText>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legendContainer}>
        {categoryData.map((category, index) => {
          const isSelected = selectedCategory === category.name;
          const currentMonth = category.monthlyData[months[months.length - 1]] || 0;
          const previousMonth = category.monthlyData[months[months.length - 2]] || 0;
          const change = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.legendItem,
                { backgroundColor: theme.colors.background },
                isSelected && { backgroundColor: category.color + '15', borderColor: category.color }
              ]}
              onPress={() => setSelectedCategory(isSelected ? null : category.name)}
            >
              <View style={styles.legendLeft}>
                <View style={[styles.legendColor, { backgroundColor: category.color }]} />
                <View style={styles.legendText}>
                  <Text style={[
                    styles.legendName, 
                    { color: isSelected ? category.color : theme.colors.text }
                  ]}>
                    {category.name}
                  </Text>
                  <View style={styles.legendTrend}>
                    {change > 0 ? (
                      <TrendingUp size={12} color={theme.colors.error} />
                    ) : change < 0 ? (
                      <TrendingDown size={12} color={theme.colors.success} />
                    ) : null}
                    <Text style={[
                      styles.legendChange, 
                      { color: change > 0 ? theme.colors.error : change < 0 ? theme.colors.success : theme.colors.textSecondary }
                    ]}>
                      {change !== 0 ? `${change > 0 ? '+' : ''}${change.toFixed(0)}%` : 'No change'}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={[
                styles.legendAmount, 
                { color: isSelected ? category.color : theme.colors.text }
              ]}>
                {mainCurrency?.symbol}{category.total.toFixed(0)}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  categorySelector: {
    maxHeight: 50,
    marginBottom: 20,
  },
  categorySelectorContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
    width: 12,
    height: 12,
    borderRadius: 6,
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
  legendTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  legendAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});