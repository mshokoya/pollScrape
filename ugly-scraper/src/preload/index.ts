import { ipcRenderer, contextBridge } from 'electron'
import { CHANNELS } from '../shared/util'
import { IMetaData, Timeout } from '../shared'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

contextBridge.exposeInMainWorld('account', {
  [CHANNELS.a_accountDemine]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountDemine, args)
  },
  [CHANNELS.a_accountUpgradeManually]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountUpgradeManually, args)
  },
  [CHANNELS.a_accountConfirm]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountConfirm, args)
  },
  [CHANNELS.a_accountUpgradeAutomatically]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountUpgradeAutomatically, args)
  },
  [CHANNELS.a_accountCheck]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountCheck, args)
  },
  [CHANNELS.a_accountDelete]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountDelete, args)
  },
  [CHANNELS.a_accountLoginAuto]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountLoginAuto, args)
  },
  [CHANNELS.a_accountLoginManually]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountLoginManually, args)
  },
  [CHANNELS.a_accountUpdate]: async (args) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountUpdate, args)
  },
  [CHANNELS.a_accountGetAll]: async () => {
    return await ipcRenderer.invoke(CHANNELS.a_accountGetAll)
  },
  [CHANNELS.a_accountAdd]: async (args: {
    email: string
    addType: string
    selectedDomain?: string
    password: string
    recoveryEmail?: string
  }) => {
    return await ipcRenderer.invoke(CHANNELS.a_accountAdd, args)
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
    timeout?: Timeout
  }) => {
    return await ipcRenderer.invoke(CHANNELS.a_scrape, args)
  }
})

contextBridge.exposeInMainWorld('ipc', {
  emit: (channel: string, data: any) => ipcRenderer.send(channel, { ...data, channel }),
  on: (channel: keyof typeof CHANNELS, func: (a: any) => void) =>
    ipcRenderer.on(channel, (_, args) => func(args))
})

contextBridge.exposeInMainWorld('cache', {
  [CHANNELS.cache_getAllAccountIDs]: async () =>
    await ipcRenderer.invoke(CHANNELS.cache_getAllAccountIDs)
})

contextBridge.exposeInMainWorld('fork', {
  [CHANNELS.fork_stop]: async (args: { forkIDs: string[]; stopType: string }) =>
    await ipcRenderer.invoke(CHANNELS.fork_stop, args),
  [CHANNELS.fork_create]: async () => await ipcRenderer.invoke(CHANNELS.fork_create),
  [CHANNELS.fork_get]: async () => await ipcRenderer.invoke(CHANNELS.fork_get),
  // TEST (REMOVE)
  [CHANNELS.taskQueue_queues]: async () => await ipcRenderer.invoke(CHANNELS.taskQueue_queues)
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
