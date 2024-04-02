import { ipcRenderer ,contextBridge } from 'electron'
import { accountCreate, accountGetAll } from '../main/core/worker'
// import { electronAPI } from '@electron-toolkit/preload'

if (!process.contextIsolated) {
  throw new Error('contextIsolation must be enabled in the BrowserWindow')
}

contextBridge.exposeInMainWorld('account', {
  demine: async (id: string) => {
    return await ipcRenderer.invoke('demine', id)
    // return await ipcRenderer.send('demine', id)
  },
  getAllAccounts: async (id: string) => {
    return await ipcRenderer.invoke('getAccounts', id)
  },
  // ===============
  accountCreate: async () => {
    return await ipcRenderer.invoke('accountCreate')
  },
  accountGetAll: async () => {
    const lett = await ipcRenderer.invoke('accountGetAll')
    console.log('its lett')
    console.log(lett)
    return lett
  },
  accountFindOne: async () => {
    const lett = await ipcRenderer.invoke('accountFindOne')
    console.log('its lett')
    console.log(lett)
    return lett
  },
  accountFindById: async () => {
    const lett = await ipcRenderer.invoke('accountFindById')
    console.log('its lett')
    console.log(lett)
    return lett
  },
  accountFindOneAndUpdate: async () => {
    const lett = await ipcRenderer.invoke('accountFindOneAndUpdate')
    console.log('its lett')
    console.log(lett)
    return lett
  },
  accountFindOneAndDelete: async () => {
    const lett = await ipcRenderer.invoke('accountFindOneAndDelete')
    console.log('its lett')
    console.log(lett)
    return lett
  }
})

contextBridge.exposeInMainWorld('meta', {
  getAllMeta: async () => {}
})

contextBridge.exposeInMainWorld('record', {
  getAllRecords: async () => {}
})

contextBridge.exposeInMainWorld('domain', {
  getAllDomains: async () => {}
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
