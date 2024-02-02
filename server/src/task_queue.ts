import { Socket } from 'socket.io';
import workerpool from 'workerpool';
import mutex from 'mutexify';

type QueueItem<T = unknown> = {
  id: string, 
  action: (a:T) => any,
  args: T
}

type TIP_Item = [string, {}] 

// (FIX) REMEMBER BECAUSE SCRAPES ARE RUNNING IN PARALLEL, SOME DB RESOURCES NEED TO BE SAVED BEFORE USE
// E.G WHEN SELECTING USE ACCOUNT OR PROXY TO SCRAPE WITH
export const TaskQueue = (io: Socket) => {
  const _Qlock = mutex();
  const _Plock = mutex();
  let maxWorkers: number;
  const queue: QueueItem[] = [];
  const TIP: [string, any][] = []
  const pool = workerpool.pool();
  

  const enqueue = (item: QueueItem) => { 
    _Qlock((r) => {
      queue.push(item)
      r()
    })
  }

  const dequeue = () => { 
    _Qlock((r) => {
      queue.shift()
      r()
    })
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



  const stop = () => {}

  

  const setMaxWorkers = (n: number) => { maxWorkers = n}

  const exec = () => {
    const task = dequeue();
    if (!task) return;
    TIP.push([task.id, task.args])
    pool.exec(task.action, [task.args])
      .then(() => {
        io.emit('task-complete', task.id)
        TIP.
      })
  }

  const init = () => {
  }

  return {
    enqueue,
    remove,
    stop
  }
}