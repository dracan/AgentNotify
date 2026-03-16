# AgentNotify

Custom popup notifications for Claude Code hooks. Get notified when Claude Code needs input or finishes a task — with styled, non-intrusive Electron popups instead of generic Windows toasts.

## Requirements

- Windows 10/11
- Claude Code running in bash/MSYS2 shell
- Node.js and pnpm
- PowerShell 5.1+ (fallback only)

## Installation

```bash
# Install Claude Code hooks
bash install.sh

# Build and start the Electron notification app
cd app
pnpm install
pnpm run build
pnpm start
```

The install script adds hooks to `~/.claude/settings.json` for the `Notification` and `Stop` events.

## How It Works

1. Claude Code fires a hook event (`Notification` or `Stop`)
2. The hook runs `notify.sh`, passing event JSON via stdin
3. `notify.sh` sends an HTTP POST to the Electron app at `http://127.0.0.1:9456/notify`
4. The app creates a frameless, always-on-top popup in the bottom-right corner
5. If the Electron app isn't running, `notify.sh` falls back to a PowerShell toast via `notify.ps1`

### Notification Features

- **Stacking**: Multiple notifications stack upward (max 5), reflowing when one dismisses
- **Auto-dismiss**: Each popup auto-dismisses after 8 seconds with a progress bar
- **Click to dismiss**: Click anywhere on a notification to dismiss it early
- **Color-coded**: Amber accent for input needed, green for task complete, blue for other events
- **Non-intrusive**: Popups appear without stealing focus

## Manual Testing

Test via HTTP (requires the Electron app to be running):

```bash
curl -X POST http://127.0.0.1:9456/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello from AgentNotify","accentColor":"#f59e0b"}'
```

Test the bash wrapper (hook simulation):

```bash
echo '{"hook_event_name":"Stop"}' | bash notify.sh
echo '{"hook_event_name":"Notification","message":"Permission needed"}' | bash notify.sh
```

Test PowerShell fallback directly:

```bash
powershell.exe -ExecutionPolicy Bypass -File C:/Code/AgentNotify/notify.ps1 -Title "Test" -Message "Hello"
```

## Development

```bash
cd app
pnpm run dev
```

This starts Vite on port 5174 with hot-reload for the renderer, and launches Electron in dev mode.

## Files

| File | Purpose |
|------|---------|
| `notify.sh` | Bash wrapper — HTTP POST to Electron app, PowerShell fallback |
| `notify.ps1` | PowerShell script for native Windows toast notifications (fallback) |
| `install.sh` | Adds hooks to `~/.claude/settings.json` and builds the Electron app |
| `app/` | Electron + React + TypeScript + Vite notification app |
| `app/src/main/` | Main process — HTTP server, window manager, tray, preload |
| `app/src/renderer/` | Renderer — React notification component, CSS, types |

## Uninstall

Remove the `Notification` and `Stop` entries from `~/.claude/settings.json`, then close the Electron app from the system tray.
