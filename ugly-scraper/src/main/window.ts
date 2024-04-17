import { BrowserWindow, shell } from 'electron'
import icon from '../../resources/icon.png?asset'
import { join } from 'path'
// import { is } from '@electron-toolkit/utils'

let window: BrowserWindow

function create() {
  window = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
      // nodeIntegration: true
    }
  })

  window.on('ready-to-show', () => {
    window.show()
  })

  window.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  window.webContents.openDevTools()

  // if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
  window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  // } else {
  // window.loadFile(join(__dirname, '../renderer/index.html'))
  // }

  return window
}

function get() {
  try {
    return window // Return the instance of the window
  } catch (err) {
    return null
  }
}

function send(channel: string, args: any) {
  window.webContents.send(channel, args)
}

export { create, get, send }
