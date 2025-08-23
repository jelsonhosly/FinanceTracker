import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Shield, Lock, Database, Eye, CheckCircle } from 'lucide-react-native';

export function SecurityFeatures() {
  const { theme } = useTheme();

  const securityFeatures = [
    {
      icon: Database,
      title: 'Local Storage Only',
      description: 'All your data stays on your device. No cloud sync means complete privacy.',
      status: 'active',
    },
    {
      icon: Lock,
      title: 'No Account Required',
      description: 'No sign-up, no passwords, no personal information shared with servers.',
      status: 'active',
    },
    {
      icon: Shield,
      title: 'Encrypted Backups',
      description: 'When you export data, it\'s stored in a secure, encrypted format.',
      status: 'active',
    },
    {
      icon: Eye,
      title: 'Transparent Code',
      description: 'Open source means you can verify our security and privacy claims.',
      status: 'active',
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Built-in Security Features
      </Text>
      
      <View style={styles.featuresList}>
        {securityFeatures.map((feature, index) => {
          const IconComponent = feature.icon;
          
          return (
            <View key={index} style={[styles.featureCard, { backgroundColor: theme.colors.card }]}>
              <View style={styles.featureHeader}>
                <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                  <IconComponent size={20} color={theme.colors.primary} />
                </View>
                <View style={styles.featureStatus}>
                  <CheckCircle size={16} color={theme.colors.success} />
                  <Text style={[styles.featureStatusText, { color: theme.colors.success }]}>
                    Active
                  </Text>
                </View>
              </View>
              <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                {feature.title}
              </Text>
              <Text style={[styles.featureDescription, { color: theme.colors.textSecondary }]}>
                {feature.description}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresList: {
    gap: 16,
  },
  featureCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});