import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useState } from 'react';
import { Shield, Lock, Eye, Smartphone, Database, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SecurityFeatures } from '@/components/SecurityFeatures';

const SecuritySetupScreen = () => {
  const { theme } = useTheme();
  
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [enableBackupReminders, setEnableBackupReminders] = useState(true);
  const [enableSecurityTips, setEnableSecurityTips] = useState(true);

  const handleContinue = () => {
    router.push('/onboarding/tutorial-navigation');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Shield size={48} color="white" />
          </View>
          <Text style={styles.title}>Your Privacy & Security</Text>
          <Text style={styles.subtitle}>
            We take your financial privacy seriously. Here's how we protect your data.
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <SecurityFeatures />

          {/* Privacy Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Privacy Preferences</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Backup Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get reminded to backup your data regularly
                </Text>
              </View>
              <Switch
                value={enableBackupReminders}
                onValueChange={setEnableBackupReminders}
                trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(255, 255, 255, 0.4)' }}
                thumbColor="white"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Security Tips</Text>
                <Text style={styles.settingDescription}>
                  Receive helpful tips about keeping your financial data secure
                </Text>
              </View>
              <Switch
                value={enableSecurityTips}
                onValueChange={setEnableSecurityTips}
                trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(255, 255, 255, 0.4)' }}
                thumbColor="white"
              />
            </View>
          </View>

          {/* Security Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>Security Best Practices</Text>
            <View style={styles.tipsList}>
              <View style={styles.tip}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={styles.tipText}>
                  Regularly backup your data to avoid losing important financial information
                </Text>
              </View>
              <View style={styles.tip}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={styles.tipText}>
                  Keep your device secure with a lock screen password or biometric authentication
                </Text>
              </View>
              <View style={styles.tip}>
                <AlertTriangle size={16} color="#F59E0B" />
                <Text style={styles.tipText}>
                  Store backup files in a secure location like encrypted cloud storage
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue to App Tour</Text>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  securitySection: {
    marginBottom: 32,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  tipsSection: {
    marginBottom: 20,
  },
  tipsList: {
    gap: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  footer: {
    padding: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default SecuritySetupScreen;