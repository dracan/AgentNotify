---
name: build-and-run
description: Build and run the AgentNotify Electron app locally
disable-model-invocation: true
---

# Build & Run AgentNotify

Build the Electron app and launch it as a tray application.

## Steps

1. Kill any existing AgentNotify instance: find the PID holding port 9456 with `netstat -ano | grep ':9456 ' | grep LISTENING | awk '{print $5}' | head -1`, then if a PID is found, run `taskkill //F //PID <pid>` and `sleep 2` to let it fully release the port (ignore errors if no process exists)
2. Run `cd app && pnpm install` to install dependencies
3. Run `pnpm run build` to compile TypeScript and bundle the renderer with Vite
4. Launch the Electron tray app as a fully detached process (not coupled to Claude Code): run `nohup pnpm start > /dev/null 2>&1 &` and then `disown`. Do **not** use `run_in_background: true` — that creates a child process that dies when Claude Code exits.
