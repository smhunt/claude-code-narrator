import type { ReactNode } from 'react';
import { getShortcutsByCategory } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryLabels: Record<string, { label: string; icon: ReactNode }> = {
  tabs: {
    label: 'Tab Management',
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  playback: {
    label: 'Playback',
    icon: (
      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  navigation: {
    label: 'Navigation',
    icon: (
      <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
  },
  general: {
    label: 'General',
    icon: (
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcutsByCategory = getShortcutsByCategory();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          <div className="space-y-5">
            {Object.entries(shortcutsByCategory).map(([category, shortcuts]) => {
              if (shortcuts.length === 0) return null;
              const { label, icon } = categoryLabels[category] || { label: category, icon: null };

              return (
                <section key={category}>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wide">
                    {icon}
                    {label}
                  </h3>
                  <div className="bg-gray-900/50 rounded-lg overflow-hidden">
                    {shortcuts.map((shortcut, idx) => {
                      // Parse the description to separate key combo from action
                      const [keyCombo, ...actionParts] = shortcut.description.split(': ');
                      const action = actionParts.join(': ');

                      return (
                        <div
                          key={shortcut.key}
                          className={`flex items-center justify-between px-3 py-2.5 ${
                            idx !== shortcuts.length - 1 ? 'border-b border-gray-800' : ''
                          }`}
                        >
                          <span className="text-gray-300 text-sm">{action}</span>
                          <kbd className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs font-mono border border-gray-600 shadow-sm">
                            {keyCombo}
                          </kbd>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {/* Tips */}
          <div className="mt-5 p-3 bg-blue-900/20 border border-blue-800/30 rounded-lg">
            <p className="text-xs text-blue-300">
              <strong>Tip:</strong> Space bar for play/pause only works when the terminal is not focused.
              Use <kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Esc</kbd> to stop playback anytime.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-700 bg-gray-900/50 text-center">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-xs font-mono">?</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-700 text-gray-300 rounded text-xs font-mono">Cmd+/</kbd> to show this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
