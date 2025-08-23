import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { PieChart, BarChart, CreditCard, Settings } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type TabType = 'overview' | 'category' | 'account' | 'custom';

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton = ({ icon, label, isActive, onPress }: TabButtonProps) => {
  const { theme } = useTheme();
  
  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.tabIconContainer,
        isActive && { backgroundColor: `${theme.colors.primary}20` }
      ]}>
        {React.cloneElement(icon as React.ReactElement, {
          size: 20,
          color: isActive ? theme.colors.primary : theme.colors.textSecondary,
        })}
      </View>
      <Text style={[
        styles.tabLabel,
        { 
          color: isActive ? theme.colors.primary : theme.colors.textSecondary,
          fontSize: 11,
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

interface ReportTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const ReportTabBar = ({ activeTab, onTabChange }: ReportTabBarProps) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: <PieChart /> },
    { id: 'category', label: 'Categories', icon: <BarChart /> },
    { id: 'account', label: 'Accounts', icon: <CreditCard /> },
    { id: 'custom', label: 'Custom', icon: <Settings /> },
  ];

  return (
    <View style={[styles.container, { borderTopColor: 'rgba(0,0,0,0.1)' }]}>
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          icon={tab.icon}
          label={tab.label}
          isActive={activeTab === tab.id}
          onPress={() => onTabChange(tab.id as TabType)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 70,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
