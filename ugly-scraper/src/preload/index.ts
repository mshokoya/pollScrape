import { ipcRenderer, contextBridge } from 'electron'
import { CHANNELS } from '../shared/util'
import { IAccount, IMetaData } from '../shared'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

contextBridge.exposeInMainWorld('account', {
  [CHANNELS.a_accountDemine]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountDemine, id)
  },
  [CHANNELS.a_accountUpgradeManually]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountUpgradeManually, id)
  },
  [CHANNELS.a_accountConfirm]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountConfirm, id)
  },
  [CHANNELS.a_accountUpgradeAutomatically]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountUpgradeAutomatically, id)
  },
  [CHANNELS.a_accountCheck]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountCheck, id)
  },
  [CHANNELS.a_accountDelete]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountDelete, id)
  },
  [CHANNELS.a_accountLoginAuto]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountLoginAuto, id)
  },
  [CHANNELS.a_accountLoginManually]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountLoginManually, id)
  },
  [CHANNELS.a_accountUpdate]: async (id: string, account: IAccount) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountUpdate, id, account)
  },
  [CHANNELS.a_accountGetAll]: async () => {
    return await ipcRenderer.invoke(CHANNELS.a_accountGetAll)
  },
  [CHANNELS.a_accountAdd]: async (a: {
    email: string
    addType: string
    selectedDomain?: string
    password: string
    recoveryEmail?: string
  }) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountAdd, a)
  }
})

contextBridge.exposeInMainWorld('domain', {
  [CHANNELS.a_domainAdd]: async (domain: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_domainAdd, domain)
  },
  [CHANNELS.a_domainVerify]: async (domain: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_domainVerify, domain)
  },
  [CHANNELS.a_domainDelete]: async (domainID: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_domainDelete, domainID)
  },
  [CHANNELS.a_domainGetAll]: async () => {
    return await ipcRenderer.invoke(CHANNELS.a_domainGetAll)
  }
})

contextBridge.exposeInMainWorld('meta', {
  [CHANNELS.a_metadataGetAll]: async () => {
    return await ipcRenderer.invoke(CHANNELS.a_metadataGetAll)
  },
  [CHANNELS.a_metadataDelete]: async (id: string[]) => {
    return await ipcRenderer.invoke(CHANNELS.a_metadataDelete, id)
  },
  [CHANNELS.a_metadataUpdate]: async (meta: IMetaData) => {
    return await ipcRenderer.invoke(CHANNELS.a_metadataUpdate, meta)
  }
})

contextBridge.exposeInMainWorld('proxy', {
  [CHANNELS.a_proxyGetAll]: async () => {
    return await ipcRenderer.invoke(CHANNELS.a_proxyGetAll)
  },
  [CHANNELS.a_proxyAdd]: async (url: string, proxy: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_proxyAdd, url, proxy)
  }
})

contextBridge.exposeInMainWorld('record', {
  [CHANNELS.a_recordsGetAll]: async () => {
    return await ipcRenderer.invoke(CHANNELS.a_recordsGetAll)
  },
  [CHANNELS.a_recordGet]: async (id: string) => {
    return await ipcRenderer.invoke(CHANNELS.a_recordGet, id)
  }
})

contextBridge.exposeInMainWorld('scrape', {
  [CHANNELS.a_scrape]: async (args: {
    name: string
    url: string
    chunk: [number, number][]
    accounts: string[]
    metaID?: string
    useProxy: boolean
  }) => {
    return await ipcRenderer.invoke(CHANNELS.a_scrape, args)
  }
})

contextBridge.exposeInMainWorld('ipc', {
  emit: (channel: string, data: any) => ipcRenderer.send(channel, { ...data, channel }),
  on: (channel, func) => ipcRenderer.on(channel, (event, args) => func(args))
})

contextBridge.exposeInMainWorld('cache', {
  [CHANNELS.cache_getAllAccountIDs]: async () => {
    console.log('cchhaassddd 0')
    const l = await ipcRenderer.invoke(CHANNELS.cache_getAllAccountIDs)
    console.log('cchhaassddd 1')
    console.log(l)
    return l
  }
})

contextBridge.exposeInMainWorld('fork', {
  [CHANNELS.fork_stop]: async (args: { forkIDs: string[]; stopType: string }) =>
    await ipcRenderer.invoke(CHANNELS.fork_stop, args),
  [CHANNELS.fork_create]: async () => await ipcRenderer.invoke(CHANNELS.fork_create),
  [CHANNELS.fork_get]: async () => await ipcRenderer.invoke(CHANNELS.fork_get)
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
