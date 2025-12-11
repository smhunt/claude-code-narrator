# Changelog

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
