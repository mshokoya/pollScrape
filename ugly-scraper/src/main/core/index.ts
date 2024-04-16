import { initTaskQueue } from './task-queue'
import { initMailBox } from './mailbox'
import { initForwarder } from './forwarder'
import { initCache } from './cache'
import { initPrompt } from './prompt'
import { syncDB } from './database/db'
import { initSocketIO } from './websockets'
import { initScrapeQueue, scrapeQueue } from './scrape-queue'
import { IPC_APP } from '../../shared'
import { generateID } from './util'
import { actions } from './actions'

process.on('message', (e) => {
  console.log('wi in dis bihh')
  switch (e.taskType) {
    case 'init': {
      console.log('WE WYYAAA')
      global.forkID = generateID()
      init(null, true)
      break
    }
    case 'scrape': {
      const args = e.meta
      const action = actions[args.action]
      scrapeQueue.enqueue({ ...args, action })
      break
    }
  }
})

// process.parentPort?.on('message', (e) => {
//   console.log('WE WYYAAA')
//   global.forkID = generateID()
//   const [port] = e.ports

//   global.port = port

//   port.on('message', (e: ForkEvent) => {
//     switch (e.data.taskType) {
//       case 'scrape': {
//         const args = e.data.meta
//         const action = actions[args.action]
//         scrapeQueue.enqueue({ ...args, action })
//         break
//       }
//     }
//   })

//   port.start()

//   init(null, true)
// })

export const init = async (ipc?: IPC_APP, isFork: boolean = false): Promise<void> => {
  // global.isWorker = wrk
  //

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
}

// ==========================================================================================

// const { port1, port2 } = new MessageChannelMain()

// const child = utilityProcess.fork(path.join(__dirname, './worker.js'))
// child.postMessage({ message: 'hello' }, [port1])

// // port2.on('message', (e) => {
// //   console.log(`Message from child: ${e.data}`)
// // })
// port2.start()

// setInterval(() => {
//   port2.postMessage('hello')
// }, 5000)
