import { cpus } from 'os'
import { Mutex } from 'async-mutex'
import { generateID } from './util'
import { io } from './websockets'
import {
  ipcMain,
  MessageChannelMain,
  MessagePortMain,
  UtilityProcess,
  utilityProcess
} from 'electron/main'
import path from 'path'
import { P2cBalancer } from 'load-balancers'

type TQueueItem = {
  pid: string
  taskID: string
  taskGroup: string
  taskType: string
  taskArgs: Record<string, any> & { taskID: string }
}

// type PQueueItem = [
//   id: string,
//   args: Record<string, any> | undefined,
//   // AbortablePromise<unknown>,
//   TQueueItem
// ]

type Forks = {
  [key: string]: {
    fork: UtilityProcess
    channel: {
      port1: MessagePortMain
      port2: MessagePortMain
    }
    status: 'started' | 'ready'
    TIP: string[] // ids
  }
}

const ScrapeQueue = () => {
  const _Qlock = new Mutex()
  const _Plock = new Mutex()
  const exec_lock = new Mutex()
  let maxJobs: number
  const taskQueue: TQueueItem[] = []
  let processQueue: PQueueItem[] = []
  const maxForks = cpus().length
  const forks: Forks = {}
  let forkKeys: string[]
  let lb: P2cBalancer
  const tasks = {}

  const createProcess = () => {
    const id = generateID()
    const { port1, port2 } = new MessageChannelMain()
    const fork = utilityProcess.fork(path.join(__dirname, '_____________'))

    fork.on('message', handleProcessResponse)
    fork.postMessage({ id, type: 'ping' }, [port2])

    forks['_____1______'] = {
      fork,
      channel: { port1, port2 },
      status: 'started',
      TIP: []
    }
  }

  const handleProcessResponse = (evt: { data: Record<string, any> }) => {
    console.log('eevvtt')
    console.log(evt)
    switch (evt.data.type) {
      case 'pong': {
        forks[evt.data.id].status = 'ready'
        break
      }
      case 'started': {
        forks[evt.data.id].TIP.push(evt.data.taskID)
        tasks[evt.data.taskID] = tasks[evt.data.taskID]
          ? [].concat(tasks[evt.data.taskID], [evt.data.id])
          : [evt.data.id]
        io.emit('scrapeProcessQueue', {
          taskID: evt.data.taskID,
          message: 'moving from queue to processing',
          status: 'start',
          taskType: 'enqueue',
          metadata: {
            taskID: evt.data.taskID,
            scrapeID: evt.data.scrapeID,
            taskGroup: evt.data.taskGroup
          }
        })
        P_Enqueue(evt.data.scrapeID)
        break
      }
      case 'completed': {
        forks[evt.data.id].TIP = forks[evt.data.id].TIP.filter(
          (taskID: string) => taskID !== evt.data.taskID
        )
        // this is for when all scapes completes for single task
        if (tasks[evt.data.taskID].length === 1) {
          delete tasks[evt.data.taskID]
          io.emit('scrapeProcessQueue', {
            taskID: evt.data.taskID,
            message: 'task completed',
            status: 'completed',
            taskType: 'enqueue',
            metadata: {
              ok: evt.data.ok,
              taskID: evt.data.taskID,
              scrapeID: evt.data.scrapeID,
              taskGroup: evt.data.taskGroup
            }
          })
          ipcMain.emit('scrapeProcessQueue', {
            taskID: evt.data.taskID,
            ok: evt.data.ok,
            metadata: evt.data.metadata
          })
        } else {
          tasks[evt.data.taskID].filter((taskID: string) => taskID !== evt.data.taskID)
          io.emit('scrapeProcessQueue', {
            taskID: evt.data.taskID,
            message: 'job completed',
            status: 'finish',
            taskType: 'enqueue',
            metadata: {
              taskID: evt.data.taskID,
              scrapeID: evt.data.scrapeID,
              taskGroup: evt.data.taskGroup
            }
          })
        }
        P_Dequeue(evt.data.scrapeID)
        break
      }
      case 'message': {
        io.emit(evt.data.channel, evt.data.metadata)
        // io message to frontend (unless ipcmain works in fork)
        break
      }
    }
  }

  // const killProcess = (id: number) => {
  //   forks[id].fork.kill()
  // }

  const enqueue = async ({
    pid,
    taskID = generateID(),
    taskGroup,
    taskType,
    taskArgs
  }: {
    pid: string
    taskID: string
    taskGroup: string
    taskType: string
    taskArgs: Record<string, any> & { taskID: string }
  }) => {
    return _Qlock
      .runExclusive(() => {
        taskQueue.push({
          pid,
          taskID,
          taskGroup,
          taskType,
          taskArgs: { ...taskArgs, taskID }
        })
      })
      .then(() => {
        io.emit('scrapeQueue', {
          taskID,
          message: 'New scrape added to queue',
          status: 'enqueue',
          taskType: 'enqueue',
          metadata: {
            taskID,
            taskGroup,
            metadata: taskArgs,
            taskType
          }
        })
      })
      .finally(() => {
        exec()
      })
  }

  const dequeue = async () => {
    return _Qlock
      .runExclusive(() => {
        return taskQueue.shift()
      })
      .then((t) => {
        if (!t) return
        io.emit('scrapeQueue', {
          taskID: t.taskID,
          message: 'moving from queue to processing',
          status: 'passing',
          taskType: 'dequeue',
          metadata: {
            taskID: t.taskID,
            taskGroup: t.taskGroup
          }
        })
        return t
      })
  }


  const P_Enqueue = async (item: TQueueItem) => {
    return _Plock
      .runExclusive(() => {
        processQueue.push(item)
      })
      .then(() => {
        io.emit('scrapeQueue', {
          taskID: item.taskID,
          message: 'new task added to processing queue',
          status: 'processing',
          taskType: 'enqueue',
          metadata: {
            taskID: item.taskID,
            taskGroup: item.taskGroup,
            metadata: item.taskArgs,
            taskType: item.taskType
          }
        })
      })
      .finally(() => {
        exec()
      })
  }

  const P_Dequeue = async (id: string) => {
    return _Plock
      .runExclusive(() => {
        processQueue = processQueue.filter((task) => task[0] !== id)
      })
      .then(() => {
        io.emit('scrapeProcessQueue', {
          taskID: id,
          message: 'removed completed task from queue',
          status: 'end',
          taskType: 'dequeue',
          metadata: { taskID: id }
        })
      })
  }

  const stop = async (id: string) => {
    return _Plock
      .runExclusive(async () => {
        const process = processQueue.find((p) => p[0] === id)
        if (!process) return null
        return await process[2].abort()
      })
      .then(() => {
        io.emit('scrapeProcessQueue', {
          taskID: id,
          message: 'cancelled',
          status: 'stopped',
          taskType: 'stop',
          metadata: { taskID: id }
        })
      })
      .finally(() => {
        exec()
      })
  }

  const exec = async () => {
    try {
      await exec_lock.acquire()
      if (processQueue.length >= maxJobs) return
      const task = await dequeue()
      if (!task) return

      const fork = randomFork()
      fork.fork.postMessage(task.taskArgs, [fork.channel.port2])
    } finally {
      exec_lock.release()
    }
  }

  const init = () => {
    for (let i = 0; i < maxForks; i++) {
      createProcess()
    }
    forkKeys = Object.keys(forks)
    lb = new P2cBalancer(forkKeys.length)
  }

  const randomFork = () => {
    const key = forkKeys[lb.pick() - 1]
    return forks[key]
  }

  return {
    init,
    createProcess,
    enqueue,
    remove,
    stop,
    queues: () => ({ taskQueue, processQueue }),
    tasksInProcess: () => processQueue
  }
}

export let scrapeQueue: ReturnType<typeof ScrapeQueue>

export const initScrapeQueue = () => {
  scrapeQueue = ScrapeQueue()
  return scrapeQueue
}
