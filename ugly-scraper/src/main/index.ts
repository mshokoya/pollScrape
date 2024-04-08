import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { init } from './core/start'
import {
  WaddAccount,
  WaddDomain,
  WaddProxy,
  WcheckAccount,
  WconfirmAccount,
  WdeleteAccount,
  WdeleteDomain,
  WdeleteMetadata,
  Wdemine,
  WgetAccounts,
  WgetDomains,
  WgetMetadatas,
  WgetProxies,
  WgetRecord,
  WgetRecords,
  WloginAuto,
  WloginManually,
  Wscrape,
  WupdateAcc,
  WupdateMetadata,
  WupgradeAutomatically,
  WupgradeManually,
  Wverify
} from './core/worker'
import { IAccount } from './core/database/models/accounts'
import { IMetaData } from './core/database/models/metadata'
import { CHANNELS } from '../shared/util'

function createWindow(): void {
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

  init({ mainWindow, ipcMain }).then(() => {
    // Create the browser window.
    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    mainWindow.webContents.openDevTools()

    // ==========================================================================================

    //================= account =========================
    ipcMain.handle(CHANNELS.ad, async (e, id: string) => await Wdemine(id))
    ipcMain.handle(CHANNELS.aum, async (e, id: string) => await WupgradeManually(id))
    ipcMain.handle(CHANNELS.aua, async (e, id: string) => await WupgradeAutomatically(id))
    ipcMain.handle(CHANNELS.ac, async (e, id: string) => await WcheckAccount(id))
    ipcMain.handle(CHANNELS.adel, async (e, id: string) => await WdeleteAccount(id))
    ipcMain.handle(CHANNELS.aca, async (e, id: string) => await WconfirmAccount(id))
    ipcMain.handle(CHANNELS.ala, async (e, id: string) => await WloginAuto(id))
    ipcMain.handle(CHANNELS.alm, async (e, id: string) => await WloginManually(id))
    ipcMain.handle(
      CHANNELS.au,
      async (e, id: string, account: IAccount) => await WupdateAcc(id, account)
    )
    ipcMain.handle(CHANNELS.aga, async () => await WgetAccounts())
    ipcMain.handle(CHANNELS.aa, async (e, args) => await WaddAccount(args))

    // =============== domain =====================
    ipcMain.handle(CHANNELS.da, async (e, domain: string) => await WaddDomain(domain))
    ipcMain.handle(CHANNELS.dv, async (e, domain: string) => await Wverify(domain))
    ipcMain.handle(CHANNELS.dd, async (e, domainID: string) => await WdeleteDomain(domainID))
    ipcMain.handle(CHANNELS.dga, async () => await WgetDomains())

    // =============== Metadata =====================
    ipcMain.handle(CHANNELS.mga, async () => await WgetMetadatas())
    ipcMain.handle(CHANNELS.md, async (e, id: string) => await WdeleteMetadata(id))
    ipcMain.handle(CHANNELS.mu, async (e, meta: IMetaData) => await WupdateMetadata(meta))

    // =============== Proxy =====================
    ipcMain.handle(CHANNELS.pga, async () => await WgetProxies())
    ipcMain.handle(
      CHANNELS.pa,
      async (e, url: string, proxy: string) => await WaddProxy(url, proxy)
    )

    // =============== Record =====================
    ipcMain.handle(CHANNELS.rga, async () => await WgetRecords())
    ipcMain.handle(CHANNELS.rg, async (e, id: string) => await WgetRecord(id))

    // =============== Scrape =====================
    ipcMain.handle(
      CHANNELS.s,
      async (e, id: string, proxy: boolean, url: string) => await Wscrape(id, proxy, url)
    )

    // ==========================================================================================

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
