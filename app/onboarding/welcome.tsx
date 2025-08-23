import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

const WelcomeScreen = () => {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>👋</Text>
        </View>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome to Bolt
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Let's set up your account and get started with managing your finances.
        </Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/onboarding/personal')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emojiContainer: {
    marginBottom: 30,
  },
  emoji: {
    fontSize: 100,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  footer: {
    marginBottom: 40,
    width: '100%',
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

export default WelcomeScreen;
