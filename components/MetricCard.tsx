import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type MetricCardProps = {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  onPress?: () => void;
};

export const MetricCard = ({
  title,
  value,
  change,
  icon,
  color,
  onPress,
}: MetricCardProps) => {
  const { theme } = useTheme();
  const isDark = useColorScheme() === 'dark';
  
  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        {React.cloneElement(icon as React.ReactElement, {
          size: 20,
          color: color,
        })}
      </View>
      <Text style={[styles.title, { color: theme.colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.value, { color: theme.colors.text }]}>{value}</Text>
      {change !== undefined && (
        <View style={styles.changeContainer}>
          <Text style={[
            styles.changeText,
            { color: change >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </Text>
          <Text style={[styles.changeLabel, { color: theme.colors.textSecondary }]}>
            vs last period
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    minWidth: 140,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
  },
  value: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  changeLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
});
