import React from 'react';
import { createRoot } from 'react-dom/client';
import { Notification } from './components/Notification';
import './notification.css';

const root = createRoot(document.getElementById('notification-root')!);
root.render(<Notification />);
