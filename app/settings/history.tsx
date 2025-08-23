import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ArrowLeft, RotateCcw, RotateCw, History, Trash2, Clock, Plus, CreditCard as Edit3, Minus, Download, Database } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CustomAlert, AlertButton } from '@/components/CustomAlert';
import { useState } from 'react';

export default function HistoryScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { 
    historySnapshots, 
    undo, 
    redo, 
    canUndo, 
    canRedo, 
    restoreToSnapshot, 
    clearHistory 
  } = useData();
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [customAlertTitle, setCustomAlertTitle] = useState('');
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertButtons, setCustomAlertButtons] = useState<AlertButton[]>([]);
  const [customAlertType, setCustomAlertType] = useState<'info' | 'warning' | 'error' | 'success'>('info');

  const handleRestoreToSnapshot = (snapshotId: string, description: string) => {
    setCustomAlertTitle('Restore to This Point');
    setCustomAlertMessage(`Are you sure you want to restore to "${description}"? This will undo all changes made after this point.`);
    setCustomAlertType('warning');
    setCustomAlertButtons([
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Restore',
        style: 'destructive',
        onPress: () => restoreToSnapshot(snapshotId),
      },
    ]);
    setShowCustomAlert(true);
  };

  const handleClearHistory = () => {
    setCustomAlertTitle('Clear History');
    setCustomAlertMessage('Are you sure you want to clear all history? This action cannot be undone, but your current data will remain intact.');
    setCustomAlertType('warning');
    setCustomAlertButtons([
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: clearHistory,
      },
    ]);
    setShowCustomAlert(true);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return <Plus size={16} color={theme.colors.success} />;
      case 'update':
        return <Edit3 size={16} color={theme.colors.primary} />;
      case 'delete':
        return <Minus size={16} color={theme.colors.error} />;
      case 'import':
        return <Download size={16} color={theme.colors.secondary} />;
      default:
        return <Database size={16} color={theme.colors.textSecondary} />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return theme.colors.success;
      case 'update':
        return theme.colors.primary;
      case 'delete':
        return theme.colors.error;
      case 'import':
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return timestamp.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
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
            History & Restore
          </Text>
          <TouchableOpacity 
            style={[styles.clearButton, { backgroundColor: theme.colors.error + '15' }]}
            onPress={handleClearHistory}
            disabled={historySnapshots.length === 0}
          >
            <Trash2 size={20} color={historySnapshots.length > 0 ? theme.colors.error : theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={[styles.quickActions, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: canUndo ? theme.colors.primary + '15' : theme.colors.background },
            ]}
            onPress={undo}
            disabled={!canUndo}
          >
            <RotateCcw size={20} color={canUndo ? theme.colors.primary : theme.colors.textSecondary} />
            <Text style={[
              styles.quickActionText,
              { color: canUndo ? theme.colors.primary : theme.colors.textSecondary }
            ]}>
              Undo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionButton,
              { backgroundColor: canRedo ? theme.colors.secondary + '15' : theme.colors.background },
            ]}
            onPress={redo}
            disabled={!canRedo}
          >
            <RotateCw size={20} color={canRedo ? theme.colors.secondary : theme.colors.textSecondary} />
            <Text style={[
              styles.quickActionText,
              { color: canRedo ? theme.colors.secondary : theme.colors.textSecondary }
            ]}>
              Redo
            </Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
          {historySnapshots.length === 0 ? (
            <View style={styles.emptyState}>
              <History size={48} color={theme.colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No History Yet
              </Text>
              <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
                Start making changes to your accounts, transactions, or categories to see your history here.
              </Text>
            </View>
          ) : (
            <View style={styles.historyContainer}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                Recent Changes ({historySnapshots.length})
              </Text>
              
              {/* Current State Indicator */}
              <View style={[styles.historyItem, styles.currentState, { backgroundColor: theme.colors.primary + '15' }]}>
                <View style={styles.historyItemContent}>
                  <View style={styles.historyItemHeader}>
                    <View style={styles.actionInfo}>
                      <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Clock size={16} color={theme.colors.primary} />
                      </View>
                      <View style={styles.actionDetails}>
                        <Text style={[styles.actionDescription, { color: theme.colors.primary }]}>
                          Current State
                        </Text>
                        <Text style={[styles.actionTimestamp, { color: theme.colors.primary + 'CC' }]}>
                          Now
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* History Items */}
              {historySnapshots.slice().reverse().map((snapshot, index) => {
                const actualIndex = historySnapshots.length - 1 - index;
                
                return (
                  <View key={snapshot.id} style={[styles.historyItem, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.historyItemContent}>
                      <View style={styles.historyItemHeader}>
                        <View style={styles.actionInfo}>
                          <View style={[styles.actionIcon, { backgroundColor: getActionColor(snapshot.actionType) + '20' }]}>
                            {getActionIcon(snapshot.actionType)}
                          </View>
                          <View style={styles.actionDetails}>
                            <Text style={[styles.actionDescription, { color: theme.colors.text }]}>
                              {snapshot.description}
                            </Text>
                            <Text style={[styles.actionTimestamp, { color: theme.colors.textSecondary }]}>
                              {formatTimestamp(new Date(snapshot.timestamp))}
                            </Text>
                          </View>
                        </View>
                        
                        <TouchableOpacity
                          style={[styles.restoreButton, { backgroundColor: theme.colors.primary + '15' }]}
                          onPress={() => handleRestoreToSnapshot(snapshot.id, snapshot.description)}
                        >
                          <RotateCcw size={16} color={theme.colors.primary} />
                          <Text style={[styles.restoreButtonText, { color: theme.colors.primary }]}>
                            Restore
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {snapshot.entityName && (
                        <View style={styles.entityInfo}>
                          <Text style={[styles.entityType, { color: theme.colors.textSecondary }]}>
                            {snapshot.entityType.charAt(0).toUpperCase() + snapshot.entityType.slice(1)}:
                          </Text>
                          <Text style={[styles.entityName, { color: theme.colors.text }]}>
                            {snapshot.entityName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          
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
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
  historyContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyItem: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentState: {
    borderWidth: 2,
    borderColor: 'transparent',
  },
  historyItemContent: {
    padding: 16,
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionDetails: {
    flex: 1,
  },
  actionDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionTimestamp: {
    fontSize: 14,
    fontWeight: '500',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  entityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    gap: 8,
  },
  entityType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  entityName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  bottomSpacer: {
    height: 100,
  },
});