import { TouchableOpacity, View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { CirclePlus as PlusCircle, CircleArrowUp as ArrowUpCircle, CircleArrowDown as ArrowDownCircle, Repeat } from 'lucide-react-native';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';

export function QuickActionButton() {
  const { theme } = useTheme();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const buttonRotation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    if (isOpen) {
      // Close menu
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonRotation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Open menu
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonRotation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    setIsOpen(!isOpen);
  };
  
  const navigateToNewTransaction = (type: 'income' | 'expense' | 'transfer') => {
    toggleMenu();
    setTimeout(() => {
      router.push({
        pathname: '/transaction/new',
        params: { type }
      });
    }, 100);
  };
  
  const rotate = buttonRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      {isOpen && (
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity,
              transform: [{ scale }],
            }
          ]}
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            activeOpacity={1}
            onPress={toggleMenu}
          />
          
          <BlurView intensity={80} tint={theme.dark ? 'dark' : 'light'} style={styles.blurOverlay}>
            <View style={styles.menuContainer}>
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: `${theme.colors.success}15` }]}
                onPress={() => navigateToNewTransaction('income')}
              >
                <ArrowDownCircle size={28} color={theme.colors.success} />
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Income</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: `${theme.colors.error}15` }]}
                onPress={() => navigateToNewTransaction('expense')}
              >
                <ArrowUpCircle size={28} color={theme.colors.error} />
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Expense</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.menuItem, { backgroundColor: `${theme.colors.primary}15` }]}
                onPress={() => navigateToNewTransaction('transfer')}
              >
                <Repeat size={28} color={theme.colors.primary} />
                <Text style={[styles.menuText, { color: theme.colors.text }]}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      )}
      
      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.colors.primary }
        ]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <PlusCircle size={32} color="white" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  blurOverlay: {
    borderRadius: 16,
    overflow: 'hidden',
    width: 280,
    position: 'absolute',
    bottom: 100,
  },
  menuContainer: {
    width: '100%',
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  menuText: {
    marginLeft: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});