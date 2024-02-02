import { Socket } from 'socket.io';
import workerpool, { Pool } from 'workerpool';
import mutex from 'mutexify';
import {cpus} from 'os';

type QueueItem<T = Record<string, any> | undefined> = {
  id: string, 
  action: (a:T) => any,
  args?: T
}

type TIP_Item = [id: string, args: Record<string, any> | undefined, workerpool.Promise<unknown>] 

// (FIX) REMEMBER BECAUSE SCRAPES ARE RUNNING IN PARALLEL, SOME DB RESOURCES NEED TO BE SAVED BEFORE USE
// E.G WHEN SELECTING USE ACCOUNT OR PROXY TO SCRAPE WITH
export const TaskQueue = (io: Socket) => {
  const _Qlock = mutex();
  const _Plock = mutex();
  let maxWorkers: number;
  const queue: QueueItem[] = [];
  const TIP: TIP_Item[] = []
  let pool: Pool;

  const enqueue = (item: QueueItem) => { 
    _Qlock((r) => {
      queue.push(item)
      r()
    })
    exec()
  }

  const dequeue = () => { 
    let val: QueueItem | undefined;
    _Qlock((r) => {
      val = queue.shift()
      r()
    })
    exec()
    return val
  }
  const remove = (id: string) => {
    const taskIdx = queue.findIndex(task => task.id === id);
    if (taskIdx === -1) return;
    exec()
    return queue.splice(taskIdx, 0)
  }

  const _TIP_Enqueue = (item: TIP_Item) => { 
    _Plock((r) => {
      TIP.push(item)
      r()
    })
    exec()
  }
  const _TIP_Dequeue = (id: string) => { 
    _Plock((r) => {
      const taskIdx = TIP.findIndex(task => task[0] === id);
      if (taskIdx > -1) return;
      TIP.splice(taskIdx, 0)
      r()
    })
    exec()
  }

  const stop = (id: string) => {
    _Plock(async (r) => {
      const process = TIP.find(p => p[0] === id)
      if (!process) return;
      await process[2]
        .cancel()
        .then(() => {})
        .catch(() => {})
    })
    exec()
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
    const task = dequeue();
    if (!task) return;
    const tsk = pool.exec(task.action, [task.args])
      .then(() => {
        io.emit('task-complete', task.id)
        _TIP_Dequeue(task.id)
        exec()
      })
      .catch(() => {
        io.emit('task-failed', task.id)
        _TIP_Dequeue(task.id)
        exec()
      })

    _TIP_Enqueue([task.id, task.args, tsk])
    exec();
  }

  const init = () => {
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