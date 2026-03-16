#!/usr/bin/env bash
# notify.sh - Claude Code hook wrapper that sends notifications
# Sends HTTP POST to AgentNotify Electron app

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Extract project root folder name (use git root if available, else cwd basename)
cwd=$(echo "$input" | sed -n 's/.*"cwd"\s*:\s*"\([^"]*\)".*/\1/p')
if [ -z "$cwd" ]; then
    cwd="$PWD"
fi
git_root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)
if [ -n "$git_root" ]; then
    folder=$(basename "$git_root")
else
    folder=$(basename "$cwd")
fi

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

# Send HTTP POST to AgentNotify Electron app (1-second connect timeout)
if command -v curl &>/dev/null; then
    curl -s -o /dev/null \
        --connect-timeout 1 --max-time 2 \
        -X POST "http://127.0.0.1:9456/notify" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$title\",\"message\":\"$message\",\"accentColor\":\"$accentColor\",\"folder\":\"$folder\"}" 2>/dev/null
fi
