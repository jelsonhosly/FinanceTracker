import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { ChartBar as BarChart3, CreditCard, Tag, TrendingUp, Receipt } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.textSecondary,
          tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            height: 70,
            borderRadius: 25,
            borderTopWidth: 0,
            elevation: 0,
            backgroundColor: 'transparent',
            paddingBottom: 10,
            paddingTop: 10,
            paddingHorizontal: 10,
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.25,
            shadowRadius: 20,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={Platform.OS === 'ios' ? 100 : 80}
              tint={theme.dark ? 'dark' : 'light'}
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 25,
                  overflow: 'hidden',
                  backgroundColor: Platform.OS === 'ios' 
                    ? 'transparent' 
                    : theme.dark 
                      ? 'rgba(30, 41, 59, 0.9)' 
                      : 'rgba(255, 255, 255, 0.9)',
                }
              ]}
            />
          ),
          tabBarItemStyle: {
            borderRadius: 15,
            marginHorizontal: 2,
            paddingVertical: 5,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginBottom: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="accounts"
          options={{
            title: 'Accounts',
            tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categories',
            tabBarIcon: ({ color, size }) => <Tag color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: 'Reports',
            tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: 'Transactions',
            tabBarIcon: ({ color, size }) => <Receipt color={color} size={size} />,
          }}
        />
      </Tabs>
      <FloatingActionButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});