import { Mutex } from 'async-mutex'
import { generateID } from './util'
import { io } from './websockets'
import { ScrapeQueueEvent, SProcessQueueItem, SQueueItem } from '../../shared'
import { QUEUE_CHANNELS as QC } from '../../shared/util'

const ScrapeQueue = () => {
  const _Qlock = new Mutex()
  const _Plock = new Mutex()
  const exec_lock = new Mutex()
  let maxProcess: number = 20
  const scrapeQueue: SQueueItem[] = []
  let processQueue: SProcessQueueItem[] = []

  const enqueue = async <T>({ pid, action, args, taskGroup }: Omit<SQueueItem<T>, 'taskID'>) => {
    const taskID = generateID()
    return _Qlock
      .runExclusive(() => {
        scrapeQueue.push({ pid, taskID, action, taskGroup, args: { ...args, taskID } })
      })
      .then(() => {
        io.emit<ScrapeQueueEvent>(QC.scrapeQueue, {
          pid,
          taskID,
          taskGroup,
          taskType: 'enqueue',
          message: 'new task added to queue',
          metadata: {
            args
          }
        })
      })
      .finally(() => {
        console.log('task added')
        exec()
      })
  }

  const dequeue = async () => {
    return _Qlock
      .runExclusive(() => {
        return scrapeQueue.shift()
      })
      .then((t) => {
        if (!t) return
        io.emit<ScrapeQueueEvent>(QC.scrapeQueue, {
          pid: t.pid,
          taskGroup: t.taskGroup,
          taskID: t.taskID,
          message: 'moving from queue to processing',
          taskType: 'dequeue'
        })
        return t
      })
  }

  const p_enqueue = async (item: SProcessQueueItem) => {
    return _Plock
      .runExclusive(() => {
        processQueue.push(item)
      })
      .then(() => {
        io.emit<ScrapeQueueEvent>(QC.scrapeProcessQueue, {
          pid: item.task.pid,
          taskGroup: item.task.taskGroup,
          taskID: item.task.taskID,
          message: 'new task added to processing queue',
          taskType: 'enqueue',
          metadata: {
            args: item.task.args
          }
        })
      })
      .finally(() => {
        exec()
      })
  }

  const p_dequeue = async (taskID: string) => {
    return _Plock
      .runExclusive(() => {
        const task = processQueue.find((t) => t.task.taskID === taskID)
        processQueue = processQueue.filter((t) => t.task.taskID !== taskID)
        return task.task
      })
      .then((t) => {
        io.emit<ScrapeQueueEvent>(QC.scrapeProcessQueue, {
          pid: t.pid,
          taskID: t.taskID,
          taskGroup: t.taskGroup,
          message: 'removed completed task from queue',
          taskType: 'dequeue'
        })
      })
  }

  const exec = async () => {
    try {
      await exec_lock.acquire()
      if (processQueue.length >= maxProcess) return
      const task = await dequeue()
      if (!task) return

      const process = new Promise((resolve, reject) => {
        io.emit<ScrapeQueueEvent>(QC.scrapeProcessQueue, {
          pid: task.pid,
          taskID: task.taskID,
          taskGroup: task.taskGroup,
          message: `starting ${task.taskID} processing`,
          taskType: 'processing'
        })

        task
          .action(task.args)
          .then((r) => {
            resolve(r)
          })
          .catch((err) => {
            reject(err)
          })
      })
        .then(async (r: Record<string, any>) => {
          io.emit<ScrapeQueueEvent>(QC.scrapeProcessQueue, {
            pid: task.pid,
            taskID: task.taskID,
            taskGroup: task.taskGroup,
            ok: true,
            metadata: {
              response: r
            },
            taskType: 'end'
          })
          p_dequeue(task.taskID)
        })
        .catch(async (err) => {
          io.emit<ScrapeQueueEvent>(QC.scrapeProcessQueue, {
            pid: task.pid,
            taskID: task.taskID,
            taskGroup: task.taskGroup,
            ok: false,
            message: err.message,
            taskType: 'end'
          })
          p_dequeue(task.taskID)
        })
        .finally(() => {
          exec()
        })
      // as AbortablePromise<unknown>

      p_enqueue({ task, process })
    } finally {
      exec_lock.release()
    }
  }

  const setMaxProcesses = (n: number) => {
    maxProcess = n
  }

  return {
    setMaxProcesses,
    enqueue
  }
}

export let scrapeQueue: ReturnType<typeof ScrapeQueue>

export const initScrapeQueue = () => {
  scrapeQueue = ScrapeQueue()
  return scrapeQueue
}

// =======================================================================================================================================================

// import { cpus } from 'os'
// import { Mutex } from 'async-mutex'
// import { generateID } from './util'
// import { EmitResponse, io } from './websockets'
// import {
//   ipcMain,
//   MessageChannelMain,
//   MessagePortMain,
//   UtilityProcess,
//   utilityProcess
// } from 'electron/main'
// import path from 'path'
// import { P2cBalancer } from 'load-balancers'
// import { TaskEnqueue } from '../../shared'

// type TQueueItem = {
//   pid: string
//   taskID: string
//   taskGroup: string
//   taskType: string
//   taskArgs: Record<string, any> & { taskID: string }
// }

// // type PQueueItem = [
// //   id: string,
// //   args: Record<string, any> | undefined,
// //   // AbortablePromise<unknown>,
// //   TQueueItem
// // ]

// type Forks = {
//   [key: string]: {
//     fork: UtilityProcess
//     channel: {
//       mainPort: MessagePortMain
//       forkPort: MessagePortMain
//     }
//     status: 'started' | 'ready'
//     TIP: string[] // ids
//   }
// }

// const ScrapeQueue = () => {
//   const _Qlock = new Mutex()
//   const _Plock = new Mutex()
//   const exec_lock = new Mutex()
//   let maxJobs: number
//   const taskQueue: TQueueItem[] = []
//   let processQueue: PQueueItem[] = []
//   const maxForks = cpus().length
//   const forks: Forks = {}
//   let forkKeys: string[]
//   let lb: P2cBalancer
//   const tasks = {}

//   const createProcess = () => {
//     const id = generateID()
//     const { port1: mainPort, port2: forkPort } = new MessageChannelMain()
//     const fork = utilityProcess.fork(path.join(__dirname))
//     fork.postMessage({ message: 'ping', forkID: id }, [forkPort])
//     mainPort.on('message', handleProcessResponse)
//     mainPort.start()
//     forks[id] = {
//       fork,
//       channel: { mainPort, forkPort },
//       status: 'started',
//       TIP: []
//     }
//   }

//   const handleProcessResponse = (evt: {
//     data: { channel: string; args: EmitResponse & { evtType: string } & { forkID: string } }
//   }) => {
//     if (evt.data.args.evtType === 'pong') {
//       forks[evt.data.args.forkID].status = 'ready'
//       return
//     } else if (evt.data.channel === 'taskQueue' && evt.data.args.taskType === 'enqueue') {
//       // if scrape job in taskqueue in worker
//       forks[evt.data.args.forkID].TIP.push(evt.data.args.taskID)
//       tasks[evt.data.args.pid]
//         ? tasks[evt.data.args.pid].push(evt.data.args.taskID)
//         : (tasks[evt.data.args.pid] = [evt.data.args.taskID])

//       io.emit('scrapeQueue', evt.data)
//       P_Enqueue(evt.data.args as unknown as TaskEnqueue)
//       return
//     } else if (evt.data.channel === 'processQueue' && evt.data.args.taskType === 'enqueue')
//       const fork = findFork(evt.data.args.taskID)
//     if (!fork) return

//     switch (evt.data.args.evtType) {
//       case 'completed': {
//         fork.TIP = fork.TIP.filter((taskID: string) => taskID !== evt.data.args.taskID)
//         // this is for when all scapes completes for single task
//         if (tasks[evt.data.taskID].length === 1) {
//           delete tasks[evt.data.taskID]
//           io.emit('scrapeProcessQueue', {
//             taskID: evt.data.taskID,
//             message: 'task completed',
//             status: 'completed',
//             taskType: 'enqueue',
//             metadata: {
//               ok: evt.data.ok,
//               taskID: evt.data.taskID,
//               scrapeID: evt.data.scrapeID,
//               taskGroup: evt.data.taskGroup
//             }
//           })
//           ipcMain.emit('scrapeProcessQueue', {
//             taskID: evt.data.taskID,
//             ok: evt.data.ok,
//             metadata: evt.data.metadata
//           })
//         } else {
//           tasks[evt.data.taskID].filter((taskID: string) => taskID !== evt.data.taskID)
//           io.emit('scrapeProcessQueue', {
//             taskID: evt.data.taskID,
//             message: 'job completed',
//             status: 'finish',
//             taskType: 'enqueue',
//             metadata: {
//               taskID: evt.data.taskID,
//               scrapeID: evt.data.scrapeID,
//               taskGroup: evt.data.taskGroup
//             }
//           })
//         }
//         P_Dequeue(evt.data.scrapeID)
//         break
//       }
//       case 'message': {
//         io.emit(evt.data.channel, evt.data.args)
//         // io message to frontend (unless ipcmain works in fork)
//         break
//       }
//     }
//   }

//   // const killProcess = (id: number) => {
//   //   forks[id].fork.kill()
//   // }

//   const exec = async () => {
//     try {
//       await exec_lock.acquire()
//       if (processQueue.length >= maxJobs) return
//       const task = await dequeue()
//       if (!task) return

//       const fork = randomFork()
//       fork.fork.postMessage(task.taskArgs, [fork.channel.forkPort])
//     } finally {
//       exec_lock.release()
//     }
//   }

//   const init = () => {
//     for (let i = 0; i < maxForks; i++) {
//       createProcess()
//     }
//     forkKeys = Object.keys(forks)
//     lb = new P2cBalancer(forkKeys.length)
//   }

//   const randomFork = () => {
//     const key = forkKeys[lb.pick() - 1]
//     return forks[key]
//   }

//   const findFork = (taskID: string) => {
//     for (const i in forks) {
//       if (forks[i].TIP.includes(taskID)) return forks[i]
//     }
//   }

//   return {
//     init,
//     createProcess,
//     enqueue,
//     remove,
//     stop,
//     queues: () => ({ taskQueue, processQueue }),
//     tasksInProcess: () => processQueue
//   }
// }

// export let scrapeQueue: ReturnType<typeof ScrapeQueue>

// export const initScrapeQueue = () => {
//   scrapeQueue = ScrapeQueue()
//   return scrapeQueue
// }

// =======================================================================================================================================================

// const enqueue = async ({
//   pid,
//   taskID = generateID(),
//   taskGroup,
//   taskType,
//   taskArgs
// }: {
//   pid: string
//   taskID?: string
//   taskGroup: string
//   taskType: string
//   taskArgs: Record<string, any>
// }) => {
//   return _Qlock
//     .runExclusive(() => {
//       taskQueue.push({
//         pid,
//         taskID,
//         taskGroup,
//         taskType,
//         taskArgs: { ...taskArgs, taskID }
//       })
//     })
//     .then(() => {
//       io.emit('scrapeQueue', {
//         taskID,
//         message: 'New scrape added to queue',
//         status: 'enqueue',
//         taskType: 'enqueue',
//         metadata: {
//           taskID,
//           taskGroup,
//           metadata: taskArgs,
//           taskType
//         }
//       })
//     })
//     .finally(() => {
//       exec()
//     })
// }

// const dequeue = async () => {
//   return _Qlock
//     .runExclusive(() => {
//       return taskQueue.shift()
//     })
//     .then((t) => {
//       if (!t) return
//       io.emit('scrapeQueue', {
//         taskID: t.taskID,
//         message: 'moving from queue to processing',
//         status: 'passing',
//         taskType: 'dequeue',
//         metadata: {
//           taskID: t.taskID,
//           taskGroup: t.taskGroup
//         }
//       })
//       return t
//     })
// }

// const P_Enqueue = async (item: TaskEnqueue) => {
//   return _Plock
//     .runExclusive(() => {
//       processQueue.push(item)
//     })
//     .then(() => {
//       io.emit('scrapeQueue', {
//         taskID: item.taskID,
//         message: 'new task added to processing queue',
//         status: 'processing',
//         taskType: 'enqueue',
//         metadata: {
//           taskID: item.taskID,
//           taskGroup: item.taskGroup,
//           metadata: item.taskArgs,
//           taskType: item.taskType
//         }
//       })
//     })
//     .finally(() => {
//       exec()
//     })
// }

// const P_Dequeue = async (id: string) => {
//   return _Plock
//     .runExclusive(() => {
//       processQueue = processQueue.filter((task) => task[0] !== id)
//     })
//     .then(() => {
//       io.emit('scrapeProcessQueue', {
//         taskID: id,
//         message: 'removed completed task from queue',
//         status: 'end',
//         taskType: 'dequeue',
//         metadata: { taskID: id }
//       })
//     })
// }

// const stop = async (id: string) => {
//   return _Plock
//     .runExclusive(async () => {
//       const process = processQueue.find((p) => p[0] === id)
//       if (!process) return null
//       return await process[2].abort()
//     })
//     .then(() => {
//       io.emit('scrapeProcessQueue', {
//         taskID: id,
//         message: 'cancelled',
//         status: 'stopped',
//         taskType: 'stop',
//         metadata: { taskID: id }
//       })
//     })
//     .finally(() => {
//       exec()
//     })
// }
