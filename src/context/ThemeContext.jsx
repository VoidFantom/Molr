import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export const themes = [
  { id: 'light', name: 'Light', color: '#F8FAFC' },
  { id: 'dark', name: 'Dark', color: '#0F172A' },
  { id: 'black', name: 'Black', color: '#000000' },
  { id: 'light-black', name: 'Light Black', color: '#1A1A1C' }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('molr_theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    localStorage.setItem('molr_theme', theme);
  }, [theme]);

  useEffect(() => {
    const activeTheme = preview || theme;
    
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'black', 'light-black');
    
    if (activeTheme !== 'light') {
      document.documentElement.classList.add(activeTheme);
    }
  }, [theme, preview]);

  const previewTheme = (themeId) => {
    setPreview(themeId);
  };

  const clearPreview = () => {
    setPreview(null);
  };

  const commitTheme = (themeId) => {
    setTheme(themeId);
    setPreview(null);
  };

  return (
    <ThemeContext.Provider value={{ theme, previewTheme, clearPreview, commitTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
