import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  ONBOARDING_COMPLETE: '@onboarding_complete',
  USER_NAME: '@user_name',
  USER_EMAIL: '@user_email',
  USER_CURRENCY: '@user_currency',
  USER_BUDGET: '@user_budget',
} as const;

export const getItem = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value != null ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Error getting data from storage:', error);
    return null;
  }
};

export const setItem = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Error saving data to storage:', error);
    return false;
  }
};

export const removeItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Error removing data from storage:', error);
    return false;
  }
};

export const clearAll = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

export const isOnboardingComplete = async (): Promise<boolean> => {
  console.log('Checking if onboarding is complete...');
  try {
    const status = await getItem(StorageKeys.ONBOARDING_COMPLETE);
    console.log('Onboarding status from storage:', status);
    console.log('All storage keys:', await AsyncStorage.getAllKeys());
    return status === true;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const setOnboardingComplete = async (value: boolean) => {
  return setItem(StorageKeys.ONBOARDING_COMPLETE, value);
};
