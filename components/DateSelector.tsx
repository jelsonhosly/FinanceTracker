import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Calendar, ChevronDown, Check } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { DatePicker } from '@/components/DatePicker';

interface DateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (startDate: Date | null, endDate: Date | null, label: string) => void;
  currentStartDate: Date | null;
  currentEndDate: Date | null;
  currentLabel: string;
}

export function DateSelector({
  visible,
  onClose,
  onSelect,
  currentStartDate,
  currentEndDate,
  currentLabel,
}: DateSelectorProps) {
  const { theme } = useTheme();
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [selectingStartDate, setSelectingStartDate] = useState(true);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const getDateRangeOptions = () => {
    const today = new Date();
    
    // This Week
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    // Last Week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    
    // This Month
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Last Month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    // This Quarter
    const currentQuarter = Math.floor(today.getMonth() / 3);
    const thisQuarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
    
    // Last Quarter
    const lastQuarterStart = new Date(today.getFullYear(), (currentQuarter - 1) * 3, 1);
    const lastQuarterEnd = new Date(today.getFullYear(), currentQuarter * 3, 0);
    
    // This Year
    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    
    // Last Year
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);

    return [
      {
        label: 'This Week',
        startDate: thisWeekStart,
        endDate: today,
        description: `${thisWeekStart.toLocaleDateString()} - ${today.toLocaleDateString()}`,
      },
      {
        label: 'Last Week',
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        description: `${lastWeekStart.toLocaleDateString()} - ${lastWeekEnd.toLocaleDateString()}`,
      },
      {
        label: 'This Month',
        startDate: thisMonthStart,
        endDate: today,
        description: today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      },
      {
        label: 'Last Month',
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
        description: lastMonthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      },
      {
        label: 'This Quarter',
        startDate: thisQuarterStart,
        endDate: today,
        description: `Q${currentQuarter + 1} ${today.getFullYear()}`,
      },
      {
        label: 'Last Quarter',
        startDate: lastQuarterStart,
        endDate: lastQuarterEnd,
        description: `Q${currentQuarter} ${today.getFullYear()}`,
      },
      {
        label: 'This Year',
        startDate: thisYearStart,
        endDate: today,
        description: today.getFullYear().toString(),
      },
      {
        label: 'Last Year',
        startDate: lastYearStart,
        endDate: lastYearEnd,
        description: (today.getFullYear() - 1).toString(),
      },
      {
        label: 'Custom Range',
        startDate: null,
        endDate: null,
        description: 'Pick your own dates',
        isCustom: true,
      },
    ];
  };

  const handleOptionSelect = (option: any) => {
    if (option.isCustom) {
      setCustomStartDate(currentStartDate);
      setCustomEndDate(currentEndDate);
      setSelectingStartDate(true);
      setShowCustomDatePicker(true);
    } else {
      onSelect(option.startDate, option.endDate, option.label);
    }
  };

  const handleCustomDateSelect = (selectedDate: Date) => {
    if (selectingStartDate) {
      setCustomStartDate(selectedDate);
      setCustomEndDate(null);
      setSelectingStartDate(false);
    } else {
      if (customStartDate && selectedDate < customStartDate) {
        setCustomEndDate(customStartDate);
        setCustomStartDate(selectedDate);
      } else {
        setCustomEndDate(selectedDate);
      }
      
      const startDate = customStartDate;
      const endDate = selectedDate < (customStartDate || selectedDate) ? customStartDate : selectedDate;
      const finalStartDate = selectedDate < (customStartDate || selectedDate) ? selectedDate : customStartDate;
      
      const label = `${finalStartDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`;
      onSelect(finalStartDate, endDate, label);
      setShowCustomDatePicker(false);
    }
  };

  const dateOptions = getDateRangeOptions();

  return (
    <>
      <Modal
        transparent
        visible={visible}
        animationType="slide"
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
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Select Time Period
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {dateOptions.map((option, index) => {
                const isSelected = currentLabel === option.label;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionItem,
                      { backgroundColor: theme.colors.background },
                      isSelected && { 
                        backgroundColor: theme.colors.primary + '15',
                        borderColor: theme.colors.primary,
                        borderWidth: 2,
                      }
                    ]}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <View style={styles.optionContent}>
                      <View style={styles.optionMain}>
                        <Calendar 
                          size={20} 
                          color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
                        />
                        <View style={styles.optionText}>
                          <Text style={[
                            styles.optionLabel,
                            { color: isSelected ? theme.colors.primary : theme.colors.text }
                          ]}>
                            {option.label}
                          </Text>
                          <Text style={[
                            styles.optionDescription,
                            { color: theme.colors.textSecondary }
                          ]}>
                            {option.description}
                          </Text>
                        </View>
                      </View>
                      
                      {isSelected && (
                        <Check size={20} color={theme.colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker */}
      {showCustomDatePicker && (
        <DatePicker
          visible={showCustomDatePicker}
          onClose={() => {
            setShowCustomDatePicker(false);
            setSelectingStartDate(true);
          }}
          onSelect={handleCustomDateSelect}
          currentDate={selectingStartDate ? (customStartDate || new Date()) : (customEndDate || new Date())}
          title={selectingStartDate ? 'Select Start Date' : 'Select End Date'}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '70%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
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
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionText: {
    marginLeft: 16,
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
});