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
  taskType: string
  processes: []
}

type STQTask = {
  taskGroup: string
  taskType: string
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
  taskType
  taskGroup: string
  action: string
  args: Omit<T, 'taskID'>
  metadata: Record<string, any>
}

type SProcessQueueItem = {
  task: SQueueItem
  process: Promise<any>
  abortController: AbortController
}

type ForkScrapeEventArgs = {
  pid: string
  taskGroup: string
  action: (typeof CHANNELS)[keyof typeof CHANNELS]
  args: Omit<Record<string, any>, taskID>
  metadata: {
    taskID?: string
    taskGroup: string
    taskType: string
    metadata?: Record<string, any>
  }
}

type ForkScrapeEvent = {
  taskType: 'scrape' | 'move'
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
    stopType?: StopType
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

type STaskQueue = {
  queue: STQTask[]
  processing: STQTask[]
  timeout: STQTask[]
}

export type IAccount = {
  id: string
  domain: string
  accountType: 'free' | 'premium'
  trialTime: string
  suspended: boolean
  verified: 'no' | 'confirm' | 'yes' // confirm = conformation email sent
  loginType: 'default' | 'gmail' | 'outlook'
  email: string
  password: string
  cookies: string
  proxy: string
  lastUsed: number // new Date.getTime()
  recoveryEmail: string
  emailCreditsUsed: number
  emailCreditsLimit: number
  renewalDateTime: number | Date
  renewalStartDate: number | Date
  renewalEndDate: number | Date
  trialDaysLeft: number
  history: [
    amountOfLeadsScrapedOnPage: number,
    timeOfScrape: number,
    listName: string,
    scrapeID: string
  ][]
}

export type IDomain = {
  id: string
  domain: string
  authEmail: string
  authPassword: string
  verified: boolean
  MXRecords: boolean
  TXTRecords: boolean
  VerifyMessage: string
}

export type IMetaData = {
  id: string
  url: string
  params: { [key: string]: string }
  name: string
  scrapes: { scrapeID: string; listName: string; length: number; date: number }[]
  accounts: { accountID: string; range: [min: number, max: number] }[]
}

export type IProxy = {
  id: string
  proxy: string
  protocol: string
  host: string
  port: string
}

export type IRecords = {
  id: string
  scrapeID: string
  url: string
  data: IRecord
}

export type IRecord = {
  Name: string
  Firstname: string
  Lastname: string
  Linkedin: string
  Title: string
  'Company Name': string
  'Company Website': string
  'Comapny Linkedin': string
  'Company Twitter': string
  'Company Facebook': string
  Email: string
  isVerified: boolean
  'Company Location': string
  Employees: string
  Phone: string
  Industry: string
  Keywords: string[]
}

type StopType = 'force' | 'waitAll' | 'waitPs'
