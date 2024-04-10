import { prompt } from './prompt'
import { IPC_APP } from '../../shared'

type EmitResponse = {
  taskID: string
  taskType: string
  message: string
  data?: Record<string, any>
  status: string
  metadata?: Record<string, any>
  ok?: boolean
}

type IO = {
  on: (channel: string, fn: (event: Electron.IpcMainEvent, ...args: any[]) => void) => void
  send: (channel: string, ...args: any) => void
  emit: (channel: string, { taskID, taskType, message }: EmitResponse) => void
}

export const SocketIO = (ipc: IPC_APP): IO => {
  ipc.ipcMain.on('prompt', (e, res: any) => {
    switch (res.type) {
      case 'answer':
        prompt.answerQuestion(res.metadata.qid, res.metadata.choiceIDX)
        break
    }
  })

  return {
    on: (channel, fn) => {
      ipc.ipcMain.on(channel, fn)
    },
    send: (channel, ...args) => {
      ipc.ipcMain.emit(channel, ...args)
    },
    emit: (channel, args) => {
      ipc.mainWindow.webContents.send(channel, args)
    }
  }
}

export let io: IO

export const initSocketIO = (ipc: IPC_APP) => {
  io = SocketIO(ipc)
  return io
}
