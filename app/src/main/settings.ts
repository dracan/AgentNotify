import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export type PopupPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface Settings {
  position: PopupPosition;
  autoDismiss: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  position: 'bottom-right',
  autoDismiss: true,
};

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readSettings(): Settings {
  try {
    const data = fs.readFileSync(getSettingsPath(), 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function writeSettings(settings: Settings): void {
  fs.writeFileSync(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf-8');
}

export function getPosition(): PopupPosition {
  return readSettings().position;
}

export function setPosition(pos: PopupPosition): void {
  const settings = readSettings();
  settings.position = pos;
  writeSettings(settings);
}

export function getAutoDismiss(): boolean {
  return readSettings().autoDismiss;
}

export function setAutoDismiss(value: boolean): void {
  const settings = readSettings();
  settings.autoDismiss = value;
  writeSettings(settings);
}
