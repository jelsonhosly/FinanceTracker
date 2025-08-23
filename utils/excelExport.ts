import { Platform } from 'react-native';
import { ExportData, formatCurrency, formatDate, getTransactionTypeDisplay, getAccountName, getCategoryDisplay } from './exportUtils';

export const exportToExcel = async (data: ExportData): Promise<Uint8Array> => {
  // Dynamic import for Excel library
  const XLSX = await import('xlsx');
  
  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Summary worksheet
  const summaryData = [
    ['Financial Report Summary'],
    [''],
    ['Generated on:', new Date().toLocaleDateString()],
    ['Date Range:', data.filters.dateRange],
    [''],
    ['Filters Applied:'],
    ['Accounts:', data.filters.accountNames.join(', ') || 'All Accounts'],
    ['Categories:', data.filters.categoryNames.join(', ') || 'All Categories'],
    ['Transaction Types:', data.filters.transactionTypes.join(', ') || 'All Types'],
    [''],
    ['Financial Summary:'],
    ['Total Income:', formatCurrency(data.totals.income)],
    ['Total Expenses:', formatCurrency(data.totals.expenses)],
    ['Net Balance:', formatCurrency(data.totals.balance)],
    [''],
    ['Account Breakdown:'],
    ['Account Name', 'Type', 'Balance', 'Currency'],
  ];

  // Add account data
  data.accounts.forEach(account => {
    summaryData.push([
      account.name,
      account.type.charAt(0).toUpperCase() + account.type.slice(1),
      formatCurrency(account.balance),
      account.currency,
    ]);
  });

  const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

  // Transactions worksheet
  const transactionHeaders = [
    'Date',
    'Time',
    'Type',
    'Amount',
    'Description',
    'Category',
    'Subcategory',
    'Account',
    'To Account',
    'Payment Status',
    'Recurring',
    'Receipt',
  ];

  const transactionData = [transactionHeaders];

  data.transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const toAccountName = transaction.toAccountId 
      ? getAccountName(transaction.toAccountId, data.accounts)
      : '';

    transactionData.push([
      date.toLocaleDateString(),
      date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      getTransactionTypeDisplay(transaction),
      transaction.type === 'income' ? transaction.amount : transaction.type === 'expense' ? -transaction.amount : transaction.amount,
      transaction.description || '',
      transaction.category || '',
      transaction.subcategory || '',
      getAccountName(transaction.accountId, data.accounts),
      toAccountName,
      transaction.isPaid ? 'Paid' : (transaction.type === 'income' ? 'Pending' : 'Due'),
      transaction.isRecurring ? `${transaction.recurringValue || 1} ${transaction.recurringUnit || 'month'}(s)` : 'No',
      transaction.receiptImage ? 'Yes' : 'No',
    ]);
  });

  const transactionWorksheet = XLSX.utils.aoa_to_sheet(transactionData);
  XLSX.utils.book_append_sheet(workbook, transactionWorksheet, 'Transactions');

  // Category analysis worksheet
  const categoryTotals: { [key: string]: { income: number; expense: number; count: number } } = {};
  
  data.transactions.forEach(transaction => {
    const categoryName = getCategoryDisplay(transaction);
    if (!categoryTotals[categoryName]) {
      categoryTotals[categoryName] = { income: 0, expense: 0, count: 0 };
    }
    
    if (transaction.type === 'income') {
      categoryTotals[categoryName].income += transaction.amount;
    } else if (transaction.type === 'expense') {
      categoryTotals[categoryName].expense += transaction.amount;
    }
    categoryTotals[categoryName].count++;
  });

  const categoryData = [
    ['Category Analysis'],
    [''],
    ['Category', 'Income', 'Expenses', 'Net', 'Transaction Count'],
  ];

  Object.entries(categoryTotals).forEach(([category, totals]) => {
    const net = totals.income - totals.expense;
    categoryData.push([
      category,
      formatCurrency(totals.income),
      formatCurrency(totals.expense),
      formatCurrency(net),
      totals.count.toString(),
    ]);
  });

  const categoryWorksheet = XLSX.utils.aoa_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(workbook, categoryWorksheet, 'Category Analysis');

  // Monthly summary worksheet
  const monthlyTotals: { [key: string]: { income: number; expense: number; count: number } } = {};
  
  data.transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { income: 0, expense: 0, count: 0 };
    }
    
    if (transaction.type === 'income') {
      monthlyTotals[monthKey].income += transaction.amount;
    } else if (transaction.type === 'expense') {
      monthlyTotals[monthKey].expense += transaction.amount;
    }
    monthlyTotals[monthKey].count++;
  });

  const monthlyData = [
    ['Monthly Summary'],
    [''],
    ['Month', 'Income', 'Expenses', 'Net Balance', 'Transactions'],
  ];

  Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([month, totals]) => {
      const net = totals.income - totals.expense;
      const monthName = new Date(month + '-01').toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'long' 
      });
      
      monthlyData.push([
        monthName,
        formatCurrency(totals.income),
        formatCurrency(totals.expense),
        formatCurrency(net),
        totals.count.toString(),
      ]);
    });

  const monthlyWorksheet = XLSX.utils.aoa_to_sheet(monthlyData);
  XLSX.utils.book_append_sheet(workbook, monthlyWorksheet, 'Monthly Summary');

  // Generate Excel file
  const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(excelBuffer);
};