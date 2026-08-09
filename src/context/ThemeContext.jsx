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
  
  const [reduceMotion, setReduceMotion] = useState(() => {
    const saved = localStorage.getItem('molr_reduce_motion');
    if (saved !== null) return saved === 'true';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [fontScale, setFontScale] = useState(() => {
    return localStorage.getItem('molr_font_scale') || 'default';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('molr_high_contrast') === 'true';
  });
  
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    localStorage.setItem('molr_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('molr_reduce_motion', reduceMotion.toString());
    if (reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [reduceMotion]);

  useEffect(() => {
    localStorage.setItem('molr_font_scale', fontScale);
    document.documentElement.classList.remove('font-small', 'font-large');
    
    // Fix: Tailwind uses rems based on the html element's font-size.
    // Setting it directly on document.documentElement forces all rem values to scale app-wide immediately.
    if (fontScale === 'small') {
      document.documentElement.classList.add('font-small');
      document.documentElement.style.fontSize = '12px';
    } else if (fontScale === 'large') {
      document.documentElement.classList.add('font-large');
      document.documentElement.style.fontSize = '16px';
    } else {
      document.documentElement.style.fontSize = '14px';
    }
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem('molr_high_contrast', highContrast.toString());
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

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

  const toggleReduceMotion = () => {
    setReduceMotion(prev => !prev);
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, previewTheme, clearPreview, commitTheme, 
      reduceMotion, toggleReduceMotion,
      fontScale, setFontScale,
      highContrast, toggleHighContrast
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
