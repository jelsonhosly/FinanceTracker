import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { BlurView } from 'expo-blur';

interface TimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (time: { hour: number; minute: number }) => void;
  currentTime: { hour: number; minute: number };
  title?: string;
}

export function TimePicker({ 
  visible, 
  onClose, 
  onSelect, 
  currentTime,
  title = 'Select Time'
}: TimePickerProps) {
  const { theme } = useTheme();
  const [selectedHour, setSelectedHour] = useState(currentTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(currentTime.minute);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const handleSelect = () => {
    onSelect({ hour: selectedHour, minute: selectedMinute });
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
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
              <Clock size={20} color={theme.colors.primary} />
              <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.timeDisplay}>
            <Text style={[styles.timeText, { color: theme.colors.text }]}>
              {formatTime(selectedHour, selectedMinute)}
            </Text>
          </View>

          <View style={styles.pickersContainer}>
            {/* Hour Picker */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>Hour</Text>
              <View style={[styles.picker, { backgroundColor: theme.colors.background }]}>
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      selectedHour === hour && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      { color: selectedHour === hour ? 'white' : theme.colors.text }
                    ]}>
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Minute Picker */}
            <View style={styles.pickerSection}>
              <Text style={[styles.pickerLabel, { color: theme.colors.textSecondary }]}>Minute</Text>
              <View style={[styles.picker, { backgroundColor: theme.colors.background }]}>
                {minutes.filter(m => m % 5 === 0).map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.pickerItem,
                      selectedMinute === minute && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      { color: selectedMinute === minute ? 'white' : theme.colors.text }
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
              onPress={handleSelect}
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
    maxWidth: 400,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplay: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  timeText: {
    fontSize: 32,
    fontWeight: '700',
  },
  pickersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 20,
  },
  pickerSection: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  picker: {
    maxHeight: 200,
    borderRadius: 12,
    padding: 8,
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: 'center',
  },
  pickerItemText: {
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