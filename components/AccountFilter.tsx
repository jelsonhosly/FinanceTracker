import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { X, CreditCard, Wallet, Landmark, Check } from 'lucide-react-native';
import { Account } from '@/types';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useState, useEffect } from 'react';

interface AccountFilterProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (accountIds: string[]) => void;
  selectedAccountIds: string[];
}

export function AccountFilter({ visible, onClose, onSelect, selectedAccountIds }: AccountFilterProps) {
  const { theme } = useTheme();
  const { accounts } = useData();
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedAccountIds);

  useEffect(() => {
    if (visible) {
      setLocalSelectedIds(selectedAccountIds);
    }
  }, [visible, selectedAccountIds]);

  const renderAccountIcon = (account: Account) => {
    switch (account.type) {
      case 'bank':
        return <Landmark size={24} color={account.color} />;
      case 'cash':
        return <Wallet size={24} color={account.color} />;
      case 'credit':
        return <CreditCard size={24} color={account.color} />;
      default:
        return <CreditCard size={24} color={account.color} />;
    }
  };

  const toggleAccount = (accountId: string) => {
    setLocalSelectedIds(prev => 
      prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSelectAll = () => {
    setLocalSelectedIds([]);
  };

  const handleApply = () => {
    onSelect(localSelectedIds);
    onClose();
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const isSelected = localSelectedIds.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.accountItem, 
          { 
            backgroundColor: theme.colors.background,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border 
          }
        ]}
        onPress={() => toggleAccount(item.id)}
      >
        <View style={styles.accountContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
            {renderAccountIcon(item)}
          </View>
          <View style={styles.accountInfo}>
            <Text style={[styles.accountName, { color: theme.colors.text }]}>
              {item.name}
            </Text>
            <Text style={[styles.accountType, { color: theme.colors.textSecondary }]}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • ${item.balance.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={[
          styles.checkbox,
          { 
            backgroundColor: isSelected ? theme.colors.primary : 'transparent',
            borderColor: isSelected ? theme.colors.primary : theme.colors.border 
          }
        ]}>
          {isSelected && <Check size={16} color="white" />}
        </View>
      </TouchableOpacity>
    );
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
            <Text style={[styles.title, { color: theme.colors.text }]}>Filter by Accounts</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.selectAllButton, { backgroundColor: theme.colors.background }]}
              onPress={handleSelectAll}
            >
              <Text style={[styles.selectAllText, { color: theme.colors.text }]}>
                Clear All
              </Text>
            </TouchableOpacity>
            <Text style={[styles.selectedCount, { color: theme.colors.textSecondary }]}>
              {localSelectedIds.length} selected
            </Text>
          </View>
          
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            renderItem={renderAccount}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.accountsList}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton, { backgroundColor: theme.colors.background }]}
              onPress={onClose}
            >
              <Text style={[styles.footerButtonText, { color: theme.colors.text }]}>
                Cancel
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
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  accountsList: {
    padding: 8,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
  },
  accountContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountType: {
    fontSize: 14,
    marginTop: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
  cancelButton: {
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