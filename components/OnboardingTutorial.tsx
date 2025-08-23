import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { X, ArrowRight, Lightbulb } from 'lucide-react-native';
import { useState } from 'react';

interface TutorialStep {
  title: string;
  description: string;
  targetElement?: string;
  action?: string;
}

interface OnboardingTutorialProps {
  visible: boolean;
  onClose: () => void;
  steps: TutorialStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
}

export function OnboardingTutorial({
  visible,
  onClose,
  steps,
  currentStep,
  onNext,
  onPrevious,
  onFinish,
}: OnboardingTutorialProps) {
  const { theme } = useTheme();
  
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <BlurView 
          intensity={Platform.OS === 'ios' ? 20 : 15}
          tint={theme.dark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={[styles.tutorialCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                <Lightbulb size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.stepCounter, { color: theme.colors.textSecondary }]}>
                {currentStep + 1} of {steps.length}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {currentStepData.title}
            </Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {currentStepData.description}
            </Text>
            
            {currentStepData.action && (
              <View style={[styles.actionHint, { backgroundColor: theme.colors.primary + '15' }]}>
                <Text style={[styles.actionText, { color: theme.colors.primary }]}>
                  {currentStepData.action}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <View style={styles.progressDots}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: index === currentStep 
                        ? theme.colors.primary 
                        : theme.colors.border
                    }
                  ]}
                />
              ))}
            </View>

            <View style={styles.navigationButtons}>
              {!isFirstStep && (
                <TouchableOpacity
                  style={[styles.navButton, { backgroundColor: theme.colors.background }]}
                  onPress={onPrevious}
                >
                  <Text style={[styles.navButtonText, { color: theme.colors.text }]}>
                    Previous
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[
                  styles.navButton, 
                  styles.primaryButton,
                  { backgroundColor: theme.colors.primary }
                ]}
                onPress={isLastStep ? onFinish : onNext}
              >
                <Text style={[styles.navButtonText, { color: 'white' }]}>
                  {isLastStep ? 'Finish' : 'Next'}
                </Text>
                {!isLastStep && <ArrowRight size={16} color="white" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tutorialCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  actionHint: {
    padding: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    gap: 20,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  primaryButton: {
    minWidth: 100,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});