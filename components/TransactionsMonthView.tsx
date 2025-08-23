import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Transaction } from '@/types';

interface Props {
  transactions: Transaction[];
  year: number; // full year, e.g., 2025
  month: number; // 0-11
  onSelectDay: (date: Date) => void;
}

export default function TransactionsMonthView({ transactions, year, month, onSelectDay }: Props) {
  const { theme } = useTheme();

  const daysData = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const counts: Record<number, number> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        counts[day] = (counts[day] || 0) + 1;
      }
    });

    return { firstDay, daysInMonth, counts };
  }, [transactions, year, month]);

  const today = new Date();

  const getColor = (count: number) => {
    if (!count) return theme.colors.border;
    const ratio = Math.min(1, count / 10);
    return `${theme.colors.primary}${Math.max(0.15, ratio * 0.5).toFixed(2).replace('.', '')}`;
  };

  const rows: number[][] = [];
  let currentRow: number[] = [];
  // Add leading blanks based on weekday
  const leading = new Date(year, month, 1).getDay();
  for (let i = 0; i < leading; i++) currentRow.push(0);
  for (let day = 1; day <= daysData.daysInMonth; day++) {
    currentRow.push(day);
    if (currentRow.length === 7) {
      rows.push(currentRow);
      currentRow = [];
    }
  }
  if (currentRow.length) rows.push(currentRow);

  return (
    <View style={styles.container}>
      {rows.map((row, idx) => (
        <View key={idx} style={styles.row}>
          {row.map((day, i) => {
            if (day === 0) return <View key={`b-${i}`} style={styles.cell} />;
            const count = daysData.counts[day] || 0;
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.cell, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => onSelectDay(new Date(year, month, day))}
              >
                <View style={[styles.intensityDot, { backgroundColor: getColor(count) }]} />
                <Text style={[styles.dayText, { color: isToday ? theme.colors.primary : theme.colors.text }]}>
                  {day}
                </Text>
                <Text style={[styles.countText, { color: theme.colors.textSecondary }]}>
                  {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      <View style={{ height: 60 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  intensityDot: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  countText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
