export type TransactionType = 'income' | 'expense' | 'transfer' | 'paid_income' | 'pending_income' | 'paid_expense' | 'due_expense';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: string; // Currency code for this transaction amount
  date: string; // ISO date string
  description?: string;
  category?: string; // Not used for transfers
  subcategory?: string; // Not used for transfers
  toAccountId?: string; // For transfers
  // Optional extras used across the app
  receiptImage?: string;
  isPaid: boolean;
  isRecurring?: boolean;
  recurringUnit?: 'day' | 'week' | 'month' | 'year';
  recurringValue?: number;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: string; // e.g., 'checking', 'savings', 'credit card'
  currency: string; // e.g., 'USD', 'EUR'
  // Optional UI metadata
  color?: string;
  lucideIconName?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Rate relative to the main currency (main currency's rate is 1.0)
  isMain?: boolean;
}

export interface DataState {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  history: DataState[];
  historyPointer: number;
  totalBalance: number;
  currencies: Currency[]; // Added for currency management
  mainCurrencyCode: string; // Added for currency management
}

export interface DataContextType {
  data: DataState;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (account: Account) => void;
  deleteAccount: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  undo: () => void;
  redo: () => void;
  // New currency management functions
  addCurrency: (currency: Omit<Currency, 'rate' | 'isMain'> & { rate: number }) => void;
  updateCurrency: (currency: Currency) => void;
  deleteCurrency: (code: string) => void;
  setMainCurrency: (code: string) => void;
  getExchangeRate: (fromCurrencyCode: string, toCurrencyCode: string) => number;
}