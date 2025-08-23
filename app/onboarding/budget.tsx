import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { setItem, StorageKeys, getItem } from '@/utils/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, ChevronRight } from 'lucide-react-native';

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
    setIsSubmitting(true);
    try {
      const budget = parseFloat(monthlyBudget) || 0;
      if (budget > 0) {
        await setItem(StorageKeys.USER_BUDGET, budget);
      }
      router.push('/onboarding/security-setup');
    } catch (error) {
      console.error('Error saving budget:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/security-setup');
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
        <KeyboardAvoidingView 
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Target size={48} color="white" />
            </View>
            <Text style={styles.title}>Set Your Monthly Budget</Text>
            <Text style={styles.subtitle}>
              Optional: Set a monthly spending target to help track your financial goals
            </Text>
          </View>

          <View style={styles.content}>
            <View style={styles.budgetInputContainer}>
              <View style={styles.currencySymbolContainer}>
                <Text style={styles.currencySymbol}>
                  {currency.symbol}
                </Text>
              </View>
              <TextInput
                style={styles.budgetInput}
                placeholder="0.00"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
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
              <Text style={styles.suggestionTitle}>
                Quick Suggestions
              </Text>
              <View style={styles.suggestionChips}>
                {[1000, 2000, 3000, 5000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={styles.chip}
                    onPress={() => setMonthlyBudget(amount.toString())}
                  >
                    <Text style={styles.chipText}>
                      {currency.symbol}{amount.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Why Set a Budget?</Text>
              <Text style={styles.infoText}>
                • Get alerts when you're approaching your spending limit
              </Text>
              <Text style={styles.infoText}>
                • Track your progress toward financial goals
              </Text>
              <Text style={styles.infoText}>
                • Receive personalized spending insights
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.button,
                { 
                  backgroundColor: monthlyBudget ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  borderColor: monthlyBudget ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
                  opacity: isSubmitting ? 0.7 : 1
                },
              ]}
              onPress={handleComplete}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? 'Saving...' : monthlyBudget ? 'Set Budget' : 'Continue'}
              </Text>
              {!isSubmitting && <ChevronRight size={20} color="white" />}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isSubmitting}
            >
              <Text style={styles.skipText}>
                Skip for now
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 8,
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
  },
  budgetInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  currencySymbolContainer: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  budgetInput: {
    flex: 1,
    fontSize: 28,
    padding: 20,
    color: 'white',
    fontWeight: '300',
  },
  suggestions: {
    marginBottom: 32,
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 8,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default BudgetScreen;