# Claude Code Narrator

**AI-powered terminal session capture and narration tool**

## Overview

Claude Code Narrator captures terminal sessions and provides AI-generated audio narration of what's happening. Perfect for:

- **Accessibility** - Get audio descriptions of terminal activity for visually impaired users
- **Learning** - Understand complex command-line operations through plain English explanations
- **Documentation** - Generate natural language summaries of terminal sessions
- **Review** - Replay past sessions with AI narration at different detail levels

## Features

- **Split Pane View** - Native side-by-side terminals with resizable panes
- **Multi-Terminal Tabs** - Browser-style horizontal tabs for managing multiple terminal sessions
- **Terminal Capture** - Full-featured xterm.js terminal with real-time session recording
- **Local & SSH Sessions** - Connect to local shell or remote machines via SSH
- **AI Summarization** - Claude API generates summaries at three detail levels (Brief, Standard, Detailed)
- **Text-to-Speech** - Browser-native and OpenAI TTS with customizable voice, speed, and pitch
- **Session History** - Persistent storage of all sessions with transcript replay
- **Themes** - 10 color themes including Tokyo Night, Dracula, Nord, and more

## Quick Start

```bash
# Install dependencies
npm install

# Set up API key (create .env file)
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# Start both frontend and backend
npm run dev:all
```

## Access

The app auto-detects your network hostname. Access it at:

| Service | Default Port |
|---------|--------------|
| Frontend | 3006 |
| Backend API | 3086 |

Example: If your LAN IP is `10.10.10.24`, access at `http://10.10.10.24:3006`

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React App     │────▶│  Express Server │
│   (xterm.js)    │◀────│  (Socket.io)    │
│   Port 3006     │     │   Port 3086     │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
               ┌────▼────┐ ┌─────▼─────┐ ┌────▼────┐
               │ node-pty│ │  SQLite   │ │ Claude  │
               │ (PTY)   │ │ (Sessions)│ │   API   │
               └─────────┘ └───────────┘ └─────────┘
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, xterm.js
- **Backend**: Express, Socket.io, node-pty, better-sqlite3
- **AI**: Claude API (Anthropic)
- **TTS**: Web Speech API

## Version

Current: **v0.3.4**

Click the version number in the app footer to view the full changelog and roadmap.

---

*Powered by Ecoworks Web Architecture*

*© 2025 Ecoworks. All rights reserved.*
