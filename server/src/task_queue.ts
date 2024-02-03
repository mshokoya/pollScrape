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
  let c = 0

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
        if (taskIdx < 0) rej();
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
    new Promise((res) => {
      exec_lock((r) => {
        c++
        res(r())
      })
      
    })
    .then(async () => {
      console.log(c)
      if (
        pool.stats().activeTasks >= maxWorkers ||
        c + TIP.length > maxWorkers
      ) return;
      const task = await dequeue();
      if (!task) return;
  
      const tsk = pool.exec(task.action, [task.args])
        .then(async () => {
          // io.emit('task-complete', task.id)
          console.log('then')
          console.log(task.id)
          await _TIP_Dequeue(task.id)
          console.log('pp')
          exec()
          
        })
        .catch(async (e) => {
          console.log(e)
          console.log('end')
          console.log(task.id)
          // io.emit('task-failed', task.id)
          await _TIP_Dequeue(task.id)
          console.log('ee')
          exec()
        })
  
        await _TIP_Enqueue([task.id, task.args, tsk])
        exec();
    })
    .finally(() => {c--})
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
    maxWorkers = 1
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
      console.log(_Qlock.locked)
      console.log(_Plock.locked)
      console.log(exec_lock.locked)
    }
  }
}

export let taskQueue: ReturnType<typeof TaskQueue>;

export const initTaskQueue = (io: IO) => {
  taskQueue = TaskQueue(io)
  taskQueue.init()
  return taskQueue
}