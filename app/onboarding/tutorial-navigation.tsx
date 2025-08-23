import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useState, useRef, useEffect } from 'react';
import { ChartBar as BarChart3, CreditCard, Tag, TrendingUp, Receipt, CirclePlus as PlusCircle, ChevronRight, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { setItem, StorageKeys } from '@/utils/storage';

const TutorialNavigationScreen = () => {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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
    if (currentStep < steps.length - 1) {
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
    }
  };

  const handleFinishOnboarding = async () => {
    try {
      await setItem(StorageKeys.ONBOARDING_COMPLETE, true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const steps = [
    {
      title: 'Navigate Your Dashboard',
      subtitle: 'The Dashboard shows your financial overview at a glance',
      icon: BarChart3,
      color: theme.colors.primary,
      features: [
        'Total balance across all accounts',
        'Recent transactions',
        'Quick account overview',
        'Smart financial insights',
      ],
    },
    {
      title: 'Manage Your Accounts',
      subtitle: 'Keep track of all your bank accounts, credit cards, and cash',
      icon: CreditCard,
      color: theme.colors.secondary,
      features: [
        'Add multiple accounts',
        'Different account types',
        'Multi-currency support',
        'Real-time balance updates',
      ],
    },
    {
      title: 'Organize with Categories',
      subtitle: 'Categorize your spending to understand where your money goes',
      icon: Tag,
      color: theme.colors.warning,
      features: [
        'Custom categories',
        'Subcategories for detail',
        'Color-coded organization',
        'Income and expense types',
      ],
    },
    {
      title: 'Analyze with Reports',
      subtitle: 'Get detailed insights into your financial patterns',
      icon: TrendingUp,
      color: theme.colors.success,
      features: [
        'Monthly and yearly trends',
        'Category breakdowns',
        'Account performance',
        'Export capabilities',
      ],
    },
    {
      title: 'Track All Transactions',
      subtitle: 'View, filter, and manage all your financial transactions',
      icon: Receipt,
      color: theme.colors.error,
      features: [
        'Chronological transaction list',
        'Advanced filtering options',
        'Search functionality',
        'Calendar view',
      ],
    },
  ];

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

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
            {currentStep + 1} of {steps.length}
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
            <View style={[styles.stepIcon, { backgroundColor: currentStepData.color + '40' }]}>
              <IconComponent size={40} color="white" />
            </View>
            <Text style={styles.title}>{currentStepData.title}</Text>
            <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          </View>

          <ScrollView style={styles.featuresContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.featuresList}>
              {currentStepData.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureBullet}>
                    <Text style={styles.featureBulletText}>✓</Text>
                  </View>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Tab Preview */}
            <View style={styles.tabPreview}>
              <View style={[styles.tabIcon, { backgroundColor: currentStepData.color }]}>
                <IconComponent size={24} color="white" />
              </View>
              <Text style={styles.tabName}>
                {currentStepData.title.split(' ')[currentStepData.title.split(' ').length - 1]}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {currentStep < steps.length - 1 ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={animateToNextStep}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <ArrowRight size={20} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleFinishOnboarding}
              >
                <Text style={styles.finishButtonText}>Start Using App</Text>
                <ChevronRight size={20} color="white" />
              </TouchableOpacity>
            )}
          </View>
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
    paddingTop: 10,
    paddingBottom: 20,
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
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
  featuresContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  featuresList: {
    gap: 16,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  featureBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureBulletText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  featureText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  tabPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    marginBottom: 20,
  },
  tabIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabName: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  footer: {
    padding: 20,
  },
  nextButton: {
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
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
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
  },
  finishButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default TutorialNavigationScreen;