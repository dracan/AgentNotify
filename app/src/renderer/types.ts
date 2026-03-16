export interface NotificationPayload {
  title: string;
  message: string;
  accentColor: string;
  folder?: string;
  autoDismiss?: boolean;
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
