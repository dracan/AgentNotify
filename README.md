# AgentNotify

Windows toast notifications for Claude Code hooks. Get notified when Claude Code needs input or finishes a task.

## Requirements

- Windows 10/11
- Claude Code running in bash/MSYS2 shell
- PowerShell 5.1+ (included with Windows)

## Installation

```bash
bash install.sh
```

This adds hooks to `~/.claude/settings.json` for the `Notification` and `Stop` events.

## Manual Testing

Test the PowerShell notification directly:

```bash
powershell.exe -ExecutionPolicy Bypass -File C:/Code/AgentNotify/notify.ps1 -Title "Test" -Message "Hello from AgentNotify"
```

Test the bash wrapper:

```bash
echo '{"hook_event_name":"Stop"}' | bash notify.sh
echo '{"hook_event_name":"Notification","message":"Permission needed"}' | bash notify.sh
```

## How It Works

1. Claude Code fires a hook event (`Notification` or `Stop`)
2. The hook runs `notify.sh`, passing event JSON via stdin
3. `notify.sh` parses the event and calls `notify.ps1` with a title and message
4. `notify.ps1` displays a native Windows toast notification

## Files

| File | Purpose |
|------|---------|
| `notify.ps1` | PowerShell script that shows Windows toast notifications |
| `notify.sh` | Bash wrapper that parses hook JSON and calls PowerShell |
| `install.sh` | Adds hooks to `~/.claude/settings.json` |

## Uninstall

Remove the `Notification` and `Stop` entries from `~/.claude/settings.json`.
