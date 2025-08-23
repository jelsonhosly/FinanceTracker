import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';

interface DatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  currentDate: Date;
  title?: string;
}

export function DatePicker({ 
  visible, 
  onClose, 
  onSelect, 
  currentDate,
  title = 'Select Date'
}: DatePickerProps) {
  const { theme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date(currentDate));

  // Generate days for the calendar
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const today = new Date();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const isSelected = 
        dayDate.getDate() === selectedDate.getDate() &&
        dayDate.getMonth() === selectedDate.getMonth() &&
        dayDate.getFullYear() === selectedDate.getFullYear();
      
      const isToday = 
        dayDate.getDate() === today.getDate() &&
        dayDate.getMonth() === today.getMonth() &&
        dayDate.getFullYear() === today.getFullYear();
      
      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={[
            styles.calendarDay,
            isSelected && { backgroundColor: theme.colors.primary },
            isToday && !isSelected && { borderColor: theme.colors.primary, borderWidth: 2 }
          ]}
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(i);
            setSelectedDate(newDate);
          }}
        >
          <Text
            style={[
              styles.calendarDayText,
              { color: isSelected ? 'white' : theme.colors.text },
              isToday && !isSelected && { color: theme.colors.primary, fontWeight: '600' }
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView 
          intensity={Platform.OS === 'ios' ? 20 : 15}
          tint={theme.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navButton}>
              <ChevronLeft size={24} color={theme.colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.monthYearText, { color: theme.colors.text }]}>
              {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
              <ChevronRight size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weekdaysContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <Text 
                key={index}
                style={[styles.weekdayText, { color: theme.colors.textSecondary }]}
              >
                {day}
              </Text>
            ))}
          </View>
          
          <View style={styles.calendarContainer}>
            {renderCalendar()}
          </View>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={() => onSelect(selectedDate)}
            >
              <Text style={[styles.buttonText, { color: 'white' }]}>Select</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  weekdayText: {
    fontSize: 12,
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calendarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  calendarDay: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});