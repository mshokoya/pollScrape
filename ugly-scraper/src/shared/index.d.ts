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

type _DDD_ = {}

type TaskQueueEvent = {
  taskID: string
  message?: string
  ok?: boolean
  status?: string
  taskType: string
  metadata?: {
    taskID?: string
    taskGroup?: string
    taskType?: string
    metadata?: Record<string, any>
  }
}

type ScrapeQueueEvent = {
  pid: string
  ok?: bookean
  taskID: string
  taskType: string
  message?: string
  metadata?: Record<string, any>
}

type SQueueItem<T = Record<string, any>> = {
  pid: string
  taskID: string
  action: (a: T) => Promise<void>
  args: Omit<T, 'taskID'>
}

type SProcessQueueItem = {
  task: SQueueItem
  process: Promise<any>
}

type ForkScrapeEventArgs = {
  pid: string
  action: ForkActions
  args: Records<string, any>
}

type ForkScrapeEvent = {
  taskType: 'scrape'
  meta: ForkScrapeEventArgs
}

type ForkEvent<T = ForkScrapeEvent> = {
  data: T
}

type ForkActions =
  // account
  | 'a_aum'
  | 'a_aua'
  | 'a_ala'
  | 'a_adel'
  | 'a_alm'
  | 'a_ad'
  | 'a_ac'
  | 'a_au'
  | 'a_aga'
  | 'a_aa'
  | 'a_aca'
  // domain
  | 'a_da'
  | 'a_dv'
  | 'a_dd'
  | 'a_dga'
  // metadata
  | 'a_mga'
  | 'a_md'
  | 'a_mu'
  // records
  | 'a_rga'
  | 'a_rg'
  // scrape
  | 'a_s'
  // proxy
  | 'a_pga'
  | 'a_pa'

type Forks = {
  [key: string]: {
    fork: UtilityProcess
    channel: {
      mainPort: MessagePortMain
      forkPort: MessagePortMain
    }
    status: 'started' | 'ready'
    TIP: string[] // ids
  }
}
