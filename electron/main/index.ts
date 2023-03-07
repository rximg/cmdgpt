import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import * as iconv from 'iconv-lite'
import {ConfigHandler} from './config'
// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}
const config_hander = new ConfigHandler()
// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(process.env.PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow)

ipcMain.handle('execute-command', (event, { command, cwd }) => {
  process.chdir(cwd);

  const ls = spawn(command, [], { shell: true });
  let buffer = '';
  ls.stdout.on('data', (data) => {
    buffer += iconv.decode(data, 'gbk');
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      event.sender.send('command-output', line);
      // console.log(line);
    }
  });
  ls.stderr.on('data', (data) => {
    buffer += iconv.decode(data, 'gbk');
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      event.sender.send('command-output', line);
      // console.log(line);
    }
  });
  ls.on('close', (code) => {
    if (buffer) {
      event.sender.send('command-output', buffer);
      console.log(buffer);
    }
    event.sender.send('command-exit', code);
  });
});

ipcMain.handle('get-config', (event, { key }) => {
  return config_hander.getConfig(key);
});

ipcMain.on('set-config', (event, { key, value }) => {
  config_hander.updateConfig(key, value);
});


ipcMain.on('save-config',(  event, ) => {
  config_hander.save();
})



app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})
