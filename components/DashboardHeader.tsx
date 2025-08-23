import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Bell, User } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function DashboardHeader() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View>
        <Text style={[styles.greeting, { color: theme.colors.textSecondary }]}>
          Hello,
        </Text>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          John Doe
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
          onPress={() => router.push('/settings/notifications')}
        >
          <Bell size={20} color={theme.colors.text} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: theme.colors.card }]}
          onPress={() => router.push('/profile')}
        >
          <User size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  greeting: {
    fontSize: 16,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});