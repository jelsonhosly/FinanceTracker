import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { X, CreditCard, Wallet, Landmark, Banknote, Bitcoin, PiggyBank, Briefcase, Building, Repeat, DollarSign } from 'lucide-react-native';
import { Account } from '@/types';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { createElement } from 'react';
import { LucideIconMap } from '@/components/IconColorPicker';

interface AccountSelectorProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (accountId: string) => void;
  excludeAccountId?: string;
}

export function AccountSelector({ visible, onClose, onSelect, excludeAccountId }: AccountSelectorProps) {
  const { theme } = useTheme();
  const { accounts } = useData();
  
  // Filter out the excluded account if provided
  const filteredAccounts = excludeAccountId 
    ? accounts.filter(account => account.id !== excludeAccountId)
    : accounts;
  
  const renderAccountIcon = (account: Account) => {
    // First check for custom image icon
    if (account.icon) {
      return (
        <Image 
          key={account.icon}
          source={{ uri: account.icon }} 
          style={styles.customIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Then check for Lucide icon
    if (account.lucideIconName && LucideIconMap[account.lucideIconName]) {
      const IconComponent = LucideIconMap[account.lucideIconName];
      return createElement(IconComponent, { size: 24, color: account.color });
    }
    
    // Fallback based on account type
    switch (account.type) {
      case 'bank':
      case 'checking':
        return <Landmark size={24} color={account.color} />;
      case 'cash':
        return <Wallet size={24} color={account.color} />;
      case 'credit':
        return <CreditCard size={24} color={account.color} />;
      case 'investment':
        return <Banknote size={24} color={account.color} />;
      case 'crypto':
        return <Bitcoin size={24} color={account.color} />;
      case 'wallet':
        return <Wallet size={24} color={account.color} />;
      case 'loan':
        return <Building size={24} color={account.color} />;
      case 'savings':
        return <PiggyBank size={24} color={account.color} />;
      case 'business':
        return <Briefcase size={24} color={account.color} />;
      case 'other':
        return <DollarSign size={24} color={account.color} />;
      default:
        return <CreditCard size={24} color={account.color} />;
    }
  };
  
  const renderAccount = ({ item }: { item: Account }) => (
    <TouchableOpacity
      style={[styles.accountItem, { borderBottomColor: theme.colors.border }]}
      onPress={() => {
        onSelect(item.id);
      }}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
        {renderAccountIcon(item)}
      </View>
      <View style={styles.accountInfo}>
        <Text style={[styles.accountName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.accountBalance, { color: theme.colors.textSecondary }]}>
          Balance: ${item.balance.toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
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
            <Text style={[styles.title, { color: theme.colors.text }]}>Select Account</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredAccounts}
            keyExtractor={(item) => item.id}
            renderItem={renderAccount}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.accountsList}
          />
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
  accountsList: {
    padding: 8,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  customIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountBalance: {
    fontSize: 14,
    marginTop: 4,
  },
});