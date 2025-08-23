import { ExportData, formatCurrency, formatDate, getTransactionTypeDisplay, getAccountName, getCategoryDisplay } from './exportUtils';

export const exportToText = (data: ExportData): string => {
  let content = '';
  
  // Header
  content += '='.repeat(60) + '\n';
  content += '                    FINANCIAL REPORT\n';
  content += '='.repeat(60) + '\n\n';
  
  // Report metadata
  content += `Generated on: ${new Date().toLocaleDateString()}\n`;
  content += `Date Range: ${data.filters.dateRange}\n`;
  
  if (data.filters.accountNames.length > 0) {
    content += `Accounts: ${data.filters.accountNames.join(', ')}\n`;
  }
  
  if (data.filters.categoryNames.length > 0) {
    content += `Categories: ${data.filters.categoryNames.join(', ')}\n`;
  }
  
  if (data.filters.transactionTypes.length > 0) {
    content += `Transaction Types: ${data.filters.transactionTypes.join(', ')}\n`;
  }
  
  content += '\n';

  // Summary section
  content += 'FINANCIAL SUMMARY\n';
  content += '-'.repeat(30) + '\n';
  content += `Total Income:     ${formatCurrency(data.totals.income).padStart(12)}\n`;
  content += `Total Expenses:   ${formatCurrency(data.totals.expenses).padStart(12)}\n`;
  content += `Net Balance:      ${formatCurrency(data.totals.balance).padStart(12)}\n\n`;

  // Account breakdown
  if (data.accounts.length > 0) {
    content += 'ACCOUNT BREAKDOWN\n';
    content += '-'.repeat(50) + '\n';
    content += 'Account Name'.padEnd(20) + 'Type'.padEnd(12) + 'Balance'.padStart(12) + '\n';
    content += '-'.repeat(50) + '\n';
    
    data.accounts.forEach(account => {
      const accountType = account.type.charAt(0).toUpperCase() + account.type.slice(1);
      const balance = formatCurrency(account.balance);
      
      content += account.name.padEnd(20).substring(0, 20);
      content += accountType.padEnd(12).substring(0, 12);
      content += balance.padStart(12) + '\n';
    });
    content += '\n';
  }

  // Category analysis
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

  if (Object.keys(categoryTotals).length > 0) {
    content += 'CATEGORY ANALYSIS\n';
    content += '-'.repeat(70) + '\n';
    content += 'Category'.padEnd(20) + 'Income'.padStart(12) + 'Expenses'.padStart(12) + 'Net'.padStart(12) + 'Count'.padStart(8) + '\n';
    content += '-'.repeat(70) + '\n';
    
    Object.entries(categoryTotals)
      .sort(([,a], [,b]) => (b.income + b.expense) - (a.income + a.expense))
      .forEach(([category, totals]) => {
        const net = totals.income - totals.expense;
        
        content += category.padEnd(20).substring(0, 20);
        content += formatCurrency(totals.income).padStart(12);
        content += formatCurrency(totals.expense).padStart(12);
        content += formatCurrency(net).padStart(12);
        content += totals.count.toString().padStart(8) + '\n';
      });
    content += '\n';
  }

  // Detailed transactions
  content += 'DETAILED TRANSACTIONS\n';
  content += '='.repeat(80) + '\n\n';

  // Group transactions by date
  const groupedTransactions: { [key: string]: typeof data.transactions } = {};
  data.transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const dateKey = date.toLocaleDateString();
    
    if (!groupedTransactions[dateKey]) {
      groupedTransactions[dateKey] = [];
    }
    groupedTransactions[dateKey].push(transaction);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  sortedDates.forEach(dateKey => {
    const dayTransactions = groupedTransactions[dateKey];
    const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const dayExpenses = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    content += `${dateKey}\n`;
    content += `Income: ${formatCurrency(dayIncome)} | Expenses: ${formatCurrency(dayExpenses)} | Net: ${formatCurrency(dayIncome - dayExpenses)}\n`;
    content += '-'.repeat(40) + '\n';
    
    dayTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .forEach(transaction => {
        const time = new Date(transaction.date).toLocaleTimeString(undefined, { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        const amount = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : '';
        const description = transaction.description || getCategoryDisplay(transaction);
        const account = getAccountName(transaction.accountId, data.accounts);
        const status = transaction.isPaid ? '' : ` (${transaction.type === 'income' ? 'PENDING' : 'DUE'})`;
        
        content += `${time} | ${amount}${formatCurrency(transaction.amount)} | ${description} | ${account}${status}\n`;
        
        if (transaction.type === 'transfer' && transaction.toAccountId) {
          const toAccount = getAccountName(transaction.toAccountId, data.accounts);
          content += `       → Transfer to: ${toAccount}\n`;
        }
        
        if (transaction.isRecurring) {
          content += `       🔄 Recurring: ${transaction.recurringValue || 1} ${transaction.recurringUnit || 'month'}(s)\n`;
        }
        
        if (transaction.receiptImage) {
          content += `       📄 Receipt attached\n`;
        }
      });
    
    content += '\n';
  });

  // Footer
  content += '='.repeat(60) + '\n';
  content += `Report contains ${data.transactions.length} transactions\n`;
  content += `Generated by Financial Tracker App\n`;
  content += '='.repeat(60) + '\n';

  return new TextEncoder().encode(content);
};