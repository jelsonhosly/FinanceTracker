import { View, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { CirclePlus as PlusCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

export function FloatingActionButton() {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Position state for dragging
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const [buttonPosition, setButtonPosition] = useState({ x: 20, y: -100 });

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: position.x,
          translationY: position.y,
        },
      },
    ],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      setButtonPosition(prevPos => ({
        x: prevPos.x + event.nativeEvent.translationX,
        y: prevPos.y + event.nativeEvent.translationY,
      }));
      position.setValue({ x: 0, y: 0 });
    }
  };

  const handlePress = () => {
    router.push('/transaction/add');
  };

  return (
    <View style={[styles.container, { right: buttonPosition.x, bottom: -buttonPosition.y }]}>
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.colors.primary }
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
          >
            <PlusCircle size={32} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});