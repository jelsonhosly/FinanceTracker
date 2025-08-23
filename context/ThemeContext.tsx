import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

interface Theme {
  dark: boolean;
  colors: ThemeColors;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  customColors: Partial<ThemeColors>;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
}

interface ThemeContextType {
  theme: Theme;
  themeSettings: ThemeSettings;
  updateThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
  updateFontSize: (size: 'small' | 'medium' | 'large') => void;
  updateAccessibility: (setting: 'highContrast' | 'reducedMotion', value: boolean) => void;
}

const defaultDarkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#7C3AED',
    secondary: '#3B82F6',
    accent: '#EC4899',
    background: '#0F172A',
    card: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
};

const defaultLightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#7C3AED',
    secondary: '#3B82F6',
    accent: '#EC4899',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
};

const defaultThemeSettings: ThemeSettings = {
  mode: 'system',
  customColors: {},
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const colorScheme = useColorScheme();
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(defaultThemeSettings);
  const [theme, setTheme] = useState<Theme>(defaultLightTheme); // Initial theme, will be updated by useEffect

  // Load theme settings on mount
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('themeSettings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setThemeSettings(parsed);
        }
      } catch (error) {
        console.error('Error loading theme settings:', error);
      }
    };
    loadThemeSettings();
  }, []);

  // Save theme settings when they change
  useEffect(() => {
    const saveThemeSettings = async () => {
      try {
        await AsyncStorage.setItem('themeSettings', JSON.stringify(themeSettings));
      } catch (error) {
        console.error('Error saving theme settings:', error);
      }
    };
    saveThemeSettings();
  }, [themeSettings]);

  // Update theme when settings or system color scheme changes
  useEffect(() => {
    let isDark = false;
    switch (themeSettings.mode) {
      case 'light':
        isDark = false;
        break;
      case 'dark':
        isDark = true;
        break;
      case 'system':
      default:
        isDark = colorScheme === 'dark';
        break;
    }

    const baseTheme = isDark ? defaultDarkTheme : defaultLightTheme;
    setTheme({
      ...baseTheme,
      dark: isDark,
      colors: { ...baseTheme.colors, ...themeSettings.customColors },
      fontSize: themeSettings.fontSize,
      highContrast: themeSettings.highContrast,
      reducedMotion: themeSettings.reducedMotion,
    });
  }, [themeSettings, colorScheme]);

  const updateThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeSettings(prev => ({ ...prev, mode }));
  };

  const setCustomColors = (colors: Partial<ThemeColors>) => {
    setThemeSettings(prev => ({ ...prev, customColors: { ...prev.customColors, ...colors } }));
  };

  const updateFontSize = (size: 'small' | 'medium' | 'large') => {
    setThemeSettings(prev => ({ ...prev, fontSize: size }));
  };

  const updateAccessibility = (setting: 'highContrast' | 'reducedMotion', value: boolean) => {
    setThemeSettings(prev => ({ ...prev, [setting]: value }));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeSettings,
        updateThemeMode,
        setCustomColors,
        updateFontSize,
        updateAccessibility,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};