import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { Transaction } from '@/types';
import { useData } from '@/context/DataContext';
import { Repeat, Coffee, ShoppingCart, Tv, Briefcase, CreditCard, Receipt, Car, Chrome as Home, Zap, HeartPulse, Book, Plane, MoveHorizontal as MoreHorizontal, Gift, Laptop, TrendingUp, Heart, Tag, UtensilsCrossed, ShoppingBag, Wallet, Landmark, RotateCcw, Banknote, Bitcoin, PiggyBank, Building, DollarSign } from 'lucide-react-native';
import { createElement } from 'react';
import { LucideIconMap } from '@/components/IconColorPicker';

interface TransactionListItemProps {
  transaction: Transaction;
}

export function TransactionListItem({ transaction }: TransactionListItemProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { accounts, categories, currencies, mainCurrencyCode, getExchangeRate } = useData();
  
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);
  const convertedAmount = transaction.amount * getExchangeRate(transaction.currency || mainCurrencyCode, mainCurrencyCode);
  
  const account = accounts.find(a => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId 
    ? accounts.find(a => a.id === transaction.toAccountId) 
    : undefined;
  
  const category = transaction.category
    ? categories.find(c => c.name === transaction.category)
    : undefined;

  // Find subcategory if it exists
  const subcategory = category?.subcategories?.find(sub => sub.name === transaction.subcategory);
  
  const date = new Date(transaction.date);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
  
  const formattedTime = date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const getCategoryIcon = () => {
    if (!category) {
      return <CreditCard size={20} color="white" />;
    }

    // First check for custom image icon
    if (category.icon) {
      return (
        <Image 
          key={category.icon}
          source={{ uri: category.icon }} 
          style={styles.customIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Then check for Lucide icon
    if (category.lucideIconName && LucideIconMap[category.lucideIconName]) {
      const IconComponent = LucideIconMap[category.lucideIconName];
      return <IconComponent size={20} color="white" />;
    }
    
    // Fallback to first letter
    return (
      <Text style={styles.iconFallback}>
        {category.name.charAt(0).toUpperCase()}
      </Text>
    );
  };

  const getSubcategoryIcon = () => {
    if (!subcategory) return null;

    // First check for custom image icon
    if (subcategory.icon) {
      return (
        <Image 
          key={subcategory.icon}
          source={{ uri: subcategory.icon }} 
          style={styles.subcategoryCustomIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Then check for Lucide icon
    if (subcategory.lucideIconName && LucideIconMap[subcategory.lucideIconName]) {
      const IconComponent = LucideIconMap[subcategory.lucideIconName];
      return <IconComponent size={10} color="white" />;
    }
    
    // Fallback to first letter
    return (
      <Text style={styles.subcategoryIconFallback}>
        {subcategory.name.charAt(0).toUpperCase()}
      </Text>
    );
  };

  const getAccountIcon = (acc: any) => {
    // First check for custom image icon
    if (acc.icon) {
      return (
        <Image 
          key={acc.icon}
          source={{ uri: acc.icon }} 
          style={styles.accountCustomIcon}
          resizeMode="contain"
        />
      );
    }
    
    // Then check for Lucide icon
    if (acc.lucideIconName && LucideIconMap[acc.lucideIconName]) {
      const IconComponent = LucideIconMap[acc.lucideIconName];
      return createElement(IconComponent, { size: 14, color: acc.color });
    }
    
    // Fallback based on account type
    switch (acc.type) {
      case 'bank':
      case 'checking':
        return <Landmark size={14} color={acc.color} />;
      case 'cash':
        return <Wallet size={14} color={acc.color} />;
      case 'credit':
        return <CreditCard size={14} color={acc.color} />;
      case 'investment':
        return <Banknote size={14} color={acc.color} />;
      case 'crypto':
        return <Bitcoin size={14} color={acc.color} />;
      case 'wallet':
        return <Wallet size={14} color={acc.color} />;
      case 'loan':
        return <Building size={14} color={acc.color} />;
      case 'savings':
        return <PiggyBank size={14} color={acc.color} />;
      case 'business':
        return <Briefcase size={14} color={acc.color} />;
      case 'other':
        return <DollarSign size={14} color={acc.color} />;
      default:
        return <CreditCard size={14} color={acc.color} />;
    }
  };
  
  // PRIMARY LINE: For income/expense, show category/subcategory first, then description for transfers
  const getPrimaryDescription = () => {
    // For transfers, show description if available, otherwise "Transfer"
    if (transaction.type === 'transfer') {
      return transaction.description && transaction.description.trim() 
        ? transaction.description 
        : 'Transfer';
    }
    
    // For income/expense, show category with subcategory if available
    if (transaction.category && transaction.subcategory) {
      return `${transaction.category} • ${transaction.subcategory}`;
    } else if (transaction.category) {
      return transaction.category;
    } else {
      return 'Uncategorized';
    }
  };

  // SECONDARY LINE: For income/expense, show description if available, then account name
  const getSecondaryDescription = () => {
    // No secondary line for transfers
    if (transaction.type === 'transfer') {
      return null;
    }
    
    // For income/expense, show description if available, otherwise account name
    if (transaction.description && transaction.description.trim()) {
      return transaction.description;
    }
    
    return account?.name || '';
  };

  // Get payment status styling - simplified to just opacity
  const getPaymentStatusStyle = () => {
    if (transaction.isPaid) {
      return {
        opacity: 1,
      };
    } else {
      return {
        opacity: 0.6, // More subtle grayed-out effect
      };
    }
  };

  // Get amount color based on payment status
  const getAmountColor = () => {
    if (!transaction.isPaid) {
      return theme.colors.textSecondary;
    }
    
    if (transaction.type === 'income') {
      return theme.colors.success;
    } else if (transaction.type === 'expense') {
      return theme.colors.error;
    } else {
      return theme.colors.text;
    }
  };

  // Get text color for unpaid transactions
  const getTextColor = (baseColor: string) => {
    return transaction.isPaid ? baseColor : theme.colors.textSecondary;
  };

  // Format recurring frequency for display
  const getRecurringDisplayText = () => {
    if (!transaction.isRecurring || !transaction.recurringUnit || !transaction.recurringValue) {
      return '';
    }

    const value = transaction.recurringValue;
    const unit = transaction.recurringUnit;

    if (value === 1) {
      // Singular forms
      switch (unit) {
        case 'day': return 'Daily';
        case 'week': return 'Weekly';
        case 'month': return 'Monthly';
        case 'year': return 'Yearly';
        default: return '';
      }
    } else {
      // Plural forms with numbers
      switch (unit) {
        case 'day': return `${value}d`;
        case 'week': return `${value}w`;
        case 'month': return `${value}m`;
        case 'year': return `${value}y`;
        default: return '';
      }
    }
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container, 
        { backgroundColor: theme.colors.card },
        getPaymentStatusStyle()
      ]}
      onPress={() => router.push(`/transaction/${transaction.id}`)}
    >
      {/* Main Icon with Subcategory Overlay */}
      <View style={styles.iconSection}>
        <View style={[
          styles.iconContainer, 
          { 
            backgroundColor: transaction.type === 'transfer' 
              ? theme.colors.primary 
              : category?.color || theme.colors.textSecondary 
          }
        ]}>
          {transaction.type === 'transfer' ? (
            <Repeat size={20} color="white" />
          ) : (
            getCategoryIcon()
          )}
          
          {/* Subcategory Icon Overlay */}
          {subcategory && transaction.type !== 'transfer' && (
            <View style={[
              styles.subcategoryOverlay, 
              { backgroundColor: subcategory.color }
            ]}>
              {getSubcategoryIcon()}
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.mainInfo}>
          <View style={styles.titleContainer}>
            <Text style={[styles.description, { color: getTextColor(theme.colors.text) }]}>
              {getPrimaryDescription()}
            </Text>
            {getSecondaryDescription() && (
              <Text style={[styles.accountName, { color: getTextColor(theme.colors.textSecondary) }]}>
                {getSecondaryDescription()}
              </Text>
            )}
          </View>
          <View style={styles.amountSection}>
            <Text 
              style={[
                styles.amount, 
                { color: getAmountColor() }
              ]}
            >
              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
              {mainCurrency?.symbol}{convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            {!transaction.isPaid && (
              <Text style={[styles.pendingLabel, { color: theme.colors.textSecondary }]}>
                {transaction.type === 'income' ? 'Pending' : 'Due'}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.subInfo}>
          <View style={styles.accountsInfo}>
            {transaction.type === 'transfer' ? (
              // Show both accounts for transfers
              <View style={styles.transferAccounts}>
                {account && (
                  <View style={styles.accountItem}>
                    <View style={[styles.accountIconContainer, { backgroundColor: `${account.color}20` }]}>
                      {getAccountIcon(account)}
                    </View>
                    <Text style={[styles.accountText, { color: getTextColor(theme.colors.textSecondary) }]}>
                      {account.name}
                    </Text>
                  </View>
                )}
                <Text style={[styles.transferArrow, { color: getTextColor(theme.colors.textSecondary) }]}>→</Text>
                {toAccount && (
                  <View style={styles.accountItem}>
                    <View style={[styles.accountIconContainer, { backgroundColor: `${toAccount.color}20` }]}>
                      {getAccountIcon(toAccount)}
                    </View>
                    <Text style={[styles.accountText, { color: getTextColor(theme.colors.textSecondary) }]}>
                      {toAccount.name}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              // Show single account for income/expense
              account && (
                <View style={styles.accountItem}>
                  <View style={[styles.accountIconContainer, { backgroundColor: `${account.color}20` }]}>
                    {getAccountIcon(account)}
                  </View>
                  <Text style={[styles.accountText, { color: getTextColor(theme.colors.textSecondary) }]}>
                    {account.name}
                  </Text>
                </View>
              )
            )}
          </View>
          
          <View style={styles.dateContainer}>
            {transaction.receiptImage && (
              <Receipt size={12} color={getTextColor(theme.colors.primary)} style={styles.receiptIcon} />
            )}
            {transaction.isRecurring && (
              <View style={[styles.recurringBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <RotateCcw size={10} color={getTextColor(theme.colors.primary)} />
                <Text style={[styles.recurringText, { color: getTextColor(theme.colors.primary) }]}>
                  {getRecurringDisplayText()}
                </Text>
              </View>
            )}
            <View style={styles.dateTimeContainer}>
              <Text style={[styles.date, { color: getTextColor(theme.colors.textSecondary) }]}>
                {formattedDate}
              </Text>
              <Text style={[styles.time, { color: getTextColor(theme.colors.textSecondary) }]}>
                {formattedTime}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    position: 'relative',
  },
  iconSection: {
    position: 'relative',
    marginRight: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  subcategoryOverlay: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  details: {
    flex: 1,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 1,
  },
  accountName: {
    fontSize: 12,
  },
  amountSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '600',
  },
  pendingLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountsInfo: {
    flex: 1,
    marginRight: 6,
  },
  transferAccounts: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accountIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCustomIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  accountText: {
    fontSize: 11,
    fontWeight: '500',
  },
  transferArrow: {
    fontSize: 10,
    fontWeight: '500',
  },
  customIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  subcategoryCustomIcon: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconFallback: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  subcategoryIconFallback: {
    fontSize: 7,
    fontWeight: '600',
    color: 'white',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  receiptIcon: {
    marginRight: 3,
  },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  recurringText: {
    fontSize: 9,
    fontWeight: '700',
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: 12,
  },
  time: {
    fontSize: 10,
    marginTop: 1,
  },
});