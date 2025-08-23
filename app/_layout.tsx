import 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { loadFonts } from '@/utils/fonts';
import { DataProvider } from '@/context/DataContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { isOnboardingComplete } from '@/utils/storage';

function AppContent() {
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    async function prepare() {
      try {
        console.log('App starting - loading fonts...');
        await loadFonts();
        console.log('Checking onboarding status...');
        const onboardingComplete = await isOnboardingComplete();
        console.log('Onboarding complete:', onboardingComplete);
        
        if (!onboardingComplete) {
          console.log('Redirecting to onboarding...');
          router.replace('/onboarding');
        }
      } catch (e) {
        console.error('Error in prepare:', e);
      } finally {
        console.log('App ready');
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 20, color: theme.colors.text }}>Loading app...</Text>
        <TouchableOpacity 
          style={[styles.debugButton, { marginTop: 30 }]}
          onPress={() => router.push('/debug')}
        >
          <Text style={{ color: '#fff' }}>Debug</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="debug" options={{ headerShown: false }} />
      
      {/* Account Screens */}
      <Stack.Screen 
        name="account/[id]" 
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="account/add" 
        options={{
          animation: 'slide_from_bottom',
          presentation: 'card'
        }} 
      />
      
      {/* Transaction Screens */}
      <Stack.Screen 
        name="transaction/add" 
        options={{
          animation: 'slide_from_bottom',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="transaction/[id]" 
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      
      {/* Settings Screens */}
      <Stack.Screen 
        name="settings/currencies" 
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="settings/notifications" 
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="settings/backup" 
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="settings/appearance" 
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="settings/history" 
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      
      {/* Other Screens */}
      <Stack.Screen 
        name="profile" 
        options={{
          animation: 'slide_from_right',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="+not-found"
        options={{
          animation: 'fade',
          presentation: 'modal'
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  
  return (

    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <DataProvider>
            <AppContent />
            <StatusBar style="auto" />
          </DataProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugButton: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 200,
  },
});