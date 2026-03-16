import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  onNotificationData: (cb: (data: { title: string; message: string; accentColor: string; folder?: string }) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { title: string; message: string; accentColor: string; folder?: string }) => cb(data);
    ipcRenderer.on('notification-data', handler);
    return () => ipcRenderer.removeListener('notification-data', handler);
  },
  dismissNotification: (): void => {
    ipcRenderer.send('dismiss-notification', -1); // windowId resolved by sender's webContents
  },
});
