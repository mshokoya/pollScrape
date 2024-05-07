import { initTaskQueue } from './task-queue'
import { initMailBox } from './mailbox'
import { initForwarder } from './forwarder'
import { cache, initCache } from './cache'
import { initPrompt } from './prompt'
import { syncDB } from './database/db'
import { initSocketIO, io } from './websockets'
import { initScrapeQueue, scrapeQueue } from './scrape-queue'
import { IPC_APP } from '../../shared'

// (FIX) create types for receiving data from parent (websockets.ts = parent -> frontend & fork -> parent)
process.on('message', (e: any & { taskType: string }) => {
  switch (e.taskType) {
    case 'init': {
      global.forkID = e.forkID
      global.cacheHTTPPort = e.cacheHTTPPort
      process.on('uncaughtException', (err) => {
        console.log(global.forkID)
        console.log('in da exception')
        console.log(err)
      })
      init(null, true)
        .then(() => {
          io.emit('fork', {
            taskType: 'create',
            ok: true,
            forkID: e.forkID
          })
        })
        .catch(() => {
          io.emit('fork', { taskType: 'create', ok: false })
          process.kill(0)
        })
      break
    }
    case 'scrape': {
      scrapeQueue.enqueue(e.meta)
      break
    }
    case 'move': {
      scrapeQueue.move(e.meta)
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

export const init = async (ipc?: IPC_APP): Promise<void> => {
  await syncDB().then(() => {
    console.log('DB started')
  })

  initSocketIO(ipc)
  console.log('SocketIO started')

  initCache()
  console.log('Cache started')

  initPrompt()
  console.log('Prompt started')

  if (global.forkID) {
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
}
