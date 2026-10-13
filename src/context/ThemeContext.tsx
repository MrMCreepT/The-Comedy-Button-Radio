import React, { createContext, useContext, useState, useEffect } from 'react';
import { triggerHaptic } from '../utils/haptics';

interface ThemeContextType {
  isOled: boolean;
  toggleOled: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOled, setIsOled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('cb_oled_theme') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isOled) {
      root.classList.add('theme-oled');
      try {
        localStorage.setItem('cb_oled_theme', 'true');
      } catch {}
    } else {
      root.classList.remove('theme-oled');
      try {
        localStorage.setItem('cb_oled_theme', 'false');
      } catch {}
    }
  }, [isOled]);

  const toggleOled = () => {
    triggerHaptic(8);
    setIsOled((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isOled, toggleOled }}>
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
