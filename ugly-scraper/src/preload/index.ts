import { ipcRenderer, contextBridge } from 'electron'
import { CN } from '../main'
import { IAccount } from '../main/core/database/models/accounts'
import { IMetaData } from '../main/core/database/models/metadata'
// import { electronAPI } from '@electron-toolkit/preload'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

contextBridge.exposeInMainWorld('account', {
  [CN.ad]: async (id: string) => {
    await ipcRenderer.invoke(CN.ad, id)
  },
  [CN.aum]: async (id: string) => {
    await ipcRenderer.invoke(CN.aum, id)
  },
  [CN.aua]: async (id: string) => {
    await ipcRenderer.invoke(CN.aua, id)
  },
  [CN.ac]: async (id: string) => {
    await ipcRenderer.invoke(CN.ac, id)
  },
  [CN.adel]: async (id: string) => {
    await ipcRenderer.invoke(CN.adel, id)
  },
  [CN.ala]: async (id: string) => {
    await ipcRenderer.invoke(CN.ala, id)
  },
  [CN.alm]: async (id: string) => {
    await ipcRenderer.invoke(CN.alm, id)
  },
  [CN.au]: async (id: string, account: IAccount) => {
    await ipcRenderer.invoke(CN.au, id, account)
  },
  [CN.aga]: async () => {
    await ipcRenderer.invoke(CN.aga)
  },
  [CN.aa]: async (
    email: string,
    addType: string,
    selectedDomain: string,
    password: string,
    recoveryEmail: string,
    domainEmail: string
  ) => {
    await ipcRenderer.invoke(
      CN.aa,
      email,
      addType,
      selectedDomain,
      password,
      recoveryEmail,
      domainEmail
    )
  }
})

contextBridge.exposeInMainWorld('domain', {
  [CN.da]: async (domain: string) => {
    await ipcRenderer.invoke(CN.da, domain)
  },
  [CN.dv]: async (domain: string) => {
    await ipcRenderer.invoke(CN.dv, domain)
  },
  [CN.dd]: async (domainID: string) => {
    await ipcRenderer.invoke(CN.dd, domainID)
  },
  [CN.dga]: async () => {
    await ipcRenderer.invoke(CN.dga)
  }
})

contextBridge.exposeInMainWorld('meta', {
  [CN.mga]: async () => {
    await ipcRenderer.invoke(CN.mga)
  },
  [CN.md]: async (id: string) => {
    await ipcRenderer.invoke(CN.md, id)
  },
  [CN.mu]: async (meta: IMetaData) => {
    await ipcRenderer.invoke(CN.mu, meta)
  },
})

contextBridge.exposeInMainWorld('proxy', {
  [CN.pga]: async () => {
    await ipcRenderer.invoke(CN.pga)
  },
  [CN.pa]: async (url: string, proxy: string) => {
    await ipcRenderer.invoke(CN.pa, url, proxy)
  },
})

contextBridge.exposeInMainWorld('record', {
  [CN.pga]: async () => {
    await ipcRenderer.invoke(CN.pga)
  },
  [CN.rg]: async (id: string) => {
    await ipcRenderer.invoke(CN.pa, id)
  }
})

contextBridge.exposeInMainWorld('scrape', {
  [CN.s]: async (id: string, proxy: boolean, url: string) => {
    await ipcRenderer.invoke(CN.s, id, proxy, url)
  }
})

// ==============================================

// // Custom APIs for renderer
// const api = {}

// // Use `contextBridge` APIs to expose Electron APIs to
// // renderer only if context isolation is enabled, otherwise
// // just add to the DOM global.
// if (process.contextIsolated) {
//   try {
//     contextBridge.exposeInMainWorld('electron', electronAPI)
//     contextBridge.exposeInMainWorld('api', api)
//   } catch (error) {
//     console.error(error)
//   }
// } else {
//   // @ts-ignore (define in dts)
//   window.electron = electronAPI
//   // @ts-ignore (define in dts)
//   window.api = api
// }
