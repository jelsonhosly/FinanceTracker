import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Transaction, Account, Category, Currency } from '@/types';
import { CategoryBreakdownChart } from '@/components/CategoryBreakdownChart';
import { DrillDownPieChart } from '@/components/DrillDownPieChart';
import { CategoryTrendChart } from '@/components/CategoryTrendChart';
import { TrendingUp, ChartPie as PieChart, ChartBar as BarChart3 } from 'lucide-react-native';

interface ReportsByCategoryProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  filters: any;
}

export function ReportsByCategory({
  transactions,
  accounts,
  categories,
  currencies,
  mainCurrencyCode,
  getExchangeRate,
  filters,
}: ReportsByCategoryProps) {
  const { theme } = useTheme();
  const [selectedView, setSelectedView] = useState<'breakdown' | 'drilldown' | 'trends'>('drilldown');

  const viewOptions = [
    { id: 'drilldown', title: 'Drill-Down', icon: PieChart },
    { id: 'breakdown', title: 'Breakdown', icon: BarChart3 },
    { id: 'trends', title: 'Trends', icon: TrendingUp },
  ];

  const renderContent = () => {
    switch (selectedView) {
      case 'breakdown':
        return (
          <CategoryBreakdownChart 
            transactions={transactions}
            categories={categories}
            currencies={currencies}
            mainCurrencyCode={mainCurrencyCode}
            getExchangeRate={getExchangeRate}
          />
        );
      case 'drilldown':
        return (
          <DrillDownPieChart 
            transactions={transactions}
            categories={categories}
            currencies={currencies}
            mainCurrencyCode={mainCurrencyCode}
            getExchangeRate={getExchangeRate}
          />
        );
      case 'trends':
        return (
          <CategoryTrendChart 
            transactions={transactions}
            categories={categories}
            currencies={currencies}
            mainCurrencyCode={mainCurrencyCode}
            getExchangeRate={getExchangeRate}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* View Selector */}
      <View style={styles.viewSelector}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.viewScrollContent}
        >
          {viewOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = selectedView === option.id;
            
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.viewOption,
                  { backgroundColor: theme.colors.card },
                  isSelected && { backgroundColor: theme.colors.primary }
                ]}
                onPress={() => setSelectedView(option.id as any)}
              >
                <IconComponent 
                  size={18} 
                  color={isSelected ? 'white' : theme.colors.primary} 
                />
                <Text style={[
                  styles.viewOptionText,
                  { color: isSelected ? 'white' : theme.colors.text }
                ]}>
                  {option.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentPadding}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  viewSelector: {
    marginBottom: 16,
  },
  viewScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  viewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: 100,
  },
});