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
  taskID: string
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
  | 'a_a_cfma'
  | 'a_a_um'
  | 'a_a_ua'
  | 'a_a_ca'
  | 'a_a_la'
  | 'a_a_aa'
  | 'a_a_lm'
  | 'a_a_d'
  // domain
  | 'a_d_ad'
  | 'a_d_vd'
  | 'a_d_dd'
  | 'a_d_gd'
  // metadata
  | 'a_m_um'
  | 'a_m_dm'
  | 'a_m_gm'
  // records
  | 'a_r_grs'
  | 'a_r_gr'
  // scrape
  | 'a_s_s'
  // proxy
  | 'a_p_gp'
  | 'a_p_ap'

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
