import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, Check, ArrowDown, ArrowUp, Repeat, Clock, CheckCircle } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import { TransactionType } from '@/types';

interface TransactionTypeFilterProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (types: TransactionType[]) => void;
  selectedTypes: TransactionType[];
}

export function TransactionTypeFilter({ visible, onClose, onSelect, selectedTypes }: TransactionTypeFilterProps) {
  const { theme } = useTheme();
  const [localSelectedTypes, setLocalSelectedTypes] = useState<TransactionType[]>(selectedTypes);

  useEffect(() => {
    if (visible) {
      setLocalSelectedTypes(selectedTypes);
    }
  }, [visible, selectedTypes]);

  const toggleTransactionType = (type: TransactionType) => {
    setLocalSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleApply = () => {
    onSelect(localSelectedTypes);
    onClose();
  };

  const handleClear = () => {
    setLocalSelectedTypes([]);
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'income':
      case 'paid_income':
      case 'pending_income':
        return theme.colors.success;
      case 'expense':
      case 'paid_expense':
      case 'due_expense':
        return theme.colors.error;
      case 'transfer':
        return theme.colors.primary;
    }
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'income':
        return <ArrowDown size={24} color="white" />;
      case 'paid_income':
        return <CheckCircle size={24} color="white" />;
      case 'pending_income':
        return <Clock size={24} color="white" />;
      case 'expense':
        return <ArrowUp size={24} color="white" />;
      case 'paid_expense':
        return <CheckCircle size={24} color="white" />;
      case 'due_expense':
        return <Clock size={24} color="white" />;
      case 'transfer':
        return <Repeat size={24} color="white" />;
    }
  };

  const getTypeTitle = (type: TransactionType) => {
    switch (type) {
      case 'income': return 'All Income';
      case 'paid_income': return 'Paid Income';
      case 'pending_income': return 'Pending Income';
      case 'expense': return 'All Expenses';
      case 'paid_expense': return 'Paid Expenses';
      case 'due_expense': return 'Due Expenses';
      case 'transfer': return 'Transfers';
    }
  };

  const getTypeDescription = (type: TransactionType) => {
    switch (type) {
      case 'income': return 'All money received';
      case 'paid_income': return 'Completed income';
      case 'pending_income': return 'Expected income';
      case 'expense': return 'All money spent';
      case 'paid_expense': return 'Completed expenses';
      case 'due_expense': return 'Outstanding bills';
      case 'transfer': return 'Between accounts';
    }
  };

  const transactionTypes: TransactionType[] = [
    'income', 'paid_income', 'pending_income',
    'expense', 'paid_expense', 'due_expense',
    'transfer'
  ];

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
            <Text style={[styles.title, { color: theme.colors.text }]}>Transaction Types</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.typesList}>
              {transactionTypes.map((type) => {
                const isSelected = localSelectedTypes.includes(type);
                const typeColor = getTypeColor(type);
                
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeCard,
                      { 
                        backgroundColor: isSelected ? typeColor : theme.colors.background,
                        borderColor: isSelected ? typeColor : theme.colors.border,
                      }
                    ]}
                    onPress={() => toggleTransactionType(type)}
                  >
                    <View style={[
                      styles.typeIconContainer,
                      { backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : `${typeColor}20` }
                    ]}>
                      {React.cloneElement(getTypeIcon(type), {
                        color: isSelected ? 'white' : typeColor
                      })}
                    </View>
                    <View style={styles.typeInfo}>
                      <Text style={[
                        styles.typeTitle,
                        { color: isSelected ? 'white' : theme.colors.text }
                      ]}>
                        {getTypeTitle(type)}
                      </Text>
                      <Text style={[
                        styles.typeDescription,
                        { color: isSelected ? 'rgba(255, 255, 255, 0.8)' : theme.colors.textSecondary }
                      ]}>
                        {getTypeDescription(type)}
                      </Text>
                    </View>
                    {isSelected && (
                      <Check size={20} color="white" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.clearButton, { backgroundColor: theme.colors.background }]}
              onPress={handleClear}
            >
              <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>
                Clear
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.applyButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.footerButtonText, { color: 'white' }]}>
                Apply
              </Text>
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 400,
  },
  typesList: {
    gap: 12,
  },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeInfo: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
  },
  applyButton: {
    // Primary color background applied inline
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});