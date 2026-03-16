#!/usr/bin/env bash
# notify.sh - Claude Code hook wrapper that sends notifications
# Tries HTTP POST to AgentNotify Electron app first, falls back to PowerShell toast

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NOTIFY_PS1="$SCRIPT_DIR/notify.ps1"

# Read JSON from stdin
input=""
if [ ! -t 0 ]; then
    input=$(cat)
fi

# Extract hook_event_name using basic parsing
hook_event=""
if [ -n "$input" ]; then
    hook_event=$(echo "$input" | sed -n 's/.*"hook_event_name"\s*:\s*"\([^"]*\)".*/\1/p')
fi

# Extract current folder name
folder=$(basename "$PWD")

# Build title, message, and accent color based on event type
case "$hook_event" in
    Notification)
        title="Claude Code - Needs Input"
        accentColor="#f59e0b"
        # Try to extract the notification message from the JSON
        msg=$(echo "$input" | sed -n 's/.*"message"\s*:\s*"\([^"]*\)".*/\1/p')
        if [ -z "$msg" ]; then
            msg=$(echo "$input" | sed -n 's/.*"title"\s*:\s*"\([^"]*\)".*/\1/p')
        fi
        if [ -z "$msg" ]; then
            msg="Claude Code needs your attention"
        fi
        message="$msg"
        ;;
    Stop)
        title="Claude Code - Task Complete"
        accentColor="#22c55e"
        message="Claude Code has finished responding"
        ;;
    *)
        title="Claude Code"
        accentColor="#6c9fff"
        message="Hook event: ${hook_event:-unknown}"
        ;;
esac

# Try HTTP POST to AgentNotify Electron app (1-second connect timeout)
http_sent=false
if command -v curl &>/dev/null; then
    http_response=$(curl -s -o /dev/null -w "%{http_code}" \
        --connect-timeout 1 --max-time 2 \
        -X POST "http://127.0.0.1:9456/notify" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$title\",\"message\":\"$message\",\"accentColor\":\"$accentColor\",\"folder\":\"$folder\"}" 2>/dev/null)
    if [ "$http_response" = "200" ]; then
        http_sent=true
    fi
fi

# Fall back to PowerShell toast if HTTP failed
if [ "$http_sent" = false ]; then
    powershell.exe -ExecutionPolicy Bypass -NoProfile -File \
        "$(cygpath -w "$NOTIFY_PS1")" \
        -Title "$title" \
        -Message "$message" \
        -Folder "$folder"
fi
