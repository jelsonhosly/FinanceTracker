import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TransactionType, Account, Transaction, Category, Subcategory, Currency } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the data state structure
interface DataState {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
}

// Snapshot metadata for history tracking
interface SnapshotMetadata {
  id: string;
  timestamp: Date;
  description: string;
  actionType: 'create' | 'update' | 'delete' | 'import';
  entityType: 'account' | 'transaction' | 'category' | 'data';
  entityName?: string;
}

// History state structure
interface HistoryState {
  past: DataState[];
  present: DataState;
  future: DataState[];
  snapshotMetadata: SnapshotMetadata[];
}

interface DataContextType {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  currencies: Currency[];
  mainCurrencyCode: string;
  totalBalance: number;
  paidIncome: number;
  paidExpenses: number;
  unpaidIncome: number;
  unpaidExpenses: number;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string, option?: 'delete' | 'move', targetAccountId?: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  toggleTransactionPaidStatus: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, subcategory: Omit<Subcategory, 'id'>) => void;
  updateSubcategory: (categoryId: string, subcategory: Subcategory) => void;
  deleteSubcategory: (categoryId: string, subcategoryId: string) => void;
  getRecentTransactions: (count: number) => Transaction[];
  getCategoriesForType: (type: 'income' | 'expense') => Category[];
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;
  // Currency management functions
  addCurrency: (currency: Omit<Currency, 'isMain'>) => void;
  updateCurrency: (currency: Currency) => void;
  deleteCurrency: (code: string) => void;
  setMainCurrency: (code: string) => void;
  getExchangeRate: (fromCurrencyCode: string, toCurrencyCode: string) => number;
  // History functions
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  historySnapshots: SnapshotMetadata[];
  restoreToSnapshot: (snapshotId: string) => void;
  clearHistory: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial currencies with exchange rates relative to USD
const initialCurrencies: Currency[] = [
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

// Initial demo data
const initialAccounts: Account[] = [
  {
    id: '1',
    name: 'Main Checking',
    balance: 2450.75,
    type: 'checking',
    currency: 'USD',
    color: '#0A84FF',
    lucideIconName: 'Landmark',
  },
  {
    id: '2',
    name: 'Savings',
    balance: 5780.25,
    type: 'savings',
    currency: 'USD',
    color: '#5E5CE6',
    lucideIconName: 'PiggyBank',
  },
  {
    id: '3',
    name: 'Cash',
    balance: 350.00,
    type: 'cash',
    currency: 'USD',
    color: '#30D158',
    lucideIconName: 'Wallet',
  },
  {
    id: '4',
    name: 'Credit Card',
    balance: -750.50,
    type: 'credit',
    currency: 'USD',
    color: '#FF9F0A',
    lucideIconName: 'CreditCard',
  },
];

// Generate comprehensive dummy transactions for the past 3 months
const generateDummyTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const currentDate = new Date();
  
  // Helper function to get random date within last N days
  const getRandomDate = (daysBack: number) => {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date;
  };

  // Helper function to get random amount within range
  const getRandomAmount = (min: number, max: number) => {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
  };

  let transactionId = 1;

  // Monthly salary (income) - last 3 months - PAID
  for (let month = 0; month < 3; month++) {
    const salaryDate = new Date();
    salaryDate.setMonth(salaryDate.getMonth() - month);
    salaryDate.setDate(1); // First of the month
    
    transactions.push({
      id: (transactionId++).toString(),
      type: 'income',
      amount: getRandomAmount(4500, 5200),
      currency: 'USD',
      description: 'Monthly Salary',
      date: salaryDate.toISOString(),
      accountId: '1',
      category: 'Salary',
      subcategory: 'Full-time',
      isPaid: true,
      isRecurring: true,
      recurringUnit: 'month',
      recurringValue: 1,
    });
  }

  // Upcoming salary (next month) - UNPAID
  const nextSalaryDate = new Date();
  nextSalaryDate.setMonth(nextSalaryDate.getMonth() + 1);
  nextSalaryDate.setDate(1);
  
  transactions.push({
    id: (transactionId++).toString(),
    type: 'income',
    amount: 4800,
    currency: 'USD',
    description: 'Monthly Salary (Upcoming)',
    date: nextSalaryDate.toISOString(),
    accountId: '1',
    category: 'Salary',
    subcategory: 'Full-time',
    isPaid: false,
    isRecurring: true,
    recurringUnit: 'month',
    recurringValue: 1,
  });

  // Freelance income (sporadic) - MIX OF PAID/UNPAID
  for (let i = 0; i < 8; i++) {
    const isPaid = Math.random() > 0.3; // 70% chance of being paid
    transactions.push({
      id: (transactionId++).toString(),
      type: 'income',
      amount: getRandomAmount(200, 800),
      currency: 'USD',
      description: isPaid ? 'Freelance Project' : 'Freelance Project (Pending)',
      date: getRandomDate(90).toISOString(),
      accountId: '1',
      category: 'Freelance',
      subcategory: 'Development',
      isPaid,
    });
  }

  // Investment returns - PAID
  for (let i = 0; i < 5; i++) {
    transactions.push({
      id: (transactionId++).toString(),
      type: 'income',
      amount: getRandomAmount(50, 300),
      currency: 'USD',
      description: 'Dividend Payment',
      date: getRandomDate(90).toISOString(),
      accountId: '2',
      category: 'Investments',
      subcategory: 'Dividends',
      isPaid: true,
    });
  }

  // Regular expenses - Groceries (weekly) - PAID
  for (let week = 0; week < 12; week++) {
    const groceryDate = new Date();
    groceryDate.setDate(groceryDate.getDate() - (week * 7));
    
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(80, 150),
      currency: 'USD',
      description: 'Weekly Groceries',
      date: groceryDate.toISOString(),
      accountId: '1',
      category: 'Food & Drinks',
      subcategory: 'Groceries',
      isPaid: true,
      isRecurring: true,
      recurringUnit: 'week',
      recurringValue: 1,
    });
  }

  // Restaurant expenses - MOSTLY PAID
  for (let i = 0; i < 25; i++) {
    const isPaid = Math.random() > 0.1; // 90% chance of being paid
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(15, 85),
      currency: 'USD',
      description: isPaid ? 'Restaurant' : 'Restaurant (Pending)',
      date: getRandomDate(90).toISOString(),
      accountId: Math.random() > 0.7 ? '3' : '1', // Sometimes cash
      category: 'Food & Drinks',
      subcategory: 'Restaurant',
      isPaid,
    });
  }

  // Coffee purchases - PAID (every 3 days)
  for (let i = 0; i < 30; i++) {
    const coffeeDate = new Date();
    coffeeDate.setDate(coffeeDate.getDate() - (i * 3));
    
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(3, 8),
      currency: 'USD',
      description: 'Coffee',
      date: coffeeDate.toISOString(),
      accountId: Math.random() > 0.5 ? '3' : '4', // Cash or credit
      category: 'Food & Drinks',
      subcategory: 'Coffee',
      isPaid: true,
      isRecurring: true,
      recurringUnit: 'day',
      recurringValue: 3,
    });
  }

  // Transportation - Gas (every 2 weeks) - MOSTLY PAID
  for (let i = 0; i < 6; i++) {
    const gasDate = new Date();
    gasDate.setDate(gasDate.getDate() - (i * 14));
    const isPaid = Math.random() > 0.2; // 80% chance of being paid
    
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(35, 65),
      currency: 'USD',
      description: isPaid ? 'Gas Station' : 'Gas Station (Pending)',
      date: gasDate.toISOString(),
      accountId: '4',
      category: 'Transportation',
      subcategory: 'Gas',
      isPaid,
      isRecurring: true,
      recurringUnit: 'week',
      recurringValue: 2,
    });
  }

  // Public Transit - PAID
  for (let i = 0; i < 20; i++) {
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(2, 15),
      currency: 'USD',
      description: 'Metro/Bus',
      date: getRandomDate(90).toISOString(),
      accountId: '3',
      category: 'Transportation',
      subcategory: 'Public Transit',
      isPaid: true,
    });
  }

  // Uber/Taxi rides - MIX OF PAID/UNPAID
  for (let i = 0; i < 12; i++) {
    const isPaid = Math.random() > 0.3; // 70% chance of being paid
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(12, 45),
      currency: 'USD',
      description: isPaid ? 'Uber Ride' : 'Uber Ride (Pending)',
      date: getRandomDate(90).toISOString(),
      accountId: '1',
      category: 'Transportation',
      subcategory: 'Uber/Taxi',
      isPaid,
    });
  }

  // Monthly rent - PAID (past) + UNPAID (upcoming)
  for (let month = 0; month < 3; month++) {
    const rentDate = new Date();
    rentDate.setMonth(rentDate.getMonth() - month);
    rentDate.setDate(1);
    
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: 1850,
      currency: 'USD',
      description: 'Monthly Rent',
      date: rentDate.toISOString(),
      accountId: '1',
      category: 'Housing',
      subcategory: 'Rent',
      isPaid: true,
      isRecurring: true,
      recurringUnit: 'month',
      recurringValue: 1,
    });
  }

  // Next month's rent - UNPAID
  const nextRentDate = new Date();
  nextRentDate.setMonth(nextRentDate.getMonth() + 1);
  nextRentDate.setDate(1);
  
  transactions.push({
    id: (transactionId++).toString(),
    type: 'expense',
    amount: 1850,
    currency: 'USD',
    description: 'Monthly Rent (Due)',
    date: nextRentDate.toISOString(),
    accountId: '1',
    category: 'Housing',
    subcategory: 'Rent',
    isPaid: false,
    isRecurring: true,
    recurringUnit: 'month',
    recurringValue: 1,
  });

  // Utilities - MIX OF PAID/UNPAID
  const utilityTypes = [
    { name: 'Electricity Bill', subcategory: 'Electricity', amount: [80, 150] },
    { name: 'Water Bill', subcategory: 'Water', amount: [40, 80] },
    { name: 'Internet Bill', subcategory: 'Internet', amount: [60, 90] },
    { name: 'Phone Bill', subcategory: 'Phone', amount: [45, 75] },
  ];

  utilityTypes.forEach(utility => {
    for (let month = 0; month < 3; month++) {
      const utilityDate = new Date();
      utilityDate.setMonth(utilityDate.getMonth() - month);
      utilityDate.setDate(Math.floor(Math.random() * 28) + 1);
      
      const isPaid = month > 0 || Math.random() > 0.4; // Recent bills might be unpaid
      
      transactions.push({
        id: (transactionId++).toString(),
        type: 'expense',
        amount: getRandomAmount(utility.amount[0], utility.amount[1]),
        currency: 'USD',
        description: isPaid ? utility.name : `${utility.name} (Due)`,
        date: utilityDate.toISOString(),
        accountId: '1',
        category: 'Utilities',
        subcategory: utility.subcategory,
        isPaid,
        isRecurring: true,
        recurringUnit: 'month',
        recurringValue: 1,
      });
    }
  });

  // Entertainment - Streaming services - MIX OF PAID/UNPAID
  const streamingServices = ['Netflix', 'Spotify', 'Disney+', 'Amazon Prime'];
  streamingServices.forEach(service => {
    for (let month = 0; month < 3; month++) {
      const serviceDate = new Date();
      serviceDate.setMonth(serviceDate.getMonth() - month);
      serviceDate.setDate(Math.floor(Math.random() * 28) + 1);
      
      const isPaid = month > 0 || Math.random() > 0.3; // Recent subscriptions might be unpaid
      
      transactions.push({
        id: (transactionId++).toString(),
        type: 'expense',
        amount: getRandomAmount(8, 18),
        currency: 'USD',
        description: isPaid ? `${service} Subscription` : `${service} Subscription (Due)`,
        date: serviceDate.toISOString(),
        accountId: '4',
        category: 'Entertainment',
        subcategory: 'Streaming',
        isPaid,
        isRecurring: true,
        recurringUnit: 'month',
        recurringValue: 1,
      });
    }
  });

  // Movies and events - PAID
  for (let i = 0; i < 8; i++) {
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(12, 35),
      currency: 'USD',
      description: 'Movie Ticket',
      date: getRandomDate(90).toISOString(),
      accountId: Math.random() > 0.5 ? '1' : '4',
      category: 'Entertainment',
      subcategory: 'Movies',
      isPaid: true,
    });
  }

  // Shopping - MIX OF PAID/UNPAID
  for (let i = 0; i < 15; i++) {
    const isPaid = Math.random() > 0.2; // 80% chance of being paid
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(25, 200),
      currency: 'USD',
      description: isPaid ? 'Online Shopping' : 'Online Shopping (Pending)',
      date: getRandomDate(90).toISOString(),
      accountId: '4',
      category: 'Shopping',
      isPaid,
    });
  }

  // Healthcare - MIX OF PAID/UNPAID
  for (let i = 0; i < 6; i++) {
    const isPaid = Math.random() > 0.4; // 60% chance of being paid
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(50, 300),
      currency: 'USD',
      description: isPaid ? 'Medical Expense' : 'Medical Bill (Due)',
      date: getRandomDate(90).toISOString(),
      accountId: '1',
      category: 'Healthcare',
      isPaid,
    });
  }

  // Travel expenses - PAID
  for (let i = 0; i < 4; i++) {
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(200, 800),
      currency: 'USD',
      description: 'Travel Expense',
      date: getRandomDate(90).toISOString(),
      accountId: '1',
      category: 'Travel',
      isPaid: true,
    });
  }

  // Transfers between accounts - PAID
  for (let i = 0; i < 8; i++) {
    transactions.push({
      id: (transactionId++).toString(),
      type: 'transfer',
      amount: getRandomAmount(200, 1000),
      currency: 'USD',
      description: 'Savings Transfer',
      date: getRandomDate(90).toISOString(),
      accountId: '1',
      toAccountId: '2',
      isPaid: true,
    });
  }

  // Cash withdrawals - PAID
  for (let i = 0; i < 12; i++) {
    transactions.push({
      id: (transactionId++).toString(),
      type: 'transfer',
      amount: getRandomAmount(50, 200),
      currency: 'USD',
      description: 'ATM Withdrawal',
      date: getRandomDate(90).toISOString(),
      accountId: '1',
      toAccountId: '3',
      isPaid: true,
    });
  }

  // Credit card payments - PAID
  for (let i = 0; i < 6; i++) {
    transactions.push({
      id: (transactionId++).toString(),
      type: 'transfer',
      amount: getRandomAmount(300, 800),
      currency: 'USD',
      description: 'Credit Card Payment',
      date: getRandomDate(90).toISOString(),
      accountId: '1',
      toAccountId: '4',
      isPaid: true,
    });
  }

  // Education expenses - MIX OF PAID/UNPAID
  for (let i = 0; i < 3; i++) {
    const isPaid = Math.random() > 0.3; // 70% chance of being paid
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(100, 500),
      currency: 'USD',
      description: isPaid ? 'Online Course' : 'Course Payment (Due)',
      date: getRandomDate(90).toISOString(),
      accountId: '1',
      category: 'Education',
      isPaid,
    });
  }

  // Gifts and miscellaneous - PAID
  for (let i = 0; i < 5; i++) {
    transactions.push({
      id: (transactionId++).toString(),
      type: 'expense',
      amount: getRandomAmount(30, 150),
      currency: 'USD',
      description: 'Gift Purchase',
      date: getRandomDate(90).toISOString(),
      accountId: Math.random() > 0.5 ? '1' : '4',
      category: 'Other Expenses',
      isPaid: true,
    });
  }

  // Sort transactions by date (newest first)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const initialTransactions: Transaction[] = generateDummyTransactions();

const initialCategories: Category[] = [
  // Income categories
  { 
    id: '1', 
    name: 'Salary', 
    type: 'income', 
    color: '#30D158', 
    lucideIconName: 'Briefcase',
    subcategories: [
      { id: 's1', name: 'Full-time', color: '#30D158', lucideIconName: 'Building' },
      { id: 's2', name: 'Part-time', color: '#34C759', lucideIconName: 'Clock' },
      { id: 's3', name: 'Overtime', color: '#32D74B', lucideIconName: 'Zap' }
    ]
  },
  { 
    id: '2', 
    name: 'Freelance', 
    type: 'income', 
    color: '#5E5CE6', 
    lucideIconName: 'Laptop',
    subcategories: [
      { id: 's4', name: 'Design', color: '#5E5CE6', lucideIconName: 'Palette' },
      { id: 's5', name: 'Development', color: '#5856D6', lucideIconName: 'Code' },
      { id: 's6', name: 'Consulting', color: '#6366F1', lucideIconName: 'MessageCircle' }
    ]
  },
  { 
    id: '3', 
    name: 'Investments', 
    type: 'income', 
    color: '#FF9F0A', 
    lucideIconName: 'TrendingUp',
    subcategories: [
      { id: 's7', name: 'Stocks', color: '#FF9F0A', lucideIconName: 'BarChart3' },
      { id: 's8', name: 'Dividends', color: '#FF9500', lucideIconName: 'DollarSign' },
      { id: 's9', name: 'Crypto', color: '#FF8C00', lucideIconName: 'Bitcoin' }
    ]
  },
  { id: '4', name: 'Gifts', type: 'income', color: '#FF375F', lucideIconName: 'Gift' },
  { id: '5', name: 'Other Income', type: 'income', color: '#BF5AF2', lucideIconName: 'Plus' },
  
  // Expense categories
  { 
    id: '6', 
    name: 'Food & Drinks', 
    type: 'expense', 
    color: '#FF6B6B', 
    lucideIconName: 'UtensilsCrossed',
    subcategories: [
      { id: 's10', name: 'Groceries', color: '#FF6B6B', lucideIconName: 'ShoppingCart' },
      { id: 's11', name: 'Restaurant', color: '#FF5722', lucideIconName: 'ChefHat' },
      { id: 's12', name: 'Delivery', color: '#FF7043', lucideIconName: 'Truck' },
      { id: 's13', name: 'Coffee', color: '#8D4E85', lucideIconName: 'Coffee' }
    ]
  },
  { 
    id: '7', 
    name: 'Transportation', 
    type: 'expense', 
    color: '#5E5CE6', 
    lucideIconName: 'Car',
    subcategories: [
      { id: 's14', name: 'Gas', color: '#5E5CE6', lucideIconName: 'Fuel' },
      { id: 's15', name: 'Public Transit', color: '#5856D6', lucideIconName: 'Bus' },
      { id: 's16', name: 'Uber/Taxi', color: '#6366F1', lucideIconName: 'Navigation' },
      { id: 's17', name: 'Parking', color: '#4F46E5', lucideIconName: 'ParkingCircle' }
    ]
  },
  { 
    id: '8', 
    name: 'Housing', 
    type: 'expense', 
    color: '#0A84FF', 
    lucideIconName: 'Home',
    subcategories: [
      { id: 's18', name: 'Rent', color: '#0A84FF', lucideIconName: 'Key' },
      { id: 's19', name: 'Mortgage', color: '#007AFF', lucideIconName: 'Building' },
      { id: 's20', name: 'Maintenance', color: '#0071E3', lucideIconName: 'Wrench' },
      { id: 's21', name: 'Insurance', color: '#0066CC', lucideIconName: 'Shield' }
    ]
  },
  { 
    id: '9', 
    name: 'Utilities', 
    type: 'expense', 
    color: '#30D158', 
    lucideIconName: 'Zap',
    subcategories: [
      { id: 's22', name: 'Electricity', color: '#30D158', lucideIconName: 'Lightbulb' },
      { id: 's23', name: 'Water', color: '#34C759', lucideIconName: 'Droplets' },
      { id: 's24', name: 'Internet', color: '#32D74B', lucideIconName: 'Wifi' },
      { id: 's25', name: 'Phone', color: '#28CD41', lucideIconName: 'Phone' }
    ]
  },
  { 
    id: '10', 
    name: 'Entertainment', 
    type: 'expense', 
    color: '#BF5AF2', 
    lucideIconName: 'Tv',
    subcategories: [
      { id: 's26', name: 'Streaming', color: '#BF5AF2', lucideIconName: 'Play' },
      { id: 's27', name: 'Movies', color: '#B048E8', lucideIconName: 'Film' },
      { id: 's28', name: 'Games', color: '#A855F7', lucideIconName: 'Gamepad2' },
      { id: 's29', name: 'Events', color: '#9333EA', lucideIconName: 'Calendar' }
    ]
  },
  { id: '11', name: 'Healthcare', type: 'expense', color: '#FF375F', lucideIconName: 'HeartPulse' },
  { id: '12', name: 'Education', type: 'expense', color: '#64D2FF', lucideIconName: 'Book' },
  { id: '13', name: 'Shopping', type: 'expense', color: '#FF2D55', lucideIconName: 'ShoppingBag' },
  { id: '14', name: 'Travel', type: 'expense', color: '#AF52DE', lucideIconName: 'Plane' },
  { id: '15', name: 'Other Expenses', type: 'expense', color: '#8E8E93', lucideIconName: 'MoreHorizontal' },
];

interface DataProviderProps {
  children: ReactNode;
}

// Helper function to create a deep copy of the data state
const createSnapshot = (accounts: Account[], transactions: Transaction[], categories: Category[]): DataState => {
  return {
    accounts: JSON.parse(JSON.stringify(accounts)),
    transactions: JSON.parse(JSON.stringify(transactions)),
    categories: JSON.parse(JSON.stringify(categories)),
  };
};

// Initial data state
const initialDataState: DataState = {
  accounts: initialAccounts,
  transactions: initialTransactions,
  categories: initialCategories,
  currencies: initialCurrencies,
  mainCurrencyCode: 'USD',
};

// Initial history state
const initialHistoryState: HistoryState = {
  past: [],
  present: initialDataState,
  future: [],
  snapshotMetadata: [],
};

export function DataProvider({ children }: DataProviderProps) {
  const [historyState, setHistoryState] = useState<HistoryState>(initialHistoryState);
  
  // Extract current data from history state
  const { accounts, transactions, categories, currencies, mainCurrencyCode } = historyState.present;
  
  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const accountsData = await AsyncStorage.getItem('accounts');
        const transactionsData = await AsyncStorage.getItem('transactions');
        const categoriesData = await AsyncStorage.getItem('categories');
        const currenciesData = await AsyncStorage.getItem('currencies');
        const mainCurrencyData = await AsyncStorage.getItem('mainCurrencyCode');
        
        if (accountsData || transactionsData || categoriesData || currenciesData || mainCurrencyData) {
          const loadedState: DataState = {
            accounts: accountsData ? JSON.parse(accountsData) : initialAccounts,
            transactions: transactionsData ? JSON.parse(transactionsData) : initialTransactions,
            categories: categoriesData ? JSON.parse(categoriesData) : initialCategories,
            currencies: currenciesData ? JSON.parse(currenciesData) : initialCurrencies,
            mainCurrencyCode: mainCurrencyData ? JSON.parse(mainCurrencyData) : 'USD',
          };
          
          setHistoryState({
            past: [],
            present: loadedState,
            future: [],
            snapshotMetadata: [],
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  
  // Save data when it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('accounts', JSON.stringify(accounts));
        await AsyncStorage.setItem('transactions', JSON.stringify(transactions));
        await AsyncStorage.setItem('categories', JSON.stringify(categories));
        await AsyncStorage.setItem('currencies', JSON.stringify(currencies));
        await AsyncStorage.setItem('mainCurrencyCode', JSON.stringify(mainCurrencyCode));
      } catch (error) {
        console.error('Error saving data:', error);
      }
    };
    
    saveData();
  }, [accounts, transactions, categories, currencies, mainCurrencyCode]);
  
  // Helper function to update history state with a new present state
  const updateWithHistory = (newState: Partial<DataState>, metadata: Omit<SnapshotMetadata, 'id' | 'timestamp'>) => {
    setHistoryState(prevHistory => {
      const newPresent = { ...prevHistory.present, ...newState };
      const snapshotMetadata: SnapshotMetadata = {
        id: Math.random().toString(),
        timestamp: new Date(),
        ...metadata,
      };
      
      return {
        past: [...prevHistory.past, prevHistory.present],
        present: newPresent,
        future: [], // Clear future when making a new change
        snapshotMetadata: [...prevHistory.snapshotMetadata, snapshotMetadata],
      };
    });
  };
  
  // Get exchange rate between two currencies
  const getExchangeRate = (fromCurrencyCode: string, toCurrencyCode: string): number => {
    if (fromCurrencyCode === toCurrencyCode) return 1.0;
    
    const fromCurrency = currencies.find(c => c.code === fromCurrencyCode);
    const toCurrency = currencies.find(c => c.code === toCurrencyCode);
    
    if (!fromCurrency || !toCurrency) return 1.0;
    
    // Convert through USD as base currency
    return toCurrency.rate / fromCurrency.rate;
  };
  
  // Calculate total balance across all accounts in main currency
  const totalBalance = accounts.reduce((sum, account) => {
    const rate = getExchangeRate(account.currency, mainCurrencyCode);
    return sum + (account.balance * rate);
  }, 0);
  
  // Calculate paid and unpaid totals
  const paidIncome = transactions
    .filter(t => t.type === 'income' && t.isPaid)
    .reduce((sum, t) => {
      const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
      return sum + convertedAmount;
    }, 0);
  
  const paidExpenses = transactions
    .filter(t => t.type === 'expense' && t.isPaid)
    .reduce((sum, t) => {
      const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
      return sum + convertedAmount;
    }, 0);
  
  const unpaidIncome = transactions
    .filter(t => t.type === 'income' && !t.isPaid)
    .reduce((sum, t) => {
      const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
      return sum + convertedAmount;
    }, 0);
  
  const unpaidExpenses = transactions
    .filter(t => t.type === 'expense' && !t.isPaid)
    .reduce((sum, t) => {
      const convertedAmount = t.amount * getExchangeRate(t.currency || mainCurrencyCode, mainCurrencyCode);
      return sum + convertedAmount;
    }, 0);
  
  // Add a new account
  const addAccount = (account: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...account,
      id: Math.random().toString(),
    };
    updateWithHistory(
      { accounts: [...accounts, newAccount] },
      {
        description: `Added account "${account.name}"`,
        actionType: 'create',
        entityType: 'account',
        entityName: account.name,
      }
    );
  };
  
  // Update an existing account
  const updateAccount = (account: Account) => {
    // Check if currency has changed and convert balance if needed
    const existingAccount = accounts.find(a => a.id === account.id);
    let updatedAccount = { ...account };
    
    if (existingAccount && existingAccount.currency !== account.currency) {
      // Convert balance from old currency to new currency
      const conversionRate = getExchangeRate(existingAccount.currency, account.currency);
      updatedAccount.balance = existingAccount.balance * conversionRate;
    }
    
    updateWithHistory(
      { accounts: accounts.map(a => a.id === account.id ? updatedAccount : a) },
      {
        description: `Updated account "${account.name}"`,
        actionType: 'update',
        entityType: 'account',
        entityName: account.name,
      }
    );
  };
  
  // Delete an account
  const deleteAccount = (id: string, option: 'delete' | 'move' = 'delete', targetAccountId?: string) => {
    const accountToDelete = accounts.find(a => a.id === id);
    let updatedTransactions = [...transactions];
    let updatedAccounts = [...accounts];

    if (option === 'delete') {
      // Remove all transactions associated with this account
      updatedTransactions = transactions.filter(t => 
        t.accountId !== id && t.toAccountId !== id
      );
    } else if (option === 'move' && targetAccountId) {
      // Move all transactions to the target account
      updatedTransactions = transactions.map(t => {
        const updatedTransaction = { ...t };
        if (t.accountId === id) {
          updatedTransaction.accountId = targetAccountId;
        }
        if (t.toAccountId === id) {
          updatedTransaction.toAccountId = targetAccountId;
        }
        return updatedTransaction;
      });

      // Recalculate target account balance
      const targetAccountTransactions = updatedTransactions.filter(t => 
        t.accountId === targetAccountId || t.toAccountId === targetAccountId
      );
      
      let newBalance = 0;
      targetAccountTransactions.forEach(t => {
        if (!t.isPaid) return; // Only count paid transactions for balance
        
        if (t.type === 'income' && t.accountId === targetAccountId) {
          newBalance += t.amount;
        } else if (t.type === 'expense' && t.accountId === targetAccountId) {
          newBalance -= t.amount;
        } else if (t.type === 'transfer') {
          if (t.accountId === targetAccountId) {
            newBalance -= t.amount; // Money going out
          }
          if (t.toAccountId === targetAccountId) {
            newBalance += t.amount; // Money coming in
          }
        }
      });

      // Update target account balance
      updatedAccounts = updatedAccounts.map(a => 
        a.id === targetAccountId ? { ...a, balance: newBalance } : a
      );
    }

    // Remove the deleted account
    updatedAccounts = updatedAccounts.filter(a => a.id !== id);
    
    updateWithHistory(
      { 
        accounts: updatedAccounts, 
        transactions: updatedTransactions 
      },
      {
        description: `Deleted account "${accountToDelete?.name || 'Unknown'}"${option === 'move' ? ' and moved transactions' : ''}`,
        actionType: 'delete',
        entityType: 'account',
        entityName: accountToDelete?.name,
      }
    );
  };
  
  // Add a new transaction
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    // Get the account's currency for this transaction
    const account = accounts.find(a => a.id === transaction.accountId);
    const transactionCurrency = account?.currency || mainCurrencyCode;
    
    const newTransaction: Transaction = {
      ...transaction,
      id: Math.random().toString(),
      currency: transactionCurrency,
      isPaid: transaction.isPaid ?? true, // Default to paid if not specified
    };
    
    // Only update account balances for paid transactions
    let updatedAccounts = [...accounts];
    if (newTransaction.isPaid) {
      if (transaction.type === 'income') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        if (accountIndex !== -1) {
          // Convert transaction amount to account currency if needed
          const convertedAmount = transaction.amount * getExchangeRate(transactionCurrency, updatedAccounts[accountIndex].currency);
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance + convertedAmount
          };
        }
      } else if (transaction.type === 'expense') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        if (accountIndex !== -1) {
          // Convert transaction amount to account currency if needed
          const convertedAmount = transaction.amount * getExchangeRate(transactionCurrency, updatedAccounts[accountIndex].currency);
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance - convertedAmount
          };
        }
      } else if (transaction.type === 'transfer' && transaction.toAccountId) {
        const fromAccountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        const toAccountIndex = updatedAccounts.findIndex(a => a.id === transaction.toAccountId);
        
        if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
          // Convert transaction amount to each account's currency
          const fromConvertedAmount = transaction.amount * getExchangeRate(transactionCurrency, updatedAccounts[fromAccountIndex].currency);
          const toConvertedAmount = transaction.amount * getExchangeRate(transactionCurrency, updatedAccounts[toAccountIndex].currency);
          
          updatedAccounts[fromAccountIndex] = {
            ...updatedAccounts[fromAccountIndex],
            balance: updatedAccounts[fromAccountIndex].balance - fromConvertedAmount
          };
          updatedAccounts[toAccountIndex] = {
            ...updatedAccounts[toAccountIndex],
            balance: updatedAccounts[toAccountIndex].balance + toConvertedAmount
          };
        }
      }
    }
    
    updateWithHistory(
      { 
        accounts: updatedAccounts,
        transactions: [...transactions, newTransaction] 
      },
      {
        description: `Added ${transaction.type} transaction${transaction.description ? ` "${transaction.description}"` : ''} for $${transaction.amount}`,
        actionType: 'create',
        entityType: 'transaction',
        entityName: transaction.description || `${transaction.type} $${transaction.amount}`,
      }
    );
  };
  
  // Update an existing transaction
  const updateTransaction = (transaction: Transaction) => {
    // This would be more complex in a real app to handle balance changes
    updateWithHistory(
      { transactions: transactions.map(t => t.id === transaction.id ? transaction : t) },
      {
        description: `Updated transaction${transaction.description ? ` "${transaction.description}"` : ''} for $${transaction.amount}`,
        actionType: 'update',
        entityType: 'transaction',
        entityName: transaction.description || `${transaction.type} $${transaction.amount}`,
      }
    );
  };
  
  // Delete a transaction
  const deleteTransaction = (id: string) => {
    const transactionToDelete = transactions.find(t => t.id === id);
    // This would be more complex in a real app to handle balance changes
    updateWithHistory(
      { transactions: transactions.filter(t => t.id !== id) },
      {
        description: `Deleted transaction${transactionToDelete?.description ? ` "${transactionToDelete.description}"` : ''} for $${transactionToDelete?.amount || 0}`,
        actionType: 'delete',
        entityType: 'transaction',
        entityName: transactionToDelete?.description || `${transactionToDelete?.type} $${transactionToDelete?.amount}`,
      }
    );
  };
  
  // Toggle transaction paid status
  const toggleTransactionPaidStatus = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    const updatedTransaction = { ...transaction, isPaid: !transaction.isPaid };
    let updatedAccounts = [...accounts];
    
    // Update account balances based on the change
    if (updatedTransaction.isPaid && !transaction.isPaid) {
      // Transaction is being marked as paid
      if (transaction.type === 'income') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        if (accountIndex !== -1) {
          // Convert transaction amount to account currency
          const convertedAmount = transaction.amount * getExchangeRate(transaction.currency, updatedAccounts[accountIndex].currency);
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance + convertedAmount
          };
        }
      } else if (transaction.type === 'expense') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        if (accountIndex !== -1) {
          // Convert transaction amount to account currency
          const convertedAmount = transaction.amount * getExchangeRate(transaction.currency, updatedAccounts[accountIndex].currency);
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance - convertedAmount
          };
        }
      } else if (transaction.type === 'transfer' && transaction.toAccountId) {
        const fromAccountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        const toAccountIndex = updatedAccounts.findIndex(a => a.id === transaction.toAccountId);
        
        if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
          // Convert transaction amount to each account's currency
          const fromConvertedAmount = transaction.amount * getExchangeRate(transaction.currency, updatedAccounts[fromAccountIndex].currency);
          const toConvertedAmount = transaction.amount * getExchangeRate(transaction.currency, updatedAccounts[toAccountIndex].currency);
          
          updatedAccounts[fromAccountIndex] = {
            ...updatedAccounts[fromAccountIndex],
            balance: updatedAccounts[fromAccountIndex].balance - fromConvertedAmount
          };
          updatedAccounts[toAccountIndex] = {
            ...updatedAccounts[toAccountIndex],
            balance: updatedAccounts[toAccountIndex].balance + toConvertedAmount
          };
        }
      }
    } else if (!updatedTransaction.isPaid && transaction.isPaid) {
      // Transaction is being marked as unpaid
      if (transaction.type === 'income') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        if (accountIndex !== -1) {
          // Convert transaction amount to account currency
          const convertedAmount = transaction.amount * getExchangeRate(transaction.currency, updatedAccounts[accountIndex].currency);
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance - convertedAmount
          };
        }
      } else if (transaction.type === 'expense') {
        const accountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        if (accountIndex !== -1) {
          // Convert transaction amount to account currency
          const convertedAmount = transaction.amount * getExchangeRate(transaction.currency, updatedAccounts[accountIndex].currency);
          updatedAccounts[accountIndex] = {
            ...updatedAccounts[accountIndex],
            balance: updatedAccounts[accountIndex].balance + convertedAmount
          };
        }
      } else if (transaction.type === 'transfer' && transaction.toAccountId) {
        const fromAccountIndex = updatedAccounts.findIndex(a => a.id === transaction.accountId);
        const toAccountIndex = updatedAccounts.findIndex(a => a.id === transaction.toAccountId);
        
        if (fromAccountIndex !== -1 && toAccountIndex !== -1) {
          // Convert transaction amount to each account's currency
          const fromConvertedAmount = transaction.amount * getExchangeRate(transaction.currency, updatedAccounts[fromAccountIndex].currency);
          const toConvertedAmount = transaction.amount * getExchangeRate(transaction.currency, updatedAccounts[toAccountIndex].currency);
          
          updatedAccounts[fromAccountIndex] = {
            ...updatedAccounts[fromAccountIndex],
            balance: updatedAccounts[fromAccountIndex].balance + fromConvertedAmount
          };
          updatedAccounts[toAccountIndex] = {
            ...updatedAccounts[toAccountIndex],
            balance: updatedAccounts[toAccountIndex].balance - toConvertedAmount
          };
        }
      }
    }
    
    updateWithHistory(
      { 
        accounts: updatedAccounts,
        transactions: transactions.map(t => t.id === id ? updatedTransaction : t) 
      },
      {
        description: `Marked transaction as ${updatedTransaction.isPaid ? 'paid' : 'unpaid'}${transaction.description ? ` "${transaction.description}"` : ''}`,
        actionType: 'update',
        entityType: 'transaction',
        entityName: transaction.description || `${transaction.type} $${transaction.amount}`,
      }
    );
  };
  
  // Add a new category
  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory: Category = {
      ...category,
      id: Math.random().toString(),
    };
    updateWithHistory(
      { categories: [...categories, newCategory] },
      {
        description: `Added ${category.type} category "${category.name}"`,
        actionType: 'create',
        entityType: 'category',
        entityName: category.name,
      }
    );
  };
  
  // Update an existing category
  const updateCategory = (category: Category) => {
    updateWithHistory(
      { categories: categories.map(c => c.id === category.id ? category : c) },
      {
        description: `Updated category "${category.name}"`,
        actionType: 'update',
        entityType: 'category',
        entityName: category.name,
      }
    );
  };
  
  // Delete a category
  const deleteCategory = (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    updateWithHistory(
      { categories: categories.filter(c => c.id !== id) },
      {
        description: `Deleted category "${categoryToDelete?.name || 'Unknown'}"`,
        actionType: 'delete',
        entityType: 'category',
        entityName: categoryToDelete?.name,
      }
    );
  };
  
  // Add a subcategory to a category
  const addSubcategory = (categoryId: string, subcategory: Omit<Subcategory, 'id'>) => {
    const newSubcategory: Subcategory = {
      ...subcategory,
      id: Math.random().toString(),
    };
    
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subcategories: [...(category.subcategories || []), newSubcategory]
        };
      }
      return category;
    });
    
    const parentCategory = categories.find(c => c.id === categoryId);
    updateWithHistory(
      { categories: updatedCategories },
      {
        description: `Added subcategory "${subcategory.name}" to "${parentCategory?.name || 'Unknown'}"`,
        actionType: 'create',
        entityType: 'category',
        entityName: `${parentCategory?.name} • ${subcategory.name}`,
      }
    );
  };
  
  // Update a subcategory
  const updateSubcategory = (categoryId: string, subcategory: Subcategory) => {
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subcategories: category.subcategories?.map(sub => 
            sub.id === subcategory.id ? subcategory : sub
          )
        };
      }
      return category;
    });
    
    const parentCategory = categories.find(c => c.id === categoryId);
    updateWithHistory(
      { categories: updatedCategories },
      {
        description: `Updated subcategory "${subcategory.name}" in "${parentCategory?.name || 'Unknown'}"`,
        actionType: 'update',
        entityType: 'category',
        entityName: `${parentCategory?.name} • ${subcategory.name}`,
      }
    );
  };
  
  // Delete a subcategory
  const deleteSubcategory = (categoryId: string, subcategoryId: string) => {
    const parentCategory = categories.find(c => c.id === categoryId);
    const subcategoryToDelete = parentCategory?.subcategories?.find(sub => sub.id === subcategoryId);
    
    const updatedCategories = categories.map(category => {
      if (category.id === categoryId) {
        return {
          ...category,
          subcategories: category.subcategories?.filter(sub => sub.id !== subcategoryId)
        };
      }
      return category;
    });
    
    updateWithHistory(
      { categories: updatedCategories },
      {
        description: `Deleted subcategory "${subcategoryToDelete?.name || 'Unknown'}" from "${parentCategory?.name || 'Unknown'}"`,
        actionType: 'delete',
        entityType: 'category',
        entityName: `${parentCategory?.name} • ${subcategoryToDelete?.name}`,
      }
    );
  };
  
  // Get recent transactions
  const getRecentTransactions = (count: number) => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, count);
  };
  
  // Get categories for a specific transaction type
  const getCategoriesForType = (type: 'income' | 'expense') => {
    return categories.filter(c => c.type === type);
  };
  
  // Currency management functions
  const addCurrency = (currency: Omit<Currency, 'isMain'>) => {
    const newCurrency: Currency = {
      ...currency,
      isMain: false,
    };
    updateWithHistory(
      { currencies: [...currencies, newCurrency] },
      {
        description: `Added currency "${currency.name}" (${currency.code})`,
        actionType: 'create',
        entityType: 'data',
        entityName: `${currency.name} (${currency.code})`,
      }
    );
  };
  
  const updateCurrency = (currency: Currency) => {
    updateWithHistory(
      { currencies: currencies.map(c => c.code === currency.code ? currency : c) },
      {
        description: `Updated currency "${currency.name}" (${currency.code})`,
        actionType: 'update',
        entityType: 'data',
        entityName: `${currency.name} (${currency.code})`,
      }
    );
  };
  
  const deleteCurrency = (code: string) => {
    const currencyToDelete = currencies.find(c => c.code === code);
    if (currencyToDelete?.isMain) {
      return false; // Return false to indicate deletion failed
    }
    
    updateWithHistory(
      { currencies: currencies.filter(c => c.code !== code) },
      {
        description: `Deleted currency "${currencyToDelete?.name || 'Unknown'}" (${code})`,
        actionType: 'delete',
        entityType: 'data',
        entityName: `${currencyToDelete?.name} (${code})`,
      }
    );
    return true; // Return true to indicate successful deletion
  };
  
  const setMainCurrency = (code: string) => {
    const updatedCurrencies = currencies.map(currency => ({
      ...currency,
      isMain: currency.code === code,
    }));
    
    const newMainCurrency = currencies.find(c => c.code === code);
    updateWithHistory(
      { 
        currencies: updatedCurrencies,
        mainCurrencyCode: code,
      },
      {
        description: `Set main currency to "${newMainCurrency?.name || 'Unknown'}" (${code})`,
        actionType: 'update',
        entityType: 'data',
        entityName: `${newMainCurrency?.name} (${code})`,
      }
    );
  };
  
  // Export all data as JSON
  const exportData = async () => {
    const data = {
      accounts,
      transactions,
      categories,
      currencies,
      mainCurrencyCode,
    };
    return JSON.stringify(data);
  };
  
  // Import data from JSON
  const importData = async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      
      const newState: Partial<DataState> = {};
      if (data.accounts) newState.accounts = data.accounts;
      if (data.transactions) newState.transactions = data.transactions;
      if (data.categories) newState.categories = data.categories;
      if (data.currencies) newState.currencies = data.currencies;
      if (data.mainCurrencyCode) newState.mainCurrencyCode = data.mainCurrencyCode;
      
      updateWithHistory(
        newState,
        {
          description: 'Imported data from backup file',
          actionType: 'import',
          entityType: 'data',
        }
      );
      
      return Promise.resolve();
    } catch (error) {
      return Promise.reject('Invalid data format');
    }
  };
  
  // History functions
  const undo = () => {
    setHistoryState(prevHistory => {
      if (prevHistory.past.length === 0) return prevHistory;
      
      const previous = prevHistory.past[prevHistory.past.length - 1];
      const newPast = prevHistory.past.slice(0, prevHistory.past.length - 1);
      const newSnapshotMetadata = prevHistory.snapshotMetadata.slice(0, prevHistory.snapshotMetadata.length - 1);
      
      return {
        past: newPast,
        present: previous,
        future: [prevHistory.present, ...prevHistory.future],
        snapshotMetadata: newSnapshotMetadata,
      };
    });
  };
  
  const redo = () => {
    setHistoryState(prevHistory => {
      if (prevHistory.future.length === 0) return prevHistory;
      
      const next = prevHistory.future[0];
      const newFuture = prevHistory.future.slice(1);
      
      // Create metadata for the redo action
      const redoMetadata: SnapshotMetadata = {
        id: Math.random().toString(),
        timestamp: new Date(),
        description: 'Redo action',
        actionType: 'update',
        entityType: 'data',
      };
      
      return {
        past: [...prevHistory.past, prevHistory.present],
        present: next,
        future: newFuture,
        snapshotMetadata: [...prevHistory.snapshotMetadata, redoMetadata],
      };
    });
  };
  
  // Restore to a specific snapshot
  const restoreToSnapshot = (snapshotId: string) => {
    setHistoryState(prevHistory => {
      const snapshotIndex = prevHistory.snapshotMetadata.findIndex(meta => meta.id === snapshotId);
      if (snapshotIndex === -1) return prevHistory;
      
      // The snapshot is at index snapshotIndex in the past array
      const targetState = prevHistory.past[snapshotIndex];
      if (!targetState) return prevHistory;
      
      // Create new history state
      const newPast = prevHistory.past.slice(0, snapshotIndex);
      const newSnapshotMetadata = prevHistory.snapshotMetadata.slice(0, snapshotIndex);
      
      // Add current state and all states after the target to future
      const statesToFuture = [
        prevHistory.present,
        ...prevHistory.past.slice(snapshotIndex + 1),
        ...prevHistory.future
      ];
      
      // Create restore metadata
      const restoreMetadata: SnapshotMetadata = {
        id: Math.random().toString(),
        timestamp: new Date(),
        description: `Restored to: ${prevHistory.snapshotMetadata[snapshotIndex]?.description || 'Unknown snapshot'}`,
        actionType: 'update',
        entityType: 'data',
      };
      
      return {
        past: [...newPast, targetState],
        present: targetState,
        future: statesToFuture,
        snapshotMetadata: [...newSnapshotMetadata, restoreMetadata],
      };
    });
  };
  
  // Clear history
  const clearHistory = () => {
    setHistoryState(prevHistory => ({
      past: [],
      present: prevHistory.present,
      future: [],
      snapshotMetadata: [],
    }));
  };
  
  const canUndo = historyState.past.length > 0;
  const canRedo = historyState.future.length > 0;
  const historySnapshots = historyState.snapshotMetadata;
  
  return (
    <DataContext.Provider
      value={{
        accounts,
        transactions,
        categories,
        currencies,
        mainCurrencyCode,
        totalBalance,
        paidIncome,
        paidExpenses,
        unpaidIncome,
        unpaidExpenses,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleTransactionPaidStatus,
        addCategory,
        updateCategory,
        deleteCategory,
        addSubcategory,
        updateSubcategory,
        deleteSubcategory,
        getRecentTransactions,
        getCategoriesForType,
        exportData,
        importData,
        // Currency functions
        addCurrency,
        updateCurrency,
        deleteCurrency,
        setMainCurrency,
        getExchangeRate,
        // History functions
        undo,
        redo,
        canUndo,
        canRedo,
        historySnapshots,
        restoreToSnapshot,
        clearHistory,
      }}
    >
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