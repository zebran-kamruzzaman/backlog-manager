import { app, BrowserWindow, session } from 'electron';
import { getDb, closeDb } from './database/db';
import './ipc/handlers';
import './ipc/settingsHandlers';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const isDev = !app.isPackaged;

app.setName('Backlog Manager');

const IMG_SOURCES = [
  'https://image.tmdb.org',
  'https://images.igdb.com',
  'https://img.anilist.co',
  'https://s4.anilist.co',
  'https://media.anilist.co',
  'https://places.googleapis.com',
].join(' ');

function createWindow() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? `default-src 'self' 'unsafe-inline' 'unsafe-eval';` +
              `img-src 'self' data: blob: ${IMG_SOURCES};` +
              `connect-src 'self' https: ws://localhost:* http://localhost:*;`
            : `default-src 'self' 'unsafe-inline';` +
              `img-src 'self' data: blob: ${IMG_SOURCES};` +
              `connect-src 'self' https:;`
        ],
      },
    });
  });

  const win = new BrowserWindow({
    width          : 1200,
    height         : 800,
    minWidth       : 900,
    minHeight      : 600,
    backgroundColor: '#0f0f0f',
    title          : 'Backlog Manager',
    icon           : './assets/icon.ico',
    webPreferences : {
      preload         : MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,
      nodeIntegration : false,
      sandbox         : false,
    },
  });

  win.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Only open DevTools in development
  if (isDev) win.webContents.openDevTools();

  // Remove default menu bar in production
  if (!isDev) win.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  getDb();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDb();
  if (process.platform !== 'darwin') app.quit();
});