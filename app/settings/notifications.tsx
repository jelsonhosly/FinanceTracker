import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ArrowLeft, Bell, Clock, Smartphone, Volume2, Vibrate } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { TimePicker } from '@/components/TimePicker';

export default function NotificationsSettings() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    pushNotifications: true,
    transactionReminders: true,
    billReminders: true,
    weeklyReports: false,
    monthlyReports: true,
    soundEnabled: true,
    vibrationEnabled: true,
    morningReminderTime: { hour: 9, minute: 0 },
    eveningReminderTime: { hour: 20, minute: 0 },
  });

  const [showMorningTimePicker, setShowMorningTimePicker] = useState(false);
  const [showEveningTimePicker, setShowEveningTimePicker] = useState(false);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const formatTime = (time: { hour: number; minute: number }) => {
    const period = time.hour >= 12 ? 'PM' : 'AM';
    const displayHour = time.hour === 0 ? 12 : time.hour > 12 ? time.hour - 12 : time.hour;
    return `${displayHour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')} ${period}`;
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
            Notifications
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Push Notifications */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Push Notifications
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Bell size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Enable Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Receive push notifications for important updates
                </Text>
              </View>
              <Switch
                value={settings.pushNotifications}
                onValueChange={(value) => updateSetting('pushNotifications', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Volume2 size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Sound
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Play sound with notifications
                </Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => updateSetting('soundEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
                disabled={!settings.pushNotifications}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Vibrate size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Vibration
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Vibrate device for notifications
                </Text>
              </View>
              <Switch
                value={settings.vibrationEnabled}
                onValueChange={(value) => updateSetting('vibrationEnabled', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
                disabled={!settings.pushNotifications}
              />
            </View>
          </View>

          {/* Reminder Types */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Reminder Types
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Transaction Reminders
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Daily reminders to log your transactions
                </Text>
              </View>
              <Switch
                value={settings.transactionReminders}
                onValueChange={(value) => updateSetting('transactionReminders', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
                disabled={!settings.pushNotifications}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Bill Reminders
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Notifications for upcoming due dates
                </Text>
              </View>
              <Switch
                value={settings.billReminders}
                onValueChange={(value) => updateSetting('billReminders', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
                disabled={!settings.pushNotifications}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Weekly Reports
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Weekly spending summary notifications
                </Text>
              </View>
              <Switch
                value={settings.weeklyReports}
                onValueChange={(value) => updateSetting('weeklyReports', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
                disabled={!settings.pushNotifications}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Monthly Reports
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Monthly financial summary notifications
                </Text>
              </View>
              <Switch
                value={settings.monthlyReports}
                onValueChange={(value) => updateSetting('monthlyReports', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
                disabled={!settings.pushNotifications}
              />
            </View>
          </View>

          {/* Reminder Times */}
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Reminder Times
            </Text>
            
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowMorningTimePicker(true)}
              disabled={!settings.pushNotifications || !settings.transactionReminders}
            >
              <View style={styles.settingIcon}>
                <Clock size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Morning Reminder
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  {formatTime(settings.morningReminderTime)}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowEveningTimePicker(true)}
              disabled={!settings.pushNotifications || !settings.transactionReminders}
            >
              <View style={styles.settingIcon}>
                <Clock size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Evening Reminder
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  {formatTime(settings.eveningReminderTime)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      {/* Time Pickers */}
      {showMorningTimePicker && (
        <TimePicker
          visible={showMorningTimePicker}
          onClose={() => setShowMorningTimePicker(false)}
          onSelect={(time) => {
            updateSetting('morningReminderTime', time);
            setShowMorningTimePicker(false);
          }}
          currentTime={settings.morningReminderTime}
          title="Morning Reminder Time"
        />
      )}

      {showEveningTimePicker && (
        <TimePicker
          visible={showEveningTimePicker}
          onClose={() => setShowEveningTimePicker(false)}
          onSelect={(time) => {
            updateSetting('eveningReminderTime', time);
            setShowEveningTimePicker(false);
          }}
          currentTime={settings.eveningReminderTime}
          title="Evening Reminder Time"
        />
      )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 100,
  },
});