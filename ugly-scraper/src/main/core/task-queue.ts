import { cpus } from 'os'
import { Mutex } from 'async-mutex'
import { generateID } from './util'
import { EmitResponse, io } from './websockets'
import { ForkScrapeEvent, ForkScrapeEventArgs, Forks, TaskQueueEvent } from '../../shared'
import path from 'node:path/posix'
import { P2cBalancer } from 'load-balancers'
import { QUEUE_CHANNELS as QC } from '../../shared/util'
import { fork } from 'node:child_process'

type QueueItem<T = Record<string, any>> = {
  taskID: string
  useFork: boolean
  taskGroup: string
  taskType: string
  message: string
  metadata: Record<string, string | number>
  action: (args: T) => Promise<any>
  args?: T
}

type STQ = 'stq' | 'spq'

type ProcessQueueItem = {
  task: QueueItem
  process: Promise<void>
  type: 'fork' | 'main'
  processes: { forkID: string; taskID: string; status: STQ }[]
}

const TaskQueue = () => {
  const _Qlock = new Mutex()
  const _Plock = new Mutex()
  const exec_lock = new Mutex()
  let taskQueue: QueueItem[] = []
  let processQueue: ProcessQueueItem[] = []
  let useFork = false
  let maxProcesses = 10
  const maxForks = cpus().length
  const forks: Forks = {}
  let forkKeys: string[]
  let lb: P2cBalancer
  const EXEC_FORK = 'ex-fk'

  const enqueue = async <T = Record<string, any>>({
    taskID = generateID(),
    taskGroup,
    taskType,
    useFork,
    message,
    metadata,
    action,
    args
  }: QueueItem<T>) => {
    return _Qlock
      .runExclusive(() => {
        // @ts-ignore
        taskQueue.push({ useFork, taskID, action, args, taskGroup, taskType, message, metadata })
      })
      .then(() => {
        io.emit<TaskQueueEvent>(QC.taskQueue, {
          taskID,
          useFork,
          message: 'new task added to queue',
          taskType: 'enqueue',
          metadata: { taskID, taskGroup, taskType, metadata }
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
        io.emit<TaskQueueEvent>(QC.taskQueue, {
          taskID: t.taskID,
          useFork: t.useFork,
          message: 'moving from queue to processing',
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
        const task = taskQueue.find((t) => t.taskID === taskID)
        taskQueue = taskQueue.filter((t) => t.taskID !== taskID)
        return task
      })
      .then((t) => {
        io.emit<TaskQueueEvent>(QC.taskQueue, {
          taskID,
          message: 'deleting task from queue',
          taskType: 'remove',
          useFork: t.useFork,
          metadata: {
            taskID: t.taskID,
            taskGroup: t.taskGroup,
            taskType: t.taskType,
            metadata: t.metadata
          }
        })
      })
  }

  const p_enqueue = async (item: ProcessQueueItem) => {
    return _Plock
      .runExclusive(() => {
        processQueue.push(item)
      })
      .then(() => {
        io.emit<TaskQueueEvent>(QC.processQueue, {
          taskID: item.task.taskID,
          message: 'new task added to processing queue',
          taskType: 'enqueue',
          useFork: item.task.useFork,
          metadata: {
            taskID: item.task.taskID,
            taskGroup: item.task.taskGroup,
            taskType: item.task.taskType,
            metadata: item.task.metadata
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
        return task
      })
      .then((t) => {
        io.emit<TaskQueueEvent>(QC.processQueue, {
          taskID: t.task.taskID,
          message: 'removed completed task from queue',
          taskType: 'dequeue',
          useFork: t.task.useFork,
          metadata: {
            taskID: t.task.taskID,
            taskGroup: t.task.taskGroup,
            taskType: t.task.taskType,
            metadata: t.task.metadata
          }
        })
      })
  }

  // (FIX) make abortable
  const stop = async (taskID: string) => {
    return _Plock
      .runExclusive(async () => {
        const task = processQueue.find((t) => t.task.taskID === taskID)
        processQueue = processQueue.filter((t) => t.task.taskID !== taskID)
        return task
      })
      .then((t) => {
        io.emit<TaskQueueEvent>(QC.processQueue, {
          taskID,
          message: 'cancelled',
          taskType: 'stop',
          useFork: t.task.useFork,
          metadata: {
            taskID: t.task.taskID,
            taskGroup: t.task.taskGroup,
            taskType: t.task.taskType,
            metadata: t.task.metadata
          }
        })
      })
      .finally(() => {
        exec()
      })
  }

  const exec = async () => {
    try {
      await exec_lock.acquire()
      if (processQueue.length >= maxProcesses) return
      const task = await dequeue()
      if (!task) return

      // taskType
      const taskIOEmitArgs = {
        taskID: task.taskID,
        useFork: task.useFork,
        taskType: 'end',
        metadata: {
          taskID: task.taskID,
          taskGroup: task.taskGroup,
          taskType: task.taskType,
          metadata: { ...task.metadata }
        }
      }

      const tsk = new Promise((resolve, reject) => {
        io.emit<TaskQueueEvent>(QC.processQueue, {
          taskID: task.taskID,
          message: `starting ${task.taskID} processing`,
          taskType: 'processing',
          useFork: task.useFork,
          metadata: {
            taskID: task.taskID,
            taskGroup: task.taskGroup,
            taskType: task.taskType
          }
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
        .then(async (r: any) => {
          if (r === EXEC_FORK) return
          // console.log({ ...task, ...r, ok: true })
          io.emit<TaskQueueEvent>(task.taskGroup, {
            ...taskIOEmitArgs,
            ok: true,
            metadata: {
              ...taskIOEmitArgs.metadata,
              metadata: { ...task.metadata, ...r }
            }
          })
          p_dequeue(task.taskID)
        })
        .catch(async (err) => {
          if (err === EXEC_FORK) return
          // console.log({ ...task, message: err.message, ok: false })
          io.emit<TaskQueueEvent>(task.taskGroup, {
            ...taskIOEmitArgs,
            ok: false,
            message: err.message,
            metadata: taskIOEmitArgs.metadata
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

  const execInFork = (task: ForkScrapeEventArgs) => {
    // @ts-ignore
    task.useFork = true
    postToFork({
      taskType: 'scrape',
      meta: task
    })
    return EXEC_FORK
  }

  const postToFork = (arg: ForkScrapeEvent) => {
    const fork = randomFork()
    fork.fork.send(arg)
  }

  const createProcess = () => {
    const id = generateID()

    const f = fork(`${path.join(__dirname)}/core.js`)
    f.send({ taskType: 'init' })
    f.on('message', handleProcessResponse)
    forks[id] = {
      fork: f,
      TIP: []
    }
  }

  const handleProcessResponse = (evt: {
    channel: string
    args: EmitResponse & { forkID: string }
  }) => {
    if (evt.channel === QC.scrapeQueue && evt.args.taskType === 'enqueue') {
      // if scrape job in taskqueue in worker
      processQueue
        .find((t) => t.task.taskID === evt.args.pid)
        ?.processes.push({
          forkID: evt.args.forkID,
          taskID: evt.args.taskID,
          status: evt.channel as STQ
        })
    } else if (evt.channel === QC.scrapeProcessQueue && evt.args.taskType === 'enqueue') {
      const process = processQueue
        .find((t) => t.task.taskID === evt.args.pid)
        ?.processes.find((p) => p.taskID === evt.args.taskID)
      if (process) process.status = evt.channel as STQ
    } else if (evt.channel === QC.scrapeProcessQueue && evt.args.taskType === 'dequeue') {
      console.log('IN THE IF')
      const process = processQueue.find((t) => t.task.taskID === evt.args.pid)
      if (process.processes.length <= 1) {
        p_dequeue(evt.args.pid)
      } else {
        process.processes = process.processes.filter((p) => p.taskID !== evt.args.taskID)
      }
    }

    // if ()
    io.emit(evt.channel, evt.args)
  }

  const randomFork = () => {
    const key = forkKeys[lb.pick()]
    return forks[key]
  }

  const setMaxProcesses = (n: number) => {
    maxProcesses = n
  }

  function init() {
    // for (let i = 0; i < maxForks; i++) {
    //   createProcess()
    // }
    // forkKeys = Object.keys(forks)
    // lb = new P2cBalancer(forkKeys.length)
  }

  return {
    setMaxProcesses,
    execInFork,
    useFork,
    setUseFork,
    enqueue,
    remove,
    stop,
    init,
    EXEC_FORK,
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
