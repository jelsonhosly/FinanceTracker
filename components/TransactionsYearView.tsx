import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
  currentYear: number;
  onSelectMonth: (year: number, monthIndex: number) => void; // monthIndex: 0-11
}

const monthNames = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function TransactionsYearView({ transactions, currentYear, onSelectMonth }: Props) {
  const { theme } = useTheme();

  const dataByYear = useMemo(() => {
    const map: Record<number, { month: number; count: number }[]> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      const y = d.getFullYear();
      const m = d.getMonth();
      map[y] = map[y] || Array.from({ length: 12 }, (_, i) => ({ month: i, count: 0 }));
      map[y][m].count += 1;
    });
    // ensure currentYear at least exists
    if (!map[currentYear]) {
      map[currentYear] = Array.from({ length: 12 }, (_, i) => ({ month: i, count: 0 }));
    }
    // sort years desc
    const years = Object.keys(map).map(y => parseInt(y, 10)).sort((a, b) => b - a);
    return { years, map };
  }, [transactions, currentYear]);

  const intensity = (count: number, max: number) => {
    if (max <= 0) return theme.colors.card;
    const ratio = Math.min(1, count / max);
    const base = theme.colors.primary.replace('#', '');
    // fallback color overlay using opacity
    return `${theme.colors.primary}${Math.max(0.12, ratio * 0.4).toFixed(2).replace('.', '')}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {dataByYear.years.map(year => {
        const months = dataByYear.map[year];
        const max = Math.max(...months.map(m => m.count));
        return (
          <View key={year} style={styles.yearBlock}>
            <View style={[styles.yearHeader, { backgroundColor: theme.colors.card }]}> 
              <Text style={[styles.yearTitle, { color: theme.colors.text }]}>{year}</Text>
            </View>
            <View style={styles.monthGrid}>
              {months.map(({ month, count }) => (
                <TouchableOpacity
                  key={`${year}-${month}`}
                  style={[styles.monthCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                  onPress={() => onSelectMonth(year, month)}
                >
                  <View style={[styles.intensityBar, { backgroundColor: intensity(count, max) }]} />
                  <Text style={[styles.monthName, { color: theme.colors.text }]}>
                    {monthNames[month]}
                  </Text>
                  <Text style={[styles.monthCount, { color: theme.colors.textSecondary }]}>
                    {count} transactions
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 16,
  },
  yearBlock: {
    gap: 12,
  },
  yearHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  yearTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  monthCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  intensityBar: {
    height: 6,
    borderRadius: 4,
    marginBottom: 8,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthCount: {
    fontSize: 12,
    fontWeight: '500',
  },
});
