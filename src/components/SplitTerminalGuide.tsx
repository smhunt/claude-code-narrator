interface SplitTerminalGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SplitTerminalGuide({ isOpen, onClose }: SplitTerminalGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 bg-theme-secondary border-l border-theme z-50 flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-theme">
        <h2 className="text-lg font-semibold text-theme-primary">Split Terminal Setup</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-theme-hover rounded-lg transition-colors text-theme-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="text-base font-medium text-theme-primary flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white text-sm">1</span>
            Create Multiple Terminals
          </h3>
          <div className="pl-8 space-y-2 text-sm text-theme-secondary">
            <p>Click the <strong className="text-theme-primary">+ button</strong> in the tab bar to create new terminal tabs.</p>
            <p>Each tab is an independent terminal session that persists when switching between tabs.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium text-theme-primary flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white text-sm">2</span>
            Connect to Different Servers
          </h3>
          <div className="pl-8 space-y-2 text-sm text-theme-secondary">
            <p>Use <strong className="text-theme-primary">Term</strong> for a local terminal session.</p>
            <p>Use <strong className="text-theme-primary">SSH</strong> to connect to remote servers.</p>
            <p>Use <strong className="text-theme-primary">Claude</strong> to start a Claude Code session.</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium text-theme-primary flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white text-sm">3</span>
            Side-by-Side View (Browser)
          </h3>
          <div className="pl-8 space-y-3 text-sm text-theme-secondary">
            <p>For a true split-screen experience, open Claude Code Narrator in two browser windows:</p>
            <div className="bg-theme-primary rounded-lg p-4 space-y-2 border border-theme">
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">a.</span>
                <span>Open this app in your browser</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">b.</span>
                <span>Press <kbd className="px-2 py-0.5 bg-theme-secondary rounded text-xs">Cmd+N</kbd> (Mac) or <kbd className="px-2 py-0.5 bg-theme-secondary rounded text-xs">Ctrl+N</kbd> (Windows) for a new window</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">c.</span>
                <span>Navigate to the same URL in the new window</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">d.</span>
                <span>Use your OS window management to tile them side by side</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium text-theme-primary flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white text-sm">4</span>
            macOS Split View
          </h3>
          <div className="pl-8 space-y-3 text-sm text-theme-secondary">
            <div className="bg-theme-primary rounded-lg p-4 space-y-2 border border-theme">
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">a.</span>
                <span>Hover over the green maximize button in the window title bar</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">b.</span>
                <span>Select "Tile Window to Left of Screen"</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">c.</span>
                <span>Click the other browser window to tile it to the right</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium text-theme-primary flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--accent-primary)] text-white text-sm">5</span>
            Windows Snap
          </h3>
          <div className="pl-8 space-y-3 text-sm text-theme-secondary">
            <div className="bg-theme-primary rounded-lg p-4 space-y-2 border border-theme">
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">a.</span>
                <span>Press <kbd className="px-2 py-0.5 bg-theme-secondary rounded text-xs">Win+Left</kbd> to snap first window to left</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[var(--accent-primary)]">b.</span>
                <span>Press <kbd className="px-2 py-0.5 bg-theme-secondary rounded text-xs">Win+Right</kbd> on second window to snap to right</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-base font-medium text-theme-primary flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L1 21h22L12 2zm0 4l7.53 13H4.47L12 6zm-1 6v4h2v-4h-2zm0 5v2h2v-2h-2z"/>
            </svg>
            Pro Tips
          </h3>
          <div className="pl-8 space-y-2 text-sm text-theme-secondary">
            <ul className="list-disc pl-4 space-y-1">
              <li>Each browser window maintains its own terminal tabs</li>
              <li>Use Connection Presets in Settings for quick SSH connections</li>
              <li>The Quick Commands bar works with the active terminal</li>
              <li>Terminal sessions are preserved when switching tabs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-theme">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
