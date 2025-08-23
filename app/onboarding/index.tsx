import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { isOnboardingComplete } from '@/utils/storage';
import { loadFonts } from '@/utils/fonts';

// This component handles the initial routing based on onboarding status
const OnboardingRouter = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        console.log('OnboardingRouter: Loading fonts...');
        await loadFonts();
        
        console.log('OnboardingRouter: Checking if onboarding is complete...');
        const onboardingComplete = await isOnboardingComplete();
        console.log('OnboardingRouter: Onboarding complete?', onboardingComplete);
        
        if (!onboardingComplete) {
          console.log('OnboardingRouter: Redirecting to welcome screen');
          router.replace('/onboarding/welcome');
        } else {
          console.log('OnboardingRouter: Redirecting to main app');
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('OnboardingRouter: Error checking onboarding status:', error);
        // In case of error, default to showing the welcome screen
        router.replace('/onboarding/welcome');
      } finally {
        console.log('OnboardingRouter: Finished checking status');
        setIsLoading(false);
      }
    };

    checkOnboardingStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return null;
};

export default OnboardingRouter;
