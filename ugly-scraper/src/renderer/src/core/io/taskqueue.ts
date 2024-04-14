import { observable } from '@legendapp/state'
import { handleApolloTaskQueueEvents } from './apollo'
import { TaskQueue, TaskQueueEvent } from 'src/shared'
import { batch } from '@legendapp/state'
import { TaskQueueHelper } from '../util'

export const taskQueue = observable<TaskQueue>({
  queue: [],
  processing: [],
  timeout: []
})

const taskQueueHelper = TaskQueueHelper(taskQueue)

export const handleTaskQueueEvent = (res: TaskQueueEvent<unknown>) => {
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

  switch (res.metadata.taskGroup) {
    case 'apollo':
      handleApolloTaskQueueEvents(res as TaskQueueEvent<{ accountID: string }>)
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
}
