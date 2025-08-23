import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
}

export function ScreenHeader({ title, showBackButton = false }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <ChevronLeft size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 4,
  },
});