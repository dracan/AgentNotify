import { app, ipcMain } from 'electron';
import { createTray } from './tray';
import { createHttpServer } from './http-server';
import { showNotification, dismissByWebContentsId } from './window-manager';

// Single instance lock - only one AgentNotify should run
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

// IPC: dismiss notification from renderer (resolve window by sender)
ipcMain.on('dismiss-notification', (event) => {
  dismissByWebContentsId(event.sender.id);
});

app.whenReady().then(() => {
  createTray();

  createHttpServer((title, message, accentColor, folder) => {
    showNotification(title, message, accentColor, folder);
  });

  console.log('[AgentNotify] Ready - listening on http://127.0.0.1:9456');
});

app.on('window-all-closed', () => {
  // Don't quit - tray keeps the app alive
});
