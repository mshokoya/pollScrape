import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { init } from './core/start'
import {
  WaddAccount,
  WcheckAccount,
  WdeleteAccount,
  Wdemine,
  WgetAccounts,
  WloginAuto,
  WloginManually,
  WupdateAcc,
  WupgradeAutomatically,
  WupgradeManually,
  accountGetAll,
  accountCreate,
  accountFindOne,
  accountFindById,
  accountFindOneAndUpdate,
  accountFindOneAndDelete
} from './core/worker'
import { IAccount } from './core/database/models/accounts'

// account
ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
ipcMain.handle('upgradeManually', async (e, id: string) => await WupgradeManually(id))
ipcMain.handle('upgradeAutomatically', async (e, id: string) => await WupgradeAutomatically(id))
ipcMain.handle('checkAccount', async (e, id: string) => await WcheckAccount(id))
ipcMain.handle('deleteAccount', async (e, id: string) => await WdeleteAccount(id))
ipcMain.handle('loginAuto', async (e, id: string) => await WloginAuto(id))
ipcMain.handle('loginManually', async (e, id: string) => await WloginManually(id))
ipcMain.handle(
  'updateAcc',
  async (e, id: string, account: IAccount) => await WupdateAcc(id, account)
)
ipcMain.handle('getAccounts', async () => await WgetAccounts())
ipcMain.handle(
  'addAccount',
  async (
    e,
    email: string,
    addType: string,
    selectedDomain: string,
    password: string,
    recoveryEmail: string,
    domainEmail: string
  ) => await WaddAccount(email, addType, selectedDomain, password, recoveryEmail, domainEmail)
)

ipcMain.handle('accountCreate', async () => {
  const testa = await accountCreate()
  console.log('accountCreate')
  console.log(testa)
  return testa
})

ipcMain.handle('accountGetAll', async () => {
  const testa = await accountGetAll()
  console.log('accountGetAll')
  console.log(testa)
  return testa
})

// =====

ipcMain.handle('accountFindOne', async () => {
  const testa = await accountFindOne()
  console.log('accountFindOne')
  console.log(testa)
  return testa
})

ipcMain.handle('accountFindById', async () => {
  const testa = await accountFindById()
  console.log('accountFindById')
  console.log(testa)
  return testa
})

ipcMain.handle('accountFindOneAndUpdate', async () => {
  const testa = await accountFindOneAndUpdate()
  console.log('accountFindOneAndUpdate')
  console.log(testa)
  return testa
})

ipcMain.handle('accountFindOneAndDelete', async () => {
  const testa = await accountFindOneAndDelete()
  console.log('accountFindOneAndDelete')
  console.log(testa)
  return testa
})

// domain
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))
// ipcMain.handle('demine', async (e, id: string) => await Wdemine(id))

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
init().then(() => {
  app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    createWindow()

    app.on('activate', function () {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // In this file you can include the rest of your app"s specific main process
  // code. You can also put them in separate files and require them here.
})
