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
  // accountGetAll,
  // accountCreate,
  // accountFindOne,
  // accountFindById,
  // accountFindOneAndUpdate,
  // accountFindOneAndDelete
} from './core/worker'
import { IAccount } from './core/database/models/accounts'
import { IMetaData } from './core/database/models/metadata'

export const CN = {
  // accounts
  ad: 'accountDemine',
  aum: 'accountUpgradeManually',
  aua: 'accountUpgradeAutomatically',
  ac: 'accountCheck',
  adel: 'accountDelete',
  ala: 'accountLoginAuto',
  alm: 'accountLoginManually',
  au: 'accountUpdate',
  aga: 'accountGetAll',
  aa: 'accountAdd',
  // domain
  da: 'domainAdd',
  dv: 'domainVerify',
  dd: 'domainDelete',
  dga: 'domainGetAll',
  // metadata
  mga: 'metadataGetAll',
  md: 'metadataDelete',
  mu: 'metadataUpdate',
  // proxy
  pga: 'proxyGetAll',
  pa: 'proxyAdd',
  // records
  rga: 'recordsGetAll',
  rg: 'recordGet',
  //scrape
  s: 'scrape'
}


function createWindow(): void {
  const res = (channel: string, res?: any) => {
    return mainWindow.webContents.send('fetch', { channel, res })
  }

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

  //================= account =========================
  ipcMain.handle(CN.ad, async (e, id: string) => {
    const r = await Wdemine(id)
    res(CN.ad, r)
  })
  ipcMain.handle(CN.aum, async (e, id: string) => {
    const r = await WupgradeManually(id)
    res(CN.aum, r)
  })
  ipcMain.handle(CN.aua, async (e, id: string) => {
    const r = await WupgradeAutomatically(id)
    res(CN.aua, r)
  })
  ipcMain.handle(CN.ac, async (e, id: string) => {
    const r = await WcheckAccount(id)
    res(CN.ac, r)
  })
  ipcMain.handle(CN.adel, async (e, id: string) => {
    const r = await WdeleteAccount(id)
    res(CN.adel, r)
  })
  ipcMain.handle(CN.ala, async (e, id: string) => {
    const r = await WloginAuto(id)
    res(CN.ala, r)
  })
  ipcMain.handle(CN.alm, async (e, id: string) => {
    const r = await WloginManually(id)
    res(CN.alm, r)
  })
  ipcMain.handle(CN.au, async (e, id: string, account: IAccount) => {
    const r = await WupdateAcc(id, account)
    res(CN.au, r)
  })
  ipcMain.handle(CN.aga, async () => {
    const r = await WgetAccounts()
    res(CN.aga, r)
  })
  ipcMain.handle(
    CN.aa,
    async (
      e,
      email: string,
      addType: string,
      selectedDomain: string,
      password: string,
      recoveryEmail: string,
      domainEmail: string
    ) => {
      const r = await WaddAccount(
        email,
        addType,
        selectedDomain,
        password,
        recoveryEmail,
        domainEmail
      )
      res(CN.aa, r)
    }
  )

  // =============== domain =====================
  ipcMain.handle(CN.da, async (e, domain: string) => {
    const r = await WaddDomain(domain)
    res(CN.da, r)
  })
  ipcMain.handle(CN.dv, async (e, domain: string) => {
    const r = await Wverify(domain)
    res(CN.dv, r)
  })
  ipcMain.handle(CN.dd, async (e, domainID: string) => {
    const r = await WdeleteDomain(domainID)
    res(CN.dd, r)
  })
  ipcMain.handle(CN.dga, async () => {
    const r = await WgetDomains()
    res(CN.dga, r)
  })

  // =============== Metadata =====================
  ipcMain.handle(CN.mga, async () => {
    const r = await WgetMetadatas()
    res(CN.mga, r)
  })
  ipcMain.handle(CN.md, async (e, id: string) => {
    const r = await WdeleteMetadata(id)
    res(CN.md, r)
  })
  ipcMain.handle(CN.mu, async (e, meta: IMetaData) => {
    const r = await WupdateMetadata(meta)
    res(CN.mu, r)
  })

  // =============== Proxy =====================
  ipcMain.handle(CN.pga, async () => {
    const r = await WgetProxies()
    res(CN.pga, r)
  })
  ipcMain.handle(CN.pa, async (e, url: string, proxy: string) => {
    const r = await WaddProxy(url, proxy)
    res(CN.pa, r)
  })

  // =============== Record =====================
  ipcMain.handle(CN.rga, async () => {
    const r = await WgetRecords()
    res(CN.rga, r)
  })
  ipcMain.handle(CN.rg, async (e, id: string) => {
    const r = await WgetRecord(id)
    res(CN.rg, r)
  })

  // =============== Scrape =====================
  ipcMain.handle(CN.s, async (e, id: string, proxy: boolean, url: string) => {
    const r = await Wscrape(id, proxy, url)
    res(CN.s, r)
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

init().then(() => {
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
})

// ===================================================================

// ipcMain.handle('accountCreate', async () => {
//   const res = await accountCreate()
//   mainWindow.webContents.send('accountCreate', res)
// })

// ipcMain.handle('accountGetAll', async () => {
//   const res = await accountGetAll()
//   mainWindow.webContents.send('accountGetAll', res)
// })

// ipcMain.handle('accountFindOne', async () => {
//   const testa = await accountFindOne()
//   console.log('accountFindOne')
//   console.log(testa)
//   return testa
// })

// ipcMain.handle('accountFindById', async () => {
//   const testa = await accountFindById()
//   console.log('accountFindById')
//   console.log(testa)
//   return testa
// })

// ipcMain.handle('accountFindOneAndUpdate', async () => {
//   const testa = await accountFindOneAndUpdate()
//   console.log('accountFindOneAndUpdate')
//   console.log(testa)
//   return testa
// })

// ipcMain.handle('accountFindOneAndDelete', async () => {
//   const testa = await accountFindOneAndDelete()
//   console.log('accountFindOneAndDelete')
//   console.log(testa)
//   return testa
// })
