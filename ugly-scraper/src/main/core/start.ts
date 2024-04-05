import { initTaskQueue } from './task_queue'
import { initMailBox } from './mailbox'
import { initForwarder } from './forwarder'
import { initCache } from './cache'
import { initPrompt } from './prompt'
import { syncDB } from './database/db'

export const init = async (): Promise<void> => {
  await syncDB().then(() => {
    console.log('DB started')
  })

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
