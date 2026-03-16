import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { NotificationPayload } from '../types';

const DURATION_MS = 8000;
const TICK_MS = 50;

export function Notification() {
  const [data, setData] = useState<NotificationPayload | null>(null);
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const dismiss = useCallback(() => {
    if (dismissing) return;
    setDismissing(true);
    // Wait for slide-out animation, then tell main process
    setTimeout(() => {
      window.electronAPI.dismissNotification();
    }, 300);
  }, [dismissing]);

  useEffect(() => {
    const unsub = window.electronAPI.onNotificationData((payload) => {
      setData(payload);
      setVisible(true);
      startTimeRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, 100 - (elapsed / DURATION_MS) * 100);
        setProgress(remaining);
      }, TICK_MS);
    });

    return () => {
      unsub();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Auto-dismiss is handled by main process timeout, but clean up interval
  useEffect(() => {
    if (progress <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [progress]);

  if (!data) return null;

  const containerClass = [
    'notification',
    visible && !dismissing ? 'notification-enter' : '',
    dismissing ? 'notification-exit' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClass} onClick={dismiss}>
      <div className="notification-accent" style={{ backgroundColor: data.accentColor }} />
      <div className="notification-content">
        <div className="notification-title">{data.title}</div>
        <div className="notification-message">{data.message}</div>
      </div>
      <div className="notification-progress" style={{ width: `${progress}%`, backgroundColor: data.accentColor }} />
    </div>
  );
}
