# Claude Code Narrator

**AI-powered terminal session capture and narration tool**

## Overview

Claude Code Narrator captures terminal sessions and provides AI-generated audio narration of what's happening. Perfect for:

- **Accessibility** - Get audio descriptions of terminal activity for visually impaired users
- **Learning** - Understand complex command-line operations through plain English explanations
- **Documentation** - Generate natural language summaries of terminal sessions
- **Review** - Replay past sessions with AI narration at different detail levels

## Features

- **Terminal Capture** - Full-featured xterm.js terminal with real-time session recording
- **Local & SSH Sessions** - Connect to local shell or remote machines via SSH
- **AI Summarization** - Claude API generates summaries at three detail levels (Brief, Standard, Detailed)
- **Text-to-Speech** - Browser-native voice synthesis with customizable voice, speed, and pitch
- **Session History** - Persistent storage of all sessions with transcript replay
- **Dark Theme** - Tokyo Night-inspired terminal styling

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

| Service | URL |
|---------|-----|
| Frontend | http://10.10.10.24:3006 |
| Backend API | http://10.10.10.24:3086 |

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

Current: **v0.1.4**

Click the version number in the app footer to view the full changelog and roadmap.

---

*Powered by Ecoworks Web Architecture*

*© 2025 Ecoworks. All rights reserved.*
