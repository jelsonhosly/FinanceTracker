import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { setItem, StorageKeys } from '@/utils/storage';

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
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0].code);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      const currency = currencies.find(c => c.code === selectedCurrency);
      if (currency) {
        await setItem(StorageKeys.USER_CURRENCY, currency);
        router.push('/onboarding/budget');
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
        {
          backgroundColor: theme.colors.card,
          borderColor: selectedCurrency === item.code ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={() => setSelectedCurrency(item.code)}
    >
      <View style={styles.currencyLeft}>
        <Text style={[styles.currencyCode, { color: theme.colors.primary }]}>
          {item.code}
        </Text>
        <Text style={[styles.currencyName, { color: theme.colors.text }]}>
          {item.name}
        </Text>
      </View>
      <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>
        {item.symbol}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Select Your Currency
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
