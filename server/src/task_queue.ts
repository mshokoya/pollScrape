import { Server as IO, Socket } from 'socket.io';
import workerpool, { Pool } from 'workerpool';
import mutex from 'mutexify';
import {cpus} from 'os';
import { Mutex } from 'async-mutex'

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
  // const _Qlock = mutex();
  // const _Plock = mutex();
  const _Qlock = new Mutex();
  const _Plock = new Mutex();
  const exec_lock = new Mutex();
  let maxWorkers: number;
  const queue: QueueItem[] = [];
  const TIP: TIP_Item[] = []
  let pool: Pool;

  const enqueue = async (item: QueueItem) => {
    return _Qlock.runExclusive(() => {
      queue.push(item)
    }).finally(() => {
      exec()
    })
  }

  const dequeue = async (): Promise<QueueItem<Record<string, any> | undefined> | undefined> => {
    return _Qlock.runExclusive(() => {
      return queue.shift();
    })
  }

  const remove = async (id: string) => {
    return _Qlock.runExclusive(() => {
      const taskIdx = queue.findIndex(task => task.id === id);
      if (taskIdx === -1) return null
      return queue.splice(taskIdx, 1)[0]
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
      const taskIdx = TIP.findIndex(task => task[0] === id);
      if (taskIdx < 0) null;
      return TIP.splice(taskIdx, 1)[0]
    })
  }

  const stop = async(id: string) => {
    return _Plock.runExclusive(async () => {
      const process = TIP.find(p => p[0] === id)
      if (!process) return null;
      return await process[2]
        .cancel()
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
      if (pool.stats().activeTasks >= maxWorkers) return;
      const task = await dequeue();
      if (!task) return;
      const tsk = pool.exec(task.action, [task.args])
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
    pool = workerpool.pool({
      onCreateWorker() {
        console.log('event create')
        exec()
        return {}
      },
      onTerminateWorker() { 
        console.log('event terminate')
        exec() 
      },
      // maxWorkers: cpus().length
      maxWorkers: 5,
      maxQueueSize: 0
    });
    // maxWorkers = cpus().length
    maxWorkers = 2
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
    tasksInProcess: () => TIP,
    c: () => {
      console.log('TIP')
      console.log(TIP)
      console.log('queue')
      console.log(queue)
    }
  }
}

export let taskQueue: ReturnType<typeof TaskQueue>;

export const initTaskQueue = (io: IO) => {
  taskQueue = TaskQueue(io)
  taskQueue.init()
  return taskQueue
}