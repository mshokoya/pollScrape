import { prompt } from './prompt'
import { IPC_APP, IPC_EVT_Response } from '../../shared'
import { IPC_EVT_CHANNEL } from '../../shared/util'

type EmitObj = {
  taskID: string
  taskType: string
  message: string
}

type IO = {
  emit: (channel: string, { taskID, taskType, message }: EmitObj) => void
}

export const SocketIO = (ipc: IPC_APP): IO => {
  ipc.ipcMain.on(IPC_EVT_CHANNEL, (e, res: IPC_EVT_Response) => {
    if (res.channel === 'prompt') {
      switch (res.type) {
        case 'answer':
          prompt.answerQuestion(res.metadata.qid, res.metadata.choiceIDX)
          break
      }
    }
  })
  

  return {
    emit: (channel: string, { taskID, taskType, message }) => {
      ipc.mainWindow.webContents.send(IPC_EVT_CHANNEL, { channel, taskID, taskType, message })
    }
  }
}

// io.emit('apollo', {
//   taskID,
//   taskType: 'manualLogin',
//   message: `Login into ${account.domainEmail}`,
//   data: { accountID }
// })

export let io: any

export const initSocketIO = (ipc: IPC_APP) => {
  io = SocketIO(ipc)
  return io
}
