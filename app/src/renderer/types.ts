export interface NotificationPayload {
  title: string;
  message: string;
  accentColor: string;
}

export interface ElectronAPI {
  onNotificationData: (cb: (data: NotificationPayload) => void) => () => void;
  dismissNotification: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
