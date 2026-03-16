# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

All commands run from `app/`:

```bash
cd app
pnpm install          # Install dependencies
pnpm run build        # TypeScript compile (main) + Vite bundle (renderer)
pnpm start            # Run the built Electron app
pnpm run dev          # Dev mode: Vite HMR on :5174 + Electron with --dev flag
pnpm pack             # Build + create Windows NSIS installer in release/
```

## Testing Notifications

```bash
# Health check
curl http://127.0.0.1:9456/health

# Send a test notification
curl -X POST http://127.0.0.1:9456/notify -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello","accentColor":"#f59e0b"}'

# Simulate hook events
echo '{"hook_event_name":"Notification","message":"Test"}' | bash notify.sh
echo '{"hook_event_name":"Stop"}' | bash notify.sh
```

## Architecture

This is a **two-part system**: shell scripts that integrate with Claude Code hooks, and an Electron tray app that renders popup notifications.

### Data Flow

```
Claude Code hook → notify.sh (stdin JSON)
  → HTTP POST to 127.0.0.1:9456/notify (Electron app)
  → fallback: PowerShell toast via notify.ps1
```

### Shell Layer (repo root)

- **notify.sh** — Hook entry point. Parses `hook_event_name` from stdin JSON, maps events to title/message/accentColor, POSTs to the Electron app via curl, falls back to `notify.ps1` if curl fails.
- **notify.ps1** — PowerShell fallback for native Windows toast notifications.
- **install.sh** — Merges `Notification` and `Stop` hook entries into `~/.claude/settings.json`.

### Electron App (`app/`)

Two TypeScript compilation targets with separate tsconfigs:
- **Main process** (`src/main/`, `tsconfig.main.json`): CommonJS, outputs to `dist/main/`
- **Renderer** (`src/renderer/`, `tsconfig.json`): ESNext + React JSX, bundled by Vite to `dist/renderer/`

**Main process modules:**
- `main.ts` — Entry point. Single-instance lock, IPC handler for `dismiss-notification`, initializes tray and HTTP server.
- `http-server.ts` — Node `http` server on `127.0.0.1:9456`. Routes: `POST /notify` (accepts `{title, message, accentColor}`), `GET /health`.
- `window-manager.ts` — Creates frameless, transparent, always-on-top BrowserWindows. Manages slot-based stacking (max 5, bottom-right corner, stacking upward with 12px gap). Auto-dismisses after 8s. Reflows remaining windows on dismiss.
- `tray.ts` — System tray icon with Quit menu.
- `preload.ts` — contextBridge exposing `onNotificationData` and `dismissNotification` on `window.electronAPI`.

**IPC channels:**
- `notification-data` (main → renderer): Sends payload after window loads
- `dismiss-notification` (renderer → main): Resolved by `event.sender.id` to find the correct window

**Renderer** is a single React component (`Notification.tsx`) that receives data via IPC, animates in with CSS transitions, shows a progress bar countdown, and dismisses on click or timeout.

### Dev vs Prod URL Loading

Dev mode (`--dev` flag or `NODE_ENV=development`): renderer loads from `http://localhost:5174/notification.html`
Production: renderer loads from `dist/renderer/notification.html` via `loadFile`.

## Accent Colors by Event Type

| Event | Color | Hex |
|-------|-------|-----|
| Notification (needs input) | Amber | `#f59e0b` |
| Stop (task complete) | Green | `#22c55e` |
| Default | Blue | `#6c9fff` |

## Visual Theme

Matches CalendarWidget (`C:\Code\CalendarWidget\`): background `#1a1a2e`, border `#2a2a4a`, text `#e0e0e0`, 10px border-radius, 5px left accent bar, 3px bottom progress bar.
