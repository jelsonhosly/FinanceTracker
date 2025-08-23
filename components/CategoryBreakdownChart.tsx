import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Transaction, Category, Currency } from '@/types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface CategoryBreakdownChartProps {
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
}

export function CategoryBreakdownChart({ 
  transactions, 
  categories, 
  currencies, 
  mainCurrencyCode, 
  getExchangeRate 
}: CategoryBreakdownChartProps) {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  
  // Get main currency
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  // Calculate category totals
  const categoryTotals: { [key: string]: { amount: number; count: number; color: string } } = {};
  
  transactions
    .filter(t => t.type === selectedType)
    .forEach(transaction => {
      const categoryName = transaction.category || 'Uncategorized';
      const convertedAmount = transaction.amount * getExchangeRate(transaction.currency || mainCurrencyCode, mainCurrencyCode);
      
      if (!categoryTotals[categoryName]) {
        const categoryInfo = categories.find(c => c.name === categoryName);
        categoryTotals[categoryName] = {
          amount: 0,
          count: 0,
          color: categoryInfo?.color || '#8E8E93'
        };
      }
      
      categoryTotals[categoryName].amount += convertedAmount;
      categoryTotals[categoryName].count += 1;
    });

  // Convert to array and sort
  const categoryData = Object.entries(categoryTotals)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount);

  // Demo data if no transactions
  const demoExpenseData = [
    { name: 'Food & Dining', amount: 450, count: 12, color: '#FF9F0A' },
    { name: 'Housing', amount: 850, count: 3, color: '#0A84FF' },
    { name: 'Transportation', amount: 220, count: 8, color: '#5E5CE6' },
    { name: 'Entertainment', amount: 180, count: 6, color: '#BF5AF2' },
    { name: 'Shopping', amount: 130, count: 4, color: '#30D158' },
    { name: 'Healthcare', amount: 95, count: 2, color: '#FF375F' },
  ];

  const demoIncomeData = [
    { name: 'Salary', amount: 2000, count: 1, color: '#30D158' },
    { name: 'Freelance', amount: 450, count: 3, color: '#5E5CE6' },
    { name: 'Investments', amount: 320, count: 2, color: '#FF9F0A' },
    { name: 'Other', amount: 130, count: 1, color: '#8E8E93' },
  ];

  const data = categoryData.length > 0 
    ? categoryData 
    : selectedType === 'expense' 
      ? demoExpenseData 
      : demoIncomeData;

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const maxAmount = Math.max(...data.map(item => item.amount));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Category Analysis
          </Text>
        </View>
        
      </View>
      
      <View style={styles.chartTypeContainer}>
        
        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              { backgroundColor: theme.colors.background },
              selectedType === 'expense' && { backgroundColor: theme.colors.error, borderColor: theme.colors.error }
            ]}
            onPress={() => setSelectedType('expense')}
          >
            <TrendingUp size={16} color={selectedType === 'expense' ? 'white' : theme.colors.error} />
            <Text style={[
              styles.typeButtonText,
              { color: selectedType === 'expense' ? 'white' : theme.colors.error }
            ]}>
              Expenses
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.typeButton,
              { backgroundColor: theme.colors.background },
              selectedType === 'income' && { backgroundColor: theme.colors.success, borderColor: theme.colors.success }
            ]}
            onPress={() => setSelectedType('income')}
          >
            <TrendingDown size={16} color={selectedType === 'income' ? 'white' : theme.colors.success} />
            <Text style={[
              styles.typeButtonText,
              { color: selectedType === 'income' ? 'white' : theme.colors.success }
            ]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Bars */}
      <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
                {data.map((category, index) => {
                  const percentage = total > 0 ? (category.amount / total) * 100 : 0;
                  const barWidth = maxAmount > 0 ? (category.amount / maxAmount) * 100 : 0;
                  
                  return (
                    <View key={category.name} style={styles.categoryRow}>
                      <View style={styles.categoryHeader}>
                        <View style={styles.categoryInfo}>
                          <View style={[styles.categoryColorDot, { backgroundColor: category.color }]} />
                          <View style={styles.categoryTextInfo}>
                            <Text style={[styles.categoryName, { color: theme.colors.text }]}>
                              {category.name}
                            </Text>
                            <Text style={[styles.categoryCount, { color: theme.colors.textSecondary }]}>
                              {category.count} transaction{category.count !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.categoryAmountInfo}>
                          <Text style={[styles.categoryAmount, { color: theme.colors.text }]}>
                            {mainCurrency?.symbol}{category.amount.toFixed(0)}
                          </Text>
                          <Text style={[styles.categoryPercentage, { color: theme.colors.textSecondary }]}>
                            {percentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                      
                      {/* Animated Progress Bar */}
                      <View style={[styles.progressBarContainer, { backgroundColor: theme.colors.background }]}>
                        <View 
                          style={[
                            styles.progressBar, 
                            { 
                              backgroundColor: category.color,
                              width: `${Math.min(barWidth, 100)}%`
                            }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
                
                {data.length === 0 && (
                  <View style={styles.emptyState}>
                    <Minus size={48} color={theme.colors.textSecondary} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                      No {selectedType} data
                    </Text>
                    <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
                      No {selectedType} transactions found for the selected period
                    </Text>
                  </View>
                )}
              </ScrollView>

      {/* Summary Footer */}
      <View style={[styles.summaryFooter, { backgroundColor: theme.colors.background }]}>
        <View style={styles.summaryFooterItem}>
          <Text style={[styles.summaryFooterLabel, { color: theme.colors.textSecondary }]}>
            Total {selectedType === 'income' ? 'Income' : 'Expenses'}
          </Text>
          <Text style={[
            styles.summaryFooterValue, 
            { color: selectedType === 'income' ? theme.colors.success : theme.colors.error }
          ]}>
            {mainCurrency?.symbol}{total.toFixed(0)}
          </Text>
        </View>
        <View style={styles.summaryFooterItem}>
          <Text style={[styles.summaryFooterLabel, { color: theme.colors.textSecondary }]}>
            Categories
          </Text>
          <Text style={[styles.summaryFooterValue, { color: theme.colors.text }]}>
            {data.length}
          </Text>
        </View>
        <View style={styles.summaryFooterItem}>
          <Text style={[styles.summaryFooterLabel, { color: theme.colors.textSecondary }]}>
            Avg per Category
          </Text>
          <Text style={[styles.summaryFooterValue, { color: theme.colors.text }]}>
            {mainCurrency?.symbol}{data.length > 0 ? (total / data.length).toFixed(0) : '0'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  chartTypeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesContainer: {
    maxHeight: 400,
    overflow: 'hidden',
  },
  categoryRow: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  categoryTextInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  categoryAmountInfo: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
    minWidth: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  },
  summaryFooterItem: {
    alignItems: 'center',
  },
  summaryFooterLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  summaryFooterValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});