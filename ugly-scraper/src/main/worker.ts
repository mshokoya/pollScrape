// import { actions } from './actions'
import { ForkEvent, SQueueItem } from '../shared'
import { init } from './core'
import { actions } from './core/actions'
import { scrapeQueue } from './core/scrape-queue'

console.log('WE IN DA WORKER')

process.parentPort.on('message', (e) => {
  init(null, true).then(() => {
    const [port] = e.ports

    global.port = port

    port.on('message', (e: ForkEvent) => {
      switch (e.data.taskType) {
        case 'scrape': {
          const args = e.data.meta
          const action = actions[args.action]
          // @ts-ignore
          scrapeQueue.enqueue({ ...args, action })
          break
        }
      }
    })

    port.start()
  })
})
