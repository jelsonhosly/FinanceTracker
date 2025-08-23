import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { getItem, StorageKeys } from '@/utils/storage';
import {
  User,
  Bell,
  CreditCard,
  Settings,
  LogOut,
  Download,
  Shield,
  History,
  DollarSign,
} from 'lucide-react-native';


interface UserData {
  name: string;
  email: string;
  currency?: {
    code: string;
    symbol: string;
  };
  budget?: number;
}

export default function Profile() {
  const { theme } = useTheme();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    name: 'User',
    email: '',
    currency: { code: 'USD', symbol: '$' },
    budget: 0,
  });
  
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [name, email, currency, budget] = await Promise.all([
          getItem(StorageKeys.USER_NAME),
          getItem(StorageKeys.USER_EMAIL),
          getItem(StorageKeys.USER_CURRENCY),
          getItem(StorageKeys.USER_BUDGET),
        ]);
        
        setUserData({
          name: name || 'User',
          email: email || '',
          currency: currency || { code: 'USD', symbol: '$' },
          budget: budget || 0,
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader title="Profile" showBackButton={true} />

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
              <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {userData ? getUserInitials(userData.name) : 'U'}
                </Text>
              </View>
              <Text style={[styles.userName, { color: theme.colors.text }]}>
                {userData?.name || 'User'}
              </Text>
              <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
                {userData?.email}
              </Text>
              {userData?.budget !== undefined && userData.budget > 0 && (
                <View style={styles.budgetContainer}>
                  <Text style={[styles.budgetLabel, { color: theme.colors.textSecondary }]}>
                    Monthly Budget:
                  </Text>
                  <Text style={[styles.budgetAmount, { color: theme.colors.primary }]}>
                    {userData.currency?.symbol}{userData.budget.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
                Account Settings
              </Text>

              <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
                <TouchableOpacity style={styles.settingsItem}>
                  <View style={styles.settingsItemIcon}>
                    <User size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.settingsItemContent}>
                    <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                      Personal Information
                    </Text>
                    <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
                      Update your personal details
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.settingsItem}>
                  <View style={styles.settingsItemIcon}>
                    <Shield size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.settingsItemContent}>
                    <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                      Password & Security
                    </Text>
                    <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
                      Manage your password
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              App Settings
            </Text>

            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>              
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={() => router.push('/settings/notifications')}
              >
                <View style={styles.settingsItemIcon}>
                  <Bell size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                    Notifications
                  </Text>
                  <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
                    Customize reminder times
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={() => router.push('/settings/appearance')}
              >
                <View style={styles.settingsItemIcon}>
                  <Settings size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                    Appearance
                  </Text>
                  <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
                    Customize app colors and theme
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              Data
            </Text>

            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={() => router.push('/settings/backup')}
              >
                <View style={styles.settingsItemIcon}>
                  <Download size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                    Backup & Restore
                  </Text>
                  <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
                    Export or import your data
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={() => router.push('/settings/currencies')}
              >
                <View style={styles.settingsItemIcon}>
                  <DollarSign size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                    Currencies
                  </Text>
                  <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
                    Manage currencies and exchange rates
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.settingsItem}
                onPress={() => router.push('/settings/history')}
              >
                <View style={styles.settingsItemIcon}>
                  <History size={22} color={theme.colors.primary} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.settingsItemTitle, { color: theme.colors.text }]}>
                    History & Restore
                  </Text>
                  <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
                    View changes and restore to any point
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingsItem}>
                <View style={styles.settingsItemIcon}>
                  <LogOut size={22} color={theme.colors.error} />
                </View>
                <View style={styles.settingsItemContent}>
                  <Text style={[styles.settingsItemTitle, { color: theme.colors.error }]}>
                    Sign Out
                  </Text>
                  <Text style={[styles.settingsItemDescription, { color: theme.colors.textSecondary }]}>
                    Log out from your account
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.spacer} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  budgetLabel: {
    marginRight: 6,
    fontSize: 14,
  },
  budgetAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 16,
    marginTop: 4,
  },
  settingsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  settingsCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    marginRight: 16,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingsItemDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  spacer: {
    height: 100,
  },
});