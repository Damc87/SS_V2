import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import './ipc';
import { ensureDataDirectories } from './utils/paths';

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

async function createWindow() {
  await ensureDataDirectories();
  const win = new BrowserWindow({
    width: 1300,
    height: 900,
    backgroundColor: '#f8fafc',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const devServer = process.env.VITE_DEV_SERVER_URL || (isDev ? 'http://localhost:5173' : null);
  if (devServer) {
    await win.loadURL(devServer);
  } else {
    const indexHtml = path.join(__dirname, '../dist/index.html');
    await win.loadFile(indexHtml);
  }

  if (isDev) {
    win.webContents.on('before-input-event', (event, input) => {
      const key = input.key?.toLowerCase();
      const isToggleShortcut =
        key === 'i' && input.shift && (input.control || input.meta);
      if (isToggleShortcut) {
        event.preventDefault();
        if (win.webContents.isDevToolsOpened()) {
          win.webContents.closeDevTools();
        } else {
          win.webContents.openDevTools({ mode: 'detach' });
        }
      }
    });
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    void createWindow();
  }
});

app.whenReady().then(() => {
  const userDataPath = app.getPath('userData');
  process.env.APP_USER_DATA = userDataPath;
  ipcMain.handle('paths:userData', () => userDataPath);
  void createWindow();
});

ipcMain.handle('app:openPath', async (_event, targetPath: string) => {
  return shell.openPath(targetPath);
});
