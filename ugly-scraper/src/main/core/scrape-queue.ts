import { Mutex } from 'async-mutex'
import { generateID } from './util'
import { io } from './websockets'
import { ScrapeQueueEvent, SProcessQueueItem, SQueueItem } from '../../shared'
import { QUEUE_CHANNELS as QC } from '../../shared/util'
import { actions } from './actions'
import EventEmitter from 'events'

const ScrapeQueue = () => {
  const _Qlock = new Mutex()
  const _Plock = new Mutex()
  const exec_lock = new Mutex()
  let maxProcess: number = 20
  const scrapeQueue: SQueueItem[] = []
  let processQueue: SProcessQueueItem[] = []
  const taskEndEvent = new EventEmitter()

  const move = async <T>(task: SQueueItem<T>) => {
    return _Qlock
      .runExclusive(() => {
        scrapeQueue.push({
          pid: task.pid,
          taskID: task.taskID,
          action: task.action,
          taskType: task.taskType,
          taskGroup: task.taskGroup,
          args: { ...task.args, taskID: task.taskID },
          metadata: { ...task.metadata, taskID: task.taskID }
        })
      })
      .then(() => {
        io.emit(QC.scrapeQueue, {
          pid: task.pid,
          taskID: task.taskID,
          taskType: 'move'
        })
      })
  }

  const enqueue = async <T>({
    pid,
    action,
    args,
    taskGroup,
    taskType,
    metadata
  }: Omit<SQueueItem<T>, 'taskID'>) => {
    const taskID = generateID()
    return _Qlock
      .runExclusive(() => {
        scrapeQueue.push({
          pid,
          taskID,
          taskType,
          action,
          taskGroup,
          args: { ...args, taskID },
          metadata: { ...metadata, taskID }
        })
      })
      .then(() => {
        io.emit<ScrapeQueueEvent>(QC.scrapeQueue, {
          pid,
          taskID,
          taskGroup,
          taskType: 'enqueue',
          message: 'new task added to queue',
          metadata: { ...metadata, taskID } as ScrapeQueueEvent['metadata']
        })
      })
      .finally(() => {
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
          taskType: 'dequeue',
          metadata: t.metadata as ScrapeQueueEvent['metadata']
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
          metadata: item.task.metadata as ScrapeQueueEvent['metadata']
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
          taskType: 'dequeue',
          metadata: t.metadata as ScrapeQueueEvent['metadata']
        })
        taskEndEvent.emit('end')
      })
  }

  const exec = async () => {
    try {
      await exec_lock.acquire()
      if (processQueue.length >= maxProcess) return
      const task = await dequeue()
      if (!task) return

      const abortController = new AbortController()

      const process = new Promise((resolve, reject) => {
        io.emit<ScrapeQueueEvent>(QC.scrapeProcessQueue, {
          pid: task.pid,
          taskID: task.taskID,
          taskGroup: task.taskGroup,
          message: `starting ${task.taskID} processing`,
          taskType: 'processing',
          metadata: task.metadata as ScrapeQueueEvent['metadata']
        })
        abortController.signal.addEventListener('abort', () => reject('task aborted'))
        actions[task.action](task.args)
          .then((r) => {
            resolve(r)
          })
          .catch((err) => {
            reject(err)
          })
      })
        .then((r: Record<string, any>) => {
          io.emit<ScrapeQueueEvent>(task.taskGroup, {
            pid: task.pid,
            taskID: task.taskID,
            taskGroup: task.taskGroup,
            taskType: 'end',
            ok: true,
            metadata: {
              ...task.metadata,
              metadata: {
                ...task.metadata.metadata,
                ...r
              }
            } as ScrapeQueueEvent['metadata']
          })
          p_dequeue(task.taskID)
        })
        .catch((err) => {
          if (abortController.signal.aborted) {
            // io.emit('abort', {})
            return
          }

          io.emit<ScrapeQueueEvent>(task.taskGroup, {
            pid: task.pid,
            taskID: task.taskID,
            taskGroup: task.taskGroup,
            taskType: 'end',
            ok: false,
            message: err.message
          })
          p_dequeue(task.taskID)
        })
        .finally(() => {
          exec()
        })

      p_enqueue({ task, process, abortController })
    } finally {
      exec_lock.release()
    }
  }

  const setMaxProcesses = (n: number) => {
    maxProcess = n
  }

  const stopForce = () => {
    maxProcess = -1
    for (const task of processQueue) {
      task.abortController.abort()
    }

    taskEndEvent.on('end', () => {
      if (!processQueue.length) {
        io.emit('end', {
          scrapeQueue,
          processQueue: processQueue.map((p) => p.task),
          forkID: global.forkID
        })
      }
    })
  }

  const stopWaitForAll = () => {
    taskEndEvent.on('end', () => {
      if (!processQueue.length && !scrapeQueue.length) {
        io.emit('end', {
          forkID: global.forkID
        })
      }
    })
  }

  const stopWaitForProcess = () => {
    maxProcess = -1
    taskEndEvent.on('end', () => {
      if (!processQueue.length) {
        io.emit('end', {
          scrapeQueue,
          // processQueue,
          forkID: global.forkID
        })
      }
    })
  }

  return {
    setMaxProcesses,
    enqueue,
    move,
    stopWaitForProcess,
    stopWaitForAll,
    stopForce
  }
}

export let scrapeQueue: ReturnType<typeof ScrapeQueue>

export const initScrapeQueue = () => {
  scrapeQueue = ScrapeQueue()
  return scrapeQueue
}
