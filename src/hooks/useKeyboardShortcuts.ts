import { useEffect, useCallback } from 'react';

export interface KeyboardShortcutActions {
  // Tab management
  newTab: () => void;
  closeTab: () => void;
  nextTab: () => void;
  prevTab: () => void;
  goToTab: (index: number) => void;

  // Playback
  togglePlayPause: () => void;
  stopPlayback: () => void;

  // UI
  toggleSettings: () => void;
  toggleHistory: () => void;
  showShortcutsHelp: () => void;

  // Focus
  focusTerminal: () => void;
}

export interface ShortcutDefinition {
  key: string;
  modifiers: ('meta' | 'ctrl' | 'shift' | 'alt')[];
  description: string;
  category: 'tabs' | 'playback' | 'navigation' | 'general';
}

// Platform-aware modifier key
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const modKey = isMac ? 'meta' : 'ctrl';
const modKeySymbol = isMac ? '⌘' : 'Ctrl';

export const SHORTCUTS: Record<string, ShortcutDefinition> = {
  newTab: { key: 't', modifiers: [modKey], description: `${modKeySymbol}+T: New tab`, category: 'tabs' },
  closeTab: { key: 'w', modifiers: [modKey], description: `${modKeySymbol}+W: Close tab`, category: 'tabs' },
  nextTab: { key: ']', modifiers: [modKey, 'shift'], description: `${modKeySymbol}+Shift+]: Next tab`, category: 'tabs' },
  prevTab: { key: '[', modifiers: [modKey, 'shift'], description: `${modKeySymbol}+Shift+[: Previous tab`, category: 'tabs' },
  tab1: { key: '1', modifiers: [modKey], description: `${modKeySymbol}+1-9: Go to tab`, category: 'tabs' },

  togglePlayPause: { key: ' ', modifiers: [], description: 'Space: Play/Pause', category: 'playback' },
  stopPlayback: { key: 'Escape', modifiers: [], description: 'Esc: Stop playback', category: 'playback' },

  toggleSettings: { key: ',', modifiers: [modKey], description: `${modKeySymbol}+,: Settings`, category: 'navigation' },
  toggleHistory: { key: 'h', modifiers: [modKey, 'shift'], description: `${modKeySymbol}+Shift+H: History`, category: 'navigation' },
  focusTerminal: { key: '`', modifiers: [modKey], description: `${modKeySymbol}+\`: Focus terminal`, category: 'navigation' },

  showShortcutsHelp: { key: '/', modifiers: [modKey], description: `${modKeySymbol}+/: Show shortcuts`, category: 'general' },
};

// Get all shortcuts organized by category
export function getShortcutsByCategory(): Record<string, { key: string; description: string }[]> {
  const categories: Record<string, { key: string; description: string }[]> = {
    tabs: [],
    playback: [],
    navigation: [],
    general: [],
  };

  Object.entries(SHORTCUTS).forEach(([key, shortcut]) => {
    // Skip individual tab numbers, we just show "1-9"
    if (key.startsWith('tab') && key !== 'tab1') return;

    categories[shortcut.category].push({
      key,
      description: shortcut.description,
    });
  });

  return categories;
}

export function useKeyboardShortcuts(
  actions: KeyboardShortcutActions,
  options: {
    enabled?: boolean;
    terminalFocused?: boolean;
  } = {}
): void {
  const { enabled = true, terminalFocused = false } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if we're in an input field (but not the terminal)
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Get modifier state
      const hasCtrl = event.ctrlKey;
      const hasMeta = event.metaKey;
      const hasShift = event.shiftKey;
      const hasModKey = isMac ? hasMeta : hasCtrl;

      const key = event.key;

      // Always allow Escape
      if (key === 'Escape') {
        actions.stopPlayback();
        return;
      }

      // Skip shortcuts when focused on inputs (except for mod+key combos)
      if (isInput && !hasModKey) return;

      // Tab management shortcuts (require mod key)
      if (hasModKey) {
        // Cmd/Ctrl + T: New tab
        if (key === 't' && !hasShift) {
          event.preventDefault();
          actions.newTab();
          return;
        }

        // Cmd/Ctrl + W: Close tab
        if (key === 'w' && !hasShift) {
          event.preventDefault();
          actions.closeTab();
          return;
        }

        // Cmd/Ctrl + Shift + ]: Next tab
        if (key === ']' && hasShift) {
          event.preventDefault();
          actions.nextTab();
          return;
        }

        // Cmd/Ctrl + Shift + [: Previous tab
        if (key === '[' && hasShift) {
          event.preventDefault();
          actions.prevTab();
          return;
        }

        // Cmd/Ctrl + 1-9: Go to tab
        if (/^[1-9]$/.test(key) && !hasShift) {
          event.preventDefault();
          actions.goToTab(parseInt(key, 10) - 1);
          return;
        }

        // Cmd/Ctrl + ,: Settings
        if (key === ',' && !hasShift) {
          event.preventDefault();
          actions.toggleSettings();
          return;
        }

        // Cmd/Ctrl + Shift + H: History
        if ((key === 'h' || key === 'H') && hasShift) {
          event.preventDefault();
          actions.toggleHistory();
          return;
        }

        // Cmd/Ctrl + `: Focus terminal
        if (key === '`' && !hasShift) {
          event.preventDefault();
          actions.focusTerminal();
          return;
        }

        // Cmd/Ctrl + /: Show shortcuts help
        if (key === '/' && !hasShift) {
          event.preventDefault();
          actions.showShortcutsHelp();
          return;
        }
      }

      // Space: Play/Pause (only when not in input and not in terminal)
      if (key === ' ' && !isInput && !terminalFocused && !hasModKey) {
        event.preventDefault();
        actions.togglePlayPause();
        return;
      }

      // ? (Shift + /): Show shortcuts help (alternative)
      if (key === '?' && !isInput && !terminalFocused) {
        event.preventDefault();
        actions.showShortcutsHelp();
        return;
      }
    },
    [actions, enabled, terminalFocused]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
