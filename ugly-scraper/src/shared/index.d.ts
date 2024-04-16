import { IpcMain } from 'electron'
import { CHANNELS } from './util'
import { MessagePortMain, UtilityProcess } from 'electron/main'
import { ChildProcess } from 'child_process'
type IPC_APP = {
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

// type _DDD_ = {}

type TQTask = {
  taskGroup: string
  taskID: string
  status?: string
  processes: []
}

type STQTask = {
  taskGroup: string
  taskID: string
  pid: string
}

type TaskQueueEvent<T = Record<string, any>, ReqType = string> = {
  taskID: string
  message?: string
  ok?: boolean
  status?: string
  useFork: boolean
  taskType: ReqType
  metadata: {
    taskID: string
    taskGroup: string
    taskType: string
    metadata?: T
  }
}

type ScrapeQueueEvent<T = Record<string, any>> = {
  pid: string
  ok?: boolean
  taskID: string
  taskGroup: string
  taskType: string
  message?: string
  metadata?: {
    taskID: string
    taskGroup: string
    taskType: string
  } & { metadata?: T }
}

type SQueueItem<T = Record<string, any>> = {
  pid: string
  taskID: string
  taskGroup: string
  action: (a: T) => Promise<void>
  args: Omit<T, 'taskID'>
  metadata: Record<string, any>
}

type SProcessQueueItem = {
  task: SQueueItem
  process: Promise<any>
}

type ForkScrapeEventArgs = {
  pid: string
  taskGroup: string
  action: (typeof CHANNELS)[keyof typeof CHANNELS]
  args: Record<string, any>
  metadata: {
    taskID?: string
    taskGroup: string
    taskType: string
    metadata?: Record<string, any>
  }
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
    fork: ChildProcess
    TIP: string[] // ids
  }
}

// type ApolloSocketEvent<T = Record<string, any>> = {
//   taskID: string
//   taskType: string
//   message: string
//   ok?: boolean
//   metadata: T
// }

type TaskQueue = {
  queue: TQTask[]
  processing: TQTask[]
  timeout: TQTask[]
}
