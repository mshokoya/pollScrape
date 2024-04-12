import { prompt } from './prompt'
import { IPC_APP } from '../../shared'

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

type IO = {
  on: (channel: string, fn: (event: Electron.IpcMainEvent, ...args: any[]) => void) => void
  send: (channel: string, ...args: any) => void
  emit: <T = EmitResponse>(channel: string, args: T) => void
}

export const SocketIO = (ipc?: IPC_APP): IO => {
  const on = global.forkID ? global.port.on : ipc.ipcMain.on
  const send = global.forkID ? global.port.postMessage : ipc.ipcMain.emit
  const emit = global.forkID ? global.port.postMessage : ipc.mainWindow.webContents.send

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
    on: (channel, fn) => on(channel, fn),
    send: (channel, ...args) => send(channel, ...args),
    emit: (channel, args) => {
      global.forkID
        ? emit('message', { channel, args: { evtType: 'message', ...args } })
        : emit(channel, args)
    }
  }
}

export let io: IO

export const initSocketIO = (ipc?: IPC_APP) => {
  io = SocketIO(ipc)
  return io
}
