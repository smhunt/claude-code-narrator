interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const APP_VERSION = '0.1.4';

const changelog = [
  {
    version: '0.1.4',
    date: '2025-12-11',
    changes: [
      'Changelog modal: Click version to view changelog and roadmap',
      'Footer with version, Ecoworks branding, and copyright',
      'In-app roadmap showing planned and future features',
    ],
  },
  {
    version: '0.1.3',
    date: '2025-12-11',
    changes: [
      'SSH Session Support: Connect to remote machines via SSH',
      'SSH connection form with host, user, port configuration',
      'Session type indicator badge (Local/SSH)',
    ],
  },
  {
    version: '0.1.2',
    date: '2025-12-11',
    changes: [
      'Playwright for automated testing',
      'Verified full end-to-end flow working',
    ],
  },
  {
    version: '0.1.1',
    date: '2025-12-11',
    changes: [
      'Environment variable support with dotenv',
      'Secure API key configuration',
    ],
  },
  {
    version: '0.1.0',
    date: '2025-12-11',
    changes: [
      'Initial release with terminal capture',
      'AI summarization via Claude API',
      'Text-to-speech narration',
      'Session history with transcript replay',
    ],
  },
];

const roadmap = [
  { status: 'planned', item: 'Multiple terminal tabs support' },
  { status: 'planned', item: 'Custom voice profiles' },
  { status: 'planned', item: 'Export transcripts to markdown' },
  { status: 'planned', item: 'Keyboard shortcuts' },
  { status: 'future', item: 'Team collaboration features' },
  { status: 'future', item: 'Cloud sync for transcripts' },
  { status: 'future', item: 'Plugin system for custom narrators' },
];

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Claude Code Narrator</h2>
            <p className="text-sm text-gray-400">Version {APP_VERSION}</p>
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
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Changelog Section */}
          <section className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Changelog
            </h3>
            <div className="space-y-4">
              {changelog.map((release) => (
                <div key={release.version} className="bg-gray-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-blue-600 text-xs rounded font-mono">
                      v{release.version}
                    </span>
                    <span className="text-gray-500 text-xs">{release.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {release.changes.map((change, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">+</span>
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Roadmap Section */}
          <section>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Roadmap
            </h3>
            <div className="grid gap-2">
              {roadmap.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-gray-900/50 rounded-lg p-2"
                >
                  <span
                    className={`px-2 py-0.5 text-xs rounded ${
                      item.status === 'planned'
                        ? 'bg-yellow-600/30 text-yellow-400'
                        : 'bg-gray-600/30 text-gray-400'
                    }`}
                  >
                    {item.status === 'planned' ? 'Planned' : 'Future'}
                  </span>
                  <span className="text-sm text-gray-300">{item.item}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-900/50">
          <p className="text-center text-xs text-gray-500">
            Powered by <span className="text-blue-400 font-medium">Ecoworks Web Architecture</span>
          </p>
          <p className="text-center text-xs text-gray-600 mt-1">
            &copy; {new Date().getFullYear()} Ecoworks. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export { APP_VERSION };
