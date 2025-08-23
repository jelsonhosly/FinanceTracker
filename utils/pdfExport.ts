import { Platform } from 'react-native';
import { ExportData, formatCurrency, formatDate, getTransactionTypeDisplay, getAccountName, getCategoryDisplay } from './exportUtils';

// Web-only PDF export using jsPDF
export const exportToPDF = async (data: ExportData): Promise<Uint8Array> => {
  if (Platform.OS !== 'web') {
    throw new Error('PDF export is only available on web platform');
  }

  // Dynamic import for web-only library
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;
  const lineHeight = 6;
  const margin = 20;

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, options: any = {}) => {
    const maxWidth = options.maxWidth || pageWidth - margin * 2;
    const lines = doc.splitTextToSize(text, maxWidth);
    
    if (y + lines.length * lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    
    doc.text(lines, x, y);
    return y + lines.length * lineHeight;
  };

  // Helper function to check if new page is needed
  const checkNewPage = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
  };

  // Title
  doc.setFontSize(20);
  doc.setFont(undefined, 'bold');
  yPosition = addText('Financial Report', margin, yPosition);
  yPosition += 10;

  // Report metadata
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPosition = addText(`Generated on: ${new Date().toLocaleDateString()}`, margin, yPosition);
  yPosition = addText(`Date Range: ${data.filters.dateRange}`, margin, yPosition);
  
  if (data.filters.accountNames.length > 0) {
    yPosition = addText(`Accounts: ${data.filters.accountNames.join(', ')}`, margin, yPosition);
  }
  
  if (data.filters.categoryNames.length > 0) {
    yPosition = addText(`Categories: ${data.filters.categoryNames.join(', ')}`, margin, yPosition);
  }
  
  if (data.filters.transactionTypes.length > 0) {
    yPosition = addText(`Types: ${data.filters.transactionTypes.join(', ')}`, margin, yPosition);
  }
  
  yPosition += 10;

  // Summary section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  yPosition = addText('Summary', margin, yPosition);
  yPosition += 5;

  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  yPosition = addText(`Total Income: ${formatCurrency(data.totals.income)}`, margin, yPosition);
  yPosition = addText(`Total Expenses: ${formatCurrency(data.totals.expenses)}`, margin, yPosition);
  yPosition = addText(`Net Balance: ${formatCurrency(data.totals.balance)}`, margin, yPosition);
  yPosition += 10;

  // Transactions section
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  checkNewPage(20);
  yPosition = addText('Transactions', margin, yPosition);
  yPosition += 5;

  // Table headers
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');
  checkNewPage(15);
  
  const colWidths = [25, 35, 40, 30, 35, 25];
  const headers = ['Date', 'Type', 'Description', 'Category', 'Account', 'Amount'];
  let xPos = margin;
  
  headers.forEach((header, index) => {
    doc.text(header, xPos, yPosition);
    xPos += colWidths[index];
  });
  yPosition += lineHeight;

  // Draw header line
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 3;

  // Transaction rows
  doc.setFont(undefined, 'normal');
  data.transactions.forEach((transaction) => {
    checkNewPage(10);
    
    xPos = margin;
    const rowData = [
      formatDate(transaction.date).split(',')[0], // Date only
      getTransactionTypeDisplay(transaction),
      transaction.description || getCategoryDisplay(transaction),
      getCategoryDisplay(transaction),
      getAccountName(transaction.accountId, data.accounts),
      `${transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}${formatCurrency(transaction.amount)}`,
    ];

    rowData.forEach((cell, index) => {
      const cellText = doc.splitTextToSize(cell, colWidths[index] - 2);
      doc.text(cellText[0] || '', xPos, yPosition); // Only show first line to prevent overflow
      xPos += colWidths[index];
    });
    
    yPosition += lineHeight;
  });

  return doc.output('arraybuffer') as Uint8Array;
};