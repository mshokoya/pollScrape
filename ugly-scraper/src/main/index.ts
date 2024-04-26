import { app, BrowserWindow, ipcMain } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
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
  Tscrape,
  addDomain,
  verifyDomain,
  deleteDomain,
  getDomains,
  updateMetadata,
  deleteMetadata,
  getMetadatas,
  getRecords,
  getRecord,
  getProxies,
  addProxy
} from './core/actions'
import { cache } from './core/cache'
import { CHANNELS } from '../shared/util'
import { AddAccountArgs, IAccount, IMetaData } from '../shared'
import { create } from './window'

let window

function createWindow(): void {
  init({ ipcMain }).then(() => {
    // Create the browser window.

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
    ipcMain.handle(CHANNELS.a_metadataDelete, async (e, id: string[]) => await deleteMetadata(id))
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
      async (
        e,
        args: {
          name: string
          url: string
          chunk: [number, number][]
          accounts: string[]
          metaID?: string
          useProxy: boolean
        }
      ) => await Tscrape(args)
    )

    // =============== cache =====================
    ipcMain.handle(CHANNELS.cache_getAllAccountIDs, async () => await cache.getAllAccountIDs())
    // ==========================================================================================
  })
}

app.whenReady().then(() => {
  window = create()
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
