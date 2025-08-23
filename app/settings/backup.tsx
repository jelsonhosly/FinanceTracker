import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Download, Upload, FileText, Shield, Cloud, Smartphone, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';

export default function BackupSettings() {
  const { theme } = useTheme();
  const router = useRouter();
  const { exportData, importData } = useData();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Get data from context
      const data = await exportData();
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `finance-backup-${timestamp}.json`;
      
      if (Platform.OS === 'web') {
        // Web download
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setCustomAlertTitle('Export Successful');
        setCustomAlertMessage('Your data has been downloaded to your device.');
        setCustomAlertType('success');
        setCustomAlertButtons([{ text: 'OK' }]);
        setShowCustomAlert(true);
      } else {
        // Mobile sharing
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, data);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Save your finance backup',
          });
        } else {
          setCustomAlertTitle('Export Complete');
          setCustomAlertMessage(`Backup saved to: ${fileUri}`);
          setCustomAlertType('success');
          setCustomAlertButtons([{ text: 'OK' }]);
          setShowCustomAlert(true);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      setCustomAlertTitle('Export Failed');
      setCustomAlertMessage('There was an error exporting your data. Please try again.');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      let fileContent: string;

      if (Platform.OS === 'web') {
        // Web file reading
        const response = await fetch(file.uri);
        fileContent = await response.text();
      } else {
        // Mobile file reading
        fileContent = await FileSystem.readAsStringAsync(file.uri);
      }

      // Validate JSON
      try {
        JSON.parse(fileContent);
      } catch {
        setCustomAlertTitle('Invalid File');
        setCustomAlertMessage('The selected file is not a valid backup file.');
        setCustomAlertType('error');
        setCustomAlertButtons([{ text: 'OK' }]);
        setShowCustomAlert(true);
        setIsImporting(false);
        return;
      }

      // Confirm import
      setCustomAlertTitle('Import Backup');
      setCustomAlertMessage('This will replace all your current data with the backup data. This action cannot be undone. Are you sure you want to continue?');
      setCustomAlertType('warning');
      setCustomAlertButtons([
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsImporting(false),
        },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            try {
              await importData(fileContent);
              setCustomAlertTitle('Import Successful');
              setCustomAlertMessage('Your data has been restored from the backup.');
              setCustomAlertType('success');
              setCustomAlertButtons([{ text: 'OK' }]);
              setShowCustomAlert(true);
            } catch (error) {
              console.error('Import error:', error);
              setCustomAlertTitle('Import Failed');
              setCustomAlertMessage('There was an error importing your data. Please check the file and try again.');
              setCustomAlertType('error');
              setCustomAlertButtons([{ text: 'OK' }]);
              setShowCustomAlert(true);
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]);
      setShowCustomAlert(true);
    } catch (error) {
      console.error('Import error:', error);
      setCustomAlertTitle('Import Failed');
      setCustomAlertMessage('There was an error selecting or reading the file.');
      setCustomAlertType('error');
      setCustomAlertButtons([{ text: 'OK' }]);
      setShowCustomAlert(true);
      setIsImporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Backup & Restore
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Export Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <View style={styles.sectionHeader}>
              <Download size={24} color={theme.colors.success} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Export Data
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Create a backup file of all your financial data including accounts, transactions, and categories.
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: theme.colors.success + '15' },
                isExporting && { opacity: 0.6 }
              ]}
              onPress={handleExportData}
              disabled={isExporting}
            >
              <Download size={20} color={theme.colors.success} />
              <Text style={[styles.actionButtonText, { color: theme.colors.success }]}>
                {isExporting ? 'Exporting...' : 'Export Backup'}
              </Text>
            </TouchableOpacity>

            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.success} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  All accounts and balances
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.success} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  Complete transaction history
                </Text>
              </View>
              <View style={styles.featureItem}>
                <CheckCircle size={16} color={theme.colors.success} />
                <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                  Categories and subcategories
                </Text>
              </View>
            </View>
          </View>

          {/* Import Section */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <View style={styles.sectionHeader}>
              <Upload size={24} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Import Data
              </Text>
            </View>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Restore your data from a previously exported backup file. This will replace all current data.
            </Text>
            
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                { backgroundColor: theme.colors.primary + '15' },
                isImporting && { opacity: 0.6 }
              ]}
              onPress={handleImportData}
              disabled={isImporting}
            >
              <Upload size={20} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>
                {isImporting ? 'Importing...' : 'Import Backup'}
              </Text>
            </TouchableOpacity>

            <View style={[styles.warningBox, { backgroundColor: theme.colors.warning + '15' }]}>
              <AlertTriangle size={20} color={theme.colors.warning} />
              <Text style={[styles.warningText, { color: theme.colors.text }]}>
                Importing will replace all your current data. Make sure to export your current data first if you want to keep it.
              </Text>
            </View>
          </View>

          {/* Security & Privacy */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <View style={styles.sectionHeader}>
              <Shield size={24} color={theme.colors.secondary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Security & Privacy
              </Text>
            </View>
            
            <View style={styles.securityList}>
              <View style={styles.securityItem}>
                <View style={[styles.securityIcon, { backgroundColor: theme.colors.success + '20' }]}>
                  <FileText size={16} color={theme.colors.success} />
                </View>
                <View style={styles.securityContent}>
                  <Text style={[styles.securityTitle, { color: theme.colors.text }]}>
                    Local Storage
                  </Text>
                  <Text style={[styles.securityDescription, { color: theme.colors.textSecondary }]}>
                    All data is stored locally on your device
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <View style={[styles.securityIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <Smartphone size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.securityContent}>
                  <Text style={[styles.securityTitle, { color: theme.colors.text }]}>
                    No Cloud Sync
                  </Text>
                  <Text style={[styles.securityDescription, { color: theme.colors.textSecondary }]}>
                    Your data never leaves your device automatically
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <View style={[styles.securityIcon, { backgroundColor: theme.colors.secondary + '20' }]}>
                  <Shield size={16} color={theme.colors.secondary} />
                </View>
                <View style={styles.securityContent}>
                  <Text style={[styles.securityTitle, { color: theme.colors.text }]}>
                    Encrypted Backups
                  </Text>
                  <Text style={[styles.securityDescription, { color: theme.colors.textSecondary }]}>
                    Backup files are stored in a secure format
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Best Practices */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Best Practices
            </Text>
            
            <View style={styles.tipsList}>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • Export your data regularly to avoid losing important financial information
              </Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • Store backup files in a secure location like cloud storage or external drive
              </Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • Test your backups by importing them on a test device or account
              </Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • Keep multiple backup versions in case of corruption
              </Text>
              <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                • Export before major app updates or device changes
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Custom Alert */}
      <CustomAlert
        visible={showCustomAlert}
        title={customAlertTitle}
        message={customAlertMessage}
        buttons={customAlertButtons}
        type={customAlertType}
        onClose={() => setShowCustomAlert(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  securityList: {
    gap: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  securityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  securityContent: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  securityDescription: {
    fontSize: 14,
  },
  tipsList: {
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
});