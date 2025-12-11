# Changelog

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
