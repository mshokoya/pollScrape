import { Socket } from 'socket.io';
import workerpool from 'workerpool';
import mutex from 'mutexify';

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
  const pool = workerpool.pool();
  

  const enqueue = (item: QueueItem) => { 
    _Qlock((r) => {
      queue.push(item)
      r()
    })
  }

  const dequeue = () => { 
    let val: QueueItem | undefined;
    _Qlock((r) => {
      val = queue.shift()
      r()
    })

    return val ? val : undefined
  }
  const remove = (id: string) => {
    const taskIdx = queue.findIndex(task => task.id === id);
    if (taskIdx === -1) return;
    return queue.splice(taskIdx, 0)
  }

  const _TIP_Enqueue = (item: TIP_Item) => { 
    _Plock((r) => {
      TIP.push(item)
      r()
    })
    
  }
  const _TIP_Dequeue = (id: string) => { 
    _Plock((r) => {
      const taskIdx = TIP.findIndex(task => task[0] === id);
      if (taskIdx > -1) return;
      TIP.splice(taskIdx, 0)
      r()
    })
  }

  const stop = () => {
    pool.
  }

  const setMaxWorkers = (n: number) => {maxWorkers = n}

  const exec = () => {
    const task = dequeue();
    if (!task) return;
    const tsk = pool.exec(task.action, [task.args])
      .then(() => {
        io.emit('task-complete', task.id)
        _TIP_Dequeue(task.id)
      })
      .catch(() => {
        io.emit('task-failed', task.id)
        _TIP_Dequeue(task.id)
      })

    _TIP_Enqueue([task.id, task.args, tsk])
  }

  return {
    enqueue,
    remove,
    stop
  }
}