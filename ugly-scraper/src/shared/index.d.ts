import { BrowserWindow, IpcMain } from 'electron'
import { CHANNELS } from './util'
type IPC_APP = {
  mainWindow: BrowserWindow
  ipcMain: IpcMain
}

type AddAccountArgs = {
  addType: string
  selectedDomain: string
  email: string
  password: string
  recoveryEmail: string
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

type TaskQueueEvent<T = Record<string, any>, ReqType = string> = {
  taskID: string
  message?: string
  ok?: boolean
  status?: string
  taskType: ReqType
  metadata: {
    taskID: string
    taskGroup: string
    taskType: string
    metadata?: T
  }
}

type ScrapeQueueEvent<A = Record<string, any>, R = Record<string, any>> = {
  pid: string
  ok?: bookean
  taskID: string
  taskType: string
  message?: string
  metadata?: {
    args?: A
    response?: R
  }
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
  action: (typeof CHANNELS)[keyof typeof CHANNELS]
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

type ApolloSocketEvent<T = Record<string, any>> = {
  taskID: string
  taskType: string
  message: string
  ok?: boolean
  metadata: T
}
