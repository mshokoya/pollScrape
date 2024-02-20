import { Server as IO, Socket } from 'socket.io';
// import workerpool, { Pool } from 'workerpool';
import {cpus} from 'os';
import { Mutex } from 'async-mutex'
import AbortablePromise from "promise-abortable";
import { generateID } from './helpers';



type QueueItem = {
  id: string,
  taskType: string,
  desc: string,
  metadata: Record<string, string | number>
  action: () => Promise<void>,
  args?: Record<string, any>
}

// TIP = TASK IN PROCESS
type TIP_Item = [id: string, args: Record<string, any> | undefined, AbortablePromise<unknown>] 

// https://dev.to/bleedingcode/increase-node-js-performance-with-libuv-thread-pool-5h10

// (FIX) remember to test TIP cancelation
// (FIX) REMEMBER BECAUSE SCRAPES ARE RUNNING IN PARALLEL, SOME DB RESOURCES NEED TO BE SAVED BEFORE USE
// E.G WHEN SELECTING USE ACCOUNT OR PROXY TO SCRAPE WITH
const TaskQueue = () => {
  const _Qlock = new Mutex();
  const _Plock = new Mutex();
  const exec_lock = new Mutex();
  let maxWorkers: number;
  let queue: QueueItem[] = [];
  let TIP: TIP_Item[] = []
  // let pool;

  const enqueue = async <T = Record<string, any> >(
    id = generateID(),
    taskType: string,
    desc: string,
    metadata: {},
    action: (a: T) => Promise<void>,
    args?: T
  ) => {
    return _Qlock.runExclusive(() => {
      // @ts-ignore
      queue.push({id, action, args, taskType, desc, metadata})
    }).finally(() => {
      exec()
    })
  }

  const dequeue = async (): Promise<QueueItem | undefined> => {
    return _Qlock.runExclusive(() => {
      return queue.shift();
    })
  }

  const remove = async (id: string) => {
    return _Qlock.runExclusive(() => {
      queue = queue.filter(task => task.id !== id);
    })
  }

  const _TIP_Enqueue = async (item: TIP_Item) => { 
    return _Plock.runExclusive(() => {
      TIP.push(item)
    }).finally(() => {
      exec()
    })
  }

  const _TIP_Dequeue = async (id: string) => { 
    return _Plock.runExclusive(() => {
      TIP = TIP.filter(task => task[0] !== id);
    })
  }

  const stop = async(id: string) => {
    return _Plock.runExclusive(async () => {
      const process = TIP.find(p => p[0] === id)
      if (!process) return null;
      return await process[2].abort()
    }).finally(() => {
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
      await exec_lock.acquire()
      if (TIP.length >= maxWorkers) return;
      const task = await dequeue();
      if (!task) return;

      // const tsk = pool.exec(task.action, [task.args || {}])

      const tsk = new AbortablePromise(async (resolve, reject, signal) => {
        signal.onabort = reject;
        await task.action()
      })
        .then(async () => {
          // io.emit('task-complete', task.id)
          _TIP_Dequeue(task.id)
          exec()
        })
        .catch(async (e) => {
          // io.emit('task-failed', task.id)
          _TIP_Dequeue(task.id)
          exec()
        })

        _TIP_Enqueue([task.id, task.args, tsk])
    } finally {
      
      exec_lock.release()
    }
  }

  function init() {
    maxWorkers = Math.round(cpus().length / 2)
  }

  return {
    enqueue,
    remove,
    stop,
    init,
    setMaxWorkers,
    maxWorkers: () => maxWorkers,
    workerStats: () => {},
    taskQueue: () => queue,
    tasksInProcess: () => TIP,
  }
}

export let taskQueue: ReturnType<typeof TaskQueue>;

export const initTaskQueue = (io: IO) => {
  taskQueue = TaskQueue(io)
  taskQueue.init()
  return taskQueue
}