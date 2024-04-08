import { cpus } from 'os'
import { Mutex } from 'async-mutex'
import AbortablePromise from 'promise-abortable'
import { generateID } from './util'
import { io } from './websockets'
import { MessageChannelMain, MessagePortMain, UtilityProcess, utilityProcess } from 'electron/main'
import path from 'path'
import { IAccount } from './database/models/accounts'
// import { Piscina } from 'piscina';
// import path from 'path'

// const piscina = new Piscina({
//   filename: path.resolve(__dirname, 'worker.js')
// });

type QueueItem = {
  taskID: string
  taskGroup: string
  jobType: string
  scrapeID: string
  jobArgs: Record<string, any> & { scrapeID: string }
}

type TIP_Item = [
  id: string,
  args: Record<string, any> | undefined,
  AbortablePromise<unknown>,
  QueueItem
]

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
  const taskQueue: QueueItem[] = []
  let processQueue: TIP_Item[] = []
  const maxForks = cpus().length
  const forks: Forks = {}

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
    switch (evt.data.type) {
      case 'pong': {
        forks[evt.data.id].status = 'ready'
        break
      }
      case 'started': {
        forks[evt.data.id].TIP.push(evt.data.taskID)
        break
      }
      case 'completed': {
        forks[evt.data.id].TIP = forks[evt.data.id].TIP.filter(
          (taskID: string) => taskID !== evt.data.taskID
        )
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

  const enqueue = async (
    taskID: string,
    taskGroup: string,
    jobType: string,
    jobArgs: Record<string, any>
  ) => {
    return _Qlock
      .runExclusive(() => {
        const scrapeID = generateID()
        // @ts-ignore
        taskQueue.push({
          taskID,
          scrapeID,
          taskGroup,
          jobType,
          jobArgs: { ...jobArgs, scrapeID }
        })
        return { scrapeID }
      })
      .then(({ scrapeID }) => {
        io.emit('scrapeQueue', {
          message: 'new scrape added to queue',
          status: 'enqueue',
          taskType: 'enqueue',
          metadata: { taskID, scrapeID, taskGroup, metadata: jobArgs, jobType }
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
          message: 'moving from queue to processing',
          status: 'passing',
          taskType: 'dequeue',
          metadata: {
            taskID: t.taskID,
            scrapeID: t.scrapeID,
            taskGroup: t.taskGroup
          }
        })
        return t
      })
  }

  // const remove = async (id: string) => {
  //   return _Qlock
  //     .runExclusive(() => {
  //       // (FIX) filter not saved
  //       taskQueue.filter((task) => task.scrapeID !== id)
  //     })
  //     .then(() => {
  //       io.emit('scrapeQueue', {
  //         message: 'deleting task from queue',
  //         status: 'removed',
  //         taskType: 'remove',
  //         metadata: { scrape: id, }
  //       })
  //     })
  // }

  const _TIP_Enqueue = async (item: TIP_Item) => {
    return _Plock
      .runExclusive(() => {
        processQueue.push(item)
      })
      .then(() => {
        io.emit('scrapeProcessQueue', {
          message: 'new task added to processing queue',
          status: 'start',
          taskType: 'enqueue',
          metadata: { taskID: item[0] }
        })
      })
      .finally(() => {
        exec()
      })
  }

  const _TIP_Dequeue = async (id: string) => {
    return _Plock
      .runExclusive(() => {
        processQueue = processQueue.filter((task) => task[0] !== id)
      })
      .then(() => {
        io.emit('scrapeProcessQueue', {
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

      const taskIOArgs = {
        taskGroup: task.taskGroup,
        taskID: task.id,
        metadata: task.metadata
      }

      const tsk = new Promise((resolve, reject) => {
        task
          .action()
          .then((r) => {
            resolve(r)
          })
          .catch((err) => {
            reject(err)
          })
      })
        .then(async (r) => {
          io.emit(task.taskGroup, { ...taskIOArgs, ok: true, metadata: r })
        })
        .catch(async (err) => {
          io.emit(task.taskGroup, { ...taskIOArgs, ok: false, message: err.message })
        })
        .finally(() => {
          _TIP_Dequeue(task.id)
          exec()
        }) as AbortablePromise<unknown>

      _TIP_Enqueue([task.id, task.args, tsk, task])
    } finally {
      exec_lock.release()
    }
  }

  return {
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
