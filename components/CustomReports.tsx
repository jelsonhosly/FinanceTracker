import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Transaction, Account, Category, Currency } from '@/types';
import { ChartBar as BarChart3, ChartPie as PieChart, TrendingUp, Calendar, Target, DollarSign, Check } from 'lucide-react-native';
import { CustomMetricsChart } from '@/components/CustomMetricsChart';

interface CustomReportsProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  getExchangeRate: (from: string, to: string) => number;
  filters: any;
}

export function CustomReports({
  transactions,
  accounts,
  categories,
  currencies,
  mainCurrencyCode,
  getExchangeRate,
  filters,
}: CustomReportsProps) {
  const { theme } = useTheme();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['income', 'expenses']);
  const [selectedChartType, setSelectedChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [selectedGroupBy, setSelectedGroupBy] = useState<'day' | 'week' | 'month'>('month');

  const metricOptions = [
    { id: 'income', title: 'Income', icon: TrendingUp, color: '#22C55E' },
    { id: 'expenses', title: 'Expenses', icon: TrendingUp, color: '#EF4444' },
    { id: 'net', title: 'Net Balance', icon: DollarSign, color: '#7C3AED' },
    { id: 'transactions', title: 'Transaction Count', icon: Target, color: '#3B82F6' },
  ];

  const chartTypeOptions = [
    { id: 'line', title: 'Line Chart', icon: TrendingUp },
    { id: 'bar', title: 'Bar Chart', icon: BarChart3 },
    { id: 'pie', title: 'Pie Chart', icon: PieChart },
  ];

  const groupByOptions = [
    { id: 'day', title: 'Daily' },
    { id: 'week', title: 'Weekly' },
    { id: 'month', title: 'Monthly' },
  ];

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(id => id !== metricId)
        : [...prev, metricId]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentPadding}
      >
        {/* Configuration Panel */}
        <View style={[styles.configPanel, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.configTitle, { color: theme.colors.text }]}>
            Customize Your Report
          </Text>

          {/* Metrics Selection */}
          <View style={styles.configSection}>
            <Text style={[styles.configSectionTitle, { color: theme.colors.textSecondary }]}>
              Select Metrics
            </Text>
            <View style={styles.metricsGrid}>
              {metricOptions.map((metric) => {
                const IconComponent = metric.icon;
                const isSelected = selectedMetrics.includes(metric.id);
                
                return (
                  <TouchableOpacity
                    key={metric.id}
                    style={[
                      styles.metricOption,
                      { backgroundColor: theme.colors.background },
                      isSelected && { backgroundColor: metric.color + '20', borderColor: metric.color }
                    ]}
                    onPress={() => toggleMetric(metric.id)}
                  >
                    <View style={[styles.metricIconContainer, { backgroundColor: metric.color + '20' }]}>
                      <IconComponent size={16} color={metric.color} />
                    </View>
                    <Text style={[
                      styles.metricOptionText,
                      { color: isSelected ? metric.color : theme.colors.text }
                    ]}>
                      {metric.title}
                    </Text>
                    {isSelected && (
                      <Check size={16} color={metric.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Chart Type Selection */}
          <View style={styles.configSection}>
            <Text style={[styles.configSectionTitle, { color: theme.colors.textSecondary }]}>
              Chart Type
            </Text>
            <View style={styles.chartTypeGrid}>
              {chartTypeOptions.map((chartType) => {
                const IconComponent = chartType.icon;
                const isSelected = selectedChartType === chartType.id;
                
                return (
                  <TouchableOpacity
                    key={chartType.id}
                    style={[
                      styles.chartTypeOption,
                      { backgroundColor: theme.colors.background },
                      isSelected && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
                    ]}
                    onPress={() => setSelectedChartType(chartType.id as any)}
                  >
                    <IconComponent 
                      size={20} 
                      color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.chartTypeOptionText,
                      { color: isSelected ? theme.colors.primary : theme.colors.text }
                    ]}>
                      {chartType.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Group By Selection */}
          <View style={styles.configSection}>
            <Text style={[styles.configSectionTitle, { color: theme.colors.textSecondary }]}>
              Group By
            </Text>
            <View style={styles.groupByGrid}>
              {groupByOptions.map((groupBy) => {
                const isSelected = selectedGroupBy === groupBy.id;
                
                return (
                  <TouchableOpacity
                    key={groupBy.id}
                    style={[
                      styles.groupByOption,
                      { backgroundColor: theme.colors.background },
                      isSelected && { backgroundColor: theme.colors.secondary + '20', borderColor: theme.colors.secondary }
                    ]}
                    onPress={() => setSelectedGroupBy(groupBy.id as any)}
                  >
                    <Calendar 
                      size={16} 
                      color={isSelected ? theme.colors.secondary : theme.colors.textSecondary} 
                    />
                    <Text style={[
                      styles.groupByOptionText,
                      { color: isSelected ? theme.colors.secondary : theme.colors.text }
                    ]}>
                      {groupBy.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Custom Chart */}
        <CustomMetricsChart 
          transactions={transactions}
          currencies={currencies}
          mainCurrencyCode={mainCurrencyCode}
          getExchangeRate={getExchangeRate}
          selectedMetrics={selectedMetrics}
          chartType={selectedChartType}
          groupBy={selectedGroupBy}
          dateRange={{ startDate: filters.startDate, endDate: filters.endDate }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: 100,
  },
  configPanel: {
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  configTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  configSection: {
    marginBottom: 24,
  },
  configSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricsGrid: {
    gap: 12,
  },
  metricOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  metricIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  metricOptionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  chartTypeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  chartTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  chartTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  groupByGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  groupByOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  groupByOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});