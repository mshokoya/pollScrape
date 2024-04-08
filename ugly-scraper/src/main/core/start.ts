import { initTaskQueue } from './task-queue'
import { initMailBox } from './mailbox'
import { initForwarder } from './forwarder'
import { initCache } from './cache'
import { initPrompt } from './prompt'
import { syncDB } from './database/db'
import { initSocketIO } from './websockets'
import { IPC_APP } from '../../shared'

export const init = async (ipc: IPC_APP): Promise<void> => {
  await syncDB().then(() => {
    console.log('DB started')
  })

  initSocketIO(ipc)
  console.log('SocketIO started')

  initCache()
  console.log('Cache started')

  initPrompt()
  console.log('Prompt started')

  initTaskQueue()
  console.log('TaskQueue started')

  initForwarder()
  console.log('Forwarder started')

  await initMailBox()
  console.log('Mailbox started')
}
