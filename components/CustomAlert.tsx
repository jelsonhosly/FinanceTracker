import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { BlurView } from 'expo-blur';
import { TriangleAlert as AlertTriangle, Info, CircleCheck as CheckCircle, Circle as XCircle } from 'lucide-react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type?: 'info' | 'warning' | 'error' | 'success';
  onClose?: () => void;
}

export function CustomAlert({ 
  visible, 
  title, 
  message, 
  buttons = [{ text: 'OK' }], 
  type = 'info',
  onClose 
}: CustomAlertProps) {
  const { theme } = useTheme();

  const getAlertIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={24} color={theme.colors.warning} />;
      case 'error':
        return <XCircle size={24} color={theme.colors.error} />;
      case 'success':
        return <CheckCircle size={24} color={theme.colors.success} />;
      default:
        return <Info size={24} color={theme.colors.primary} />;
    }
  };

  const getButtonStyle = (buttonStyle: string = 'default') => {
    switch (buttonStyle) {
      case 'cancel':
        return {
          backgroundColor: theme.colors.background,
          textColor: theme.colors.text,
          borderColor: theme.colors.border,
        };
      case 'destructive':
        return {
          backgroundColor: theme.colors.error,
          textColor: 'white',
          borderColor: theme.colors.error,
        };
      default:
        return {
          backgroundColor: theme.colors.primary,
          textColor: 'white',
          borderColor: theme.colors.primary,
        };
    }
  };

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

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
        <View style={[styles.alertContainer, { backgroundColor: theme.colors.card }]}>
          {/* Alert Icon */}
          <View style={styles.iconContainer}>
            {getAlertIcon()}
          </View>

          {/* Alert Content */}
          <View style={styles.contentContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            {message && (
              <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                {message}
              </Text>
            )}
          </View>

          {/* Alert Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => {
              const buttonStyle = getButtonStyle(button.style);
              const isLastButton = index === buttons.length - 1;
              const isSingleButton = buttons.length === 1;
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    {
                      backgroundColor: buttonStyle.backgroundColor,
                      borderColor: buttonStyle.borderColor,
                    },
                    isSingleButton && styles.singleButton,
                    !isSingleButton && (index === 0 ? styles.firstButton : isLastButton ? styles.lastButton : styles.middleButton)
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: buttonStyle.textColor }
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
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
  alertContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  singleButton: {
    // No additional styles needed for single button
  },
  firstButton: {
    // No additional styles needed
  },
  middleButton: {
    // No additional styles needed
  },
  lastButton: {
    // No additional styles needed
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});