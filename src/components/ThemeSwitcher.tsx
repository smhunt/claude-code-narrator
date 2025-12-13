import { useState, useRef, useEffect } from 'react';
import { themes, type Theme } from '../lib/themes';

interface ThemeSwitcherProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export function ThemeSwitcher({ currentTheme, onThemeChange }: ThemeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-theme-tertiary text-theme-primary hover:opacity-80 transition-opacity w-full"
      >
        <ThemePreview colors={currentTheme.colors} size="sm" />
        <span className="flex-1 text-left text-sm">{currentTheme.name}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-theme-secondary border border-theme rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
          <div className="p-2 grid grid-cols-2 gap-2">
            {themes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  onThemeChange(theme);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  currentTheme.id === theme.id
                    ? 'bg-theme-tertiary ring-2 ring-offset-1'
                    : 'hover:bg-theme-tertiary'
                }`}
                style={
                  currentTheme.id === theme.id
                    ? {
                        '--tw-ring-color': theme.colors.accentPrimary,
                        '--tw-ring-offset-color': 'var(--bg-secondary)',
                      } as React.CSSProperties
                    : undefined
                }
              >
                <ThemePreview colors={theme.colors} size="md" />
                <span className="text-xs text-theme-primary truncate">{theme.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ThemePreviewProps {
  colors: Theme['colors'];
  size: 'sm' | 'md';
}

function ThemePreview({ colors, size }: ThemePreviewProps) {
  const sizeClasses = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';

  return (
    <div
      className={`${sizeClasses} rounded-md overflow-hidden flex-shrink-0 border`}
      style={{ borderColor: colors.border }}
    >
      <div className="h-1/2 flex">
        <div className="w-1/2" style={{ backgroundColor: colors.bgPrimary }} />
        <div className="w-1/2" style={{ backgroundColor: colors.accentPrimary }} />
      </div>
      <div className="h-1/2 flex">
        <div className="w-1/2" style={{ backgroundColor: colors.bgSecondary }} />
        <div className="w-1/2" style={{ backgroundColor: colors.terminalBg }} />
      </div>
    </div>
  );
}
