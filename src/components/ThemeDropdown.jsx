import React, { useState, useRef, useEffect } from 'react';
import { useTheme, themes } from '../context/ThemeContext';
import { ChevronDown } from 'lucide-react';

export default function ThemeDropdown() {
  const { theme, commitTheme, previewTheme, clearPreview } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeThemeObj = themes.find(t => t.id === theme) || themes[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseLeave = () => {
    clearPreview();
  };

  return (
    <div className="relative w-full" ref={dropdownRef} onMouseLeave={handleMouseLeave}>
      <button 
        type="button"
        className="w-full flex items-center justify-between p-3 rounded-lg dropdown-trigger focus-visible"
        aria-expanded={isOpen}
        style={{ color: 'var(--text-main)' }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Theme"
      >
        <div className="flex items-center gap-3 font-medium">
          <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: activeThemeObj.color, border: '1px solid var(--border-color)' }}></div>
          {activeThemeObj.name}
        </div>
        <ChevronDown size={20} className="text-muted" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full rounded-xl shadow-lg border z-50 overflow-hidden dropdown-anim" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border-color)' }}>
          {themes.map((t) => (
            <button
              key={t.id}
              className="w-full flex items-center gap-3 p-3 text-left transition-colors font-medium focus-visible"
              style={{ 
                border: 'none',
                backgroundColor: theme === t.id ? 'var(--primary-light)' : 'transparent',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                previewTheme(t.id);
                if (theme !== t.id) e.currentTarget.style.backgroundColor = 'var(--primary-light)';
              }}
              onMouseLeave={(e) => {
                if (theme !== t.id) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              onClick={() => {
                commitTheme(t.id);
                setIsOpen(false);
              }}
              aria-label={`Preview ${t.name} theme`}
            >
              <div className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: t.color, border: '1px solid var(--border-color)' }}></div>
              <span style={{ color: theme === t.id ? 'var(--primary)' : 'var(--text-main)' }}>{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
