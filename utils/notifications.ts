import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function setupNotifications() {
  // Skip notification setup on web
  if (Platform.OS === 'web') {
    return;
  }
  
  // Request permission
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }
  
  // Configure notifications
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  
  // Cancel any existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Schedule morning notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Morning Reminder",
      body: "Don't forget to add yesterday's transactions!",
      sound: true,
    },
    trigger: {
      hour: 9,
      minute: 0,
      repeats: true,
    },
  });
  
  // Schedule evening notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Evening Reminder",
      body: "Did you track all your expenses today?",
      sound: true,
    },
    trigger: {
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
}