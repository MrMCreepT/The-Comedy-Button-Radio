import React, { createContext, useContext, useState, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

export type ThemeMode = 'material-you-dark' | 'material-you-light' | 'studio-dark' | 'oled';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  cycleTheme: () => void;
  isMaterialYou: boolean;
  isMaterialLight: boolean;
  isOled: boolean;
  toggleOled: () => void;
  toggleMaterialYou: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'material-you-dark';
    try {
      const saved = localStorage.getItem('cb_theme_mode');
      if (
        saved === 'material-you-dark' ||
        saved === 'material-you-light' ||
        saved === 'studio-dark' ||
        saved === 'oled'
      ) {
        return saved;
      }
      // If legacy setting exists
      if (saved === 'material-you') return 'material-you-dark';
      if (saved === 'dark') return 'material-you-dark'; // default to Material You to demonstrate it
      return 'material-you-dark';
    } catch {
      return 'material-you-dark';
    }
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.classList.remove(
      'theme-material-you',
      'theme-material-you-dark',
      'theme-material-you-light',
      'theme-studio-dark',
      'theme-oled'
    );

    if (themeMode === 'material-you-dark') {
      root.classList.add('theme-material-you', 'theme-material-you-dark');
      root.style.setProperty('--theme-canvas-bg', '#181519');
      root.style.setProperty('--theme-canvas-color', '#e7e0e5');
    } else if (themeMode === 'material-you-light') {
      root.classList.add('theme-material-you', 'theme-material-you-light');
      root.style.setProperty('--theme-canvas-bg', '#fcf6f5');
      root.style.setProperty('--theme-canvas-color', '#1e1a1b');
    } else if (themeMode === 'oled') {
      root.classList.add('theme-oled');
      root.style.setProperty('--theme-canvas-bg', '#000000');
      root.style.setProperty('--theme-canvas-color', '#f3f4f6');
    } else {
      root.classList.add('theme-studio-dark');
      root.style.setProperty('--theme-canvas-bg', '#0e1015');
      root.style.setProperty('--theme-canvas-color', '#f3f4f6');
    }

    try {
      localStorage.setItem('cb_theme_mode', themeMode);
    } catch {}
  }, [themeMode]);

  const setThemeMode = (mode: ThemeMode) => {
    triggerHaptic(8);
    setThemeModeState(mode);
  };

  const cycleTheme = () => {
    triggerHaptic(10);
    setThemeModeState((prev) => {
      switch (prev) {
        case 'material-you-dark':
          return 'material-you-light';
        case 'material-you-light':
          return 'studio-dark';
        case 'studio-dark':
          return 'oled';
        case 'oled':
        default:
          return 'material-you-dark';
      }
    });
  };

  const toggleOled = () => {
    triggerHaptic(8);
    setThemeModeState((prev) => (prev === 'oled' ? 'material-you-dark' : 'oled'));
  };

  const toggleMaterialYou = () => {
    triggerHaptic(8);
    setThemeModeState((prev) => (prev === 'material-you-dark' ? 'studio-dark' : 'material-you-dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        cycleTheme,
        isMaterialYou: themeMode === 'material-you-dark' || themeMode === 'material-you-light',
        isMaterialLight: themeMode === 'material-you-light',
        isOled: themeMode === 'oled',
        toggleOled,
        toggleMaterialYou,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
