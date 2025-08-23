import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { CreditCard, Wallet, Landmark, Banknote, Bitcoin, PiggyBank, Briefcase, Building, Repeat, DollarSign } from 'lucide-react-native';
import { createElement } from 'react';
import { LucideIconMap } from '@/components/IconColorPicker';

interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
  color?: string;
  icon?: string;
  lucideIconName?: string;
}

interface AccountHorizontalSelectorProps {
  accounts: Account[];
  selectedAccountId?: string;
  onAccountSelect: (accountId: string) => void;
  excludeAccountId?: string;
  title?: string;
}

const getAccountIcon = (account: Account, isSelected: boolean) => {
  const iconColor = isSelected ? '#fff' : (account.color || '#666');
  
  // Check for custom image icon
  if (account.icon) {
    return (
      <Image 
        source={{ uri: account.icon }} 
        style={[styles.icon, { tintColor: isSelected ? '#fff' : undefined }]}
        resizeMode="contain"
      />
    );
  }
  
  // Check for Lucide icon
  if (account.lucideIconName && LucideIconMap[account.lucideIconName]) {
    const IconComponent = LucideIconMap[account.lucideIconName];
    return createElement(IconComponent, { size: 20, color: iconColor });
  }
  
  // Fallback based on account type
  switch (account.type) {
    case 'bank':
    case 'checking':
      return <Landmark size={20} color={iconColor} />;
    case 'cash':
      return <Wallet size={20} color={iconColor} />;
    case 'credit':
      return <CreditCard size={20} color={iconColor} />;
    case 'investment':
      return <Banknote size={20} color={iconColor} />;
    case 'crypto':
      return <Bitcoin size={20} color={iconColor} />;
    case 'savings':
      return <PiggyBank size={20} color={iconColor} />;
    case 'loan':
      return <DollarSign size={20} color={iconColor} />;
    default:
      return <Wallet size={20} color={iconColor} />;
  }
};

export default function AccountHorizontalSelector({
  accounts,
  selectedAccountId,
  onAccountSelect,
  excludeAccountId,
  title,
}: AccountHorizontalSelectorProps) {
  // Filter out the excluded account if provided
  const filteredAccounts = excludeAccountId
    ? accounts.filter(account => account.id !== excludeAccountId)
    : accounts;
  return (
    <View style={styles.wrapper}>
      {title && <Text style={[styles.title, { color: '#666' }]}>{title}</Text>}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {filteredAccounts.map((account) => (
        <TouchableOpacity
          key={account.id}
          style={[
            styles.accountItem,
            selectedAccountId === account.id ? styles.selectedAccount : 
              account.color ? { backgroundColor: `${account.color}20`, borderColor: `${account.color}80` } : {},
          ]}
          onPress={() => onAccountSelect(account.id)}
        >
          {getAccountIcon(account, selectedAccountId === account.id)}
          <Text
            style={[
              styles.accountName,
              selectedAccountId === account.id ? styles.selectedAccountName : 
                account.color ? { color: account.color } : {},
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {account.name}
          </Text>
          <Text
            style={[
              styles.accountBalance,
              selectedAccountId === account.id ? styles.selectedAccountBalance : 
                account.color ? { color: account.color } : {},
            ]}
          >
            ${account.balance.toFixed(2)}
          </Text>
        </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginLeft: 16,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  accountItem: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    minWidth: 140,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedAccount: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  icon: {
    width: 20,
    height: 20,
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedAccountName: {
    color: '#fff',
  },
  accountBalance: {
    fontSize: 12,
    color: '#666',
  },
  selectedAccountBalance: {
    color: '#fff',
  },
});