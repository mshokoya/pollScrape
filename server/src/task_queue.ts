import { Server as IO, Socket } from 'socket.io';
import workerpool, { Pool } from 'workerpool';
import mutex from 'mutexify';
import {cpus} from 'os';

type QueueItem<T = Record<string, any> | undefined> = {
  id: string, 
  action: (a:T) => any,
  args?: T
}

type TIP_Item = [id: string, args: Record<string, any> | undefined, workerpool.Promise<unknown>] 

// https://dev.to/bleedingcode/increase-node-js-performance-with-libuv-thread-pool-5h10


// (FIX) REMEMBER BECAUSE SCRAPES ARE RUNNING IN PARALLEL, SOME DB RESOURCES NEED TO BE SAVED BEFORE USE
// E.G WHEN SELECTING USE ACCOUNT OR PROXY TO SCRAPE WITH
const TaskQueue = (io: IO) => {
  const _Qlock = mutex();
  const _Plock = mutex();
  const exec_lock = mutex();
  let maxWorkers: number;
  const queue: QueueItem[] = [];
  const TIP: TIP_Item[] = []
  let pool: Pool;

  const enqueue = async (item: QueueItem) => { 
    new Promise((res) => {
      _Qlock((r) => {
        queue.push(item)
        r()
        res(null)
      })
    })
    .then(() => {
      exec()
    })
  }

  const dequeue = async (): Promise<QueueItem<Record<string, any> | undefined> | undefined> => { 
    return new Promise((res) => {
      _Qlock((r) => {
        const val = queue.shift();
        r();
        res(val);
      })
    })
  }

  const remove = async (id: string) => {
    return new Promise((res, rej) => {
      _Qlock((r) => {
        const taskIdx = queue.findIndex(task => task.id === id);
        if (taskIdx === -1) rej('queue is empty');
        const tsk = queue.splice(taskIdx, 0)
        r();
        res(tsk);
      })
    })
  }

  const _TIP_Enqueue = async (item: TIP_Item) => { 
    return new Promise((res) => {
      _Plock((r) => {
        TIP.push(item)
        r()
        res(null)
      })
    })
    .then(() => {
      exec()
    })
  }

  const _TIP_Dequeue = async (id: string) => { 
    return new Promise((res, rej) => {
      _Plock((r) => {
        const taskIdx = TIP.findIndex(task => task[0] === id);
        if (taskIdx < 0) {
          r()
          rej();
        }
        const tsk = TIP.splice(taskIdx, 0)
        r()
        res(tsk)
      })
    })
  }

  const stop = async(id: string) => {
    return new Promise((res, rej) => {
      _Plock(async (r) => {
        const process = TIP.find(p => p[0] === id)
        if (!process) return rej();
        process[2]
          .cancel()
          .then(() => { res(null) })
          .catch(() => { rej() })

      })
    })
    .then(() => {
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
    if (pool.stats().activeTasks >= maxWorkers) return;
    const task = await dequeue();
    if (!task) return;

    const tsk = pool.exec(task.action, [task.args])
      .then(async () => {
        // io.emit('task-complete', task.id)
        await _TIP_Dequeue(task.id)
        exec()
      })
      .catch(async (e) => {
        // io.emit('task-failed', task.id)
        await _TIP_Dequeue(task.id)
        exec()
      })

      _TIP_Enqueue([task.id, task.args, tsk])
      exec();
  }

  function init() {
    pool = workerpool.pool({
      maxWorkers: cpus().length
    });
    maxWorkers = cpus().length
  }

  return {
    enqueue,
    remove,
    stop,
    init,
    setMaxWorkers,
    maxWorkers: () => maxWorkers,
    workerStats: () => pool.stats(),
    taskQueue: () => queue,
    tasksInProcess: () => TIP
  }
}

export let taskQueue: ReturnType<typeof TaskQueue>;

export const initTaskQueue = (io: IO) => {
  taskQueue = TaskQueue(io)
  taskQueue.init()
  return taskQueue
}