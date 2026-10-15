import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'dongar-theme';
const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => document.documentElement.dataset.theme || readStoredTheme() || systemTheme()
  );
  // Only follow the OS setting until the visitor picks a theme explicitly.
  const [hasUserChoice, setHasUserChoice] = useState(() => readStoredTheme() !== null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('theme-transition');
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    const timer = setTimeout(() => root.classList.remove('theme-transition'), 400);
    return () => clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    if (hasUserChoice) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [hasUserChoice]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage unavailable — theme still applies for this visit */
      }
      return next;
    });
    setHasUserChoice(true);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
