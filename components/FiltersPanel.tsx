import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, RefreshCw, Check, CreditCard, Tag, Filter } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useState, useEffect } from 'react';
import { Account, Category, TransactionType } from '@/types';

interface FiltersPanelProps {
  visible: boolean;
  onClose: () => void;
  filters: {
    transactionTypes: TransactionType[];
    accountIds: string[];
    categoryNames: string[];
    startDate: Date | null;
    endDate: Date | null;
    dateLabel: string;
  };
  onFiltersChange: (filters: any) => void;
  accounts: Account[];
  categories: Category[];
}

export function FiltersPanel({
  visible,
  onClose,
  filters,
  onFiltersChange,
  accounts,
  categories,
}: FiltersPanelProps) {
  const { theme } = useTheme();
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      ...localFilters,
      transactionTypes: [],
      accountIds: [],
      categoryNames: [],
    };
    setLocalFilters(resetFilters);
  };

  const toggleAccount = (accountId: string) => {
    setLocalFilters(prev => ({
      ...prev,
      accountIds: prev.accountIds.includes(accountId)
        ? prev.accountIds.filter(id => id !== accountId)
        : [...prev.accountIds, accountId]
    }));
  };

  const toggleCategory = (categoryName: string) => {
    setLocalFilters(prev => ({
      ...prev,
      categoryNames: prev.categoryNames.includes(categoryName)
        ? prev.categoryNames.filter(name => name !== categoryName)
        : [...prev.categoryNames, categoryName]
    }));
  };

  const toggleTransactionType = (type: TransactionType) => {
    setLocalFilters(prev => ({
      ...prev,
      transactionTypes: prev.transactionTypes.includes(type)
        ? prev.transactionTypes.filter(t => t !== type)
        : [...prev.transactionTypes, type]
    }));
  };

  const transactionTypeOptions = [
    { id: 'income' as TransactionType, title: 'All Income', color: '#22C55E' },
    { id: 'paid_income' as TransactionType, title: 'Paid Income', color: '#16A34A' },
    { id: 'pending_income' as TransactionType, title: 'Pending Income', color: '#84CC16' },
    { id: 'expense' as TransactionType, title: 'All Expenses', color: '#EF4444' },
    { id: 'paid_expense' as TransactionType, title: 'Paid Expenses', color: '#DC2626' },
    { id: 'due_expense' as TransactionType, title: 'Due Expenses', color: '#F59E0B' },
    { id: 'transfer' as TransactionType, title: 'Transfers', color: '#7C3AED' },
  ];

  const hasActiveFilters = () => {
    return localFilters.transactionTypes.length > 0 ||
           localFilters.accountIds.length > 0 ||
           localFilters.categoryNames.length > 0;
  };

  return (
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
        <View style={[styles.panel, { backgroundColor: theme.colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Filter size={20} color={theme.colors.primary} />
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Filters
              </Text>
            </View>
            <View style={styles.headerRight}>
              {hasActiveFilters() && (
                <TouchableOpacity 
                  style={[styles.resetButton, { backgroundColor: theme.colors.error + '15' }]}
                  onPress={handleReset}
                >
                  <RefreshCw size={16} color={theme.colors.error} />
                  <Text style={[styles.resetButtonText, { color: theme.colors.error }]}>
                    Reset
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Transaction Types */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Transaction Types
              </Text>
              <View style={styles.optionsGrid}>
                {transactionTypeOptions.map((option) => {
                  const isSelected = localFilters.transactionTypes.includes(option.id);
                  
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.filterOption,
                        { backgroundColor: theme.colors.background },
                        isSelected && { backgroundColor: option.color + '20', borderColor: option.color }
                      ]}
                      onPress={() => toggleTransactionType(option.id)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        { color: isSelected ? option.color : theme.colors.text }
                      ]}>
                        {option.title}
                      </Text>
                      {isSelected && (
                        <Check size={16} color={option.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Accounts */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Accounts
              </Text>
              <View style={styles.optionsGrid}>
                {accounts.map((account) => {
                  const isSelected = localFilters.accountIds.includes(account.id);
                  
                  return (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.filterOption,
                        { backgroundColor: theme.colors.background },
                        isSelected && { backgroundColor: account.color + '20', borderColor: account.color }
                      ]}
                      onPress={() => toggleAccount(account.id)}
                    >
                      <View style={styles.accountOptionContent}>
                        <CreditCard size={16} color={isSelected ? account.color : theme.colors.textSecondary} />
                        <Text style={[
                          styles.filterOptionText,
                          { color: isSelected ? account.color : theme.colors.text }
                        ]}>
                          {account.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check size={16} color={account.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Categories
              </Text>
              <View style={styles.optionsGrid}>
                {categories.map((category) => {
                  const isSelected = localFilters.categoryNames.includes(category.name);
                  
                  return (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.filterOption,
                        { backgroundColor: theme.colors.background },
                        isSelected && { backgroundColor: category.color + '20', borderColor: category.color }
                      ]}
                      onPress={() => toggleCategory(category.name)}
                    >
                      <View style={styles.categoryOptionContent}>
                        <Tag size={16} color={isSelected ? category.color : theme.colors.textSecondary} />
                        <Text style={[
                          styles.filterOptionText,
                          { color: isSelected ? category.color : theme.colors.text }
                        ]}>
                          {category.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check size={16} color={category.color} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: theme.colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.footerButtonText, { color: 'white' }]}>
                Apply Filters
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
    justifyContent: 'flex-end',
  },
  panel: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  accountOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});