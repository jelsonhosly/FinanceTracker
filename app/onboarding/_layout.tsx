import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="personal" />
      <Stack.Screen name="currency" />
      <Stack.Screen name="setup-account" />
      <Stack.Screen name="setup-categories" />
      <Stack.Screen name="tutorial-transaction" />
      <Stack.Screen name="tutorial-navigation" />
      <Stack.Screen name="security-setup" />
    </Stack>
  );
}