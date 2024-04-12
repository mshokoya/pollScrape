import { cpus } from 'os'
import { Mutex } from 'async-mutex'
import AbortablePromise from 'promise-abortable'
import { generateID } from './util'
import { EmitResponse, io } from './websockets'
import { ipcMain } from 'electron'
import { TaskEnqueue } from '../../shared'
import { MessageChannelMain, utilityProcess } from 'electron/main'
import path from 'node:path/posix'
// import { Piscina } from 'piscina';
// import path from 'path'

// const piscina = new Piscina({
//   filename: path.resolve(__dirname, 'worker.js')
// });

type QueueItem = {
  pid: string
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
  const taskQueue: QueueItem[] = []
  let processQueue: TIP_Item[] = []
  let useFork = true
  const maxForks = cpus().length
  const forks: Forks = {}
  let forkKeys: string[]
  let lb: P2cBalancer

  const enqueue = async <T = Record<string, any>>({
    taskID = generateID(),
    taskGroup,
    taskType,
    message,
    metadata,
    action,
    args
  }: {
    taskID: string
    taskGroup: string
    taskType: string
    message: string
    metadata?: Record<string, any>
    action: (a: T) => Promise<unknown>
    args?: T
  }) => {
    return _Qlock
      .runExclusive(() => {
        // @ts-ignore
        taskQueue.push({ pid, taskID, action, args, taskGroup, taskType, message, metadata })
      })
      .then(() => {
        io.emit<TaskEnqueue>('taskQueue', {
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

  const p_enqueue = async (item: TIP_Item) => {
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

  const p_dequeue = async (id: string) => {
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

  const exec = async () => {
    try {
      await exec_lock.acquire()
      if (processQueue.length >= maxWorkers) return
      const task = await dequeue()
      if (!task) return

      // taskType
      const taskIOArgs = {
        pid: task.pid,
        taskGroup: task.taskGroup,
        taskID: task.id,
        metadata: task.metadata
      }

      const tsk = new Promise((resolve, reject) => {
        io.emit('processQueue', {
          taskID: task.id,
          message: `starting ${task.id} processing`,
          taskType: 'processing',
          metadata: { taskID: task.id }
        })

        task
          .action()
          .then((r) => {
            resolve(r)
          })
          .catch((err) => {
            reject(err)
          })
      })
        .then(async (r: Record<string, any> | -1) => {
          if (r === -1) return
          io.emit(task.taskGroup, {
            ...taskIOArgs,
            ok: true,
            metadata: { ...taskIOArgs.metadata, ...r },
            evtType: 'completed'
          })
          p_dequeue(task.id)
        })
        .catch(async (err) => {
          if (err === -1) return
          io.emit(task.taskGroup, {
            ...taskIOArgs,
            ok: false,
            message: err.message,
            evtType: 'completed'
          })
          p_dequeue(task.id)
        })
        .finally(() => {
          exec()
        }) as AbortablePromise<unknown>

      p_enqueue([task.id, task.args, tsk, task])
    } finally {
      exec_lock.release()
    }
  }

  const setUseFork = (i: boolean) => {
    useFork = i
  }

  const execInFork = (task: {
    pid: string
    taskID?: string
    taskGroup: string
    taskType: string
    taskArgs: Record<string, any>
  }) => {
    const fork = randomFork()
    fork.fork.postMessage(task, [fork.channel.forkPort])
  }

  const createProcess = () => {
    const id = generateID()
    const { port1: mainPort, port2: forkPort } = new MessageChannelMain()
    const fork = utilityProcess.fork(path.join(__dirname))
    fork.postMessage({ message: 'ping', forkID: id }, [forkPort])
    mainPort.on('message', handleProcessResponse)
    mainPort.start()
    forks[id] = {
      fork,
      channel: { mainPort, forkPort },
      status: 'started',
      TIP: []
    }
  }

  const handleProcessResponse = (evt: {
    data: { channel: string; args: EmitResponse & { evtType: string } & { forkID: string } }
  }) => {
    console.log('TODO')
    console.log(evt.data)
  }

  const randomFork = () => {
    const key = forkKeys[lb.pick() - 1]
    return forks[key]
  }

  function init() {
    createProcess()
  }

  return {
    execInFork,
    useFork,
    setUseFork,
    enqueue,
    remove,
    stop,
    init,
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
