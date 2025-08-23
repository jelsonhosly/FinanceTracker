import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { setItem, StorageKeys } from '@/utils/storage';

const PersonalInfoScreen = () => {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!name.trim() || !email.trim()) return;
    
    setIsSubmitting(true);
    try {
      await Promise.all([
        setItem(StorageKeys.USER_NAME, name.trim()),
        setItem(StorageKeys.USER_EMAIL, email.trim())
      ]);
      router.push('/onboarding/currency');
    } catch (error) {
      console.error('Error saving user info:', error);
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
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Personal Information</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Let's get to know you better
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Full Name</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }
              ]}
              placeholder="John Doe"
              placeholderTextColor={theme.colors.textSecondary}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.colors.card,
                  color: theme.colors.text,
                  borderColor: theme.colors.border 
                }
              ]}
              placeholder="john@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[
              styles.button, 
              { 
                backgroundColor: name && email ? theme.colors.primary : '#ccc',
                opacity: isSubmitting ? 0.7 : 1
              }
            ]}
            onPress={handleContinue}
            disabled={!name || !email || isSubmitting}
          >
            <Text style={styles.buttonText}>
              {isSubmitting ? 'Saving...' : 'Continue'}
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
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
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

export default PersonalInfoScreen;
