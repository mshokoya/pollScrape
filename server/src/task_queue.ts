import workerpool from 'workerpool';

type QueueItem<T = unknown> = {
  id: string, 
  action: (a:T) => any,
  args: T
}

export const TaskQueue = () => {
  let maxWorkers: number;
  const queue: QueueItem[] = [];
  const TIP: [string, any][] = []
  const pool = workerpool.pool();
  

  const enqueue = (item: QueueItem) => { queue.push(item) }

  const remove = (id: string) => {
    const taskIdx = queue.findIndex(task => task.id === id);
    if (taskIdx === -1) return;
    return queue.splice(taskIdx, 0)
  }

  const stop = () => {}

  const dequeue = () => { return queue.shift() }
  const setMaxWorkers = (n: number) => { maxWorkers = n}

  const exec = () => {
    const task = dequeue()
    if (!task) return;
    
    TIP.push([task.id, task.args])
    
    pool.exec(task.action, [task.args])
  }

  const init = () => {}

  return {
    enqueue,
    remove,
    stop
  }
}