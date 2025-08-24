import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Account, Category, Currency, DataState, DataContextType } from '@/types';

const STORAGE_KEYS = {
  DATA_STATE: '@finance_data_state',
  HISTORY: '@finance_history',
};

// Default currencies
const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0, isMain: true },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73 },
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
  history: [],
  historyPointer: -1,
  totalBalance: 0,
  currencies: DEFAULT_CURRENCIES,
  mainCurrencyCode: 'USD',
};

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  const [data, setData] = useState<DataState>(initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEYS.DATA_STATE);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        // Ensure currencies exist and have proper structure
        if (!parsedData.currencies || parsedData.currencies.length === 0) {
          parsedData.currencies = DEFAULT_CURRENCIES;
          parsedData.mainCurrencyCode = 'USD';
        }
        setData({ ...initialState, ...parsedData });
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newData: DataState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DATA_STATE, JSON.stringify(newData));
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const createHistorySnapshot = (description: string, actionType: string, entityType?: string, entityName?: string) => {
    const snapshot = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      description,
      actionType,
      entityType,
      entityName,
      data: { ...data },
    };
    
    return snapshot;
  };

  const addToHistory = (description: string, actionType: string, entityType?: string, entityName?: string) => {
    const snapshot = createHistorySnapshot(description, actionType, entityType, entityName);
    const newHistory = [...data.history.slice(0, data.historyPointer + 1), snapshot];
    
    return {
      ...data,
      history: newHistory.slice(-50), // Keep last 50 snapshots
      historyPointer: Math.min(newHistory.length - 1, 49),
    };
  };

  const calculateTotalBalance = (accounts: Account[], currencies: Currency[], mainCurrencyCode: string) => {
    return accounts.reduce((total, account) => {
      const exchangeRate = getExchangeRate(account.currency, mainCurrencyCode);
      return total + (account.balance * exchangeRate);
    }, 0);
  };

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };

    const updatedAccounts = data.accounts.map(account => {
      if (account.id === transaction.accountId) {
        let balanceChange = 0;
        if (transaction.type === 'income' && transaction.isPaid) {
          balanceChange = transaction.amount;
        } else if (transaction.type === 'expense' && transaction.isPaid) {
          balanceChange = -transaction.amount;
        }
        return { ...account, balance: account.balance + balanceChange };
      }
      if (transaction.type === 'transfer' && account.id === transaction.toAccountId && transaction.isPaid) {
        return { ...account, balance: account.balance + transaction.amount };
      }
      return account;
    });

    const newData = {
      ...addToHistory(`Added transaction: ${transaction.description || 'New transaction'}`, 'create', 'transaction', transaction.description),
      transactions: [...data.transactions, newTransaction],
      accounts: updatedAccounts,
      totalBalance: calculateTotalBalance(updatedAccounts, data.currencies, data.mainCurrencyCode),
    };

    setData(newData);
    saveData(newData);
  };

  const updateTransaction = (transaction: Transaction) => {
    const oldTransaction = data.transactions.find(t => t.id === transaction.id);
    if (!oldTransaction) return;

    const updatedTransactions = data.transactions.map(t => 
      t.id === transaction.id ? transaction : t
    );

    // Recalculate account balances
    let updatedAccounts = [...data.accounts];
    
    // Reverse old transaction effects
    if (oldTransaction.isPaid) {
      updatedAccounts = updatedAccounts.map(account => {
        if (account.id === oldTransaction.accountId) {
          let balanceChange = 0;
          if (oldTransaction.type === 'income') {
            balanceChange = -oldTransaction.amount;
          } else if (oldTransaction.type === 'expense') {
            balanceChange = oldTransaction.amount;
          }
          return { ...account, balance: account.balance + balanceChange };
        }
        if (oldTransaction.type === 'transfer' && account.id === oldTransaction.toAccountId) {
          return { ...account, balance: account.balance - oldTransaction.amount };
        }
        return account;
      });
    }

    // Apply new transaction effects
    if (transaction.isPaid) {
      updatedAccounts = updatedAccounts.map(account => {
        if (account.id === transaction.accountId) {
          let balanceChange = 0;
          if (transaction.type === 'income') {
            balanceChange = transaction.amount;
          } else if (transaction.type === 'expense') {
            balanceChange = -transaction.amount;
          }
          return { ...account, balance: account.balance + balanceChange };
        }
        if (transaction.type === 'transfer' && account.id === transaction.toAccountId) {
          return { ...account, balance: account.balance + transaction.amount };
        }
        return account;
      });
    }

    const newData = {
      ...addToHistory(`Updated transaction: ${transaction.description || 'Transaction'}`, 'update', 'transaction', transaction.description),
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      totalBalance: calculateTotalBalance(updatedAccounts, data.currencies, data.mainCurrencyCode),
    };

    setData(newData);
    saveData(newData);
  };

  const deleteTransaction = (id: string) => {
    const transaction = data.transactions.find(t => t.id === id);
    if (!transaction) return;

    const updatedTransactions = data.transactions.filter(t => t.id !== id);
    
    // Reverse transaction effects on account balance
    let updatedAccounts = [...data.accounts];
    if (transaction.isPaid) {
      updatedAccounts = updatedAccounts.map(account => {
        if (account.id === transaction.accountId) {
          let balanceChange = 0;
          if (transaction.type === 'income') {
            balanceChange = -transaction.amount;
          } else if (transaction.type === 'expense') {
            balanceChange = transaction.amount;
          }
          return { ...account, balance: account.balance + balanceChange };
        }
        if (transaction.type === 'transfer' && account.id === transaction.toAccountId) {
          return { ...account, balance: account.balance - transaction.amount };
        }
        return account;
      });
    }

    const newData = {
      ...addToHistory(`Deleted transaction: ${transaction.description || 'Transaction'}`, 'delete', 'transaction', transaction.description),
      transactions: updatedTransactions,
      accounts: updatedAccounts,
      totalBalance: calculateTotalBalance(updatedAccounts, data.currencies, data.mainCurrencyCode),
    };

    setData(newData);
    saveData(newData);
  };

  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: Date.now().toString(),
    };

    const updatedAccounts = [...data.accounts, newAccount];
    const newData = {
      ...addToHistory(`Added account: ${account.name}`, 'create', 'account', account.name),
      accounts: updatedAccounts,
      totalBalance: calculateTotalBalance(updatedAccounts, data.currencies, data.mainCurrencyCode),
    };

    setData(newData);
    saveData(newData);
  };

  const updateAccount = (account: Account) => {
    const updatedAccounts = data.accounts.map(a => 
      a.id === account.id ? account : a
    );

    const newData = {
      ...addToHistory(`Updated account: ${account.name}`, 'update', 'account', account.name),
      accounts: updatedAccounts,
      totalBalance: calculateTotalBalance(updatedAccounts, data.currencies, data.mainCurrencyCode),
    };

    setData(newData);
    saveData(newData);
  };

  const deleteAccount = (id: string, action: 'delete' | 'move' = 'delete', targetAccountId?: string) => {
    const account = data.accounts.find(a => a.id === id);
    if (!account) return;

    let updatedTransactions = [...data.transactions];
    
    if (action === 'move' && targetAccountId) {
      // Move transactions to target account
      updatedTransactions = updatedTransactions.map(t => {
        if (t.accountId === id) {
          return { ...t, accountId: targetAccountId };
        }
        if (t.toAccountId === id) {
          return { ...t, toAccountId: targetAccountId };
        }
        return t;
      });
    } else {
      // Delete transactions
      updatedTransactions = updatedTransactions.filter(t => 
        t.accountId !== id && t.toAccountId !== id
      );
    }

    const updatedAccounts = data.accounts.filter(a => a.id !== id);
    const newData = {
      ...addToHistory(`Deleted account: ${account.name}`, 'delete', 'account', account.name),
      accounts: updatedAccounts,
      transactions: updatedTransactions,
      totalBalance: calculateTotalBalance(updatedAccounts, data.currencies, data.mainCurrencyCode),
    };

    setData(newData);
    saveData(newData);
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
    };

    const newData = {
      ...addToHistory(`Added category: ${category.name}`, 'create', 'category', category.name),
      categories: [...data.categories, newCategory],
    };

    setData(newData);
    saveData(newData);
  };

  const updateCategory = (category: Category) => {
    const updatedCategories = data.categories.map(c => 
      c.id === category.id ? category : c
    );

    const newData = {
      ...addToHistory(`Updated category: ${category.name}`, 'update', 'category', category.name),
      categories: updatedCategories,
    };

    setData(newData);
    saveData(newData);
  };

  const deleteCategory = (id: string) => {
    const category = data.categories.find(c => c.id === id);
    if (!category) return;

    const newData = {
      ...addToHistory(`Deleted category: ${category.name}`, 'delete', 'category', category.name),
      categories: data.categories.filter(c => c.id !== id),
    };

    setData(newData);
    saveData(newData);
  };

  const addCurrency = (currency: Omit<Currency, 'rate' | 'isMain'> & { rate: number }) => {
    const newCurrency: Currency = {
      ...currency,
      isMain: false,
    };

    const newData = {
      ...data,
      currencies: [...data.currencies, newCurrency],
    };

    setData(newData);
    saveData(newData);
  };

  const updateCurrency = (currency: Currency) => {
    const updatedCurrencies = data.currencies.map(c => 
      c.code === currency.code ? currency : c
    );

    const newData = {
      ...data,
      currencies: updatedCurrencies,
    };

    setData(newData);
    saveData(newData);
  };

  const deleteCurrency = (code: string) => {
    const newData = {
      ...data,
      currencies: data.currencies.filter(c => c.code !== code),
    };

    setData(newData);
    saveData(newData);
  };

  const setMainCurrency = (code: string) => {
    const updatedCurrencies = data.currencies.map(c => ({
      ...c,
      isMain: c.code === code,
    }));

    const newData = {
      ...data,
      currencies: updatedCurrencies,
      mainCurrencyCode: code,
      totalBalance: calculateTotalBalance(data.accounts, updatedCurrencies, code),
    };

    setData(newData);
    saveData(newData);
  };

  const getExchangeRate = (fromCurrencyCode: string, toCurrencyCode: string): number => {
    if (fromCurrencyCode === toCurrencyCode) return 1;
    
    const fromCurrency = data.currencies.find(c => c.code === fromCurrencyCode);
    const toCurrency = data.currencies.find(c => c.code === toCurrencyCode);
    
    if (!fromCurrency || !toCurrency) return 1;
    
    // Convert through USD as base
    return fromCurrency.rate / toCurrency.rate;
  };

  const toggleTransactionPaidStatus = (id: string) => {
    const transaction = data.transactions.find(t => t.id === id);
    if (!transaction) return;

    const updatedTransaction = { ...transaction, isPaid: !transaction.isPaid };
    updateTransaction(updatedTransaction);
  };

  const undo = () => {
    if (data.historyPointer > 0) {
      const newPointer = data.historyPointer - 1;
      const previousState = data.history[newPointer];
      if (previousState) {
        const newData = {
          ...previousState.data,
          historyPointer: newPointer,
        };
        setData(newData);
        saveData(newData);
      }
    }
  };

  const redo = () => {
    if (data.historyPointer < data.history.length - 1) {
      const newPointer = data.historyPointer + 1;
      const nextState = data.history[newPointer];
      if (nextState) {
        const newData = {
          ...nextState.data,
          historyPointer: newPointer,
        };
        setData(newData);
        saveData(newData);
      }
    }
  };

  const restoreToSnapshot = (snapshotId: string) => {
    const snapshot = data.history.find(h => h.id === snapshotId);
    if (snapshot) {
      const newData = {
        ...snapshot.data,
        historyPointer: data.history.findIndex(h => h.id === snapshotId),
      };
      setData(newData);
      saveData(newData);
    }
  };

  const clearHistory = () => {
    const newData = {
      ...data,
      history: [],
      historyPointer: -1,
    };
    setData(newData);
    saveData(newData);
  };

  const exportData = async (): Promise<string> => {
    return JSON.stringify(data, null, 2);
  };

  const importData = async (jsonData: string) => {
    try {
      const importedData = JSON.parse(jsonData);
      // Validate and merge with current structure
      const newData = {
        ...initialState,
        ...importedData,
        currencies: importedData.currencies || DEFAULT_CURRENCIES,
        mainCurrencyCode: importedData.mainCurrencyCode || 'USD',
      };
      setData(newData);
      await saveData(newData);
    } catch (error) {
      throw new Error('Invalid backup file format');
    }
  };

  // Computed values
  const getRecentTransactions = (limit: number = 10) => {
    return [...data.transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  };

  const paidIncome = data.transactions
    .filter(t => t.type === 'income' && t.isPaid)
    .reduce((sum, t) => sum + (t.amount * getExchangeRate(t.currency || data.mainCurrencyCode, data.mainCurrencyCode)), 0);

  const paidExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.isPaid)
    .reduce((sum, t) => sum + (t.amount * getExchangeRate(t.currency || data.mainCurrencyCode, data.mainCurrencyCode)), 0);

  const unpaidIncome = data.transactions
    .filter(t => t.type === 'income' && !t.isPaid)
    .reduce((sum, t) => sum + (t.amount * getExchangeRate(t.currency || data.mainCurrencyCode, data.mainCurrencyCode)), 0);

  const unpaidExpenses = data.transactions
    .filter(t => t.type === 'expense' && !t.isPaid)
    .reduce((sum, t) => sum + (t.amount * getExchangeRate(t.currency || data.mainCurrencyCode, data.mainCurrencyCode)), 0);

  const contextValue: DataContextType = {
    data,
    addTransaction,
    updateTransaction,
    deleteTransaction,
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
    // Computed properties
    accounts: data.accounts,
    transactions: data.transactions,
    categories: data.categories,
    currencies: data.currencies,
    mainCurrencyCode: data.mainCurrencyCode,
    totalBalance: data.totalBalance,
    getRecentTransactions,
    paidIncome,
    paidExpenses,
    unpaidIncome,
    unpaidExpenses,
    toggleTransactionPaidStatus,
    historySnapshots: data.history,
    canUndo: data.historyPointer > 0,
    canRedo: data.historyPointer < data.history.length - 1,
    restoreToSnapshot,
    clearHistory,
    exportData,
    importData,
  };

  if (isLoading) {
    return null; // or a loading spinner
  }

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