# Changelog

## About

**Claude Code Narrator** is an AI-powered terminal session capture and narration tool. It records terminal sessions and uses Claude AI to generate natural language summaries that can be read aloud via text-to-speech.

**Use Cases:**
- **Accessibility** - Audio descriptions of terminal activity
- **Learning** - Plain English explanations of command-line operations
- **Documentation** - Generate summaries of terminal sessions
- **Review** - Replay past sessions with AI narration

**Access:** Auto-detects your network (Frontend: port 3006, API: port 3086)

---

## [0.3.0] - 2025-12-15

### Added
- **Horizontal Session Tabs** (Termius-style): Browser-like tab bar for multiple terminal sessions
  - Tab bar below header with connection status indicator (green dot = connected)
  - Session type icon (terminal for local, server for SSH)
  - Close button on each tab (appears on hover for inactive tabs)
  - "+" button to create new terminal tabs
  - Tab labels auto-update to show host name for SSH connections
- **Multi-Terminal Architecture**: New hooks and components for managing multiple sessions
  - `useMultiTerminal` hook for session state management
  - `MultiTerminal` component for rendering active terminal
  - `SessionTabs` component for the tab bar UI

### Changed
- Refactored from single-session to multi-session terminal architecture
- Terminal sessions now persist when switching between tabs

---

## [0.2.4] - 2025-12-13

### Added
- **SSH Presets**: Save and reuse SSH connection configurations
- **Clickable Presets**: Click a preset to instantly connect and switch to terminal
- **Directory Autocomplete**: Autocomplete dropdown with ~/Code folders for preset config
  - Default presets for HA Server and iMac
  - Dropdown selector for quick connections
  - Custom connection form for one-off connections
  - Default directory option (auto-cd after connect)
  - Initial command option (auto-run after cd, e.g., 'claude')
- **Terminal-First UI**: Major layout refactor
  - Terminal always visible (no more tabs)
  - Compact header with inline controls
  - Side drawer for history & narration (doesn't block terminal)
  - Settings moved to modal
- **Click-to-Play Summaries**: Play directly from history list by clicking summary tags
- **Transcript Viewer**: Modal to view raw terminal output used for AI summarization

### Changed
- Header now shows session type (Local/SSH) badge and End button
- Detail level (Brief/Standard/Detailed) as compact inline buttons
- Playback controls integrated into header

### Fixed
- **iPhone Notch Support**: Safe-area-insets for iPhone 14 Pro Dynamic Island
- **Mobile Terminal Font**: Reduced to 10px on mobile for better horizontal fit
- **Settings as Drawer**: Converted from modal to slide-out drawer (view terminal while settings open)
- Disabled accidental zoom on mobile with viewport meta tags

---

## [0.2.3] - 2025-12-13

### Added
- **OpenAI TTS Integration**: High-quality text-to-speech as alternative to browser voices
  - 6 premium voices: Nova, Alloy, Echo, Fable, Onyx, Shimmer
  - Speed control from 0.25x to 4x
  - TTS Engine toggle in Voice Settings (Browser / OpenAI)
  - Auto-detects availability from `OPENAI_API_KEY` in `.env`
  - Loading indicator while generating audio

### Changed
- Voice Settings UI now shows provider-specific options
- Shared volume control works with both TTS engines

---

## [0.2.2] - 2025-12-12

### Added
- **Product Tour**: 7-step guided walkthrough for new users
  - Auto-starts on first visit, restart via "?" button in header
  - Spotlight highlighting of UI elements
  - Progress dots and keyboard navigation (arrows, Enter, Escape)
  - Mobile-responsive positioning
- **Theme Switcher**: 10 color themes with live preview
  - Midnight (default), Tokyo Night, Dracula, Nord, Solarized Dark
  - Monokai, Gruvbox, One Dark, Catppuccin Mocha, Light Sepia
  - Color preview swatches in dropdown
  - Persists selection to localStorage
- CSS variables for consistent theming across components

### Fixed
- **TTS State Sync**: Improved reliability of real-time voice settings changes
  - Added polling to keep React state in sync with speechSynthesis API
  - Prevents race conditions during settings changes while speaking

## [0.2.1] - 2025-12-12

### Added
- **Toast Notifications**: Visual feedback for all user actions
  - Success toasts: "Session saved", "Summary generated"
  - Error toasts: "Connection failed", "API unavailable"
  - Info toasts: "Session started", "Session ended"
- Slide-in animation for toast messages
- Auto-dismiss after 4 seconds with manual close option

## [0.2.0] - 2025-12-12

### Added
- **Dynamic Network Configuration**: App auto-detects hostname - no more hardcoded IPs
- **Settings Persistence**: Voice settings (rate, pitch, volume, voice) saved to localStorage
- **Portable Architecture**: Works on any network without code changes

### Changed
- SSH form now starts with empty host/user fields (user must enter their own)
- API URLs dynamically constructed from `window.location.hostname`
- Updated README with portable access instructions

### Fixed
- Removed all hardcoded IP addresses from codebase

## [0.1.8] - 2025-12-12

### Added
- **Double-click to Play**: Double-click history items to auto-play narration
- **Auto-fit Layout**: UI automatically fits screen height without scrolling

### Fixed
- Fixed xterm dimensions error on initialization
- Compact header/footer for more content space

## [0.1.7] - 2025-12-11

### Added
- **Responsive Mobile Layout**: Tabbed navigation for screens under 1024px
  - Terminal, Controls, and History tabs
  - Touch-optimized buttons with larger tap targets
  - Stacked vertical layout for better mobile UX
- Improved spacing and typography for all screen sizes

## [0.1.6] - 2025-12-11

### Added
- **Quick Command Bar**: Command input with autocomplete below terminal
  - Quick buttons: ls, pwd, clear, exit
  - Full autocomplete for git, npm, and system commands
  - All Claude Code slash commands (/help, /status, /model, etc.)
- **Volume Control**: Slider for TTS volume (0-100%)
- **Real-time Voice Settings**: Changes apply immediately while speaking

## [0.1.5] - 2025-12-11

### Added
- **Resizable Panels**: Drag handles to resize terminal, narration pane, and sidebar
- Flexible layout that remembers your preferred pane sizes

## [0.1.4] - 2025-12-11

### Added
- **Changelog Modal**: Click version number in footer to view changelog and roadmap
- **Footer**: Added version display, Ecoworks branding, and copyright notice
- **Roadmap**: In-app roadmap showing planned and future features

## [0.1.3] - 2025-12-11

### Added
- **SSH Session Support**: Connect to remote machines via SSH
  - New SSH button alongside Local session option
  - SSH connection form with host, user, port configuration
  - Server-side SSH spawning via node-pty
  - Session type indicator badge (Local/SSH)
  - Connected host display in session info

## [0.1.2] - 2025-12-11

### Added
- Playwright for automated testing
- Verified full end-to-end flow working:
  - Terminal session creation
  - Command execution
  - Claude API summarization
  - TTS playback controls
  - Session history persistence

## [0.1.1] - 2025-12-11

### Added
- Environment variable support with dotenv
- `.env` file for API key configuration (gitignored)

### Security
- Added `.env` and `.env.local` to `.gitignore` to protect secrets
- API key no longer needs to be passed on command line

## [0.1.0] - 2025-12-11

### Added
- Initial project setup with Vite + React + TypeScript
- **Backend Server** (port 3086)
  - Express + Socket.io for WebSocket communication
  - node-pty for pseudo-terminal spawning
  - SQLite database for session storage
  - Claude API integration for AI summarization
  - Transcript persistence (JSON files)

- **Frontend App** (port 3006)
  - xterm.js terminal emulator with Tokyo Night theme
  - Real-time terminal I/O via WebSocket
  - Controls panel with detail level selection (Brief/Standard/Detailed)
  - TTS controls using Web Speech API (voice, rate, pitch)
  - Narration panel with play/pause/stop
  - Session history with transcript replay
  - Tailwind CSS styling

### Features
- **Terminal Session Capture**: Connect to a live bash shell
- **AI Summarization**: Three detail levels using Claude API
- **Text-to-Speech**: Browser-native voice synthesis
- **Transcript Recording**: Full session history with replay

---

## Roadmap

### Planned
- Multiple terminal tabs support
- Custom voice profiles
- Export transcripts to markdown
- Keyboard shortcuts

### Future
- Team collaboration features
- Cloud sync for transcripts
- Plugin system for custom narrators

---

*Powered by Ecoworks Web Architecture*
*© 2025 Ecoworks. All rights reserved.*
