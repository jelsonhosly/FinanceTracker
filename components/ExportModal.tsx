import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Alert } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X, FileText, FileSpreadsheet, Download, Loader } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import { ExportData, generateFilename, saveFile, formatCurrency } from '@/utils/exportUtils';
import { exportToPDF } from '@/utils/pdfExport';
import { exportToExcel } from '@/utils/excelExport';
import { exportToText } from '@/utils/textExport';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  exportData: ExportData;
}

export function ExportModal({ visible, onClose, exportData }: ExportModalProps) {
  const { theme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  const handleExport = async (type: 'pdf' | 'excel' | 'txt') => {
    try {
      setIsExporting(true);
      setExportingType(type);

      let content: string | Uint8Array;
      let mimeType: string;
      let filename: string;

      switch (type) {
        case 'pdf':
          if (Platform.OS !== 'web') {
            setCustomAlertTitle('PDF Export');
            setCustomAlertMessage('PDF export is only available on web platform. Please use Excel or Text export on mobile.');
            setCustomAlertType('warning');
            setCustomAlertButtons([{ text: 'OK' }]);
            setShowCustomAlert(true);
            return;
          }
          content = await exportToPDF(exportData);
          mimeType = 'application/pdf';
          filename = generateFilename('pdf');
          break;
          
        case 'excel':
          content = await exportToExcel(exportData);
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          filename = generateFilename('excel');
          break;
          
        case 'txt':
          content = await exportToText(exportData);
          mimeType = 'text/plain';
          filename = generateFilename('txt');
          break;
          
        default:
          throw new Error('Unsupported export type');
      }

      await saveFile(content, filename, mimeType);
      
      setCustomAlertTitle('Export Successful');
      setCustomAlertMessage(`Your ${type.toUpperCase()} report has been ${Platform.OS === 'web' ? 'downloaded' : 'saved'} successfully.`);
      setCustomAlertType('success');
      setCustomAlertButtons([{ text: 'OK', onPress: onClose }]);
      setShowCustomAlert(true);
      
    } catch (error) {
      console.error('Export error:', error);
      setCustomAlertTitle('Export Failed');
      setCustomAlertMessage(`There was an error exporting your ${type.toUpperCase()} report. Please try again.`);
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
    } finally {
      setIsExporting(false);
      setExportingType(null);
    }
  };

  const exportOptions = [
    {
      type: 'pdf' as const,
      title: 'Detailed PDF',
      description: 'Professional report with charts and formatting',
      icon: FileText,
      color: theme.colors.error,
      available: Platform.OS === 'web',
      unavailableReason: 'PDF export is only available on web',
    },
    {
      type: 'excel' as const,
      title: 'Excel Spreadsheet',
      description: 'Multiple sheets with data analysis',
      icon: FileSpreadsheet,
      color: theme.colors.success,
      available: true,
    },
    {
      type: 'txt' as const,
      title: 'Plain Text',
      description: 'Simple text format for any device',
      icon: Download,
      color: theme.colors.primary,
      available: true,
    },
  ];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView 
          intensity={Platform.OS === 'ios' ? 20 : 15}
          tint={theme.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Export Report
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={[styles.summaryCard, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.summaryTitle, { color: theme.colors.text }]}>
                Report Summary
              </Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                  Transactions:
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {exportData.transactions.length}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                  Date Range:
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>
                  {exportData.filters.dateRange}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                  Net Balance:
                </Text>
                <Text style={[
                  styles.summaryValue, 
                  { color: exportData.totals.balance >= 0 ? theme.colors.success : theme.colors.error }
                ]}>
                  {formatCurrency(exportData.totals.balance)}
                </Text>
              </View>
            </View>

            <Text style={[styles.optionsTitle, { color: theme.colors.text }]}>
              Choose Export Format
            </Text>

            <View style={styles.exportOptions}>
              {exportOptions.map((option) => {
                const IconComponent = option.icon;
                const isCurrentlyExporting = isExporting && exportingType === option.type;
                
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.exportOption,
                      { 
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                      !option.available && { opacity: 0.5 },
                      isCurrentlyExporting && { backgroundColor: option.color + '20' }
                    ]}
                    onPress={() => {
                      if (option.available) {
                        handleExport(option.type);
                      } else {
                        setCustomAlertTitle('Not Available');
                        setCustomAlertMessage(option.unavailableReason || 'This export option is not available.');
                        setCustomAlertType('warning');
                        setCustomAlertButtons([{ text: 'OK' }]);
                        setShowCustomAlert(true);
                      }
                    }}
                    disabled={isExporting || !option.available}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
                      {isCurrentlyExporting ? (
                        <Loader size={24} color={option.color} />
                      ) : (
                        <IconComponent size={24} color={option.color} />
                      )}
                    </View>
                    
                    <View style={styles.optionContent}>
                      <Text style={[styles.optionTitle, { color: theme.colors.text }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                        {isCurrentlyExporting ? 'Generating...' : option.description}
                      </Text>
                      {!option.available && (
                        <Text style={[styles.unavailableText, { color: theme.colors.error }]}>
                          Web only
                        </Text>
                      )}
                    </View>

                    {option.available && !isCurrentlyExporting && (
                      <View style={[styles.downloadIcon, { backgroundColor: option.color }]}>
                        <Download size={16} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.infoCard, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.infoTitle, { color: theme.colors.text }]}>
                Export Information
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • All exports include your current filter settings
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • Excel format includes multiple analysis sheets
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • PDF format provides professional formatting (web only)
              </Text>
              <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                • Text format works on any device or platform
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Custom Alert */}
      <CustomAlert
        visible={showCustomAlert}
        title={customAlertTitle}
        message={customAlertMessage}
        buttons={customAlertButtons}
        type={customAlertType}
        onClose={() => setShowCustomAlert(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    maxHeight: 600,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  exportOptions: {
    gap: 12,
    marginBottom: 20,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  unavailableText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  downloadIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
});