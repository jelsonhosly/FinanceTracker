import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { X } from 'lucide-react-native';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary + '20' }]}>
      <Text style={[styles.label, { color: theme.colors.primary }]}>{label}</Text>
      <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
        <X size={12} color={theme.colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
});