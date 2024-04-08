import { BrowserWindow, IpcMain } from 'electron'
type IPC_APP = {
  mainWindow: BrowserWindow
  ipcMain: IpcMain
}

type IPC_EVT_Response<T = Record<string, any>> = {
  channel: string
  id: string
  type: string
  message: string
  data: T
  ok: boolean
}