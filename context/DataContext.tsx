import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getItem, setItem, StorageKeys } from '@/utils/storage';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'cash' | 'investment';
  balance: number;
  currency: string;
  color: string;
  icon: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  subcategories?: string[];
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  categoryId: string;
  accountId: string;
  date: string;
  type: 'income' | 'expense';
  createdAt: string;
}

export interface Budget {
  categoryId: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
}

export interface UserProfile {
  name: string;
  email: string;
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  onboardingCompleted: boolean;
}

interface DataContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  userProfile: UserProfile | null;
  addAccount: (account: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (budget: Budget) => void;
  deleteBudget: (categoryId: string) => void;
  setUserProfile: (profile: UserProfile) => void;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);

  // Load data from storage on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [
        storedAccounts,
        storedCategories,
        storedTransactions,
        storedBudgets,
        storedProfile
      ] = await Promise.all([
        getItem(StorageKeys.ACCOUNTS),
        getItem(StorageKeys.CATEGORIES),
        getItem(StorageKeys.TRANSACTIONS),
        getItem(StorageKeys.BUDGETS),
        getItem(StorageKeys.USER_PROFILE)
      ]);

      if (storedAccounts) setAccounts(storedAccounts);
      if (storedCategories) setCategories(storedCategories);
      if (storedTransactions) setTransactions(storedTransactions);
      if (storedBudgets) setBudgets(storedBudgets);
      if (storedProfile) setUserProfileState(storedProfile);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addAccount = async (accountData: Omit<Account, 'id' | 'createdAt'>) => {
    const newAccount: Account = {
      ...accountData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    await setItem(StorageKeys.ACCOUNTS, updatedAccounts);
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    const updatedAccounts = accounts.map(account =>
      account.id === id ? { ...account, ...updates } : account
    );
    setAccounts(updatedAccounts);
    await setItem(StorageKeys.ACCOUNTS, updatedAccounts);
  };

  const deleteAccount = async (id: string) => {
    const updatedAccounts = accounts.filter(account => account.id !== id);
    setAccounts(updatedAccounts);
    await setItem(StorageKeys.ACCOUNTS, updatedAccounts);
    
    // Also remove transactions for this account
    const updatedTransactions = transactions.filter(transaction => transaction.accountId !== id);
    setTransactions(updatedTransactions);
    await setItem(StorageKeys.TRANSACTIONS, updatedTransactions);
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: Date.now().toString(),
    };
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    await setItem(StorageKeys.CATEGORIES, updatedCategories);
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    const updatedCategories = categories.map(category =>
      category.id === id ? { ...category, ...updates } : category
    );
    setCategories(updatedCategories);
    await setItem(StorageKeys.CATEGORIES, updatedCategories);
  };

  const deleteCategory = async (id: string) => {
    const updatedCategories = categories.filter(category => category.id !== id);
    setCategories(updatedCategories);
    await setItem(StorageKeys.CATEGORIES, updatedCategories);
    
    // Also remove transactions for this category
    const updatedTransactions = transactions.filter(transaction => transaction.categoryId !== id);
    setTransactions(updatedTransactions);
    await setItem(StorageKeys.TRANSACTIONS, updatedTransactions);
  };

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transactionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    await setItem(StorageKeys.TRANSACTIONS, updatedTransactions);

    // Update account balance
    const account = accounts.find(acc => acc.id === transactionData.accountId);
    if (account) {
      const balanceChange = transactionData.type === 'income' 
        ? transactionData.amount 
        : -transactionData.amount;
      await updateAccount(account.id, { 
        balance: account.balance + balanceChange 
      });
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    const oldTransaction = transactions.find(t => t.id === id);
    if (!oldTransaction) return;

    const updatedTransactions = transactions.map(transaction =>
      transaction.id === id ? { ...transaction, ...updates } : transaction
    );
    setTransactions(updatedTransactions);
    await setItem(StorageKeys.TRANSACTIONS, updatedTransactions);

    // Update account balance if amount or type changed
    if (updates.amount !== undefined || updates.type !== undefined) {
      const account = accounts.find(acc => acc.id === oldTransaction.accountId);
      if (account) {
        // Reverse old transaction
        const oldBalanceChange = oldTransaction.type === 'income' 
          ? -oldTransaction.amount 
          : oldTransaction.amount;
        
        // Apply new transaction
        const newTransaction = { ...oldTransaction, ...updates };
        const newBalanceChange = newTransaction.type === 'income' 
          ? newTransaction.amount 
          : -newTransaction.amount;
        
        await updateAccount(account.id, { 
          balance: account.balance + oldBalanceChange + newBalanceChange 
        });
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    const updatedTransactions = transactions.filter(t => t.id !== id);
    setTransactions(updatedTransactions);
    await setItem(StorageKeys.TRANSACTIONS, updatedTransactions);

    // Update account balance
    const account = accounts.find(acc => acc.id === transaction.accountId);
    if (account) {
      const balanceChange = transaction.type === 'income' 
        ? -transaction.amount 
        : transaction.amount;
      await updateAccount(account.id, { 
        balance: account.balance + balanceChange 
      });
    }
  };

  const setBudget = async (budget: Budget) => {
    const updatedBudgets = budgets.filter(b => b.categoryId !== budget.categoryId);
    updatedBudgets.push(budget);
    setBudgets(updatedBudgets);
    await setItem(StorageKeys.BUDGETS, updatedBudgets);
  };

  const deleteBudget = async (categoryId: string) => {
    const updatedBudgets = budgets.filter(b => b.categoryId !== categoryId);
    setBudgets(updatedBudgets);
    await setItem(StorageKeys.BUDGETS, updatedBudgets);
  };

  const setUserProfile = async (profile: UserProfile) => {
    setUserProfileState(profile);
    await setItem(StorageKeys.USER_PROFILE, profile);
  };

  const clearAllData = async () => {
    setAccounts([]);
    setCategories([]);
    setTransactions([]);
    setBudgets([]);
    setUserProfileState(null);
    
    await Promise.all([
      setItem(StorageKeys.ACCOUNTS, []),
      setItem(StorageKeys.CATEGORIES, []),
      setItem(StorageKeys.TRANSACTIONS, []),
      setItem(StorageKeys.BUDGETS, []),
      setItem(StorageKeys.USER_PROFILE, null)
    ]);
  };

  const value: DataContextType = {
    accounts,
    categories,
    transactions,
    budgets,
    userProfile,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudget,
    deleteBudget,
    setUserProfile,
    clearAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};