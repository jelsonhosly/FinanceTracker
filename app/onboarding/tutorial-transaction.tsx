import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useState, useRef, useEffect } from 'react';
import { ArrowDown, ArrowUp, Repeat, ChevronRight, CirclePlus as PlusCircle, Lightbulb, Target } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { setItem, StorageKeys } from '@/utils/storage';

const TutorialTransactionScreen = () => {
  const { theme } = useTheme();
  const { addTransaction, accounts, categories, currencies, mainCurrencyCode } = useData();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const mainCurrency = currencies.find(c => c.code === mainCurrencyCode);
  const firstAccount = accounts[0];
  const expenseCategory = categories.find(c => c.type === 'expense');
  const incomeCategory = categories.find(c => c.type === 'income');

  useEffect(() => {
    // Animate in the current step
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const animateToNextStep = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentStep(prev => prev + 1);
      slideAnim.setValue(50);
      fadeAnim.setValue(0);
    });
  };

  const createSampleTransaction = async (type: 'income' | 'expense') => {
    setIsSubmitting(true);
    try {
      if (type === 'expense' && expenseCategory) {
        addTransaction({
          type: 'expense',
          amount: 12.50,
          currency: mainCurrencyCode,
          description: 'Coffee and pastry',
          accountId: firstAccount.id,
          category: expenseCategory.name,
          date: new Date().toISOString(),
          isPaid: true,
        });
      } else if (type === 'income' && incomeCategory) {
        addTransaction({
          type: 'income',
          amount: 2500.00,
          currency: mainCurrencyCode,
          description: 'Monthly salary',
          accountId: firstAccount.id,
          category: incomeCategory.name,
          date: new Date().toISOString(),
          isPaid: true,
        });
      }
      
      if (currentStep < steps.length - 1) {
        animateToNextStep();
      } else {
        router.push('/onboarding/security-setup');
      }
    } catch (error) {
      console.error('Error creating sample transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishTutorial = async () => {
    try {
      await setItem(StorageKeys.ONBOARDING_COMPLETE, true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const steps = [
  const steps = [
    {
      title: 'Let\'s Add Your First Transaction',
      subtitle: 'Transactions are the heart of expense tracking. Let\'s create a sample expense.',
      content: (
        <View style={styles.stepContent}>
          <View style={styles.transactionDemo}>
            <View style={[styles.demoIcon, { backgroundColor: theme.colors.error }]}>
              <ArrowUp size={32} color="white" />
            </View>
            <Text style={styles.demoTitle}>Sample Expense</Text>
            <Text style={styles.demoAmount}>{mainCurrency?.symbol}12.50</Text>
            <Text style={styles.demoDescription}>Coffee and pastry</Text>
            <Text style={styles.demoCategory}>{expenseCategory?.name || 'Food & Dining'}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
            onPress={() => createSampleTransaction('expense')}
            disabled={isSubmitting}
          >
            <ArrowUp size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {isSubmitting ? 'Adding...' : 'Add Sample Expense'}
            </Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      title: 'Great! Now Add Some Income',
      subtitle: 'Income transactions help you see the complete picture of your finances.',
      content: (
        <View style={styles.stepContent}>
          <View style={styles.transactionDemo}>
            <View style={[styles.demoIcon, { backgroundColor: theme.colors.success }]}>
              <ArrowDown size={32} color="white" />
            </View>
            <Text style={styles.demoTitle}>Sample Income</Text>
            <Text style={styles.demoAmount}>{mainCurrency?.symbol}2,500.00</Text>
            <Text style={styles.demoDescription}>Monthly salary</Text>
            <Text style={styles.demoCategory}>{incomeCategory?.name || 'Salary'}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
            onPress={() => createSampleTransaction('income')}
            disabled={isSubmitting}
          >
            <ArrowDown size={20} color="white" />
            <Text style={styles.actionButtonText}>
              {isSubmitting ? 'Adding...' : 'Add Sample Income'}
            </Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      title: 'Perfect! You\'re Ready to Go',
      subtitle: 'You now have everything set up to start tracking your finances effectively.',
      content: (
        <View style={styles.stepContent}>
          <View style={styles.completionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Account Created</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{categories.length}</Text>
              <Text style={styles.statLabel}>Categories Ready</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Sample Transactions</Text>
            </View>
          </View>

          <View style={styles.tipsSection}>
            <View style={styles.tip}>
              <CirclePlus size={20} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.tipText}>
                Use the floating + button to quickly add new transactions
              </Text>
            </View>
            <View style={styles.tip}>
              <Target size={20} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.tipText}>
                Check the Reports tab for insights into your spending patterns
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishTutorial}
          >
            <Text style={styles.finishButtonText}>Start Using FinanceTracker</Text>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      ),
    },
    {
      title: 'Perfect! You\'re All Set',
      subtitle: 'You now have everything you need to start tracking your finances effectively.',
      content: (
        <View style={styles.stepContent}>
          <View style={styles.completionStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>Account Created</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{selectedExpenseCategories.length + selectedIncomeCategories.length}</Text>
              <Text style={styles.statLabel}>Categories Added</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Sample Transactions</Text>
            </View>
          </View>

          <View style={styles.tipsSection}>
            <View style={styles.tip}>
              <Lightbulb size={20} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.tipText}>
                Use the floating + button to quickly add new transactions
              </Text>
            </View>
            <View style={styles.tip}>
              <Target size={20} color="rgba(255, 255, 255, 0.8)" />
              <Text style={styles.tipText}>
                Check the Reports tab for insights into your spending patterns
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.finishButton}
            onPress={handleFinishTutorial}
          >
            <Text style={styles.finishButtonText}>Start Using FinanceTracker</Text>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>
        </View>
      ),
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      <SafeAreaView style={styles.safeArea}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)'
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Step {currentStep + 1} of {steps.length}
          </Text>
        </View>

        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          </View>

          <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
            {currentStepData.content}
          </ScrollView>
        </Animated.View>
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
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
  stepContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContent: {
    alignItems: 'center',
  },
  transactionDemo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  demoIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  demoAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  demoDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  demoCategory: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    minWidth: 200,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  completionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '600',
  },
  tipsSection: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    minWidth: 250,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default TutorialTransactionScreen;