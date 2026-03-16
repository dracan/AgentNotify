import { BrowserWindow, screen } from 'electron';
import * as path from 'path';

const WIDTH = 380;
const HEIGHT = 100;
const GAP = 12;
const MARGIN = 16;
const MAX_STACKED = 5;
const AUTO_DISMISS_MS = 8000;

interface NotificationSlot {
  window: BrowserWindow;
  timeout: ReturnType<typeof setTimeout>;
  slot: number;
}

const activeNotifications: Map<number, NotificationSlot> = new Map();

function getNextSlot(): number {
  const usedSlots = new Set<number>();
  for (const entry of activeNotifications.values()) {
    usedSlots.add(entry.slot);
  }
  for (let i = 0; i < MAX_STACKED; i++) {
    if (!usedSlots.has(i)) return i;
  }
  // All slots full — dismiss the oldest
  let oldestId: number | null = null;
  let oldestSlot = -1;
  for (const [id, entry] of activeNotifications.entries()) {
    if (oldestId === null || entry.slot < oldestSlot || (entry.slot === oldestSlot && id < oldestId)) {
      oldestId = id;
      oldestSlot = entry.slot;
    }
  }
  if (oldestId !== null) {
    dismissNotification(oldestId);
  }
  return 0;
}

function getYPosition(slot: number): number {
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);
  const { y: areaY, height: areaH } = display.workArea;
  return areaY + areaH - (HEIGHT + GAP) * (slot + 1) - MARGIN + GAP;
}

function getXPosition(): number {
  const cursorPoint = screen.getCursorScreenPoint();
  const display = screen.getDisplayNearestPoint(cursorPoint);
  const { x: areaX, width: areaW } = display.workArea;
  return areaX + areaW - WIDTH - MARGIN;
}

export function showNotification(title: string, message: string, accentColor: string, folder: string = ''): void {
  const slot = getNextSlot();
  const x = getXPosition();
  const y = getYPosition(slot);

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
    x,
    y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5174/notification.html');
  } else {
    win.loadFile(path.join(__dirname, '..', 'renderer', 'notification.html'));
  }

  win.webContents.on('did-finish-load', () => {
    win.webContents.send('notification-data', { title, message, accentColor, folder });
  });

  // Show without stealing focus
  win.showInactive();

  const windowId = win.id;

  const timeout = setTimeout(() => {
    dismissNotification(windowId);
  }, AUTO_DISMISS_MS);

  activeNotifications.set(windowId, { window: win, timeout, slot });

  win.on('closed', () => {
    const entry = activeNotifications.get(windowId);
    if (entry) {
      clearTimeout(entry.timeout);
      activeNotifications.delete(windowId);
      reflowNotifications();
    }
  });
}

export function dismissNotification(windowId: number): void {
  // If windowId is -1, find by sender (handled via ipcMain event.sender)
  const entry = activeNotifications.get(windowId);
  if (!entry) return;

  clearTimeout(entry.timeout);
  activeNotifications.delete(windowId);

  if (!entry.window.isDestroyed()) {
    entry.window.close();
  }

  reflowNotifications();
}

// Also expose a way to dismiss by webContents id (for the -1 case from preload)
export function dismissByWebContentsId(webContentsId: number): void {
  for (const [windowId, entry] of activeNotifications.entries()) {
    if (!entry.window.isDestroyed() && entry.window.webContents.id === webContentsId) {
      dismissNotification(windowId);
      return;
    }
  }
}

function reflowNotifications(): void {
  // Reassign slots so they're contiguous starting from 0
  const sorted = [...activeNotifications.entries()].sort((a, b) => a[1].slot - b[1].slot);
  let nextSlot = 0;
  for (const [, entry] of sorted) {
    entry.slot = nextSlot;
    if (!entry.window.isDestroyed()) {
      const y = getYPosition(nextSlot);
      const x = getXPosition();
      entry.window.setPosition(x, y);
    }
    nextSlot++;
  }
}
