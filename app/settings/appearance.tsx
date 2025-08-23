import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Palette, Moon, Sun, Smartphone, Eye, Type, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  customColors: Partial<ThemeColors>;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
}

const defaultThemeSettings: ThemeSettings = {
  mode: 'system',
  customColors: {},
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
};

export default function AppearanceSettings() {
  const { theme, themeSettings, updateThemeMode, setCustomColors, updateFontSize, updateAccessibility } = useTheme();
  const router = useRouter();
  
  const [settings, setSettings] = useState({
    autoTheme: false,
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    compactMode: false,
  });

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const colorPresets = [
    { name: 'Purple', primary: '#7C3AED', secondary: '#3B82F6' },
    { name: 'Blue', primary: '#2563EB', secondary: '#0EA5E9' },
    { name: 'Green', primary: '#059669', secondary: '#10B981' },
    { name: 'Orange', primary: '#EA580C', secondary: '#F59E0B' },
    { name: 'Pink', primary: '#DB2777', secondary: '#EC4899' },
    { name: 'Indigo', primary: '#4F46E5', secondary: '#6366F1' },
  ];

  const accentColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.dark ? 'light' : 'dark'} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Appearance
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Theme
            </Text>
            
            <View style={styles.themeOptions}>
              <TouchableOpacity 
                style={[
                  styles.themeOption,
                  { backgroundColor: theme.colors.background },
                  themeSettings.mode === 'light' && { 
                    backgroundColor: theme.colors.primary + '20', 
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={() => updateThemeMode('light')}
              >
                <Sun size={24} color={themeSettings.mode === 'light' ? theme.colors.primary : theme.colors.text} />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeSettings.mode === 'light' ? theme.colors.primary : theme.colors.text }
                ]}>
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.themeOption,
                  { backgroundColor: theme.colors.background },
                  themeSettings.mode === 'dark' && { 
                    backgroundColor: theme.colors.primary + '20', 
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={() => updateThemeMode('dark')}
              >
                <Moon size={24} color={themeSettings.mode === 'dark' ? theme.colors.primary : theme.colors.text} />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeSettings.mode === 'dark' ? theme.colors.primary : theme.colors.text }
                ]}>
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.themeOption,
                  { backgroundColor: theme.colors.background },
                  themeSettings.mode === 'system' && { 
                    backgroundColor: theme.colors.primary + '20', 
                    borderColor: theme.colors.primary 
                  }
                ]}
                onPress={() => updateThemeMode('system')}
              >
                <Smartphone size={24} color={themeSettings.mode === 'system' ? theme.colors.primary : theme.colors.text} />
                <Text style={[
                  styles.themeOptionText,
                  { color: themeSettings.mode === 'system' ? theme.colors.primary : theme.colors.text }
                ]}>
                  Auto
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Color Scheme
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Choose your preferred color palette
            </Text>
            
            <View style={styles.colorGrid}>
              {colorPresets.map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorPreset,
                    { backgroundColor: theme.colors.background },
                    preset.primary === theme.colors.primary && {
                      borderColor: theme.colors.primary,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => {
                    setCustomColors({
                      primary: preset.primary,
                      secondary: preset.secondary,
                    });
                  }}
                >
                  <View style={styles.colorPreview}>
                    <View style={[styles.colorSwatch, { backgroundColor: preset.primary }]} />
                    <View style={[styles.colorSwatch, { backgroundColor: preset.secondary }]} />
                  </View>
                  <Text style={[styles.colorPresetName, { color: theme.colors.text }]}>
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Accent Color
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Customize highlight and accent colors
            </Text>
            
            <View style={styles.accentGrid}>
              {accentColors.map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.accentColor,
                    { backgroundColor: color },
                    color === theme.colors.accent && {
                      borderColor: theme.colors.text,
                      borderWidth: 3,
                    }
                  ]}
                  onPress={() => {
                    setCustomColors({ accent: color });
                  }}
                />
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Font Size
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              Adjust the text size throughout the app
            </Text>
            <View style={styles.fontSizeOptions}>
              {['small', 'medium', 'large'].map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeOption,
                    { backgroundColor: theme.colors.background },
                    themeSettings.fontSize === size && {
                      backgroundColor: theme.colors.primary + '20',
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => updateFontSize(size as 'small' | 'medium' | 'large')}
                >
                  <Text
                    style={[
                      styles.fontSizeOptionText,
                      { color: themeSettings.fontSize === size ? theme.colors.primary : theme.colors.text },
                      size === 'small' && { fontSize: 12 },
                      size === 'medium' && { fontSize: 16 },
                      size === 'large' && { fontSize: 20 },
                    ]}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Accessibility
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Eye size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  High Contrast
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Increase contrast for better visibility
                </Text>
              </View>
              <Switch
                value={themeSettings.highContrast}
                onValueChange={(value) => updateAccessibility('highContrast', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Type size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Large Text
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Increase font size throughout the app
                </Text>
              </View>
              <Switch
                value={themeSettings.fontSize === 'large'}
                onValueChange={(value) => updateFontSize(value ? 'large' : 'medium')}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Zap size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Reduce Motion
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Minimize animations and transitions
                </Text>
              </View>
              <Switch
                value={themeSettings.reducedMotion}
                onValueChange={(value) => updateAccessibility('reducedMotion', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
              />
            </View>
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Display Options
            </Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
                  Compact Mode
                </Text>
                <Text style={[styles.settingDescription, { color: theme.colors.textSecondary }]}>
                  Show more content with tighter spacing
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={(value) => console.log('Compact mode toggle:', value)}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={'#f4f3f4'}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorPreset: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  colorPreview: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  colorPresetName: {
    fontSize: 12,
    fontWeight: '600',
  },
  accentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  accentColor: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fontSizeOptions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-around',
    marginTop: 8,
  },
  fontSizeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  fontSizeOptionText: {
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
  },
  bottomSpacer: {
    height: 100,
  },
});