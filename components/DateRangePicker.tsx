import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { Calendar, X, Check } from 'lucide-react-native';

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (startDate: Date | null, endDate: Date | null) => void;
  currentStartDate: Date | null;
  currentEndDate: Date | null;
}

export function DateRangePicker({
  visible,
  onClose,
  onSelect,
  currentStartDate,
  currentEndDate,
}: DateRangePickerProps) {
  const { theme } = useTheme();
  const [startDate, setStartDate] = useState<Date | null>(currentStartDate);
  const [endDate, setEndDate] = useState<Date | null>(currentEndDate);
  const [selectingStart, setSelectingStart] = useState(true);

  const handleDateSelect = (date: Date) => {
    if (selectingStart) {
      setStartDate(date);
      setEndDate(null);
      setSelectingStart(false);
    } else {
      if (startDate && date < startDate) {
        // If end date is before start date, swap them
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleApply = () => {
    onSelect(startDate, endDate);
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onSelect(null, null);
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Generate days for current month and next month
    const months = [];
    
    for (let monthOffset = -1; monthOffset <= 2; monthOffset++) {
      const month = new Date(currentYear, currentMonth + monthOffset, 1);
      const monthName = month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      const days = [];
      const current = new Date(startDate);
      
      while (current <= lastDay || days.length % 7 !== 0) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      
      months.push({ monthName, days, actualMonth: month.getMonth() });
    }
    
    return months;
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateSelected = (date: Date) => {
    if (startDate && date.toDateString() === startDate.toDateString()) return true;
    if (endDate && date.toDateString() === endDate.toDateString()) return true;
    return false;
  };

  const renderDay = (date: Date, isCurrentMonth: boolean) => {
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = isDateSelected(date);
    const isInRange = isDateInRange(date);
    
    return (
      <TouchableOpacity
        key={date.toISOString()}
        style={[
          styles.dayButton,
          !isCurrentMonth && styles.dayButtonInactive,
          isSelected && { backgroundColor: theme.colors.primary },
          isInRange && !isSelected && { backgroundColor: theme.colors.primary + '20' },
          isToday && !isSelected && { borderColor: theme.colors.primary, borderWidth: 1 },
        ]}
        onPress={() => handleDateSelect(date)}
      >
        <Text
          style={[
            styles.dayText,
            { color: isCurrentMonth ? theme.colors.text : theme.colors.textSecondary },
            isSelected && { color: 'white' },
            isToday && !isSelected && { color: theme.colors.primary },
          ]}
        >
          {date.getDate()}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Select Date Range
            </Text>
            <TouchableOpacity onPress={handleApply} style={styles.applyButton}>
              <Check size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Selection Info */}
          <View style={[styles.selectionInfo, { backgroundColor: theme.colors.card }]}>
            <View style={styles.dateSelection}>
              <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                Start Date
              </Text>
              <Text style={[
                styles.dateValue, 
                { color: selectingStart ? theme.colors.primary : theme.colors.text }
              ]}>
                {startDate ? startDate.toLocaleDateString() : 'Select start date'}
              </Text>
            </View>
            <View style={styles.dateSelection}>
              <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>
                End Date
              </Text>
              <Text style={[
                styles.dateValue, 
                { color: !selectingStart ? theme.colors.primary : theme.colors.text }
              ]}>
                {endDate ? endDate.toLocaleDateString() : 'Select end date'}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.colors.card }]}
              onPress={() => {
                const today = new Date();
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                setStartDate(weekAgo);
                setEndDate(today);
              }}
            >
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Last 7 days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.colors.card }]}
              onPress={() => {
                const today = new Date();
                const monthAgo = new Date(today);
                monthAgo.setDate(today.getDate() - 30);
                setStartDate(monthAgo);
                setEndDate(today);
              }}
            >
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                Last 30 days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.colors.card }]}
              onPress={() => {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                setStartDate(firstDay);
                setEndDate(today);
              }}
            >
              <Text style={[styles.quickActionText, { color: theme.colors.text }]}>
                This month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionButton, { backgroundColor: theme.colors.card }]}
              onPress={handleClear}
            >
              <Text style={[styles.quickActionText, { color: theme.colors.error }]}>
                Clear
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Calendar */}
          <ScrollView style={styles.calendar} showsVerticalScrollIndicator={false}>
            {generateCalendarDays().map(({ monthName, days, actualMonth }) => (
              <View key={monthName} style={styles.monthContainer}>
                <Text style={[styles.monthTitle, { color: theme.colors.text }]}>
                  {monthName}
                </Text>
                
                {/* Day headers */}
                <View style={styles.dayHeaders}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Text key={day} style={[styles.dayHeader, { color: theme.colors.textSecondary }]}>
                      {day}
                    </Text>
                  ))}
                </View>
                
                {/* Calendar grid */}
                <View style={styles.calendarGrid}>
                  {days.map(date => renderDay(date, date.getMonth() === actualMonth))}
                </View>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  applyButton: {
    padding: 8,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  dateSelection: {
    flex: 1,
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    maxHeight: 50,
    marginBottom: 16,
  },
  quickActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 16,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendar: {
    flex: 1,
    paddingHorizontal: 16,
  },
  monthContainer: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayButton: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  dayButtonInactive: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
});