import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { setItem, StorageKeys, getItem } from '@/utils/storage';

const BudgetScreen = () => {
  const { theme } = useTheme();
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currency, setCurrency] = useState({ symbol: '$' });

  // Load currency when component mounts
  useEffect(() => {
    const loadCurrency = async () => {
      const savedCurrency = await getItem(StorageKeys.USER_CURRENCY);
      if (savedCurrency) {
        setCurrency(savedCurrency);
      }
    };
    loadCurrency();
  }, []);

  const handleComplete = async () => {
    if (!monthlyBudget) return;
    
    setIsSubmitting(true);
    try {
      const budget = parseFloat(monthlyBudget);
      if (!isNaN(budget)) {
        await setItem(StorageKeys.USER_BUDGET, budget);
        await setItem(StorageKeys.ONBOARDING_COMPLETE, true);
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Set Your Monthly Budget
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              You can always change this later in settings
            </Text>
          </View>

          <View style={styles.budgetInputContainer}>
            <View style={[
              styles.currencySymbolContainer,
              { backgroundColor: theme.colors.card }
            ]}>
              <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>
                {currency.symbol}
              </Text>
            </View>
            <TextInput
              style={[
                styles.budgetInput,
                { 
                  color: theme.colors.text,
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.border 
                }
              ]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              value={monthlyBudget}
              onChangeText={(text) => {
                // Allow only numbers and one decimal point
                const formatted = text.replace(/[^0-9.]/g, '');
                // Ensure only one decimal point
                const decimalCount = (formatted.match(/\./g) || []).length;
                if (decimalCount <= 1) {
                  setMonthlyBudget(formatted);
                }
              }}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>

          <View style={styles.suggestions}>
            <Text style={[styles.suggestionTitle, { color: theme.colors.textSecondary }]}>
              Quick Suggestions
            </Text>
            <View style={styles.suggestionChips}>
              {[1000, 2000, 3000, 5000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.chip,
                    { 
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border 
                    }
                  ]}
                  onPress={() => setMonthlyBudget(amount.toString())}
                >
                  <Text style={[styles.chipText, { color: theme.colors.primary }]}>
                    {currency.symbol}{amount.toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.button,
              { 
                backgroundColor: monthlyBudget ? theme.colors.primary : '#ccc',
                opacity: isSubmitting ? 0.7 : 1
              },
            ]}
            onPress={handleComplete}
            disabled={!monthlyBudget || isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Completing Setup...' : 'Complete Setup'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              setItem(StorageKeys.ONBOARDING_COMPLETE, true);
              router.replace('/(tabs)');
            }}
            disabled={isSubmitting}
          >
            <Text style={[styles.skipText, { color: theme.colors.textSecondary }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
    marginBottom: 40,
    marginTop: 20,
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
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  currencySymbolContainer: {
    padding: 16,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: '#ddd',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
  },
  budgetInput: {
    flex: 1,
    fontSize: 24,
    padding: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
  },
  suggestions: {
    marginBottom: 20,
  },
  suggestionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    margin: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 16,
    fontWeight: '500',
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
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default BudgetScreen;
