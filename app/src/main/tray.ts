import { Tray, Menu, nativeImage, app } from 'electron';
import * as path from 'path';
import { getPosition, setPosition, PopupPosition } from './settings';

let tray: Tray | null = null;

function buildContextMenu(): Electron.Menu {
  const currentPos = getPosition();
  return Menu.buildFromTemplate([
    {
      label: 'Position',
      submenu: [
        {
          label: 'Bottom Left',
          type: 'radio',
          checked: currentPos === 'bottom-left',
          click: () => {
            setPosition('bottom-left');
            tray?.setContextMenu(buildContextMenu());
          },
        },
        {
          label: 'Bottom Center',
          type: 'radio',
          checked: currentPos === 'bottom-center',
          click: () => {
            setPosition('bottom-center');
            tray?.setContextMenu(buildContextMenu());
          },
        },
        {
          label: 'Bottom Right',
          type: 'radio',
          checked: currentPos === 'bottom-right',
          click: () => {
            setPosition('bottom-right');
            tray?.setContextMenu(buildContextMenu());
          },
        },
      ],
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);
}

export function createTray(): Tray {
  const iconPath = path.join(__dirname, '..', '..', 'assets', 'icon.png');
  let icon: Electron.NativeImage;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('AgentNotify');
  tray.setContextMenu(buildContextMenu());

  return tray;
}
