import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Account, Category, Currency } from '@/types';

interface HistorySnapshot {
  id: string;
  timestamp: Date;
  description: string;
  actionType: 'create' | 'update' | 'delete' | 'import';
  entityType: 'transaction' | 'account' | 'category' | 'currency';
  entityName?: string;
  data: DataState;
}

interface DataState {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  totalBalance: number;
}

interface DataContextType {
  // State
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  totalBalance: number;
  paidIncome: number;
  paidExpenses: number;
  unpaidIncome: number;
  unpaidExpenses: number;
  
  // History
  historySnapshots: HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;
  
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  toggleTransactionPaidStatus: (id: string) => void;
  getRecentTransactions: (limit: number) => Transaction[];
  
  // Account methods
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string, action: 'delete' | 'move', targetAccountId?: string) => void;
  
  // Category methods
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  
  // Currency methods
  addCurrency: (currency: Omit<Currency, 'isMain'>) => void;
  updateCurrency: (currency: Currency) => void;
  deleteCurrency: (code: string) => void;
  setMainCurrency: (code: string) => void;
  getExchangeRate: (fromCurrencyCode: string, toCurrencyCode: string) => number;
  
  // History methods
  undo: () => void;
  redo: () => void;
  restoreToSnapshot: (snapshotId: string) => void;
  clearHistory: () => void;
  
  // Data management
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<void>;
}

const STORAGE_KEY = '@finance_data';
const HISTORY_KEY = '@finance_history';

// Default currencies with realistic exchange rates
const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, isMain: true },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.75 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.35 },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.92 },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 6.45 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 74.5 },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', rate: 200.0 },
];

const initialState: DataState = {
  transactions: [],
  accounts: [],
  categories: [],
  currencies: DEFAULT_CURRENCIES,
  mainCurrencyCode: 'USD',
  totalBalance: 0,
};

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [data, setData] = useState<DataState>(initialState);
  const [historySnapshots, setHistorySnapshots] = useState<HistorySnapshot[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // Load data on mount
  useEffect(() => {
    loadData();
    loadHistory();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    saveData();
  }, [data]);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setData({
          ...initialState,
          ...parsedData,
          currencies: parsedData.currencies || DEFAULT_CURRENCIES,
          mainCurrencyCode: parsedData.mainCurrencyCode || 'USD',
        });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setHistorySnapshots(parsedHistory.snapshots || []);
        setHistoryPointer(parsedHistory.pointer || -1);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const saveHistory = async (snapshots: HistorySnapshot[], pointer: number) => {
    try {
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify({
        snapshots,
        pointer,
      }));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const createSnapshot = (description: string, actionType: HistorySnapshot['actionType'], entityType: HistorySnapshot['entityType'], entityName?: string) => {
    const snapshot: HistorySnapshot = {
      id: Math.random().toString(),
      timestamp: new Date(),
      description,
      actionType,
      entityType,
      entityName,
      data: { ...data },
    };

    // Remove any snapshots after current pointer (for branching)
    const newSnapshots = [...historySnapshots.slice(0, historyPointer + 1), snapshot];
    
    // Limit history to 50 snapshots
    if (newSnapshots.length > 50) {
      newSnapshots.shift();
    } else {
      setHistoryPointer(prev => prev + 1);
    }
    
    setHistorySnapshots(newSnapshots);
    saveHistory(newSnapshots, historyPointer + 1);
  };

  const calculateTotalBalance = (accounts: Account[], currencies: Currency[], mainCurrencyCode: string) => {
    return accounts.reduce((total, account) => {
      const exchangeRate = getExchangeRateStatic(account.currency, mainCurrencyCode, currencies);
      return total + (account.balance * exchangeRate);
    }, 0);
  };

  const getExchangeRateStatic = (fromCurrencyCode: string, toCurrencyCode: string, currencies: Currency[]) => {
    if (fromCurrencyCode === toCurrencyCode) return 1;
    
    const fromCurrency = currencies.find(c => c.code === fromCurrencyCode);
    const toCurrency = currencies.find(c => c.code === toCurrencyCode);
    
    if (!fromCurrency || !toCurrency) return 1;
    
    // Convert through USD as base
    return fromCurrency.rate / toCurrency.rate;
  };

  const updateData = (newData: Partial<DataState>) => {
    const updatedData = { ...data, ...newData };
    updatedData.totalBalance = calculateTotalBalance(updatedData.accounts, updatedData.currencies, updatedData.mainCurrencyCode);
    setData(updatedData);
  };

  // Transaction methods
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(),
    };

    const updatedTransactions = [...data.transactions, newTransaction];
    const updatedAccounts = [...data.accounts];

    // Update account balances only for paid transactions
    if (newTransaction.isPaid) {
      if (newTransaction.type === 'income') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === newTransaction.accountId);
        if (accountIndex !== -1) {
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance + newTransaction.amount,
          };
        }
      } else if (newTransaction.type === 'expense') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === newTransaction.accountId);
        if (accountIndex !== -1) {
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance - newTransaction.amount,
          };
        }
      } else if (newTransaction.type === 'transfer' && newTransaction.toAccountId) {
        const fromAccountIndex = updatedAccounts.findIndex(a => a.id === newTransaction.accountId);
        const toAccountIndex = updatedAccounts.findIndex(a => a.id === newTransaction.toAccountId);
        
        if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
          updatedAccounts[fromAccountIndex] = {
            ...updatedAccounts[fromAccountIndex],
            balance: updatedAccounts[fromAccountIndex].balance - newTransaction.amount,
          };
          updatedAccounts[toAccountIndex] = {
            ...updatedAccounts[toAccountIndex],
            balance: updatedAccounts[toAccountIndex].balance + newTransaction.amount,
          };
        }
      }
    }

    updateData({ transactions: updatedTransactions, accounts: updatedAccounts });
    createSnapshot(
      `Added ${newTransaction.type}: ${newTransaction.description || getCategoryDisplayForSnapshot(newTransaction)}`,
      'create',
      'transaction',
      newTransaction.description || getCategoryDisplayForSnapshot(newTransaction)
    );
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    const oldTransaction = data.transactions.find(t => t.id === updatedTransaction.id);
    if (!oldTransaction) return;

    const updatedTransactions = data.transactions.map(t =>
      t.id === updatedTransaction.id ? updatedTransaction : t
    );

    const updatedAccounts = [...data.accounts];

    // Revert old transaction effects (only if it was paid)
    if (oldTransaction.isPaid) {
      if (oldTransaction.type === 'income') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === oldTransaction.accountId);
        if (accountIndex !== -1) {
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance - oldTransaction.amount,
          };
        }
      } else if (oldTransaction.type === 'expense') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === oldTransaction.accountId);
        if (accountIndex !== -1) {
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance + oldTransaction.amount,
          };
        }
      } else if (oldTransaction.type === 'transfer' && oldTransaction.toAccountId) {
        const fromAccountIndex = updatedAccounts.findIndex(a => a.id === oldTransaction.accountId);
        const toAccountIndex = updatedAccounts.findIndex(a => a.id === oldTransaction.toAccountId);
        
        if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
          updatedAccounts[fromAccountIndex] = {
            ...updatedAccounts[fromAccountIndex],
            balance: updatedAccounts[fromAccountIndex].balance + oldTransaction.amount,
          };
          updatedAccounts[toAccountIndex] = {
            ...updatedAccounts[toAccountIndex],
            balance: updatedAccounts[toAccountIndex].balance - oldTransaction.amount,
          };
        }
      }
    }

    // Apply new transaction effects (only if it's paid)
    if (updatedTransaction.isPaid) {
      if (updatedTransaction.type === 'income') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === updatedTransaction.accountId);
        if (accountIndex !== -1) {
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance + updatedTransaction.amount,
          };
        }
      } else if (updatedTransaction.type === 'expense') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === updatedTransaction.accountId);
        if (accountIndex !== -1) {
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance - updatedTransaction.amount,
          };
        }
      } else if (updatedTransaction.type === 'transfer' && updatedTransaction.toAccountId) {
        const fromAccountIndex = updatedAccounts.findIndex(a => a.id === updatedTransaction.accountId);
        const toAccountIndex = updatedAccounts.findIndex(a => a.id === updatedTransaction.toAccountId);
        
        if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
          updatedAccounts[fromAccountIndex] = {
            ...updatedAccounts[fromAccountIndex],
            balance: updatedAccounts[fromAccountIndex].balance - updatedTransaction.amount,
          };
          updatedAccounts[toAccountIndex] = {
            ...updatedAccounts[toAccountIndex],
            balance: updatedAccounts[toAccountIndex].balance + updatedTransaction.amount,
          };
        }
      }
    }

    updateData({ transactions: updatedTransactions, accounts: updatedAccounts });
    createSnapshot(
      `Updated ${updatedTransaction.type}: ${updatedTransaction.description || getCategoryDisplayForSnapshot(updatedTransaction)}`,
      'update',
      'transaction',
      updatedTransaction.description || getCategoryDisplayForSnapshot(updatedTransaction)
    );
  };

  const deleteTransaction = (id: string) => {
    const transaction = data.transactions.find(t => t.id === id);
    if (!transaction) return;

    const updatedTransactions = data.transactions.filter(t => t.id !== id);
    const updatedAccounts = [...data.accounts];

    // Revert transaction effects on account balances (only if it was paid)
    if (transaction.isPaid) {
      if (transaction.type === 'income') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        if (accountIndex !== -1) {
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance - transaction.amount,
          };
        }
      } else if (transaction.type === 'expense') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        if (accountIndex !== -1) {
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance + transaction.amount,
          };
        }
      } else if (transaction.type === 'transfer' && transaction.toAccountId) {
        const fromAccountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        const toAccountIndex = updatedAccounts.findIndex(a => a.id === transaction.toAccountId);
        
        if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
          updatedAccounts[fromAccountIndex] = {
            ...updatedAccounts[fromAccountIndex],
            balance: updatedAccounts[fromAccountIndex].balance + transaction.amount,
          };
          updatedAccounts[toAccountIndex] = {
            ...updatedAccounts[toAccountIndex],
            balance: updatedAccounts[toAccountIndex].balance - transaction.amount,
          };
        }
      }
    }

    updateData({ transactions: updatedTransactions, accounts: updatedAccounts });
    createSnapshot(
      `Deleted ${transaction.type}: ${transaction.description || getCategoryDisplayForSnapshot(transaction)}`,
      'delete',
      'transaction',
      transaction.description || getCategoryDisplayForSnapshot(transaction)
    );
  };

  const toggleTransactionPaidStatus = (id: string) => {
    const transaction = data.transactions.find(t => t.id === id);
    if (!transaction) return;

    const updatedTransaction = { ...transaction, isPaid: !transaction.isPaid };
    updateTransaction(updatedTransaction);
  };

  const getRecentTransactions = (limit: number) => {
    return data.transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  // Account methods
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: Math.random().toString(),
    };

    const updatedAccounts = [...data.accounts, newAccount];
    updateData({ accounts: updatedAccounts });
    createSnapshot(
      `Added account: ${newAccount.name}`,
      'create',
      'account',
      newAccount.name
    );
  };

  const updateAccount = (updatedAccount: Account) => {
    const updatedAccounts = data.accounts.map(a =>
      a.id === updatedAccount.id ? updatedAccount : a
    );
    updateData({ accounts: updatedAccounts });
    createSnapshot(
      `Updated account: ${updatedAccount.name}`,
      'update',
      'account',
      updatedAccount.name
    );
  };

  const deleteAccount = (id: string, action: 'delete' | 'move', targetAccountId?: string) => {
    const account = data.accounts.find(a => a.id === id);
    if (!account) return;

    let updatedTransactions = [...data.transactions];
    
    if (action === 'move' && targetAccountId) {
      // Move all transactions to target account
      updatedTransactions = data.transactions.map(transaction => {
        if (transaction.accountId === id) {
          return { ...transaction, accountId: targetAccountId };
        }
        if (transaction.toAccountId === id) {
          return { ...transaction, toAccountId: targetAccountId };
        }
        return transaction;
      });
    } else {
      // Delete all transactions associated with this account
      updatedTransactions = data.transactions.filter(t => 
        t.accountId !== id && t.toAccountId !== id
      );
    }

    const updatedAccounts = data.accounts.filter(a => a.id !== id);
    updateData({ transactions: updatedTransactions, accounts: updatedAccounts });
    createSnapshot(
      `Deleted account: ${account.name}`,
      'delete',
      'account',
      account.name
    );
  };

  // Category methods
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Math.random().toString(),
    };

    const updatedCategories = [...data.categories, newCategory];
    updateData({ categories: updatedCategories });
    createSnapshot(
      `Added category: ${newCategory.name}`,
      'create',
      'category',
      newCategory.name
    );
  };

  const updateCategory = (updatedCategory: Category) => {
    const updatedCategories = data.categories.map(c =>
      c.id === updatedCategory.id ? updatedCategory : c
    );
    updateData({ categories: updatedCategories });
    createSnapshot(
      `Updated category: ${updatedCategory.name}`,
      'update',
      'category',
      updatedCategory.name
    );
  };

  const deleteCategory = (id: string) => {
    const category = data.categories.find(c => c.id === id);
    if (!category) return;

    const updatedCategories = data.categories.filter(c => c.id !== id);
    updateData({ categories: updatedCategories });
    createSnapshot(
      `Deleted category: ${category.name}`,
      'delete',
      'category',
      category.name
    );
  };

  // Currency methods
  const addCurrency = (currency: Omit<Currency, 'isMain'>) => {
    const newCurrency: Currency = {
      ...currency,
      isMain: false,
    };

    const updatedCurrencies = [...data.currencies, newCurrency];
    updateData({ currencies: updatedCurrencies });
    createSnapshot(
      `Added currency: ${newCurrency.name}`,
      'create',
      'currency',
      newCurrency.name
    );
  };

  const updateCurrency = (updatedCurrency: Currency) => {
    const updatedCurrencies = data.currencies.map(c =>
      c.code === updatedCurrency.code ? updatedCurrency : c
    );
    updateData({ currencies: updatedCurrencies });
    createSnapshot(
      `Updated currency: ${updatedCurrency.name}`,
      'update',
      'currency',
      updatedCurrency.name
    );
  };

  const deleteCurrency = (code: string) => {
    const currency = data.currencies.find(c => c.code === code);
    if (!currency || currency.isMain) return;

    const updatedCurrencies = data.currencies.filter(c => c.code !== code);
    updateData({ currencies: updatedCurrencies });
    createSnapshot(
      `Deleted currency: ${currency.name}`,
      'delete',
      'currency',
      currency.name
    );
  };

  const setMainCurrency = (code: string) => {
    const updatedCurrencies = data.currencies.map(c => ({
      ...c,
      isMain: c.code === code,
    }));
    updateData({ currencies: updatedCurrencies, mainCurrencyCode: code });
    
    const currency = data.currencies.find(c => c.code === code);
    createSnapshot(
      `Set main currency: ${currency?.name}`,
      'update',
      'currency',
      currency?.name
    );
  };

  const getExchangeRate = (fromCurrencyCode: string, toCurrencyCode: string) => {
    return getExchangeRateStatic(fromCurrencyCode, toCurrencyCode, data.currencies);
  };

  // History methods
  const undo = () => {
    if (historyPointer >= 0) {
      const snapshot = historySnapshots[historyPointer];
      setData(snapshot.data);
      setHistoryPointer(prev => prev - 1);
    }
  };

  const redo = () => {
    if (historyPointer < historySnapshots.length - 1) {
      const snapshot = historySnapshots[historyPointer + 1];
      setData(snapshot.data);
      setHistoryPointer(prev => prev + 1);
    }
  };

  const restoreToSnapshot = (snapshotId: string) => {
    const snapshotIndex = historySnapshots.findIndex(s => s.id === snapshotId);
    if (snapshotIndex !== -1) {
      const snapshot = historySnapshots[snapshotIndex];
      setData(snapshot.data);
      setHistoryPointer(snapshotIndex);
    }
  };

  const clearHistory = () => {
    setHistorySnapshots([]);
    setHistoryPointer(-1);
    saveHistory([], -1);
  };

  // Data management
  const exportData = async (): Promise<string> => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data,
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importData = async (jsonData: string): Promise<void> => {
    try {
      const importedData = JSON.parse(jsonData);
      
      if (importedData.data) {
        const newData = {
          ...initialState,
          ...importedData.data,
          currencies: importedData.data.currencies || DEFAULT_CURRENCIES,
          mainCurrencyCode: importedData.data.mainCurrencyCode || 'USD',
        };
        setData(newData);
        createSnapshot('Imported data from backup', 'import', 'account');
      }
    } catch (error) {
      throw new Error('Invalid backup file format');
    }
  };

  // Helper function for snapshot descriptions
  const getCategoryDisplayForSnapshot = (transaction: Transaction) => {
    if (transaction.type === 'transfer') return 'Transfer';
    if (transaction.category && transaction.subcategory) {
      return `${transaction.category} • ${transaction.subcategory}`;
    }
    return transaction.category || 'Uncategorized';
  };

  // Calculate derived values
  const paidIncome = data.transactions
    .filter(t => t.type === 'income' && t.isPaid)
    .reduce((sum, t) => {
      const convertedAmount = t.amount * getExchangeRate(t.currency || data.mainCurrencyCode, data.mainCurrencyCode);
      return sum + convertedAmount;
    }, 0);

  const paidExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.isPaid)
    .reduce((sum, t) => {
      const convertedAmount = t.amount * getExchangeRate(t.currency || data.mainCurrencyCode, data.mainCurrencyCode);
      return sum + convertedAmount;
    }, 0);

  const unpaidIncome = data.transactions
    .filter(t => t.type === 'income' && !t.isPaid)
    .reduce((sum, t) => {
      const convertedAmount = t.amount * getExchangeRate(t.currency || data.mainCurrencyCode, data.mainCurrencyCode);
      return sum + convertedAmount;
    }, 0);

  const unpaidExpenses = data.transactions
    .filter(t => t.type === 'expense' && !t.isPaid)
    .reduce((sum, t) => {
      const convertedAmount = t.amount * getExchangeRate(t.currency || data.mainCurrencyCode, data.mainCurrencyCode);
      return sum + convertedAmount;
    }, 0);

  const contextValue: DataContextType = {
    // State
    transactions: data.transactions,
    accounts: data.accounts,
    categories: data.categories,
    currencies: data.currencies,
    mainCurrencyCode: data.mainCurrencyCode,
    totalBalance: data.totalBalance,
    paidIncome,
    paidExpenses,
    unpaidIncome,
    unpaidExpenses,
    
    // History
    historySnapshots,
    canUndo: historyPointer >= 0,
    canRedo: historyPointer < historySnapshots.length - 1,
    
    // Methods
    addTransaction,
    updateTransaction,
    deleteTransaction,
    toggleTransactionPaidStatus,
    getRecentTransactions,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addCurrency,
    updateCurrency,
    deleteCurrency,
    setMainCurrency,
    getExchangeRate,
    undo,
    redo,
    restoreToSnapshot,
    clearHistory,
    exportData,
    importData,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};