import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Calendar, ChevronRight, CalendarDays } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { DatePicker } from '@/components/DatePicker';

interface SimpleDateFilterProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (startDate: Date | null, endDate: Date | null, label: string, viewMode: 'daily' | 'monthly' | 'yearly') => void;
  currentStartDate: Date | null;
  currentEndDate: Date | null;
}

export function SimpleDateFilter({
  visible,
  onClose,
  onSelect,
  currentStartDate,
  currentEndDate,
}: SimpleDateFilterProps) {
  const { theme } = useTheme();
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [selectingStartDate, setSelectingStartDate] = useState(true);

  // Determine view mode based on date range
  const determineViewMode = (startDate: Date | null, endDate: Date | null): 'daily' | 'monthly' | 'yearly' => {
    if (!startDate || !endDate) {
      return 'yearly'; // All time view
    }
    
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return 'daily';
    } else if (diffDays <= 365) {
      return 'monthly';
    } else {
      return 'yearly';
    }
  };

  const getDateRangeOptions = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(thisWeekStart.getDate() - 1);
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    
    const last90Days = new Date(today);
    last90Days.setDate(today.getDate() - 90);
    
    const thisYearStart = new Date(today.getFullYear(), 0, 1);
    
    const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
    const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);

    return [
      {
        label: 'All Time',
        startDate: null,
        endDate: null,
        description: 'Show all transactions',
        isCustom: false,
        viewMode: 'yearly' as const,
      },
      {
        label: 'Today',
        startDate: today,
        endDate: today,
        description: new Date().toLocaleDateString(),
        isCustom: false,
        viewMode: 'daily' as const,
      },
      {
        label: 'Yesterday',
        startDate: yesterday,
        endDate: yesterday,
        description: yesterday.toLocaleDateString(),
        isCustom: false,
        viewMode: 'daily' as const,
      },
      {
        label: 'This Week',
        startDate: thisWeekStart,
        endDate: today,
        description: `${thisWeekStart.toLocaleDateString()} - ${today.toLocaleDateString()}`,
        isCustom: false,
        viewMode: 'daily' as const,
      },
      {
        label: 'Last Week',
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        description: `${lastWeekStart.toLocaleDateString()} - ${lastWeekEnd.toLocaleDateString()}`,
        isCustom: false,
        viewMode: 'daily' as const,
      },
      {
        label: 'This Month',
        startDate: thisMonthStart,
        endDate: today,
        description: today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        isCustom: false,
        viewMode: 'monthly' as const,
      },
      {
        label: 'Last Month',
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
        description: lastMonthStart.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        isCustom: false,
        viewMode: 'monthly' as const,
      },
      {
        label: 'Last 30 Days',
        startDate: last30Days,
        endDate: today,
        description: `${last30Days.toLocaleDateString()} - ${today.toLocaleDateString()}`,
        isCustom: false,
        viewMode: 'monthly' as const,
      },
      {
        label: 'Last 90 Days',
        startDate: last90Days,
        endDate: today,
        description: `${last90Days.toLocaleDateString()} - ${today.toLocaleDateString()}`,
        isCustom: false,
        viewMode: 'monthly' as const,
      },
      {
        label: 'This Year',
        startDate: thisYearStart,
        endDate: today,
        description: today.getFullYear().toString(),
        isCustom: false,
        viewMode: 'monthly' as const,
      },
      {
        label: 'Last Year',
        startDate: lastYearStart,
        endDate: lastYearEnd,
        description: (today.getFullYear() - 1).toString(),
        isCustom: false,
        viewMode: 'yearly' as const,
      },
      {
        label: 'Custom Range',
        startDate: null,
        endDate: null,
        description: 'Pick your own date range',
        isCustom: true,
        viewMode: 'monthly' as const, // Default, will be recalculated
      },
    ];
  };

  const getCurrentSelection = () => {
    if (!currentStartDate && !currentEndDate) return 'All Time';
    
    const options = getDateRangeOptions();
    const current = options.find(option => {
      if (option.isCustom) return false;
      
      if (!option.startDate && !option.endDate) {
        return !currentStartDate && !currentEndDate;
      }
      
      if (!option.startDate || !option.endDate || !currentStartDate || !currentEndDate) {
        return false;
      }
      
      return (
        option.startDate.toDateString() === currentStartDate.toDateString() &&
        option.endDate.toDateString() === currentEndDate.toDateString()
      );
    });
    
    if (current) {
      return current.label;
    }
    
    // If no preset matches, it's a custom range
    if (currentStartDate && currentEndDate) {
      return `${currentStartDate.toLocaleDateString()} - ${currentEndDate.toLocaleDateString()}`;
    }
    
    return 'Custom Range';
  };

  const handleOptionSelect = (option: any) => {
    if (option.isCustom) {
      setCustomStartDate(currentStartDate);
      setCustomEndDate(currentEndDate);
      setSelectingStartDate(true);
      setShowCustomDatePicker(true);
    } else {
      onSelect(option.startDate, option.endDate, option.label, option.viewMode);
    }
  };

  const handleCustomDateSelect = (selectedDate: Date) => {
    if (selectingStartDate) {
      setCustomStartDate(selectedDate);
      setCustomEndDate(null);
      setSelectingStartDate(false);
    } else {
      if (customStartDate && selectedDate < customStartDate) {
        // If end date is before start date, swap them
        setCustomEndDate(customStartDate);
        setCustomStartDate(selectedDate);
      } else {
        setCustomEndDate(selectedDate);
      }
      
      // Apply the custom range
      const startDate = customStartDate;
      const endDate = selectedDate < (customStartDate || selectedDate) ? customStartDate : selectedDate;
      const finalStartDate = selectedDate < (customStartDate || selectedDate) ? selectedDate : customStartDate;
      
      const label = `${finalStartDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`;
      const viewMode = determineViewMode(finalStartDate, endDate);
      onSelect(finalStartDate, endDate, label, viewMode);
      setShowCustomDatePicker(false);
    }
  };

  const dateOptions = getDateRangeOptions();
  const currentSelection = getCurrentSelection();

  return (
    <>
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
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Select Time Period
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Quick Options */}
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {dateOptions.map((option, index) => {
                const isSelected = currentSelection === option.label || 
                  (option.isCustom && !dateOptions.find(opt => !opt.isCustom && currentSelection === opt.label));
                
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
                        {option.isCustom ? (
                          <CalendarDays 
                            size={20} 
                            color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
                          />
                        ) : (
                          <Calendar 
                            size={20} 
                            color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
                          />
                        )}
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
                            {option.isCustom && currentStartDate && currentEndDate && isSelected
                              ? `${currentStartDate.toLocaleDateString()} - ${currentEndDate.toLocaleDateString()}`
                              : option.description
                            }
                          </Text>
                        </View>
                      </View>
                      
                      {option.isCustom ? (
                        <ChevronRight 
                          size={20} 
                          color={isSelected ? theme.colors.primary : theme.colors.textSecondary} 
                        />
                      ) : isSelected ? (
                        <View style={[styles.selectedIndicator, { backgroundColor: theme.colors.primary }]}>
                          <Text style={styles.selectedText}>✓</Text>
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                Tap any option to apply the filter instantly
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
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
          subtitle={selectingStartDate 
            ? 'Choose the beginning of your date range' 
            : customStartDate 
              ? `From ${customStartDate.toLocaleDateString()}`
              : 'Choose the end of your date range'
          }
        />
      )}
    </>
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
    maxWidth: 400,
    maxHeight: '85%',
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
    maxHeight: 500,
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
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});