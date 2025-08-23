import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Svg, G, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Transaction, Category, Currency } from '@/types';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';

interface DrillDownPieChartProps {
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
}

const { width: screenWidth } = Dimensions.get('window');

export function DrillDownPieChart({ 
  transactions, 
  categories, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate 
}: DrillDownPieChartProps) {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [drillLevel, setDrillLevel] = useState<'categories' | 'subcategories'>('categories');
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Calculate category totals for expenses
  const categoryTotals: { [key: string]: number } = {};
  const subcategoryTotals: { [key: string]: { amount: number; parentCategory: string; color: string } } = {};
  
  transactions
    .filter(t => t.type === 'expense')
    .forEach(transaction => {
      const categoryName = transaction.category || 'Uncategorized';
      const convertedAmount = transaction.amount * getExchangeRate(transaction.currency || mainCurrencyCode, mainCurrencyCode);
      
      // Category totals
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + convertedAmount;
      
      // Subcategory totals
      if (transaction.subcategory) {
        const subcategoryKey = `${categoryName}:${transaction.subcategory}`;
        if (!subcategoryTotals[subcategoryKey]) {
          const category = categories.find(c => c.name === categoryName);
          const subcategory = category?.subcategories?.find(sub => sub.name === transaction.subcategory);
          subcategoryTotals[subcategoryKey] = {
            amount: 0,
            parentCategory: categoryName,
            color: subcategory?.color || category?.color || '#8E8E93'
          };
        }
        subcategoryTotals[subcategoryKey].amount += convertedAmount;
      }
    });

  // Prepare data based on drill level
  const getCurrentData = () => {
    if (drillLevel === 'subcategories' && selectedCategory) {
      // Show subcategories for selected category
      const subcategoryData = Object.entries(subcategoryTotals)
        .filter(([key, data]) => data.parentCategory === selectedCategory)
        .map(([key, data]) => {
          const subcategoryName = key.split(':')[1];
          return {
            name: subcategoryName,
            amount: data.amount,
            color: data.color,
          };
        });
      
      // Add "General" category for transactions without subcategory
      const generalAmount = categoryTotals[selectedCategory] - subcategoryData.reduce((sum, item) => sum + item.amount, 0);
      if (generalAmount > 0) {
        const categoryInfo = categories.find(c => c.name === selectedCategory);
        subcategoryData.unshift({
          name: 'General',
          amount: generalAmount,
          color: categoryInfo?.color || '#8E8E93',
        });
      }
      
      return subcategoryData.sort((a, b) => b.amount - a.amount);
    } else {
      // Show main categories
      return Object.entries(categoryTotals).map(([categoryName, amount]) => {
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
      }).sort((a, b) => b.amount - a.amount);
    }
  };

  const data = getCurrentData();
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  // Demo data if no transactions
  const demoData = [
    { name: 'Food & Dining', amount: 450, color: '#FF9F0A' },
    { name: 'Housing', amount: 350, color: '#0A84FF' },
    { name: 'Transportation', amount: 220, color: '#5E5CE6' },
    { name: 'Entertainment', amount: 180, color: '#BF5AF2' },
    { name: 'Shopping', amount: 130, color: '#30D158' },
  ];

  const displayData = data.length > 0 ? data : demoData;
  const displayTotal = displayData.reduce((sum, item) => sum + item.amount, 0);

  // Chart dimensions
  const chartSize = Math.min(screenWidth - 80, 300);
  const radius = chartSize / 2 - 60;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  // Generate pie chart with drill-down capability
  const generatePieChart = () => {
    if (displayTotal === 0) return [];
    
    let startAngle = -Math.PI / 2; // Start from top
    
    return displayData.map((item, index) => {
      const percentage = item.amount / displayTotal;
      const endAngle = startAngle + percentage * 2 * Math.PI;
      
      // Calculate the SVG path with hover effect
      const currentRadius = radius;
      
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
            opacity={0.9}
            onPress={() => {
              if (drillLevel === 'categories' && selectedCategory !== item.name) {
                // Check if this category has subcategories
                const categoryInfo = categories.find(c => c.name === item.name);
                if (categoryInfo?.subcategories && categoryInfo.subcategories.length > 0) {
                  setSelectedCategory(item.name);
                  setDrillLevel('subcategories');
                }
              }
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
              {(percentage * 100).toFixed(0)}%
            </SvgText>
          )}
        </G>
      );
      
      startAngle = endAngle;
      return segment;
    });
  };

  const handleBackToCategories = () => {
    setDrillLevel('categories');
    setSelectedCategory(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      {/* Header with Breadcrumb */}
      <View style={styles.header}>
        <View style={styles.breadcrumb}>
          <TouchableOpacity 
            style={styles.breadcrumbItem}
            onPress={handleBackToCategories}
            disabled={drillLevel === 'categories'}
          >
            <Text style={[
              styles.breadcrumbText,
              { color: drillLevel === 'categories' ? theme.colors.text : theme.colors.primary }
            ]}>
              Categories
            </Text>
          </TouchableOpacity>
          
          {drillLevel === 'subcategories' && (
            <>
              <ChevronRight size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.breadcrumbText, { color: theme.colors.text }]}>
                {selectedCategory}
              </Text>
            </>
          )}
        </View>
        
        {drillLevel === 'subcategories' && (
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.colors.background }]}
            onPress={handleBackToCategories}
          >
            <ArrowLeft size={16} color={theme.colors.primary} />
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              Back
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize} viewBox={`0 0 ${chartSize} ${chartSize}`}>
          <Defs>
            <LinearGradient id="centerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={theme.colors.primary} stopOpacity="0.1" />
              <Stop offset="100%" stopColor={theme.colors.secondary} stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          
          {generatePieChart()}
          
          {/* Center circle with total */}
          <Circle cx={centerX} cy={centerY} r="60" fill="url(#centerGradient)" />
          <Circle cx={centerX} cy={centerY} r="60" fill={theme.colors.card} opacity="0.95" />
          
          <SvgText
            x={centerX}
            y={centerY - 10}
            fontSize="20"
            fontWeight="bold"
            fill={theme.colors.text}
            textAnchor="middle"
          >
            {mainCurrency?.symbol}{displayTotal.toFixed(0)}
          </SvgText>
          <SvgText
            x={centerX}
            y={centerY + 15}
            fontSize="12"
            fill={theme.colors.textSecondary}
            textAnchor="middle"
          >
            {drillLevel === 'categories' ? 'Total Expenses' : selectedCategory}
          </SvgText>
        </Svg>
      </View>
      
      {/* Interactive Legend */}
      <View style={styles.legendContainer}>
        {displayData.map((item, index) => {
          const percentage = displayTotal > 0 ? (item.amount / displayTotal) * 100 : 0;
          const canDrillDown = drillLevel === 'categories' && 
            categories.find(c => c.name === item.name)?.subcategories?.length > 0;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.legendItem,
                { backgroundColor: theme.colors.background },
                canDrillDown && { borderColor: theme.colors.primary + '50', borderWidth: 1 }
              ]}
              onPress={() => {
                if (canDrillDown) {
                  setSelectedCategory(item.name);
                  setDrillLevel('subcategories');
                }
              }}
              disabled={!canDrillDown}
            >
              <View style={styles.legendLeft}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <View style={styles.legendText}>
                  <Text style={[styles.legendName, { color: theme.colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.legendPercentage, { color: theme.colors.textSecondary }]}>
                    {percentage.toFixed(1)}% of total
                  </Text>
                </View>
              </View>
              <View style={styles.legendRight}>
                <Text style={[styles.legendAmount, { color: theme.colors.text }]}>
                  {mainCurrency?.symbol}{item.amount.toFixed(0)}
                </Text>
                {canDrillDown && (
                  <ChevronRight size={16} color={theme.colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Drill-down hint */}
      {drillLevel === 'categories' && (
        <View style={styles.hintContainer}>
          <Text style={[styles.hintText, { color: theme.colors.textSecondary }]}>
            Tap categories with subcategories to drill down
          </Text>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbItem: {
    // No additional styles needed
  },
  breadcrumbText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  hintContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});