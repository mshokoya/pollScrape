import { observable } from '@legendapp/state'
import { handleApolloProcessQueueEvents, handleApolloTaskQueueEvents } from './apollo'
import { TQTask, TaskQueue, TaskQueueEvent } from 'src/shared'
import { TaskQueueHelper } from '../util'

export const taskQueue = observable<TaskQueue>({
  queue: [],
  processing: [],
  timeout: []
})

const taskQueueHelper = TaskQueueHelper<TQTask>(taskQueue)

export const handleTaskQueueEvent = (res: TaskQueueEvent<any>) => {
  switch (res.taskType) {
    case 'enqueue':
      taskQueueHelper.addToQueue('queue', {
        taskID: res.taskID,
        taskGroup: res.metadata.taskGroup,
        processes: []
      })
      break

    case 'dequeue':
      taskQueueHelper.delete(res.taskID)
      break
  }

  if (!res.fork) {
    switch (res.metadata.taskGroup) {
      case 'apollo':
        handleApolloTaskQueueEvents(res as TaskQueueEvent<{ accountID: string; taskType: string }>)
        break
    }
  }
}

export function handleProcessQueueEvent(res: TaskQueueEvent<any>) {
  switch (res.taskType) {
    case 'enqueue':
      taskQueueHelper.addToQueue('processing', {
        taskID: res.taskID,
        taskGroup: res.metadata.taskGroup,
        processes: []
      })
      break

    case 'dequeue':
      taskQueueHelper.delete(res.taskID)
      break
  }

  if (!res.fork) {
    switch (res.metadata.taskGroup) {
      case 'apollo':
        handleApolloProcessQueueEvents(
          res as TaskQueueEvent<{ accountID: string; taskType: string }>
        )
        break
    }
  }
}
