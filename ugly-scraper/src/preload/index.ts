import { ipcRenderer, contextBridge } from 'electron'
import { CHANNELS } from '../shared/util'
import { IAccount } from '../main/core/database/models/accounts'
import { IMetaData } from '../main/core/database/models/metadata'
// import { electronAPI } from '@electron-toolkit/preload'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

contextBridge.exposeInMainWorld('account', {
  [CHANNELS.ad]: async () => {
    return await ipcRenderer.invoke('llooll')
  },
  [CHANNELS.ad]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.ad, id)
  },
  [CHANNELS.aum]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.aum, id)
  },
  [CHANNELS.aua]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.aua, id)
  },
  [CHANNELS.ac]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.ac, id)
  },
  [CHANNELS.adel]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.adel, id)
  },
  [CHANNELS.ala]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.ala, id)
  },
  [CHANNELS.alm]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.alm, id)
  },
  [CHANNELS.au]: async (id: string, account: IAccount) => {
    return await ipcRenderer.invoke(CHANNELS.au, id, account)
  },
  [CHANNELS.aga]: async () => {
    return await ipcRenderer.invoke(CHANNELS.aga)
  },
  [CHANNELS.aa]: async (
    email: string,
    addType: string,
    selectedDomain: string,
    password: string,
    recoveryEmail: string,
    domainEmail: string
  ) => {
    return await ipcRenderer.invoke(
      CHANNELS.aa,
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
  [CHANNELS.da]: async (domain: string) => {
    return await ipcRenderer.invoke(CHANNELS.da, domain)
  },
  [CHANNELS.dv]: async (domain: string) => {
    return await ipcRenderer.invoke(CHANNELS.dv, domain)
  },
  [CHANNELS.dd]: async (domainID: string) => {
    return await ipcRenderer.invoke(CHANNELS.dd, domainID)
  },
  [CHANNELS.dga]: async () => {
    return await ipcRenderer.invoke(CHANNELS.dga)
  }
})

contextBridge.exposeInMainWorld('meta', {
  [CHANNELS.mga]: async () => {
    return await ipcRenderer.invoke(CHANNELS.mga)
  },
  [CHANNELS.md]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.md, id)
  },
  [CHANNELS.mu]: async (meta: IMetaData) => {
    return await ipcRenderer.invoke(CHANNELS.mu, meta)
  },
})

contextBridge.exposeInMainWorld('proxy', {
  [CHANNELS.pga]: async () => {
    return await ipcRenderer.invoke(CHANNELS.pga)
  },
  [CHANNELS.pa]: async (url: string, proxy: string) => {
    return await ipcRenderer.invoke(CHANNELS.pa, url, proxy)
  },
})

contextBridge.exposeInMainWorld('record', {
  [CHANNELS.pga]: async () => {
    return await ipcRenderer.invoke(CHANNELS.pga)
  },
  [CHANNELS.rg]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.pa, id)
  }
})

contextBridge.exposeInMainWorld('scrape', {
  [CHANNELS.s]: async (id: string, proxy: boolean, url: string) => {
    return await ipcRenderer.invoke(CHANNELS.s, id, proxy, url)
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
