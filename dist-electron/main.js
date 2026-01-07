"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
require("./ipc");
const paths_1 = require("./utils/paths");
const isDev = process.env.NODE_ENV !== 'production' && !electron_1.app.isPackaged;
async function createWindow() {
    await (0, paths_1.ensureDataDirectories)();
    const win = new electron_1.BrowserWindow({
        width: 1300,
        height: 900,
        backgroundColor: '#f8fafc',
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    const devServer = process.env.VITE_DEV_SERVER_URL || (isDev ? 'http://localhost:5173' : null);
    if (devServer) {
        await win.loadURL(devServer);
    }
    else {
        const indexHtml = path_1.default.join(__dirname, '../dist/index.html');
        await win.loadFile(indexHtml);
    }
    if (isDev) {
        win.webContents.on('before-input-event', (event, input) => {
            const key = input.key?.toLowerCase();
            const isToggleShortcut = key === 'i' && input.shift && (input.control || input.meta);
            if (isToggleShortcut) {
                event.preventDefault();
                if (win.webContents.isDevToolsOpened()) {
                    win.webContents.closeDevTools();
                }
                else {
                    win.webContents.openDevTools({ mode: 'detach' });
                }
            }
        });
    }
}
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        void createWindow();
    }
});
electron_1.app.whenReady().then(() => {
    const userDataPath = electron_1.app.getPath('userData');
    process.env.APP_USER_DATA = userDataPath;
    electron_1.ipcMain.handle('paths:userData', () => userDataPath);
    void createWindow();
});
electron_1.ipcMain.handle('app:openPath', async (_event, targetPath) => {
    return electron_1.shell.openPath(targetPath);
});
