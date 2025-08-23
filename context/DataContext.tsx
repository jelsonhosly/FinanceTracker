import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { setItem, StorageKeys } from '@/utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { DollarSign, Check, ChevronRight } from 'lucide-react-native';

interface CurrencyItem {
  code: string;
  name: string;
  symbol: string;
}

const currencies: CurrencyItem[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];

const CurrencyScreen = () => {
  const { theme } = useTheme();
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      const currency = currencies.find(c => c.code === selectedCurrency);
      if (currency) {
        await setItem(StorageKeys.USER_CURRENCY, currency);
        router.push('/onboarding/setup-account');
      }
    } catch (error) {
      console.error('Error saving currency:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrencyItem = ({ item }: { item: CurrencyItem }) => (
    <TouchableOpacity
      style={[
        styles.currencyItem,
        { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
        selectedCurrency === item.code && { 
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          borderColor: 'rgba(255, 255, 255, 0.5)',
          borderWidth: 2,
        }
      ]}
      onPress={() => setSelectedCurrency(item.code)}
    >
      <View style={styles.currencyInfo}>
        <View style={[styles.currencyIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <Text style={styles.currencySymbolText}>{item.symbol}</Text>
        </View>
        <View style={styles.currencyDetails}>
          <Text style={styles.currencyCode}>
          {item.code}
        </Text>
          <Text style={styles.currencyName}>
          {item.name}
        </Text>
        </View>
      </View>
      {selectedCurrency === item.code && (
        <Check size={20} color="white" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Choose your primary currency for transactions
          </Text>
        </View>

        <FlatList
          data={currencies}
          renderItem={renderCurrencyItem}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.currencyList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            { 
              backgroundColor: theme.colors.primary,
              opacity: isSubmitting ? 0.7 : 1
            },
          ]}
          onPress={handleContinue}
          disabled={isSubmitting}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Saving...' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  currencyList: {
    paddingBottom: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    minWidth: 60,
  },
  currencyName: {
    fontSize: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CurrencyScreen;
