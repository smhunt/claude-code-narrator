export interface Theme {
  id: string;
  name: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accentPrimary: string;
    accentHover: string;
    accentText: string;
    border: string;
    terminalBg: string;
    success: string;
    successHover: string;
    danger: string;
    dangerHover: string;
    warning: string;
    warningHover: string;
  };
}

export const themes: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bgPrimary: '#111827',
      bgSecondary: '#1f2937',
      bgTertiary: '#374151',
      textPrimary: '#ffffff',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
      accentPrimary: '#3b82f6',
      accentHover: '#2563eb',
      accentText: '#ffffff',
      border: '#374151',
      terminalBg: '#0d1117',
      success: '#16a34a',
      successHover: '#15803d',
      danger: '#dc2626',
      dangerHover: '#b91c1c',
      warning: '#ca8a04',
      warningHover: '#a16207',
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    colors: {
      bgPrimary: '#1a1b26',
      bgSecondary: '#24283b',
      bgTertiary: '#414868',
      textPrimary: '#c0caf5',
      textSecondary: '#a9b1d6',
      textMuted: '#565f89',
      accentPrimary: '#7aa2f7',
      accentHover: '#5d7de0',
      accentText: '#1a1b26',
      border: '#414868',
      terminalBg: '#16161e',
      success: '#9ece6a',
      successHover: '#7cb85d',
      danger: '#f7768e',
      dangerHover: '#e05874',
      warning: '#e0af68',
      warningHover: '#c99a4d',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      bgPrimary: '#282a36',
      bgSecondary: '#343746',
      bgTertiary: '#44475a',
      textPrimary: '#f8f8f2',
      textSecondary: '#bfbfbf',
      textMuted: '#6272a4',
      accentPrimary: '#bd93f9',
      accentHover: '#a67de8',
      accentText: '#282a36',
      border: '#44475a',
      terminalBg: '#21222c',
      success: '#50fa7b',
      successHover: '#3de066',
      danger: '#ff5555',
      dangerHover: '#e04040',
      warning: '#f1fa8c',
      warningHover: '#d4dd7a',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      bgPrimary: '#2e3440',
      bgSecondary: '#3b4252',
      bgTertiary: '#434c5e',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      textMuted: '#4c566a',
      accentPrimary: '#88c0d0',
      accentHover: '#6eb2c4',
      accentText: '#2e3440',
      border: '#4c566a',
      terminalBg: '#242933',
      success: '#a3be8c',
      successHover: '#8faa78',
      danger: '#bf616a',
      dangerHover: '#a8525a',
      warning: '#ebcb8b',
      warningHover: '#d4b577',
    },
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    colors: {
      bgPrimary: '#002b36',
      bgSecondary: '#073642',
      bgTertiary: '#094959',
      textPrimary: '#fdf6e3',
      textSecondary: '#93a1a1',
      textMuted: '#586e75',
      accentPrimary: '#b58900',
      accentHover: '#9a7400',
      accentText: '#002b36',
      border: '#094959',
      terminalBg: '#001e26',
      success: '#859900',
      successHover: '#6d7d00',
      danger: '#dc322f',
      dangerHover: '#c42926',
      warning: '#cb4b16',
      warningHover: '#b04012',
    },
  },
  {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      bgPrimary: '#272822',
      bgSecondary: '#3e3d32',
      bgTertiary: '#49483e',
      textPrimary: '#f8f8f2',
      textSecondary: '#cfcfc2',
      textMuted: '#75715e',
      accentPrimary: '#f92672',
      accentHover: '#d91e63',
      accentText: '#ffffff',
      border: '#49483e',
      terminalBg: '#1e1f1a',
      success: '#a6e22e',
      successHover: '#8fc926',
      danger: '#f92672',
      dangerHover: '#d91e63',
      warning: '#fd971f',
      warningHover: '#e0851a',
    },
  },
  {
    id: 'gruvbox',
    name: 'Gruvbox',
    colors: {
      bgPrimary: '#282828',
      bgSecondary: '#3c3836',
      bgTertiary: '#504945',
      textPrimary: '#ebdbb2',
      textSecondary: '#d5c4a1',
      textMuted: '#928374',
      accentPrimary: '#fe8019',
      accentHover: '#d96c0c',
      accentText: '#282828',
      border: '#504945',
      terminalBg: '#1d2021',
      success: '#b8bb26',
      successHover: '#9ba220',
      danger: '#fb4934',
      dangerHover: '#d63c2b',
      warning: '#fabd2f',
      warningHover: '#d9a426',
    },
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    colors: {
      bgPrimary: '#282c34',
      bgSecondary: '#2c323c',
      bgTertiary: '#3e4451',
      textPrimary: '#abb2bf',
      textSecondary: '#9da5b4',
      textMuted: '#5c6370',
      accentPrimary: '#61afef',
      accentHover: '#4e9bdb',
      accentText: '#282c34',
      border: '#3e4451',
      terminalBg: '#21252b',
      success: '#98c379',
      successHover: '#82ad65',
      danger: '#e06c75',
      dangerHover: '#c85860',
      warning: '#e5c07b',
      warningHover: '#cca966',
    },
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin Mocha',
    colors: {
      bgPrimary: '#1e1e2e',
      bgSecondary: '#313244',
      bgTertiary: '#45475a',
      textPrimary: '#cdd6f4',
      textSecondary: '#bac2de',
      textMuted: '#6c7086',
      accentPrimary: '#cba6f7',
      accentHover: '#b48ee8',
      accentText: '#1e1e2e',
      border: '#45475a',
      terminalBg: '#181825',
      success: '#a6e3a1',
      successHover: '#8fd18a',
      danger: '#f38ba8',
      dangerHover: '#e07393',
      warning: '#f9e2af',
      warningHover: '#e4cf9a',
    },
  },
  {
    id: 'light-sepia',
    name: 'Light Sepia',
    colors: {
      bgPrimary: '#f5f0e6',
      bgSecondary: '#ebe5d9',
      bgTertiary: '#ddd7cb',
      textPrimary: '#3d3929',
      textSecondary: '#5c5647',
      textMuted: '#8a8477',
      accentPrimary: '#8b6914',
      accentHover: '#725610',
      accentText: '#ffffff',
      border: '#ccc6ba',
      terminalBg: '#faf6ed',
      success: '#4a7c23',
      successHover: '#3d671c',
      danger: '#b33b3b',
      dangerHover: '#962f2f',
      warning: '#a67c00',
      warningHover: '#8a6700',
    },
  },
];

export const DEFAULT_THEME_ID = 'midnight';

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  const { colors } = theme;

  root.style.setProperty('--bg-primary', colors.bgPrimary);
  root.style.setProperty('--bg-secondary', colors.bgSecondary);
  root.style.setProperty('--bg-tertiary', colors.bgTertiary);
  root.style.setProperty('--text-primary', colors.textPrimary);
  root.style.setProperty('--text-secondary', colors.textSecondary);
  root.style.setProperty('--text-muted', colors.textMuted);
  root.style.setProperty('--accent-primary', colors.accentPrimary);
  root.style.setProperty('--accent-hover', colors.accentHover);
  root.style.setProperty('--accent-text', colors.accentText);
  root.style.setProperty('--border', colors.border);
  root.style.setProperty('--terminal-bg', colors.terminalBg);
  root.style.setProperty('--success', colors.success);
  root.style.setProperty('--success-hover', colors.successHover);
  root.style.setProperty('--danger', colors.danger);
  root.style.setProperty('--danger-hover', colors.dangerHover);
  root.style.setProperty('--warning', colors.warning);
  root.style.setProperty('--warning-hover', colors.warningHover);

  // Store theme preference
  localStorage.setItem('narrator-theme', theme.id);
}

export function loadSavedTheme(): Theme {
  const savedId = localStorage.getItem('narrator-theme');
  return getThemeById(savedId || DEFAULT_THEME_ID);
}
