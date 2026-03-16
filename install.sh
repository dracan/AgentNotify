#!/usr/bin/env bash
# install.sh - Adds AgentNotify hooks to ~/.claude/settings.json

set -e

SETTINGS_FILE="$HOME/.claude/settings.json"
NOTIFY_CMD="bash C:/Code/AgentNotify/notify.sh"

echo "AgentNotify Installer"
echo "====================="

# Ensure ~/.claude directory exists
mkdir -p "$HOME/.claude"

# Read existing settings or start with empty object
if [ -f "$SETTINGS_FILE" ]; then
    existing=$(cat "$SETTINGS_FILE")
    echo "Found existing settings at $SETTINGS_FILE"
else
    existing='{}'
    echo "No existing settings found, creating new file"
fi

# Build the hooks JSON to merge
hooks_json=$(cat <<'HOOKEOF'
{
    "Notification": [
        {
            "matcher": "",
            "hooks": [
                {
                    "type": "command",
                    "command": "NOTIFY_CMD_PLACEHOLDER"
                }
            ]
        }
    ],
    "Stop": [
        {
            "matcher": "",
            "hooks": [
                {
                    "type": "command",
                    "command": "NOTIFY_CMD_PLACEHOLDER"
                }
            ]
        }
    ]
}
HOOKEOF
)

# Replace placeholder with actual command
hooks_json=$(echo "$hooks_json" | sed "s|NOTIFY_CMD_PLACEHOLDER|$NOTIFY_CMD|g")

# Check if python3 or python is available for JSON merging
PYTHON=""
if command -v python3 &>/dev/null; then
    PYTHON="python3"
elif command -v python &>/dev/null; then
    PYTHON="python"
fi

if [ -n "$PYTHON" ]; then
    # Use Python to properly merge JSON
    merged=$($PYTHON -c "
import json, sys

existing = json.loads('''$existing''')
hooks = json.loads('''$hooks_json''')

if 'hooks' not in existing:
    existing['hooks'] = {}

existing['hooks'].update(hooks)

print(json.dumps(existing, indent=2))
")
    echo "$merged" > "$SETTINGS_FILE"
else
    # Fallback: if no python, use a simple approach
    # Only safe if settings.json is empty or doesn't have hooks
    if [ "$existing" = '{}' ] || [ "$existing" = '' ]; then
        cat > "$SETTINGS_FILE" <<EOF
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$NOTIFY_CMD"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "$NOTIFY_CMD"
          }
        ]
      }
    ]
  }
}
EOF
    else
        echo "ERROR: Python is required to safely merge into existing settings."
        echo "Please install Python or manually add the hooks to $SETTINGS_FILE"
        echo ""
        echo "Hooks to add:"
        echo "$hooks_json"
        exit 1
    fi
fi

echo ""
echo "Hooks installed successfully!"
echo ""
echo "Hooks added for events:"
echo "  - Notification (fires when Claude needs input)"
echo "  - Stop (fires when Claude finishes responding)"
echo ""
echo "Settings file: $SETTINGS_FILE"
echo ""

# Build and start the Electron app if pnpm is available
APP_DIR="C:/Code/AgentNotify/app"
if [ -d "$APP_DIR" ] && command -v pnpm &>/dev/null; then
    echo "Setting up Electron notification app..."
    (cd "$APP_DIR" && pnpm install && pnpm run build)
    echo ""
    echo "Electron app built. To start it:"
    echo "  cd $APP_DIR && pnpm start"
    echo ""
    echo "To test notifications:"
    echo "  curl -X POST http://127.0.0.1:9456/notify -H 'Content-Type: application/json' -d '{\"title\":\"Test\",\"message\":\"Hello\",\"accentColor\":\"#f59e0b\"}'"
else
    echo "To set up the Electron notification app:"
    echo "  cd $APP_DIR && pnpm install && pnpm run build && pnpm start"
fi
echo ""
echo "Fallback test (PowerShell toast):"
echo "  powershell.exe -ExecutionPolicy Bypass -File C:/Code/AgentNotify/notify.ps1 -Title \"Test\" -Message \"Hello\""
