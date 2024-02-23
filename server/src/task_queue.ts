import { Server as IO, Socket } from 'socket.io';
// import workerpool, { Pool } from 'workerpool';
import {cpus} from 'os';
import { Mutex } from 'async-mutex'
import AbortablePromise from "promise-abortable";
import { generateID } from './helpers';
import { io } from './websockets';



type QueueItem = {
  id: string,
  taskGroup: string,
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
    taskGroup: string,
    taskType: string,
    desc: string,
    metadata: {},
    action: (a: T) => Promise<void>,
    args?: T
  ) => {
    return _Qlock.runExclusive(() => {
      // @ts-ignore
      queue.push({id, action, args, taskGroup, taskType, desc, metadata})
    }).then(() => {
      io.emit('taskQueue', {desc: 'new task added to queue', taskType: 'append',  metadata: {taskID: id, taskGroup, taskType, metadata}})
    }).finally(() => { exec() })
  }

  const dequeue = async () => {
    return _Qlock.runExclusive(() => {
      return queue.shift();
    }).then((t) => {
      if (!t) return
      io.emit('taskQueue', {desc: 'moving from queue to processing', taskType: 'switch',  metadata: {taskID: t.id, taskGroup: t.taskGroup, taskType: t.taskType, metadata: t.metadata}})
      return t
    })
  }

  const remove = async (id: string) => {
    return _Qlock.runExclusive(() => {
      queue = queue.filter(task => task.id !== id);
    }).then(() => {
      io.emit('taskQueue', {desc: 'deleting task from queue', taskType: 'remove',  metadata: {taskID: id}})
    })
  }

  const _TIP_Enqueue = async (item: TIP_Item) => { 
    return _Plock.runExclusive(() => {
      TIP.push(item)
    }).then(() => {
      io.emit('processQueue', {desc: 'new task added to processing queue', taskType: 'append',  metadata: {taskID: item[0]}})
    }).finally(() => { exec() })
  }

  const _TIP_Dequeue = async (id: string) => { 
    return _Plock.runExclusive(() => {
      TIP = TIP.filter(task => task[0] !== id);
    }).then(() => {
      io.emit('processQueue', {desc: 'removed completed task from queue', taskType: 'remove',  metadata: {taskID: id}})
    })
  }

  const stop = async(id: string) => {
    return _Plock.runExclusive(async () => {
      const process = TIP.find(p => p[0] === id)
      if (!process) return null;
      return await process[2].abort()
    }).then(() => {
      io.emit('taskQueue', {desc: 'cancelled', taskType: 'stop',  metadata: {taskID: id}})
    })
    .finally(() => {
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
      io.emit('processQueue', {desc: `starting ${task.id} processing`, taskType: 'start',  metadata: {taskID: task.id}})

      const taskIOArgs = {
        taskGroup: task.taskGroup, 
        taskID: task.id, 
        metadata: task.metadata
      }

      const tsk = new AbortablePromise((resolve, reject, signal) => {
        signal.onabort = reject;
        task.action()
          .then((r) => { resolve(r) })
          .catch((err) => { reject(err) })
      })
        .then(async (r) => {
          io.emit(task.taskGroup, {...taskIOArgs, ok: true, metadata: r})
        })
        .catch(async (err) => {
          io.emit(task.taskGroup,  {...taskIOArgs, desc: err.message, ok: true})
        })
        .finally(() => {
          _TIP_Dequeue(task.id)
          exec()
        }) as AbortablePromise<unknown>

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

export const initTaskQueue = () => {
  taskQueue = TaskQueue()
  taskQueue.init()
  return taskQueue
}