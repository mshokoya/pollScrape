import { cpus } from 'os'
import { Mutex } from 'async-mutex'
import { generateID } from './util'
import { EmitResponse, io } from './websockets'
import {
  ForkScrapeEvent,
  ForkScrapeEventArgs,
  Forks,
  SQueueItem,
  StopType,
  TaskQueueEvent,
  Timeout
} from '../../shared'
import path from 'node:path/posix'
import { P2cBalancer } from 'load-balancers'
import { QUEUE_CHANNELS as QC } from '../../shared/util'
import { fork } from 'node:child_process'
import { actions } from './actions'

type QueueItem = {
  taskID: string
  useFork: boolean
  taskGroup: string
  taskType: string
  message: string
  timeout?: Timeout
  metadata: Record<string, string | number>
  action: (signal: AbortSignal) => Promise<any>
}

type STQ = 'stq' | 'spq'

type ProcessQueueItem = {
  task: QueueItem
  process: Promise<void>
  type: 'fork' | 'main'
  processes: { forkID: string; taskID: string; status: STQ }[]
  abortController: AbortController
}

const TaskQueue = () => {
  const _Qlock = new Mutex()
  const _Plock = new Mutex()
  const _Tlock = new Mutex()
  const exec_lock = new Mutex()
  let taskQueue: QueueItem[] = []
  let processQueue: ProcessQueueItem[] = []
  let timeoutQueue: QueueItem[] = []
  let useFork = false
  let maxProcesses = 10
  const maxForks = cpus().length
  const forks: Forks = {}
  let lb: P2cBalancer
  const EXEC_FORK = 'ex-fk'

  const enqueue = async ({
    taskID = generateID(),
    taskGroup,
    taskType,
    useFork,
    message,
    metadata,
    action,
    timeout
  }: QueueItem) => {
    return _Qlock
      .runExclusive(() => {
        // @ts-ignore
        taskQueue.push({ useFork, taskID, action, taskGroup, taskType, message, metadata, timeout })
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

  const move = async (task: SQueueItem) => {
    return _Qlock
      .runExclusive(() => {
        // @ts-ignore
        taskQueue.push(task)
      })
      .then(() => {
        io.emit<TaskQueueEvent>(QC.taskQueue, {
          taskID: task.taskID,
          useFork,
          message: 'new task added to queue',
          taskType: 'move',
          metadata: {
            // forkID: task.forkID,
            taskID: task.taskID,
            taskGroup: task.taskGroup,
            taskType: task.taskType,
            metadata: task.metadata
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
        // const task = JSON.parse(JSON.stringify(processQueue.find((t) => t.task.taskID === taskID)))
        const task = processQueue.find((t) => t.task.taskID === taskID)
        processQueue = processQueue.filter((t) => t.task.taskID !== taskID)

        if (task.task.timeout) {
          task.task.timeout.rounds -= 1
          task.task.timeout.rounds ? t_enqueue(task.task) : t_dequeue(taskID)
        }

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

  const t_enqueue = async (task: QueueItem) => {
    return _Tlock
      .runExclusive(() => {
        const to = setTimeout(() => {
          const taskID = task.taskID
          _Tlock.runExclusive(() => {
            timeoutQueue = timeoutQueue.filter((to) => to.taskID === taskID)
            enqueue(task)
          })
        }, task.timeout.time)
        task.timeout._TO = to
        timeoutQueue.push(task)
      })
      .then(() => {
        io.emit<TaskQueueEvent>(QC.timeoutQueue, {
          taskID: task.taskID,
          message: 'task added to timeout',
          taskType: 'enqueue',
          useFork: task.useFork,
          metadata: {
            taskID: task.taskID,
            taskGroup: task.taskGroup,
            taskType: task.taskType,
            metadata: task.metadata
          }
        })
      })
      .finally(() => {
        exec()
      })
  }

  const t_dequeue = async (taskID: string) => {
    return _Tlock
      .runExclusive(() => {
        const task = timeoutQueue.find((t) => t.taskID === taskID)
        timeoutQueue = timeoutQueue.filter((t) => t.taskID !== taskID)
        return task
      })
      .then((t) => {
        io.emit<TaskQueueEvent>(QC.timeoutQueue, {
          taskID: t.taskID,
          message: 'remove task from timeout queue',
          taskType: 'dequeue',
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

      const abortController = new AbortController()

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
          .action(abortController.signal)
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

      p_enqueue({ task, process: tsk, type: 'main', processes: [], abortController })
    } finally {
      exec_lock.release()
    }
  }

  const stopForks = (forkIDs: string[], stopType: StopType) => {
    for (const forkID of forkIDs) {
      forks[forkID].stopType = stopType
      forks[forkID].fork.send({
        taskType: 'stop',
        stopType
      })
    }
    initForkLoadBalancer()
  }

  const setUseFork = (i: boolean) => {
    useFork = i
  }

  const execInFork = (task: ForkScrapeEventArgs, taskType?: 'scrape' | 'move') => {
    // @ts-ignore
    task.useFork = true
    postToFork({
      taskType: taskType || 'scrape',
      meta: task
    })
    return EXEC_FORK
  }

  const postToFork = (arg: ForkScrapeEvent) => {
    const fork = randomFork()
    fork.fork.send(arg)
  }

  const createFork = async () => {
    if (Object.keys(forks).length === maxForks) {
      io.emit('fork', { taskType: 'status', ok: false })
      return
    }
    const id = generateID()

    const f = fork(`${path.join(__dirname)}/core.js`, null, { silent: true, stdio: 'ignore' })
    f.send({ taskType: 'init', forkID: id, cacheHTTPPort: global.cacheHTTPPort })
    f.on('message', handleForkEvent)
    f.on('exit', () => {
      io.emit('fork', {
        taskType: 'dead',
        forkID: id
      })
      delete forks[id]
    })
    forks[id] = {
      fork: f,
      TIP: []
    }
    initForkLoadBalancer()
  }

  const moveTasks = (tasks: SQueueItem[]) => {
    tasks.forEach((task) => {
      if (useFork && Object.keys(forks).length) {
        // @ts-ignore
        execInFork(task, 'move')
      } else {
        // @ts-ignore
        move({ ...task, action: actions[task.action] })
      }
    })
  }

  const handleForkEvent = (evt: { channel: string; args: EmitResponse & { forkID: string } }) => {
    if (evt.channel === QC.scrapeQueue && evt.args.taskType === 'enqueue') {
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
      const process = processQueue.find((t) => t.task.taskID === evt.args.pid)
      if (process.processes.length <= 1) {
        p_dequeue(evt.args.pid)
      } else {
        process.processes = process.processes.filter((p) => p.taskID !== evt.args.taskID)
      }
    } else if (evt.channel === 'fork') {
      if (evt.args.taskType === 'force') {
        // @ts-ignore
        evt.args.processQueue && moveTasks(evt.args.processQueue)
        // @ts-ignore
        evt.args.scrapeQueue && moveTasks(evt.args.scrapeQueue)
        forks[evt.args.forkID].fork.kill()
      } else if (evt.args.taskType === 'waitPs') {
        // @ts-ignore
        moveTasks(evt.args.scrapeQueue)
        forks[evt.args.forkID].fork.kill()
      } else if (evt.args.taskType === 'waitAll') {
        forks[evt.args.forkID].fork.kill()
      }
    }

    io.emit(evt.channel, evt.args)
  }

  const randomFork = () => {
    const key = Object.keys(forks).filter((forkID) => !forks[forkID].stopType)[lb.pick()]
    return forks[key]
  }

  const setMaxProcesses = (forkID: string, n: number) => {
    maxProcesses = n
  }

  const initForkLoadBalancer = () => {
    const length = Object.keys(forks).filter((forkID) => !forks[forkID].stopType).length
    length ? setUseFork(true) : setUseFork(false)
    lb = new P2cBalancer(length)
  }

  function init() {
    createFork().then(() => initForkLoadBalancer())
  }

  return {
    setMaxProcesses,
    execInFork,
    useFork: () => useFork,
    enqueue,
    remove,
    stop,
    init,
    EXEC_FORK,
    queues: () => ({
      taskQueue: JSON.parse(JSON.stringify(taskQueue)),
      processQueue: JSON.parse(JSON.stringify(processQueue)),
      timeoutQueue: JSON.parse(
        JSON.stringify(timeoutQueue.map((t) => ({ ...t, timeout: { ...t.timeout, _TO: null } })))
      )
    }),
    forks: () => Object.keys(forks).map((forkID) => ({ forkID, TIP: forks[forkID].TIP })),
    stopForks,
    createFork,
    maxForks
  }
}

export let taskQueue: ReturnType<typeof TaskQueue>

export const initTaskQueue = () => {
  taskQueue = TaskQueue()
  taskQueue.init()
  return taskQueue
}
