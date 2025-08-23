import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { Account } from '@/types';
import { CreditCard, Wallet, Landmark, ChevronRight, Banknote, Bitcoin, PiggyBank, Briefcase, Building, Repeat, DollarSign } from 'lucide-react-native';
import { createElement } from 'react';
import { LucideIconMap } from '@/components/IconColorPicker';

interface AccountCardProps {
  account: Account;
}

export function AccountCard({ account }: AccountCardProps) {
  const { theme } = useTheme();
  const router = useRouter();
  
  const getAccountIcon = () => {
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
  
  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={() => router.push(`/account/${account.id}`)}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${account.color}20` }]}>
          {getAccountIcon()}
        </View>
        <Text style={[styles.accountName, { color: theme.colors.text }]}>
          {account.name}
        </Text>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text 
          style={[
            styles.balance, 
            { 
              color: account.balance >= 0 ? theme.colors.text : theme.colors.error 
            }
          ]}
        >
          {account.currency === 'USD' ? '$' : 
           account.currency === 'EUR' ? '€' : 
           account.currency === 'GBP' ? '£' : 
           account.currency === 'JPY' ? '¥' : 
           account.currency === 'CAD' ? 'C$' : 
           account.currency === 'AUD' ? 'A$' : 
           account.currency === 'CHF' ? 'CHF' : 
           account.currency === 'CNY' ? '¥' : 
           account.currency === 'INR' ? '₹' : 
           account.currency === 'LKR' ? 'Rs' : 
           account.currency}{account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <Text style={[styles.currency, { color: theme.colors.textSecondary }]}>
          {account.currency}
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={[styles.accountType, { color: theme.colors.textSecondary }]}>
          {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
        </Text>
        <ChevronRight size={16} color={theme.colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 180,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  customIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  balanceContainer: {
    marginBottom: 16,
  },
  balance: {
    fontSize: 22,
    fontWeight: '600',
  },
  currency: {
    fontSize: 14,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountType: {
    fontSize: 14,
  },
});