import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useData } from '@/context/DataContext';
import { AccountListItem } from '@/components/AccountListItem';
import { CirclePlus as PlusCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function Accounts() {
  const { theme } = useTheme();
  const { accounts, totalBalance, currencies, mainCurrencyCode } = useData();
  const router = useRouter();
  
  // Get main currency for display
  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader title="Accounts" />

        <ScrollView showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <BlurView intensity={20} tint="light" style={styles.blurOverlay}>
              <Text style={styles.balanceLabel}>Total Balance</Text>
              <Text style={styles.balanceAmount}>{mainCurrency?.symbol}{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.balanceCurrency}>{mainCurrency?.code}</Text>
            </BlurView>
          </LinearGradient>

          <View style={styles.accountsContainer}>
            {accounts.map((account) => (
              <AccountListItem key={account.id} account={account} />
            ))}
            
            <TouchableOpacity
              style={[
                styles.addAccountButton,
                { backgroundColor: theme.colors.card }
              ]}
              onPress={() => router.push('/account/add')}
            >
              <PlusCircle size={24} color={theme.colors.primary} />
              <Text style={[styles.addAccountText, { color: theme.colors.text }]}>
                Add New Account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    height: 120,
    overflow: 'hidden',
  },
  blurOverlay: {
    padding: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
  },
  balanceCurrency: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  accountsContainer: {
    margin: 16,
    gap: 12,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  addAccountText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});