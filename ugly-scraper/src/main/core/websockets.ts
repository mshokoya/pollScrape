import { prompt } from './prompt'
import { IPC_APP, SProcessQueueItem, SQueueItem } from '../../shared'
import { get } from '../window'

export type EmitResponse = {
  pid?: string
  taskID: string
  evtType?: string
  taskType: string
  message: string
  data?: Record<string, any>
  status?: string
  metadata?: Record<string, any>
  ok?: boolean
}

export type StopEmitResponse = {
  scrapeQueue: SQueueItem[]
  processQueue: SProcessQueueItem[]
}

type IO = {
  on: (channel: string, fn: (event: Electron.IpcMainEvent, ...args: any[]) => void) => void
  send: (channel: string, ...args: any) => void
  emit: <T = EmitResponse>(channel: string, args: T) => void
}

export const SocketIO = (ipc?: IPC_APP): IO => {
  if (ipc) {
    ipc.ipcMain.on('prompt', (e, res: any) => {
      switch (res.type) {
        case 'answer':
          prompt.answerQuestion(res.metadata.qid, res.metadata.choiceIDX)
          break
      }
    })
  }

  return {
    on: (channel, fn) => {
      global.forkID ? process.on(channel, fn) : ipc.ipcMain.on(channel, fn)
    },
    send: (channel, ...args) => {
      global.forkID
        ? process.send({ channel, args: { evtType: 'message', ...args } })
        : ipc.ipcMain.emit(channel, ...args)
    },
    emit: (channel, args: Record<string, any>) => {
      global.forkID
        ? process.send({ channel, args: { evtType: 'message', ...args } })
        : get().webContents.send(channel, args)
    }
  }
}

export let io: IO

export const initSocketIO = (ipc?: IPC_APP) => {
  io = SocketIO(ipc)
  return io
}
