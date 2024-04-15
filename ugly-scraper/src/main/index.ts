import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { init } from './core'
import {
  TconfirmAccount,
  TupgradeManually,
  TupgradeAutomatically,
  TcheckAccount,
  TdeleteAccount,
  TloginAuto,
  TaddAccount,
  TgetAccounts,
  TupdateAcc,
  TloginManually,
  Tdemine,
  addDomain,
  verifyDomain,
  deleteDomain,
  getDomains,
  updateMetadata,
  deleteMetadata,
  getMetadatas,
  getRecords,
  getRecord,
  scrape,
  getProxies,
  addProxy
} from './core/actions'
import { IAccount } from './core/database/models/accounts'
import { IMetaData } from './core/database/models/metadata'
import { CHANNELS } from '../shared/util'
import { AddAccountArgs } from '../shared'

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
    ipcMain.handle(
      CHANNELS.a_accountDemine,
      async (e, accountID: string) => await Tdemine({ accountID })
    )
    ipcMain.handle(
      CHANNELS.a_accountUpgradeManually,
      async (e, accountID: string) => await TupgradeManually({ accountID })
    )
    ipcMain.handle(
      CHANNELS.a_accountUpgradeAutomatically,
      async (e, accountID: string) => await TupgradeAutomatically({ accountID })
    )
    ipcMain.handle(
      CHANNELS.a_accountCheck,
      async (e, accountID: string) => await TcheckAccount({ accountID })
    )
    ipcMain.handle(
      CHANNELS.a_accountDelete,
      async (e, accountID: string) => await TdeleteAccount({ accountID })
    )
    ipcMain.handle(
      CHANNELS.a_accountConfirm,
      async (e, accountID: string) => await TconfirmAccount({ accountID })
    )
    ipcMain.handle(
      CHANNELS.a_accountLoginAuto,
      async (e, accountID: string) => await TloginAuto({ accountID })
    )
    ipcMain.handle(
      CHANNELS.a_accountLoginManually,
      async (e, accountID: string) => await TloginManually({ accountID })
    )
    ipcMain.handle(
      CHANNELS.a_accountUpdate,
      async (e, accountID: string, fields: IAccount) => await TupdateAcc({ accountID, fields })
    )
    ipcMain.handle(CHANNELS.a_accountGetAll, async () => await TgetAccounts())

    ipcMain.handle(
      CHANNELS.a_accountAdd,
      async (e, args: AddAccountArgs) => await TaddAccount(args)
    )

    // =============== domain =====================
    ipcMain.handle(CHANNELS.a_domainAdd, async (e, domain: string) => await addDomain(domain))
    ipcMain.handle(CHANNELS.a_domainVerify, async (e, domain: string) => await verifyDomain(domain))
    ipcMain.handle(
      CHANNELS.a_domainDelete,
      async (e, domainID: string) => await deleteDomain(domainID)
    )
    ipcMain.handle(CHANNELS.a_domainGetAll, async () => await getDomains())

    // =============== Metadata =====================
    ipcMain.handle(CHANNELS.a_metadataGetAll, async () => await getMetadatas())
    ipcMain.handle(CHANNELS.a_metadataDelete, async (e, id: string) => await deleteMetadata(id))
    ipcMain.handle(
      CHANNELS.a_metadataUpdate,
      async (e, meta: IMetaData) => await updateMetadata(meta)
    )

    // =============== Proxy =====================
    ipcMain.handle(CHANNELS.a_proxyGetAll, async () => await getProxies())
    ipcMain.handle(
      CHANNELS.a_proxyAdd,
      async (e, url: string, proxy: string) => await addProxy(url, proxy)
    )

    // =============== Record =====================
    ipcMain.handle(CHANNELS.a_recordsGetAll, async () => await getRecords())
    ipcMain.handle(CHANNELS.a_recordGet, async (e, id: string) => await getRecord(id))

    // =============== Scrape =====================
    ipcMain.handle(
      CHANNELS.a_scrape,
      async (e, id: string, proxy: boolean, url: string) => await scrape(id, proxy, url)
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
