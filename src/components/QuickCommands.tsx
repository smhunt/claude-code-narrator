import { useState, useRef, useEffect } from 'react';

interface QuickCommandsProps {
  onCommand: (command: string) => void;
}

const QUICK_BUTTONS = [
  { label: 'ls', command: 'ls -la', icon: '📁' },
  { label: 'pwd', command: 'pwd', icon: '📍' },
  { label: 'clear', command: 'clear', icon: '🧹' },
  { label: 'exit', command: 'exit', icon: '🚪' },
];

const COMMANDS = [
  // Navigation
  { cmd: 'cd', desc: 'Change directory', category: 'nav' },
  { cmd: 'cd ~', desc: 'Go to home directory', category: 'nav' },
  { cmd: 'cd ..', desc: 'Go up one directory', category: 'nav' },
  { cmd: 'cd -', desc: 'Go to previous directory', category: 'nav' },
  { cmd: 'ls', desc: 'List files', category: 'nav' },
  { cmd: 'ls -la', desc: 'List all files with details', category: 'nav' },
  { cmd: 'pwd', desc: 'Print working directory', category: 'nav' },

  // Git
  { cmd: 'git status', desc: 'Show git status', category: 'git' },
  { cmd: 'git log --oneline -10', desc: 'Show recent commits', category: 'git' },
  { cmd: 'git diff', desc: 'Show unstaged changes', category: 'git' },
  { cmd: 'git branch', desc: 'List branches', category: 'git' },
  { cmd: 'git pull', desc: 'Pull from remote', category: 'git' },
  { cmd: 'git push', desc: 'Push to remote', category: 'git' },

  // Claude Code
  { cmd: '/help', desc: 'Show Claude Code help', category: 'claude' },
  { cmd: '/status', desc: 'Show session status', category: 'claude' },
  { cmd: '/compact', desc: 'Toggle compact mode', category: 'claude' },
  { cmd: '/clear', desc: 'Clear conversation', category: 'claude' },
  { cmd: '/config', desc: 'Open configuration', category: 'claude' },
  { cmd: '/doctor', desc: 'Run diagnostics', category: 'claude' },
  { cmd: '/init', desc: 'Initialize project', category: 'claude' },
  { cmd: '/mcp', desc: 'MCP server management', category: 'claude' },
  { cmd: '/model', desc: 'Change model', category: 'claude' },
  { cmd: '/permissions', desc: 'Manage permissions', category: 'claude' },
  { cmd: '/review', desc: 'Review code', category: 'claude' },
  { cmd: '/vim', desc: 'Toggle vim mode', category: 'claude' },

  // System
  { cmd: 'clear', desc: 'Clear terminal', category: 'sys' },
  { cmd: 'exit', desc: 'Exit session', category: 'sys' },
  { cmd: 'which', desc: 'Show command path', category: 'sys' },
  { cmd: 'whoami', desc: 'Show current user', category: 'sys' },
  { cmd: 'df -h', desc: 'Show disk space', category: 'sys' },
  { cmd: 'top', desc: 'Show processes', category: 'sys' },
  { cmd: 'htop', desc: 'Interactive process viewer', category: 'sys' },

  // Development
  { cmd: 'npm install', desc: 'Install dependencies', category: 'dev' },
  { cmd: 'npm run dev', desc: 'Start dev server', category: 'dev' },
  { cmd: 'npm run build', desc: 'Build project', category: 'dev' },
  { cmd: 'npm test', desc: 'Run tests', category: 'dev' },
  { cmd: 'npx', desc: 'Run npm package', category: 'dev' },
];

export function QuickCommands({ onCommand }: QuickCommandsProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<typeof COMMANDS>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (input.length > 0) {
      const filtered = COMMANDS.filter(
        (c) =>
          c.cmd.toLowerCase().includes(input.toLowerCase()) ||
          c.desc.toLowerCase().includes(input.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && suggestions[selectedIndex]) {
        executeCommand(suggestions[selectedIndex].cmd);
      } else if (input.trim()) {
        executeCommand(input.trim());
      }
    } else if (e.key === 'Tab' && showSuggestions && suggestions[selectedIndex]) {
      e.preventDefault();
      setInput(suggestions[selectedIndex].cmd);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const executeCommand = (cmd: string) => {
    onCommand(cmd + '\r');
    setInput('');
    setShowSuggestions(false);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'claude': return 'text-purple-400';
      case 'git': return 'text-orange-400';
      case 'dev': return 'text-green-400';
      case 'nav': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-2">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Quick buttons */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {QUICK_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              onClick={() => executeCommand(btn.command)}
              className="px-3 py-2 sm:px-2 sm:py-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-300 rounded text-sm sm:text-xs transition-colors flex items-center gap-1 whitespace-nowrap touch-manipulation"
              title={btn.command}
            >
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Command input with autocomplete */}
        <div className="flex-1 relative flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => input.length > 0 && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Type command or /..."
            className="flex-1 px-3 py-2 sm:py-1.5 bg-gray-900 text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <button
            onClick={() => input.trim() && executeCommand(input.trim())}
            disabled={!input.trim()}
            className="px-4 py-2 sm:px-3 sm:py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-600 text-white rounded text-sm transition-colors touch-manipulation"
          >
            Run
          </button>

          {/* Autocomplete dropdown */}
          {showSuggestions && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={suggestion.cmd}
                  onClick={() => executeCommand(suggestion.cmd)}
                  className={`w-full px-3 py-3 sm:py-2 text-left text-sm flex items-center justify-between transition-colors touch-manipulation ${
                    idx === selectedIndex ? 'bg-gray-700' : 'hover:bg-gray-800 active:bg-gray-700'
                  }`}
                >
                  <span className={`font-mono ${getCategoryColor(suggestion.category)}`}>
                    {suggestion.cmd}
                  </span>
                  <span className="text-gray-500 text-xs truncate ml-2 hidden sm:inline">
                    {suggestion.desc}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
