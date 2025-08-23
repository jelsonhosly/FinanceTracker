import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitle?: string;
}

export function OnboardingProgress({ currentStep, totalSteps, stepTitle }: OnboardingProgressProps) {
  const { theme } = useTheme();
  
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { 
              width: `${progress}%`,
              backgroundColor: 'rgba(255, 255, 255, 0.8)'
            }
          ]} 
        />
      </View>
      <View style={styles.progressInfo}>
        <Text style={styles.progressText}>
          Step {currentStep} of {totalSteps}
        </Text>
        {stepTitle && (
          <Text style={styles.stepTitle}>
            {stepTitle}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  stepTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
});