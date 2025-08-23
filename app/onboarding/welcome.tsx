import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet, TrendingUp, Shield, Smartphone } from 'lucide-react-native';

const WelcomeScreen = () => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.heroSection}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <Wallet size={48} color="white" />
            </View>
            <Text style={styles.title}>
              Welcome to FinanceTracker
            </Text>
            <Text style={styles.subtitle}>
              Take control of your finances with our simple, powerful tracking app
            </Text>
          </View>

          <View style={styles.featuresSection}>
            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <TrendingUp size={24} color="white" />
              </View>
              <Text style={styles.featureTitle}>Smart Analytics</Text>
              <Text style={styles.featureDescription}>
                Get insights into your spending patterns and financial health
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Shield size={24} color="white" />
              </View>
              <Text style={styles.featureTitle}>Secure & Private</Text>
              <Text style={styles.featureDescription}>
                Your data stays on your device. No cloud sync, complete privacy
              </Text>
            </View>

            <View style={styles.feature}>
              <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <Smartphone size={24} color="white" />
              </View>
              <Text style={styles.featureTitle}>Easy to Use</Text>
              <Text style={styles.featureDescription}>
                Intuitive design makes tracking expenses quick and effortless
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/onboarding/personal')}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
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
    padding: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
  },
  featuresSection: {
    gap: 32,
  },
  feature: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default WelcomeScreen;
