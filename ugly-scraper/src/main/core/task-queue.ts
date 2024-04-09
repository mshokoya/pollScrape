import { cpus } from 'os'
import { Mutex } from 'async-mutex'
import AbortablePromise from 'promise-abortable'
import { generateID } from './util'
import { io } from './websockets'
import { ipcMain } from 'electron'
// import { Piscina } from 'piscina';
// import path from 'path'

// const piscina = new Piscina({
//   filename: path.resolve(__dirname, 'worker.js')
// });

type QueueItem = {
  id: string
  taskGroup: string
  taskType: string
  message: string
  metadata: Record<string, string | number> & { taskID: string }
  action: () => Promise<any>
  args?: Record<string, any>
}

type TIP_Item = [
  id: string,
  args: Record<string, any> | undefined,
  AbortablePromise<unknown>,
  QueueItem
]

const TaskQueue = () => {
  const _Qlock = new Mutex()
  const _Plock = new Mutex()
  const exec_lock = new Mutex()
  let maxWorkers: number
  const taskQueue: QueueItem[] = []
  let processQueue: TIP_Item[] = []
  // let pool;

  const enqueue = async <T = Record<string, any>>(
    taskID = generateID(),
    taskGroup: string,
    taskType: string,
    message: string,
    metadata: Record<string, any>,
    action: (a: T) => Promise<unknown>,
    args?: T
  ) => {
    return _Qlock
      .runExclusive(() => {
        // @ts-ignore
        taskQueue.push({ taskID, action, args, taskGroup, taskType, message, metadata })
      })
      .then(() => {
        io.emit('taskQueue', {
          taskID,
          message: 'new task added to queue',
          status: 'enqueue',
          taskType: 'enqueue',
          metadata: { taskID, taskGroup, taskType, metadata }
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
        return taskQueue.shift()
      })
      .then((t) => {
        if (!t) return
        io.emit('taskQueue', {
          taskID: t.id,
          message: 'moving from queue to processing',
          status: 'passing',
          taskType: 'dequeue',
          metadata: {
            taskID: t.id,
            taskGroup: t.taskGroup,
            taskType: t.taskType,
            metadata: t.metadata
          }
        })
        return t
      })
  }

  const remove = async (id: string) => {
    return _Qlock
      .runExclusive(() => {
        taskQueue.filter((task) => task.id !== id)
      })
      .then(() => {
        io.emit('taskQueue', {
          taskID: id,
          message: 'deleting task from queue',
          status: 'removed',
          taskType: 'remove',
          metadata: { taskID: id }
        })
      })
  }

  const _TIP_Enqueue = async (item: TIP_Item) => {
    return _Plock
      .runExclusive(() => {
        processQueue.push(item)
      })
      .then(() => {
        io.emit('processQueue', {
          taskID: item[0],
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
        io.emit('processQueue', {
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
        io.emit('processQueue', {
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

  const setMaxWorkers = (n: number) => {
    if (n > maxWorkers) {
      for (let i = maxWorkers; i < n; i++) {
        exec()
      }
    }
    maxWorkers = n
  }

  const exec = async () => {
    try {
      console.log('task exec 1 ')
      await exec_lock.acquire()
      if (processQueue.length >= maxWorkers) return
      const task = await dequeue()
      if (!task) return
      console.log('task exec 2 ')

      const taskIOArgs = {
        taskGroup: task.taskGroup,
        taskID: task.id,
        metadata: task.metadata
      }

      const tsk = new Promise((resolve, reject) => {
        // io.emit('processQueue', {
        //   message: `starting ${task.id} processing`,
        //   taskType: 'processing',
        //   metadata: { taskID: task.id }
        // })

        console.log('task exec 3 ')

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
          console.log('in tq then')
          console.log(r)
          // @ts-ignore
          io.emit(task.taskGroup, { ...taskIOArgs, ok: true, metadata: r })
        })
        .catch(async (err) => {
          console.log('in tq err')
          console.log(err)
          // @ts-ignore
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

  function init() {
    maxWorkers = Math.round(cpus().length / 2)
  }

  ipcMain.on('scrapeProcessQueue', ({ taskID, taskGroup, ok, message, metadata }) => {
    io.emit(taskGroup, { ok, message, taskID })
    _TIP_Dequeue(taskID)
    exec()
  })

  return {
    enqueue,
    remove,
    stop,
    init,
    setMaxWorkers,
    maxWorkers: () => maxWorkers,
    queues: () => ({ taskQueue, processQueue }),
    tasksInProcess: () => processQueue
  }
}

export let taskQueue: ReturnType<typeof TaskQueue>

export const initTaskQueue = () => {
  taskQueue = TaskQueue()
  taskQueue.init()
  return taskQueue
}

// ==================================

// import { cpus } from 'os'
// import { Mutex } from 'async-mutex'
// import AbortablePromise from 'promise-abortable'
// import { generateID } from './util'
// import { io } from './websockets'

// type QueueItem = {
//   id: string
//   taskGroup: string
//   taskType: string
//   message: string
//   metadata: Record<string, string | number> & { taskID: string }
//   action: () => Promise<any>
//   args?: Record<string, any>
// }

// // processQueue = TASK IN PROCESS
// type TIP_Item = [
//   id: string,
//   args: Record<string, any> | undefined,
//   AbortablePromise<unknown>,
//   QueueItem
// ]

// // https://dev.to/bleedingcode/increase-node-js-performance-with-libuv-thread-pool-5h10

// // (FIX) remember to test processQueue cancelation
// // (FIX) REMEMBER BECAUSE SCRAPES ARE RUNNING IN PARALLEL, SOME DB RESOURCES NEED TO BE SAVED BEFORE USE
// // E.G WHEN SELECTING USE ACCOUNT OR PROXY TO SCRAPE WITH
// const TaskQueue = () => {
//   const _Qlock = new Mutex()
//   const _Plock = new Mutex()
//   const exec_lock = new Mutex()
//   let maxWorkers: number
//   const taskQueue: QueueItem[] = []
//   let processQueue: TIP_Item[] = []
//   // let pool;

//   const enqueue = async <T = Record<string, any>>(
//     id = generateID(),
//     taskGroup: string,
//     taskType: string,
//     message: string,
//     metadata: Record<string, any>,
//     action: (a: T) => Promise<unknown>,
//     args?: T
//   ) => {
//     return _Qlock
//       .runExclusive(() => {
//         // @ts-ignore
//         taskQueue.push({ id, action, args, taskGroup, taskType, message, metadata })
//       })
//       .then(() => {
//         io.emit('taskQueue', {
//           message: 'new task added to queue',
//           status: 'enqueue',
//           taskType: 'enqueue',
//           metadata: { taskID: id, taskGroup, taskType, metadata }
//         })
//       })
//       .finally(() => {
//         exec()
//       })
//   }

//   const dequeue = async () => {
//     return _Qlock
//       .runExclusive(() => {
//         return taskQueue.shift()
//       })
//       .then((t) => {
//         if (!t) return
//         io.emit('taskQueue', {
//           message: 'moving from queue to processing',
//           status: 'passing',
//           taskType: 'dequeue',
//           metadata: {
//             taskID: t.id,
//             taskGroup: t.taskGroup,
//             taskType: t.taskType,
//             metadata: t.metadata
//           }
//         })
//         return t
//       })
//   }

//   const remove = async (id: string) => {
//     return _Qlock
//       .runExclusive(() => {
//         taskQueue.filter((task) => task.id !== id)
//       })
//       .then(() => {
//         io.emit('taskQueue', {
//           message: 'deleting task from queue',
//           status: 'removed',
//           taskType: 'remove',
//           metadata: { taskID: id }
//         })
//       })
//   }

//   const _TIP_Enqueue = async (item: TIP_Item) => {
//     return _Plock
//       .runExclusive(() => {
//         processQueue.push(item)
//       })
//       .then(() => {
//         io.emit('processQueue', {
//           message: 'new task added to processing queue',
//           status: 'start',
//           taskType: 'enqueue',
//           metadata: { taskID: item[0] }
//         })
//       })
//       .finally(() => {
//         exec()
//       })
//   }

//   const _TIP_Dequeue = async (id: string) => {
//     return _Plock
//       .runExclusive(() => {
//         processQueue = processQueue.filter((task) => task[0] !== id)
//       })
//       .then(() => {
//         io.emit('processQueue', {
//           message: 'removed completed task from queue',
//           status: 'end',
//           taskType: 'dequeue',
//           metadata: { taskID: id }
//         })
//       })
//   }

//   const stop = async (id: string) => {
//     return _Plock
//       .runExclusive(async () => {
//         const process = processQueue.find((p) => p[0] === id)
//         if (!process) return null
//         return await process[2].abort()
//       })
//       .then(() => {
//         io.emit('processQueue', {
//           message: 'cancelled',
//           status: 'stopped',
//           taskType: 'stop',
//           metadata: { taskID: id }
//         })
//       })
//       .finally(() => {
//         exec()
//       })
//   }

//   const setMaxWorkers = (n: number) => {
//     if (n > maxWorkers) {
//       for (let i = maxWorkers; i < n; i++) {
//         exec()
//       }
//     }
//     maxWorkers = n
//   }

//   const exec = async () => {
//     try {
//       await exec_lock.acquire()
//       if (processQueue.length >= maxWorkers) return
//       const task = await dequeue()
//       if (!task) return

//       const taskIOArgs = {
//         taskGroup: task.taskGroup,
//         taskID: task.id,
//         metadata: task.metadata
//       }

//       const tsk = new AbortablePromise((resolve, reject, signal) => {
//         io.emit('processQueue', {
//           message: `starting ${task.id} processing`,
//           taskType: 'processing',
//           metadata: { taskID: task.id }
//         })
//         signal.onabort = reject
//         task
//           .action()
//           .then((r) => {
//             resolve(r)
//           })
//           .catch((err) => {
//             reject(err)
//           })
//       })
//         .then(async (r) => {
//           console.log('in tq then')
//           console.log(r)
//           io.emit(task.taskGroup, { ...taskIOArgs, ok: true, metadata: r })
//         })
//         .catch(async (err) => {
//           console.log('in tq err')
//           console.log(err)
//           io.emit(task.taskGroup, { ...taskIOArgs, ok: false, message: err.message })
//         })
//         .finally(() => {
//           _TIP_Dequeue(task.id)
//           exec()
//         }) as AbortablePromise<unknown>

//       _TIP_Enqueue([task.id, task.args, tsk, task])
//     } finally {
//       exec_lock.release()
//     }
//   }

//   function init() {
//     maxWorkers = Math.round(cpus().length / 2)
//   }

//   return {
//     enqueue,
//     remove,
//     stop,
//     init,
//     setMaxWorkers,
//     maxWorkers: () => maxWorkers,
//     queues: () => ({ taskQueue, processQueue }),
//     tasksInProcess: () => processQueue
//   }
// }

// export let taskQueue: ReturnType<typeof TaskQueue>

// export const initTaskQueue = () => {
//   taskQueue = TaskQueue()
//   taskQueue.init()
//   return taskQueue
// }
