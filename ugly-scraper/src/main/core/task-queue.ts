import { cpus } from 'os'
import { Mutex } from 'async-mutex'
import { generateID } from './util'
import { EmitResponse, io } from './websockets'
import {
  ForkScrapeEvent,
  ForkScrapeEventArgs,
  Forks,
  ScrapeQueueEvent,
  TaskQueueEvent
} from '../../shared'
import { MessageChannelMain, utilityProcess } from 'electron/main'
import path from 'node:path/posix'
import { P2cBalancer } from 'load-balancers'
// import { Piscina } from 'piscina';
// import path from 'path'

// const piscina = new Piscina({
//   filename: path.resolve(__dirname, 'worker.js')
// });

type QueueItem = {
  taskID: string
  taskGroup: string
  taskType: string
  message: string
  metadata: Record<string, string | number> & { taskID: string }
  action: () => Promise<any>
  args?: Record<string, any>
}

type ProcessQueueItem = {
  task: QueueItem
  process: Promise<void>
  type: 'fork' | 'main'
  processes: { forkID: string; taskID: string; status: 'taskQueue' | 'processQueue' }[]
}

// type TIP_Item = [
//   id: string,
//   args: Record<string, any> | undefined,
//   AbortablePromise<unknown>,
//   QueueItem
// ]

const TaskQueue = () => {
  const _Qlock = new Mutex()
  const _Plock = new Mutex()
  const exec_lock = new Mutex()
  const taskQueue: QueueItem[] = []
  let processQueue: ProcessQueueItem[] = []
  let useFork = true
  const maxForks = cpus().length
  const forks: Forks = {}
  let forkKeys: string[]
  let lb: P2cBalancer
  const EXEC_FORK = 'ex-fk'

  const enqueue = async <T = Record<string, any>>({
    taskID = generateID(),
    taskGroup,
    taskType,
    message,
    metadata,
    action,
    args
  }: QueueItem) => {
    return _Qlock
      .runExclusive(() => {
        // @ts-ignore
        taskQueue.push({ pid, taskID, action, args, taskGroup, taskType, message, metadata })
      })
      .then(() => {
        io.emit<TaskQueueEvent>('taskQueue', {
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
        io.emit<TaskQueueEvent>('taskQueue', {
          taskID: t.taskID,
          message: 'moving from queue to processing',
          status: 'passing',
          taskType: 'dequeue',
          metadata: {
            taskID: t.taskID,
            taskGroup: t.taskGroup,
            taskType: t.taskType,
            metadata: t.metadata
          }
        })
        return t
      })
  }

  const remove = async (taskID: string) => {
    return _Qlock
      .runExclusive(() => {
        taskQueue.filter((task) => task.taskID !== taskID)
      })
      .then(() => {
        io.emit<TaskQueueEvent>('taskQueue', {
          taskID,
          message: 'deleting task from queue',
          status: 'removed',
          taskType: 'remove',
          metadata: { taskID }
        })
      })
  }

  const p_enqueue = async (item: ProcessQueueItem) => {
    return _Plock
      .runExclusive(() => {
        processQueue.push(item)
      })
      .then(() => {
        io.emit<TaskQueueEvent>('processQueue', {
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
        io.emit<TaskQueueEvent>('processQueue', {
          taskID: id,
          message: 'removed completed task from queue',
          status: 'end',
          taskType: 'dequeue',
          metadata: { taskID: id }
        })
      })
  }

  const stop = async (taskID: string) => {
    return _Plock
      .runExclusive(async () => {
        const process = processQueue.find((p) => p[0] === taskID)
        if (!process) return null
        return await process[2].abort()
      })
      .then(() => {
        io.emit<TaskQueueEvent>('processQueue', {
          taskID,
          message: 'cancelled',
          status: 'stopped',
          taskType: 'stop',
          metadata: { taskID }
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
        taskGroup: task.taskGroup,
        taskID: task.taskID,
        metadata: task.metadata,
        taskType: 'end'
      }

      const tsk = new Promise((resolve, reject) => {
        io.emit<TaskQueueEvent>('processQueue', {
          taskID: task.taskID,
          message: `starting ${task.taskID} processing`,
          taskType: 'processing',
          metadata: { taskID: task.taskID }
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
        .then(async (r: any) => {
          if (r === EXEC_FORK) return
          io.emit<TaskQueueEvent>(task.taskGroup, {
            ...taskIOArgs,
            ok: true,
            metadata: { ...taskIOArgs.metadata, ...r }
          })
          p_dequeue(task.taskID)
        })
        .catch(async (err) => {
          if (err === EXEC_FORK) return
          io.emit<TaskQueueEvent>(task.taskGroup, {
            ...taskIOArgs,
            ok: false,
            message: err.message
          })
          p_dequeue(task.taskID)
        })
        .finally(() => {
          exec()
        })

      p_enqueue({ task, process: tsk, type: 'main', processes: [] })
    } finally {
      exec_lock.release()
    }
  }

  const setUseFork = (i: boolean) => {
    useFork = i
  }

  const execScrapeInFork = (task: ForkScrapeEventArgs) => {
    postToFork({
      taskType: 'scrape',
      meta: task
    })
    return EXEC_FORK
  }

  const postToFork = (arg: ForkScrapeEvent) => {
    const fork = randomFork()
    fork.fork.postMessage(arg, [fork.channel.forkPort])
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
    data: { channel: string; args: EmitResponse & { forkID: string } }
  }) => {
    if (evt.data.channel === 'taskQueue' && evt.data.args.taskType === 'enqueue') {
      // if scrape job in taskqueue in worker
      processQueue
        .find((t) => t.task.taskID === evt.data.args.pid)
        ?.processes.push({
          forkID: evt.data.args.forkID,
          taskID: evt.data.args.taskID,
          status: evt.data.channel
        })
      io.emit(evt.data.channel, evt.data.args)
      return
    } else if (evt.data.channel === 'processQueue' && evt.data.args.taskType === 'enqueue') {
      const process = processQueue
        .find((t) => t.task.taskID === evt.data.args.pid)
        ?.processes.find((p) => p.taskID === evt.data.args.taskID)
      if (process) process.status = evt.data.channel
      io.emit(evt.data.channel, evt.data.args)
      return
    } else if (evt.data.channel === 'processQueue' && evt.data.args.taskType === 'end') {
      io.emit<ScrapeQueueEvent>(evt.data.channel, evt.data.args as any)
      const processes = processQueue.find((t) => t.task.taskID === evt.data.args.pid)?.processes
        .length
      if (processes <= 1) io.emit<TaskQueueEvent>(evt.data.channel, evt.data.args as any)
      p_dequeue(evt.data.args.pid)
    } else {
      io.emit(evt.data.channel, evt.data.args)
    }
  }

  const randomFork = () => {
    const key = forkKeys[lb.pick() - 1]
    return forks[key]
  }

  function init() {
    for (let i = 0; i < maxForks; i++) {
      createProcess()
    }
  }

  return {
    execScrapeInFork,
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
