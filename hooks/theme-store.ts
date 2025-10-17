import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';

const THEME_STORAGE_KEY = 'app_theme_mode';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  primaryDark: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  shadow: string;
}

const lightTheme: Theme = {
  background: '#f9fafb',
  surface: '#ffffff',
  card: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  primary: '#1e40af',
  primaryDark: '#1e3a8a',
  success: '#10b981',
  danger: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
  shadow: '#000000',
};

const darkTheme: Theme = {
  background: '#111827',
  surface: '#1f2937',
  card: '#374151',
  text: '#f9fafb',
  textSecondary: '#9ca3af',
  border: '#4b5563',
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#60a5fa',
  shadow: '#000000',
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [mode, setMode] = useState<ThemeMode>('light');

  const loadTheme = async () => {
    try {
      if (Platform.OS !== 'web') {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setMode(savedTheme);
        }
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  useEffect(() => {
    loadTheme();
  }, []);

  const toggleTheme = useCallback(async () => {
    const newMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, [mode]);

  const setThemeMode = useCallback(async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      if (Platform.OS !== 'web') {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  const theme = useMemo(() => mode === 'dark' ? darkTheme : lightTheme, [mode]);

  return useMemo(() => ({
    mode,
    theme,
    isDark: mode === 'dark',
    toggleTheme,
    setThemeMode,
  }), [mode, theme, toggleTheme, setThemeMode]);
});
