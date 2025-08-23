import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useData } from '@/context/DataContext';
import { useState } from 'react';
import { Check, ChevronRight, Coffee, Car, Chrome as Home, ShoppingCart, UtensilsCrossed, Briefcase, HeartPulse, Tv, Plane, Gift } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SUGGESTED_CATEGORIES = {
  expense: [
    { name: 'Food & Dining', icon: 'UtensilsCrossed', color: '#FF9F0A' },
    { name: 'Transportation', icon: 'Car', color: '#5E5CE6' },
    { name: 'Shopping', icon: 'ShoppingCart', color: '#30D158' },
    { name: 'Entertainment', icon: 'Tv', color: '#BF5AF2' },
    { name: 'Healthcare', icon: 'HeartPulse', color: '#FF375F' },
    { name: 'Housing', icon: 'Home', color: '#0A84FF' },
    { name: 'Travel', icon: 'Plane', color: '#64D2FF' },
    { name: 'Gifts', icon: 'Gift', color: '#FF6B6B' },
  ],
  income: [
    { name: 'Salary', icon: 'Briefcase', color: '#30D158' },
    { name: 'Freelance', icon: 'Laptop', color: '#5E5CE6' },
    { name: 'Investments', icon: 'TrendingUp', color: '#FF9F0A' },
    { name: 'Other Income', icon: 'DollarSign', color: '#8E8E93' },
  ],
};

const SetupCategoriesScreen = () => {
  const { theme } = useTheme();
  const { addCategory } = useData();
  
  const [selectedExpenseCategories, setSelectedExpenseCategories] = useState<string[]>([
    'Food & Dining', 'Transportation', 'Shopping', 'Entertainment'
  ]);
  const [selectedIncomeCategories, setSelectedIncomeCategories] = useState<string[]>([
    'Salary'
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleExpenseCategory = (categoryName: string) => {
    setSelectedExpenseCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleIncomeCategory = (categoryName: string) => {
    setSelectedIncomeCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      // Create selected expense categories
      for (const categoryName of selectedExpenseCategories) {
        const categoryData = SUGGESTED_CATEGORIES.expense.find(cat => cat.name === categoryName);
        if (categoryData) {
          addCategory({
            name: categoryData.name,
            type: 'expense',
            color: categoryData.color,
            lucideIconName: categoryData.icon,
            icon: '',
          });
        }
      }

      // Create selected income categories
      for (const categoryName of selectedIncomeCategories) {
        const categoryData = SUGGESTED_CATEGORIES.income.find(cat => cat.name === categoryName);
        if (categoryData) {
          addCategory({
            name: categoryData.name,
            type: 'income',
            color: categoryData.color,
            lucideIconName: categoryData.icon,
            icon: '',
          });
        }
      }

      // Navigate to transaction tutorial
      router.push('/onboarding/tutorial-transaction');
    } catch (error) {
      console.error('Error creating categories:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategorySection = (
    title: string,
    categories: typeof SUGGESTED_CATEGORIES.expense,
    selectedCategories: string[],
    toggleFunction: (name: string) => void,
    color: string
  ) => (
    <View style={styles.categorySection}>
      <Text style={[styles.categoryTitle, { color }]}>{title}</Text>
      <View style={styles.categoriesGrid}>
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.name);
          
          return (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.categoryCard,
                { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                isSelected && { 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  borderWidth: 2,
                }
              ]}
              onPress={() => toggleFunction(category.name)}
            >
              <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                {/* Icon would be rendered here based on category.icon */}
                <Text style={styles.categoryIconText}>
                  {category.name.charAt(0)}
                </Text>
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
              {isSelected && (
                <View style={styles.selectedBadge}>
                  <Check size={12} color="white" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

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
          <Text style={styles.title}>Choose Your Categories</Text>
          <Text style={styles.subtitle}>
            Select categories that match your spending and income patterns. You can add more later.
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCategorySection(
            'Expense Categories',
            SUGGESTED_CATEGORIES.expense,
            selectedExpenseCategories,
            toggleExpenseCategory,
            '#FF6B6B'
          )}

          {renderCategorySection(
            'Income Categories',
            SUGGESTED_CATEGORIES.income,
            selectedIncomeCategories,
            toggleIncomeCategory,
            '#30D158'
          )}

          <View style={styles.selectionSummary}>
            <Text style={styles.summaryText}>
              Selected: {selectedExpenseCategories.length + selectedIncomeCategories.length} categories
            </Text>
            <Text style={styles.summaryHint}>
              You can always add, edit, or remove categories later in the app
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { opacity: isSubmitting ? 0.6 : 1 }
            ]}
            onPress={handleContinue}
            disabled={isSubmitting}
          >
            <Text style={styles.continueButtonText}>
              {isSubmitting ? 'Setting Up Categories...' : 'Continue'}
            </Text>
            {!isSubmitting && <ChevronRight size={20} color="white" />}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    alignItems: 'center',
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
  categorySection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIconText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionSummary: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  summaryHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
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

export default SetupCategoriesScreen;