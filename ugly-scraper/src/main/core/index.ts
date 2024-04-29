import { initTaskQueue } from './task-queue'
import { initMailBox } from './mailbox'
import { initForwarder } from './forwarder'
import { cache, initCache } from './cache'
import { initPrompt } from './prompt'
import { syncDB } from './database/db'
import { initSocketIO } from './websockets'
import { initScrapeQueue, scrapeQueue } from './scrape-queue'
import { IPC_APP } from '../../shared'

// (FIX) create types for receiving data from parent (websockets.ts = parent -> frontend & fork -> parent)
process.on('message', (e: any & { taskType: string }) => {
  switch (e.taskType) {
    case 'init': {
      global.forkID = e.forkID
      global.cacheHTTPPort = e.cacheHTTPPort
      init(null, true)
      break
    }
    case 'scrape': {
      const args = e.meta
      scrapeQueue.enqueue(args)
      break
    }
    case 'move': {
      break
    }
    case 'stop': {
      if (e.stopType === 'force') {
        scrapeQueue.stopForce()
      } else if (e.stopType === 'waitAll') {
        scrapeQueue.stopWaitForAll()
      } else if (e.stopType === 'waitPs') {
        scrapeQueue.stopWaitForProcess()
      }
      break
    }
  }
})

export const init = async (ipc?: IPC_APP, isFork: boolean = false): Promise<void> => {
  await syncDB().then(() => {
    console.log('DB started')
  })

  initSocketIO(ipc)
  console.log('SocketIO started')

  initCache()
  console.log('Cache started')

  initPrompt()
  console.log('Prompt started')

  if (isFork) {
    initScrapeQueue()
    console.log('ScrapeQueue started')
  } else {
    initTaskQueue()
    console.log('TaskQueue started')
  }

  initForwarder()
  console.log('Forwarder started')

  initMailBox()
  console.log('Mailbox started')

  if (isFork) {
    console.log(await cache.getAllMetaIDs())
  }
}
