import { prompt } from './prompt'
import { IPC_APP } from '../../shared'

type EmitObj = {
  taskID: string
  taskType?: string
  message?: string
  data?: Record<string, any>
}

type IO = {
  emit: (channel: string, { taskID, taskType, message }: EmitObj) => void
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
    emit: (channel: string, { taskID, taskType, message, data }) => {
      ipc.mainWindow.webContents.send(channel, { taskID, taskType, message, data })
    }
  }
}

export let io: IO

export const initSocketIO = (ipc: IPC_APP) => {
  io = SocketIO(ipc)
  return io
}
