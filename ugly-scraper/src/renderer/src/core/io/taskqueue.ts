import { Observable, ObservableObject, observable } from '@legendapp/state'
import { handleApolloTaskQueueEvents } from './apollo'
import { TQTask, TaskQueueEvent } from 'src/shared'
import { batch } from '@legendapp/state'

type TaskQueue = {
  queue: TQTask[]
  processing: TQTask[]
  timeout: TQTask[]
}

export const taskQueue = observable<TaskQueue>({
  queue: [],
  processing: [],
  timeout: []
})

export const TaskQueueHelper = (tq: ObservableObject<TaskQueue>) => ({
  add: (t: Omit<TQTask, 'processes'>) => {
    tq.queue.push({ ...t, processes: [] })
  },
  move: (taskID: string, from: keyof typeof tq, to: keyof typeof tq) => {
    batch(() => {
      // @ts-ignore
      const task = tq[from].find((t) => t.taskID.peek() === taskID)
      if (!task) return
      // @ts-ignore
      tq[to].push(task.peek())
      task.delete()
    })
  },
  delete: (taskID: string) => {
    console.log('inn da delete of TaskQueueHelper')
    // @ts-ignore
    console.log(this.findTask)
    // @ts-ignore
    this.findTask(taskID)?.delete()
  },
  findTask: (taskID: string): Observable<TQTask> | void => {
    for (const queues in Object.keys(tq)) {
      const t = tq[queues].find((t1) => t1.taskID.peek() === taskID)
      if (t) {
        return t.get()
      }
    }
  },
  findTaskViaProcessID: (taskID: string): Observable<TQTask> | void => {
    for (const queues in Object.keys(tq)) {
      for (const task of tq[queues]) {
        if (task.processes.peek().includes(taskID)) {
          return task
        }
      }
    }

    // for (const queues in Object.keys(tq)) {
    //   for (const task of tq[queues] ) {
    //     if (task.processes.peek().includes(taskID)) {
    //       task.processes.set(t => t.filter(t0 => t0 !== taskID))
    //       return
    //     }
    //   }
    // }
  },
  addProcess: (taskID: string, PtaskID: string) => {
    console.log('inn da addProcess of TaskQueueHelper')
    // @ts-ignore
    console.log(this.findTask)
    // @ts-ignore
    this.findTask(taskID)?.processes.push(PtaskID)
  },
  deleteProcess: (taskID: string) => {
    console.log('inn da addProcess of TaskQueueHelper')
    // @ts-ignore
    this.findTaskViaProcessID(taskID)?.set((t) => t.filter((t0) => t0 !== taskID))
  }
})

const taskQueueHelper = TaskQueueHelper(taskQueue)

export function handleTaskQueueEvent(res: TaskQueueEvent<any>) {
  switch (res.taskType) {
    case 'enqueue':
      taskQueueHelper.add({
        taskID: res.taskID,
        taskGroup: res.metadata.taskGroup
      })
      break

    case 'end':
    case 'dequeue':
      taskQueueHelper.delete(res.taskID)
      break
  }
}

export function handleApolloProcessQueueEvents(res: TaskQueueEvent<{ accountID: string }>) {
  switch (res.taskType) {
    case 'enqueue':
      batch(() => {
        const tsk = taskQueue.queue.peek().find((t) => t.metadata.taskID === res.metadata.taskID)
        if (!tsk) return
        taskQueue.queue.set((q) => q.filter((q) => q.metadata.taskID !== tsk.metadata.taskID))
        tsk.status = 'processing'
        taskQueue.processing.push(tsk)
        accountTaskHelper.updateTask(tsk.metadata.metadata.accountID, tsk.metadata.taskID, {
          status: 'processing'
        })
      })
      break
    case 'dequeue':
      batch(() => {
        console.log('process dequeue')
        const tsk = taskQueue.processing.find(
          (t) => t.metadata.taskID.get() === res.metadata.taskID
        )
        if (!tsk) return
        const t2 = tsk.peek()
        accountTaskHelper.deleteTaskByTaskID(t2.metadata.metadata.accountID, t2.metadata.taskID)
        tsk.delete()
      })
      break
  }

  switch (res.metadata.taskGroup) {
    case 'apollo':
      handleApolloTaskQueueEvents(res)
      break
  }
}
