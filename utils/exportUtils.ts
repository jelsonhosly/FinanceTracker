import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Transaction, Account, Category } from '@/types';

export interface ExportData {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  filters: {
    dateRange: string;
    accountNames: string[];
    categoryNames: string[];
    transactionTypes: string[];
  };
  totals: {
    income: number;
    expenses: number;
    balance: number;
  };
}

// Generate filename with timestamp
export const generateFilename = (type: 'pdf' | 'excel' | 'txt', prefix: string = 'financial-report') => {
  const timestamp = new Date().toISOString().split('T')[0];
  const extension = type === 'excel' ? 'xlsx' : type;
  return `${prefix}-${timestamp}.${extension}`;
};

// Format currency
export const formatCurrency = (amount: number, symbol: string = '$') => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Format date for display
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get transaction type display name
export const getTransactionTypeDisplay = (transaction: Transaction) => {
  const baseType = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
  const status = transaction.isPaid ? 'Paid' : (transaction.type === 'income' ? 'Pending' : 'Due');
  return `${baseType} (${status})`;
};

// Get account name from ID
export const getAccountName = (accountId: string, accounts: Account[]) => {
  return accounts.find(a => a.id === accountId)?.name || 'Unknown Account';
};

// Get category display name
export const getCategoryDisplay = (transaction: Transaction) => {
  if (transaction.type === 'transfer') {
    return 'Transfer';
  }
  
  if (transaction.category && transaction.subcategory) {
    return `${transaction.category} • ${transaction.subcategory}`;
  } else if (transaction.category) {
    return transaction.category;
  } else {
    return 'Uncategorized';
  }
};

// Save file based on platform
export const saveFile = async (content: string | Uint8Array, filename: string, mimeType: string) => {
  if (Platform.OS === 'web') {
    // Web download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Mobile sharing
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    if (typeof content === 'string') {
      await FileSystem.writeAsStringAsync(fileUri, content);
    } else {
      await FileSystem.writeAsStringAsync(fileUri, content.toString(), {
        encoding: FileSystem.EncodingType.Base64,
      });
    }
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType,
        dialogTitle: `Save ${filename}`,
      });
    }
  }
};